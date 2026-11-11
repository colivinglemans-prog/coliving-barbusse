import { describe, expect, it } from "vitest";
import {
  estimateRadiatorLoad,
  expectedSetpoint,
  loadFactor,
  setpointOfMode,
  setpointsAboveZone,
  type RadiatorReading,
} from "@/lib/radiator-load";
import { activeShedZones, planShedding, SHED_ORDER, type ShedState } from "@/lib/load-shedding";
import { powerCutTransition } from "@/lib/power-cut";

const reading = (over: Partial<RadiatorReading> & { attrs?: Record<string, unknown> | null } = {}): RadiatorReading => ({
  did: "d",
  name: "Chambre",
  zoneId: "1er",
  online: true,
  attrs: { mode: "cft", cft_temp: 190, eco_temp: 150, cur_temp: 180, Heating_state: 1, derog_mode: 3 },
  ...over,
});

describe("charge estimée des radiateurs", () => {
  it("consigne par mode, confort −1 / −2 du mode présence compris", () => {
    expect(setpointOfMode("cft", 190, 150)).toBe(19);
    expect(setpointOfMode("cft1", 190, 150)).toBe(18);
    expect(setpointOfMode("cft2", 190, 150)).toBe(17);
    expect(setpointOfMode("eco", 190, 150)).toBe(15);
    expect(setpointOfMode("fro", 190, 150)).toBe(7);
    expect(setpointOfMode("stop", 190, 150)).toBeNull();
    expect(setpointOfMode("???", 190, 150)).toBeUndefined();
  });

  it("taux : à fond loin de la consigne, un tiers en régulation, rien au-dessus", () => {
    expect(loadFactor(19, 17.5, false)).toBe(1);
    expect(loadFactor(19, 18.5, true)).toBe(1);
    expect(loadFactor(19, 18.5, false)).toBeCloseTo(1 / 3);
    expect(loadFactor(19, 19.5, true)).toBeCloseTo(1 / 3);
    expect(loadFactor(19, 19.5, false)).toBe(0);
    expect(loadFactor(null, 10, true)).toBe(0);
    expect(loadFactor(undefined, 10, false)).toBe(1);
  });

  it("hors ligne ou illisible : compté à 100 % ; puissance par défaut 1 000 W", () => {
    const load = estimateRadiatorLoad([
      reading({ name: "A", online: false, attrs: null }),
      reading({ name: "B", attrs: null }),
      reading({ name: "C", powerW: 1500, attrs: { mode: "cft", cft_temp: 190, eco_temp: 150, cur_temp: 160 } }),
      reading({ name: "D", zoneId: "rdc", attrs: { mode: "eco", cft_temp: 190, eco_temp: 150, cur_temp: 180, Heating_state: 0 } }),
    ]);
    expect(load.totalW).toBe(3500);
    expect(load.byZone).toEqual({ "1er": 3500, rdc: 0 });
    expect(load.unknown).toEqual(["A", "B"]);
  });

  it("consigne prévue : mode que la zone va recevoir, consignes ramenées à celles de la zone", () => {
    const zone = { cftTemp: 190, ecoTemp: 150 };
    const raised = reading({ attrs: { mode: "cft", cft_temp: 260, eco_temp: 150, cur_temp: 180, derog_mode: 0 } });
    expect(expectedSetpoint("cft", raised, zone)).toBe(19);
    expect(expectedSetpoint("eco", raised, zone)).toBe(15);
    // Déjà en présence, pièce vide : le palier qu'il applique.
    expect(expectedSetpoint("presence", reading({ attrs: { mode: "cft2", cft_temp: 190, eco_temp: 150, derog_mode: 3 } }), zone)).toBe(17);
    // Il passe en présence à ce passage : on compte le confort.
    expect(expectedSetpoint("presence", reading({ attrs: { mode: "eco", cft_temp: 190, eco_temp: 150, derog_mode: 0 } }), zone)).toBe(19);
  });

  it("consignes montées par un voyageur : détectées", () => {
    const zone = { cftTemp: 190, ecoTemp: 150 };
    expect(setpointsAboveZone({ cft_temp: 260, eco_temp: 150 }, zone)).toBe(true);
    expect(setpointsAboveZone({ cft_temp: 190, eco_temp: 160 }, zone)).toBe(true);
    expect(setpointsAboveZone({ cft_temp: 190, eco_temp: 150 }, zone)).toBe(false);
    expect(setpointsAboveZone({ cft_temp: 180, eco_temp: 150 }, zone)).toBe(false);
    expect(setpointsAboveZone(null, zone)).toBe(false);
  });
});

describe("délestage tournant", () => {
  const now = new Date("2026-11-09T19:00:00Z");
  const byZone = { dernier: 3000, "1er": 6000, "chambre-rdc": 1000, rdc: 5000 };

  it("sous le plafond : rien", () => {
    expect(planShedding(5000, byZone, 6000, null, now).zones).toEqual([]);
  });

  it("au-dessus : dernier étage d'abord, puis le 1er, jusqu'à repasser sous le plafond ; jamais le RDC", () => {
    const s = planShedding(15000, byZone, 6000, null, now);
    expect(s.zones).toEqual(["dernier", "1er"]);
    expect(s.remainingW).toBe(6000);
    const all = planShedding(30000, byZone, 6000, null, now);
    expect(all.zones).toEqual([...SHED_ORDER]);
    expect(all.zones).not.toContain("rdc");
  });

  it("tourne : la zone délestée au quart d'heure précédent passe après les autres", () => {
    const first = planShedding(8000, byZone, 6000, null, now);
    expect(first.zones).toEqual(["dernier"]);
    const later = new Date(now.getTime() + 15 * 60 * 1000);
    const second = planShedding(8000, byZone, 6000, first, later);
    expect(second.zones).toEqual(["1er"]);
    const third = planShedding(8000, byZone, 6000, second, new Date(later.getTime() + 15 * 60 * 1000));
    expect(third.zones).toEqual(["dernier"]); // la chambre RDC (1 000 W) ne suffirait pas seule
  });

  it("une zone sans charge n'est pas délestée pour rien", () => {
    const s = planShedding(9000, { dernier: 0, "1er": 4000, rdc: 5000 }, 6000, null, now);
    expect(s.zones).toEqual(["1er"]);
  });

  it("un délestage de plus de 30 min est oublié", () => {
    const old: ShedState = { zones: ["dernier"], next: 1, at: "2026-11-09T18:00:00Z", totalW: 9000, remainingW: 6000, capW: 6000 };
    expect(activeShedZones(old, now)).toEqual([]);
    expect(activeShedZones({ ...old, at: "2026-11-09T18:50:00Z" }, now)).toEqual(["dernier"]);
  });
});

