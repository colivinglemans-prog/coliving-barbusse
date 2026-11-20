/**
 * Ce que le total d'un séjour comprend, en une phrase : sous le prix du calendrier et sur la page
 * de devis. Tout est compris à Barbusse, linge inclus, sur tous les canaux (règle de l'hôte,
 * 19/11/2026) — l'inverse d'Albiez, où le linge est en option.
 */
export const INCLUDED: Record<string, string> = {
  fr: "Draps, serviettes, ménage de fin de séjour et taxe de séjour compris.",
  en: "Bed linen, towels, end-of-stay cleaning and tourist tax included.",
  de: "Bettwäsche, Handtücher, Endreinigung und Kurtaxe inklusive.",
  es: "Ropa de cama, toallas, limpieza final y tasa turística incluidas.",
  it: "Biancheria, asciugamani, pulizia finale e tassa di soggiorno incluse.",
};
