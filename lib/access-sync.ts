/**
 * Synchronisation des codes de la serrure Nuki avec les réservations Beds24.
 *
 * Remplace le connecteur payant Beds24 → Nuki (qui ne poussait plus rien depuis mai 2026).
 * Le **quoi faire** vient du socle (`planAccessCodes`, pur et vérifié) ; ce module ne fait
 * que lire, exécuter dans l'ordre rendu et prévenir. Appelé par le cron horaire
 * (`/api/cron/nuki-sync`) et par le webhook Beds24 (`/api/webhooks/beds24`), qui le
 * déclenche dès qu'une réservation arrive, change ou s'annule.
 *
 * Règles de l'exploitant (2026-11-07) : code valable de 14 h le jour d'arrivée à 14 h le jour
 * du départ ; nom `<n° de réservation>: <Prénom>` ; codes `#…` jamais touchés ; seules les
 * réservations `confirmed` et `new` reçoivent un code (une `new` passe ensuite en
 * `confirmed`, une fois son code posé) ; le PIN est tiré du téléphone du
 * voyageur quand c'est possible, et **écrit dans Beds24 avant d'être posé sur la serrure**.
 *
 * **Deux modes.** `NUKI_SYNC_MODE=live` écrit ; toute autre valeur calcule le plan sans rien
 * écrire, mais **alerte** quand même au passage du cron (serrure hors ligne, PIN manquant…) :
 * une synchro laissée à blanc ne doit pas rendre une panne muette (2026-11-16). `?dry=1` ne
 * fait ni l'un ni l'autre.
 *
 * **Code communiqué sans ouvrir.** Le PIN est écrit dans Beds24 **avant** la pose sur la
 * serrure (un code qui ouvre sans que le voyageur l'ait reçu est le pire) ; une auto-action
 * Beds24 peut donc l'envoyer alors que la pose échoue. Pour une arrivée aujourd'hui ou demain,
 * ou pour un séjour en cours, cet échec alerte **dès le premier passage**, en priorité 5 (4 la
 * nuit, de 22 h à 8 h, pour une arrivée demain), quel que soit le déclencheur
 * (`barbusse:alert:nuki-codes-urgent`) ; au-delà, règle commune des deux passages.
 *
 * **Un passage à la fois.** Le webhook et le cron peuvent tomber ensemble : deux passages
 * concurrents verraient le même séjour sans PIN et en tireraient chacun un. Un verrou Redis
 * les sérialise.
 *
 * ⚠️ Le dépôt est public : **aucun PIN** dans un log, une réponse ou une notification. Le
 * rapport rendu par `runAccessSync` n'en contient pas.
 */

import { randomInt, randomUUID } from "node:crypto";
import { getRedis } from "./redis";
import {
  accessWindow,
  keypadArrivals,
  planAccessCodes,
  type AccessAction,
  type AccessAlert,
  type AccessCodePolicy,
  type AccessSeverity,
  type AccessStay,
} from "@sejour/socle/lib/access-codes";
import {
  createKeypadCode,
  deleteAuth,
  getLockHealth,
  listAuths,
  listLogSince,
  updateKeypadCode,
  type NukiConfig,
  type NukiLockHealth,
} from "@sejour/socle/lib/nuki";
import { addDays } from "@sejour/socle/lib/dates";
import { sendNtfy } from "./ntfy";
import { reportAlerts, type TrackedAlert } from "./alert-memory";
import { currentHourParis, todayParis } from "@sejour/socle/lib/time";
import { addNukiPin, confirmBooking, getBookingById, getBookings, nukiCodeOf } from "./beds24";
import type { Beds24Booking } from "./types";
import { accessHours, agreedConflicts, boundRotationWindows, readStayHours, type StayHoursTable } from "./stay-hours";

/** Les alertes du planificateur, plus celles de la serrure et de l'exécution. */
export type SyncAlert = Omit<AccessAlert, "kind"> & {
  kind: AccessAlert["kind"] | "lock" | "execution";
  /** Ce qui a échoué (`create`, `confirm`…) pour une alerte d'exécution : fait partie de l'identifiant. */
  step?: string;
  /**
   * Pose ratée d'un code dont le PIN est déjà dans Beds24, pour une arrivée aujourd'hui ou demain :
   * le voyageur a pu recevoir un code qui n'ouvre pas. Alerte immédiate, hors règle des deux passages.
   */
  urgent?: boolean;
  /** Alerte urgente d'une arrivée **demain** : priorité 4 la nuit (22 h – 8 h), 5 sinon. */
  arrivesTomorrow?: boolean;
};

