import { describe, expect, it } from "vitest";
import { addDays } from "@sejour/socle/lib/dates";
import {
  expectedHeatingMode,
  getHeatingRules,
  heatingSituation,
  isOccupiedAt,
  preheatHours,
  resetTarget,
  todayAgreedHours,
  type StayDates,
} from "@/lib/heating-schedule";
import { countGuests } from "@/lib/bookings";
import { withAgreedHours } from "@/lib/stay-hours-rules";
import type { HeatzyMode } from "@/lib/types";

/**
 * Horaires convenus dans le chauffage et le ballon (2026-11-16). Réservations inventées ; le cas
 * réel du 06/12 (départ convenu à 16 h, 20 personnes) est rejoué sur des dates fictives.
 */
const HOURS = Array.from({ length: 24 }, (_, h) => h);
const zones = [{}, { nightMode: "presence" as HeatzyMode }, { staggerMinutes: -15 }, { staggerMinutes: 15 }];
const device = { defaultMode: "fro" as HeatzyMode };

const stays = [
  { id: 1, arrival: "2027-01-04", departure: "2027-01-06" },
  { id: 2, arrival: "2027-01-06", departure: "2027-01-08" },
  { id: 3, arrival: "2027-01-10", departure: "2027-01-12" },
];

describe("non-régression : une table vide ne change rien", () => {
  it("mode attendu, reset, règles et ballon identiques, heure par heure, minutes comprises", () => {
    const joined = withAgreedHours(stays, {});
    for (let day = "2027-01-03"; day <= "2027-01-13"; day = addDays(day, 1)) {
      for (const hour of HOURS) {
        for (const minute of [0, 50]) {
          for (const zone of zones) {
            expect(expectedHeatingMode(joined, day, hour, zone, minute)).toEqual(expectedHeatingMode(stays, day, hour, zone, minute));
            expect(resetTarget(joined, day, hour, zone, device, minute)).toEqual(resetTarget(stays, day, hour, zone, device, minute));
          }
        }
        const situation = heatingSituation(joined, day, hour);
        expect(getHeatingRules(situation, hour, undefined, todayAgreedHours(joined, day))).toEqual(getHeatingRules(situation, hour));
        expect(getHeatingRules(situation, hour).agreedRule).toBeUndefined();
      }
    }
    expect(preheatHours(stays, "2027-01-04")).toEqual({ checkIn: 17, eco: 12, cft: 15 });
  });
});

describe("départ tardif convenu", () => {
  const late: StayDates[] = [{ arrival: "2027-01-04", departure: "2027-01-06", departureHour: 16 }];

  it("occupé jusqu'à 16 h le jour du départ, plus à 16 h", () => {
    expect(isOccupiedAt(late, "2027-01-06", 10)).toBe(true);
    expect(isOccupiedAt(late, "2027-01-06", 15)).toBe(true);
    expect(isOccupiedAt(late, "2027-01-06", 16)).toBe(false);
    expect(expectedHeatingMode(late, "2027-01-06", 15, {}).mode).toBe("presence");
    expect(expectedHeatingMode(late, "2027-01-06", 16, {}).mode).toBe("fro");
  });

  it("le reset de 12 h ne coupe plus : occupé", () => {
    expect(resetTarget(late, "2027-01-06", 12, {}, device)).toEqual({ mode: "presence", occupied: true });
    expect(resetTarget(late, "2027-01-06", 16, {}, device)).toEqual({ mode: "fro", occupied: false });
  });

  it("la descente au départ reste à l'heure dans toutes les zones (pas de décalage)", () => {
    // Dernier étage (−15) : toujours occupé à 15 h 50 ; hors-gel à 16 h 00 pile pour tous.
    for (const zone of zones) {
      expect(expectedHeatingMode(late, "2027-01-06", 15, zone, 50).situation).toBe("occupied");
      expect(expectedHeatingMode(late, "2027-01-06", 16, zone, 0).mode).toBe("fro");
    }
  });

  it("rotation : occupé jusqu'au départ convenu, puis éco jusqu'à l'arrivée", () => {
    const rotation: StayDates[] = [...late, { arrival: "2027-01-06", departure: "2027-01-08" }];
    expect(heatingSituation(rotation, "2027-01-06", 15)).toBe("occupied");
    expect(heatingSituation(rotation, "2027-01-06", 16)).toBe("turnaround");
    expect(expectedHeatingMode(rotation, "2027-01-06", 16, {}).mode).toBe("eco");
    expect(heatingSituation(rotation, "2027-01-06", 17)).toBe("occupied");
  });

  it("bandeau du dashboard : « Départ tardif convenu à 16 h »", () => {
    const agreed = todayAgreedHours(late, "2027-01-06");
    expect(agreed).toEqual({ departureHour: 16 });
    const rules = getHeatingRules(heatingSituation(late, "2027-01-06", 11), 11, undefined, agreed);
    expect(rules.agreedRule).toBe("Départ tardif convenu à 16 h");
    expect(rules.nextRule).toBe("Départ tardif convenu à 16 h");
  });
});

