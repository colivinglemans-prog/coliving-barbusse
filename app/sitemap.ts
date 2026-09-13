import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";
import { LOCALES } from "@/lib/i18n";
import {
  blogPath,
  blogPostPath,
  homePath,
  hreflangMap,
  roomsPath,
  seminarsPath,
} from "@/lib/seo";
import { SITE_URL } from "@/lib/site";
import type { PathFor } from "@sejour/socle/lib/seo";

/**
 * Les `hreflang` d'une entrée — la même table que celle posée dans le `<head>` des pages.
 *
 * Elle l'est à dessein : les deux jeux d'annotations décrivent le même ensemble et Google
 * les lit tous les deux. Une clé présente d'un côté et absente de l'autre est une
 * incohérence gratuite, et c'est exactement ce qui arrivait — ce fichier redéclarait sa
 * liste de langues en local, sous un commentaire « doit rester aligné sur SUPPORTED dans
 * app/[locale]/layout.tsx ». Un commentaire n'aligne rien ; un import, si.
 */
const alternates = (pathFor: PathFor) => ({ languages: hreflangMap(pathFor) });

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: {
    pathFor: PathFor;
    changeFrequency: "weekly" | "monthly";
    priority: number;
  }[] = [
    { pathFor: homePath, changeFrequency: "weekly", priority: 1 },
    { pathFor: roomsPath, changeFrequency: "monthly", priority: 0.8 },
    { pathFor: seminarsPath, changeFrequency: "monthly", priority: 0.85 },
    { pathFor: blogPath, changeFrequency: "weekly", priority: 0.7 },
  ];

  const staticPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    staticRoutes.map((r) => ({
      url: `${SITE_URL}${r.pathFor(locale)}`,
      // Pas de `lastModified` sur les pages statiques. Il y avait `new Date()`, donc
      // l'instant du build : le sitemap annonçait à chaque déploiement que les quatre
      // pages venaient d'être modifiées, y compris quand seul un article avait bougé.
      // Un signal qui est toujours vrai ne dit rien, et Google finit par l'ignorer.
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: alternates(r.pathFor),
    })),
  );

  const blogPages: MetadataRoute.Sitemap = LOCALES.flatMap((locale) =>
    // Les éditions passées remplacées par une nouvelle sont en noindex :
    // les lister ici enverrait un signal contradictoire à Google.
    BLOG_POSTS.filter((post) => !post.supersededBy).map((post) => ({
      url: `${SITE_URL}${blogPostPath(post.slug)(locale)}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: alternates(blogPostPath(post.slug)),
    })),
  );

  return [...staticPages, ...blogPages];
}
