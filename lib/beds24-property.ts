/**
 * Identifiants Beds24 de la maison et chemin de l'API publique de disponibilité.
 *
 * Module **sans dépendance** : il est lu à la fois par le serveur (`lib/beds24.ts`,
 * `/api/availability`), par des composants clients (calendrier, encarts d'événement) et par les
 * tests post-déploiement (`tests/deploy/site.ts`). Ces identifiants étaient recopiés en dur
 * dans sept fichiers ; un test qui recopie la valeur à son tour ne verrait pas un changement.
 *
 * - `PROPERTY_ID` : la maison entière (303771). La propriété « à la chambre » 310268 est
 *   supprimée du compte et ne vit plus que dans l'archive (`lib/bookings-archive.ts`).
 * - `ROOM_ID` : l'unique room « Holiday Home » de la maison, celle de `getroomprice.php`.
 */
export const PROPERTY_ID = 303771;
export const ROOM_ID = 633259;

/** Chemin lu par le calendrier public : `mode=map`, bornes `from` et `to` incluses. */
export function availabilityPath(from: string, to: string): string {
  return `/api/availability?mode=map&from=${from}&to=${to}`;
}
