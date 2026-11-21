import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { compressSpans } from "@sejour/socle/lib/beds24-client";
import { getCalendarDays, writeCalendar, type CalendarDay } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { sendPricingAlert } from "@/lib/alerts";
import { LE_MANS_EVENTS } from "@/lib/events";
import { getJson, getRedis, redisKey, setJson } from "@/lib/redis";
import { computeEnginePrices, nightCategories } from "./engine";
import { ENGINE_CONFIG } from "./engine-config";
import { eventFloorOn } from "./guards";
import {
  CUTOVER,
  RAMP_RULE,
  envOptionalNumber,
  markdownFactor,
  markdownStep,
  nextMarkdownDate,
  pushLimits,
  rampTarget,
  validReference,
} from "./cutover";
import { CUTOVER_REF, refFromSnapshot, type CutoverRef } from "./cutover-ref";
import { PRICE_OVERRIDES, anchorPrice, overrideOn, type PriceOverride } from "./overrides";
import { planPush, type CurrentNight, type PushPlan, type TargetNight } from "./push-plan";
import { loadSnapshot } from "./snapshot";

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
const MARKDOWN_PREFIX = redisKey("pricing", "markdown");
/** Posé au premier envoi réel réussi après la bascule : la variation élargie s'arrête alors. */
const CUTOVER_DONE_KEY = redisKey("pricing", "cutover-done");

/** Nuits valides minimales attendues dans la référence (la photo couvre ~365 nuits). */
export const MIN_REFERENCE_NIGHTS = 300;

/** Problèmes de la référence qui interdisent un envoi réel (fail closed). */
export function referenceProblems(ref: CutoverRef | null, today: string): string[] {
  if (!ref) return ["Référence de bascule absente (lib/pricing/cutover-ref.json non rempli)"];
  if (ref.provisional) return ["Référence provisoire : interdite en envoi réel"];
  const valid = Object.values(ref.nights).filter(([p]) => validReference(p)).length;
  const problems: string[] = [];
  if (valid < MIN_REFERENCE_NIGHTS) problems.push(`Référence de bascule incomplète (${valid} nuits valides)`);
  for (const o of PRICE_OVERRIDES) {
    if (typeof o.price === "number" || o.to < today) continue;
    for (let d = o.from; d <= o.to; d = addDays(d, 1)) {
      if (!validReference(ref.nights[d]?.[0])) {
        problems.push(`Référence sans prix valide pour ${o.label} (${d})`);
        break;
      }
    }
  }
  return problems;
}

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
  /** Grands événements à baisse automatique : palier, gel, prochain palier (absent avant le 2026-11-21). */
  markdown?: MarkdownBlock[];
  /** Jour de la référence de bascule utilisée (« provisoire » si construite depuis une photo). */
  reference?: string | null;
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

/** État de la baisse d'un bloc, gardé entre deux envois réels (le palier atteint, s'il est gelé). */
export interface MarkdownState {
  step: number;
  frozen: boolean;
  at: string;
}

export interface MarkdownBlock {
  id: string;
  label: string;
  step: number;
  previousStep: number | null;
  /** Gelé : une nuit du bloc a été vendue (ou l'a été depuis le gel). */
  frozen: boolean;
  sold: boolean;
  /** Prochain palier si rien ne change (`null` : gelé, ou plus de palier avant l'événement). */
  next: string | null;
}

/**
 * Paliers de baisse de chaque grand événement — **pur**. Dès qu'une nuit du bloc est vendue, la
 * baisse s'arrête pour tout le bloc au palier précédent (décision du 2026-11-21) et y reste, même
 * si la nuit se libère ensuite (pas de remontée, pas de reprise automatique).
 */
export function planMarkdown(
  today: string,
  calendar: Readonly<Record<string, { available: boolean }>>,
  states: Readonly<Record<string, MarkdownState | null>>,
  list: readonly PriceOverride[] = PRICE_OVERRIDES,
): MarkdownBlock[] {
  const out: MarkdownBlock[] = [];
  for (const o of list) {
    // Bloc terminé : plus de palier ni d'alerte (relecture Fable).
    if (!o.markdown || o.to < today) continue;
    const nights: string[] = [];
    for (let d = o.from > today ? o.from : today; d <= o.to; d = addDays(d, 1)) nights.push(d);
    const sold = nights.some((d) => calendar[d] !== undefined && !calendar[d].available);
    const prev = states[o.id] ?? null;
    let step: number;
    let frozen: boolean;
    if (prev?.frozen) [step, frozen] = [prev.step, true];
    else if (sold) [step, frozen] = [prev?.step ?? 0, true];
    else [step, frozen] = [markdownStep(today, o.from, o.markdown), false];
    out.push({
      id: o.id,
      label: o.label,
      step,
      previousStep: prev?.step ?? null,
      frozen,
      sold,
      next: frozen ? null : nextMarkdownDate(today, o.from, o.markdown),
    });
  }
  return out;
}

