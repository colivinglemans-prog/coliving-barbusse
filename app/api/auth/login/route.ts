import { createLoginRoute } from "@sejour/socle/lib/login-route";
import { createLoginLimiter, createRedisLoginAttemptStore } from "@sejour/socle/lib/login-attempts";
import { auth } from "@/lib/auth";
import { sendNtfy } from "@/lib/ntfy";
import { getRedis, hasRedis, redisKey } from "@/lib/redis";

/**
 * Un mot de passe par rôle. `DASHBOARD_PASSWORD` ouvre tout ; n'importe quelle variable
 * commençant par `DASHBOARD_PASSWORD_VIEWER` ouvre l'accès en lecture — ce qui permet d'en
 * donner un différent à chaque personne (`DASHBOARD_PASSWORD_VIEWER_Sylvie`) et d'en révoquer
 * un sans changer celui des autres. La résolution est dans le socle.
 *
 * **Tentatives limitées** (socle v3.31.0, 2026-11-20) : 5 mots de passe faux en 15 min depuis
 * une même IP ⇒ 429 + `Retry-After`, même avec le bon mot de passe ; un succès remet l'adresse à
 * zéro. Compteur partagé entre instances dans Redis (`barbusse:login-failures:<ip>`, expire avec
 * la fenêtre) ; Redis absent ou en panne ⇒ mémoire de l'instance, la connexion n'est jamais
 * bloquée par la panne. **Une seule alerte ntfy** au franchissement, jamais une par refus.
 * Réponses : `{ ok, success, role }` / `{ erreur, error }` — la page de connexion lit `error`.
 */
const limiter = createLoginLimiter({
  store: hasRedis() ? createRedisLoginAttemptStore(getRedis(), redisKey("login-failures")) : undefined,
  notify: (message) =>
    sendNtfy(message, { title: "Dashboard : connexion bloquée", priority: 4, tags: ["lock"] }),
});

export const { POST } = createLoginRoute({ auth, passwordField: "password", limiter });
