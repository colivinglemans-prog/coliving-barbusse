import { describe, expect, it } from "vitest";
import { pricingInsights } from "@/lib/pricing/insights";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import type { PriceSnapshot, SnapshotDiff } from "@/lib/pricing/snapshot";

/** Données inventées (dépôt public). */
function snapshot(date: string, days: number, overrides: Record<string, [number, number, 0 | 1]> = {}): PriceSnapshot {
  const out: PriceSnapshot = { date, takenAt: `${date}T05:00:00Z`, days: {} };
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10) + i)).toISOString().slice(0, 10);
    out.days[d] = overrides[d] ?? [470, 2, 1];
  }
  return out;
}
const noDiff: SnapshotDiff = { from: "", to: "", priceChanges: [], minStayChanges: [], sold: [], released: [] };
const event = { key: "motogp-2027", name: "MotoGP France 2027", start: "2027-05-14", end: "2027-05-16", confirmed: true };
const run = (o: Partial<Parameters<typeof pricingInsights>[0]>) =>
  pricingInsights({
    today: "2026-12-01",
    snapshot: snapshot("2026-12-01", 200),
    diff: noDiff,
    lastSaleSeen: "2026-11-28",
    events: [],
    config: ENGINE_CONFIG,
    ...o,
  });

describe("alertes pour affiner le pricing", () => {
  it("signale une vente précoce d'une nuit ordinaire (≥ 120 j)", () => {
    const diff = { ...noDiff, sold: [{ date: "2027-04-20", leadDays: 140, price: 520 }] };
    const out = run({ diff });
    expect(out.map((i) => i.kind)).toEqual(["early-sale"]);
    expect(out[0].line).toMatch(/J-140/);
  });

  it("ne signale pas une vente ordinaire à 60 jours", () => {
    expect(run({ diff: { ...noDiff, sold: [{ date: "2027-01-30", leadDays: 60, price: 470 }] } })).toEqual([]);
  });

  it("signale une nuit de grand événement vendue à ≥ 90 jours", () => {
    const diff = { ...noDiff, sold: [{ date: "2027-05-15", leadDays: 165, price: 1_900 }] };
    const out = run({ diff, events: [event], snapshot: snapshot("2026-12-01", 200) });
    expect(out[0]).toMatchObject({ kind: "early-sale" });
    expect(out[0].line).toMatch(/MotoGP/);
  });

  it("repère deux nuits orphelines sous un séjour minimum de 4", () => {
    const snap = snapshot("2026-12-01", 30, {
      "2026-12-10": [470, 2, 0],
      "2026-12-11": [470, 4, 1],
      "2026-12-12": [470, 4, 1],
      "2026-12-13": [470, 2, 0],
    });
    const out = run({ snapshot: snap });
    expect(out.find((i) => i.kind === "orphan")?.line).toMatch(/2 nuit\(s\) à partir du 2026-12-11/);
  });

  it("rappelle un grand événement à J-60 avec des nuits libres", () => {
    const out = run({ today: "2027-03-16", snapshot: snapshot("2027-03-16", 120), events: [event] });
    expect(out.find((i) => i.kind === "event-j60")?.id).toBe("j60:motogp-2027");
  });

  it("signale un creux : moins de 20 % réservé sur 30 jours et aucune vente depuis 14 jours", () => {
    const out = run({ lastSaleSeen: "2026-11-10" });
    expect(out.find((i) => i.kind === "slow-pace")).toBeDefined();
    expect(run({ lastSaleSeen: "2026-11-28" }).find((i) => i.kind === "slow-pace")).toBeUndefined();
  });

  it("garde un identifiant stable dans la semaine pour le creux (pas de répétition)", () => {
    const a = run({ today: "2026-12-01", lastSaleSeen: null }).find((i) => i.kind === "slow-pace")!;
    const b = run({ today: "2026-12-03", snapshot: snapshot("2026-12-03", 200), lastSaleSeen: null }).find((i) => i.kind === "slow-pace")!;
    expect(a.id).toBe(b.id);
  });
});
