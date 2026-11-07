/**
 * Prix vu par le voyageur, canal par canal, à partir d'un prix de base Beds24.
 *
 * ⚠️ **Ces majorations vivent dans Beds24, pas dans le code.** Elles sont recopiées ici pour
 * l'affichage seulement, avec leur date de relevé et leur source : si Beds24 change, cette table
 * diverge sans bruit — c'est pourquoi la page imprime `CHANNEL_PRICES_AS_OF` à côté des montants.
 * Source : politique tarifaire de juin 2026, Booking relevé à ×1,25 le 2026-09-18, HomeToGo à
 * ×1,2 le 2026-10-20 (voir la section « Pricing multi-canal » de CLAUDE.md).
 */
export const CHANNEL_PRICES_AS_OF = "2026-11-07";

export const CHANNEL_MULTIPLIERS: { channel: string; factor: number; note?: string }[] = [
  { channel: "Direct", factor: 0.93, note: "remise directe −7 %" },
  { channel: "Airbnb", factor: 1, note: "référence" },
  { channel: "Booking", factor: 1.25, note: "Genius −10 % sur les comptes Genius" },
  { channel: "Abritel / VRBO", factor: 1.15 },
  { channel: "HomeToGo", factor: 1.2 },
];

/** Personnes incluses dans le prix de base, et supplément par personne au-delà, par nuit. */
export const GUESTS_INCLUDED = 9;
export const EXTRA_PERSON_PER_NIGHT = 10;

/** Prix d'une nuit sur un canal pour `guests` voyageurs, avant ménage et linge. */
export function nightPriceFor(base: number, factor: number, guests: number): number {
  const extra = Math.max(0, guests - GUESTS_INCLUDED) * EXTRA_PERSON_PER_NIGHT;
  return Math.round((base + extra) * factor);
}
