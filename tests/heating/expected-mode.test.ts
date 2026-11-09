import { describe, expect, it } from "vitest";
import { addDays } from "@sejour/socle/lib/dates";
import {
  expectedHeatingMode,
  getHeatingRules,
  heatingSituation,
  resetTarget,
  type StayDates,
} from "@/lib/heating-schedule";
import type { HeatzyMode, HeatzyZone } from "@/lib/types";

/*
 * Non-régression de la fonction unique « mode attendu » contre les trois copies qu'elle
 * remplace, recopiées ci-dessous **telles qu'elles étaient au commit 144c934** (seules les
 * lectures d'horloge sont devenues des paramètres). Une semaine simulée, heure par heure,
 * toutes les zones.
 */

// ─── Oracles : le code d'avant ────────────────────────────────

function oldGetOccupiedMode(zone: Pick<HeatzyZone, "nightMode">, hour: number): HeatzyMode {
  if (zone.nightMode && hour >= 0 && hour < 5) return zone.nightMode;
  if (hour >= 7 && hour < 20) return "presence";
  return "cft";
}

function oldGetBetweenReservationsMode(hour: number): HeatzyMode {
  if (hour >= 9 && hour < 17) return "eco";
  return "fro";
}

function oldIsOccupied(bookings: StayDates[], today: string, hour: number): boolean {
  return bookings.some(
    (b) =>
      (b.arrival < today && b.departure > today) ||
      (b.arrival === today && b.departure > today && hour >= 17) ||
      (b.departure === today && hour < 10),
  );
}

/** `heating-automation` : le mode posé sur un radiateur non verrouillé, `null` si rien. */
function oldAutomation(bookings: StayDates[], today: string, currentHour: number, zone: Pick<HeatzyZone, "nightMode">): HeatzyMode | null {
  const hasCheckInToday = bookings.some((b) => b.arrival === today);
  const hasCheckOutToday = bookings.some((b) => b.departure === today);
  const isCurrentlyOccupied = oldIsOccupied(bookings, today, currentHour);
  const hasSameDayTurnaround = hasCheckOutToday && hasCheckInToday;
  if (hasCheckInToday && currentHour >= 15 && !isCurrentlyOccupied && !hasSameDayTurnaround) return "cft";
  if (hasCheckInToday && currentHour >= 12 && currentHour < 15 && !isCurrentlyOccupied && !hasSameDayTurnaround) return "eco";
  if (hasCheckInToday && currentHour < 12 && !isCurrentlyOccupied && !hasSameDayTurnaround) return "fro";
  if (isCurrentlyOccupied) return oldGetOccupiedMode(zone, currentHour);
  if (hasSameDayTurnaround) return oldGetBetweenReservationsMode(currentHour);
  if (hasCheckOutToday) return "fro";
  return null;
}

/** `/api/dashboard/heating` : le champ `expectedMode` d'un radiateur non verrouillé. */
function oldDashboardExpected(bookings: StayDates[], today: string, currentHour: number, zone: Pick<HeatzyZone, "nightMode">): HeatzyMode {
  const occupied = oldIsOccupied(bookings, today, currentHour);
  const hasCheckInToday = bookings.some((b) => b.arrival === today);
  return occupied
    ? oldGetOccupiedMode(zone, currentHour)
    : hasCheckInToday && currentHour >= 15
      ? "cft"
      : hasCheckInToday && currentHour >= 12
        ? "eco"
        : "fro";
}

/** `getHeatingRules(occupied, hour, sameDayTurnaround, nextCheckIn)` + son appel du dashboard. */
function oldRules(bookings: StayDates[], today: string, hour: number) {
  const occupied = oldIsOccupied(bookings, today, hour);
  const hasCheckOutToday = bookings.some((b) => b.departure === today);
  const hasCheckInToday = bookings.some((b) => b.arrival === today);
  const hasSameDayTurnaround = hasCheckOutToday && hasCheckInToday;
  const futureBookings = bookings.filter((b) => b.arrival > today).sort((a, b) => a.arrival.localeCompare(b.arrival));
  const nextCheckIn = hasCheckInToday && !occupied ? today : futureBookings[0]?.arrival;

  if (!occupied && !hasSameDayTurnaround) {
    const isCheckInToday = nextCheckIn === today;
    if (isCheckInToday) {
      if (hour < 12) return { currentRule: "Arrivée aujourd'hui — Hors-gel", nextRule: "À 12h → Pré-chauffage éco, à 15h → confort" };
      if (hour < 15) return { currentRule: "Arrivée aujourd'hui — Pré-chauffage éco", nextRule: "À 15h → Confort (arrivée à 17h)" };
      return { currentRule: "Arrivée aujourd'hui — Pré-chauffage confort", nextRule: "Arrivée prévue à 17h" };
    }
    let nextRule = "Aucune réservation prochaine";
    if (nextCheckIn) nextRule = `Prochain check-in : ${nextCheckIn}`;
    return { currentRule: "Pas de réservation — Hors-gel", nextRule };
  }
  if (hasSameDayTurnaround && !occupied) {
    const mode = hour >= 9 && hour < 17 ? "Éco (entre deux réservations)" : "Hors-gel";
    return { currentRule: `Entre deux réservations — ${mode}`, nextRule: hour < 17 ? "À 17h → Pré-chauffage confort" : "Check-in imminent" };
  }
  if (hour >= 7 && hour < 20) return { currentRule: "Réservation active — Présence (7h-20h)", nextRule: "À 20h → Confort (nuit)" };
  if (hour >= 20) return { currentRule: "Réservation active — Confort (nuit)", nextRule: "À 0h → Présence RDC / Confort chambres" };
  if (hour < 5) return { currentRule: "Réservation active — Nuit (RDC présence, chambres confort)", nextRule: "À 5h → Confort partout" };
  return { currentRule: "Réservation active — Confort (5h-7h)", nextRule: "À 7h → Mode présence" };
}

