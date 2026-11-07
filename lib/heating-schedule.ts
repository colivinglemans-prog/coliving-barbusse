import type { HeatzyMode, HeatzyZone } from "./types";

/**
 * **Le** mode attendu des radiateurs à un instant donné — une seule source.
 *
 * Jusqu'au 2026-11-07, la même règle vivait en trois copies qui avaient fini par diverger :
 * `heating-automation` (ce qui est réellement appliqué), le champ `expectedMode` de
 * `/api/dashboard/heating` et le texte de `getHeatingRules`. Le dashboard annonçait par
 * exemple « confort » à 15 h un jour de rotation (départ et arrivée le même jour), alors que
 * l'automatisation y applique l'éco jusqu'à 17 h. **La référence est l'automatisation** :
 * c'est ce que reçoivent les radiateurs. Le test `tests/heating/expected-mode.test.ts` garde
 * les trois anciennes copies comme oracles sur une semaine simulée.
 *
 * Fonctions **pures** : jour (« YYYY-MM-DD », Paris) et heure (0-23, Paris) sont passés, rien
 * n'est lu. Les réservations passées doivent déjà être filtrées des statuts exclus.
 */

export interface StayDates {
  arrival: string;
  departure: string;
}

/**
 * - `occupied` : voyageurs sur place (J 17 h → départ 10 h) ;
 * - `arrival-morning` : arrivée aujourd'hui, avant le préchauffage (0 h-12 h) ;
 * - `preheat-eco` : arrivée aujourd'hui, 12 h-15 h ;
 * - `preheat-cft` : arrivée aujourd'hui, 15 h-17 h ;
 * - `turnaround` : départ et arrivée le même jour, entre 10 h et 17 h ;
 * - `checkout` : départ aujourd'hui, sans arrivée, après 10 h ;
 * - `vacant` : rien — l'automatisation ne touche à rien.
 */
export type HeatingSituation =
  | "occupied"
  | "arrival-morning"
  | "preheat-eco"
  | "preheat-cft"
  | "turnaround"
  | "checkout"
  | "vacant";

/** Heure d'arrivée (préchauffage terminé), de libération le jour du départ, et paliers. */
export const HEATING_HOURS = {
  checkIn: 17,
  checkOut: 10,
  preheatEco: 12,
  preheatCft: 15,
  turnaroundEcoFrom: 9,
} as const;

/** La condition historique `isCurrentlyOccupied`, inchangée. */
export function isOccupiedAt(bookings: readonly StayDates[], today: string, hour: number): boolean {
  return bookings.some(
    (b) =>
      (b.arrival < today && b.departure > today) ||
      (b.arrival === today && b.departure > today && hour >= HEATING_HOURS.checkIn) ||
      (b.departure === today && hour < HEATING_HOURS.checkOut),
  );
}

export function heatingSituation(bookings: readonly StayDates[], today: string, hour: number): HeatingSituation {
  const occupied = isOccupiedAt(bookings, today, hour);
  if (occupied) return "occupied";
  const checkIn = bookings.some((b) => b.arrival === today);
  const checkOut = bookings.some((b) => b.departure === today);
  if (checkIn && checkOut) return "turnaround";
  if (checkIn) {
    if (hour >= HEATING_HOURS.preheatCft) return "preheat-cft";
    if (hour >= HEATING_HOURS.preheatEco) return "preheat-eco";
    return "arrival-morning";
  }
  if (checkOut) return "checkout";
  return "vacant";
}

/**
 * Chambres : présence 7 h-20 h, confort sinon. Zones à `nightMode` (RDC) : ce mode 0 h-5 h.
 */
export function getOccupiedMode(zone: Pick<HeatzyZone, "nightMode">, hour: number): HeatzyMode {
  if (zone.nightMode && hour >= 0 && hour < 5) return zone.nightMode;
  if (hour >= 7 && hour < 20) return "presence";
  return "cft";
}

/** Rotation (départ et arrivée le même jour) : éco de 9 h à 17 h, hors-gel sinon. */
export function getBetweenReservationsMode(hour: number): HeatzyMode {
  if (hour >= HEATING_HOURS.turnaroundEcoFrom && hour < HEATING_HOURS.checkIn) return "eco";
  return "fro";
}

/** Le mode d'une zone pour une situation. `null` : l'automatisation ne touche à rien. */
export function modeForSituation(
  situation: HeatingSituation,
  zone: Pick<HeatzyZone, "nightMode">,
  hour: number,
): HeatzyMode | null {
  switch (situation) {
    case "occupied":
      return getOccupiedMode(zone, hour);
    case "preheat-cft":
      return "cft";
    case "preheat-eco":
      return "eco";
    case "arrival-morning":
      return "fro";
    case "turnaround":
      return getBetweenReservationsMode(hour);
    case "checkout":
      return "fro";
    case "vacant":
      return null;
  }
}

