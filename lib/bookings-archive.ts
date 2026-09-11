import { createArchive, type ArchiveFilter } from "@sejour/socle/lib/archive";
import type { Beds24Booking } from "./types";
import archiveData from "@/data/bookings-archive.json";

/**
 * Historique Beds24 archivé avant suppression de propriétés.
 *
 * La propriété « Coliving Henri Barbusse » (location à la chambre, propertyId 310268) a été
 * supprimée du compte Beds24 pour réduire le coût d'abonnement. Ses réservations n'existent
 * donc plus dans l'API. On les réinjecte ici (sauvegardées via `scripts/beds24-backup.mjs`)
 * pour qu'elles restent visibles dans les dashboards et le moteur fiscal.
 *
 * Le mécanisme — filtrer comme le fait l'API, puis dédoublonner en laissant gagner le live —
 * vient de `@sejour/socle/lib/archive`. Ne restent ici que le **chargement** (un import
 * statique, possible parce que ce dépôt-ci est privé — celui d'Albiez ne l'est pas et lit son
 * fichier à l'exécution), la **clé** et le **périmètre**.
 *
 * ⚠️ **La fusion ne se fait plus dans `getBookings()`.** Elle est passée dans
 * `lib/bookings.ts`, à la vue des appelants — c'est le placement d'Albiez, et il vaut mieux :
 * un client d'API qui réinjecte en douce des lignes qui ne viennent pas de l'API rend toute
 * mesure de ce qu'il renvoie fausse d'avance.
 */
export const ARCHIVED_PROPERTY_IDS = new Set<number>([310268]);

const archive = createArchive<Beds24Booking>({
  load: () => ({
    items: (archiveData as unknown as Beds24Booking[]).filter((b) =>
      ARCHIVED_PROPERTY_IDS.has(b.propertyId),
    ),
    origin: "paquet",
  }),
  /** L'`id` numérique, que cette archive a conservé — Albiez, lui, n'en a pas et prend `ref`. */
  key: (b) => String(b.id),
  fields: {
    arrival: (b) => b.arrival,
    departure: (b) => b.departure,
    status: (b) => b.status,
  },
});

export type { ArchiveFilter };

/**
 * Ajoute au live les réservations archivées qu'il ne porte pas déjà — dédup par `id`, **le
 * live gagne**. Le filtre réplique celui de `/bookings` (bornes de dates + statuts), en
 * comparaisons lexicographiques puisque les dates sont en ISO, comme côté API.
 *
 * Tant que la propriété existe encore dans Beds24, ses résas live écrasent les archivées
 * (zéro doublon) ; une fois supprimée, les archivées prennent le relais seules.
 *
 * `include` dit ce que l'appelant a réclamé à l'API, et sert à **retirer de l'archive ce
 * qu'il n'a pas demandé**.
 *
 * Symétrie avec l'API : ce qu'on n'a pas demandé n'est pas là. Beds24 ne renvoie `infoItems`
 * et `invoiceItems` que si on les réclame — l'archive, elle, est un JSON local qui les porte
 * toujours, et **37 de ses 42 lignes contiennent un `NUKI_PIN`**. Sans ce filtre, un appelant
 * qui n'a rien demandé reçoit quand même les codes de serrure, uniquement parce que la
 * réservation est ancienne.
 *
 * C'est la fermeture **à la source**, en amont du DTO de `/api/dashboard/bookings`. Les deux
 * existent : celui-ci empêche la donnée d'entrer dans le processus, l'autre l'empêche d'en
 * sortir.
 */
export function withArchive(
  live: Beds24Booking[],
  filter: ArchiveFilter = {},
  include: { infoItems?: boolean; invoiceItems?: boolean } = {},
): Beds24Booking[] {
  const conforme = archive.list(filter).map((b) => {
    const copie = { ...b };
    if (!include.infoItems) delete copie.infoItems;
    if (!include.invoiceItems) delete copie.invoiceItems;
    return copie;
  });
  return archive.merge(live, conforme);
}