describe("détection de coupure", () => {
  const now = new Date("2026-11-09T17:45:00Z");
  const all = ["Chambre 7", "Chambre 8", "Chambre 9", "Salon", "Cuisine"];

  it("3 radiateurs ou plus tombés au même passage : coupure soupçonnée, sans alerte", () => {
    const t = powerCutTransition(all, ["Salon", "Cuisine"], null, now);
    expect(t.action).toBe("suspected");
    expect(t.cut).toMatchObject({ devices: ["Chambre 7", "Chambre 8", "Chambre 9"], confirmed: false });
  });

  it("toujours hors ligne au passage suivant : coupure confirmée", () => {
    const s = powerCutTransition(all, ["Salon", "Cuisine"], null, now);
    const later = new Date(now.getTime() + 15 * 60 * 1000);
    const t = powerCutTransition(["Salon", "Cuisine"], ["Salon", "Cuisine"], s.cut, later);
    expect(t.action).toBe("cut");
    expect(t.cut).toMatchObject({ since: now.toISOString(), confirmed: true });
    expect(t.newlyOffline).toEqual(["Chambre 7", "Chambre 8", "Chambre 9"]);
  });

  it("autres radiateurs tombés au 2e passage : nouveau soupçon, pas de confirmation", () => {
    const six = ["A", "B", "C", "D", "E", "F", "Salon"];
    const s = powerCutTransition(six, ["D", "E", "F", "Salon"], null, now);
    expect(s.action).toBe("suspected");
    const later = new Date(now.getTime() + 15 * 60 * 1000);
    const t = powerCutTransition(["D", "E", "F", "Salon"], ["A", "B", "C", "Salon"], s.cut, later);
    expect(t.action).toBe("suspected");
    expect(t.cut).toMatchObject({ devices: ["D", "E", "F"], confirmed: false });
  });

  it("revenus au passage suivant : coupure soupçonnée oubliée sans bruit", () => {
    const s = powerCutTransition(all, ["Salon", "Cuisine"], null, now);
    const later = new Date(now.getTime() + 15 * 60 * 1000);
    expect(powerCutTransition(["Salon", "Cuisine"], ["Chambre 7", "Chambre 8", "Salon", "Cuisine"], s.cut, later)).toMatchObject({
      action: "none",
      cut: null,
    });
  });

  it("1 ou 2 radiateurs : pas de coupure (Wi-Fi capricieux)", () => {
    expect(powerCutTransition(all, ["Chambre 9", "Salon", "Cuisine"], null, now).action).toBe("none");
  });

  it("retour de tous : courant revenu ; retour partiel : rien", () => {
    const cut = { since: now.toISOString(), devices: ["Chambre 7", "Chambre 8", "Chambre 9"] };
    const later = new Date(now.getTime() + 30 * 60 * 1000);
    expect(powerCutTransition(["Salon"], ["Chambre 7", "Salon"], cut, later)).toMatchObject({ action: "none", cut });
    expect(powerCutTransition(["Salon"], all, cut, later)).toMatchObject({ action: "restored", cut: null });
  });

  it("circuit resté coupé plus de 6 h : la coupure est oubliée, la suivante sera vue", () => {
    const cut = { since: now.toISOString(), devices: ["Chambre 7", "Chambre 8", "Chambre 9"] };
    const muchLater = new Date(now.getTime() + 7 * 3600 * 1000);
    expect(powerCutTransition(["Salon", "Cuisine"], ["Salon", "Cuisine"], cut, muchLater)).toMatchObject({ action: "none", cut: null });
  });

  it("premier passage (rien en mémoire) : pas de coupure", () => {
    expect(powerCutTransition(null, [], null, now).action).toBe("none");
  });
});

describe("détection de coupure — cas relevés en relecture", () => {
  const t0 = new Date("2026-11-09T20:50:00Z");
  const all = ["Chambre 7", "Chambre 8", "Chambre 9", "Salon", "Cuisine"];

  it("nouvelle chute pendant une coupure restée ouverte : nouvelle alerte", () => {
    const cut = { since: t0.toISOString(), devices: all };
    const later = new Date(t0.getTime() + 90 * 60 * 1000);
    // Tous revenus sauf la Chambre 9, puis le compteur re-disjoncte.
    const t = powerCutTransition(["Chambre 7", "Chambre 8", "Salon", "Cuisine"], [], cut, later);
    expect(t.action).toBe("cut");
    expect(t.allOffline).toBe(true);
    expect(t.cut?.devices.sort()).toEqual([...all].sort());
  });

  it("une partie reste en ligne : pas « tout hors ligne »", () => {
    expect(powerCutTransition(all, ["Salon", "Cuisine"], null, t0).allOffline).toBe(false);
  });
});