/** `heating-reset` d'avant la correction : occupé → mode occupé, sinon le mode par défaut. */
function oldReset(bookings: StayDates[], today: string, hour: number, zone: Pick<HeatzyZone, "nightMode">, defaultMode: HeatzyMode) {
  const occupied = oldIsOccupied(bookings, today, hour);
  return { mode: occupied ? oldGetOccupiedMode(zone, hour) : defaultMode, occupied };
}

// ─── La semaine simulée ───────────────────────────────────────

/*
 * Lundi 2026-11-09 → dimanche 2026-11-15, et la veille :
 * - séjour A du dimanche 08 au mardi 10 (départ mardi) ;
 * - séjour B du mardi 10 au jeudi 12 : **rotation** le mardi ;
 * - jeudi 12 : départ sans arrivée ;
 * - vendredi 13 : maison vide, prochaine arrivée samedi ;
 * - séjour C du samedi 14 au lundi 16 : arrivée sur maison vide.
 */
const BOOKINGS: StayDates[] = [
  { arrival: "2026-11-08", departure: "2026-11-10" },
  { arrival: "2026-11-10", departure: "2026-11-12" },
  { arrival: "2026-11-14", departure: "2026-11-16" },
];
const DAYS = Array.from({ length: 8 }, (_, i) => addDays("2026-11-08", i));
const ZONES: Array<Pick<HeatzyZone, "nightMode">> = [{ nightMode: "presence" }, {}];
const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Ce que le dashboard lisait : les séjours en cours ou à venir — la fenêtre de sa requête Beds24 importe peu ici. */
function grid(fn: (day: string, hour: number, zone: Pick<HeatzyZone, "nightMode">) => void) {
  for (const day of DAYS) for (const hour of HOURS) for (const zone of ZONES) fn(day, hour, zone);
}

describe("mode attendu — non-régression sur une semaine", () => {
  it("rend exactement le mode que posait heating-automation, heure par heure", () => {
    let compared = 0;
    grid((day, hour, zone) => {
      expect(expectedHeatingMode(BOOKINGS, day, hour, zone).mode, `${day} ${hour}h`).toBe(oldAutomation(BOOKINGS, day, hour, zone));
      compared++;
    });
    expect(compared).toBe(8 * 24 * 2);
  });

  it("rend exactement les règles affichées par getHeatingRules", () => {
    grid((day, hour) => {
      const situation = heatingSituation(BOOKINGS, day, hour);
      const next = BOOKINGS.filter((b) => b.arrival > day).sort((a, b) => a.arrival.localeCompare(b.arrival))[0]?.arrival;
      expect(getHeatingRules(situation, hour, next), `${day} ${hour}h`).toEqual(oldRules(BOOKINGS, day, hour));
    });
  });

  it("rend le expectedMode du dashboard, sauf là où il contredisait l'automatisation", () => {
    const diverged: string[] = [];
    grid((day, hour, zone) => {
      const now = expectedHeatingMode(BOOKINGS, day, hour, zone).mode ?? "fro"; // défaut des radiateurs
      const before = oldDashboardExpected(BOOKINGS, day, hour, zone);
      if (now !== before) diverged.push(`${day} ${hour}h ${before}→${now}`);
    });
    // Seul écart : la rotation du mardi 10, de 10 h à 17 h. Le dashboard annonçait hors-gel
    // jusqu'à 12 h, éco de 12 h à 15 h puis confort ; l'automatisation y pose l'éco de bout en
    // bout. La fonction unique suit l'automatisation (ce que reçoivent les radiateurs).
    const expected = [10, 11, 15, 16].flatMap((h) =>
      ZONES.map(() => `2026-11-10 ${h}h ${h < 12 ? "fro" : "cft"}→eco`),
    );
    expect(diverged).toEqual(expected);
  });
});

