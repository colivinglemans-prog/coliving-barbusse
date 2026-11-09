import { describe, expect, it } from "vitest";
import { confirmedIssues, waterHeaterIssues, type HealthStatus } from "@/lib/water-heater-health";

const GROUP = 14;

/** Ballon conforme à « appoint non permis » : PAC seule, 55 °C, bien chaud. */
function pacOnly(over: Partial<HealthStatus> = {}): HealthStatus {
  return {
    isAvailable: true,
    mode: "manualEcoActive",
    targetTemperature: 55,
    boostActive: false,
    middleTemperature: 52,
    bottomTemperature: 48,
    ...over,
  };
}

const ids = (s: HealthStatus, allowed = false, stalled = false, guests = GROUP) =>
  waterHeaterIssues(guests, s, allowed, stalled).map((i) => i.id);

describe("waterHeaterIssues", () => {
  it("ballon conforme : rien", () => {
    expect(ids(pacOnly())).toEqual([]);
  });

  it("hors ligne : un seul constat", () => {
    expect(ids(pacOnly({ isAvailable: false }))).toEqual(["offline"]);
  });

  it("appoint non permis mais mode qui le laisse tourner : signalé", () => {
    expect(ids(pacOnly({ mode: "manualEcoInactive" }))).toEqual(["booster-mode"]);
    expect(ids(pacOnly({ mode: "autoMode" }))).toEqual(["booster-mode"]);
  });

  it("boost actif alors que non permis : signalé", () => {
    expect(ids(pacOnly({ boostActive: true }))).toEqual(["boost-on"]);
  });

  it("appoint permis : ni le mode ni le boost ne sont exigés", () => {
    expect(ids(pacOnly({ targetTemperature: 60 }), true)).toEqual([]);
    expect(ids(pacOnly({ mode: "manualEcoInactive", boostActive: true, targetTemperature: 60 }), true)).toEqual([]);
  });

  it("consigne divergente : signalée", () => {
    expect(ids(pacOnly({ targetTemperature: 60 }))).toEqual(["target"]);
  });

  it("PAC à l'arrêt : signalée, quel que soit le groupe", () => {
    expect(ids(pacOnly({ middleTemperature: 25 }), false, true)).toEqual(["pac-stalled"]);
    expect(ids(pacOnly({ middleTemperature: 25 }), false, true, 3)).toEqual(["pac-stalled"]);
  });

  it("ballon vide le soir, PAC qui tourne : rien (le classique prend le relais)", () => {
    expect(ids(pacOnly({ middleTemperature: 19, bottomTemperature: 14 }))).toEqual([]);
  });

  it("sonde du milieu à 0 ou absente : signalée", () => {
    expect(ids(pacOnly({ middleTemperature: 0 }))).toEqual(["middle-missing"]);
    expect(ids(pacOnly({ middleTemperature: undefined }))).toEqual(["middle-missing"]);
  });
});

describe("confirmedIssues", () => {
  const issues = [
    { id: "pac-stalled", message: "a" },
    { id: "boost-on", message: "b" },
  ];

  it("seuls les constats déjà là au contrôle précédent partent", () => {
    expect(confirmedIssues(issues, ["boost-on", "mode"]).map((i) => i.id)).toEqual(["boost-on"]);
  });

  it("premier contrôle, ou Redis injoignable : rien ne part", () => {
    expect(confirmedIssues(issues, [])).toEqual([]);
  });
});
