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
      /**
       * En-têtes de sécurité (2026-11-20), toutes pages et routes.
       *
       * `Permissions-Policy` minimale : seulement ce qu'aucune page n'utilise. **Jamais
       * `payment`** : l'iframe de paiement Beds24 du calendrier porte `allow="payment"` (Apple
       * Pay, Google Pay), qu'une politique de la page parente fermerait. Ni `accelerometer`,
       * `gyroscope` ou `picture-in-picture`, demandés par les vidéos du guide d'exercices.
       */
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      /**
       * Le dashboard ne s'affiche jamais dans un cadre (détournement de clic sur le pilotage du
       * chauffage ou les factures). **Lui seul** : les pages publiques restent encadrables, et
       * la page de réservation Beds24, encadrée par le site, n'est pas concernée — ses en-têtes
       * sont ceux de Beds24 (contrôle `frameBlocked` du socle).
       */
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
        ],
      },
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
