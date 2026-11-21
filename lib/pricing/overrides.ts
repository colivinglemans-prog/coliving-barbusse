import { MARKDOWN_RULE, type MarkdownRule } from "./cutover";

/**
 * Prix forcés par l'exploitant — ils priment sur le moteur. Liste versionnée, relue en revue :
 * **pas d'interface en v1** (plan du 2026-11-14).
 *
 * Montants **effectifs** (ce que paie le voyageur pour ≤ 9 pers., après remise de durée) :
 * l'envoi en déduit `price1` avec `price1For`. Bornes de nuits incluses.
 *
 * Grands événements 2027 (décision de l'exploitant du 2026-11-21, plan version 2) :
 * - **ancrés sur la référence** de bascule (prix Beyond de la veille, `cutover-ref.json`), avec
 *   un repli chiffré si la nuit y manque ou n'est pas valide ;
 * - **baisse automatique** (`markdown`) : −10 % toutes les 3 semaines dès J-120 tant que rien
 *   n'est vendu, jusqu'au plancher d'`EVENT_FLOORS` ; **dès qu'une nuit du bloc est vendue, la
 *   baisse s'arrête pour tout le bloc**, au palier atteint ;
 * - les 7 et 8/06 suivent la semaine des essais (même bloc, même baisse, même arrêt).
 */
export interface PriceOverride {
  /** Identifiant stable du bloc (clé de l'état de baisse dans Redis). */
  id: string;
  label: string;
  from: string;
  to: string;
  /** Prix effectif visé par nuit, ou ancrage sur la référence de bascule (avec repli). */
  price: number | { reference: true; fallback: number };
  minStay: number;
  reason: string;
  markdown?: MarkdownRule;
}

export const PRICE_OVERRIDES: readonly PriceOverride[] = [
  {
    id: "24h-moto-2027",
    label: "24H Moto",
    from: "2027-04-07",
    to: "2027-04-11",
    price: { reference: true, fallback: 940 },
    minStay: 3,
    reason: "24 Heures Moto 2027 : prix Beyond de la veille de la bascule, puis baisse si invendu (2026-11-21)",
    markdown: MARKDOWN_RULE,
  },
  {
    id: "motogp-2027",
    label: "MotoGP",
    from: "2027-05-13",
    to: "2027-05-16",
    price: { reference: true, fallback: 1_400 },
    minStay: 3,
    reason: "MotoGP France 2027 : prix Beyond de la veille de la bascule, puis baisse si invendu (2026-11-21)",
    markdown: MARKDOWN_RULE,
  },
  {
    id: "essais-2027",
    label: "Semaine des essais",
    from: "2027-05-31",
    to: "2027-06-08",
    price: 1_560,
    minStay: 2,
    reason:
      "Semaine des essais + 7-8/06 : 1 560 € (prix Beyond actuel), baisse auto dès J-120 jusqu'à 900 € " +
      "(plancher abaissé le 30/01/2027), décision du 2026-11-21",
    markdown: MARKDOWN_RULE,
  },
  {
    id: "24h-mans-2027",
    label: "24 Heures",
    from: "2027-06-09",
    to: "2027-06-13",
    price: 2_800,
    minStay: 4,
    reason: "24 Heures du Mans 2027 (déjà vendues) : prix rouvert en cas d'annulation, sans baisse",
  },
  {
    id: "classic-2027",
    label: "Le Mans Classic",
    from: "2027-06-30",
    to: "2027-07-04",
    price: { reference: true, fallback: 1_860 },
    minStay: 4,
    reason: "Le Mans Classic Heritage 2027 : prix Beyond de la veille de la bascule, puis baisse si invendu (2026-11-21)",
    markdown: MARKDOWN_RULE,
  },
];

export function overrideOn(date: string, list: readonly PriceOverride[] = PRICE_OVERRIDES): PriceOverride | null {
  return list.find((o) => date >= o.from && date <= o.to) ?? null;
}

/** Prix d'ancrage d'une nuit (avant baisse) : nombre fixe, ou référence valide, ou repli. */
export function anchorPrice(
  o: PriceOverride,
  date: string,
  reference: (date: string) => number | undefined,
): { price: number; fromReference: boolean } {
  if (typeof o.price === "number") return { price: o.price, fromReference: false };
  const ref = reference(date);
  return ref === undefined ? { price: o.price.fallback, fromReference: false } : { price: ref, fromReference: true };
}
