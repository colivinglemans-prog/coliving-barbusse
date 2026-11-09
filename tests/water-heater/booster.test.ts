import { describe, expect, it } from "vitest";
import {
  BOOSTER_RULE,
  decideBooster,
  getExpectedSettings,
  getProfileSettings,
  heatPumpStalled,
  type BoosterInput,
} from "@/lib/cozytouch";
import { entryOlderThan, type WaterHeaterLogEntry } from "@/lib/water-heater-log";

const BUDGET = 2700;
const base: BoosterInput = {
  guests: 14,
  hour: 12,
  radiatorLoadW: 1500,
  budgetW: BUDGET,
  status: { middleTemperature: 30 },
  stalled: false,
};
const decide = (over: Partial<BoosterInput>) => decideBooster({ ...base, ...over });

describe("decideBooster — appoint seulement 10 h-16 h, sous budget, quand la PAC ne suffit pas", () => {
  it("toutes les conditions réunies : permis", () => {
    expect(decide({})).toEqual({ allowed: true, reason: "allowed" });
  });

  it("hors de 10 h-16 h : jamais, même ballon froid et maison peu chargée", () => {
    for (const hour of [0, 3, 6, 9, 16, 17, 19, 20, 22, 23]) {
      expect(decide({ hour }), `${hour} h`).toEqual({ allowed: false, reason: "hours" });
    }
    for (const hour of [10, 11, 15]) expect(decide({ hour }).allowed, `${hour} h`).toBe(true);
  });

  it("radiateurs trop chargés, ou charge inconnue : refusé", () => {
    expect(decide({ radiatorLoadW: BUDGET + 1 })).toEqual({ allowed: false, reason: "load" });
    expect(decide({ radiatorLoadW: BUDGET }).allowed).toBe(true);
    expect(decide({ radiatorLoadW: null })).toEqual({ allowed: false, reason: "load-unknown" });
  });

  it("la PAC suffit (milieu ≥ 45 °C, PAC qui tourne) : refusé", () => {
    expect(decide({ status: { middleTemperature: BOOSTER_RULE.pacSufficientMiddle } })).toEqual({
      allowed: false,
      reason: "pac-ok",
    });
    expect(decide({ status: { middleTemperature: 44 } }).allowed).toBe(true);
  });

  it("PAC à l'arrêt : permis même ballon tiède ou sonde du milieu absente", () => {
    expect(decide({ status: { middleTemperature: 50 }, stalled: true }).allowed).toBe(true);
    expect(decide({ status: { middleTemperature: undefined }, stalled: true }).allowed).toBe(true);
    expect(decide({ status: { middleTemperature: undefined }, stalled: false }).reason).toBe("pac-ok");
  });

  it("maison vide : jamais", () => {
    expect(decide({ guests: 0 })).toEqual({ allowed: false, reason: "vacant" });
  });
});

describe("réglages par profil", () => {
  it("sans appoint : PAC seule partout, 55 °C occupé, 50 °C vide, jamais de boost", () => {
    for (const guests of [1, 4, 6, 10, 14, 20]) {
      expect(getExpectedSettings(guests, false), `${guests} pers.`).toMatchObject({
        mode: "manualEcoActive",
        targetTemperature: 55,
        boost: false,
      });
    }
    expect(getExpectedSettings(0, false)).toMatchObject({ profile: "vacant", mode: "manualEcoActive", targetTemperature: 50 });
  });

  it("avec appoint : Performance, boost et 60 °C à partir de 9 personnes", () => {
    expect(getProfileSettings("low", true)).toEqual({ mode: "manualEcoInactive", targetTemperature: 55, boost: false });
    expect(getProfileSettings("normal", true)).toEqual({ mode: "manualEcoInactive", targetTemperature: 55, boost: false });
    expect(getProfileSettings("high", true)).toEqual({ mode: "manualEcoInactive", targetTemperature: 60, boost: true });
    expect(getProfileSettings("xl", true)).toEqual({ mode: "manualEcoInactive", targetTemperature: 60, boost: true });
    expect(getProfileSettings("vacant", true)).toEqual({ mode: "manualEcoActive", targetTemperature: 50, boost: false });
  });
});

describe("heatPumpStalled", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const status = { heatPumpHours: 1678, middleTemperature: 30, bottomTemperature: 25, targetTemperature: 55 };

  it("compteur immobile depuis deux heures, eau froide : à l'arrêt", () => {
    expect(heatPumpStalled(status, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now)).toBe(true);
  });

  it("compteur qui avance, mesure trop récente, eau chaude, ou rien à comparer : non", () => {
    expect(heatPumpStalled(status, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1677 }, now)).toBe(false);
    expect(heatPumpStalled(status, { at: "2026-11-09T11:00:00Z", heatPumpHours: 1678 }, now)).toBe(false);
    expect(heatPumpStalled({ ...status, middleTemperature: 52 }, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now)).toBe(false);
    expect(heatPumpStalled(status, null, now)).toBe(false);
  });

  it("le journal du 9/11 : PAC bloquée de 6 h à 19 h (compteur à 1678)", () => {
    const log = [
      { at: "2026-11-09T11:01:03Z", heatPumpHours: 1678 },
      { at: "2026-11-09T10:01:01Z", heatPumpHours: 1678 },
      { at: "2026-11-09T09:01:03Z", heatPumpHours: 1678 },
    ] as WaterHeaterLogEntry[];
    const t = new Date("2026-11-09T11:16:00Z");
    const earlier = entryOlderThan(log, t, BOOSTER_RULE.stalledAfterMs);
    expect(earlier?.at).toBe("2026-11-09T09:01:03Z");
    expect(heatPumpStalled({ ...status, middleTemperature: 25 }, earlier, t)).toBe(true);
  });
});

describe("relecture : hystérésis et compteur en heures entières", () => {
  it("appoint déjà permis : il le reste jusqu'à 50 °C au milieu", () => {
    expect(decide({ status: { middleTemperature: 47 }, wasAllowed: true }).allowed).toBe(true);
    expect(decide({ status: { middleTemperature: 47 }, wasAllowed: false }).reason).toBe("pac-ok");
    expect(decide({ status: { middleTemperature: 50 }, wasAllowed: true }).reason).toBe("pac-ok");
  });

  it("PAC à l'arrêt jugée sur 2 h, pas sur 1 h (compteur en heures entières)", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const s = { heatPumpHours: 1678, middleTemperature: 40, bottomTemperature: 35, targetTemperature: 55 };
    expect(heatPumpStalled(s, { at: "2026-11-09T11:00:00Z", heatPumpHours: 1678 }, now)).toBe(false);
    expect(heatPumpStalled(s, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now)).toBe(true);
  });

  it("sondes aberrantes : pas de PAC à l'arrêt inventée", () => {
    const now = new Date("2026-11-09T12:00:00Z");
    const s = { heatPumpHours: 1678, middleTemperature: 0, bottomTemperature: 0, targetTemperature: 55 };
    expect(heatPumpStalled(s, { at: "2026-11-09T09:00:00Z", heatPumpHours: 1678 }, now)).toBe(false);
  });
});
