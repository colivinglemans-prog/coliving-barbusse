import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { managedBookingId } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";
import type { TrackedAlert } from "./alert-memory";

/**
 * Le départ des voyageurs, vu par la serrure — **fonctions pures**, état et lectures passés en
 * argument (patron : `powerCutTransition` de `lib/power-cut.ts`).
 *
 * Phase A (2026-11-16) : `departureLockCheck`, l'alerte « serrure non verrouillée après le
 * départ ». Phase B y ajoutera la détection du départ réel (présence des radiateurs, journal de
 * la serrure, message du voyageur) et l'état servi par `/api/dashboard/stay-status`.
 */

/**
 * Délai de grâce après l'heure de départ avant le premier relevé qui compte : un groupe qui
 * part avec dix minutes de retard ne doit pas faire sonner le téléphone. Le premier constat est
 * pris au relevé ≥ D + 30 min, l'alerte part au relevé suivant (deux relevés, règle commune), donc
 * vers D + 45 min. **Valeur à arbitrer par l'hôte.**
 */
export const DEPARTURE_LOCK_GRACE_MINUTES = 30;

/**
 * Le ménage (ou les voyageurs suivants) peut entrer **avant** l'heure de départ : une ouverture
 * depuis D − 2 h vaut maison de nouveau occupée.
 */
export const REOCCUPY_LOOKBACK_HOURS = 2;

/** Ouvertures réussies : déverrouillage, ouverture (« unlatch »), déverrouillage avec ouverture. */
const OPENING_ACTIONS: ReadonlySet<number> = new Set([1, 3, 5]);
/** `trigger` d'une ligne du journal venue du clavier. */
const KEYPAD_TRIGGER = 255;
/** `state.state` d'une serrure verrouillée. */
export const LOCK_STATE_LOCKED = 1;

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
  /** Séjours qui arrivent aujourd'hui : leur code qui ouvre vaut maison de nouveau occupée. */
  arrivals: ReadonlyArray<{ bookingId: number }>;
  /** `null` : serrure illisible (API Nuki en panne, jeton absent, délai dépassé). */
  lock: { online: boolean; lockState: number | null } | null;
  /** Journal depuis D − 2 h ; `null` s'il n'a pas pu être lu en entier. */
  log: readonly NukiLogEntry[] | null;
  /** Entrées au garage (Intratone) des personnes suivies ; `null` ou absent : non lu. */
  garage?: ReadonlyArray<{ who: string; at: Date }> | null;
  /** Personnes du ménage suivies (`TRACKED_PEOPLE`), reconnues aux codes « # Sophie »… */
  people: readonly string[];
}

/**
 * - `none` : pas de départ aujourd'hui, ou heure de départ + délai de grâce pas encore passée ;
 * - `unreadable` : serrure hors ligne ou illisible, ou journal illisible — rien n'est conclu ;
 * - `reoccupied` : le ménage ou les voyageurs suivants sont entrés depuis D − 2 h ;
 * - `locked` : porte verrouillée ;
 * - `unlocked` : porte non verrouillée, personne n'est revenu.
 */
export type DepartureLockStatus = "none" | "unreadable" | "reoccupied" | "locked" | "unlocked";

/** Ce que l'appelant fait de l'état d'alerte `departure-lock`. */
export type DepartureLockReport =
  /** Ne pas toucher à l'état (rien à conclure ce passage). */
  | "skip"
  /** Fermer sans message une alerte ouverte (maison de nouveau occupée, journée finie). */
  | "close-silently"
  /** Règle commune (`reportAlerts`) avec `alerts` : alerte au 2e relevé, « verrouillée » en priorité 1. */
  | "report";

export interface DepartureLockResult {
  status: DepartureLockStatus;
  /** Heure de départ retenue (la plus tardive du jour), `null` sans départ. */
  departureHour: number | null;
  report: DepartureLockReport;
  alerts: TrackedAlert[];
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
  const lower = name.toLowerCase();
  return people.some((p) => p.trim() !== "" && lower.includes(p.trim().toLowerCase()));
}

