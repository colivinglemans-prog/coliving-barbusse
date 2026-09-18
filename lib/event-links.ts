import { eventLinkRef } from "./events";
import { getRedis, hasRedis } from "./redis";

/**
 * Les rattachements d'événement **déliés à la main**.
 *
 * `findEventForStay` rattache une réservation à un événement par recouvrement de dates,
 * marge comprise. C'est une heuristique, et elle se trompe : une semaine de chantier qui
 * mord sur le week-end des 24 Heures se retrouve étiquetée « 24h Mans », ce qui fausse le
 * repère des statistiques autant que la lecture du calendrier. Le bouton de la popup écrit
 * ici le démenti, et le démenti gagne toujours sur l'heuristique.
 *
 * **Le couple, pas la réservation.** Ce qui est stocké est `<id>:<clé d'événement>` et non le
 * seul identifiant : « cette réservation n'a rien à voir avec *cet* événement » est ce que
 * dit la croix, et c'est tout ce qu'elle dit. Délier ne fait pas repêcher le candidat suivant
 * — une réservation déliée n'a plus d'événement du tout, jusqu'à ce que l'heuristique en
 * propose un autre le jour où le catalogue bouge.
 *
 * **Redis et non Beds24.** La note interne est le seul champ qu'on sache écrire chez Beds24,
 * et elle est lue par la personne du ménage : y cacher un marqueur technique la salirait. Et
 * surtout, 42 lignes de l'historique n'existent plus dans Beds24 — un séjour archivé doit
 * pouvoir être délié comme les autres. La base de clé-valeur du site (chauffage, crons) sert
 * déjà à ça.
 *
 * **Échec ouvert.** Redis injoignable ⇒ aucun déliement lu, donc l'étiquetage automatique
 * d'origine. C'est le bon sens de la panne : on préfère une étiquette de trop à un calendrier
 * qui ne s'affiche pas.
 */
const KEY = "event-links:unlinked";

/** Tous les couples déliés. Tableau et non `Set` : c'est ce qui part en JSON vers le navigateur. */
export async function getUnlinkedEvents(): Promise<string[]> {
  if (!hasRedis()) return [];
  try {
    return await getRedis().smembers(KEY);
  } catch (e) {
    console.error("[event-links] lecture impossible :", e instanceof Error ? e.message : e);
    return [];
  }
}

/** Délie une réservation de l'événement qu'on lui avait rattaché. Idempotent. */
export async function unlinkEvent(bookingId: number, eventKey: string): Promise<void> {
  await getRedis().sadd(KEY, eventLinkRef(bookingId, eventKey));
}

/** Rétablit un rattachement délié — le rattrapage d'un clic malheureux. Idempotent. */
export async function relinkEvent(bookingId: number, eventKey: string): Promise<void> {
  await getRedis().srem(KEY, eventLinkRef(bookingId, eventKey));
}
