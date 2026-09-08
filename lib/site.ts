/**
 * URL publique du site et helpers de partage.
 *
 * SITE_URL est encore redéclaré en dur dans plusieurs pages (metadata SEO) ;
 * on centralise ici ce dont le dashboard a besoin pour partager des liens.
 */
export const SITE_URL = "https://www.coliving-barbusse.fr";

/** Locales servies par le guide d'arrivée (voir app/[locale]/guide-arrivee). */
export const GUIDE_LOCALES = ["fr", "en", "it", "de", "es"] as const;
export type GuideLocale = (typeof GUIDE_LOCALES)[number];

export function guideUrl(locale: GuideLocale): string {
  return `${SITE_URL}/${locale}/guide-arrivee`;
}

/** Pays Beds24 (ISO 3166-1 alpha-2) → langue du guide à mettre en avant. */
const COUNTRY_TO_LOCALE: Record<string, GuideLocale> = {
  FR: "fr",
  BE: "fr",
  CH: "fr",
  LU: "fr",
  MC: "fr",
  IT: "it",
  DE: "de",
  AT: "de",
  ES: "es",
};

/** Langue suggérée pour un voyageur ; anglais par défaut. */
export function guestLocaleFromCountry(country?: string): GuideLocale {
  if (!country) return "en";
  return COUNTRY_TO_LOCALE[country.trim().toUpperCase()] ?? "en";
}
