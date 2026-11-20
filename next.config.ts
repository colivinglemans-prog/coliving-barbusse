import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Le socle expose du TypeScript brut : c'est Next qui le compile.
  transpilePackages: ["@sejour/socle"],
  /**
   * L'hôte `coliving-barbusse.vercel.app` est indexé par les moteurs à la place du domaine (relevé par le test
   * voyageur IA-1, 2026-11-07) : 301 vers `https://www.coliving-barbusse.fr`, même chemin et même requête. Règle de
   * routage Vercel, sans invocation de fonction. **Hôte exact** : les previews
   * (`*-git-*`, `*-<hash>-*`) ne sont pas touchées. **`/api/*` exclu** : les crons Vercel ne
   * suivent pas les redirections, et un webhook ou un cron externe peut viser cet hôte.
   */
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "coliving-barbusse.vercel.app" }],
        destination: "https://www.coliving-barbusse.fr/:path",
        statusCode: 301,
      },
    ];
  },
  /**
   * Page Séjour (`/xx/sejour?…`, socle `lib/stay-page`) : chaque séjour est revérifié auprès de
   * Beds24, donc 60 s de cache CDN par URL (canonique, une seule forme), panne comprise — ça
   * protège le quota. Jamais indexée : en-tête en plus de la balise, pour que `curl` le voie.
   */
  async headers() {
    return [
      {
        source: "/:locale(fr|en|de|es|it)/sejour",
        headers: [
          { key: "Vercel-CDN-Cache-Control", value: "s-maxage=60" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a0.muscache.com",
      },
    ],
  },
};

export default nextConfig;
