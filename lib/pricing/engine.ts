import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import type { LocalEvent } from "@sejour/socle/lib/events";
import type { EngineConfig, EventRule } from "./engine-config";

/**
 * Moteur de prix maison — fonction **pure** : un calendrier, une date, une grille, des
 * événements ; il rend un prix et un séjour minimum par nuit, avec la liste des règles qui
 * les ont produits. Aucune I/O, aucun envoi : le mode simulation est garanti par construction,
 * puisque rien ici ne sait écrire dans Beds24.
 *
 * Ordre de calcul pour une nuit :
 * 1. prix de départ : période fixe (fêtes) > grand événement > base × mois × jour de semaine
 *    (× prime d'événement mineur) ;
 * 2. palier d'anticipation (dernière minute ou prime lointaine) ;
 * 3. nuit isolée entre deux réservations : remise et séjour minimum ramené à la longueur du trou ;
 * 4. bornes : plancher (du mois, ou de l'événement) et plafond.
 *
 * Pas encore de réglage selon le rythme de remplissage : c'est la prochaine étape, une fois que
 * quelques semaines de relevés montreront ce que le rythme « normal » est pour cette maison.
 */

export interface EngineNight {
  price: number;
  minStay: number;
  reasons: string[];
}

export interface EngineInput {
  today: string;
  /** Nuits à tarifer → vendable aujourd'hui. Les nuits non vendables sont tarifées aussi. */
  nights: Record<string, boolean>;
  events: LocalEvent[];
  config: EngineConfig;
}

const keyPrefix = (key: string) => key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "");

function inMonthDayRange(date: string, from: string, to: string): boolean {
  const md = date.slice(5);
  return from <= to ? md >= from && md <= to : md >= from || md <= to;
}

/** Nuits couvertes par un événement : la veille du premier jour jusqu'au dernier jour inclus. */
export function eventNights(e: LocalEvent, extendBefore = 0): string[] {
  const nights: string[] = [];
  for (let d = addDays(e.start, -1 - extendBefore); d <= e.end; d = addDays(d, 1)) nights.push(d);
  return nights;
}

/** Index des événements par nuit : le grand événement l'emporte sur le mineur. */
function indexEvents(events: LocalEvent[], config: EngineConfig) {
  const major = new Map<string, { rule: EventRule; name: string; leadIn: boolean }>();
  const minor = new Map<string, string>();
  for (const e of events) {
    const rule = config.majorEvents.find((r) => keyPrefix(e.key) === r.keyPrefix);
    const eve = addDays(e.start, -1);
    for (const n of eventNights(e, rule?.extendBefore)) {
      if (rule) {
        if (!major.has(n)) major.set(n, { rule, name: e.name, leadIn: n < eve });
      } else if (!minor.has(n)) {
        minor.set(n, e.name);
      }
    }
  }
  return { major, minor };
}

/**
 * Catégorie d'une nuit pour la comparaison avec Beyond : une période fixe ou un grand
 * événement (par son nom), sinon `null` — une nuit « ordinaire ».
 */
export function nightCategories(
  dates: string[],
  events: LocalEvent[],
  config: EngineConfig,
): Map<string, string> {
  const { major } = indexEvents(events, config);
  const out = new Map<string, string>();
  for (const d of dates) {
    const fixed = config.fixedPeriods.find((p) => inMonthDayRange(d, p.from, p.to));
    const ev = major.get(d);
    if (fixed) out.set(d, `${fixed.label} ${d.slice(0, 4)}`);
    else if (ev) out.set(d, ev.name);
  }
  return out;
}

export function computeEnginePrices(input: EngineInput): Record<string, EngineNight> {
  const { today, nights, events, config } = input;
  const { major, minor } = indexEvents(events, config);

  const dates = Object.keys(nights).sort();
  const result: Record<string, EngineNight> = {};

  for (const date of dates) {
    const reasons: string[] = [];
    const month = Number(date.slice(5, 7));
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    let price: number;
    let minStay = config.defaultMinStay;
    let floor = config.floorByMonth[month] ?? 280;
    let ceiling = config.ceiling;

    const fixed = config.fixedPeriods.find((p) => inMonthDayRange(date, p.from, p.to));
    const ev = major.get(date);
    if (fixed) {
      price = fixed.price;
      minStay = fixed.minStay;
      reasons.push(`${fixed.label} ${fixed.price} €`);
    } else if (ev) {
      price = ev.rule.price;
      minStay = ev.rule.minStay;
      floor = ev.leadIn ? (ev.rule.leadInFloor ?? ev.rule.floor) : ev.rule.floor;
      ceiling = config.eventCeiling;
      reasons.push(`${ev.name} ${ev.rule.price} €${ev.leadIn ? " (nuit d'approche)" : ""}`);
    } else {
      const m = config.monthFactor[month] ?? 1;
      const w = config.weekdayFactor[weekday] ?? 1;
      price = config.basePrice * m * w;
      reasons.push(`base ${config.basePrice} × mois ${m.toFixed(2)} × jour ${w.toFixed(2)}`);
      const minorName = minor.get(date);
      if (minorName) {
        price *= config.minorEventFactor;
        reasons.push(`${minorName} ×${config.minorEventFactor}`);
      }
    }

    // Grands événements : prix figé, **sans paliers d'anticipation** — ne pas baisser un
    // événement à l'approche, ni le gonfler au loin (relecture du 2026-11-14).
    const lead = daysBetween(today, date);
    const tier = ev ? undefined : config.leadTime.find((t) => lead >= t.minDays && lead <= t.maxDays);
    if (tier) {
      price *= tier.factor;
      reasons.push(`${tier.label} ×${tier.factor}`);
    }

    /* Trou entre deux nuits non vendables, plus court que le séjour minimum. */
    if (nights[date]) {
      let start = date;
      while (nights[addDays(start, -1)] === true) start = addDays(start, -1);
      let end = date;
      while (nights[addDays(end, 1)] === true) end = addDays(end, 1);
      const boundedBefore = nights[addDays(start, -1)] === false;
      const boundedAfter = nights[addDays(end, 1)] === false;
      const run = daysBetween(start, end) + 1;
      if (boundedBefore && boundedAfter && run < minStay) {
        minStay = run;
        price *= config.gapFactor;
        reasons.push(`trou de ${run} n ×${config.gapFactor}`);
      }
    }

    const bounded = Math.min(ceiling, Math.max(floor, price));
    if (bounded !== price) reasons.push(bounded === floor ? `plancher ${floor} €` : `plafond ${ceiling} €`);
    result[date] = { price: Math.round(bounded), minStay, reasons };
  }
  return result;
}
