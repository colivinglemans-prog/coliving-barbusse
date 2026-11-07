import { recordHeartbeat, type ExpectedCron } from "@sejour/socle/lib/heartbeat";
import { redisKey, stringStore } from "./redis";

/**
 * Battement de cœur des crons de Barbusse : chaque cron surveillé écrit son passage dans
 * Redis (`barbusse:heartbeat:<nom>` et `…:ok`), la route publique `/api/health/heartbeat`
 * dit s'il y en a en retard — **le compte seulement**, jamais les noms.
 *
 * Retard accepté = fréquence réelle (cron-job.org, cf. `CLAUDE.md`) plus une marge qui laisse
 * passer **un** passage raté. Un cron qui échoue à chaque tour finit en retard : seul le
 * dernier passage `ok` compte.
 */
export const HEARTBEAT_PREFIX = redisKey("heartbeat");

export const EXPECTED_CRONS = [
  // `0 * * * *` : un passage manqué toléré, pas deux.
  { name: "nuki-sync", maxAgeMinutes: 150 },
  // `*/15 * * * *`.
  { name: "heating-automation", maxAgeMinutes: 45 },
  // `0 * * * *`.
  { name: "water-heater-automation", maxAgeMinutes: 150 },
  // `35 * * * *`, jour et nuit : les heures de silence sont gérées par la route, pas par l'horaire.
  { name: "arrival-readiness", maxAgeMinutes: 150 },
] as const satisfies readonly ExpectedCron[];

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
