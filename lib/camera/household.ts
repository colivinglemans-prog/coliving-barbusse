/**
 * Caméra du garage : pas d'alerte quand quelqu'un de la maison est entré avec son code Intratone
 * (2026-11-18, décision de l'hôte : « pas besoin d'alerte quand le code perso ouvre la porte »).
 *
 * Les voyageurs n'ont pas de code garage : toute ouverture par un code **nommé** (Perso, prénoms des
 * intervenants… — `garageOpenings`, qui écarte déjà les codes nommés par un numéro de réservation) est
 * celle d'une personne de la maison. Un mouvement est alors **expliqué** :
 * - s'il suit une telle ouverture de moins de `AFTER_OPENING_MS`, ou la précède de moins de
 *   `BEFORE_OPENING_MS` ;
 * - ou s'il tombe avant l'échéance de la **chaîne** : la personne travaille au garage (le 17/11,
 *   de 9 h à 18 h d'une seule entrée).
 *
 * La chaîne ne se prolonge (`CHAIN_MS` après le mouvement) que sur un mouvement **significatif**
 * au sens du filtre de scène — du linge qui bouge ne garde jamais le garage « habité » — et jamais
 * au-delà de `MAX_AFTER_OPENING_MS` après la dernière ouverture connue : une chaîne ne survit pas
 * à la journée, un intrus qui viendrait des heures après n'est jamais couvert. Journal Intratone
 * illisible : aucune ouverture connue, la chaîne ne se prolonge plus.
 *
 * Fonction pure ; l'échéance de la chaîne vit dans Redis (`barbusse:camera:household-until:<did>`).
 */
export const AFTER_OPENING_MS = 30 * 60 * 1000;
export const BEFORE_OPENING_MS = 10 * 60 * 1000;
export const CHAIN_MS = 30 * 60 * 1000;
export const MAX_AFTER_OPENING_MS = 12 * 3600 * 1000;

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

/**
 * @param significant le mouvement a changé l'image (filtre de scène) : seul un tel mouvement
 *   prolonge la chaîne.
 */
export function householdVerdict(
  motionMs: number,
  openings: ReadonlyArray<{ at: Date }>,
  until: number | null,
  significant: boolean,
): HouseholdVerdict {
  const nearOpening = openings.some((o) => {
    const t = o.at.getTime();
    return motionMs >= t - BEFORE_OPENING_MS && motionMs <= t + AFTER_OPENING_MS;
  });
  const inChain = until !== null && motionMs <= until;
  if (!nearOpening && !inChain) return { quiet: false, until };
  if (!significant) return { quiet: true, until };

  // Plafond : 12 h après la dernière ouverture connue avant ce mouvement.
  const last = openings.reduce((m, o) => {
    const t = o.at.getTime();
    return t <= motionMs + BEFORE_OPENING_MS && t > m ? t : m;
  }, 0);
  if (last === 0) return { quiet: true, until };
  const extended = Math.min(motionMs + CHAIN_MS, last + MAX_AFTER_OPENING_MS);
  return { quiet: true, until: Math.max(until ?? 0, extended) };
}
