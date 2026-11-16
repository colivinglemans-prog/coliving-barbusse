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
  /** `null` : serrure illisible (API Nuki en panne, jeton absent). */
  lock: { online: boolean; lockState: number | null } | null;
  /** Journal depuis l'heure de départ ; `null` s'il n'a pas pu être lu en entier. */
  log: readonly NukiLogEntry[] | null;
  /** Personnes du ménage suivies (`TRACKED_PEOPLE`), reconnues aux codes « # Sophie »… */
  people: readonly string[];
}

/**
 * - `none` : pas de départ aujourd'hui, ou heure de départ pas encore passée ;
 * - `unreadable` : serrure hors ligne ou illisible, ou journal illisible — rien n'est conclu ;
 * - `reoccupied` : le ménage ou les voyageurs suivants ont ouvert après l'heure de départ ;
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

/** Ouverture réussie au clavier par le ménage ou par le code d'un séjour qui arrive aujourd'hui. */
function reopenedBy(
  log: readonly NukiLogEntry[],
  since: number,
  people: readonly string[],
  arrivals: ReadonlySet<number>,
): "ménage" | "voyageurs suivants" | null {
  for (const e of log) {
    if (e.state !== 0 || e.trigger !== KEYPAD_TRIGGER || !OPENING_ACTIONS.has(e.action)) continue;
    if (Date.parse(e.date) < since) continue;
    const name = (e.name ?? "").toLowerCase();
    if (people.some((p) => p && name.includes(p.toLowerCase()))) return "ménage";
    const id = managedBookingId(e.name ?? "");
    if (id !== null && arrivals.has(id)) return "voyageurs suivants";
  }
  return null;
}

/**
 * Alerte « serrure non verrouillée après le départ » (priorité 4, scope `departure-lock`).
 *
 * Le jour d'un départ, à partir de l'heure de départ (11 h, ou la plus tardive des heures
 * convenues du jour), une porte non verrouillée alerte — confirmée sur deux relevés par la règle
 * commune, donc vers 11 h 15. Pas d'alerte si le ménage ou les voyageurs suivants ont ouvert
 * depuis (la maison est de nouveau occupée : une alerte ouverte se referme sans message), ni si
 * la serrure est hors ligne (c'est l'alerte de la synchronisation).
 *
 * L'identifiant de l'alerte porte le jour : une alerte d'hier ne masque pas celle d'aujourd'hui.
 */
export function departureLockCheck(input: DepartureLockInput): DepartureLockResult {
  const { now, today, departures, lock, log, people } = input;
  const none = (detail: string): DepartureLockResult => ({
    status: "none",
    departureHour: departures.length > 0 ? Math.max(...departures.map((d) => d.departureHour)) : null,
    report: "close-silently",
    alerts: [],
    detail,
  });
  if (departures.length === 0) return none("pas de départ aujourd'hui");
  const departureHour = Math.max(...departures.map((d) => d.departureHour));
  const deadline = parisInstant(today, departureHour).getTime();
  if (now.getTime() < deadline) return none(`départ à ${departureHour} h, pas encore passé`);

  const unreadable = (detail: string): DepartureLockResult => ({ status: "unreadable", departureHour, report: "skip", alerts: [], detail });
  if (lock === null) return unreadable("serrure illisible");
  if (!lock.online) return unreadable("serrure hors ligne (alerte de la synchronisation)");
  if (log === null) return unreadable("journal de la serrure illisible");

  const by = reopenedBy(log, deadline, people, new Set(input.arrivals.map((a) => a.bookingId)));
  if (by) {
    return { status: "reoccupied", departureHour, report: "close-silently", alerts: [], detail: `porte ouverte depuis par : ${by}` };
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
        line: `Le départ de ${departureHour} h est passé et la porte d'entrée n'est pas verrouillée (${state}). Ni le ménage ni les voyageurs suivants ne l'ont ouverte depuis.`,
      },
    ],
    detail: `porte non verrouillée (${state})`,
  };
}

/** Titres de l'alerte, pour `reportAlerts`. */
export function departureLockTitle(departureHour: number | null): string {
  return `Serrure non verrouillée — départ de ${departureHour ?? 11} h dépassé`;
}