export interface ExpectedHeating {
  situation: HeatingSituation;
  /** `null` : rien d'imposé (aucune réservation autour) — le radiateur garde son mode, hors-gel par défaut. */
  mode: HeatzyMode | null;
}

/** **La** fonction : mode attendu d'une zone, à l'heure `hour` du jour `today`. */
export function expectedHeatingMode(
  bookings: readonly StayDates[],
  today: string,
  hour: number,
  zone: Pick<HeatzyZone, "nightMode">,
): ExpectedHeating {
  const situation = heatingSituation(bookings, today, hour);
  return { situation, mode: modeForSituation(situation, zone, hour) };
}

/**
 * Ce que le reset périodique (`heating-reset`, toutes les 4 h) impose à un radiateur.
 *
 * - **Occupé** : le mode occupé, et les consignes ne sont remises que si le voyageur les a
 *   montées.
 * - **Jour d'arrivée à partir de 12 h** (préchauffage, ou rotation) : compte comme occupé. Le
 *   reset impose le mode du préchauffage et ne touche les consignes que si elles ont été
 *   montées. Avant le 2026-11-07, il remettait le mode par défaut (hors-gel) aux passages de
 *   12 h et 16 h : le préchauffage, posé par l'automatisation à 12 h et 15 h, était coupé
 *   jusqu'au quart d'heure suivant — et à 16 h, à une heure de l'arrivée.
 * - **Sinon** : le mode par défaut du radiateur, consignes toujours remises.
 */
export function resetTarget(
  bookings: readonly StayDates[],
  today: string,
  hour: number,
  zone: Pick<HeatzyZone, "nightMode">,
  device: { defaultMode: HeatzyMode },
): { mode: HeatzyMode; occupied: boolean } {
  const { situation, mode } = expectedHeatingMode(bookings, today, hour, zone);
  if (situation === "occupied") return { mode: mode!, occupied: true };
  const arrivalDayAfternoon =
    hour >= HEATING_HOURS.preheatEco &&
    (situation === "preheat-eco" || situation === "preheat-cft" || situation === "turnaround");
  if (arrivalDayAfternoon && mode) return { mode, occupied: true };
  return { mode: device.defaultMode, occupied: false };
}

/** Règle en cours et règle suivante, en clair, pour le bandeau du dashboard. */
export function getHeatingRules(
  situation: HeatingSituation,
  hour: number,
  nextCheckIn?: string,
): { currentRule: string; nextRule: string } {
  switch (situation) {
    case "arrival-morning":
      return {
        currentRule: "Arrivée aujourd'hui — Hors-gel",
        nextRule: "À 12h → Pré-chauffage éco, à 15h → confort",
      };
    case "preheat-eco":
      return {
        currentRule: "Arrivée aujourd'hui — Pré-chauffage éco",
        nextRule: "À 15h → Confort (arrivée à 17h)",
      };
    case "preheat-cft":
      return {
        currentRule: "Arrivée aujourd'hui — Pré-chauffage confort",
        nextRule: "Arrivée prévue à 17h",
      };
    case "checkout":
    case "vacant":
      return {
        currentRule: "Pas de réservation — Hors-gel",
        nextRule: nextCheckIn ? `Prochain check-in : ${nextCheckIn}` : "Aucune réservation prochaine",
      };
    case "turnaround": {
      const mode = hour >= 9 && hour < 17 ? "Éco (entre deux réservations)" : "Hors-gel";
      return {
        currentRule: `Entre deux réservations — ${mode}`,
        nextRule: hour < 17 ? "À 17h → Pré-chauffage confort" : "Check-in imminent",
      };
    }
    case "occupied":
      if (hour >= 7 && hour < 20) {
        return { currentRule: "Réservation active — Présence (7h-20h)", nextRule: "À 20h → Confort (nuit)" };
      }
      if (hour >= 20) {
        return {
          currentRule: "Réservation active — Confort (nuit)",
          nextRule: "À 0h → Présence RDC / Confort chambres",
        };
      }
      if (hour < 5) {
        return {
          currentRule: "Réservation active — Nuit (RDC présence, chambres confort)",
          nextRule: "À 5h → Confort partout",
        };
      }
      return { currentRule: "Réservation active — Confort (5h-7h)", nextRule: "À 7h → Mode présence" };
  }
}
