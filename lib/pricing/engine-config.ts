/**
 * Grille du moteur de prix maison — **en simulation** depuis le 2026-11-07 : elle calcule, elle
 * n'envoie rien à Beds24. Le rapport du lundi la compare nuit par nuit aux prix de Beyond,
 * jusqu'à la décision du 2027-01-15.
 *
 * Point de départ : la grille de l'agent « moteur maison » du débat du 2026-11-07, déduite de
 * l'historique 2026 (base réalisée médiane ≈ 520 €, délai médian ≈ 45 j), corrigée de ce que le
 * débat a établi : pas de prime prouvée sur les petits événements (+5 % seulement, à titre de
 * test), et le plancher des 24 Heures au tarif agence (1 800 €/nuit nets → 2 220 € de base,
 * Airbnb étant le canal limitant).
 *
 * Tous les montants sont des **prix de base par nuit pour ≤ 9 personnes**, avant markup canal,
 * personnes supplémentaires, ménage et linge — la même grandeur que `price1` dans Beds24.
 */

export interface EventRule {
  /** Préfixe de la clé `LocalEvent.key`, sans l'année (`24h-moto` pour `24h-moto-2027`). */
  keyPrefix: string;
  /** Prix de base visé sur les nuits de l'événement. */
  price: number;
  /** Plancher que les remises de dernière minute ne franchissent pas. */
  floor: number;
  minStay: number;
  /**
   * Nuits ajoutées avant la veille du premier jour (semaine des 24 Heures). Une valeur
   * négative retire la veille : `-1` fait commencer l'événement la nuit de son premier jour.
   */
  extendBefore?: number;
  /**
   * Plancher des nuits ajoutées par `extendBefore` (avant la veille du premier jour). Sans lui,
   * elles prennent le plancher de l'événement : deux nuits isolées avant les 24 Heures au
   * plancher de la course ne se vendraient jamais (cas des 7-8/06/2027).
   */
  leadInFloor?: number;
}

export interface EngineConfig {
  basePrice: number;
  /** Multiplicateur par mois (1 = janvier). */
  monthFactor: Record<number, number>;
  /** Multiplicateur par nuit de la semaine (0 = dimanche … 6 = samedi). */
  weekdayFactor: Record<number, number>;
  defaultMinStay: number;
  /** Plancher hors événement, par mois. */
  floorByMonth: Record<number, number>;
  ceiling: number;
  eventCeiling: number;
  /** Prime appliquée aux événements du catalogue qui ne sont pas dans `majorEvents`. */
  minorEventFactor: number;
  majorEvents: EventRule[];
  /** Périodes à prix fixe hors catalogue d'événements (fêtes), bornes `MM-DD` incluses. */
  fixedPeriods: { label: string; from: string; to: string; price: number; minStay: number }[];
  /** Paliers d'anticipation : le premier dont `minDays`/`maxDays` contient l'écart s'applique. */
  leadTime: { label: string; minDays: number; maxDays: number; factor: number }[];
  /** Remise sur une nuit isolée entre deux réservations, plus courte que le séjour minimum. */
  gapFactor: number;
}

const uniform = (keys: number[], value: number) =>
  Object.fromEntries(keys.map((k) => [k, value])) as Record<number, number>;

export const ENGINE_CONFIG: EngineConfig = {
  basePrice: 520,
  monthFactor: {
    ...uniform([1, 2, 3], 470 / 520), // janvier-mars : 470 €
    ...uniform([4, 5, 6, 7, 8, 9, 10, 12], 1),
    11: 0.95,
  },
  // Les week-ends se vendent un peu plus cher ; l'historique ne justifie pas davantage.
  weekdayFactor: { 0: 0.97, 1: 0.97, 2: 0.97, 3: 0.97, 4: 1, 5: 1.05, 6: 1.05 },
  defaultMinStay: 2,
  floorByMonth: { ...uniform([1, 2, 3, 11, 12], 280), ...uniform([4, 5, 6, 7, 8, 9, 10], 300) },
  ceiling: 1_000,
  eventCeiling: 3_500,
  minorEventFactor: 1.05,
  majorEvents: [
    // 24 Heures : 2027 vendues à ~2 720 € en 3 jours, à 208 jours → prix relevé (2026-11-14).
    // Prix **effectifs** : l'envoi compense la remise de durée (÷ 0,92) dès un séjour min. ≥ 4.
    { keyPrefix: "24h-mans", price: 2_800, floor: 2_220, minStay: 4, extendBefore: 1, leadInFloor: 1_560 },
    { keyPrefix: "classic", price: 1_300, floor: 1_050, minStay: 4 },
    { keyPrefix: "motogp", price: 850, floor: 650, minStay: 3 },
    { keyPrefix: "24h-moto", price: 750, floor: 600, minStay: 3 },
    // Semaine des essais : parité avec l'option agence (1 430 €/nuit nets ÷ 0,916 en direct),
    // choix de l'exploitant du 2026-11-07, sachant qu'elle s'est vendue ~580 € en 2026.
    { keyPrefix: "test-24h", price: 1_560, floor: 1_560, minStay: 2, extendBefore: -1 },
  ],
  fixedPeriods: [
    // Resserrées sur les vraies nuits de fête (décision de l'exploitant, 2026-11-14).
    { label: "Noël", from: "12-23", to: "12-26", price: 850, minStay: 3 },
    { label: "Nouvel An", from: "12-30", to: "01-01", price: 850, minStay: 3 },
  ],
  leadTime: [
    { label: "J-3", minDays: 0, maxDays: 3, factor: 0.7 },
    { label: "J-7", minDays: 4, maxDays: 7, factor: 0.8 },
    { label: "J-20", minDays: 8, maxDays: 20, factor: 0.9 },
    { label: "+120 j", minDays: 121, maxDays: Infinity, factor: 1.1 },
  ],
  gapFactor: 0.85,
};
