import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { isProtectedName, managedBookingId } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";
import type { TrackedAlert } from "./alert-memory";

/**
 * Le départ des voyageurs, vu par la serrure — **fonctions pures**, état et lectures passés en
 * argument (patron : `powerCutTransition` de `lib/power-cut.ts`).
 *
 * Phase A (2026-11-16) : `departureLockCheck`, l'alerte « serrure non verrouillée après le
 * départ », surveillée jusqu'à la fin de validité du code des partants (complément du
 * 2026-11-16). Phase B (2026-11-20, en observation, plus bas) : la détection du départ réel
 * (présence des radiateurs, journal de la serrure, message du voyageur) et l'état servi par
 * `/api/dashboard/stay-status`.
 */

/**
 * Délai de grâce après l'heure de départ avant le premier relevé qui compte : un groupe qui
 * part avec dix minutes de retard ne doit pas faire sonner le téléphone. Le premier constat est
 * pris au relevé ≥ D + 30 min, l'alerte part au relevé suivant (deux relevés, règle commune), donc
 * vers D + 45 min. Validé par l'hôte le 2026-11-16.
 */
export const DEPARTURE_LOCK_GRACE_MINUTES = 30;

/**
 * Le ménage (ou les voyageurs suivants) peut entrer **avant** l'heure de départ : une prise en
 * main compte dès D − 2 h.
 */
export const REOCCUPY_LOOKBACK_HOURS = 2;

/** Ouvertures réussies : déverrouillage, ouverture (« unlatch »), déverrouillage avec ouverture. */
const OPENING_ACTIONS: ReadonlySet<number> = new Set([1, 3, 5]);
/** `trigger` d'une ligne du journal venue du clavier. */
const KEYPAD_TRIGGER = 255;
/** `trigger` d'une ouverture par l'application ou l'API Nuki. */
const APP_TRIGGER = 0;
/** `state.state` d'une serrure verrouillée. */
export const LOCK_STATE_LOCKED = 1;
/**
 * États de passage ou indéfinis (déverrouillage, verrouillage, ouverture en cours, indéfini) : le
 * relevé ne tranche pas, le suivant le fera (relecture C5).
 */
export const LOCK_STATES_TRANSIENT: ReadonlySet<number> = new Set([2, 4, 7, 255]);

const LOCK_STATE_LABEL: Record<number, string> = {
  2: "en cours de déverrouillage",
  3: "déverrouillée",
  4: "en cours de verrouillage",
  5: "entrebâillée",
  6: "déverrouillée (verrouillage auto)",
  7: "en cours d'ouverture",
  254: "moteur bloqué",
  255: "état indéfini",
};

export interface DepartureLockInput {
  now: Date;
  /** Aujourd'hui à Paris, « YYYY-MM-DD ». */
  today: string;
  /** Séjours vendus qui partent aujourd'hui, avec leur heure de départ (11 h ou convenue). */
  departures: ReadonlyArray<{ bookingId: number; departureHour: number }>;
  /** Séjours qui arrivent aujourd'hui : leur code qui ouvre vaut prise en main. */
  arrivals: ReadonlyArray<{ bookingId: number }>;
  /**
   * E, la fin de validité **réelle** du code des partants (`departingCodesEnd`,
   * `lib/stay-hours-rules.ts`) : la journée n'est close sur « verrouillée » qu'une fois E passé.
   * Absent ou `null` : E = D + délai de grâce, un seul relevé (règle d'avant).
   */
  codeEnd?: Date | null;
  /** `null` : serrure illisible (API Nuki en panne, jeton absent, délai dépassé). */
  lock: { online: boolean; lockState: number | null } | null;
  /**
   * Journal depuis D − 2 h ; `null` s'il n'a pas pu être lu en entier. Pas lu (`undefined`) quand
   * la porte est verrouillée : il n'y a alors rien de plus à conclure.
   */
  log?: readonly NukiLogEntry[] | null;
  /**
   * Ouvertures du garage (Intratone) par un code **nommé** (`garageOpenings`) ; `null` ou absent :
   * non lu (panne, lenteur, pas d'identifiants) — jamais une raison de ne pas conclure.
   */
  garage?: ReadonlyArray<{ who: string; at: Date }> | null;
  /** Personnes suivies (`TRACKED_PEOPLE`), reconnues aux codes « # Sophie »… */
  people: readonly string[];
  /**
   * Instant (`cts`) du dernier mouvement **significatif** de la caméra du garage
   * (`barbusse:camera:last-real:<did>`, filtre de scène de `camera-watch`). `null` ou absent : non
   * lu, filtre coupé, ou aucun — jamais une raison de ne pas alerter.
   */
  recentMotion?: Date | null;
}