describe("arrivée anticipée convenue", () => {
  const early: StayDates[] = [{ arrival: "2027-01-04", departure: "2027-01-06", arrivalHour: 14 }];

  it("préchauffage aux mêmes écarts : éco 9 h, confort 12 h, occupé 14 h", () => {
    expect(preheatHours(early, "2027-01-04")).toEqual({ checkIn: 14, eco: 9, cft: 12 });
    expect(heatingSituation(early, "2027-01-04", 8)).toBe("arrival-morning");
    expect(heatingSituation(early, "2027-01-04", 9)).toBe("preheat-eco");
    expect(heatingSituation(early, "2027-01-04", 12)).toBe("preheat-cft");
    expect(heatingSituation(early, "2027-01-04", 14)).toBe("occupied");
  });

  it("le reset compte le jour d'arrivée comme occupé dès l'éco du préchauffage", () => {
    expect(resetTarget(early, "2027-01-04", 9, {}, device)).toEqual({ mode: "eco", occupied: true });
    expect(resetTarget(early, "2027-01-04", 8, {}, device)).toEqual({ mode: "fro", occupied: false });
  });

  it("borné à la journée : arrivée à 8 h → éco et confort dès minuit et 6 h", () => {
    expect(preheatHours([{ arrival: "d", departure: "e", arrivalHour: 8 }], "d")).toEqual({ checkIn: 8, eco: 3, cft: 6 });
    expect(preheatHours([{ arrival: "d", departure: "e", arrivalHour: 1 }], "d")).toEqual({ checkIn: 1, eco: 0, cft: 0 });
  });

  it("bandeau : heures de préchauffage avancées et « Arrivée anticipée à 14 h »", () => {
    const agreed = todayAgreedHours(early, "2027-01-04");
    expect(getHeatingRules("arrival-morning", 8, undefined, agreed)).toEqual({
      currentRule: "Arrivée aujourd'hui — Hors-gel",
      nextRule: "À 9h → Pré-chauffage éco, à 12h → confort (arrivée anticipée à 14 h)",
      agreedRule: "Arrivée anticipée à 14 h",
    });
    expect(getHeatingRules("preheat-cft", 13, undefined, agreed).nextRule).toBe("Arrivée anticipée à 14 h");
  });
});

describe("ballon : countGuests avec horaires convenus", () => {
  const twenty = { numAdult: 20, numChild: 0 };

  it("départ convenu 16 h : partants comptés jusqu'à 16 h (contre 11 h)", () => {
    const b = [{ arrival: "2027-01-04", departure: "2027-01-06", departureHour: 16, ...twenty }];
    expect(countGuests(b, "2027-01-06", 10)).toBe(20);
    expect(countGuests(b, "2027-01-06", 15)).toBe(20);
    expect(countGuests(b, "2027-01-06", 16)).toBe(0);
  });

  it("arrivée convenue A : arrivants dès min(11 h, A − 6 h)", () => {
    const at = (A: number, h: number) => countGuests([{ arrival: "2027-01-04", departure: "2027-01-06", arrivalHour: A, ...twenty }], "2027-01-04", h);
    expect(at(14, 7)).toBe(0);
    expect(at(14, 8)).toBe(20);
    expect(at(16, 10)).toBe(20);
    expect(at(16, 9)).toBe(0);
    // Sans accord : 11 h, comme avant.
    expect(countGuests([{ arrival: "2027-01-04", departure: "2027-01-06", ...twenty }], "2027-01-04", 10)).toBe(0);
    expect(countGuests([{ arrival: "2027-01-04", departure: "2027-01-06", ...twenty }], "2027-01-04", 11)).toBe(20);
  });
});
