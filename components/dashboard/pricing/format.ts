/**
 * Formats d'affichage de la page Pricing. Recopiés de `@sejour/socle/components/stats/format.ts`,
 * qui est privé au socle (non exporté) : euros entiers, pourcentages sans décimale.
 *
 * ⚠️ Aucune date ne passe par `new Date(iso)` : elles se composent depuis la chaîne
 * `YYYY-MM-DD`, qui est déjà le jour voulu (piège n° 9 du protocole).
 */
const MONTHS_FR = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

export const euros = (n: number | null | undefined) =>
  n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR")} €`;

export const pct = (ratio: number | null | undefined) =>
  ratio == null ? "—" : `${Math.round(ratio * 100)} %`;

export const signedPct = (n: number | null | undefined) =>
  n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n)} %`;

/** « 2027-04-08 » → « 08/04 ». */
export const dayMonth = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** « 2027-04-08 » → « 8 avr. 2027 ». */
export function shortDate(iso: string): string {
  return `${Number(iso.slice(8, 10))} ${MONTHS_FR[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

/** Jour de la semaine d'une date « YYYY-MM-DD », calculé en UTC (sans dépendre du fuseau). */
export function weekday(iso: string): string {
  return ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."][
    new Date(`${iso}T00:00:00Z`).getUTCDay()
  ];
}

/** Couleurs : Beyond et moteur se distinguent aussi par le trait (plein / tirets). */
export const BEYOND_COLOUR = "#334155";
export const ENGINE_COLOUR = "#0d9488";
export const EVENT_FILL = "#e0e7ff";