/** Un mouvement du garage reporte l'alerte pendant ce délai (minutes). */
export const MOTION_HOLD_MINUTES = 30;
/**
 * Au-delà de D + 2 h, la caméra ne reporte plus rien : un linge qui dépasse le seuil toutes les
 * 25 min ne doit pas repousser l'alerte jusqu'à la fin du code (relecture Fable, 2026-11-16).
 */
export const MOTION_HOLD_MAX_AFTER_DEPARTURE_MINUTES = 120;

/**
 * - `none` : pas de départ aujourd'hui, ou heure de départ + délai de grâce pas encore passée ;
 * - `unreadable` : serrure hors ligne ou illisible, ou journal illisible — rien n'est conclu ;
 * - `reoccupied` : quelqu'un de la maison (code personnel, au clavier ou au garage) ou les
 *   voyageurs suivants ont pris la main après la dernière ouverture des partants ;
 * - `locked` : porte verrouillée ;
 * - `presence` : porte non verrouillée, mais la caméra du garage a vu un vrai mouvement depuis le
 *   départ, il y a moins de 30 min — relevé reporté, la surveillance continue ;
 * - `unlocked` : porte non verrouillée, personne n'a pris la main.
 */
export type DepartureLockStatus = "none" | "unreadable" | "reoccupied" | "locked" | "presence" | "unlocked";

/** Ce que l'appelant fait de l'état d'alerte `departure-lock`. */
export type DepartureLockReport =
  /** Ne pas toucher à l'état (rien à conclure ce passage). */
  | "skip"
  /** Fermer sans message une alerte ouverte (maison reprise en main, journée finie). */
  | "close-silently"
  /** Règle commune (`reportAlerts`) avec `alerts` : alerte au 2e relevé, « verrouillée » en priorité 1. */
  | "report";

export interface DepartureLockResult {
  status: DepartureLockStatus;
  /** Heure de départ retenue (la plus tardive du jour), `null` sans départ. */
  departureHour: number | null;
  report: DepartureLockReport;
  alerts: TrackedAlert[];
  /**
   * La journée est close : plus aucun relevé jusqu'au lendemain. Vrai pour `reoccupied`, et pour
   * `locked` seulement une fois E passé.
   */
  closesDay?: boolean;
  /** Un voyageur qui part est revenu (son code a ouvert après D) : titre de l'alerte. */
  guestReturned?: boolean;
  /**
   * Alerte distincte « journal illisible, porte non verrouillée » (scope `departure-lock-log`,
   * règle commune) : `undefined` ne touche pas à son état, `[]` le fait avancer sans constat, un
   * élément est un constat (priorité 3).
   */
  journalAlerts?: TrackedAlert[];
  /** Pour le journal du cron et la réponse JSON : jamais de nom de voyageur ni de code. */
  detail: string;
}

/** Heure de départ retenue pour la journée : la plus tardive. */
export function departureDeadlineHour(departures: DepartureLockInput["departures"]): number | null {
  return departures.length > 0 ? Math.max(...departures.map((d) => d.departureHour)) : null;
}

/** Instant à partir duquel un relevé compte : heure de départ + délai de grâce. */
export function departureLockDueAt(today: string, departureHour: number): Date {
  return new Date(parisInstant(today, departureHour).getTime() + DEPARTURE_LOCK_GRACE_MINUTES * 60_000);
}

/**
 * Le nom d'un code est-il celui d'une personne du ménage ? Seulement pour un code **non géré**
 * (pas « <n° de réservation>: <Prénom> ») : un voyageur prénommé comme la personne du ménage
 * n'est pas le ménage.
 */
export function isCleaningCode(name: string | null | undefined, people: readonly string[]): boolean {
  if (!name || managedBookingId(name) !== null) return false;
  return people.some((p) => mentionsPerson(name, p));
}

/** Minuscules, sans accents : « Éric » et « eric » se valent. */
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();

/**
 * Le libellé contient-il le nom de la personne **en mots entiers** (casse et accents ignorés) ?
 * « # Eric » oui, « Frederic » non (relecture du 2026-11-16 : une sous-chaîne prenait l'un pour
 * l'autre).
 */
export function mentionsPerson(label: string, person: string): boolean {
  const p = fold(person);
  if (p === "") return false;
  const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, "u").test(fold(label));
}

/**
 * Un **code personnel** du clavier, celui de quelqu'un de la maison : un code protégé (nom qui
 * commence par `#`, `isProtectedName` du socle — l'hôte, le ménage, le dépannage) ou dont le nom
 * contient une personne de `TRACKED_PEOPLE`. Nom non vide. Un code géré (`<n° résa>: …`) n'en est
 * jamais un, ni un code voyageur saisi à la main (sans `#`, absent de `TRACKED_PEOPLE`).
 */
export function isPersonalCode(name: string | null | undefined, people: readonly string[]): boolean {
  if (!name || name.trim() === "" || managedBookingId(name) !== null) return false;
  return isProtectedName(name) || isCleaningCode(name, people);
}

