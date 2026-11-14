import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { compressSpans } from "@sejour/socle/lib/beds24-client";
import { getCalendarDays, writeCalendar, type CalendarDay } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { sendPricingAlert } from "@/lib/alerts";
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
 * Déroulé : verrou → relecture fraîche du calendrier (en tranches : Beds24 rend 365 jours au
 * plus par appel) → moteur + prix forcés → plan (garde-fous) → journal d'intention → envoi →
 * relecture de contrôle → journal.
 *
 * **Interrupteur à deux clés, fail closed** : on n'écrit pour de vrai que si
 * `PRICING_PUSH_MODE=live` **et** que la clé Redis `barbusse:pricing:halt` n'est pas posée.
 * Variable absente ou inconnue = `off` ; Redis illisible = on ne touche à rien. Un écart à la
 * relecture **pose le halt** et ne renvoie rien : un renvoi automatique ferait une guerre
 * d'écritures si un autre outil (Beyond) écrivait encore. Une panne **pendant** l'envoi pose le
 * halt aussi, et alerte tout de suite.
 */

export type PushMode = "off" | "dry" | "live";

/** Horizon écrit : 365 jours + 30, pour qu'une nuit entre dans la fenêtre déjà au bon prix. */
export const PUSH_HORIZON_DAYS = 395;
/** Une lecture du calendrier Beds24 rend 365 jours au plus. */
const READ_CHUNK_DAYS = 365;

export const HALT_KEY = redisKey("pricing", "halt");
const LOCK_KEY = redisKey("pricing", "push-lock");
const LAST_RUN_KEY = redisKey("pricing", "push-last");
const JOURNAL_PREFIX = redisKey("pricing", "push-journal");
const TARGETS_PREFIX = redisKey("pricing", "push-targets");

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

export interface PushWriteLine {
  date: string;
  from: number | null;
  to: number;
  minStay: number;
  source: string;
}

export interface PushRun {
  at: string;
  mode: PushMode;
  /** Ce qui a réellement été fait : `written` seulement si l'écriture est partie et relue. */
  outcome: "off" | "halted" | "rejected" | "dry" | "written" | "nothing" | "mismatch" | "locked";
  writes: number;
  quarantined: PushPlan["quarantined"];
  rejections: string[];
  warnings: string[];
  mismatches: string[];
  unchanged: number;
  /**
   * Nuits dont la **cible** a changé depuis la veille : le régime quotidien du moteur une fois
   * seul écrivain. C'est ce qui valide le plafond de 60 dates pendant l'envoi à blanc, quand
   * l'écart avec les prix Beyond, lui, reste énorme. `null` sans cible de la veille.
   */
  dailyChanges: number | null;
  /** Échantillon des écritures (20 au plus) pour `push-last` ; le journal garde tout. */
  sample: PushWriteLine[];
}

export async function lastPushRun(): Promise<PushRun | null> {
  return getJson<PushRun>(LAST_RUN_KEY);
}

/** Lit le calendrier sur `days` jours en tranches de 365 (limite d'un appel Beds24), hors cache. */
export async function readCalendar(from: string, days: number): Promise<Record<string, CalendarDay>> {
  const out: Record<string, CalendarDay> = {};
  for (let offset = 0; offset < days; offset += READ_CHUNK_DAYS) {
    const start = addDays(from, offset);
    const end = addDays(from, Math.min(offset + READ_CHUNK_DAYS, days) - 1);
    Object.assign(out, await getCalendarDays(PROPERTY_ID, start, end, { fresh: true }));
  }
  return out;
}

