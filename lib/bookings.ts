import { getBookings } from "./beds24";
import { todayParis, tomorrowParis } from "@sejour/socle/lib/time";
import type { Beds24Booking } from "./types";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";

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
    .filter((b) => !isExcludedStatus(b.status));
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
