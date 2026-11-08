import {
  createSeo,
  homePath,
  itemPath,
  openGraphLocales,
  sectionPath,
} from "@sejour/socle/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { Locale } from "@/lib/i18n";

/**
 * Le SEO du site : `canonical`, `hreflang`, `og:locale` et le JSON-LD d'article.
 *
 * Le mécanisme vient de `@sejour/socle/lib/seo`. Ce fichier ne déclare plus que **les
 * chemins du site** — c'est la seule chose qui distingue Barbusse d'Albiez de ce point de
 * vue, et c'est une donnée.
 *
 * Ce qui existait avant : six pages qui écrivaient chacune à la main leur bloc
 * `alternates.languages`, soit six listes de six entrées répétées. `/chambres` y avait
 * perdu l'espagnol — cinq langues servies, quatre déclarées — sans que rien ne puisse le
 * signaler, puisqu'aucun des six blocs ne savait que les cinq autres existaient. Une liste
 * écrite à la main finit toujours par diverger ; celle-ci est désormais construite à partir
 * de `LOCALES`.
 *
 * Le JSON-LD **du logement** reste écrit dans la page d'accueil : il décrit une maison de
 * neuf suites au Mans, avec ses coordonnées et ses équipements, et n'a rien de commun avec
 * celui d'un appartement en station au-delà du nom du type schema.org.
 */
const seo = createSeo({ siteUrl: SITE_URL, siteName: "Coliving Barbusse" });

export const { alternatesFor, hreflangMap, articleJsonLd } = seo;

export { openGraphLocales, homePath };

/**
 * L'image de partage par défaut (WhatsApp, Facebook, LinkedIn).
 *
 * Next fusionne les métadonnées **en surface** : une page qui déclare son propre bloc
 * `openGraph` perd celui du layout, image comprise. L'accueil et la page séminaires en
 * déclaraient un sans image — leur lien partagé s'affichait sans vignette dans les cinq langues
 * (audit du 2026-11-08). Chaque bloc `openGraph` de page reprend donc cette constante.
 * Dimensions réelles du fichier (1536 × 1024), et non les 1200 × 630 déclarés jusque-là.
 */
export const DEFAULT_OG_IMAGE = {
  url: `${SITE_URL}/images/house/3-maison-AI.jpg`,
  width: 1536,
  height: 1024,
  alt: "Coliving Barbusse — maison de 9 chambres au Mans",
};

/**
 * Le bloc `openGraph` **complet** d'une page, et son pendant `twitter`.
 *
 * La fusion en surface de Next fait qu'une page qui déclare son `openGraph` perd tout celui du
 * layout — image, `siteName`, `type`. Une page qui n'en déclare pas hérite, elle, du titre et de
 * l'URL **de l'accueil** : un lien partagé vers `/fr/chambres` s'annonçait comme la page d'accueil
 * (relecture du chef de stand, 2026-11-08). Chaque page indexable passe donc par ici.
 */
export function pageOpenGraph(
  locale: Locale,
  { title, description, url }: { title: string; description: string; url: string },
) {
  return {
    title,
    description,
    url,
    siteName: "Coliving Barbusse",
    type: "website" as const,
    images: [DEFAULT_OG_IMAGE],
    ...openGraphLocales(locale),
  };
}

export function pageTwitter({ title, description }: { title: string; description: string }) {
  return {
    card: "summary_large_image" as const,
    title,
    description,
    images: [DEFAULT_OG_IMAGE.url],
  };
}

/** Les 9 suites. Slug commun aux cinq langues. */
export const roomsPath = sectionPath("chambres");

/** La page séminaires. */
export const seminarsPath = sectionPath("seminaires");

/** Conditions de réservation (paiement, annulation, règles) — citées par llms.txt et la page de devis. */
export const conditionsPath = sectionPath("conditions");

/**
 * Le guide d'arrivée, remis aux voyageurs après réservation.
 *
 * Il porte `robots: { index: false }` sur les cinq langues, mais garde ses `hreflang` : une
 * page non indexée reste explorée, et les annonces de langue servent aux voyageurs qui
 * passent d'une version à l'autre depuis le lien qu'on leur a envoyé.
 */
export const arrivalGuidePath = sectionPath("guide-arrivee");

/** L'index du blog. */
export const blogPath = sectionPath("blog");

/**
 * Chemin d'un article. Le slug est commun aux cinq langues : un article n'existe qu'à un
 * seul endroit, seul son contenu est traduit.
 */
export const blogPostPath = (slug: string) => itemPath("blog", slug);

/**
 * Titre et description de la page d'accueil, par langue. Servent aussi de repli au layout
 * (et donc d'`og:title` / `og:description` aux pages qui n'en déclarent pas).
 *
 * Longueurs comptées en caractères réels, selon les recommandations de Bing Webmaster :
 * titre ≤ 65, description entre 120 et 155. Le texte français a été validé mot pour mot par
 * l'hôte ; les autres langues en sont la traduction.
 */
export const HOME_TITLES: Record<Locale, string> = {
  fr: "Location maison 20 personnes au Mans — Coliving Barbusse",
  en: "Holiday home for 20 people in Le Mans — Coliving Barbusse",
  de: "Ferienhaus für 20 Personen in Le Mans — Coliving Barbusse",
  es: "Alquiler de casa para 20 personas en Le Mans — Coliving Barbusse",
  it: "Casa per 20 persone in affitto a Le Mans — Coliving Barbusse",
};

export const HOME_DESCRIPTIONS: Record<Locale, string> = {
  fr: "Maison de 215 m² au Mans : 9 chambres avec douche privative, jusqu'à 20 personnes, à 10 min de la gare TGV. Familles, équipes, séminaires.",
  en: "215 m² house in Le Mans: 9 bedrooms with private shower room, up to 20 people, 10 min from the TGV station. Families, teams, seminars.",
  de: "215 m² großes Haus in Le Mans: 9 Zimmer mit eigenem Duschbad, bis zu 20 Personen, 10 Min. vom TGV-Bahnhof. Familien, Teams, Seminare.",
  es: "Casa de 215 m² en Le Mans: 9 habitaciones con ducha privada, hasta 20 personas, a 10 min de la estación TGV. Familias, equipos, seminarios.",
  it: "Casa di 215 m² a Le Mans: 9 camere con doccia privata, fino a 20 persone, a 10 min dalla stazione TGV. Famiglie, team, seminari.",
};

/** Mentions légales — `noindex`, hors sitemap, liées depuis le pied de page. */
export const legalPath = sectionPath("mentions-legales");
