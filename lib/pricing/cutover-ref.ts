import refFile from "./cutover-ref.json";
import { effectivePrice } from "./guards";
import type { PriceSnapshot } from "./snapshot";

/**
 * **Référence de bascule** : les prix Beyond publiés la veille de la bascule, figés dans un fichier
 * versionné (`cutover-ref.json`), relu en revue. Rien ne dépend de Redis au moment de l'envoi
 * (relecture Fable et chef-de-stand : un relevé raté ou réécrit le 30/11 ne doit pas bloquer).
 *
 * Grandeur : le **prix effectif** (après la remise de durée attachée au séjour minimum de Beyond),
 * comme les cibles du moteur.
 */
export interface CutoverRef {
  /** Jour de la photo d'origine ; `null` tant que le fichier n'est pas rempli. */
  date: string | null;
  /** Nuit → [prix effectif, séjour minimum Beyond]. */
  nights: Record<string, [price: number, minStay: number]>;
  /** `true` si construite à la volée depuis une photo (envoi à blanc avant le 30/11). */
  provisional?: boolean;
}

export const CUTOVER_REF: CutoverRef = { date: refFile.date, nights: refFile.nights as CutoverRef["nights"] };

/** Construit une référence depuis une photo Beds24 (même règle que le script du 30/11). */
export function refFromSnapshot(snapshot: PriceSnapshot, provisional: boolean): CutoverRef {
  const nights: CutoverRef["nights"] = {};
  for (const [d, [price1, minStay]] of Object.entries(snapshot.days)) {
    if (price1 > 0) nights[d] = [Math.round(effectivePrice(price1, minStay)), minStay];
  }
  return { date: snapshot.date, nights, provisional };
}
