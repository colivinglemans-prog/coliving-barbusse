import { addDays } from "@sejour/socle/lib/dates";
import type { Booking } from "@sejour/socle/lib/booking";
import type { PriceSnapshot, SnapshotDay } from "@/lib/pricing/snapshot";

/*
 * Données inventées. Le dépôt est public : aucune réservation réelle ici, jamais.
 */

/** Calendrier uniforme du `from` au `to` inclus, puis surcharges nuit par nuit. */
export function calendar(
  from: string,
  to: string,
  overrides: Record<string, SnapshotDay> = {},
  base: SnapshotDay = [200, 2, 1],
): Record<string, SnapshotDay> {
  const days: Record<string, SnapshotDay> = {};
  for (let d = from; d <= to; d = addDays(d, 1)) days[d] = [...base] as SnapshotDay;
  return { ...days, ...overrides };
}

export function snapshot(date: string, days: Record<string, SnapshotDay>): PriceSnapshot {
  return { date, takenAt: `${date}T06:00:00.000Z`, days };
}

let seq = 0;
export function stay(fields: Partial<Booking> & Pick<Booking, "arrival" | "departure" | "nights" | "gross">): Booking {
  seq += 1;
  return {
    ref: `TEST-${seq}`,
    channel: "Direct",
    net: fields.gross,
    commission: 0,
    status: "confirmed",
    bookedAt: null,
    ...fields,
  } as Booking;
}
