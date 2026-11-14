import { describe, expect, it } from "vitest";
import { planPush, type CurrentNight, type TargetNight } from "@/lib/pricing/push-plan";
import {
  ABSOLUTE_BOUNDS,
  effectivePrice,
  eventFloorOn,
  guaranteedDiscount,
  price1For,
} from "@/lib/pricing/guards";
import { PRICE_OVERRIDES, overrideOn } from "@/lib/pricing/overrides";

const engine = (price: number, minStay = 2): TargetNight => ({ price, minStay, source: "engine" });
const now = (price: number, minStay = 2): CurrentNight => ({ price, minStay });
const plan = (current: Record<string, CurrentNight>, target: Record<string, TargetNight>, maxDates = 60, maxChange = 0.25) =>
  planPush({ current, target, maxDates, maxChange });

describe("remise de durée et prix effectif", () => {
  it("compense −8 % dès un séjour minimum de 4 nuits, −10 % dès 7", () => {
    expect(guaranteedDiscount(2)).toBe(1);
    expect(guaranteedDiscount(4)).toBe(0.92);
    expect(guaranteedDiscount(7)).toBe(0.9);
    expect(price1For(2_220, 4)).toBe(2_413);
    expect(price1For(500, 2)).toBe(500);
    expect(effectivePrice(price1For(2_220, 4), 4)).toBeGreaterThanOrEqual(2_219);
  });
});

describe("planPush", () => {
  it("n'écrit que ce qui change, et compte le reste", () => {
    const p = plan(
      { "2027-01-10": now(470), "2027-01-11": now(470) },
      { "2027-01-10": engine(470), "2027-01-11": engine(490) },
    );
    expect(p.status).toBe("ok");
    expect(Object.keys(p.writes)).toEqual(["2027-01-11"]);
    expect(p.unchanged).toBe(1);
    expect(p.writes["2027-01-11"]).toMatchObject({ price1: 490, minStay: 2, before: { price: 470, minStay: 2 } });
  });

  it("écrit aussi un changement de séjour minimum seul", () => {
    const p = plan({ "2027-01-10": now(470, 2) }, { "2027-01-10": engine(470, 3) });
    expect(p.writes["2027-01-10"]).toMatchObject({ price1: 470, minStay: 3 });
  });

  it("rejette tout l'envoi sur une seule valeur hors bornes absolues", () => {
    const p = plan(
      { "2027-01-10": now(470), "2027-01-11": now(470) },
      { "2027-01-10": engine(480), "2027-01-11": engine(ABSOLUTE_BOUNDS.minPrice - 1) },
    );
    expect(p.status).toBe("rejected");
    expect(p.writes).toEqual({});
    expect(p.rejections[0]).toMatch(/2027-01-11.*hors bornes/);
  });

  it("rejette un séjour minimum hors bornes", () => {
    expect(plan({}, { "2027-01-10": engine(500, 8) }).status).toBe("rejected");
    expect(plan({}, { "2027-01-10": engine(500, 0) }).status).toBe("rejected");
  });

  it("rejette une nuit d'événement sous son plancher, même si la grille le demande", () => {
    const p = plan({ "2027-06-10": now(2_800, 4) }, { "2027-06-10": engine(520, 4) });
    expect(p.status).toBe("rejected");
    expect(p.rejections[0]).toMatch(/plancher 24 Heures du Mans 2027/);
  });

  it("met en quarantaine une variation de plus de 25 %, sans bloquer les autres dates", () => {
    const p = plan(
      { "2027-01-10": now(400), "2027-01-11": now(400) },
      { "2027-01-10": engine(600), "2027-01-11": engine(420) },
    );
    expect(p.status).toBe("ok");
    expect(p.quarantined).toEqual([{ date: "2027-01-10", from: 400, to: 600, changePct: 50 }]);
    expect(Object.keys(p.writes)).toEqual(["2027-01-11"]);
  });

  it("exempte de la quarantaine un prix forcé (validé par l'exploitant et borné)", () => {
    const p = plan({ "2027-05-14": now(600, 3) }, { "2027-05-14": { price: 1_400, minStay: 3, source: "override" } });
    expect(p.quarantined).toEqual([]);
    expect(p.writes["2027-05-14"].price1).toBe(1_400);
  });

  it("exempte une hausse qui remonte une nuit d'événement sous son plancher (cas des 7-8/06)", () => {
    const p = plan({ "2027-06-07": now(570, 4) }, { "2027-06-07": engine(1_560, 2) });
    expect(p.quarantined).toEqual([]);
    expect(p.writes["2027-06-07"].price1).toBe(1_560);
  });

  it("plafonne l'exemption « sous le plancher » : une cible aberrante reste en quarantaine", () => {
    const p = plan({ "2027-04-08": now(400, 3) }, { "2027-04-08": engine(3_400, 3) });
    expect(p.quarantined.map((q) => q.date)).toEqual(["2027-04-08"]);
  });

  it("met quand même en quarantaine une baisse forte sur une nuit d'événement au-dessus du plancher", () => {
    const p = plan({ "2027-06-10": now(3_400, 4) }, { "2027-06-10": engine(2_300, 4) });
    expect(p.quarantined.map((q) => q.date)).toEqual(["2027-06-10"]);
  });

  it("exempte de la quarantaine une date sans prix actuel", () => {
    const p = plan({}, { "2027-12-20": engine(600) });
    expect(p.quarantined).toEqual([]);
    expect(p.writes["2027-12-20"].price1).toBe(600);
  });

  it("garde les planchers d'événement actifs même avec des paramètres de bascule relevés", () => {
    const p = plan({ "2027-04-08": now(1_000, 3) }, { "2027-04-08": engine(300, 3) }, 400, 10);
    expect(p.status).toBe("rejected");
  });

  it("rejette l'envoi au-delà du nombre maximal de dates", () => {
    const current: Record<string, CurrentNight> = {};
    const target: Record<string, TargetNight> = {};
    for (let d = 1; d <= 5; d++) {
      const date = `2027-01-0${d}`;
      current[date] = now(470);
      target[date] = engine(480);
    }
    expect(plan(current, target, 4).status).toBe("rejected");
    expect(plan(current, target, 5).status).toBe("ok");
  });
});

describe("prix forcés 2027", () => {
  it("respectent tous les bornes absolues et les planchers, compensation comprise", () => {
    for (const o of PRICE_OVERRIDES) {
      for (let d = o.from; d <= o.to; d = nextDay(d)) {
        const p = plan({}, { [d]: { price: o.price, minStay: o.minStay, source: "override" } });
        expect(p.status, `${d} (${o.reason})`).toBe("ok");
      }
    }
  });

  it("couvrent les nuits du 7 et 8/06/2027 au prix de la semaine des essais", () => {
    expect(overrideOn("2027-06-07")?.price).toBe(1_560);
    expect(overrideOn("2027-06-08")?.price).toBe(1_560);
    expect(eventFloorOn("2027-06-08")?.floor).toBe(1_560);
    expect(overrideOn("2027-06-14")).toBeNull();
  });
});

function nextDay(d: string): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}
