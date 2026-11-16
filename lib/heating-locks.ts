import { countsAsSold } from "@sejour/socle/lib/booking-status";
import type { Beds24Booking } from "./types";

/**
 * Verrous « hors-gel » des radiateurs, posés à la main depuis le dashboard (chambres inoccupées
 * d'un séjour). Logique pure, testée sans Redis (`tests/heating/locks.test.ts`).
 *
 * Jusqu'au 2026-11-16, la liste des radiateurs verrouillés n'était liée à aucune réservation :
 * `heating-automation` la vidait entièrement le jour de **n'importe quel** départ, dès 10 h. Un jour
 * de rotation, un verrou posé à 15 h pour les arrivants était donc levé au passage suivant.
 *
 * Désormais, chaque verrou porte une date **`until`**, fixée au moment du clic : le départ du
 * séjour en cours, sinon celui du prochain séjour. Il est levé quand ce jour est atteint (ou passé :
 * un cron manqué ne le fait pas durer) et que la maison n'est plus occupée — c'est-à-dire après
 * l'heure de libération du jour, la même que celle du chauffage.
 *
 * Un verrou sans date (posé avant cette version, ou sans séjour connu au moment du clic) garde la
 * règle d'avant : levé au premier départ. Sans aucun séjour connu, on n'invente pas de date.
 */

/** Séjours vendus qui comptent pour dater un verrou (demandes et options exclues). */
function sold(bookings: readonly Beds24Booking[]): Beds24Booking[] {
  return bookings.filter((b) => countsAsSold(b.status));
}

/**
 * Date de fin d'un verrou posé aujourd'hui : le départ du séjour en cours ou qui arrive
 * aujourd'hui (départ après aujourd'hui), sinon celui du prochain séjour. Un séjour qui part
 * aujourd'hui ne compte que s'il n'y a rien d'autre : le verrou se lèvera alors à sa libération.
 * `null` si aucun séjour n'est connu.
 */
export function lockUntilFor(bookings: readonly Beds24Booking[], today: string): string | null {
  const candidates = sold(bookings).filter((b) => b.departure > today);
  if (candidates.length > 0) {
    // Le plus tôt arrivé : celui en cours (arrivée ≤ aujourd'hui) passe avant un séjour à venir.
    const next = [...candidates].sort(
      (a, b) => a.arrival.localeCompare(b.arrival) || a.departure.localeCompare(b.departure),
    )[0];
    return next.departure;
  }
  return sold(bookings).some((b) => b.departure === today) ? today : null;
}

export interface LockReleaseInput {
  locked: ReadonlySet<string>;
  /** Date de fin par radiateur ; absente pour un verrou ancien. */
  until: Readonly<Record<string, string>>;
  today: string;
  /** Un séjour part aujourd'hui (règle des verrous sans date). */
  hasCheckOutToday: boolean;
  /** La maison est occupée à cet instant (situation `occupied` du chauffage). */
  occupied: boolean;
}

/** Les radiateurs à rendre à l'automatisation à ce passage. */
export function locksToRelease(input: LockReleaseInput): string[] {
  if (input.occupied) return [];
  return [...input.locked].filter((did) => {
    const until = input.until[did];
    if (until) return until <= input.today;
    return input.hasCheckOutToday;
  });
}
