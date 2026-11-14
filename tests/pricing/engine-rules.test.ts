import { describe, expect, it } from "vitest";
import { computeEnginePrices } from "@/lib/pricing/engine";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { LE_MANS_EVENTS } from "@/lib/events";

function nights(dates: string[]): Record<string, boolean> {
  return Object.fromEntries(dates.map((d) => [d, true]));
}

describe("règles du moteur (corrections du 2026-11-14)", () => {
  it("les grands événements n'ont pas de palier d'anticipation", () => {
    const far = computeEnginePrices({ today: "2026-11-14", nights: nights(["2027-06-10"]), events: LE_MANS_EVENTS, config: ENGINE_CONFIG });
    const near = computeEnginePrices({ today: "2027-06-05", nights: nights(["2027-06-10"]), events: LE_MANS_EVENTS, config: ENGINE_CONFIG });
    expect(far["2027-06-10"].price).toBe(2_800);
    expect(near["2027-06-10"].price).toBe(2_800);
  });

  it("la nuit d'approche des 24 Heures prend le plancher d'approche, pas celui de la course", () => {
    const r = computeEnginePrices({ today: "2027-06-04", nights: nights(["2027-06-07", "2027-06-08"]), events: LE_MANS_EVENTS, config: ENGINE_CONFIG });
    expect(r["2027-06-07"].reasons[0]).toMatch(/nuit d'approche/);
  });

  it("les fêtes sont resserrées sur les vraies nuits", () => {
    const r = computeEnginePrices({
      today: "2026-11-14",
      nights: nights(["2026-12-21", "2026-12-24", "2026-12-28", "2026-12-31", "2027-01-02"]),
      events: [],
      config: ENGINE_CONFIG,
    });
    expect(r["2026-12-24"].reasons[0]).toMatch(/^Noël/);
    expect(r["2026-12-31"].reasons[0]).toMatch(/^Nouvel An/);
    expect(r["2026-12-21"].reasons[0]).toMatch(/^base/);
    expect(r["2026-12-28"].reasons[0]).toMatch(/^base/);
    expect(r["2027-01-02"].reasons[0]).toMatch(/^base/);
  });
});
