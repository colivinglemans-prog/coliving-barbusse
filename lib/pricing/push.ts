import { addDays } from "@sejour/socle/lib/dates";
import { compressSpans } from "@sejour/socle/lib/beds24-client";
import { getCalendarDays, writeCalendar, type CalendarDay } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { LE_MANS_EVENTS } from "@/lib/events";
import { getJson, getRedis, redisKey, setJson } from "@/lib/redis";
import { computeEnginePrices } from "./engine";
import { ENGINE_CONFIG } from "./engine-config";
import { DEFAULT_MAX_CHANGE, DEFAULT_MAX_DATES, envNumber } from "./guards";
import { overrideOn } from "./overrides";
import { planPush, type CurrentNight, type PushPlan, type TargetNight } from "./push-plan";

/**
 * **La seule porte d'écriture des prix vers Beds24** (plan du 2026-11-14). Appelée par le seul
 * cron `/api/cron/pricing-push` ; aucune route du dashboard n'y mène.
 *
 * Déroulé : verrou → relecture fraîche du calendrier → moteur + prix forcés → plan (garde-fous)
 * → envoi → relecture de contrôle → journal.
 *
 * **Interrupteur à deux clés, fail closed** : on n'écrit pour de vrai que si
 * `PRICING_PUSH_MODE=live` **et** que la clé Redis `barbusse:pricing:halt` n'est pas posée.
 * Variable absente ou inconnue = `off` ; Redis illisible = on ne touche à rien. Un écart à la
 * relecture **pose le halt** et ne renvoie rien : un renvoi automatique ferait une guerre
 * d'écritures si un autre outil (Beyond) écrivait encore.
 */

export type PushMode = "off" | "dry" | "live";

/** Horizon écrit : 365 jours + 30, pour qu'une nuit entre dans la fenêtre déjà au bon prix. */
export const PUSH_HORIZON_DAYS = 395;

export const HALT_KEY = redisKey("pricing", "halt");
const LOCK_KEY = redisKey("pricing", "push-lock");
const LAST_RUN_KEY = redisKey("pricing", "push-last");
const JOURNAL_PREFIX = redisKey("pricing", "push-journal");

export function pushMode(): PushMode {
  const v = process.env.PRICING_PUSH_MODE;
  return v === "live" || v === "dry" ? v : "off";
}

/** `true` si le coupe-circuit est posé **ou** si Redis ne répond pas (fail closed). */
export async function isHalted(): Promise<boolean> {
  try {
    return (await getRedis().get(HALT_KEY)) !== null;
  } catch {
    return true;
  }
}

export interface HaltState {
  since: string;
  reason: string;
}

export async function setHalt(reason: string, now = new Date()): Promise<void> {
  const state: HaltState = { since: now.toISOString(), reason };
  await setJson(HALT_KEY, state);
}

export async function clearHalt(): Promise<void> {
  await getRedis().del(HALT_KEY);
}

export async function haltState(): Promise<HaltState | null> {
  return getJson<HaltState>(HALT_KEY);
}

export interface PushRun {
  at: string;
  mode: PushMode;
  /** Ce qui a réellement été fait : `written` seulement si l'écriture est partie. */
  outcome: "off" | "halted" | "rejected" | "dry" | "written" | "nothing" | "mismatch" | "locked";
  writes: number;
  quarantined: PushPlan["quarantined"];
  rejections: string[];
  warnings: string[];
  mismatches: string[];
  unchanged: number;
  /** Échantillon des écritures (20 au plus), pour le journal et le dashboard. */
  sample: { date: string; from: number | null; to: number; minStay: number; source: string }[];
}

export async function lastPushRun(): Promise<PushRun | null> {
  return getJson<PushRun>(LAST_RUN_KEY);
}

/** Construit les cibles : prix forcé s'il existe, sinon le moteur. Prix **effectifs**. */
export function buildTargets(
  today: string,
  calendar: Readonly<Record<string, CalendarDay>>,
  horizonDays: number = PUSH_HORIZON_DAYS,
): Record<string, TargetNight> {
  // Toutes les nuits de l'horizon, y compris celles que Beds24 n'a pas rendues : une lecture
  // s'arrête à 365 jours, et ce sont justement les nuits qui vont entrer dans la fenêtre de
  // réservation. Une nuit non lue compte comme non vendable pour le moteur.
  const dates = Array.from({ length: horizonDays }, (_, i) => addDays(today, i));
  const engine = computeEnginePrices({
    today,
    nights: Object.fromEntries(dates.map((d) => [d, calendar[d]?.available ?? false])),
    events: LE_MANS_EVENTS,
    config: ENGINE_CONFIG,
  });
  const target: Record<string, TargetNight> = {};
  for (const date of dates) {
    const forced = overrideOn(date);
    if (forced) target[date] = { price: forced.price, minStay: forced.minStay, source: "override" };
    else if (engine[date]) target[date] = { price: engine[date].price, minStay: engine[date].minStay, source: "engine" };
  }
  return target;
}

