import { describe, expect, it } from "vitest";
import { confirmedIssues, waterHeaterIssues, type HealthStatus } from "@/lib/water-heater-health";

const GROUP = 14;

/** Ballon conforme au profil xl hors fenêtre de boost (PAC seule), bien chaud. */
function xl(over: Partial<HealthStatus> = {}): HealthStatus {
  return {
    isAvailable: true,
    mode: "manualEcoActive",
    targetTemperature: 60,
    boostActive: false,
    middleTemperature: 55,
    bottomTemperature: 50,
    ...over,
  };
}

const ids = (guests: number, hour: number, s: HealthStatus) => waterHeaterIssues(guests, hour, s).map((i) => i.id);

describe("waterHeaterIssues", () => {
  it("ballon conforme : rien", () => {
    expect(ids(GROUP, 19, xl())).toEqual([]);
  });

  it("hors ligne : un seul constat", () => {
    expect(ids(GROUP, 19, xl({ isAvailable: false }))).toEqual(["offline"]);
  });

  it("rattrapage désactivé : ballon vide le soir sans boost, rien à signaler", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 19 }))).toEqual([]);
    expect(ids(GROUP, 7, xl({ middleTemperature: 30 }))).toEqual([]);
    expect(ids(GROUP, 23, xl({ middleTemperature: 15 }))).toEqual([]);
  });

  it("boost du soir (ancien rattrapage) : signalé", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 45, boostActive: true }))).toEqual(["boost-on"]);
  });

  it("appoint autorisé le soir (mode Performance) : signalé", () => {
    expect(ids(GROUP, 20, xl({ mode: "manualEcoInactive" }))).toEqual(["mode"]);
  });

  it("boost allumé sans raison : signalé", () => {
    expect(ids(GROUP, 23, xl({ boostActive: true }))).toEqual(["boost-on"]);
    expect(ids(GROUP, 19, xl({ boostActive: true, middleTemperature: 55 }))).toEqual(["boost-on"]);
  });

  it("fenêtre de boost du profil non appliquée : signalé", () => {
    expect(ids(GROUP, 12, xl({ mode: "manualEcoInactive" }))).toEqual(["boost-off"]);
    expect(ids(GROUP, 12, xl({ mode: "manualEcoInactive", boostActive: true }))).toEqual([]);
  });

  it("sonde du milieu à 0 : signalée, et pas de rattrapage exigé", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 0, bottomTemperature: 55 }))).toEqual(["middle-missing"]);
    expect(ids(GROUP, 19, xl({ middleTemperature: undefined, bottomTemperature: 20 }))).toEqual(["middle-missing"]);
  });
});

describe("confirmedIssues", () => {
  const issues = [
    { id: "underheat", message: "a" },
    { id: "boost-on", message: "b" },
  ];

  it("seuls les constats déjà là au contrôle précédent partent", () => {
    expect(confirmedIssues(issues, ["boost-on", "mode"]).map((i) => i.id)).toEqual(["boost-on"]);
  });

  it("premier contrôle, ou Redis injoignable : rien ne part", () => {
    expect(confirmedIssues(issues, [])).toEqual([]);
  });
});
