import { describe, expect, it } from "vitest";
import { addDays } from "@sejour/socle/lib/dates";
import type { LocalEvent } from "@sejour/socle/lib/events";
import type { PriceSnapshot } from "@/lib/pricing/snapshot";
import {
  BEYOND_FEE_RATE,
  REVENUE_GOAL,
  buildWeeklyReport,
  formatWeeklyReport,
  type WeeklyReportInput,
} from "@/lib/pricing/weekly-report";
import { calendar, snapshot, stay } from "./fixtures";

/*
 * Tests de caractérisation : ils figent le comportement du 2026-11-07, sans le juger.
 * Les valeurs attendues sont calculées à la main dans les commentaires.
 *
 * Aujourd'hui : lundi 2026-11-09. Il y a 364 jours (même jour de semaine) : 2025-11-10.
 */
const TODAY = "2026-11-09";
const CAL_END = "2026-12-31";

/** Les 8 jours attendus (J-7 … J), photo `null` sauf celles fournies. */
function week(photos: Record<string, PriceSnapshot>): WeeklyReportInput["snapshots"] {
  return Array.from({ length: 8 }, (_, i) => {
    const date = addDays(TODAY, i - 7);
    return { date, snapshot: photos[date] ?? null };
  });
}

function input(over: Partial<WeeklyReportInput>): WeeklyReportInput {
  return { today: TODAY, snapshots: week({}), stays: [], events: [], ...over };
}

/*
 * Trois photos sur huit : J-7 (02/11), J-4 (05/11), J (09/11).
 *   02/11 → 05/11 : 12/11 200→220 (+10 %, à 7 j) ; 20/12 200→180 (−10 %, à 45 j) ;
 *                   séjour min. 15/11 2→3 ; vendues 10/11 (à 5 j) et 25/11 (à 20 j) ;
 *                   03/11 repricée à 999 mais déjà passée au 05/11 → ignorée.
 *   05/11 → 09/11 : 20/12 180→198 (+10 %, à 41 j) ; vendue 20/11 (à 11 j) ; 25/11 libérée.
 */
const S0 = snapshot("2026-11-02", calendar("2026-11-02", CAL_END));
const S1 = snapshot(
  "2026-11-05",
  calendar("2026-11-02", CAL_END, {
    "2026-11-03": [999, 2, 1],
    "2026-11-10": [200, 2, 0],
    "2026-11-12": [220, 2, 1],
    "2026-11-15": [200, 3, 1],
    "2026-11-25": [200, 2, 0],
    "2026-12-20": [180, 2, 1],
  }),
);
const S2 = snapshot(
  TODAY,
  calendar("2026-11-02", CAL_END, {
    "2026-11-10": [200, 2, 0],
    "2026-11-12": [220, 2, 1],
    "2026-11-15": [200, 3, 1],
    "2026-11-20": [200, 2, 0],
    "2026-12-20": [198, 2, 1],
  }),
);
const PHOTOS = week({ "2026-11-02": S0, "2026-11-05": S1, [TODAY]: S2 });

