import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/", "/fr/guide-arrivee", "/en/guide-arrivee"],
    },
    sitemap: "https://www.coliving-barbusse.fr/sitemap.xml",
  };
}