describe("heating-reset — un jour d'arrivée compte comme occupé dès 12 h", () => {
  const zone = { nightMode: "presence" as HeatzyMode };
  const device = { defaultMode: "fro" as HeatzyMode };

  it("ne coupe plus le préchauffage aux passages de 12 h et 16 h (arrivée sur maison vide)", () => {
    // Avant : hors-gel aux deux passages, consignes remises.
    expect(oldReset(BOOKINGS, "2026-11-14", 12, zone, "fro")).toEqual({ mode: "fro", occupied: false });
    expect(oldReset(BOOKINGS, "2026-11-14", 16, zone, "fro")).toEqual({ mode: "fro", occupied: false });
    // Après : le mode du préchauffage, et les consignes ne sont remises que si elles ont été montées.
    expect(resetTarget(BOOKINGS, "2026-11-14", 12, zone, device)).toEqual({ mode: "eco", occupied: true });
    expect(resetTarget(BOOKINGS, "2026-11-14", 16, zone, device)).toEqual({ mode: "cft", occupied: true });
  });

  it("garde l'éco d'une rotation à 12 h et 16 h", () => {
    expect(resetTarget(BOOKINGS, "2026-11-10", 12, zone, device)).toEqual({ mode: "eco", occupied: true });
    expect(resetTarget(BOOKINGS, "2026-11-10", 16, zone, device)).toEqual({ mode: "eco", occupied: true });
  });

  it("ne change rien aux autres passages de la semaine", () => {
    for (const day of DAYS) {
      for (const hour of [0, 4, 8, 12, 16, 20]) {
        const arrivalAfternoon = hour >= 12 && hour < 17 && BOOKINGS.some((b) => b.arrival === day);
        if (arrivalAfternoon) continue;
        expect(resetTarget(BOOKINGS, day, hour, zone, device), `${day} ${hour}h`).toEqual(
          oldReset(BOOKINGS, day, hour, zone, "fro"),
        );
      }
    }
  });

  it("le matin d'une arrivée reste en mode par défaut", () => {
    expect(resetTarget(BOOKINGS, "2026-11-14", 8, zone, device)).toEqual({ mode: "fro", occupied: false });
  });
});

describe("échelonnement par étage (2026-11-09) : dernier −15 min, RDC à l'heure, 1er +15 min", () => {
  const dernier = { staggerMinutes: -15 };
  const rdc = { nightMode: "presence" as HeatzyMode, staggerMinutes: 0 };
  const premier = { staggerMinutes: 15 };
  const arrival = "2026-11-14"; // arrivée sur maison vide (séjour C)
  const stay = "2026-11-11"; // séjour B en cours
  const at = (zone: object, day: string, h: number, m: number) => expectedHeatingMode(BOOKINGS, day, h, zone, m).mode;

  it("préchauffage éco : dernier à 11 h 45, RDC à 12 h, 1er à 12 h 15", () => {
    expect([at(dernier, arrival, 11, 30), at(rdc, arrival, 11, 30), at(premier, arrival, 11, 30)]).toEqual(["fro", "fro", "fro"]);
    expect([at(dernier, arrival, 11, 45), at(rdc, arrival, 11, 45), at(premier, arrival, 11, 45)]).toEqual(["eco", "fro", "fro"]);
    expect([at(dernier, arrival, 12, 0), at(rdc, arrival, 12, 0), at(premier, arrival, 12, 0)]).toEqual(["eco", "eco", "fro"]);
    expect(at(premier, arrival, 12, 15)).toBe("eco");
  });

  it("préchauffage confort : 14 h 45 / 15 h / 15 h 15", () => {
    expect([at(dernier, arrival, 14, 45), at(rdc, arrival, 14, 45), at(premier, arrival, 14, 45)]).toEqual(["cft", "eco", "eco"]);
    expect([at(dernier, arrival, 15, 0), at(rdc, arrival, 15, 0), at(premier, arrival, 15, 0)]).toEqual(["cft", "cft", "eco"]);
    expect(at(premier, arrival, 15, 15)).toBe("cft");
  });

  it("confort du soir : 19 h 45 / 20 h / 20 h 15", () => {
    expect([at(dernier, stay, 19, 45), at(rdc, stay, 19, 45), at(premier, stay, 19, 45)]).toEqual(["cft", "presence", "presence"]);
    expect([at(dernier, stay, 20, 0), at(rdc, stay, 20, 0), at(premier, stay, 20, 0)]).toEqual(["cft", "cft", "presence"]);
    expect(at(premier, stay, 20, 15)).toBe("cft");
  });

  it("bornes de la journée : pas de passage au jour voisin", () => {
    expect(at(premier, stay, 0, 0)).toBe(at({}, stay, 0, 0));
    expect(at(dernier, stay, 23, 50)).toBe(at({}, stay, 23, 0));
  });

  it("décalage nul : la règle d'avant, à la minute près", () => {
    for (const h of HOURS) for (const m of [0, 15, 30, 45]) {
      expect(at(rdc, stay, h, m), `${h} h ${m}`).toBe(expectedHeatingMode(BOOKINGS, stay, h, rdc).mode);
    }
  });

  it("le reset suit le même décalage", () => {
    const device = { defaultMode: "fro" as HeatzyMode };
    expect(resetTarget(BOOKINGS, arrival, 11, dernier, device, 45)).toEqual({ mode: "eco", occupied: true });
    expect(resetTarget(BOOKINGS, arrival, 12, premier, device, 0)).toEqual({ mode: "fro", occupied: false });
  });
});
