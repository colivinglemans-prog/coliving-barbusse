import { createDashboardProxy } from "@sejour/socle/lib/proxy";
import { auth } from "@/lib/auth";

/**
 * Proxy du site — anciennement `middleware.ts`, renommé pour Next 16 où l'ancien nom est
 * déprécié.
 *
 * Trois responsabilités sans rapport entre elles, que Next oblige à loger dans le même
 * fichier. Elles sont ici des **données** passées au socle, plus six tests en ligne répétés :
 *
 * 1. Les anciennes URLs, préfixées par leur langue depuis l'i18n.
 * 2. Le cookie du dashboard, pages **et** routes d'API.
 * 3. Le bornage du rôle `viewer`.
 *
 * ⚠️ Ce fichier tourne en runtime edge. Il n'importe que `@/lib/auth`, qui ne tire pas
 * `next/headers` — les helpers de cookie sont dans un module à part, réservé aux routes Node.
 */
export const proxy = createDashboardProxy({
  auth,
  restrictedRole: "viewer",

  /**
   * Ce que `viewer` a le droit d'atteindre : le calendrier, le chauffage et le chauffe-eau —
   * lecture **et** contrôle pour ces deux derniers, c'est intentionnel et documenté.
   *
   * **Liste blanche, là où le middleware tenait une liste noire de quatre préfixes.** Une
   * liste noire oublie : c'est exactement ainsi que `/api/dashboard/bookings` est resté
   * ouvert. Une route ajoutée demain est fermée au rôle restreint tant qu'on ne l'a pas
   * inscrite ici.
   *
   * `/api/dashboard/bookings` y figure parce que le calendrier s'en nourrit ; c'est la route
   * elle-même qui décide de ce qu'elle projette selon le rôle, et ses deux sous-routes
   * (`notes`, `nuki-code`) refusent le rôle restreint chacune de leur côté. Le proxy ouvre
   * la porte, il ne dit pas ce qui passe dessous.
   */
  allowedPaths: [
    "/dashboard/calendar",
    "/dashboard/heating",
    "/dashboard/water-heater",
    "/api/dashboard/bookings",
    "/api/dashboard/calendar",
    "/api/dashboard/heating",
    "/api/dashboard/water-heater",
    "/api/dashboard/properties",
  ],

  protectedPaths: ["/dashboard", "/api/dashboard"],
  publicPaths: ["/dashboard/login"],
  loginPath: "/dashboard/login",
  restrictedHome: "/dashboard/calendar",

  /**
   * `/:locale/reservation` a disparu en avril 2026 : la page d'accueil de chaque langue
   * embarque déjà le calendrier de disponibilités.
   *
   * ⚠️ Les **cinq** locales sont couvertes. Le `matcher` n'en déclarait que deux (`fr`, `en`)
   * alors que la regex interne en gérait cinq : `/it`, `/de` et `/es/reservation` n'étaient
   * jamais redirigés et rendaient un 404. Le matcher ci-dessous est désormais aligné.
   */
  legacyRedirects: [
    { from: /^\/(fr|en|it|de|es)\/reservation(?:\/.*)?$/, to: "/$1" },
    { from: /^\/reservation(?:\/.*)?$/, to: "/fr" },
    { from: /^(\/blog(?:\/.*)?)$/, to: "/fr$1" },
    { from: /^(\/chambres(?:\/.*)?)$/, to: "/fr$1" },
  ],
});

export const config = {
  matcher: [
    "/blog/:path*",
    "/chambres/:path*",
    "/reservation/:path*",
    "/fr/reservation/:path*",
    "/en/reservation/:path*",
    "/it/reservation/:path*",
    "/de/reservation/:path*",
    "/es/reservation/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/api/dashboard/:path*",
  ],
};
