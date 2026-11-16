import { parseClock } from "@sejour/socle/lib/arrival-readiness/schedule";
import { clockOf, STANDARD_HOURS } from "@/lib/stay-hours-rules";

/**
 * `arrivalTime` transmise à la préparation d'arrivée (`toReadinessBooking`).
 *
 * Avec `earliestCheckIn` (« 08:00 », `lib/readiness/config.ts`), une heure antérieure à 17 h
 * **avance** les contrôles de midi, du préchauffage et de 16 h 30. Seule une arrivée **convenue**
 * (`lib/stay-hours.ts`) a ce droit, parce que seule elle avance aussi le chauffage : une heure
 * estimée saisie par un voyageur (Booking) avant 17 h ferait sonner « ne monte pas » à 12 h 30
 * dans une maison qui, à raison, n'a pas encore commencé à chauffer. Elle est donc ignorée
 * (`null`). À partir de 17 h, l'heure annoncée passe telle quelle (arrivée tardive, comme avant).
 */
export function readinessArrivalTime(raw: string | null | undefined, agreedArrivalHour: number | undefined): string | null {
  if (agreedArrivalHour !== undefined) return clockOf(agreedArrivalHour);
  const minutes = parseClock(raw);
  if (minutes === null) return raw ?? null;
  return minutes >= STANDARD_HOURS.arrival * 60 ? raw! : null;
}
