import { getBookings, toBooking, type BookingQuery } from "./beds24";
import { withArchive } from "./bookings-archive";
import { todayParis, tomorrowParis } from "@sejour/socle/lib/time";
import type { Booking } from "@sejour/socle/lib/booking";
import type { Beds24Booking } from "./types";
import { isExcludedStatus } from "@sejour/socle/lib/booking-status";

/**
 * Le live **et** l'historique archivé, dédoublonnés, le live gagnant.
 *
 * Cette fusion vivait dans `getBookings()` jusqu'au Lot 2. Elle en sort pour la même raison
 * qu'elle est exposée chez Albiez : un client d'API qui ajoute en silence des lignes que
 * l'API n'a pas renvoyées rend fausse d'avance toute mesure de ce qu'il produit. C'est ce qui
 * avait laissé 37 `NUKI_PIN` d'origine archivée traverser une route qu'on croyait ne servir
 * que du live.
 *
 * Tous les appelants qui avaient l'archive la gardent : ce n'est pas un changement de
 * périmètre, seulement un changement d'endroit où il se décide.
 */
function fusionner(live: Beds24Booking[], params?: BookingQuery): Beds24Booking[] {
  return withArchive(
    live,
    {
      arrivalFrom: params?.arrivalFrom,
      arrivalTo: params?.arrivalTo,
      departureFrom: params?.departureFrom,
      departureTo: params?.departureTo,
      statuses: params?.statuses,
    },
    { infoItems: params?.includeInfoItems, invoiceItems: params?.includeInvoiceItems },
  );
}

export async function getBookingsWithArchive(params?: BookingQuery): Promise<Beds24Booking[]> {
  return fusionner(await getBookings(params), params);
}

/**
 * Les mêmes réservations, ramenées au type canonique `Booking` du socle.
 *
 * C'est l'entrée de tout ce qui **calcule** — revenus, occupation, graphes, fiscal. Ce qui a
 * besoin de `infoItems` ou des 73 champs bruts passe par `getBookingsWithArchive` :
 * facturation, taxe de séjour, code Nuki.
 *
 * **Les lignes de facture sont toujours demandées, et ce n'est pas un paramètre.** `toBooking`
 * en a besoin pour retirer la taxe de séjour du brut ; un appelant qui les oublierait aurait
 * un `gross` taxe comprise sur sa page et hors taxe sur la page d'à côté — 779,01 € d'écart
 * sans message d'erreur. Ce qui n'est pas paramétrable ne s'oublie pas. Les `infoItems`, eux,
 * ne sont jamais demandés : c'est la fermeture à la source des codes de serrure, et rien de
 * l'une ni l'autre liste n'est recopié dans le `Booking`.
 *
 * L'origine est portée par la ligne elle-même : une réservation absente du live vient de
 * l'archive, et le dashboard peut le dire au lieu de le deviner.
 */
export type StaysQuery = Omit<BookingQuery, "includeInvoiceItems" | "includeInfoItems">;

export async function getStays(params?: StaysQuery): Promise<Booking[]> {
  const query: BookingQuery = { ...params, includeInvoiceItems: true, includeInfoItems: false };
  const live = await getBookings(query);
  const liveIds = new Set(live.map((b) => b.id));
  return fusionner(live, query).map((b) =>
    toBooking(b, liveIds.has(b.id) ? "live" : "archive"),
  );
}

export async function getActiveBookings(): Promise<Beds24Booking[]> {
  const today = todayParis();
  const tomorrow = tomorrowParis();

  const [byDate, active] = await Promise.all([
    getBookingsWithArchive({
      arrivalFrom: today,
      arrivalTo: tomorrow,
      departureFrom: today,
      departureTo: tomorrow,
    }),
    getBookingsWithArchive({ arrivalTo: today, departureFrom: today }),
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
