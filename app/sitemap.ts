import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";
import type { Locale } from "@/lib/i18n/types";

const baseUrl = "https://www.coliving-barbusse.fr";

// Doit rester aligné sur SUPPORTED dans app/[locale]/layout.tsx.
const locales: Locale[] = ["fr", "en", "it", "de", "es"];

/** Construit le bloc hreflang (5 langues + x-default sur le FR) pour un chemin donné. */
function languagesFor(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${baseUrl}/${locale}${path}`;
  }
  languages["x-default"] = `${baseUrl}/fr${path}`;
  return languages;
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "", changeFrequency: "weekly" as const, priority: 1 },
    { path: "/chambres", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/seminaires", changeFrequency: "monthly" as const, priority: 0.85 },
    { path: "/blog", changeFrequency: "weekly" as const, priority: 0.7 },
  ];

  const staticPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    staticRoutes.map((r) => ({
      url: `${baseUrl}/${locale}${r.path}`,
      lastModified: new Date(),
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: { languages: languagesFor(r.path) },
    })),
  );

  const blogPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    // Les éditions passées remplacées par une nouvelle sont en noindex :
    // les lister ici enverrait un signal contradictoire à Google.
    BLOG_POSTS.filter((post) => !post.supersededBy).map((post) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: { languages: languagesFor(`/blog/${post.slug}`) },
    })),
  );

  return [...staticPages, ...blogPages];
}
