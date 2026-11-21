import { describe, expect, it } from "vitest";
import {
  CUTOVER,
  MARKDOWN_RULE,
  RAMP_RULE,
  markdownFactor,
  markdownStep,
  nextMarkdownDate,
  pushLimits,
  rampBand,
  rampTarget,
  validReference,
} from "@/lib/pricing/cutover";
import { buildTargets, planMarkdown, type MarkdownState } from "@/lib/pricing/push";
import { planPush } from "@/lib/pricing/push-plan";
import type { CutoverRef } from "@/lib/pricing/cutover-ref";

/** Bascule du 2026-12-01 : rampe, baisse par paliers, limites datées. Données inventées. */

function days(from: string, n: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = new Date(`${from}T00:00:00Z`);
    x.setUTCDate(x.getUTCDate() + i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

const free = (dates: string[]) =>
  Object.fromEntries(dates.map((d) => [d, { price: 470, minStay: 2, available: true }]));

describe("rampe (nuits ordinaires de 2027)", () => {
  it("avant la bascule, la bande ne s'inverse pas (semaine 0)", () => {
    const b = rampBand(420, "2026-11-21", RAMP_RULE);
    expect(b.week).toBe(0);
    expect(b.lo).toBeCloseTo(378);
    expect(b.hi).toBeCloseTo(462);
  });

  it("±10 % la 1re semaine, ±21 % la 2e, ±33 % la 3e", () => {
    expect(rampTarget(470, 420, "2026-12-01", RAMP_RULE)).toBe(462);
    expect(rampTarget(470, 420, "2026-12-08", RAMP_RULE)).toBe(470);
    expect(rampTarget(600, 420, "2026-12-08", RAMP_RULE)).toBe(508);
    expect(rampTarget(600, 420, "2026-12-15", RAMP_RULE)).toBe(559);
  });

  it("vaut aussi à la baisse", () => {
    expect(rampTarget(300, 420, "2026-12-01", RAMP_RULE)).toBe(378);
    expect(rampTarget(300, 420, "2026-12-08", RAMP_RULE)).toBe(340);
  });

  it("une référence à 0 €, au-dessus de 3 500 € ou absente n'est pas valide", () => {
    expect(validReference(0)).toBe(false);
    expect(validReference(3_600)).toBe(false);
    expect(validReference(undefined)).toBe(false);
    expect(validReference(420)).toBe(true);
  });

  it("buildTargets : décembre au moteur, 2027 rampé, Nouvel An et nuits sans référence au moteur", () => {
    const dates = days("2026-12-01", 70);
    const ref: CutoverRef = {
      date: "2026-11-30",
      nights: Object.fromEntries(dates.map((d) => [d, [330, 2] as [number, number]])),
    };
    delete ref.nights["2027-01-20"]; // pas de référence
    ref.nights["2027-01-21"] = [0, 2]; // référence invalide
    const withRef = buildTargets("2026-12-01", free(dates), 70, { ref, markdownSteps: {} });
    const noRef = buildTargets("2026-12-01", free(dates), 70);

    expect(withRef["2026-12-12"]).toEqual(noRef["2026-12-12"]); // décembre : moteur
    expect(withRef["2027-01-01"]).toEqual(noRef["2027-01-01"]); // Nouvel An : période fixe
    expect(withRef["2027-01-20"]).toEqual(noRef["2027-01-20"]);
    expect(withRef["2027-01-21"]).toEqual(noRef["2027-01-21"]);
    // Nuit ordinaire de janvier : moteur bridé à 330 × 1,1 = 363 la première semaine.
    expect(withRef["2027-01-12"]).toMatchObject({ price: 363, source: "ramp" });
  });

  it("la rampe s'arrête au 01/02/2027 (date d'envoi)", () => {
    const dates = days("2027-02-01", 20);
    const ref: CutoverRef = { date: "2026-11-30", nights: Object.fromEntries(dates.map((d) => [d, [330, 2] as [number, number]])) };
    const t = buildTargets(CUTOVER.rampUntil, free(dates), 20, { ref, markdownSteps: {} });
    expect(Object.values(t).every((n) => n.source !== "ramp")).toBe(true);
  });

  it("150 nuits rampées un mardi ne font pas rejeter l'envoi pendant la rampe", () => {
    const dates = days("2027-07-10", 150); // hors grands événements (pas de plancher)
    const current = Object.fromEntries(dates.map((d) => [d, { price: 400, minStay: 2 }]));
    const target = Object.fromEntries(dates.map((d) => [d, { price: 440, minStay: 2, source: "ramp" as const }]));
    const limits = pushLimits("2026-12-08", {}, 395);
    expect(planPush({ current, target, maxChange: limits.maxChange, maxDates: limits.maxDates }).status).toBe("ok");
    const after = pushLimits("2027-02-08", {}, 395);
    expect(planPush({ current, target, maxChange: after.maxChange, maxDates: after.maxDates }).status).toBe("rejected");
  });
});

describe("baisse automatique des grands événements", () => {
  const FIRST = "2027-04-07"; // 24H Moto

  it("palier 0 avant J-120, 1 à J-120 pile, 2 à J-99, figé si demandé", () => {
    expect(markdownStep("2026-12-07", FIRST, MARKDOWN_RULE)).toBe(0);
    expect(markdownStep("2026-12-08", FIRST, MARKDOWN_RULE)).toBe(1);
    expect(markdownStep("2026-12-28", FIRST, MARKDOWN_RULE)).toBe(1);
    expect(markdownStep("2026-12-29", FIRST, MARKDOWN_RULE)).toBe(2);
    expect(markdownStep("2027-03-20", FIRST, { ...MARKDOWN_RULE, freezeAtStep: 2 })).toBe(2);
    expect(markdownFactor(2, MARKDOWN_RULE)).toBeCloseTo(0.81);
  });

  it("plus de palier une fois l'événement commencé", () => {
    expect(markdownStep("2027-04-07", FIRST, MARKDOWN_RULE)).toBe(markdownStep("2027-06-30", FIRST, MARKDOWN_RULE));
  });

  it("un bloc terminé n'a plus de palier, et la vente ne se lit que sur les nuits à venir", () => {
    expect(planMarkdown("2027-04-12", {}, {}).some((b) => b.id === "24h-moto-2027")).toBe(false);
    // Le 10/04, la nuit du 08/04 (passée) ne compte plus : seules 10 et 11/04 sont lues.
    const cal = { "2027-04-08": { available: false }, "2027-04-10": { available: true }, "2027-04-11": { available: true } };
    expect(planMarkdown("2027-04-10", cal, {}).find((b) => b.id === "24h-moto-2027")?.sold).toBe(false);
  });

  it("l'ancre ne descend jamais sous le plancher, même au palier 0", () => {
    const ref: CutoverRef = { date: "2026-11-30", nights: { "2027-04-11": [400, 3] } };
    expect(buildTargets("2027-04-11", free(["2027-04-11"]), 1, { ref, markdownSteps: {} })["2027-04-11"]).toMatchObject({
      price: 600,
      source: "override",
    });
  });

  it("annonce le palier suivant", () => {
    expect(nextMarkdownDate("2026-12-01", FIRST, MARKDOWN_RULE)).toBe("2026-12-08");
    expect(nextMarkdownDate("2026-12-08", FIRST, MARKDOWN_RULE)).toBe("2026-12-29");
    expect(nextMarkdownDate("2026-12-08", FIRST, { ...MARKDOWN_RULE, freezeAtStep: 1 })).toBeNull();
  });

  it("buildTargets applique le palier, jamais sous le plancher (600 €)", () => {
    const dates = days(FIRST, 5);
    const ref: CutoverRef = { date: "2026-11-30", nights: Object.fromEntries(dates.map((d) => [d, [1_050, 3] as [number, number]])) };
    const cal = free(dates);
    expect(buildTargets(FIRST, cal, 1, { ref, markdownSteps: {} })[FIRST]).toMatchObject({ price: 1_050, source: "override" });
    expect(buildTargets(FIRST, cal, 1, { ref, markdownSteps: { "24h-moto-2027": 2 } })[FIRST]).toMatchObject({
      price: 851,
      source: "markdown",
    });
    expect(buildTargets(FIRST, cal, 1, { ref, markdownSteps: { "24h-moto-2027": 9 } })[FIRST].price).toBe(600);
  });

  it("semaine des essais : plancher 1 560 € avant le 30/01, 900 € ensuite", () => {
    const cal = free(["2027-06-01"]);
    const early = buildTargets("2027-01-29", cal, 124, { ref: null, markdownSteps: { "essais-2027": 1 } });
    const late = buildTargets("2027-05-20", cal, 13, { ref: null, markdownSteps: { "essais-2027": 9 } });
    expect(early["2027-06-01"].price).toBe(1_560);
    expect(late["2027-06-01"].price).toBe(900);
  });

  it("une nuit vendue gèle tout le bloc au palier précédent, et il reste gelé si elle se libère", () => {
    const nights = days(FIRST, 5);
    const cal = Object.fromEntries(nights.map((d) => [d, { available: true }]));
    const free1 = planMarkdown("2027-01-10", cal, {}).find((b) => b.id === "24h-moto-2027")!;
    expect(free1).toMatchObject({ step: 2, frozen: false });

    cal["2027-04-09"] = { available: false };
    const prev: Record<string, MarkdownState> = { "24h-moto-2027": { step: 2, frozen: false, at: "x" } };
    const sold = planMarkdown("2027-02-20", cal, prev).find((b) => b.id === "24h-moto-2027")!;
    expect(sold).toMatchObject({ step: 2, frozen: true, sold: true, next: null });

    cal["2027-04-09"] = { available: true };
    const released = planMarkdown("2027-03-01", cal, { "24h-moto-2027": { step: 2, frozen: true, at: "y" } }).find(
      (b) => b.id === "24h-moto-2027",
    )!;
    expect(released).toMatchObject({ step: 2, frozen: true, sold: false });
  });

  it("sans état et déjà vendu : gelé au palier 0 (sens prudent)", () => {
    const cal = { "2027-04-08": { available: false } };
    expect(planMarkdown("2027-03-01", cal, {}).find((b) => b.id === "24h-moto-2027")).toMatchObject({ step: 0, frozen: true });
  });

  it("les 24 Heures (vendues, sans baisse) n'ont pas de palier", () => {
    expect(planMarkdown("2027-03-01", {}, {}).some((b) => b.id === "24h-mans-2027")).toBe(false);
  });
});

describe("limites datées de l'envoi", () => {
  it("défauts hors fenêtre, tout l'horizon pendant la rampe, variation libre jusqu'au premier envoi écrit", () => {
    expect(pushLimits("2026-11-25", {}, 395)).toMatchObject({ maxChange: 0.25, maxDates: 60 });
    expect(pushLimits("2026-12-01", {}, 395)).toMatchObject({ maxChange: 1, maxDates: 395 });
    // L'envoi du 01/12 a échoué : le 02/12 le rattrape.
    expect(pushLimits("2026-12-02", {}, 395, false)).toMatchObject({ maxChange: 1, maxDates: 395 });
    expect(pushLimits("2026-12-02", {}, 395, true)).toMatchObject({ maxChange: 0.25, maxDates: 395 });
    expect(pushLimits("2027-02-01", {}, 395)).toMatchObject({ maxChange: 0.25, maxDates: 60 });
  });

  it("une variable ne peut que resserrer ; plus large, elle est ignorée et signalée", () => {
    const wide = pushLimits("2027-03-01", { maxChange: 10, maxDates: 395 }, 395);
    expect(wide).toMatchObject({ maxChange: 0.25, maxDates: 60 });
    expect(wide.warnings).toHaveLength(2);
    expect(pushLimits("2026-12-01", { maxChange: 0.1, maxDates: 30 }, 395)).toMatchObject({ maxChange: 0.1, maxDates: 30 });
  });
});

describe("fichier de référence (lib/pricing/cutover-ref.json)", () => {
  it("non rempli avant le 30/11, ou complet et valide une fois rempli", async () => {
    const { CUTOVER_REF } = await import("@/lib/pricing/cutover-ref");
    const { referenceProblems } = await import("@/lib/pricing/push");
    if (CUTOVER_REF.date === null) {
      expect(Object.keys(CUTOVER_REF.nights)).toHaveLength(0);
    } else {
      expect(referenceProblems(CUTOVER_REF, CUTOVER.startedOn)).toEqual([]);
    }
  });
});
