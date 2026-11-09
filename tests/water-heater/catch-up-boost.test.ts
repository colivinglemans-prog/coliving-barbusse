import { describe, expect, it } from "vitest";
import {
  BOOSTER_WINDOW,
  getExpectedSettings,
  getProfileSettings,
  isCatchUpHour,
  needsCatchUpBoost,
} from "@/lib/cozytouch";

const EVENING = 19;
const GROUP = 14;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

describe("rattrapage désactivé (coupures du 2026-11-09, 9 kVA)", () => {
  it("aucune heure de rattrapage", () => {
    expect(HOURS.filter(isCatchUpHour)).toEqual([]);
  });

  it("ballon vide le soir avec 14 personnes : pas de boost", () => {
    for (const hour of [6, 7, 8, 17, 18, 19, 20, 21]) {
      expect(needsCatchUpBoost(GROUP, hour, { middleTemperature: 15, boostActive: false }), `${hour} h`).toBe(false);
      expect(needsCatchUpBoost(GROUP, hour, { middleTemperature: 45, boostActive: true }), `${hour} h`).toBe(false);
    }
    expect(getExpectedSettings(GROUP, EVENING, { middleTemperature: 19, boostActive: true })).toMatchObject({
      profile: "xl",
      mode: "manualEcoActive",
      boost: false,
      catchUp: false,
    });
  });
});

describe("appoint du thermo seulement dans la fenêtre de midi", () => {
  it("xl : appoint et boost 11 h–16 h, PAC seule sinon", () => {
    const booster = HOURS.filter((h) => getProfileSettings("xl", h).mode === "manualEcoInactive");
    expect(booster).toEqual([11, 12, 13, 14, 15]);
    expect(HOURS.filter((h) => getProfileSettings("xl", h).boost)).toEqual(booster);
    expect(BOOSTER_WINDOW.xl).toEqual({ from: 11, to: 16 });
  });

  it("high : appoint et boost 12 h–15 h, PAC seule sinon", () => {
    const booster = HOURS.filter((h) => getProfileSettings("high", h).mode === "manualEcoInactive");
    expect(booster).toEqual([12, 13, 14]);
    expect(HOURS.filter((h) => getProfileSettings("high", h).boost)).toEqual(booster);
  });

  it("le soir et la nuit, jamais d'appoint, quel que soit le groupe", () => {
    for (const guests of [0, 3, 6, 10, 14]) {
      for (const hour of [0, 3, 5, 7, 17, 19, 20, 22]) {
        const s = getExpectedSettings(guests, hour, { middleTemperature: 15, boostActive: false });
        expect(s.mode, `${guests} pers., ${hour} h`).not.toBe("manualEcoInactive");
        expect(s.boost, `${guests} pers., ${hour} h`).toBe(false);
      }
    }
  });

  it("consigne inchangée : 60 °C pour les grands groupes", () => {
    for (const hour of HOURS) {
      expect(getProfileSettings("xl", hour).targetTemperature).toBe(60);
      expect(getProfileSettings("high", hour).targetTemperature).toBe(60);
    }
  });
});
