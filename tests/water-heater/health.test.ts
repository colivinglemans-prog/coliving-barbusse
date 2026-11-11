import { describe, expect, it } from "vitest";
import { waterHeaterIssues, type HealthStatus } from "@/lib/water-heater-health";

const GROUP = 14;

/** Ballon conforme hors pic : Éco 55 °C, pas d'Absence, bien chaud. */
function eco(over: Partial<HealthStatus> = {}): HealthStatus {
  return {
    isAvailable: true,
    mode: "manualEcoActive",
    targetTemperature: 55,
    boostActive: false,
    absenceActive: false,
    middleTemperature: 52,
    bottomTemperature: 48,
    ...over,
  };
}

const ids = (s: HealthStatus, hour = 12, minute = 0, stalled = false, guests = GROUP) =>
  waterHeaterIssues(guests, hour, minute, s, stalled).map((i) => i.id);

describe("waterHeaterIssues", () => {
  it("conforme hors pic, et en Absence au pic : rien", () => {
    expect(ids(eco())).toEqual([]);
    expect(ids(eco({ absenceActive: true }), 19)).toEqual([]);
  });

  it("hors ligne : rien ici, l'automation porte l'alerte « thermo injoignable »", () => {
    expect(ids(eco({ isAvailable: false }))).toEqual([]);
  });

  it("pic sans Absence : signalé ; Absence restée hors pic : signalée", () => {
    expect(ids(eco(), 19)).toEqual(["absence-missing"]);
    expect(ids(eco({ absenceActive: true }), 12)).toEqual(["absence-stuck"]);
  });

  it("maison vide au pic : pas d'Absence attendue", () => {
    expect(ids(eco({ targetTemperature: 50 }), 19, 0, false, 0)).toEqual([]);
  });

  it("boost, mode ou consigne divergents : signalés", () => {
    expect(ids(eco({ boostActive: true }))).toEqual(["boost-on"]);
    expect(ids(eco({ mode: "manualEcoInactive" }))).toEqual(["mode"]);
    expect(ids(eco({ targetTemperature: 60 }))).toEqual(["target"]);
  });

  it("PAC à l'arrêt et sonde du milieu absente : signalées", () => {
    expect(ids(eco({ middleTemperature: 25 }), 12, 0, true)).toEqual(["pac-stalled"]);
    expect(ids(eco({ middleTemperature: 0 }))).toEqual(["middle-missing"]);
  });
});