describe("buildWeeklyReport — activité de l'outil", () => {
  const r = buildWeeklyReport(input({ snapshots: PHOTOS }));

  it("compte les photos présentes sur les attendues", () => {
    expect(r.snapshotsAvailable).toBe(3);
    expect(r.snapshotsExpected).toBe(8);
  });

  it("agrège les modifications de prix entre photos consécutives disponibles", () => {
    expect(r.activity.priceChanges).toBe(3);
    expect(r.activity.priceUps).toBe(2);
    expect(r.activity.priceDowns).toBe(1);
    expect(r.activity.medianChangePct).toBeCloseTo(10); // médiane de [+10, −10, +10]
    expect(r.activity.minStayChanges).toBe(1);
  });

  it("ventile par distance à la nuit", () => {
    const byLead = Object.fromEntries(r.activity.byLead.map((b) => [b.label, b]));
    expect(byLead["0-14 j"]).toMatchObject({ changes: 1 });
    expect(byLead["0-14 j"].medianPct).toBeCloseTo(10);
    expect(byLead["15-30 j"]).toEqual({ label: "15-30 j", changes: 0, medianPct: null });
    expect(byLead["31-90 j"].changes).toBe(2);
    expect(byLead["31-90 j"].medianPct).toBeCloseTo(0); // médiane de [−10, +10]
    expect(byLead["91-180 j"].changes).toBe(0);
    expect(byLead["180 j+"].changes).toBe(0);
  });

  it("nuits vendues au prix de la veille, et libérations", () => {
    expect(r.sold.nights).toBe(3);
    expect(r.sold.avgDisplayedPrice).toBe(200);
    expect(r.sold.avgLeadDays).toBe(12); // (5 + 20 + 11) / 3
    expect(r.released).toBe(1);
  });

  it("fenêtres de remplissage et de prix", () => {
    const [w30, w90, w180] = r.windows;
    expect([w30.days, w90.days, w180.days]).toEqual([30, 90, 180]);
    // Non vendables aujourd'hui dans [09/11, +30) : 10/11 et 20/11. Il y a 7 jours : aucune.
    expect(w30.bookedNow).toBe(2);
    expect(w30.bookedWeekAgo).toBe(0);
    // Le calendrier s'arrête au 31/12 : les nuits absentes ne comptent pas.
    expect(w90.bookedNow).toBe(2);
    // 28 nuits vendables, dont 12/11 à 220 : (27 × 200 + 220) / 28.
    expect(w30.avgPriceNow).toBeCloseTo(5620 / 28);
    expect(w30.avgPriceWeekAgo).toBe(200);
    // 51 vendables jusqu'au 31/12, dont 12/11 à 220 et 20/12 à 198.
    expect(w90.avgPriceNow).toBeCloseTo((49 * 200 + 220 + 198) / 51);
    // Sans aucun séjour l'an dernier, pas de comparaison possible.
    expect(w30.bookedLastYear).toBeNull();
  });

  it("sans photo du jour ni d'il y a 7 jours, les fenêtres sont vides", () => {
    const sans = buildWeeklyReport(input({ snapshots: week({ "2026-11-05": S1 }) }));
    expect(sans.windows[0]).toMatchObject({
      bookedNow: null,
      bookedWeekAgo: null,
      avgPriceNow: null,
      avgPriceWeekAgo: null,
    });
    expect(sans.events).toEqual([]);
  });
});

describe("buildWeeklyReport — remplissage de l'an dernier", () => {
  it("compte les nuits déjà réservées à la date équivalente (J−364), pas celles réservées après", () => {
    const r = buildWeeklyReport(
      input({
        snapshots: PHOTOS,
        stays: [
          // Réservée le 01/10/2025 pour le 20→23/11/2025 : 3 nuits dans la fenêtre de 30 j.
          stay({ arrival: "2025-11-20", departure: "2025-11-23", nights: 3, gross: 900, bookedAt: "2025-10-01T10:00:00Z" }),
          // Réservée le 15/11/2025, après J−364 (10/11/2025) : ne compte pas.
          stay({ arrival: "2025-11-25", departure: "2025-11-27", nights: 2, gross: 600, bookedAt: "2025-11-15T10:00:00Z" }),
          // Annulée : ne compte pas.
          stay({ arrival: "2025-12-01", departure: "2025-12-03", nights: 2, gross: 600, bookedAt: "2025-10-01T10:00:00Z", status: "cancelled" }),
        ],
      }),
    );
    expect(r.windows.map((w) => w.bookedLastYear)).toEqual([3, 3, 3]);
  });
});

describe("buildWeeklyReport — événements", () => {
  const events: LocalEvent[] = [
    { key: "test-dec", name: "Fête de décembre", start: "2026-12-19", end: "2026-12-20", confirmed: true },
    { key: "test-passe", name: "Passé", start: "2026-10-01", end: "2026-10-02", confirmed: true },
    { key: "test-loin", name: "Hors horizon", start: "2027-06-01", end: "2027-06-02", confirmed: false },
  ];

  it("prix moyen veille comprise, comparé à la médiane du mois hors événement", () => {
    const photo = snapshot(TODAY, calendar(TODAY, CAL_END, { "2026-12-19": [400, 2, 0], "2026-12-20": [350, 2, 1] }));
    const r = buildWeeklyReport(input({ snapshots: week({ [TODAY]: photo }), events }));
    expect(r.events).toHaveLength(1);
    // Nuits 18, 19 et 20/12 : (200 + 400 + 350) / 3 = 316,67 → 317 ; médiane de décembre hors
    // ces trois nuits : 200 ; ratio 316,67 / 200 = 1,58.
    expect(r.events[0]).toEqual({
      name: "Fête de décembre",
      confirmed: true,
      start: "2026-12-19",
      end: "2026-12-20",
      avgPrice: 317,
      monthMedian: 200,
      ratio: 1.58,
      soldNights: 1,
      totalNights: 3,
    });
  });
});

