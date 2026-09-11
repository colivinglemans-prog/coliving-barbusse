import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Deux pièges évités ici, et le fichier les documente parce qu'ils se reposent tout seuls.
 *
 * **On ne bloque pas `/api` en entier.** Googlebot exécute le JavaScript de la page : le
 * calendrier de réservation et les encarts de disponibilité des articles appellent
 * `/api/availability`. Interdire ce chemin ne cache rien — l'API ne renvoie que des booléens
 * de disponibilité, déjà affichés — mais fait photographier à Google un calendrier vide,
 * bloqué sur son état de chargement. Seul `/api/dashboard` est privé, et il est de toute
 * façon protégé par le proxy.
 *
 * **Le guide voyageur n'est pas listé ici.** Il porte `robots: { index: false }` dans son
 * `generateMetadata`, sur les cinq langues, et c'est la bonne façon de l'exclure. Le mettre
 * en `Disallow` serait contre-productif : une URL interdite d'exploration ne peut pas être
 * lue, donc son `noindex` n'est jamais vu, et l'URL nue peut malgré tout être indexée si un
 * lien pointe dessus. Pour sortir une page de l'index il faut au contraire **autoriser** son
 * exploration. Les deux lignes qui étaient là ne couvraient d'ailleurs que `/fr` et `/en`,
 * alors que le site sert cinq locales — l'asymétrie trahissait la liste écrite à la main.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/dashboard/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
