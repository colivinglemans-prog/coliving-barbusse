import { createAuth } from "@sejour/socle/lib/auth";
import { createRouteGuard } from "@sejour/socle/lib/auth-guard";

/**
 * Authentification du dashboard — configuration locale du mécanisme du socle.
 *
 * Le JWT, le cookie, le repli de rôle et la résolution des mots de passe nommés vivent dans
 * `@sejour/socle/lib/auth`. Ne restent ici que les valeurs propres à ce site.
 *
 * ⚠️ **Ce module ne doit jamais importer `next/headers`** : `proxy.ts` s'en sert et tourne en
 * runtime edge. La pose et le retrait du cookie sont dans `@sejour/socle/lib/auth-cookie`,
 * importés directement par les deux routes de connexion/déconnexion, qui tournent en Node.
 *
 * Deux points ont changé au passage au socle :
 *
 * 1. **Le repli est `viewer`, plus `admin`.** `getTokenRole` retombait sur `"admin"` dans son
 *    `catch` : un jeton illisible, expiré ou forgé valait les pleins pouvoirs. En cas de
 *    doute, le moins de droits possible — aucune reconnexion légitime n'y perd, `createToken`
 *    pose toujours le claim `role`.
 * 2. `COOKIE_NAME` et `getSecret()` ne sont plus recopiés dans `middleware.ts`,
 *    `bookings/[id]/notes` et `bookings/[id]/nuki-code`. Les deux derniers en étaient des
 *    copies octet pour octet.
 */
export type DashboardRole = "admin" | "viewer";

export const auth = createAuth<DashboardRole>({
  adminRole: "admin",
  restrictedRole: "viewer",
  fallbackRole: "viewer",
  roles: ["admin", "viewer"],
  // `DASHBOARD_PASSWORD_VIEWER`, et toute variable nommée qui le prolonge
  // (`DASHBOARD_PASSWORD_VIEWER_Sylvie`), pour révoquer une personne sans toucher aux autres.
  restrictedPasswordPrefixes: ["DASHBOARD_PASSWORD_VIEWER"],
});

/** Contrôle de rôle dans un handler de route : la deuxième porte, après le proxy. */
export const guard = createRouteGuard(auth);

export const COOKIE_NAME = auth.cookieName;

export const createToken = auth.createToken;
export const verifyToken = auth.verifyToken;

/** Conservé sous son nom d'origine : ses appelants le connaissent ainsi. */
export const getTokenRole = auth.roleFromToken;
