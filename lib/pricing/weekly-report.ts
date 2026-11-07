import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { countsAsSold, soldBookings } from "@sejour/socle/lib/booking-status";
import type { Booking } from "@sejour/socle/lib/booking";
import type { LocalEvent } from "@sejour/socle/lib/events";
import {
  diffSnapshots,
  type PriceSnapshot,
  type SnapshotDiff,
} from "./snapshot";

/**
 * Rapport hebdomadaire d'évaluation du pricing.
 *
 * Il répond à une seule question : **Beyond gagne-t-il son 1 % ?** Pour cela il met côte à
 * côte ce que l'outil a fait (prix et séjours minimum modifiés, à quelle distance de la nuit,
 * dans quel sens), ce que le marché a répondu (nuits vendues, à quel prix affiché, rythme de
 * remplissage comparé à la même date l'an dernier) et la façon dont les événements du Mans
 * sont tarifés — c'est là que se fait le chiffre de cette maison.
 *
 * Fonction **pure** : les photos, les réservations et le catalogue d'événements lui sont
 * passés. La route cron va les chercher, ce module ne fait que calculer.
 *
 * Les prix sont ceux du calendrier Beds24 : nuit de base pour ≤ 9 personnes, **avant**
 * markup canal, personnes supplémentaires, ménage et linge. Ils ne se comparent donc pas au
 * montant payé, seulement entre eux.
 */

export interface WeeklyReportInput {
  today: string;
  /** Photos des 8 derniers jours (aujourd'hui et les 7 précédents), dans l'ordre, `null` si absente. */
  snapshots: { date: string; snapshot: PriceSnapshot | null }[];
  /** Réservations vivantes et archivées couvrant au moins [aujourd'hui − 1 an, aujourd'hui + 180 j]. */
  stays: Booking[];
  events: LocalEvent[];
}

export interface WindowStat {
  days: number;
  /** Nuits non vendables aujourd'hui (réservées ou bloquées) sur [aujourd'hui, +days), `null` sans photo du jour. */
  bookedNow: number | null;
  /** Les mêmes nuits il y a 7 jours — l'écart est le remplissage de la semaine. */
  bookedWeekAgo: number | null;
  /** Nuits de maison réservées l'an dernier sur la fenêtre équivalente, à la date équivalente. */
  bookedLastYear: number | null;
  /** Prix moyen des nuits encore vendables, aujourd'hui. */
  avgPriceNow: number | null;
  /** Prix moyen des **mêmes** nuits dans la photo d'il y a 7 jours. */
  avgPriceWeekAgo: number | null;
}

export interface EventPricing {
  name: string;
  confirmed: boolean;
  start: string;
  end: string;
  /** Prix moyen par nuit sur l'événement (veille comprise : on arrive la veille). */
  avgPrice: number;
  /** Médiane des nuits du même mois hors événement — le repère. */
  monthMedian: number;
  ratio: number;
  /** Nuits de l'événement déjà vendues. */
  soldNights: number;
  totalNights: number;
}

export interface BookingOfWeek {
  ref: string;
  channel: string;
  arrival: string;
  nights: number;
  guests: number | null;
  gross: number;
  bookedAt: string;
  leadDays: number;
  /** Somme des prix de base affichés la veille de la réservation, si la photo existe. */
  displayedBase: number | null;
}

/**
 * Objectif annuel de CA brut — celui que Beyond affiche dans ses revues (100 000 €, revue du
 * 2026-10-17). Le reprendre permet de lire les deux rapports côte à côte.
 */
export const REVENUE_GOAL = 100_000;
/**
 * Commission Beyond (plan Growth, 1 % des réservations). ⚠️ Beyond la prélève aussi sur les
 * contrats négociés à la main — l'agence des 24 Heures 2026, Spartner 2027 (« Rev. on books
 * 10 704 € » dans sa liste d'événements) — où son prix n'a joué aucun rôle.
 */
export const BEYOND_FEE_RATE = 0.01;

export interface RevenueStat {
  /** CA brut (hors taxe de séjour) des séjours commencés depuis le 1er janvier — l'« YTD » de Beyond. */
  ytd: number;
  /** Même mesure, l'an dernier à la même date. */
  ytdLastYear: number;
  /** CA brut de tous les séjours de l'année, commencés ou à venir. */
  yearOnBooks: number;
  goal: number;
  /** CA réservé sur les nuits des 90 prochains jours ÷ 90 — le « RevPAN » de Beyond. */
  revpan90: number;
  /** Coût Beyond estimé sur l'année : `yearOnBooks × BEYOND_FEE_RATE`. */
  beyondCostYear: number;
}

