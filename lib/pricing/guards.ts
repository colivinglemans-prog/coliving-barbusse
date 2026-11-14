/**
 * Garde-fous de l'envoi des prix vers Beds24 — **indépendants de la grille du moteur**.
 *
 * Règle gravée (plan du 2026-11-14, cerbere et relecture) : ces constantes ne viennent pas
 * d'`ENGINE_CONFIG` et ne s'assouplissent jamais pour faire passer un envoi. Si un envoi est
 * rejeté, on corrige la grille ou un prix forcé, pas le garde-fou.
 *
 * Tous les montants sont des **prix effectifs** par nuit pour ≤ 9 personnes : ce que paie le
 * voyageur après la remise de durée de Beds24 (voir `effectivePrice`).
 */

/** Bornes absolues : une seule valeur dehors et **tout** l'envoi est rejeté. */
export const ABSOLUTE_BOUNDS = {
  minPrice: 250,
  maxPrice: 3_500,
  minStay: 1,
  maxStay: 7,
} as const;

/**
 * Planchers des grands événements, en prix effectif, **déclarés ici** et pas seulement dans la
 * grille : une grille fausse ne doit pas pouvoir vendre les 24 Heures à 520 €. Bornes de nuits
 * incluses (la nuit du `to` comprise). Ils s'appliquent aussi pendant la bascule.
 */
export const EVENT_FLOORS: readonly { label: string; from: string; to: string; floor: number }[] = [
  { label: "24 Heures Moto 2027", from: "2027-04-07", to: "2027-04-11", floor: 600 },
  { label: "MotoGP France 2027", from: "2027-05-13", to: "2027-05-16", floor: 650 },
  { label: "Semaine des essais 2027", from: "2027-05-31", to: "2027-06-08", floor: 1_560 },
  { label: "24 Heures du Mans 2027", from: "2027-06-09", to: "2027-06-13", floor: 2_220 },
  { label: "Le Mans Classic Heritage 2027", from: "2027-06-30", to: "2027-07-04", floor: 1_050 },
];

/**
 * Remises de durée de Beds24 : des règles de prix **liées à `price1`**, sans champ de dates
 * (lu par l'API le 2026-11-14) — règle 2 « 4 days » ×0,92, règle 3 « 7 nuits » ×0,90, règle 4
 * « 28 nuits » ×0,70. On ne peut pas en exclure les événements : on compense.
 */
export const LENGTH_OF_STAY_DISCOUNTS: readonly { minNights: number; factor: number }[] = [
  { minNights: 28, factor: 0.7 },
  { minNights: 7, factor: 0.9 },
  { minNights: 4, factor: 0.92 },
];

/** Facteur de la remise qui s'applique **à coup sûr** quand le séjour minimum est `minStay`. */
export function guaranteedDiscount(minStay: number): number {
  return LENGTH_OF_STAY_DISCOUNTS.find((d) => minStay >= d.minNights)?.factor ?? 1;
}

/** Prix effectif le plus bas qu'un voyageur peut payer pour une nuit à `price1` / `minStay`. */
export function effectivePrice(price1: number, minStay: number): number {
  return price1 * guaranteedDiscount(minStay);
}

/**
 * `price1` à écrire pour qu'un prix effectif visé soit bien payé : dès un séjour minimum de
 * 4 nuits, chaque vente prend au moins −8 %, donc on écrit `visé ÷ 0,92`.
 */
export function price1For(targetEffective: number, minStay: number): number {
  return Math.round(targetEffective / guaranteedDiscount(minStay));
}

export function eventFloorOn(date: string): { label: string; floor: number } | null {
  const hit = EVENT_FLOORS.find((f) => date >= f.from && date <= f.to);
  return hit ? { label: hit.label, floor: hit.floor } : null;
}

/** Variation maximale par rapport au prix actuel avant quarantaine (paramétrable pour la bascule). */
export const DEFAULT_MAX_CHANGE = 0.25;
/** Nombre maximal de dates modifiées par envoi (paramétrable pour la bascule ou une retouche). */
export const DEFAULT_MAX_DATES = 60;

/** Lit un paramètre numérique d'environnement, borné ; toute valeur illisible rend le défaut. */
export function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= min && raw <= max ? raw : fallback;
}