/** Heure de Paris d'un instant, « 12:10 ». */
function parisClock(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Heure (0-23) à Paris d'un instant : l'horloge injectée, jamais celle de la machine. */
export function parisHourOf(d: Date): number {
  return Number(d.toLocaleString("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false })) % 24;
}

const isOpening = (e: NukiLogEntry) => e.state === 0 && OPENING_ACTIONS.has(e.action);

/** Ce que le journal (et le garage) disent depuis D − 2 h. */
export interface DepartureLogReading {
  /** Dernière ouverture par un code des partants dans le journal lu, ou `null`. */
  lastDepartingOpening: number | null;
  /** Une ouverture par un code des partants **après D** : un voyageur est revenu. */
  guestReturned: boolean;
  /** Prise en main de la maison : par quoi, `null` sinon. */
  takeover: "code personnel" | "code personnel (garage)" | "voyageurs suivants" | null;
  /** Dernière ouverture par l'application Nuki depuis D − 2 h (ce n'est pas une prise en main). */
  lastAppOpening: number | null;
}

/**
 * Lecture du journal pour le relevé de la porte. Une **prise en main** est une ouverture par un
 * code personnel (au clavier : `isPersonalCode` ; au garage : tout code nommé, les voyageurs n'en
 * ont pas) ou par le code des voyageurs suivants, **postérieure à la dernière ouverture par un
 * code des partants** et au plus tôt à D − 2 h. L'application Nuki n'en est pas une : on ne
 * distingue pas une ouverture sur place d'une ouverture à distance.
 *
 * Un **retour** est une ouverture par un code des partants après D (à 10 h, quand ils chargent la
 * voiture, ce n'en est pas un). Ce n'est pas une prise en main.
 */
export function readDepartureLog(
  input: Pick<DepartureLockInput, "log" | "garage" | "people" | "departures" | "arrivals" | "today">,
  departureHour: number,
): DepartureLogReading {
  const departureAt = parisInstant(input.today, departureHour).getTime();
  const lookback = departureAt - REOCCUPY_LOOKBACK_HOURS * 3600_000;
  const leaving = new Set(input.departures.map((d) => d.bookingId));
  const coming = new Set(input.arrivals.map((a) => a.bookingId));
  const keypad = (input.log ?? []).filter((e) => isOpening(e) && e.trigger === KEYPAD_TRIGGER);

  let lastDepartingOpening: number | null = null;
  for (const e of keypad) {
    const id = managedBookingId(e.name ?? "");
    if (id !== null && leaving.has(id)) {
      const t = Date.parse(e.date);
      if (lastDepartingOpening === null || t > lastDepartingOpening) lastDepartingOpening = t;
    }
  }
  const guestReturned = lastDepartingOpening !== null && lastDepartingOpening > departureAt;
  const counts = (t: number) => t >= lookback && (lastDepartingOpening === null || t > lastDepartingOpening);

  let takeover: DepartureLogReading["takeover"] = null;
  for (const e of keypad) {
    if (!counts(Date.parse(e.date))) continue;
    if (isPersonalCode(e.name, input.people)) {
      takeover = "code personnel";
      break;
    }
    const id = managedBookingId(e.name ?? "");
    if (id !== null && coming.has(id)) {
      takeover = "voyageurs suivants";
      break;
    }
  }
  if (takeover === null) {
    for (const g of input.garage ?? []) {
      if (g.who.trim() !== "" && managedBookingId(g.who) === null && counts(g.at.getTime())) {
        takeover = "code personnel (garage)";
        break;
      }
    }
  }

  let lastAppOpening: number | null = null;
  for (const e of input.log ?? []) {
    if (!isOpening(e) || e.trigger !== APP_TRIGGER) continue;
    const t = Date.parse(e.date);
    if (t >= lookback && (lastAppOpening === null || t > lastAppOpening)) lastAppOpening = t;
  }
  return { lastDepartingOpening, guestReturned, takeover, lastAppOpening };
}

/**
 * Alerte « serrure non verrouillée après le départ » (priorité 4, 3 la nuit ; scope
 * `departure-lock`).
 *
 * Le jour d'un départ, de l'heure de départ D (11 h, ou la plus tardive des heures convenues du
 * jour) **plus le délai de grâce** jusqu'à E, la fin de validité réelle du code des partants
 * (`codeEnd`), une porte non verrouillée est un constat — l'alerte part au relevé suivant (règle
 * commune des deux relevés). La journée n'est close que :
 * - sur une **prise en main** de la maison (`readDepartureLog`) : aucune alerte ensuite, même porte
 *   ouverte (le ménage), et une alerte ouverte se referme sans message ;
 * - ou sur une porte **verrouillée une fois E passé**. Verrouillée avant E, on continue : un
 *   voyageur peut revenir chercher un oubli et repartir sans fermer.
 *
 * Une porte non verrouillée après E reste surveillée jusqu'au verrouillage ou à la prise en main ;
 * à minuit (plus de départ « aujourd'hui »), l'alerte se referme sans message. Si E ≤ D + 30 min
 * (rotation), le premier relevé est déjà après E : la règle est celle d'un seul relevé.
 *
 * Pas d'alerte si la serrure est hors ligne (c'est l'alerte de la synchronisation). L'identifiant
 * de l'alerte porte le jour : une alerte d'hier ne masque pas celle d'aujourd'hui.
 *
 * **Parade caméra** (2026-11-16) : la caméra nommée « Porte d'entrée » dans l'application filme en
 * réalité le **garage**. Un mouvement significatif (`recentMotion`, filtre de scène : lumière
 * allumée, scène changée — jamais du linge qui bouge) postérieur à D et vieux de moins de 30 min
 * **reporte** le relevé (`presence`, `report: "skip"`) sans clore la journée : un partant qui
 * traverse le garage puis laisse la porte ouverte déclenche l'alerte 30 min plus tard. C'est ce qui
 * couvre l'entrée du ménage par le garage quand Intratone remonte en retard.
 */
export function departureLockCheck(input: DepartureLockInput): DepartureLockResult {
  const { now, today, departures, lock, log } = input;
  const departureHour = departureDeadlineHour(departures);
  const none = (detail: string): DepartureLockResult => ({
    status: "none",
    departureHour,
    report: "close-silently",
    alerts: [],
    detail,
  });
  if (departureHour === null) return none("pas de départ aujourd'hui");
  const dueAt = departureLockDueAt(today, departureHour);
  if (now.getTime() < dueAt.getTime()) {
    return none(`départ à ${departureHour} h, délai de grâce de ${DEPARTURE_LOCK_GRACE_MINUTES} min pas encore passé`);
  }
  const codeEnd = input.codeEnd ?? dueAt;
  const ended = now.getTime() >= codeEnd.getTime();

  const unreadable = (detail: string): DepartureLockResult => ({ status: "unreadable", departureHour, report: "skip", alerts: [], detail });
  if (lock === null) return unreadable("serrure illisible");
  if (!lock.online) return unreadable("serrure hors ligne (alerte de la synchronisation)");
  if (lock.lockState === null || LOCK_STATES_TRANSIENT.has(lock.lockState)) {
    return unreadable(`serrure dans un état de passage (${lock.lockState === null ? "inconnu" : (LOCK_STATE_LABEL[lock.lockState] ?? lock.lockState)}) : le relevé suivant tranchera`);
  }
  if (lock.lockState === LOCK_STATE_LOCKED) {
    return {
      status: "locked",
      departureHour,
      report: "report",
      alerts: [],
      journalAlerts: [],
      closesDay: ended,
      detail: ended
        ? "porte verrouillée, code des partants expiré : journée close"
        : `porte verrouillée, surveillée jusqu'à ${parisClock(codeEnd)}`,
    };
  }
  if (log === null || log === undefined) {
    // La porte n'est pas verrouillée, mais on ne peut pas savoir si le ménage est entré : alerte
    // distincte, priorité 3, au 2e relevé (relecture C6). L'alerte principale ne bouge pas.
    return {
      ...unreadable("journal de la serrure illisible, porte non verrouillée"),
      journalAlerts: [
        {
          id: `departure-lock-log:${today}`,
          priority: 3,
          line: `Porte non verrouillée après le départ de ${departureHour} h, journal de la serrure illisible : impossible de savoir si le ménage est entré.`,
        },
      ],
    };
  }

  const reading = readDepartureLog(input, departureHour);
  if (reading.takeover) {
    return {
      status: "reoccupied",
      departureHour,
      report: "close-silently",
      alerts: [],
      journalAlerts: [],
      closesDay: true,
      detail: `maison reprise en main (${reading.takeover})`,
    };
  }
  const state =
    lock.lockState === null ? "état inconnu" : (LOCK_STATE_LABEL[lock.lockState] ?? `état ${lock.lockState}`);
  const motion = input.recentMotion ?? null;
  const departedAt = parisInstant(today, departureHour);
  if (
    motion !== null &&
    motion.getTime() >= departedAt.getTime() &&
    now.getTime() - motion.getTime() < MOTION_HOLD_MINUTES * 60_000 &&
    now.getTime() < departedAt.getTime() + MOTION_HOLD_MAX_AFTER_DEPARTURE_MINUTES * 60_000
  ) {
    return {
      status: "presence",
      departureHour,
      report: "skip",
      alerts: [],
      detail: `porte non verrouillée (${state}), mouvement au garage à ${parisClock(motion)} : relevé reporté`,
    };
  }
  const returned =
    reading.guestReturned && reading.lastDepartingOpening !== null
      ? ` Un voyageur est revenu avec son code à ${parisClock(new Date(reading.lastDepartingOpening))}.`
      : "";
  const app =
    reading.lastAppOpening !== null ? ` Ouverture par l'application à ${parisClock(new Date(reading.lastAppOpening))}.` : "";
  return {
    status: "unlocked",
    departureHour,
    report: "report",
    journalAlerts: [],
    guestReturned: reading.guestReturned,
    alerts: [
      {
        id: `departure-lock:${today}`,
        priority: 4,
        line: `Le départ de ${departureHour} h est passé et la porte d'entrée n'est pas verrouillée (${state}).${returned}${app} Ni le ménage, ni l'hôte, ni les voyageurs suivants n'ont repris la main.`,
      },
    ],
    detail: `porte non verrouillée (${state})${reading.guestReturned ? ", voyageur revenu" : ""}`,
  };
}

/** Titre de l'alerte, pour `reportAlerts`. */
export function departureLockTitle(departureHour: number | null, guestReturned = false): string {
  return guestReturned
    ? "Serrure non verrouillée après le retour d'un voyageur"
    : `Serrure non verrouillée — départ de ${departureHour ?? 11} h dépassé`;
}

/* ══════════════════════════════════════════════════════════════════════════
 * Phase B — détection du départ, **en observation** (2026-11-20)
 *
 * Le jour d'un départ, chaque passage de `heating-automation` relève la présence des radiateurs,
 * la serrure et (un passage sur deux) le fil de messages du voyageur, fait avancer un état par
 * réservation et journalise le tout (`lib/departure-observation.ts`). **Le chauffage ne change
 * jamais** en observation : la règle d'aujourd'hui (coupure à l'heure de départ) reste en place.
 *
 * « Maison vide » = serrure verrouillée, aucune ouverture depuis le dernier verrouillage, **et**
 * soit aucune présence sur `EMPTY_PASSES` passages de suite, soit un message de départ du
 * voyageur (constat immédiat). Une ouverture par le code de la réservation (ou à la main, de
 * l'intérieur) après le constat l'annule : `returned`.
 * ══════════════════════════════════════════════════════════════════════════ */

/** Passages de suite sans présence pour conclure (30 à 45 min). À régler sur l'observation. */
export const EMPTY_PASSES = 3;
/** En dessous, la présence de la maison est « illisible » : trop peu de radiateurs pour conclure. */
export const MIN_READABLE_RADIATORS = 3;
/** Verrouillage réussi (`action` 2). Le « lock 'n' go » (4) commence par une ouverture : non compté. */
const LOCK_ACTION = 2;
/** `trigger` d'une manœuvre à la main (bouton de la serrure, molette intérieure, clé). */
const MANUAL_TRIGGERS: ReadonlySet<number> = new Set([1, 2]);

/**
 * Paliers que le mode présence d'un Heatzy applique : `cft` (quelqu'un est là), puis `cft1` et
 * `cft2` (confort −1 / −2 °C, la pièce se vide), puis `eco`. Leur sens exact n'est pas documenté
 * (le dashboard lit `cft1`/`cft2` comme une présence, `lib/radiator-load.ts` comme une pièce
 * vide) : **seul `cft` vaut présence ici**, et le palier brut est journalisé pour trancher.
 */
export const PRESENT_TIERS: ReadonlySet<string> = new Set(["cft"]);

export interface RadiatorPresence {
  name: string;
  /** Palier remonté (`cft`, `cft1`, `cft2`, `eco`…). */
  tier: string;
  present: boolean;
}

/**
 * Présence d'un radiateur, ou `null` si elle ne se lit pas : hors ligne, attributs illisibles,
 * radiateur verrouillé ou tenu hors des alertes (Véranda D), ou pas en mode présence
 * (`derog_mode` ≠ 3 — en hors-gel après le départ, un radiateur est muet).
 */
export function presenceFromReading(
  reading: { name: string; online: boolean; attrs: Record<string, unknown> | null },
  options: { locked?: boolean; ignored?: boolean } = {},
): RadiatorPresence | null {
  if (!reading.online || !reading.attrs || options.locked || options.ignored) return null;
  if (reading.attrs.derog_mode !== 3) return null;
  const tier = typeof reading.attrs.mode === "string" ? reading.attrs.mode : "inconnu";
  return { name: reading.name, tier, present: PRESENT_TIERS.has(tier) };
}

/** Présence de la maison : `readable` faux sous `MIN_READABLE_RADIATORS` radiateurs lisibles. */
export function housePresence(radiators: ReadonlyArray<RadiatorPresence | null>): {
  readable: boolean;
  present: boolean;
  radiators: RadiatorPresence[];
} {
  const list = radiators.filter((r): r is RadiatorPresence => r !== null);
  return { readable: list.length >= MIN_READABLE_RADIATORS, present: list.some((r) => r.present), radiators: list };
}

/** Qui a manœuvré la serrure — jamais de nom : le journal ne garde que la catégorie. */
export type LockActor =
  | "séjour"
  | "voyageurs suivants"
  | "code personnel"
  | "autre code"
  | "application"
  | "à la main"
  | "automatique";

export interface LockEvent {
  at: string;
  kind: "verrouillage" | "ouverture";
  actor: LockActor;
  trigger: number;
}

export interface LockFacts {
  /** Événements réussis (verrouillages et ouvertures) depuis `since`, dans l'ordre. */
  events: LockEvent[];
  lastLockAt: string | null;
  lastOpening: LockEvent | null;
}

export interface LockContext {
  departingIds: readonly number[];
  arrivingIds: readonly number[];
  people: readonly string[];
}

function lockActor(e: NukiLogEntry, ctx: LockContext): LockActor {
  if (e.trigger === KEYPAD_TRIGGER) {
    const id = managedBookingId(e.name ?? "");
    if (id !== null && ctx.departingIds.includes(id)) return "séjour";
    if (id !== null && ctx.arrivingIds.includes(id)) return "voyageurs suivants";
    return isPersonalCode(e.name, ctx.people) ? "code personnel" : "autre code";
  }
  if (e.trigger === APP_TRIGGER) return "application";
  if (MANUAL_TRIGGERS.has(e.trigger)) return "à la main";
  return "automatique";
}

/**
 * Dernier verrouillage et dernière ouverture depuis `since`, avec le déclencheur et **la
 * catégorie** du code (séjour, code personnel…) — pas son nom, qui porte le prénom du voyageur.
 * Les manœuvres ratées (`state` ≠ 0) sont ignorées.
 */
export function lockFacts(log: readonly NukiLogEntry[], since: Date, ctx: LockContext): LockFacts {
  const events: LockEvent[] = log
    .filter(
      (e) =>
        e.state === 0 &&
        Date.parse(e.date) >= since.getTime() &&
        (e.action === LOCK_ACTION || OPENING_ACTIONS.has(e.action)),
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
    .map((e) => ({
      at: new Date(Date.parse(e.date)).toISOString(),
      kind: e.action === LOCK_ACTION ? ("verrouillage" as const) : ("ouverture" as const),
      actor: lockActor(e, ctx),
      trigger: e.trigger,
    }));
  const locks = events.filter((e) => e.kind === "verrouillage");
  const openings = events.filter((e) => e.kind === "ouverture");
  return {
    events,
    lastLockAt: locks.length > 0 ? locks[locks.length - 1].at : null,
    lastOpening: openings.length > 0 ? openings[openings.length - 1] : null,
  };
}

/** Porte fermée derrière quelqu'un : verrouillée, et aucune ouverture après le dernier verrouillage. */
export function doorClosedBehind(lockState: number | null, facts: LockFacts): boolean {
  if (lockState !== LOCK_STATE_LOCKED) return false;
  if (!facts.lastOpening) return true;
  return facts.lastLockAt !== null && Date.parse(facts.lastLockAt) > Date.parse(facts.lastOpening.at);
}

/* ── Message de départ du voyageur ───────────────────────────────────── */

/**
 * Mots-clés (texte replié : minuscules, sans accents) qui disent « nous sommes partis », dans les
 * 5 langues du site. Volontairement étroits : « on part à 10 h » n'est pas un départ.
 */
const DEPARTED_PATTERNS: readonly RegExp[] = [
  // fr
  /\b(sommes|suis|est|sont|etes)\s+(bien\s+)?(tous\s+|toutes\s+)?parti(e|s|es)?\b/,
  /\b(avons|ai|a|ont)\s+(bien\s+)?quitte\b/,
  /\bpartis\b/,
  // en
  /\b(we|i|we've|i've|we have|i have|have|has)\s+(just\s+|now\s+|all\s+)?(left|checked[\s-]?out)\b/,
  /\bchecked[\s-]?out\b/,
  /\bjust left\b/,
  // it
  /\b(siamo|sono)\s+(gia\s+)?(partit[ie]|uscit[ie])\b/,
  /\babbiamo\s+lasciato\b/,
  // de
  /\babgereist\b/,
  /\bausgecheckt\b/,
  /\bsind\s+(jetzt\s+|schon\s+)?(weg|losgefahren|abgefahren)\b/,
  /\bhaben\s+(das\s+haus\s+)?verlassen\b/,
  // es
  /\b(hemos\s+salido|salimos|nos\s+fuimos|nos\s+hemos\s+ido)\b/,
];

/** « pas encore partis », « not yet left »… : pas un départ. */
const NOT_YET =
  /\b(pas encore|pas tous|pas toutes|not yet|haven't|have not|noch nicht|non ancora|non siamo|todavia no|aun no)\b/;

const foldText = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** Le texte dit-il que les voyageurs sont partis ? Exporté pour les tests. */
export function saysDeparted(text: string): boolean {
  const t = foldText(text);
  if (NOT_YET.test(t)) return false;
  return DEPARTED_PATTERNS.some((p) => p.test(t));
}

/**
 * Le voyageur confirme-t-il son départ ? Seulement ses messages (`source: "guest"`) reçus depuis
 * `since` (le matin du départ). Rend l'heure du premier message reconnu, **jamais le texte** :
 * il n'est ni journalisé, ni notifié, ni servi.
 */
export function departureMessage(
  thread: ReadonlyArray<{ time: string; source: string; message: string }>,
  since: Date,
): { at: string } | null {
  const hits = thread
    .filter((m) => m.source === "guest" && Date.parse(m.time) >= since.getTime() && saysDeparted(m.message ?? ""))
    .map((m) => Date.parse(m.time))
    .sort((a, b) => a - b);
  return hits.length > 0 ? { at: new Date(hits[0]).toISOString() } : null;
}

/* ── Transition ──────────────────────────────────────────────────────── */

export type DepartureStatus = "occupied" | "suspected" | "empty" | "returned";

/** État d'une réservation le jour de son départ (`barbusse:departure:<id>`, 7 jours). */
export interface DepartureState {
  /** Jour du départ, « YYYY-MM-DD ». */
  day: string;
  status: DepartureStatus;
  /** Passages de suite sans présence (relevés lisibles seulement). */
  absentPasses: number;
  /** Premier passage de la série sans présence. */
  absentSince?: string;
  lastPresenceAt?: string;
  /** Départ estimé : dernier verrouillage du jour, sinon début de l'absence, sinon le message. */
  departedAt?: string;
  by?: "presence" | "message";
  messageAt?: string;
  /** Message de départ reçu alors que la porte n'était pas verrouillée. */
  leftUnlocked?: boolean;
  /** Relevé de la porte après l'heure de départ (`departureLockCheck`), sans lecture de plus. */
  door?: "locked" | "unlocked" | "reoccupied";
  returnedAt?: string;
  /** Dernière lecture du fil de messages (un passage sur deux). */
  messageCheckedAt?: string;
  updatedAt: string;
}

export interface DepartureFacts {
  /** `null` : radiateurs illisibles. */
  presence: { readable: boolean; present: boolean } | null;
  /** `null` : serrure illisible ou hors ligne. */
  lockState: number | null;
  /** `null` : journal non lu ou illisible. */
  lock: LockFacts | null;
  /** Message de départ reçu (déjà filtré au jour du départ) ; `null` sinon, ou non lu. */
  message: { at: string } | null;
}

export interface DepartureTransition {
  state: DepartureState;
  /** À notifier — chacune une seule fois par réservation, ce que l'appelant garantit. */
  notify: Array<"departed" | "left-unlocked">;
  /** Rien de concluant ce passage (serrure, journal ou radiateurs illisibles). */
  unreadable: boolean;
}

/** État de départ d'une journée : maison occupée, aucune absence. */
export function initialDepartureState(day: string, now: Date): DepartureState {
  return { day, status: "occupied", absentPasses: 0, updatedAt: now.toISOString() };
}

/**
 * Fait avancer l'état d'un départ — **pure**, état passé en argument (patron :
 * `powerCutTransition`).
 *
 * - Radiateurs illisibles : la série sans présence ne bouge pas (seul un message peut conclure).
 * - Serrure illisible, hors ligne ou en état de passage : aucun constat, aucune notification.
 * - `empty` : porte fermée derrière les voyageurs (`doorClosedBehind`) **et** (`EMPTY_PASSES`
 *   passages sans présence **ou** message de départ). Notifie `departed`.
 * - Message reçu, porte non verrouillée : `left-unlocked` (une fois), statut `suspected`.
 * - Après `empty`, une ouverture par le code du séjour, ou à la main, annule le constat :
 *   `returned`, et la détection repart (un nouveau constat est possible, sans nouvelle
 *   notification). Une ouverture par le ménage, l'hôte ou les voyageurs suivants n'est pas un
 *   retour.
 */
export function departureTransition(
  previous: DepartureState | null,
  facts: DepartureFacts,
  now: Date,
  day: string,
): DepartureTransition {
  const prev = previous && previous.day === day ? previous : initialDepartureState(day, now);
  const nowIso = now.toISOString();
  const next: DepartureState = { ...prev, updatedAt: nowIso };
  const notify: DepartureTransition["notify"] = [];

  if (facts.presence?.readable) {
    if (facts.presence.present) {
      next.absentPasses = 0;
      delete next.absentSince;
      next.lastPresenceAt = nowIso;
    } else {
      next.absentPasses = prev.absentPasses + 1;
      next.absentSince = prev.absentSince ?? nowIso;
    }
  }
  if (facts.message && !next.messageAt) next.messageAt = facts.message.at;

  const lockReadable = facts.lockState !== null && !LOCK_STATES_TRANSIENT.has(facts.lockState);
  if (!lockReadable) return { state: next, notify, unreadable: true };
  const unreadable = facts.lock === null || !facts.presence?.readable;

  if (prev.status === "empty") {
    const o = facts.lock?.lastOpening;
    if (
      o &&
      prev.departedAt &&
      (o.actor === "séjour" || o.actor === "à la main") &&
      Date.parse(o.at) > Date.parse(prev.departedAt)
    ) {
      next.status = "returned";
      next.returnedAt = o.at;
      next.absentPasses = 0;
      delete next.absentSince;
      delete next.departedAt;
      delete next.by;
    }
    return { state: next, notify, unreadable };
  }

  const closed = facts.lock !== null && doorClosedBehind(facts.lockState, facts.lock);
  const lockToday =
    facts.lock?.lastLockAt && Date.parse(facts.lock.lastLockAt) >= parisInstant(day, 0).getTime()
      ? facts.lock.lastLockAt
      : null;
  // Après un retour, seul un message postérieur au retour compte.
  const message =
    next.messageAt && (!next.returnedAt || Date.parse(next.messageAt) > Date.parse(next.returnedAt))
      ? next.messageAt
      : null;
  const firstTime = !prev.returnedAt;

  if (closed && message) {
    next.status = "empty";
    next.by = "message";
    next.departedAt = lockToday && Date.parse(lockToday) <= Date.parse(message) ? lockToday : message;
    if (firstTime) notify.push("departed");
  } else if (closed && next.absentPasses >= EMPTY_PASSES) {
    next.status = "empty";
    next.by = "presence";
    const since = next.absentSince ?? nowIso;
    // Le verrouillage du jour s'il précède l'absence ; sinon (verrouillé la veille au soir) le
    // début de l'absence : le constat de la porte seul ne date pas un départ.
    next.departedAt = lockToday && Date.parse(lockToday) <= Date.parse(since) ? lockToday : since;
    if (firstTime) notify.push("departed");
  } else {
    if (message && facts.lockState !== LOCK_STATE_LOCKED && !prev.leftUnlocked) {
      next.leftUnlocked = true;
      notify.push("left-unlocked");
    }
    next.status =
      (closed && next.absentPasses > 0) || message ? "suspected" : prev.returnedAt ? "returned" : "occupied";
  }
  return { state: next, notify, unreadable };
}

/* ── Affichage (dashboard) ───────────────────────────────────────────── */

/** « 8 h 42 », heure de Paris. */
export function frenchClock(when: string | Date): string {
  const [h, m] = parisClock(new Date(when)).split(":");
  return `${Number(h)} h ${m}`;
}

export interface DepartureBadge {
  /** `gone` : porte et coche vertes ; `present` : horloge orange ; `unlocked` : porte ouverte rouge. */
  icon: "gone" | "present" | "unlocked";
  /** Ligne d'état de la fiche, sans donnée personnelle, toujours avec « estimation ». */
  line: string;
}

const UNLOCKED_LINE = "Partis sans verrouiller la porte (estimation)";

/**
 * Ce que le calendrier montre d'un départ — pure. « Partis sans verrouiller » quand le message est
 * arrivé porte ouverte, ou que le relevé d'après l'heure de départ trouve la porte ouverte (tant
 * qu'il ne l'a pas trouvée verrouillée ou reprise en main) ; « partis » sur un constat ;
 * « encore présents » le jour même seulement, tant que rien n'est constaté.
 */
export function departureBadge(state: DepartureState, today: string, agreedDepartureHour?: number): DepartureBadge | null {
  if (state.door === "unlocked") return { icon: "unlocked", line: UNLOCKED_LINE };
  if (state.status === "empty" && state.departedAt) {
    const line =
      state.by === "message" && state.messageAt
        ? `Départ confirmé par message à ${frenchClock(state.messageAt)} (estimation)`
        : `Départ constaté à ${frenchClock(state.departedAt)} (porte verrouillée, plus de présence) (estimation)`;
    return { icon: "gone", line };
  }
  if (state.leftUnlocked && state.door === undefined) return { icon: "unlocked", line: UNLOCKED_LINE };
  if (state.day !== today || state.door !== undefined) return null;
  const seen = state.lastPresenceAt ? ` (dernière présence ${frenchClock(state.lastPresenceAt)})` : "";
  const late = agreedDepartureHour !== undefined ? ` · départ tardif convenu à ${agreedDepartureHour} h` : "";
  return { icon: "present", line: `Voyageurs encore présents${seen}${late} (estimation)` };
}
