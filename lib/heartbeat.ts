import { overdueCrons, recordHeartbeat, type ExpectedCron, type HeartbeatStore } from "@sejour/socle/lib/heartbeat";
import { redisKey, stringStore } from "./redis";

/**
 * Battement de cœur des crons de Barbusse : chaque cron surveillé écrit son passage dans
 * Redis (`barbusse:heartbeat:<nom>` et `…:ok`), la route publique `/api/health/heartbeat`
 * dit s'il y en a en retard — **le compte seulement**, jamais les noms.
 *
 * Retard accepté = cadence **réelle** (cron-job.org, relevée le 2026-11-15 ; `vercel.json` pour
 * les crons Vercel) plus une marge qui laisse passer **un** passage raté, pas deux : trois
 * cadences sous l'heure, deux cadences et demie au-delà, 26 h pour un quotidien. Les
 * hebdomadaires ont ~8 jours (demandé par l'hôte le 2026-11-16) : un lundi raté se voit le mardi.
 * Un cron qui échoue à chaque tour finit en retard : seul le dernier passage `ok` compte.
 *
 * `beat(...)` en fin de passage **réel**, jamais en `dry` / `dryRun`. Un passage sauté par
 * décision (coupe-circuit `…_ENABLED=false`, mode été, rien en `live`) bat `ok` : le
 * planificateur est vivant, c'est ce que le battement mesure.
 */
export const HEARTBEAT_PREFIX = redisKey("heartbeat");

const WEEK_PLUS_A_DAY = 8 * 24 * 60;
const DAY_PLUS_TWO_HOURS = 26 * 60;

export const EXPECTED_CRONS = [
  // `0 * * * *` : un passage manqué toléré, pas deux.
  { name: "nuki-sync", maxAgeMinutes: 150 },
  // `*/15 * * * *` (et 7 h, Vercel).
  { name: "heating-automation", maxAgeMinutes: 45 },
  // `*/15 * * * *` depuis le 2026-11-09 (150 min jusqu'au 2026-11-16, reste de l'ancien horaire).
  { name: "water-heater-automation", maxAgeMinutes: 45 },
  // Grille de la page Tarifs, toutes les heures (cron-job.org).
  { name: "price-grid", maxAgeMinutes: 150 },
  // `35 * * * *`, jour et nuit : les heures de silence sont gérées par la route, pas par l'horaire.
  { name: "arrival-readiness", maxAgeMinutes: 150 },
  // 8 h 10 heure de Paris (cron-job.org), une fois par jour.
  { name: "pricing-push", maxAgeMinutes: DAY_PLUS_TWO_HOURS },
  // `*/10 * * * *`.
  { name: "messages-voyageurs", maxAgeMinutes: 30 },
  { name: "checkin-notifications", maxAgeMinutes: 30 },
  { name: "camera-watch", maxAgeMinutes: 30 },
  { name: "cleaning-watch", maxAgeMinutes: 30 },
  // `*/30 * * * *` (et 8 h, Vercel).
  { name: "heating-health", maxAgeMinutes: 90 },
  // `0 */2 * * *`.
  { name: "water-heater-health", maxAgeMinutes: 300 },
  // `0 */4 * * *`.
  { name: "heating-reset", maxAgeMinutes: 600 },
  // Lundi 4 h : l'échange des refresh tokens Beds24, qui meurent à 30 jours sans usage.
  { name: "beds24-keepalive", maxAgeMinutes: WEEK_PLUS_A_DAY },
  // Lundi 11 h.
  { name: "events-watch", maxAgeMinutes: WEEK_PLUS_A_DAY },
  // Crons Vercel (`vercel.json`) : le plan Hobby les lance n'importe quand dans l'heure prévue.
  { name: "pricing-snapshot", maxAgeMinutes: DAY_PLUS_TWO_HOURS },
  { name: "indexing", maxAgeMinutes: DAY_PLUS_TWO_HOURS },
  { name: "beds24-backup", maxAgeMinutes: WEEK_PLUS_A_DAY },
  { name: "pricing-report", maxAgeMinutes: WEEK_PLUS_A_DAY },
] as const satisfies readonly ExpectedCron[];

/**
 * Les routes de `app/api/cron/` qui ne battent pas, et pourquoi. Un test
 * (`tests/readiness/heartbeat-coverage.test.ts`) échoue si une route n'est ni dans
 * `EXPECTED_CRONS` ni ici : un cron ajouté doit choisir.
 */
export const HEARTBEAT_EXEMPT: Readonly<Record<string, string>> = {
  "pricing-review-reminder":
    "Rappel d'agenda du mardi (Vercel) : rien ne dépend de lui pour un voyageur, et son silence se voit le jour même.",
};

export type MonitoredCron = (typeof EXPECTED_CRONS)[number]["name"];

/** Les clés expirent seules au bout de 30 jours : un cron disparu finit « en retard », pas oublié. */
const TTL_SECONDS = 30 * 24 * 3600;

/** Enregistre un passage. Ne lève jamais : un battement raté ne doit pas faire échouer le cron. */
export async function beat(name: MonitoredCron, outcome: "ok" | "error", now: Date = new Date()): Promise<void> {
  try {
    await recordHeartbeat(stringStore(TTL_SECONDS), HEARTBEAT_PREFIX, name, outcome, now);
  } catch (e) {
    console.error(`[heartbeat] ${name}:`, e instanceof Error ? e.message : e);
  }
}

/** Première fois que la route du battement a vu ce cron dans `EXPECTED_CRONS` (sans expiration). */
const watchedSinceKey = (name: string) => `${HEARTBEAT_PREFIX}:${name}:watched-since`;

/**
 * `overdueCrons` du socle, avec un **délai de grâce au démarrage** : un cron qui n'a encore jamais
 * battu n'est pas déclaré en retard tant que sa surveillance a moins de `maxAgeMinutes`.
 *
 * Sans lui, l'ajout d'un cron à `EXPECTED_CRONS` le ferait sortir « en retard » dès le premier
 * appel de la route après le déploiement (le socle traite une clé absente comme un retard) — un
 * hebdomadaire, jusqu'à six jours avant son premier passage. L'instant de la première vue est
 * posé ici, à la première lecture, sous `…:<nom>:watched-since`, **sans expiration** : quand la
 * clé `…:ok` d'un cron mort depuis 30 jours expire, le délai de grâce est déjà écoulé depuis
 * longtemps, le cron reste en retard (pas de faux « rétabli »).
 */
export async function overdueWithGrace(
  store: HeartbeatStore,
  now: Date,
  expected: readonly ExpectedCron[] = EXPECTED_CRONS,
): Promise<{ overdue: number; names: string[] }> {
  const since = new Map<string, number>();
  for (const { name } of expected) {
    const raw = await store.get(watchedSinceKey(name));
    const at = raw === null ? NaN : Date.parse(raw);
    if (Number.isNaN(at)) {
      await store.set(watchedSinceKey(name), now.toISOString());
      since.set(name, now.getTime());
    } else {
      since.set(name, at);
    }
  }
  const { names } = await overdueCrons(store, HEARTBEAT_PREFIX, expected, now);
  const late: string[] = [];
  for (const name of names) {
    const cron = expected.find((c) => c.name === name)!;
    const neverBeat = (await store.get(`${HEARTBEAT_PREFIX}:${name}:ok`)) === null;
    const inGrace = now.getTime() - (since.get(name) ?? now.getTime()) <= cron.maxAgeMinutes * 60_000;
    if (neverBeat && inGrace) continue;
    late.push(name);
  }
  return { overdue: late.length, names: late };
}
