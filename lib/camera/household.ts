/**
 * Caméra du garage : pas d'alerte quand quelqu'un de la maison est entré avec son code Intratone
 * (2026-11-18, décision de l'hôte : « pas besoin d'alerte quand le code perso ouvre la porte »).
 *
 * Les voyageurs n'ont pas de code garage : toute ouverture par un code **nommé** (Perso, Sophie,
 * Eric… — `garageOpenings`, qui écarte déjà les codes nommés par un numéro de réservation) est
 * celle d'une personne de la maison. Un mouvement est alors **expliqué** :
 * - s'il suit une telle ouverture de moins de `BEFORE_MS`, ou la précède de moins de `AFTER_MS`
 *   (la caméra voit la personne arriver avant que le journal Intratone ne soit lu) ;
 * - ou s'il suit de moins de `CHAIN_MS` un mouvement déjà expliqué : la personne travaille au
 *   garage, chaque mouvement prolonge la présence (le 17/11, de 9 h à 18 h d'une seule entrée).
 *
 * Fonction pure ; l'échéance de la chaîne vit dans Redis (`barbusse:camera:household-until:<did>`).
 * Journal Intratone illisible : aucune ouverture connue, le mouvement suit la règle normale (alerte).
 */
export const BEFORE_MS = 30 * 60 * 1000;
export const AFTER_MS = 10 * 60 * 1000;
export const CHAIN_MS = 30 * 60 * 1000;

export interface HouseholdVerdict {
  /** Le mouvement est celui d'une personne de la maison : pas d'alerte. */
  quiet: boolean;
  /** Nouvelle échéance de la chaîne (ms epoch), ou l'ancienne si rien n'a changé. */
  until: number | null;
}

export function householdVerdict(
  motionMs: number,
  openings: ReadonlyArray<{ at: Date }>,
  until: number | null,
): HouseholdVerdict {
  const explained =
    (until !== null && motionMs <= until) ||
    openings.some((o) => {
      const t = o.at.getTime();
      return motionMs >= t - AFTER_MS && motionMs <= t + BEFORE_MS;
    });
  return explained ? { quiet: true, until: Math.max(until ?? 0, motionMs + CHAIN_MS) } : { quiet: false, until };
}