export interface TargetContext {
  /** Référence de bascule (prix Beyond de la veille), `null` si absente. */
  ref: CutoverRef | null;
  /** Palier de baisse par bloc (`planMarkdown`). */
  markdownSteps: Readonly<Record<string, number>>;
}

const NO_CONTEXT: TargetContext = { ref: null, markdownSteps: {} };

/**
 * Construit les cibles, nuit par nuit (prix **effectifs**) :
 * 1. prix forcé : ancré (nombre fixe, ou référence valide, ou repli), baissé de son palier, jamais
 *    sous le plancher du jour ;
 * 2. sinon, la **rampe** pour une nuit ordinaire de `rampFrom` et plus, tant que la date d'envoi
 *    est avant `rampUntil` et que la nuit a une référence valide ;
 * 3. sinon, le moteur.
 */
export function buildTargets(
  today: string,
  calendar: Readonly<Record<string, CalendarDay>>,
  horizonDays: number = PUSH_HORIZON_DAYS,
  ctx: TargetContext = NO_CONTEXT,
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
  // Périodes fixes et grands événements du moteur : jamais rampés (relecture Fable).
  const categories = nightCategories(dates, LE_MANS_EVENTS, ENGINE_CONFIG);
  const reference = (d: string) => {
    const p = ctx.ref?.nights[d]?.[0];
    return validReference(p) ? p : undefined;
  };
  const rampOn = today < CUTOVER.rampUntil;

  const target: Record<string, TargetNight> = {};
  for (const date of dates) {
    const forced = overrideOn(date);
    if (forced) {
      // L'ancre ne descend jamais sous le plancher, même au palier 0 : une nuit de bord que Beyond
      // tarife bas ferait sinon rejeter tout l'envoi (relecture Fable).
      const floor = eventFloorOn(date, today)?.floor ?? 0;
      const anchor = Math.max(anchorPrice(forced, date, reference).price, floor);
      const step = forced.markdown ? (ctx.markdownSteps[forced.id] ?? 0) : 0;
      if (step > 0 && forced.markdown) {
        const price = Math.max(Math.round(anchor * markdownFactor(step, forced.markdown)), floor);
        target[date] = { price, minStay: forced.minStay, source: "markdown" };
      } else {
        target[date] = { price: anchor, minStay: forced.minStay, source: "override" };
      }
      continue;
    }
    const e = engine[date];
    if (!e) continue;
    const ref = reference(date);
    if (rampOn && date >= CUTOVER.rampFrom && !categories.has(date) && ref !== undefined) {
      const price = rampTarget(e.price, ref, today, RAMP_RULE);
      target[date] = { price, minStay: e.minStay, source: price === e.price ? "engine" : "ramp" };
    } else {
      target[date] = { price: e.price, minStay: e.minStay, source: "engine" };
    }
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
    const preflight: string[] = [];

    // Référence de bascule : le fichier versionné. Avant qu'il soit rempli (30/11), un envoi à
    // blanc antérieur à la bascule prend la photo du jour, marquée provisoire ; un envoi réel,
    // jamais (fail closed : relectures cerbere et chef-de-stand).
    let ref: CutoverRef | null = CUTOVER_REF.date ? CUTOVER_REF : null;
    if (!ref && mode === "dry" && from < CUTOVER.startedOn) {
      const snap = await loadSnapshot(from).catch(() => null);
      if (snap) ref = refFromSnapshot(snap, true);
    }
    if (mode === "live") preflight.push(...referenceProblems(ref, from));

    // Paliers de baisse : état gardé dans Redis. Illisible en réel = rejet (on ne devine pas un
    // palier gelé) ; à blanc, on calcule sans état.
    const states: Record<string, MarkdownState | null> = {};
    try {
      for (const o of PRICE_OVERRIDES) {
        if (o.markdown) states[o.id] = await getJson<MarkdownState>(`${MARKDOWN_PREFIX}:${o.id}`);
      }
    } catch {
      if (mode === "live") preflight.push("État des baisses automatiques illisible (Redis)");
    }
    const markdown = planMarkdown(from, calendar, states);
    const markdownSteps = Object.fromEntries(markdown.map((b) => [b.id, b.step]));

    const target = buildTargets(from, calendar, PUSH_HORIZON_DAYS, { ref, markdownSteps });

    // Régime quotidien : cible du jour contre cible de la veille (gardées 14 jours).
    const targets = compact(target);
    const yesterday = await getJson<CompactTargets>(`${TARGETS_PREFIX}:${addDays(from, -1)}`);
    const dailyChanges = countDailyChanges(yesterday, targets, from);
    const saveTargets = () =>
      options.forceDry ? Promise.resolve() : setJson(`${TARGETS_PREFIX}:${from}`, targets, 14 * 24 * 3600);

    // Limites datées (lib/pricing/cutover.ts). Un envoi à blanc d'avant la bascule montre le plan
    // du jour J, avec ses limites.
    const limitsDay = mode === "dry" && from < CUTOVER.startedOn ? CUTOVER.startedOn : from;
    const cutoverDone = await getRedis()
      .get(CUTOVER_DONE_KEY)
      .then((v) => v !== null)
      .catch(() => true);
    const limits = pushLimits(
      limitsDay,
      {
        maxChange: envOptionalNumber(process.env.PRICING_MAX_CHANGE),
        maxDates: envOptionalNumber(process.env.PRICING_MAX_DATES),
      },
      PUSH_HORIZON_DAYS,
      cutoverDone,
    );
    const plan = planPush({ current, target, maxChange: limits.maxChange, maxDates: limits.maxDates, today: from });
    if (preflight.length) {
      plan.status = "rejected";
      plan.rejections.unshift(...preflight);
      plan.writes = {};
      plan.quarantined = [];
    }
    const lines: PushWriteLine[] = Object.entries(plan.writes).map(([date, w]) => ({
      date,
      from: w.before?.price ?? null,
      to: w.price1,
      minStay: w.minStay,
      source: w.source,
    }));
    const warnings = [...limits.warnings, ...(ref?.provisional ? [`Référence provisoire (photo du ${ref.date})`] : [])];
    const planned: Omit<PushRun, "outcome"> = {
      ...base,
      writes: lines.length,
      quarantined: plan.quarantined,
      rejections: plan.rejections,
      warnings,
      unchanged: plan.unchanged,
      dailyChanges,
      sample: lines.slice(0, 20),
      markdown,
      reference: ref ? (ref.provisional ? `${ref.date} (provisoire)` : ref.date) : null,
    };

    if (!preflight.length) await saveTargets();

    let run: PushRun;
    if (plan.status === "rejected") run = { ...planned, outcome: "rejected" };
    else if (lines.length === 0) run = { ...planned, outcome: "nothing" };
    else if (mode === "dry") run = { ...planned, outcome: "dry" };
    else if (await isHalted()) run = { ...planned, outcome: "halted" };
    else run = await writeAndVerify(plan, planned, lines, now, record);

    // Le palier n'est mémorisé qu'une fois réellement en place (écrit, ou rien à écrire en réel) :
    // un envoi coupé ou rejeté le recalcule au passage suivant.
    if (mode === "live" && (run.outcome === "written" || run.outcome === "nothing")) {
      for (const b of markdown) {
        // Une nuit du bloc en quarantaine : le palier n'est pas en place, on ne le mémorise pas.
        const o = PRICE_OVERRIDES.find((x) => x.id === b.id)!;
        if (plan.quarantined.some((q) => q.date >= o.from && q.date <= o.to)) continue;
        const state: MarkdownState = { step: b.step, frozen: b.frozen, at: run.at };
        await setJson(`${MARKDOWN_PREFIX}:${b.id}`, state);
      }
      if (from >= CUTOVER.startedOn) await getRedis().set(CUTOVER_DONE_KEY, run.at).catch(() => undefined);
    }

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
  await setJson(`${JOURNAL_PREFIX}:${planned.at}:intent`, { at: planned.at, lines }, 30 * 24 * 3600);
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
      return { ...planned, outcome: "mismatch", warnings: [...planned.warnings, ...warnings], mismatches };
    }
    return { ...planned, outcome: "written", warnings: [...planned.warnings, ...warnings] };
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
