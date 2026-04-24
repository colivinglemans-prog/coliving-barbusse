import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/lib/blog/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.coliving-barbusse.fr";
  const locales = ["fr", "en"] as const;

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
      alternates: {
        languages: {
          fr: `${baseUrl}/fr${r.path}`,
          en: `${baseUrl}/en${r.path}`,
        },
      },
    })),
  );

  const blogPages: MetadataRoute.Sitemap = locales.flatMap((locale) =>
    BLOG_POSTS.map((post) => ({
      url: `${baseUrl}/${locale}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
      alternates: {
        languages: {
          fr: `${baseUrl}/fr/blog/${post.slug}`,
          en: `${baseUrl}/en/blog/${post.slug}`,
        },
      },
    })),
  );

  return [...staticPages, ...blogPages];
}
