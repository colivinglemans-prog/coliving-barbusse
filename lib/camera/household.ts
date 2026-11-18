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

/**
 * Priorité d'un mouvement au garage (2026-11-18, décision de l'hôte) : le garage n'est pas un
 * espace des voyageurs, donc 4 même pendant un séjour — sauf la nuit (22 h-8 h, heure de Paris
 * du mouvement), où un séjour le ramène à 2, sans son, le temps de recalibrer le filtre d'image de
 * nuit (un faux positif IR est passé le 17/11 à 22 h 51). Maison vide : toujours 4.
 */
export const GARAGE_NIGHT = { from: 22, to: 8 } as const;

export function garagePriority(stayInProgress: boolean, parisHour: number): 2 | 4 {
  if (!stayInProgress) return 4;
  const night = parisHour >= GARAGE_NIGHT.from || parisHour < GARAGE_NIGHT.to;
  return night ? 2 : 4;
}

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