/** Entrée du ménage (porte ou garage) ou du code d'un séjour qui arrive aujourd'hui, depuis `since`. */
function reopenedBy(
  input: Pick<DepartureLockInput, "log" | "garage" | "people">,
  since: number,
  arrivals: ReadonlySet<number>,
): "ménage" | "ménage (garage)" | "voyageurs suivants" | null {
  for (const e of input.log ?? []) {
    if (e.state !== 0 || e.trigger !== KEYPAD_TRIGGER || !OPENING_ACTIONS.has(e.action)) continue;
    if (Date.parse(e.date) < since) continue;
    if (isCleaningCode(e.name, input.people)) return "ménage";
    const id = managedBookingId(e.name ?? "");
    if (id !== null && arrivals.has(id)) return "voyageurs suivants";
  }
  for (const g of input.garage ?? []) {
    if (g.at.getTime() >= since && input.people.some((p) => p.toLowerCase() === g.who.toLowerCase())) return "ménage (garage)";
  }
  return null;
}

/**
 * Alerte « serrure non verrouillée après le départ » (priorité 4, scope `departure-lock`).
 *
 * Le jour d'un départ, à partir de l'heure de départ (11 h, ou la plus tardive des heures
 * convenues du jour) **plus le délai de grâce**, une porte non verrouillée est un constat — l'alerte
 * part au relevé suivant (règle commune des deux relevés). Pas d'alerte si le ménage (code non
 * géré, ou entrée au garage) ou les voyageurs suivants sont entrés **depuis D − 2 h** (la maison
 * est de nouveau occupée : une alerte ouverte se referme sans message), ni si la serrure est hors
 * ligne (c'est l'alerte de la synchronisation).
 *
 * L'identifiant de l'alerte porte le jour : une alerte d'hier ne masque pas celle d'aujourd'hui.
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
  if (now.getTime() < departureLockDueAt(today, departureHour).getTime()) {
    return none(`départ à ${departureHour} h, délai de grâce de ${DEPARTURE_LOCK_GRACE_MINUTES} min pas encore passé`);
  }

  const unreadable = (detail: string): DepartureLockResult => ({ status: "unreadable", departureHour, report: "skip", alerts: [], detail });
  if (lock === null) return unreadable("serrure illisible");
  if (!lock.online) return unreadable("serrure hors ligne (alerte de la synchronisation)");
  if (log === null) return unreadable("journal de la serrure illisible");

  const since = parisInstant(today, departureHour).getTime() - REOCCUPY_LOOKBACK_HOURS * 3600_000;
  const by = reopenedBy(input, since, new Set(input.arrivals.map((a) => a.bookingId)));
  if (by) {
    return { status: "reoccupied", departureHour, report: "close-silently", alerts: [], detail: `entrée depuis ${departureHour - REOCCUPY_LOOKBACK_HOURS} h : ${by}` };
  }
  if (lock.lockState === LOCK_STATE_LOCKED) {
    return { status: "locked", departureHour, report: "report", alerts: [], detail: "porte verrouillée" };
  }
  const state =
    lock.lockState === null ? "état inconnu" : (LOCK_STATE_LABEL[lock.lockState] ?? `état ${lock.lockState}`);
  return {
    status: "unlocked",
    departureHour,
    report: "report",
    alerts: [
      {
        id: `departure-lock:${today}`,
        priority: 4,
        line: `Le départ de ${departureHour} h est passé et la porte d'entrée n'est pas verrouillée (${state}). Ni le ménage ni les voyageurs suivants ne sont entrés depuis ${departureHour - REOCCUPY_LOOKBACK_HOURS} h.`,
      },
    ],
    detail: `porte non verrouillée (${state})`,
  };
}

/** Titre de l'alerte, pour `reportAlerts`. */
export function departureLockTitle(departureHour: number | null): string {
  return `Serrure non verrouillée — départ de ${departureHour ?? 11} h dépassé`;
}
