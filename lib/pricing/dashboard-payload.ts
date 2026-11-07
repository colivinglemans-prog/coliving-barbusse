import { addDays } from "@sejour/socle/lib/dates";
import { countsAsSold } from "@sejour/socle/lib/booking-status";
import type { Booking } from "@sejour/socle/lib/booking";
import type { LocalEvent } from "@sejour/socle/lib/events";
import { eventNights, nightCategories } from "./engine";
import type { EngineConfig } from "./engine-config";
import type { EngineComparison } from "./engine-comparison";
import type { PriceSnapshot, ShadowPrices } from "./snapshot";
import type { BookingOfWeek, WeeklyReport } from "./weekly-report";
import { realizedByNight, realizedForEvent } from "./realized";

/**
 * Charge utile de la page `/dashboard/pricing` — fonction **pure**, la route va chercher les
 * données. Tout ce qui se calcule est calculé ici ; le client ne fait que filtrer et dessiner.
 *
 * Page **interne** : les prix du moteur sont une simulation, aucun chiffre d'ici n'a sa place
 * dans `/dashboard/stats`.
 */

export const DECISION_DATE = "2027-01-15";
export const SWITCH_THRESHOLD = 0.8;
/** Premier lundi de relevé : la tendance commence là. */
export const FIRST_MONDAY = "2026-11-09";

/** 0 vendable · 1 vendue · 2 bloquée (non vendable sans réservation qui la couvre). */
export type NightState = 0 | 1 | 2;

/**
 * `[date, prix Beyond, prix moteur, séjour min. Beyond, séjour min. moteur, état, catégorie,
 * réalisé estimé de la nuit J − 364]` — même jour de semaine l'an dernier, `null` si elle n'a pas
 * été vendue (voir `./realized`, c'est une estimation).
 */
export type NightRow = [
  date: string,
  beyond: number,
  engine: number | null,
  minStayBeyond: number,
  minStayEngine: number | null,
  state: NightState,
  category: string | null,
  lastYear: number | null,
];

export interface PricingEventRow {
  key: string;
  name: string;
  start: string;
  end: string;
  confirmed: boolean;
  /** Première et dernière nuit tarifées comme l'événement. */
  firstNight: string;
  lastNight: string;
  beyondAvg: number | null;
  engineAvg: number | null;
  floor: number;
  /** Prix Beyond ÷ médiane du mois hors événements (rapport hebdo), si calculé. */
  monthRatio: number | null;
  soldNights: number;
  totalNights: number;
  /** Réalisé estimé de l'édition précédente (prix de base moyen par nuit vendue). */
  lastEdition: { name: string; avg: number; nights: number } | null;
  /** J-60 : date à laquelle trancher si l'événement n'est pas vendu. */
  decideBy: string;
  status: "vendu" | "partiel" | "invendu";
  /** J-60 dépassé et pas entièrement vendu. */
  overdue: boolean;
}

/** Projection en liste blanche : rien sur l'identité, les contacts ni les codes. */
export interface PricingBookingItem {
  ref: string;
  channel: string;
  arrival: string;
  nights: number;
  guests: number | null;
  gross: number;
  bookedAt: string;
  leadDays: number;
  displayedBase: number | null;
}

export interface PricingPayload {
  today: string;
  /** Date de la photo réellement utilisée (la dernière présente si celle du jour manque). */
  snapshotDate: string;
  decisionDate: string;
  threshold: number;
  report: Omit<WeeklyReport, "bookings">;
  comparison: EngineComparison | null;
  nights: NightRow[];
  /** Raisons du moteur, recalculées avec la grille du jour (affichage seulement). */
  reasons: Record<string, string[]>;
  trend: { date: string; within10Pct: number | null }[];
  events: PricingEventRow[];
  bookings: PricingBookingItem[];
}

const mean = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : null);

/** Les lundis de `FIRST_MONDAY` à `today` inclus. */
export function mondaysUntil(today: string): string[] {
  const out: string[] = [];
  for (let d = FIRST_MONDAY; d <= today; d = addDays(d, 7)) out.push(d);
  return out;
}

