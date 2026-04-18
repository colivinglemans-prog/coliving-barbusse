import { getBookings } from "./beds24";
import { todayParis, tomorrowParis } from "./time";
import type { Beds24Booking } from "./types";

const EXCLUDED_STATUSES = new Set(["cancelled", "black"]);

function isExcluded(status: string | undefined): boolean {
  if (!status) return false;
  return EXCLUDED_STATUSES.has(status.toLowerCase());
}

export async function getActiveBookings(): Promise<Beds24Booking[]> {
  const today = todayParis();
  const tomorrow = tomorrowParis();

  const [byDate, active] = await Promise.all([
    getBookings({
      arrivalFrom: today,
      arrivalTo: tomorrow,
      departureFrom: today,
      departureTo: tomorrow,
    }),
    getBookings({ arrivalTo: today, departureFrom: today }),
  ]);

  return [...byDate, ...active]
    .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i)
    .filter((b) => !isExcluded(b.status));
}

export function countGuests(
  bookings: Beds24Booking[],
  today: string,
  hour: number,
): number {
  return bookings
    .filter((b) => {
      const currentlyOccupied = b.arrival < today && b.departure > today;
      const arrivingToday =
        b.arrival === today && b.departure > today && hour >= 12;
      return currentlyOccupied || arrivingToday;
    })
    .reduce((sum, b) => sum + (b.numAdult ?? 0) + (b.numChild ?? 0), 0);
}