/**
 * Qui a lancé le passage. Seul le passage horaire du cron évalue et envoie les alertes : le
 * webhook Beds24 se déclenche aussi sur nos propres écritures (`NUKI_PIN`, `MSG_*`), et une
 * serrure vue hors ligne entre deux passages horaires suffisait à envoyer une priorité 5.
 */
export type SyncTrigger = "cron" | "webhook";

export const ACCESS_POLICY: AccessCodePolicy = {
  validFromHour: 14,
  validUntilHour: 14,
  missingPinAlertDays: 3,
  highSeverityDays: 2,
  urgentSeverityDays: 0,
};

/** La maison entière : la seule propriété dont les voyageurs passent par cette porte. */
const HOUSE_PROPERTY_ID = 303771;

/** Tous les statuts : sans liste, Beds24 omet les annulées, dont on doit retirer le code. */
const ALL_STATUSES = ["confirmed", "new", "request", "inquiry", "black", "cancelled"];

const redis = getRedis;

export function nukiConfig(): NukiConfig {
  const token = process.env.NUKI_API_TOKEN?.trim();
  const smartlockId = process.env.NUKI_SMARTLOCK_ID?.trim();
  if (!token || !smartlockId) throw new Error("NUKI_API_TOKEN ou NUKI_SMARTLOCK_ID manquant");
  return { token, smartlockId };
}

export function syncIsLive(): boolean {
  return process.env.NUKI_SYNC_MODE === "live";
}

/**
 * Un séjour de la synchronisation, avec sa fenêtre propre quand un horaire a été convenu
 * (`lib/stay-hours.ts` : de min(14 h, A − 1 h) à max(14 h, D + 1 h)). `validFromHour` /
 * `validUntilHour` (socle v3.26.0) priment sur `ACCESS_POLICY` dans `accessWindow` : la synchro
 * recale d'elle-même un code déjà posé (motif `window`). Exporté pour les tests.
 */
export function toStay(b: Beds24Booking, table: StayHoursTable): AccessStay {
  const status =
    b.status === "cancelled"
      ? "cancelled"
      : b.status === "confirmed" || b.status === "new"
        ? "confirmed"
        : "provisional";
  return {
    bookingId: b.id,
    firstName: b.firstName ?? "",
    arrival: b.arrival,
    departure: b.departure,
    status,
    pin: nukiCodeOf(b),
    phone: b.mobile || b.phone || null,
    ...accessHours(table[b.id] ?? {}, ACCESS_POLICY),
  };
}

/** Une action sans son PIN : ce que le rapport et les journaux ont le droit de montrer. */
function describe(action: AccessAction): Record<string, unknown> {
  switch (action.kind) {
    case "assign-pin":
      return { kind: action.kind, bookingId: action.bookingId, source: action.source };
    case "create":
      return { kind: action.kind, bookingId: action.bookingId, name: action.name, from: action.allowedFromDate, until: action.allowedUntilDate };
    case "update":
      return { kind: action.kind, bookingId: action.bookingId, name: action.name, reasons: action.reasons, from: action.allowedFromDate, until: action.allowedUntilDate };
    case "delete":
      return { kind: action.kind, bookingId: action.bookingId, name: action.name, reason: action.reason };
  }
}

export interface SyncReport {
  mode: "live" | "dry";
  health: NukiLockHealth;
  stays: number;
  actions: Array<Record<string, unknown> & { ok?: boolean; error?: string }>;
  alerts: SyncAlert[];
  notified: number;
  skipped?: string;
}

const LOCK_KEY = "nuki:sync:lock";

/** Rend le verrou seulement s'il porte encore notre valeur (atomique côté Redis). */
const RELEASE_IF_OWNER = 'if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end';