export async function runPricingPush(options: {
  today: string;
  now?: Date;
  /** Calcule et journalise sans écrire, quel que soit `PRICING_PUSH_MODE` (jamais plus permissif). */
  forceDry?: boolean;
}): Promise<PushRun> {
  const now = options.now ?? new Date();
  const mode: PushMode = options.forceDry ? "dry" : pushMode();
  const base: Omit<PushRun, "outcome"> = {
    at: now.toISOString(),
    mode,
    writes: 0,
    quarantined: [],
    rejections: [],
    warnings: [],
    mismatches: [],
    unchanged: 0,
    sample: [],
  };
  if (mode === "off") return { ...base, outcome: "off" };

  const locked = await getRedis().set(LOCK_KEY, now.toISOString(), { nx: true, ex: 300 });
  if (locked === null) return { ...base, outcome: "locked" };

  try {
    const from = options.today;
    const to = addDays(from, PUSH_HORIZON_DAYS - 1);
    const calendar = await getCalendarDays(PROPERTY_ID, from, to, { fresh: true });
    const current: Record<string, CurrentNight> = Object.fromEntries(
      Object.entries(calendar).map(([d, c]) => [d, { price: c.price, minStay: c.minStay }]),
    );
    const plan = planPush({
      current,
      target: buildTargets(from, calendar),
      maxChange: envNumber("PRICING_MAX_CHANGE", DEFAULT_MAX_CHANGE, 0.05, 10),
      maxDates: envNumber("PRICING_MAX_DATES", DEFAULT_MAX_DATES, 1, PUSH_HORIZON_DAYS),
    });
    const sample = Object.entries(plan.writes)
      .slice(0, 20)
      .map(([date, w]) => ({ date, from: w.before?.price ?? null, to: w.price1, minStay: w.minStay, source: w.source }));
    const planned = {
      ...base,
      writes: Object.keys(plan.writes).length,
      quarantined: plan.quarantined,
      rejections: plan.rejections,
      unchanged: plan.unchanged,
      sample,
    };

    let run: PushRun;
    if (plan.status === "rejected") run = { ...planned, outcome: "rejected" };
    else if (planned.writes === 0) run = { ...planned, outcome: "nothing" };
    else if (mode === "dry") run = { ...planned, outcome: "dry" };
    else if (await isHalted()) run = { ...planned, outcome: "halted" };
    else {
      const days = Object.fromEntries(
        Object.entries(plan.writes).map(([d, w]) => [d, { price1: w.price1, minStay: w.minStay }]),
      );
      const { warnings } = await writeCalendar(compressSpans(days));
      // Relecture hors cache, sur la plage écrite : la réponse acceptée ne prouve rien.
      const dates = Object.keys(days).sort();
      const after = await getCalendarDays(PROPERTY_ID, dates[0], dates.at(-1)!, { fresh: true });
      const mismatches = dates.filter(
        (d) => after[d]?.price !== days[d].price1 || after[d]?.minStay !== days[d].minStay,
      ).map((d) => `${d} : attendu ${days[d].price1} €/${days[d].minStay} n, relu ${after[d]?.price ?? "?"} €/${after[d]?.minStay ?? "?"} n`);
      if (mismatches.length || warnings.length) {
        await setHalt(
          `Écart à la relecture (${mismatches.length} date(s), ${warnings.length} avertissement(s))`,
          now,
        );
        run = { ...planned, outcome: "mismatch", warnings, mismatches };
      } else {
        run = { ...planned, outcome: "written", warnings };
      }
    }

    await setJson(LAST_RUN_KEY, run);
    await setJson(`${JOURNAL_PREFIX}:${run.at}`, run);
    return run;
  } finally {
    await getRedis().del(LOCK_KEY).catch(() => undefined);
  }
}