export interface WeeklyReport {
  today: string;
  revenue: RevenueStat;
  snapshotsAvailable: number;
  snapshotsExpected: number;
  activity: {
    /**
     * Modifications **réelles** : au moins 3 % ou 15 €. En dessous, ce sont les
     * « micro-price adjustments for visibility » de Beyond, qui font bouger le prix de quelques
     * euros chaque jour — comptées à part dans `microChanges` pour ne pas noyer les décisions.
     */
    priceChanges: number;
    microChanges: number;
    priceUps: number;
    priceDowns: number;
    /** Variation médiane en %, signée, sur les modifications réelles. */
    medianChangePct: number | null;
    /** Modifications par tranche de distance à la nuit. */
    byLead: { label: string; changes: number; medianPct: number | null }[];
    minStayChanges: number;
  };
  sold: { nights: number; avgDisplayedPrice: number | null; avgLeadDays: number | null };
  released: number;
  windows: WindowStat[];
  events: EventPricing[];
  bookings: BookingOfWeek[];
}

/** Seuils sous lesquels une modification est un micro-ajustement (les deux à la fois). */
const MICRO_PCT = 3;
const MICRO_EUROS = 15;

const LEAD_BUCKETS: { label: string; max: number }[] = [
  { label: "0-14 j", max: 14 },
  { label: "15-30 j", max: 30 },
  { label: "31-90 j", max: 90 },
  { label: "91-180 j", max: 180 },
  { label: "180 j+", max: Infinity },
];

const round = (n: number) => Math.round(n);
const pct = (before: number, after: number) => ((after - before) / before) * 100;

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((a, b) => a + b, 0) / values.length;
}

function nightsIn(from: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => addDays(from, i));
}

/** Nuits de maison d'un séjour tombant dans [from, to). */
function overlapNights(b: Booking, from: string, to: string): number {
  const start = b.arrival > from ? b.arrival : from;
  const end = b.departure < to ? b.departure : to;
  return Math.max(0, daysBetween(start, end)) * (b.units ?? 1);
}

