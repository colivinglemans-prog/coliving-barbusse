import {
  createSeo,
  homePath,
  itemPath,
  openGraphLocales,
  sectionPath,
} from "@sejour/socle/lib/seo";
import { SITE_URL } from "@/lib/site";

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

/** Les 9 suites. Slug commun aux cinq langues. */
export const roomsPath = sectionPath("chambres");

/** La page séminaires. */
export const seminarsPath = sectionPath("seminaires");

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
