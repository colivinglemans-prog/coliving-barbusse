import { describe, expect, it } from "vitest";
import { confirmedIssues, waterHeaterIssues, type HealthStatus } from "@/lib/water-heater-health";

const GROUP = 14;

/** Ballon conforme au profil xl hors fenêtre de boost, bien chaud. */
function xl(over: Partial<HealthStatus> = {}): HealthStatus {
  return {
    isAvailable: true,
    mode: "manualEcoInactive",
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

  it("rattrapage : entre 40 et 50 °C, boost on ou off sont tous deux admis", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 45, boostActive: true }))).toEqual([]);
    expect(ids(GROUP, 19, xl({ middleTemperature: 45, boostActive: false }))).toEqual([]);
  });

  it("sous 40 °C sans boost à l'heure des douches : sous-chauffe", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 30 }))).toEqual(["underheat"]);
  });

  it("sous 40 °C hors heures de douche : rien (pas de boost voulu)", () => {
    expect(ids(GROUP, 23, xl({ middleTemperature: 15 }))).toEqual([]);
    expect(ids(GROUP, 10, xl({ middleTemperature: 15 }))).toEqual([]);
  });

  it("boost allumé sans raison : signalé", () => {
    expect(ids(GROUP, 23, xl({ boostActive: true }))).toEqual(["boost-on"]);
    expect(ids(GROUP, 19, xl({ boostActive: true, middleTemperature: 55 }))).toEqual(["boost-on"]);
  });

  it("fenêtre de boost du profil non appliquée : signalé", () => {
    expect(ids(GROUP, 12, xl())).toEqual(["boost-off"]);
  });

  it("sonde du milieu à 0 : signalée, et pas de rattrapage exigé", () => {
    expect(ids(GROUP, 19, xl({ middleTemperature: 0, bottomTemperature: 55 }))).toEqual(["middle-missing"]);
    expect(ids(GROUP, 19, xl({ middleTemperature: undefined, bottomTemperature: 20 }))).toEqual([
      "middle-missing",
      "underheat-bottom",
    ]);
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
