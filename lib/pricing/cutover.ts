import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { ABSOLUTE_BOUNDS, DEFAULT_MAX_CHANGE, DEFAULT_MAX_DATES } from "./guards";

/**
 * Bascule de Beyond vers le moteur maison (plan du 2026-11-21, version 2 après relectures) —
 * fonctions **pures**, sans I/O ni variable d'environnement.
 *
 * - **Rampe** : les nuits ordinaires de 2027 partent du prix Beyond de la veille de la bascule
 *   (la « référence ») et rejoignent le moteur par pas de ±10 % par semaine au plus.
 * - **Baisse par paliers** : une nuit de grand événement figée au prix de référence baisse de 10 %
 *   toutes les 3 semaines à partir de J-120, tant que rien n'est vendu, jusqu'au plancher.
 * - **Limites datées** : le plafond de dates et la tolérance de variation ne sont relevés que pendant
 *   les fenêtres écrites ici, et retombent seuls (relecture cerbere : plus de variable à oublier).
 *
 * Pourquoi des pas de 10 % : PriceLabs recommande de changer le prix de base par paliers de 5 à 10 %,
 * espacés de 2 à 3 semaines (recherche du 2026-11-21).
 *
 * Candidat au socle avec le moteur générique : attend un second appelant (simulation Albiez).
 * Les paramètres sont donc des données (règle 2), jamais des constantes enfouies dans le corps.
 */

export const CUTOVER = {
  /** Premier jour où le moteur écrit pour de vrai. */
  startedOn: "2026-12-01",
  /** Première nuit soumise à la rampe (après le Nouvel An, prix fixe du moteur). */
  rampFrom: "2027-01-02",
  /** Jour d'envoi à partir duquel la rampe ne s'applique plus (convergence garantie avant). */
  rampUntil: "2027-02-01",
} as const;

export interface RampRule {
  startedOn: string;
  stepUp: number;
  stepDown: number;
  everyDays: number;
}

export const RAMP_RULE: RampRule = { startedOn: CUTOVER.startedOn, stepUp: 0.1, stepDown: 0.1, everyDays: 7 };

/** Bande autorisée autour de la référence : elle s'élargit d'un pas par période écoulée. */
export function rampBand(ref: number, today: string, rule: RampRule): { lo: number; hi: number; week: number } {
  // `max(0, …)` : avant la bascule, l'écart est négatif et la bande s'inverserait (relecture Fable).
  const week = Math.max(0, Math.floor(daysBetween(rule.startedOn, today) / rule.everyDays));
  return {
    lo: ref * Math.pow(1 - rule.stepDown, week + 1),
    hi: ref * Math.pow(1 + rule.stepUp, week + 1),
    week,
  };
}

/** Prix du moteur ramené dans la bande de la référence. */
export function rampTarget(engine: number, ref: number, today: string, rule: RampRule): number {
  const { lo, hi } = rampBand(ref, today, rule);
  return Math.round(Math.min(hi, Math.max(lo, engine)));
}

/** Une nuit de référence ne vaut que si son prix est positif et dans les bornes absolues. */
export function validReference(price: number | undefined): price is number {
  return (
    typeof price === "number" &&
    Number.isFinite(price) &&
    price >= ABSOLUTE_BOUNDS.minPrice &&
    price <= ABSOLUTE_BOUNDS.maxPrice
  );
}

export interface MarkdownRule {
  /** Premier palier à J-`startLeadDays` (le jour même). */
  startLeadDays: number;
  everyDays: number;
  step: number;
  /** Fige la baisse à ce palier (négociation en cours, option…). */
  freezeAtStep?: number;
}

export const MARKDOWN_RULE: MarkdownRule = { startLeadDays: 120, everyDays: 21, step: 0.1 };

/** Palier atteint aujourd'hui pour un événement dont la première nuit est `firstNight`. */
export function markdownStep(today: string, firstNight: string, rule: MarkdownRule): number {
  const lead = daysBetween(today, firstNight);
  if (lead > rule.startLeadDays) return 0;
  const k = Math.floor((rule.startLeadDays - lead) / rule.everyDays) + 1;
  return Math.min(k, rule.freezeAtStep ?? Infinity);
}

export function markdownFactor(step: number, rule: MarkdownRule): number {
  return Math.pow(1 - rule.step, step);
}

/** Date du palier suivant (`null` s'il n'y en aura plus avant la première nuit, ou si figé). */
export function nextMarkdownDate(today: string, firstNight: string, rule: MarkdownRule): string | null {
  const step = markdownStep(today, firstNight, rule);
  if (rule.freezeAtStep !== undefined && step >= rule.freezeAtStep) return null;
  const next = addDays(firstNight, -(rule.startLeadDays - step * rule.everyDays));
  return next < firstNight && next > today ? next : null;
}

export interface PushLimits {
  maxChange: number;
  maxDates: number;
  warnings: string[];
}

/**
 * Limites de l'envoi pour `today`.
 * - Le jour de la bascule : variation libre jusqu'à +150 % (décembre monte de +65 %, les fêtes
 *   davantage), toutes les dates de l'horizon.
 * - Pendant la rampe : toutes les dates de l'horizon (la rampe change ~150 nuits chaque semaine).
 * - Sinon : les défauts (0,25 et 60).
 * Une variable d'environnement ne peut que **resserrer** (valeur sous le défaut) ; plus large, elle
 * est ignorée et signalée.
 */
export function pushLimits(
  today: string,
  env: { maxChange?: number; maxDates?: number },
  horizonDays: number,
): PushLimits {
  const warnings: string[] = [];
  const inRamp = today >= CUTOVER.startedOn && today < CUTOVER.rampUntil;
  let maxChange = today === CUTOVER.startedOn ? 1.5 : DEFAULT_MAX_CHANGE;
  let maxDates = inRamp ? horizonDays : DEFAULT_MAX_DATES;

  if (env.maxChange !== undefined) {
    if (env.maxChange < DEFAULT_MAX_CHANGE) maxChange = Math.min(maxChange, env.maxChange);
    else if (env.maxChange > DEFAULT_MAX_CHANGE)
      warnings.push(`PRICING_MAX_CHANGE=${env.maxChange} ignorée (plus large que ${DEFAULT_MAX_CHANGE}) : à retirer de Vercel`);
  }
  if (env.maxDates !== undefined) {
    if (env.maxDates < DEFAULT_MAX_DATES) maxDates = Math.min(maxDates, env.maxDates);
    else if (env.maxDates > DEFAULT_MAX_DATES)
      warnings.push(`PRICING_MAX_DATES=${env.maxDates} ignorée (plus large que ${DEFAULT_MAX_DATES}) : à retirer de Vercel`);
  }
  return { maxChange, maxDates, warnings };
}

/** Lecture brute d'une variable numérique (`undefined` si absente ou illisible). */
export function envOptionalNumber(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
