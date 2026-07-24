import type { Beds24Booking } from "./types";
import archiveData from "@/data/bookings-archive.json";

/**
 * Historique Beds24 archivé avant suppression de propriétés.
 *
 * La propriété "Coliving Henri Barbusse" (location à la chambre, propertyId 310268) a été
 * supprimée du compte Beds24 pour réduire le coût d'abonnement. Ses réservations n'existent
 * donc plus dans l'API. On les réinjecte ici (sauvegardées via `scripts/beds24-backup.mjs`)
 * pour qu'elles restent visibles dans les dashboards et le moteur fiscal.
 *
 * Le merge se fait dans `getBookings()` ([lib/beds24.ts]) : dédup par `id`, le live gagne.
 * Tant que la propriété existe encore, ses résas live écrasent les archivées (zéro doublon) ;
 * une fois supprimée, les archivées prennent le relais automatiquement.
 */
export const ARCHIVED_PROPERTY_IDS = new Set<number>([310268]);

const ARCHIVE = (archiveData as unknown as Beds24Booking[]).filter((b) =>
  ARCHIVED_PROPERTY_IDS.has(b.propertyId),
);

export interface ArchiveFilter {
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  statuses?: string[];
}

/**
 * Réplique les filtres de `getBookings()` (bornes de dates + statuts) sur les résas archivées.
 * Les comparaisons de dates sont lexicographiques (format ISO YYYY-MM-DD), comme côté API.
 */
export function getArchivedBookings(filter: ArchiveFilter = {}): Beds24Booking[] {
  const statusSet =
    filter.statuses && filter.statuses.length > 0
      ? new Set(filter.statuses.map((s) => s.toLowerCase()))
      : null;

  return ARCHIVE.filter((b) => {
    if (filter.arrivalFrom && b.arrival < filter.arrivalFrom) return false;
    if (filter.arrivalTo && b.arrival > filter.arrivalTo) return false;
    if (filter.departureFrom && b.departure < filter.departureFrom) return false;
    if (filter.departureTo && b.departure > filter.departureTo) return false;
    if (statusSet && !statusSet.has((b.status ?? "").toLowerCase())) return false;
    return true;
  });
}
