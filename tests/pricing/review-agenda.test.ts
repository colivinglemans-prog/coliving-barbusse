import { describe, expect, it } from "vitest";
import { buildReviewAgenda, REVIEW_PROMPT } from "@/lib/pricing/review-agenda";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import type { PushRun } from "@/lib/pricing/push";

/** Données inventées (dépôt public). */
const event = { key: "24h-moto-2027", name: "24 Heures Moto 2027", start: "2027-04-08", end: "2027-04-11", confirmed: true };
const base = { weekDiffs: [], lastRun: null, insights: [], events: [event], config: ENGINE_CONFIG };
const run: PushRun = {
  at: "2026-12-08T05:10:00Z",
  mode: "live",
  outcome: "written",
  writes: 12,
  quarantined: [{ date: "2026-12-20", from: 400, to: 600, changePct: 50 }],
  rejections: [],
  warnings: [],
  mismatches: [],
  unchanged: 380,
  dailyChanges: 9,
  sample: [],
};

describe("ordre du jour du mardi", () => {
  it("annonce une semaine calme, mais garde toujours la phrase à copier", () => {
    const a = buildReviewAgenda({ ...base, today: "2027-01-05" });
    expect(a.decisions).toBe(0);
    expect(a.title).toMatch(/semaine calme/);
    expect(a.body).toContain("Aucune nuit vendue");
    expect(a.body.trim().endsWith(REVIEW_PROMPT)).toBe(true);
  });

  it("compte les ventes, la quarantaine et les points ouverts", () => {
    const a = buildReviewAgenda({
      ...base,
      today: "2026-12-08",
      weekDiffs: [{ from: "", to: "2026-12-07", priceChanges: [], minStayChanges: [], released: [], sold: [{ date: "2027-01-15", leadDays: 39, price: 470 }] }],
      lastRun: run,
      insights: [{ id: "orphan:x", kind: "orphan", priority: 3, line: "Nuits orphelines : …" }],
    });
    expect(a.body).toContain("1 nuit(s) vendue(s), prix affiché moyen 470 €");
    expect(a.body).toContain("1 date(s) en quarantaine");
    expect(a.body).toContain("9 cible(s) changée(s)");
    expect(a.body).toContain("Nuits orphelines");
    expect(a.decisions).toBeGreaterThanOrEqual(3);
  });

  it("supporte un dernier passage enregistré avant l'ajout de dailyChanges", () => {
    const old = { ...run, dailyChanges: undefined } as unknown as PushRun;
    expect(buildReviewAgenda({ ...base, today: "2026-12-08", lastRun: old }).body).not.toContain("undefined");
  });

  it("annonce un J-60 qui entre dans les 21 jours, pas avant", () => {
    // 24H Moto 2027 le 08/04 → J-60 le 07/02/2027.
    expect(buildReviewAgenda({ ...base, today: "2027-01-20" }).body).toContain("24 Heures Moto 2027 à J-60");
    expect(buildReviewAgenda({ ...base, today: "2027-01-10" }).body).not.toContain("24 Heures Moto 2027 à J-60");
  });

  it("annonce la bascule du 01/12 dans sa fenêtre et l'oublie une fois passée", () => {
    expect(buildReviewAgenda({ ...base, today: "2026-11-17" }).body).toMatch(/01\/12 \(J-14\) : Bascule/);
    expect(buildReviewAgenda({ ...base, today: "2026-12-08" }).body).not.toContain("Bascule visée");
  });

  it("tient sous la limite de ntfy même avec beaucoup de points", () => {
    const insights = Array.from({ length: 30 }, (_, i) => ({
      id: `x${i}`,
      kind: "orphan" as const,
      priority: 3 as const,
      line: "Nuits orphelines : ".padEnd(400, "x"),
    }));
    const a = buildReviewAgenda({ ...base, today: "2026-12-08", insights });
    expect(new TextEncoder().encode(a.body).length).toBeLessThan(4_000);
    expect(a.body).toContain(REVIEW_PROMPT);
  });
});
