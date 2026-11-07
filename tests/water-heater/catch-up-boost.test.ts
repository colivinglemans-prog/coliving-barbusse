import { describe, expect, it } from "vitest";
import { CATCH_UP_BOOST, getExpectedSettings, isCatchUpHour, needsCatchUpBoost } from "@/lib/cozytouch";

const { start, stop } = CATCH_UP_BOOST;
const EVENING = 19;
const GROUP = 14;

describe("isCatchUpHour", () => {
  it("heures de douche : 6 h–9 h et 17 h–22 h", () => {
    const allowed = Array.from({ length: 24 }, (_, h) => h).filter(isCatchUpHour);
    expect(allowed).toEqual([6, 7, 8, 17, 18, 19, 20, 21]);
  });
});

describe("needsCatchUpBoost", () => {
  it("se déclenche sous le seuil bas, grand groupe, heure de douche", () => {
    expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature: start - 1, boostActive: false })).toBe(true);
    expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature: start, boostActive: false })).toBe(false);
  });

  it("se maintient jusqu'au seuil haut (hystérésis)", () => {
    expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature: start + 5, boostActive: true })).toBe(true);
    expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature: stop, boostActive: true })).toBe(false);
    expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature: start + 5, boostActive: false })).toBe(false);
  });

  it("hors des heures de douche : jamais, même en cours (la PAC a le temps)", () => {
    const cold = { middleTemperature: 15, boostActive: false };
    for (const hour of [22, 23, 0, 5, 9, 12, 16]) expect(needsCatchUpBoost(GROUP, hour, cold), `${hour} h`).toBe(false);
    expect(needsCatchUpBoost(GROUP, 22, { middleTemperature: 45, boostActive: true })).toBe(false);
  });

  it("petit groupe : jamais (le classique couvre le pic)", () => {
    expect(needsCatchUpBoost(CATCH_UP_BOOST.minGuests - 1, EVENING, { middleTemperature: 15, boostActive: false })).toBe(false);
    expect(needsCatchUpBoost(CATCH_UP_BOOST.minGuests, EVENING, { middleTemperature: 15, boostActive: false })).toBe(true);
  });

  it("sonde du milieu absente ou aberrante : jamais", () => {
    for (const middleTemperature of [undefined, 0, 2, 120]) {
      expect(needsCatchUpBoost(GROUP, EVENING, { middleTemperature, boostActive: false }), `${middleTemperature}`).toBe(false);
    }
  });
});

describe("getExpectedSettings", () => {
  it("ajoute le rattrapage hors de la fenêtre de boost du profil", () => {
    const s = getExpectedSettings(GROUP, EVENING, { middleTemperature: 30, boostActive: false });
    expect(s).toMatchObject({ profile: "xl", boost: true, catchUp: true, targetTemperature: 60 });
  });

  it("pas de rattrapage à 22 h (soir du 2026-11-07)", () => {
    const s = getExpectedSettings(GROUP, 22, { middleTemperature: 30, boostActive: false });
    expect(s).toMatchObject({ profile: "xl", boost: false, catchUp: false });
  });

  it("le boost de la fenêtre du profil n'est pas un rattrapage, et n'est pas prolongé à 16 h", () => {
    expect(getExpectedSettings(GROUP, 12, { middleTemperature: 30, boostActive: false })).toMatchObject({ boost: true, catchUp: false });
    expect(getExpectedSettings(GROUP, 16, { middleTemperature: 45, boostActive: true })).toMatchObject({ boost: false, catchUp: false });
  });

  it("ballon chaud : profil seul", () => {
    const s = getExpectedSettings(6, EVENING, { middleTemperature: 55, boostActive: false });
    expect(s).toMatchObject({ profile: "normal", boost: false, catchUp: false });
  });
});