describe("buildWeeklyReport — réservations de la semaine", () => {
  it("garde les réservations vendues reçues après J−7, avec la base affichée la veille", () => {
    const r = buildWeeklyReport(
      input({
        snapshots: PHOTOS,
        stays: [
          // Reçue le 06/11 : la photo du 05/11 donne 20/11 + 21/11 = 200 + 200.
          stay({ arrival: "2026-11-20", departure: "2026-11-22", nights: 2, gross: 700, channel: "Airbnb", guests: 8, bookedAt: "2026-11-06T09:00:00Z" }),
          // Reçue le 08/11 : pas de photo du 07/11 → base inconnue.
          stay({ arrival: "2026-12-01", departure: "2026-12-04", nights: 3, gross: 1200, bookedAt: "2026-11-08T18:00:00Z" }),
          // Reçue le 02/11 = J−7 : hors semaine (borne exclue).
          stay({ arrival: "2026-11-28", departure: "2026-11-30", nights: 2, gross: 500, bookedAt: "2026-11-02T08:00:00Z" }),
          // Annulée : exclue.
          stay({ arrival: "2026-11-26", departure: "2026-11-27", nights: 1, gross: 300, bookedAt: "2026-11-07T08:00:00Z", status: "cancelled" }),
        ],
      }),
    );
    expect(r.bookings.map((b) => [b.arrival, b.leadDays, b.displayedBase, b.guests])).toEqual([
      ["2026-11-20", 14, 400, 8],
      ["2026-12-01", 23, null, null],
    ]);
    expect(r.bookings[0]).toMatchObject({ channel: "Airbnb", nights: 2, gross: 700 });
  });
});

describe("buildWeeklyReport — chiffre d'affaires", () => {
  it("mesure au jour d'arrivée, brut, statuts vendus seulement", () => {
    const r = buildWeeklyReport(
      input({
        stays: [
          stay({ arrival: "2026-03-10", departure: "2026-03-13", nights: 3, gross: 1500 }),
          // À cheval sur aujourd'hui : dans l'YTD, et 2 nuits sur 3 dans les 90 jours.
          stay({ arrival: "2026-11-08", departure: "2026-11-11", nights: 3, gross: 900 }),
          // À venir cette année, entièrement dans les 90 jours.
          stay({ arrival: "2026-12-20", departure: "2026-12-22", nights: 2, gross: 1000 }),
          stay({ arrival: "2026-04-01", departure: "2026-04-03", nights: 2, gross: 9999, status: "cancelled" }),
          // L'an dernier, avant J−364 (10/11/2025).
          stay({ arrival: "2025-11-01", departure: "2025-11-03", nights: 2, gross: 800 }),
          // L'an dernier, après J−364 : hors « an dernier à date ».
          stay({ arrival: "2025-12-01", departure: "2025-12-02", nights: 1, gross: 400 }),
        ],
      }),
    );
    expect(r.revenue).toEqual({
      ytd: 2400, // 1500 + 900
      ytdLastYear: 800,
      yearOnBooks: 3400, // 1500 + 900 + 1000
      goal: REVENUE_GOAL,
      revpan90: 18, // (900 × 2/3 + 1000) / 90 = 17,8
      beyondCostYear: Math.round(3400 * BEYOND_FEE_RATE),
    });
  });
});

describe("formatWeeklyReport", () => {
  it("signale les photos manquantes et l'absence de réservation", () => {
    const text = formatWeeklyReport(buildWeeklyReport(input({ snapshots: PHOTOS })));
    expect(text.split("\n")[0]).toBe("⚠️ 3/8 photos disponibles cette semaine");
    expect(text).toContain("PRIX MODIFIÉS : 3 (↑2 ↓1, médiane +10%)");
    expect(text).toContain("VENDU : 3 nuit(s), prix affiché moyen 200 €, à 12 j · libérées : 1");
    expect(text).toContain("  30 j : 2/30 (+2) · an dernier n/d · prix moy. 201 € (+0.4%)");
    expect(text.endsWith("Aucune réservation reçue cette semaine.")).toBe(true);
  });

  it("tient dans une notification ntfy (≤ 4 Ko) sur une semaine chargée", () => {
    const events: LocalEvent[] = Array.from({ length: 12 }, (_, i) => ({
      key: `e${i}`,
      name: `Événement au nom assez long numéro ${i}`,
      start: addDays("2026-11-15", i * 3),
      end: addDays("2026-11-16", i * 3),
      confirmed: i % 2 === 0,
    }));
    const stays = Array.from({ length: 6 }, (_, i) =>
      stay({
        arrival: addDays("2026-11-20", i * 4),
        departure: addDays("2026-11-22", i * 4),
        nights: 2,
        gross: 800,
        channel: "Booking.com",
        guests: 12,
        bookedAt: `${addDays(TODAY, -i)}T10:00:00Z`,
      }),
    );
    const text = formatWeeklyReport(buildWeeklyReport(input({ snapshots: PHOTOS, events, stays })));
    expect(new TextEncoder().encode(text).length).toBeLessThanOrEqual(4096);
  });
});
