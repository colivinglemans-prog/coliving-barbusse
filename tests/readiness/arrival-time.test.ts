/**
 * Préparation d'arrivée : seule une arrivée **convenue** avance les contrôles. Une heure estimée
 * saisie par un voyageur avant 17 h ne change rien aux passages (comme avant le socle v3.26.0).
 * Réservation inventée.
 */
import { describe, expect, it } from "vitest";
import { passesAt } from "@sejour/socle/lib/arrival-readiness/schedule";
import type { ReadinessBooking } from "@sejour/socle/lib/arrival-readiness/types";
import { parisInstant } from "@sejour/socle/lib/time";
import { READINESS_SCHEDULE } from "@/lib/readiness/config";
import { readinessArrivalTime } from "@/lib/readiness/arrival-time";

const DAY = "2027-01-08";
const stay = (arrivalTime: string | null): ReadinessBooking => ({
  bookingId: 1000001,
  arrival: DAY,
  departure: "2027-01-10",
  guests: 12,
  firstName: "Test",
  arrivalTime,
  status: "confirmed",
});

/** Le planning d'`origin/main` (f7f31f4) : pas d'`earliestCheckIn`. */
const { earliestCheckIn: _ignored, ...BEFORE } = READINESS_SCHEDULE;
void _ignored;

/** Toutes les 5 minutes, de la veille au lendemain. */
function timeline(booking: ReadinessBooking, schedule: typeof READINESS_SCHEDULE) {
  const out: string[] = [];
  for (let t = parisInstant("2027-01-07", 0).getTime(); t < parisInstant("2027-01-09", 12).getTime(); t += 5 * 60_000) {
    for (const p of passesAt(new Date(t), [booking], schedule)) out.push(`${new Date(t).toISOString()} ${p.kind}`);
  }
  return out;
}

describe("readinessArrivalTime", () => {
  it("sans accord : avant 17 h ignorée, à partir de 17 h transmise telle quelle", () => {
    expect(readinessArrivalTime("14:00", undefined)).toBeNull();
    expect(readinessArrivalTime("16h30", undefined)).toBeNull();
    expect(readinessArrivalTime("17:00", undefined)).toBe("17:00");
    expect(readinessArrivalTime("21:30", undefined)).toBe("21:30");
    expect(readinessArrivalTime(null, undefined)).toBeNull();
  });

  it("avec accord : l'heure convenue, quelle que soit l'heure annoncée", () => {
    expect(readinessArrivalTime("21:30", 14)).toBe("14:00");
    expect(readinessArrivalTime(null, 9)).toBe("09:00");
  });

  it("réservation standard annoncée à 14:00 : passages identiques à origin/main", () => {
    const now = timeline(stay(readinessArrivalTime("14:00", undefined)), READINESS_SCHEDULE);
    const before = timeline(stay("14:00"), BEFORE as typeof READINESS_SCHEDULE);
    expect(now).toEqual(before);
    expect(now.some((l) => l.endsWith("noon"))).toBe(true);
  });

  it("arrivée convenue à 14 h : les contrôles avancent (le chauffage aussi)", () => {
    const now = timeline(stay(readinessArrivalTime(null, 14)), READINESS_SCHEDULE);
    const before = timeline(stay(null), READINESS_SCHEDULE);
    expect(now).not.toEqual(before);
  });
});
