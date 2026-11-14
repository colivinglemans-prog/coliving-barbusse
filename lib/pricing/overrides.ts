/**
 * Prix forcés par l'exploitant — ils priment sur le moteur. Liste versionnée, relue en revue :
 * **pas d'interface en v1** (plan du 2026-11-14) ; une route admin viendra si on force plus d'un
 * prix par semaine.
 *
 * Montants **effectifs** (ce que paie le voyageur pour ≤ 9 pers., après remise de durée) :
 * l'envoi en déduit `price1` avec `price1For`. Bornes de nuits incluses.
 *
 * Les grands événements 2027 sont **figés au milieu entre le moteur et Beyond** (décision de
 * l'exploitant du 2026-11-14), sans paliers d'anticipation. Ces valeurs viennent du relevé du
 * 2026-11-14 ; **elles se recalculent sur le relevé de la veille de la bascule**, et le tableau
 * est montré à l'exploitant avant d'activer l'envoi réel.
 */
export interface PriceOverride {
  from: string;
  to: string;
  /** Prix effectif visé par nuit. */
  price: number;
  minStay: number;
  reason: string;
}

export const PRICE_OVERRIDES: readonly PriceOverride[] = [
  {
    from: "2027-04-07",
    to: "2027-04-11",
    price: 940,
    minStay: 3,
    reason: "24 Heures Moto 2027 : milieu moteur (825) / Beyond (1 053), décision du 2026-11-14",
  },
  {
    from: "2027-05-13",
    to: "2027-05-16",
    price: 1_400,
    minStay: 3,
    reason: "MotoGP France 2027 : milieu moteur (935) / Beyond (1 880), décision du 2026-11-14",
  },
  {
    from: "2027-05-31",
    to: "2027-06-08",
    price: 1_560,
    minStay: 2,
    reason:
      "Semaine des essais + nuits d'approche des 24 Heures : 1 560 € maintenu par l'exploitant " +
      "(2026-11-14), à baisser si rien n'est vendu au 01/04/2027",
  },
  {
    from: "2027-06-09",
    to: "2027-06-13",
    price: 2_800,
    minStay: 4,
    reason: "24 Heures du Mans 2027 (déjà vendues) : prix rouvert en cas d'annulation",
  },
  {
    from: "2027-06-30",
    to: "2027-07-04",
    price: 1_860,
    minStay: 4,
    reason: "Le Mans Classic Heritage 2027 : milieu moteur (1 430) / Beyond (2 293), décision du 2026-11-14",
  },
];

export function overrideOn(date: string, list: readonly PriceOverride[] = PRICE_OVERRIDES): PriceOverride | null {
  return list.find((o) => date >= o.from && date <= o.to) ?? null;
}
