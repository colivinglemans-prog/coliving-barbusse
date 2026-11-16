/**
 * Mode à blanc d'un cron : `?dry=1` **ou** `?dryRun=1`, partout où un mode à blanc existe.
 *
 * `arrival-readiness` n'acceptait que `dryRun`, les autres que `dry` : un `?dry=1` lancé pour
 * regarder la préparation d'arrivée faisait un vrai passage (écritures Redis, envois ntfy) —
 * 2026-11-16. Les deux noms valent désormais pour toutes les routes qui ont un mode à blanc.
 *
 * ⚠️ Les routes de `NO_DRY_MODE` n'en ont **pas** : `?dry=1` y est ignoré et lance un vrai
 * passage (commandes aux radiateurs ou au ballon, notifications, échange des jetons Beds24).
 * Un test (`tests/readiness/heartbeat-coverage.test.ts`) tient cette liste à jour.
 */
export function isDryRun(params: URLSearchParams): boolean {
  return params.get("dry") === "1" || params.get("dryRun") === "1";
}

/** Crons sans mode à blanc : `?dry=1` y lance un vrai passage. */
export const NO_DRY_MODE = [
  "beds24-keepalive",
  "checkin-notifications",
  "heating-automation",
  "heating-health",
  "heating-reset",
  "messages-voyageurs",
  "water-heater-automation",
  "water-heater-health",
] as const;