/** Construit les cibles : prix forcé s'il existe, sinon le moteur. Prix **effectifs**. */
export function buildTargets(
  today: string,
  calendar: Readonly<Record<string, CalendarDay>>,
  horizonDays: number = PUSH_HORIZON_DAYS,
): Record<string, TargetNight> {
  // Toutes les nuits de l'horizon. Une nuit que Beds24 n'a pas rendue compte comme **vendable**
  // pour le moteur : la compter fermée fabriquerait un faux trou (×0,85, séjour min. 1) sur la
  // dernière nuit libre lue (relecture Fable).
  const dates = Array.from({ length: horizonDays }, (_, i) => addDays(today, i));
  const engine = computeEnginePrices({
    today,
    nights: Object.fromEntries(dates.map((d) => [d, calendar[d]?.available ?? true])),
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

export type CompactTargets = Record<string, [price: number, minStay: number]>;

function compact(target: Record<string, TargetNight>): CompactTargets {
  return Object.fromEntries(Object.entries(target).map(([d, t]) => [d, [t.price, t.minStay]]));
}

/** Nuits communes, à partir de `from`, dont la cible diffère entre deux jours. */
export function countDailyChanges(yesterday: CompactTargets | null, today: CompactTargets, from: string): number | null {
  if (!yesterday) return null;
  return Object.keys(today).filter(
    (d) => d >= from && yesterday[d] && (yesterday[d][0] !== today[d][0] || yesterday[d][1] !== today[d][1]),
  ).length;
}

type Recorder = (run: PushRun, lines: PushWriteLine[]) => Promise<void>;

export async function runPricingPush(options: {
  today: string;
  now?: Date;
  /** Calcule sans écrire, quel que soit `PRICING_PUSH_MODE` (jamais plus permissif) ; ne touche pas à `push-last`. */
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
    dailyChanges: null,
    sample: [],
  };
  if (mode === "off") return { ...base, outcome: "off" };

  const locked = await getRedis().set(LOCK_KEY, now.toISOString(), { nx: true, ex: 300 });
  if (locked === null) return { ...base, outcome: "locked" };

  const record: Recorder = async (run, lines) => {
    await setJson(`${JOURNAL_PREFIX}:${run.at}`, { ...run, lines });
    if (!options.forceDry) await setJson(LAST_RUN_KEY, run);
  };

  try {
    const from = options.today;
    const calendar = await readCalendar(from, PUSH_HORIZON_DAYS);
    const current: Record<string, CurrentNight> = Object.fromEntries(
      Object.entries(calendar).map(([d, c]) => [d, { price: c.price, minStay: c.minStay }]),
    );
    const target = buildTargets(from, calendar);

    // Régime quotidien : cible du jour contre cible de la veille (gardées 14 jours).
    const targets = compact(target);
    const yesterday = await getJson<CompactTargets>(`${TARGETS_PREFIX}:${addDays(from, -1)}`);
    const dailyChanges = countDailyChanges(yesterday, targets, from);
    if (!options.forceDry) await setJson(`${TARGETS_PREFIX}:${from}`, targets, 14 * 24 * 3600);

    const plan = planPush({
      current,
      target,
      maxChange: envNumber("PRICING_MAX_CHANGE", DEFAULT_MAX_CHANGE, 0.05, 10),
      maxDates: envNumber("PRICING_MAX_DATES", DEFAULT_MAX_DATES, 1, PUSH_HORIZON_DAYS),
    });
    const lines: PushWriteLine[] = Object.entries(plan.writes).map(([date, w]) => ({
      date,
      from: w.before?.price ?? null,
      to: w.price1,
      minStay: w.minStay,
      source: w.source,
    }));
    const planned: Omit<PushRun, "outcome"> = {
      ...base,
      writes: lines.length,
      quarantined: plan.quarantined,
      rejections: plan.rejections,
      unchanged: plan.unchanged,
      dailyChanges,
      sample: lines.slice(0, 20),
    };

    let run: PushRun;
    if (plan.status === "rejected") run = { ...planned, outcome: "rejected" };
    else if (lines.length === 0) run = { ...planned, outcome: "nothing" };
    else if (mode === "dry") run = { ...planned, outcome: "dry" };
    else if (await isHalted()) run = { ...planned, outcome: "halted" };
    else run = await writeAndVerify(plan, planned, lines, now, record);

    await record(run, lines);
    return run;
  } finally {
    await getRedis().del(LOCK_KEY).catch(() => undefined);
  }
}

/** Écrit, relit, et pose le halt sur tout écart **ou** toute panne après le début de l'envoi. */
async function writeAndVerify(
  plan: PushPlan,
  planned: Omit<PushRun, "outcome">,
  lines: PushWriteLine[],
  now: Date,
  record: Recorder,
): Promise<PushRun> {
  const days = Object.fromEntries(
    Object.entries(plan.writes).map(([d, w]) => [d, { price1: w.price1, minStay: w.minStay }]),
  );
  // Journal d'intention : si la fonction meurt pendant l'envoi, on sait ce qui devait partir.
  await setJson(`${JOURNAL_PREFIX}:${planned.at}:intent`, { at: planned.at, lines });
  try {
    const { warnings } = await writeCalendar(compressSpans(days));
    const dates = Object.keys(days).sort();
    const after = await readCalendar(dates[0], daysBetween(dates[0], dates.at(-1)!) + 1);
    const mismatches = dates
      .filter((d) => after[d]?.price !== days[d].price1 || after[d]?.minStay !== days[d].minStay)
      .map(
        (d) =>
          `${d} : attendu ${days[d].price1} €/${days[d].minStay} n, relu ${after[d]?.price ?? "?"} €/${after[d]?.minStay ?? "?"} n`,
      );
    if (mismatches.length || warnings.length) {
      await setHalt(`Écart à la relecture (${mismatches.length} date(s), ${warnings.length} avertissement(s))`, now);
      return { ...planned, outcome: "mismatch", warnings, mismatches };
    }
    return { ...planned, outcome: "written", warnings };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await setHalt(`Panne pendant l'envoi : ${message.slice(0, 160)}`, now).catch(() => undefined);
    await record({ ...planned, outcome: "mismatch", mismatches: [`Panne pendant l'envoi : ${message}`] }, lines).catch(
      () => undefined,
    );
    await sendPricingAlert(
      "Panne pendant l'envoi des prix — envois suspendus",
      `L'envoi a échoué en cours de route : une partie des prix a pu partir.\nLe coupe-circuit est posé.\n\n${message}`,
      4,
    ).catch(() => undefined);
    throw err;
  }
}
