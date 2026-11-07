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
 * **Deux modes.** `NUKI_SYNC_MODE=live` écrit ; toute autre valeur (ou `?dry=1`) calcule le
 * plan et le rend sans rien écrire ni notifier. Le premier déploiement se fait à blanc.
 *
 * **Un passage à la fois.** Le webhook et le cron peuvent tomber ensemble : deux passages
 * concurrents verraient le même séjour sans PIN et en tireraient chacun un. Un verrou Redis
 * les sérialise.
 *
 * ⚠️ Le dépôt est public : **aucun PIN** dans un log, une réponse ou une notification. Le
 * rapport rendu par `runAccessSync` n'en contient pas.
 */

import { randomInt } from "node:crypto";
import { getRedis } from "./redis";
import {
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
  listLog,
  updateKeypadCode,
  type NukiConfig,
  type NukiLockHealth,
} from "@sejour/socle/lib/nuki";
import { addDays } from "@sejour/socle/lib/dates";
import { sendNtfy } from "@sejour/socle/lib/ntfy";
import { todayParis } from "@sejour/socle/lib/time";
import { addNukiPin, confirmBooking, getBookingById, getBookings, nukiCodeOf } from "./beds24";
import type { Beds24Booking } from "./types";

/** Les alertes du planificateur, plus celles de la serrure et de l'exécution. */
export type SyncAlert = Omit<AccessAlert, "kind"> & { kind: AccessAlert["kind"] | "lock" | "execution" };

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

function toStay(b: Beds24Booking): AccessStay {
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

async function acquireLock(): Promise<boolean> {
  // Le webhook peut attendre un passage en cours : c'est lui qui pose le code d'une
  // réservation de dernière minute. 10 essais espacés de 2 s couvrent un passage normal.
  for (let i = 0; i < 10; i++) {
    if (await redis().set(LOCK_KEY, Date.now(), { nx: true, ex: 120 })) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

export async function runAccessSync({ dryRun }: { dryRun: boolean }): Promise<SyncReport> {
  const mode = dryRun || !syncIsLive() ? "dry" : "live";
  const cfg = nukiConfig();

  if (mode === "live" && !(await acquireLock())) {
    return { mode, health: { online: false, keypadPaired: false, batteryCritical: false, keypadBatteryCritical: false, batteryChargePercent: null, lockState: null, motorBlocked: false }, stays: 0, actions: [], alerts: [], notified: 0, skipped: "un autre passage est en cours" };
  }
  try {
    const today = todayParis();
    const [health, auths, bookings] = await Promise.all([
      getLockHealth(cfg),
      listAuths(cfg),
      getBookings({ departureFrom: addDays(today, -1), statuses: ALL_STATUSES, includeInfoItems: true, fresh: true }),
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

    const stays = house.map(toStay);
    const plan = planAccessCodes({ stays, auths, today, now: new Date(), policy: ACCESS_POLICY, random: randomInt });
    const alerts: SyncAlert[] = [...plan.alerts];

    if (!health.online || !health.keypadPaired) {
      alerts.push({
        kind: "lock",
        bookingId: 0,
        severity: "urgent",
        message: !health.online
          ? "La serrure est hors ligne pour Nuki : aucun code ne peut lui être envoyé."
          : "Aucun clavier n'est appairé à la serrure : les codes ne servent à rien.",
      });
    }
    if (health.batteryCritical || health.keypadBatteryCritical) {
      alerts.push({
        kind: "lock",
        bookingId: 0,
        severity: "high",
        message: `Pile faible : ${health.batteryCritical ? "serrure" : "clavier"}.`,
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
      return { mode, health, stays: stays.length, actions, alerts, notified: 0 };
    }

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
        alerts.push({
          kind: "execution",
          bookingId: action.bookingId,
          severity: "high",
          message: `Réservation ${action.bookingId} : échec de « ${action.kind} » — ${error}`,
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
        alerts.push({ kind: "execution", bookingId: id, severity: "normal", message: `Réservation ${id} : passage en « confirmé » impossible — ${error}` });
      }
    }

    const notified = await notify(alerts);
    return { mode, health, stays: stays.length, actions, alerts, notified };
  } finally {
    if (mode === "live") await redis().del(LOCK_KEY).catch(() => {});
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

/**
 * Délai avant de répéter la même alerte : une fois par jour quand l'arrivée est loin, toutes
 * les 3 h à moins de 48 h, à chaque passage horaire le jour même.
 */
const REPEAT_SECONDS: Record<AccessSeverity, number> = { normal: 24 * 3600, high: 3 * 3600, urgent: 50 * 60 };
const NTFY_PRIORITY: Record<AccessSeverity, 3 | 4 | 5> = { normal: 3, high: 4, urgent: 5 };

async function notify(alerts: SyncAlert[]): Promise<number> {
  if (alerts.length === 0) return 0;
  if (!process.env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquant : les alertes de serrure seraient perdues");
  let sent = 0;
  for (const alert of alerts) {
    const key = `nuki:alert:${alert.kind}:${alert.bookingId}:${alert.severity}:${hash(alert.message)}`;
    const fresh = await redis().set(key, 1, { nx: true, ex: REPEAT_SECONDS[alert.severity] });
    if (!fresh) continue;
    await sendNtfy(alert.message, { title: "Serrure Barbusse", priority: NTFY_PRIORITY[alert.severity], tags: ["lock"] });
    sent++;
  }
  return sent;
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Première ouverture au clavier par réservation, lue dans le journal de la serrure. */
export async function readKeypadArrivals(): Promise<Map<number, string>> {
  return keypadArrivals(await listLog(nukiConfig(), 100));
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
