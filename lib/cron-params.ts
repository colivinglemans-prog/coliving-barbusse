/**
 * Mode à blanc d'un cron : `?dry=1` **ou** `?dryRun=1`, partout.
 *
 * `arrival-readiness` n'acceptait que `dryRun`, tous les autres que `dry` : un `?dry=1` lancé
 * pour regarder la préparation d'arrivée faisait un vrai passage (écritures Redis, envois ntfy)
 * — 2026-11-16. Les deux noms valent désormais pour toutes les routes de `app/api/cron`.
 */
export function isDryRun(params: URLSearchParams): boolean {
  return params.get("dry") === "1" || params.get("dryRun") === "1";
}