export function buildPricingPayload(input: {
  today: string;
  snapshot: PriceSnapshot;
  shadow: ShadowPrices | null;
  stays: Booking[];
  events: LocalEvent[];
  config: EngineConfig;
  report: WeeklyReport;
  comparison: EngineComparison | null;
  reasons: Record<string, string[]>;
  trend: { date: string; within10Pct: number | null }[];
}): PricingPayload {
  const { today, snapshot, shadow, stays, events, config, report, comparison } = input;

  const sold = stays.filter((b) => countsAsSold(b.status));
  const isSold = (d: string) => sold.some((b) => b.arrival <= d && d < b.departure);

  const dates = Object.keys(snapshot.days).sort();
  const categories = nightCategories(dates, events, config);
  const lastYear = dates.length
    ? realizedByNight(stays, addDays(dates[0], -364), addDays(dates.at(-1)!, -364))
    : {};
  const nights: NightRow[] = dates.map((d) => {
    const [price, minStay, available] = snapshot.days[d];
    const e = shadow?.days[d];
    const state: NightState = available === 1 ? 0 : isSold(d) ? 1 : 2;
    return [
      d,
      price,
      e ? e[0] : null,
      minStay,
      e ? e[1] : null,
      state,
      categories.get(d) ?? null,
      lastYear[addDays(d, -364)] ?? null,
    ];
  });

  /* Grands événements encore à venir dans l'horizon de la photo. */
  const horizonEnd = dates.at(-1) ?? today;
  const eventRows: PricingEventRow[] = [];
  for (const e of [...events].sort((a, b) => a.start.localeCompare(b.start))) {
    const rule = config.majorEvents.find((r) => e.key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "") === r.keyPrefix);
    if (!rule || e.end < today || e.start > horizonEnd) continue;
    const covered = eventNights(e, rule.extendBefore).filter((n) => n >= today && snapshot.days[n]);
    if (covered.length === 0) continue;
    const soldNights = covered.filter((n) => snapshot.days[n][2] === 0 && isSold(n)).length;
    const decideBy = addDays(e.start, -60);
    const status = soldNights === covered.length ? "vendu" : soldNights > 0 ? "partiel" : "invendu";
    eventRows.push({
      key: e.key,
      name: e.name,
      start: e.start,
      end: e.end,
      confirmed: e.confirmed,
      firstNight: covered[0],
      lastNight: covered.at(-1)!,
      beyondAvg: round(mean(covered.map((n) => snapshot.days[n][0]))),
      engineAvg: round(mean(covered.flatMap((n) => (shadow?.days[n] ? [shadow.days[n][0]] : [])))),
      floor: rule.floor,
      monthRatio: report.events.find((r) => r.name === e.name)?.ratio ?? null,
      soldNights,
      totalNights: covered.length,
      lastEdition: realizedForEvent(stays, e, events, rule),
      decideBy,
      status,
      overdue: today >= decideBy && status !== "vendu",
    });
  }

  const bookings = report.bookings.map(
    (b: BookingOfWeek) =>
      ({
        ref: b.ref,
        channel: b.channel,
        arrival: b.arrival,
        nights: b.nights,
        guests: b.guests,
        gross: b.gross,
        bookedAt: b.bookedAt,
        leadDays: b.leadDays,
        displayedBase: b.displayedBase,
      }) satisfies PricingBookingItem,
  );

  // Le rapport sort sans ses réservations : elles ne passent que par la projection ci-dessus.
  const { bookings: _omitted, ...reportWithoutBookings } = report;
  void _omitted;

  return {
    today,
    snapshotDate: snapshot.date,
    decisionDate: DECISION_DATE,
    threshold: SWITCH_THRESHOLD,
    report: reportWithoutBookings,
    comparison,
    nights,
    reasons: input.reasons,
    trend: input.trend,
    events: eventRows,
    bookings,
  };
}

function round(n: number | null): number | null {
  return n == null ? null : Math.round(n);
}
