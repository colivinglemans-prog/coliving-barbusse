import { describe, expect, it } from "vitest";
import { getExpectedSettings, getProfileSettings, heatPumpStalled, isPeak, PAC_STALL } from "@/lib/cozytouch";
import { absenceSince, entryOlderThan, type WaterHeaterLogEntry } from "@/lib/water-heater-log";

describe("heures de pic : 4 h 45-7 h et 16 h 45-22 h", () => {
  it("bornes", () => {
    expect(isPeak(4, 30)).toBe(false);
    expect(isPeak(4, 45)).toBe(true);
    expect(isPeak(6, 59)).toBe(true);
    expect(isPeak(7, 0)).toBe(false);
    expect(isPeak(16, 30)).toBe(false);
    expect(isPeak(16, 45)).toBe(true);
    expect(isPeak(20, 0)).toBe(true);
    expect(isPeak(21, 45)).toBe(true);
    expect(isPeak(22, 0)).toBe(false);
    expect(isPeak(12, 0)).toBe(false);
    expect(isPeak(2, 0)).toBe(false);
  });
});

describe("réglages : Éco 55 °C, Absence au pic, jamais de boost", () => {
  it("voyageurs présents : Absence au pic seulement", () => {
    for (const guests of [1, 6, 10, 14, 20]) {
      expect(getExpectedSettings(guests, 19, 0), `${guests} pers. 19 h`).toMatchObject({
        mode: "manualEcoActive",
        targetTemperature: 55,
        boost: false,
        absence: true,
        peak: true,
      });
      expect(getExpectedSettings(guests, 12, 0), `${guests} pers. 12 h`).toMatchObject({ absence: false, boost: false });
      expect(getExpectedSettings(guests, 23, 0), `${guests} pers. 23 h`).toMatchObject({ absence: false });
    }
  });

  it("maison vide : Éco 50 °C, jamais d'Absence", () => {
    expect(getProfileSettings("vacant", true)).toEqual({ mode: "manualEcoActive", targetTemperature: 50, boost: false, absence: false });
  });
});

describe("PAC à l'arrêt", () => {
  const now = new Date("2026-11-09T12:00:00Z");
  const s = { heatPumpHours: 1678, middleTemperature: 30, bottomTemperature: 25, targetTemperature: 55, absenceActive: false };

  it("compteur immobile depuis 2 h, eau froide, pas d'Absence : à l'arrêt", () => {
    expect(heatPumpStalled(s, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now, false)).toBe(true);
  });

  it("1 h seulement (compteur en heures entières), Absence, eau chaude ou compteur qui avance : non", () => {
    expect(heatPumpStalled(s, { at: "2026-11-09T11:00:00Z", heatPumpHours: 1678 }, now, false)).toBe(false);
    expect(heatPumpStalled({ ...s, absenceActive: true }, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now, false)).toBe(false);
    expect(heatPumpStalled(s, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now, true)).toBe(false);
    expect(heatPumpStalled({ ...s, middleTemperature: 52 }, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1678 }, now, false)).toBe(false);
    expect(heatPumpStalled(s, { at: "2026-11-09T10:00:00Z", heatPumpHours: 1677 }, now, false)).toBe(false);
  });

  it("sondes aberrantes : rien d'inventé", () => {
    const bad = { ...s, middleTemperature: 0, bottomTemperature: 0 };
    expect(heatPumpStalled(bad, { at: "2026-11-09T09:00:00Z", heatPumpHours: 1678 }, now, false)).toBe(false);
  });

  it("journal : entrée vieille de 2 h et Absence dans l'intervalle", () => {
    const log = [
      { at: "2026-11-09T11:45:00Z", absence: false },
      { at: "2026-11-09T10:30:00Z", absence: true },
      { at: "2026-11-09T09:50:00Z", absence: false, heatPumpHours: 1678 },
    ] as WaterHeaterLogEntry[];
    const earlier = entryOlderThan(log, now, PAC_STALL.afterMs);
    expect(earlier?.at).toBe("2026-11-09T09:50:00Z");
    expect(absenceSince(log, earlier?.at)).toBe(true);
    expect(absenceSince(log.slice(0, 1), "2026-11-09T11:00:00Z")).toBe(false);
  });
});