export function buildWeeklyReport(input: WeeklyReportInput): WeeklyReport {
  const { today, snapshots, stays, events } = input;
  const present = snapshots.filter((s) => s.snapshot);
  const current = snapshots.find((s) => s.date === today)?.snapshot ?? null;
  const weekAgo = snapshots.find((s) => s.date === addDays(today, -7))?.snapshot ?? null;

  /* Activité : les diffs entre photos consécutives disponibles. */
  const diffs: SnapshotDiff[] = [];
  for (let i = 1; i < present.length; i++) {
    diffs.push(diffSnapshots(present[i - 1].snapshot!, present[i].snapshot!));
  }
  const allChanges = diffs.flatMap((d) => d.priceChanges);
  const isMicro = (c: { before: number; after: number }) =>
    Math.abs(c.after - c.before) < MICRO_EUROS && Math.abs(pct(c.before, c.after)) < MICRO_PCT;
  const changes = allChanges.filter((c) => !isMicro(c));
  const sold = diffs.flatMap((d) => d.sold);
  const byLead = LEAD_BUCKETS.map((bucket, i) => {
    const min = i === 0 ? -Infinity : LEAD_BUCKETS[i - 1].max;
    const inBucket = changes.filter((c) => c.leadDays > min && c.leadDays <= bucket.max);
    return {
      label: bucket.label,
      changes: inBucket.length,
      medianPct: median(inBucket.map((c) => pct(c.before, c.after))),
    };
  });

  /* Fenêtres de remplissage et de niveau de prix. */
  const lastYearToday = addDays(today, -364); // même jour de semaine
  const windows: WindowStat[] = [30, 90, 180].map((days) => {
    const nights = nightsIn(today, days);
    const booked = (s: PriceSnapshot | null) =>
      s ? nights.filter((n) => s.days[n] && s.days[n][2] === 0).length : null;
    const sellable = current ? nights.filter((n) => current.days[n]?.[2] === 1) : [];
    const lyFrom = lastYearToday;
    const lyTo = addDays(lastYearToday, days);
    const lyBooked = stays
      .filter((b) => countsAsSold(b.status) && b.bookedAt && b.bookedAt.slice(0, 10) <= lastYearToday)
      .reduce((sum, b) => sum + overlapNights(b, lyFrom, lyTo), 0);
    const hasLastYearData = stays.some((b) => b.arrival <= lyTo && b.departure >= lyFrom && b.bookedAt);
    return {
      days,
      bookedNow: booked(current),
      bookedWeekAgo: booked(weekAgo),
      bookedLastYear: hasLastYearData ? Math.round(lyBooked * 10) / 10 : null,
      avgPriceNow: current ? mean(sellable.map((n) => current.days[n][0])) : null,
      avgPriceWeekAgo: weekAgo
        ? mean(sellable.filter((n) => weekAgo.days[n]).map((n) => weekAgo.days[n][0]))
        : null,
    };
  });

  /* Événements à venir dans l'horizon de la photo. */
  const eventPricing: EventPricing[] = [];
  if (current) {
    const horizonEnd = Object.keys(current.days).sort().at(-1) ?? today;
    const eventNights = new Set<string>();
    const upcoming = events
      .filter((e) => e.end >= today && e.start <= horizonEnd)
      .sort((a, b) => a.start.localeCompare(b.start));
    for (const e of upcoming) {
      const from = addDays(e.start, -1) < today ? today : addDays(e.start, -1);
      for (let d = from; d <= e.end; d = addDays(d, 1)) eventNights.add(d);
    }
    for (const e of upcoming.slice(0, 8)) {
      const from = addDays(e.start, -1) < today ? today : addDays(e.start, -1);
      const nights: string[] = [];
      for (let d = from; d <= e.end; d = addDays(d, 1)) if (current.days[d]) nights.push(d);
      if (nights.length === 0) continue;
      const month = e.start.slice(0, 7);
      const monthPrices = Object.entries(current.days)
        .filter(([d]) => d.startsWith(month) && !eventNights.has(d))
        .map(([, v]) => v[0]);
      const avgPrice = mean(nights.map((n) => current.days[n][0]))!;
      const monthMedian = median(monthPrices) ?? avgPrice;
      eventPricing.push({
        name: e.name,
        confirmed: e.confirmed,
        start: e.start,
        end: e.end,
        avgPrice: round(avgPrice),
        monthMedian: round(monthMedian),
        ratio: Math.round((avgPrice / monthMedian) * 100) / 100,
        soldNights: nights.filter((n) => current.days[n][2] === 0).length,
        totalNights: nights.length,
      });
    }
  }

  /* Réservations reçues dans la semaine. */
  const weekStart = addDays(today, -7);
  const bookings: BookingOfWeek[] = stays
    .filter((b) => countsAsSold(b.status) && b.bookedAt && b.bookedAt.slice(0, 10) > weekStart)
    .sort((a, b) => (a.bookedAt! < b.bookedAt! ? -1 : 1))
    .map((b) => {
      const bookedDay = b.bookedAt!.slice(0, 10);
      const before = snapshots.find((s) => s.date === addDays(bookedDay, -1))?.snapshot;
      const nights = nightsIn(b.arrival, b.nights);
      const displayedBase =
        before && nights.every((n) => before.days[n])
          ? nights.reduce((sum, n) => sum + before.days[n][0], 0)
          : null;
      return {
        ref: b.ref,
        channel: b.channel,
        arrival: b.arrival,
        nights: b.nights,
        guests: b.guests ?? null,
        gross: b.gross,
        bookedAt: b.bookedAt!,
        leadDays: daysBetween(bookedDay, b.arrival),
        displayedBase,
      };
    });

  /* Chiffre d'affaires, mesuré comme Beyond le mesure (au jour d'arrivée, brut hors taxe). */
  const soldStays = soldBookings(stays);
  const year = today.slice(0, 4);
  const lastYear = String(Number(year) - 1);
  const sumGross = (list: Booking[]) => list.reduce((s, b) => s + b.gross, 0);
  const in90 = addDays(today, 90);
  const revenue: RevenueStat = {
    ytd: round(sumGross(soldStays.filter((b) => b.arrival.startsWith(year) && b.arrival <= today))),
    ytdLastYear: round(
      sumGross(soldStays.filter((b) => b.arrival.startsWith(lastYear) && b.arrival <= lastYearToday)),
    ),
    yearOnBooks: round(sumGross(soldStays.filter((b) => b.arrival.startsWith(year)))),
    goal: REVENUE_GOAL,
    revpan90: round(
      soldStays.reduce(
        (s, b) => s + (b.nights > 0 ? (b.gross * overlapNights(b, today, in90)) / (b.nights * (b.units ?? 1)) : 0),
        0,
      ) / 90,
    ),
    beyondCostYear: 0,
  };
  revenue.beyondCostYear = round(revenue.yearOnBooks * BEYOND_FEE_RATE);

  return {
    today,
    revenue,
    snapshotsAvailable: present.length,
    snapshotsExpected: snapshots.length,
    activity: {
      priceChanges: changes.length,
      microChanges: allChanges.length - changes.length,
      priceUps: changes.filter((c) => c.after > c.before).length,
      priceDowns: changes.filter((c) => c.after < c.before).length,
      medianChangePct: median(changes.map((c) => pct(c.before, c.after))),
      byLead,
      minStayChanges: diffs.reduce((n, d) => n + d.minStayChanges.length, 0),
    },
    sold: {
      nights: sold.length,
      avgDisplayedPrice: mean(sold.map((s) => s.price)),
      avgLeadDays: mean(sold.map((s) => s.leadDays)),
    },
    released: diffs.reduce((n, d) => n + d.released.length, 0),
    windows,
    events: eventPricing,
    bookings,
  };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Mise en texte pour ntfy (≤ 4 Ko)
 * ────────────────────────────────────────────────────────────────────────── */

const eur = (n: number | null) => (n == null ? "—" : `${round(n)} €`);
const signed = (n: number | null, unit = "%") =>
  n == null ? "—" : `${n > 0 ? "+" : ""}${Math.round(n * 10) / 10}${unit}`;

export function formatWeeklyReport(r: WeeklyReport): string {
  const lines: string[] = [];
  if (r.snapshotsAvailable < r.snapshotsExpected) {
    lines.push(`⚠️ ${r.snapshotsAvailable}/${r.snapshotsExpected} photos disponibles cette semaine`);
  }

  const rv = r.revenue;
  lines.push(
    `CA ${r.today.slice(0, 4)} : ${eur(rv.ytd)} encaissé · ${eur(rv.yearOnBooks)} réservé ` +
      `(${Math.round((rv.yearOnBooks / rv.goal) * 100)} % de ${eur(rv.goal)})` +
      (rv.ytdLastYear ? ` · an dernier à date ${eur(rv.ytdLastYear)}` : ""),
  );
  lines.push(`RevPAN 90 j : ${eur(rv.revpan90)} · coût Beyond estimé sur l'année : ${eur(rv.beyondCostYear)}`);

  const a = r.activity;
  lines.push(
    `PRIX MODIFIÉS : ${a.priceChanges} (↑${a.priceUps} ↓${a.priceDowns}, médiane ${signed(a.medianChangePct)})` +
      (a.microChanges ? ` · + ${a.microChanges} micro-ajustements (< 3 % et < 15 €)` : ""),
  );
  const leads = a.byLead.filter((b) => b.changes > 0);
  if (leads.length) {
    lines.push("  " + leads.map((b) => `${b.label} : ${b.changes} (${signed(b.medianPct)})`).join(" · "));
  }
  if (a.minStayChanges) lines.push(`Séjours min. modifiés : ${a.minStayChanges}`);

  lines.push(
    `VENDU : ${r.sold.nights} nuit(s), prix affiché moyen ${eur(r.sold.avgDisplayedPrice)}` +
      (r.sold.avgLeadDays != null ? `, à ${round(r.sold.avgLeadDays)} j` : "") +
      (r.released ? ` · libérées : ${r.released}` : ""),
  );

  lines.push("REMPLISSAGE (nuits réservées · sem. dernière · an dernier) :");
  for (const w of r.windows) {
    const pickup =
      w.bookedNow == null || w.bookedWeekAgo == null
        ? ""
        : ` (${signed(w.bookedNow - w.bookedWeekAgo, "")})`;
    const ly = w.bookedLastYear == null ? "n/d" : String(w.bookedLastYear);
    const price =
      w.avgPriceNow == null
        ? ""
        : ` · prix moy. ${eur(w.avgPriceNow)}` +
          (w.avgPriceWeekAgo ? ` (${signed(pct(w.avgPriceWeekAgo, w.avgPriceNow))})` : "");
    lines.push(`  ${w.days} j : ${w.bookedNow ?? "n/d"}/${w.days}${pickup} · an dernier ${ly}${price}`);
  }

  if (r.events.length) {
    lines.push("ÉVÉNEMENTS (prix/nuit · × médiane du mois · vendu) :");
    for (const e of r.events) {
      lines.push(
        `  ${e.name}${e.confirmed ? "" : " (?)"} : ${e.avgPrice} € · ×${e.ratio} · ${e.soldNights}/${e.totalNights}`,
      );
    }
  }

  if (r.bookings.length) {
    lines.push("RÉSERVATIONS DE LA SEMAINE :");
    for (const b of r.bookings) {
      lines.push(
        `  ${b.channel} ${b.arrival} ${b.nights}n` +
          (b.guests ? ` ${b.guests}p` : "") +
          ` · ${eur(b.gross)} · J-${b.leadDays}` +
          (b.displayedBase ? ` · base affichée ${eur(b.displayedBase)}` : ""),
      );
    }
  } else {
    lines.push("Aucune réservation reçue cette semaine.");
  }
  return lines.join("\n");
}