/**
 * Prend le verrou avec une valeur propre à ce passage, ou `null`. Le webhook peut attendre un
 * passage en cours : c'est lui qui pose le code d'une réservation de dernière minute. 10 essais
 * espacés de 2 s couvrent un passage normal.
 */
async function acquireLock(): Promise<string | null> {
  const owner = randomUUID();
  for (let i = 0; i < 10; i++) {
    if (await redis().set(LOCK_KEY, owner, { nx: true, ex: 120 })) return owner;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

/**
 * Libération **conditionnelle** : un passage plus long que l'expiration (120 s) ne doit pas
 * effacer le verrou qu'un autre passage a pris entre-temps — deux passages tireraient alors
 * chacun un PIN pour le même séjour.
 */
async function releaseLock(owner: string): Promise<void> {
  try {
    await redis().eval(RELEASE_IF_OWNER, [LOCK_KEY], [owner]);
    return;
  } catch (e) {
    // Script refusé ou indisponible : repli non atomique plutôt que de laisser le verrou 120 s
    // (le webhook d'une réservation de dernière minute attendrait ou renoncerait).
    console.error("[access-sync] libération du verrou par script impossible :", e instanceof Error ? e.message : e);
  }
  if ((await redis().get(LOCK_KEY)) === owner) await redis().del(LOCK_KEY);
}

/** Lit Beds24 et la serrure, et calcule le plan. Commun à la synchronisation et à l'état. */
async function loadState(cfg: NukiConfig) {
  const today = todayParis();
  const [health, auths, bookings, stayHours] = await Promise.all([
    getLockHealth(cfg),
    listAuths(cfg),
    getBookings({ departureFrom: addDays(today, -1), statuses: ALL_STATUSES, includeInfoItems: true, fresh: true }),
    // Horaires convenus : ne lève jamais (Redis injoignable ⇒ fenêtre standard).
    readStayHours(),
  ]);
  const house = bookings.filter((b) => b.propertyId === HOUSE_PROPERTY_ID);

  // Un code géré dont la réservation n'est pas dans la fenêtre lue (départ ancien, ou
  // réservation déplacée) : on va la chercher, plutôt que de la déclarer orpheline.
  const known = new Set(house.map((b) => b.id));
  const missing = auths
    .map((a) => /^(\d{6,}):/.exec(a.name)?.[1])
    .filter((id): id is string => Boolean(id))
    .map(Number)
    .filter((id) => !known.has(id));
  for (const id of new Set(missing)) {
    const b = await getBookingById(id, { fresh: true });
    if (b && b.propertyId === HOUSE_PROPERTY_ID) house.push(b);
  }

  // Jour de rotation : le code des partants (départ convenu) n'ouvre pas au-delà de l'ouverture
  // du code des arrivants (`boundRotationWindows`).
  const stays = boundRotationWindows(house.map((b) => toStay(b, stayHours)), ACCESS_POLICY);
  const plan = planAccessCodes({ stays, auths, today, now: new Date(), policy: ACCESS_POLICY, random: randomInt });
  // Accords saisis que la situation contredit désormais (réservation arrivée après coup).
  const conflicts = agreedConflicts(stayHours, house);
  return { today, health, auths, house, stays, plan, conflicts };
}

export async function runAccessSync({ dryRun, trigger }: { dryRun: boolean; trigger: SyncTrigger }): Promise<SyncReport> {
  const mode = dryRun || !syncIsLive() ? "dry" : "live";
  const cfg = nukiConfig();
  // Alertes évaluées : au passage du cron, réel (pas `?dry=1`), quel que soit `NUKI_SYNC_MODE`.
  const evaluate = trigger === "cron" && !dryRun;

  const owner = mode === "live" ? await acquireLock() : null;
  if (mode === "live" && owner === null) {
    return { mode, health: { online: false, keypadPaired: false, batteryCritical: false, keypadBatteryCritical: false, batteryChargePercent: null, lockState: null, motorBlocked: false }, stays: 0, actions: [], alerts: [], notified: 0, skipped: "un autre passage est en cours" };
  }
  try {
    const { today, health, house, stays, plan, conflicts } = await loadState(cfg);
    if (evaluate) await reportStayHoursConflicts(conflicts);
    const alerts: SyncAlert[] = [...plan.alerts];

    // La pile faible n'est plus signalée ici : le passage de 9 h de la préparation d'arrivée
    // (`/api/cron/arrival-readiness`) la signale déjà, une fois par jour (2026-11-10).
    if (!health.online || !health.keypadPaired) {
      alerts.push({
        kind: "lock",
        bookingId: 0,
        // Priorité 4 et non plus 5 : le jour d'une arrivée, la préparation d'arrivée relève la
        // serrure à 12h30, 15h30 et 16h30 avec ses propres priorités (jusqu'à 5).
        severity: "high",
        message: !health.online
          ? "La serrure est hors ligne pour Nuki : aucun code ne peut lui être envoyé."
          : "Aucun clavier n'est appairé à la serrure : les codes ne servent à rien.",
      });
    }
    const actions: SyncReport["actions"] = plan.actions.map(describe);

    // « new » → « confirmed », une fois le PIN dans Beds24 et le code sur la serrure : soit
    // déjà le cas, soit fait par ce passage sans échec pour cette réservation.
    const pinned = new Set(stays.filter((s) => s.pin).map((s) => s.bookingId));
    for (const a of plan.actions) if (a.kind === "assign-pin") pinned.add(a.bookingId);
    const toConfirm = house.filter((b) => b.status === "new" && pinned.has(b.id)).map((b) => b.id);

    if (mode === "dry") {
      for (const id of toConfirm) actions.push({ kind: "confirm", bookingId: id });
      // Rien n'est écrit, mais une serrure hors ligne ou un PIN manquant se disent quand même :
      // une synchro restée à blanc ne doit pas taire une panne (`?dry=1` excepté).
      const notified = evaluate ? await notify(alerts) : 0;
      return { mode, health, stays: stays.length, actions, alerts, notified };
    }

    const stayOf = new Map(house.map((b) => [b.id, { arrival: b.arrival, departure: b.departure }]));
    const tomorrow = addDays(today, 1);

    // Exécution, dans l'ordre du plan. Une attribution de PIN ratée bloque la pose du code
    // de cette réservation : un code qui ouvre sans que le voyageur l'ait reçu est le pire.
    const blocked = new Set<number>();
    for (const [i, action] of plan.actions.entries()) {
      if ((action.kind === "create" || action.kind === "update") && blocked.has(action.bookingId)) {
        actions[i] = { ...actions[i], ok: false, error: "PIN non écrit dans Beds24" };
        continue;
      }
      try {
        await execute(cfg, action);
        actions[i] = { ...actions[i], ok: true };
      } catch (err) {
        // Les erreurs Nuki sont expurgées dans le socle ; celles de `addNukiPin` ne portent
        // que le statut HTTP.
        const error = err instanceof Error ? err.message : String(err);
        actions[i] = { ...actions[i], ok: false, error };
        if (action.kind === "assign-pin") blocked.add(action.bookingId);
        // Le PIN est déjà dans Beds24 (écrit avant, ou par ce passage) : une auto-action a pu
        // l'envoyer. Arrivée demain au plus tard et séjour pas encore fini → on ne peut pas attendre
        // le passage suivant. Le séjour reste urgent après minuit (pas de faux « rétabli » quand
        // l'arrivée devient « hier » alors que la pose échoue toujours).
        const stay = stayOf.get(action.bookingId);
        const urgent =
          (action.kind === "create" || action.kind === "update") &&
          stay !== undefined &&
          stay.arrival <= tomorrow &&
          stay.departure >= today;
        const when = !stay ? "" : stay.arrival === tomorrow ? "arrivée demain" : stay.arrival === today ? "arrivée aujourd'hui" : "séjour en cours";
        alerts.push({
          kind: "execution",
          step: action.kind,
          bookingId: action.bookingId,
          severity: urgent ? "urgent" : "high",
          ...(urgent ? { urgent: true, ...(stay!.arrival === tomorrow ? { arrivesTomorrow: true } : {}) } : {}),
          message: urgent
            ? `Réservation ${action.bookingId} (${when}) : le code est dans Beds24 — le message automatique a pu le donner — mais n'a pas pu être posé sur la serrure (« ${action.kind} » — ${error}). Le poser à la main ou prévenir le voyageur.`
            : `Réservation ${action.bookingId} : échec de « ${action.kind} » — ${error}`,
        });
      }
    }

    const failed = new Set(actions.filter((a) => a.ok === false).map((a) => a.bookingId as number));
    for (const id of toConfirm) {
      if (failed.has(id)) continue;
      try {
        await confirmBooking(id);
        actions.push({ kind: "confirm", bookingId: id, ok: true });
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        actions.push({ kind: "confirm", bookingId: id, ok: false, error });
        alerts.push({ kind: "execution", step: "confirm", bookingId: id, severity: "normal", message: `Réservation ${id} : passage en « confirmé » impossible — ${error}` });
      }
    }

    // Seul un vrai passage du cron fait avancer l'état d'alerte ordinaire ; l'alerte urgente
    // part aussi d'un passage lancé par le webhook (c'est souvent lui qui pose le code du jour).
    let notified = evaluate ? await notify(alerts) : 0;
    if (!evaluate && alerts.some((a) => a.urgent)) {
      // Passage du webhook : un envoi raté (ntfy en panne) ne doit pas faire échouer le passage —
      // le webhook sauterait la messagerie. L'état a déjà été remis par `reportAlerts` : l'alerte
      // repartira au passage suivant.
      try {
        notified += await notifyUrgent(alerts);
      } catch (e) {
        console.error("[access-sync] alerte urgente non envoyée :", e instanceof Error ? e.message : e);
      }
    }
    return { mode, health, stays: stays.length, actions, alerts, notified };
  } finally {
    if (owner !== null) await releaseLock(owner).catch(() => {});
  }
}

async function execute(cfg: NukiConfig, action: AccessAction): Promise<void> {
  switch (action.kind) {
    case "assign-pin":
      return addNukiPin(action.bookingId, action.pin);
    case "create":
      return createKeypadCode(
        cfg,
        { name: action.name, enabled: true, allowedFromDate: action.allowedFromDate, allowedUntilDate: action.allowedUntilDate },
        action.pin,
      );
    case "update":
      return updateKeypadCode(
        cfg,
        action.authId,
        { name: action.name, enabled: action.enabled, allowedFromDate: action.allowedFromDate, allowedUntilDate: action.allowedUntilDate },
        action.pin,
      );
    case "delete":
      return deleteAuth(cfg, action.authId);
  }
}

const NTFY_PRIORITY: Record<AccessSeverity, 3 | 4 | 5> = { normal: 3, high: 4, urgent: 5 };

/**
 * Horaire convenu contredit par une réservation arrivée depuis (un départ à 16 h, puis une
 * arrivée à 14 h le même jour) : `barbusse:alert:stay-hours-conflict`, priorité 3, règle commune
 * (deux passages horaires). Le code des partants est déjà borné (`boundRotationWindows`) ; reste à
 * revoir l'accord avec le voyageur. La popup le dit aussi. Un échec d'envoi ne casse pas la synchro.
 */
async function reportStayHoursConflicts(conflicts: ReadonlyArray<{ bookingId: number; message: string }>): Promise<void> {
  await reportAlerts(
    "stay-hours-conflict",
    conflicts.map((c) => ({ id: String(c.bookingId), priority: 3, line: `  - Réservation ${c.bookingId} : ${c.message}` })),
    sendLockAlert,
    {
      title: (c) => (c.length === 1 ? "Horaire convenu contredit par une réservation" : `${c.length} horaires convenus contredits`),
      intro: "Un accord saisi au dashboard n'est plus tenable (rotation le même jour) :",
      recoveredTitle: "Horaires convenus de nouveau cohérents",
      recoveredBody: "Plus aucun accord contredit par une réservation.",
      confirmAfter: 2,
    },
  ).catch((e) => console.error("[access-sync] alerte horaires convenus :", e instanceof Error ? e.message : e));
}

const sendLockAlert = (subject: string, body: string, priority: 1 | 2 | 3 | 4 | 5) =>
  sendNtfy(body, { title: subject, priority, tags: ["lock"] });

/**
 * Deux alertes suivies séparément (`barbusse:alert:nuki-lock`, `…:nuki-codes`), chacune selon
 * la règle commune de `lib/alert-memory.ts` : deux passages horaires de suite avant d'alerter,
 * pas de répétition à gravité égale, rétablissement en priorité 1. Séparées pour que le retour
 * de la serrure se dise même quand un code reste en défaut.
 *
 * Un PIN qui manque à J-3 puis à J-2 puis le jour même monte de gravité : l'alerte repart à
 * chaque palier, une fois.
 *
 * Troisième état, `…:nuki-codes-urgent` : la pose ratée d'un code déjà dans Beds24 pour une
 * arrivée aujourd'hui ou demain (`urgent`). Sans confirmation (`confirmAfter: 1`), jamais
 * répétée tant qu'elle dure, « code posé » en priorité 1. Elle sort de `nuki-codes` pour ne pas
 * repartir une seconde fois au passage suivant.
 */
export function trackSyncAlerts(alerts: readonly SyncAlert[]): {
  lock: TrackedAlert[];
  codes: TrackedAlert[];
  urgent: TrackedAlert[];
} {
  const tracked = (a: SyncAlert): TrackedAlert => ({
    // Stable d'un passage à l'autre : jamais le message (qui porte une erreur, un nombre de jours).
    id: [a.kind, a.bookingId, a.step].filter((x) => x !== undefined).join(":"),
    priority: NTFY_PRIORITY[a.severity],
    line: a.message,
  });
  return {
    lock: alerts.filter((a) => a.kind === "lock").map(tracked),
    codes: alerts.filter((a) => a.kind !== "lock" && !a.urgent).map(tracked),
    urgent: alerts.filter((a) => a.urgent).map(tracked),
  };
}

/** La nuit, au sens de la règle de l'hôte : 22 h – 8 h, heure de Paris. */
export function isNightParis(hour: number = currentHourParis()): boolean {
  return hour >= 22 || hour < 8;
}

/**
 * Options de `nuki-codes-urgent`. La gravité stockée reste 5 pour tout constat urgent (pas
 * d'escalade à minuit quand une arrivée « demain » devient « aujourd'hui ») ; seule la priorité
 * d'**envoi** descend à 4 la nuit quand tous les constats confirmés sont des arrivées de demain.
 */
function urgentOptions(alerts: readonly SyncAlert[]) {
  const tomorrowIds = new Set(
    alerts.filter((a) => a.urgent && a.arrivesTomorrow).map((a) => [a.kind, a.bookingId, a.step].filter((x) => x !== undefined).join(":")),
  );
  return {
    title: (c: TrackedAlert[]) =>
      c.length === 1
        ? "Serrure Barbusse — code peut-être envoyé, mais absent du clavier"
        : `Serrure Barbusse — ${c.length} codes peut-être envoyés, mais absents du clavier`,
    recoveredTitle: "Serrure Barbusse — codes du jour posés",
    recoveredBody: "Les codes des séjours d'aujourd'hui et de demain sont sur la serrure.",
    confirmAfter: 1,
    priority: (c: TrackedAlert[]): 4 | 5 => (isNightParis() && c.every((a) => tomorrowIds.has(a.id)) ? 4 : 5),
  };
}

const isActed = (a: string) => a === "open" || a === "escalate" || a === "recover";

/** L'alerte urgente seule — pour un passage lancé par le webhook, qui n'évalue rien d'autre. */
async function notifyUrgent(alerts: SyncAlert[]): Promise<number> {
  const { urgent } = trackSyncAlerts(alerts);
  return isActed(await reportAlerts("nuki-codes-urgent", urgent, sendLockAlert, urgentOptions(alerts))) ? 1 : 0;
}

async function notify(alerts: SyncAlert[]): Promise<number> {
  if (alerts.length > 0 && !process.env.NTFY_TOPIC) {
    throw new Error("NTFY_TOPIC manquant : les alertes de serrure seraient perdues");
  }
  const { lock, codes, urgent } = trackSyncAlerts(alerts);
  const [lockAction, codesAction, urgentAction] = await Promise.all([
    reportAlerts("nuki-codes-urgent", urgent, sendLockAlert, urgentOptions(alerts)),
    reportAlerts("nuki-lock", lock, sendLockAlert, {
      title: () => "Serrure Barbusse",
      recoveredTitle: "Serrure Barbusse — de nouveau en ligne",
      recoveredBody: "La serrure répond de nouveau à Nuki.",
    }),
    reportAlerts("nuki-codes", codes, sendLockAlert, {
      title: (c) => `Serrure Barbusse — ${c.length} code(s) en défaut`,
      recoveredTitle: "Serrure Barbusse — codes en ordre",
      recoveredBody: "Plus aucun défaut sur les codes du clavier.",
    }),
  ]);
  return [lockAction, codesAction, urgentAction].filter(isActed).length;
}

/**
 * Première ouverture au clavier par réservation, lue dans le journal de la serrure **depuis
 * `since`**, toutes pages (`listLogSince`, borne : `lib/nuki-log-cursor.ts`). Lève si le journal
 * ne peut pas être lu en entier : jamais un journal tronqué.
 */
export async function readKeypadArrivals(since: Date): Promise<Map<number, string>> {
  return keypadArrivals(await listLogSince(nukiConfig(), since));
}

/**
 * Le code de cette réservation est-il bien sur la serrure, avec ce PIN ? Utilisé par le
 * bouton « Arrivée + code » avant d'envoyer le message : on n'envoie pas un code qui
 * n'ouvre pas.
 */
export async function isPinOnLock(bookingId: number, pin: string): Promise<boolean> {
  const auths = await listAuths(nukiConfig());
  return auths.some((a) => a.type === 13 && a.name.startsWith(`${bookingId}:`) && String(a.code) === pin);
}

/** État du code d'une réservation sur la serrure, pour la pastille du calendrier (admin). */
export type LockCodeState = "ok" | "pending" | "error";

export interface LockStatus {
  health: NukiLockHealth;
  /** Par réservation confirmée à venir ou en cours. Jamais de PIN. */
  bookings: Record<number, { state: LockCodeState; detail: string }>;
}

/**
 * Ce que la synchronisation ferait maintenant, traduit en état par réservation — sans rien
 * écrire. `ok` : le code est sur la serrure et rien n'est à reprendre ; `pending` : le
 * prochain passage a quelque chose à faire (PIN à écrire, code à poser ou à recaler) ;
 * `error` : une alerte bloque (conflit de PIN, PIN refusé, code désactivé, PIN manquant).
 */
export async function lockStatus(): Promise<LockStatus> {
  const { health, stays, plan } = await loadState(nukiConfig());
  const bookings: LockStatus["bookings"] = {};
  for (const stay of stays) {
    if (stay.status !== "confirmed") continue;
    const alert = plan.alerts.find((a) => a.bookingId === stay.bookingId);
    const todo = plan.actions.filter((a) => a.bookingId === stay.bookingId && a.kind !== "delete");
    if (alert) {
      bookings[stay.bookingId] = { state: "error", detail: alert.message };
    } else if (todo.length > 0) {
      bookings[stay.bookingId] = {
        state: "pending",
        detail: `En attente du prochain passage : ${todo.map((a) => ACTION_LABEL[a.kind]).join(", ")}.`,
      };
    } else {
      bookings[stay.bookingId] = { state: "ok", detail: `Code posé sur la serrure, ${windowLabel(stay)}.` };
    }
  }
  if (!health.online || !health.keypadPaired) {
    for (const id of Object.keys(bookings)) {
      bookings[Number(id)] = {
        state: "error",
        detail: !health.online ? "Serrure hors ligne pour Nuki." : "Aucun clavier appairé.",
      };
    }
  }
  return { health, bookings };
}

/**
 * « 14 h → 14 h », ou « 13 h → 17 h » pour un séjour à horaires convenus — lu dans la fenêtre que
 * **le socle** calcule (`accessWindow`), jamais déduit des horaires : la pastille dit donc
 * toujours ce que la synchro pose.
 */
function windowLabel(stay: AccessStay): string {
  const w = accessWindow(stay, ACCESS_POLICY);
  const hourOf = (iso: string) =>
    Number(new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }));
  return `${hourOf(w.allowedFromDate)} h → ${hourOf(w.allowedUntilDate)} h`;
}

const ACTION_LABEL: Record<AccessAction["kind"], string> = {
  "assign-pin": "PIN à écrire dans Beds24",
  create: "code à poser",
  update: "code à recaler",
  delete: "code à retirer",
};
