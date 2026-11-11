import { describe, it, expect } from "vitest";
import type { KeypadOpening } from "@/lib/cleaning/intratone";
import { parseOpenings, parseFrenchDate } from "@/lib/cleaning/intratone";
import {
  trackedOpenings, matchPerson, parsePeople, mergeArrivals, newArrivalsSince,
  maxArrivalMs, estimateExit, buildSessions, type CleaningArrival, type TrackedPerson,
} from "@/lib/cleaning/sessions";

const d = (iso: string) => new Date(iso);
const op = (at: string, code: string, name: string): KeypadOpening => ({ at: d(at), code, name });
const PEOPLE: TrackedPerson[] = [{ name: "Sophie", role: "ménage" }, { name: "Eric", role: "dépannage" }];

describe("parseFrenchDate", () => {
  it("convertit l'heure de Paris en UTC (hiver +1h)", () => {
    expect(parseFrenchDate("04/11/26 16:11")?.toISOString()).toBe("2026-11-04T15:11:00.000Z");
  });
  it("heure d'été +2h", () => {
    expect(parseFrenchDate("15/07/26 14:00")?.toISOString()).toBe("2026-07-15T12:00:00.000Z");
  });
  it("rend null si le format surprend", () => expect(parseFrenchDate("oops")).toBeNull());
});

describe("parseOpenings", () => {
  it("extrait les lignes à 4 cellules", () => {
    const html = `<table><tr><th>Quand</th></tr>
      <tr><td>04/11/26 16:11</td><td>Code Clavier</td><td>100200</td><td>Sophie</td></tr>
      <tr><td>22/10/26 14:32</td><td>Code Clavier</td><td>100300</td><td>Eric</td></tr></table>`;
    const ops = parseOpenings(html);
    expect(ops).toHaveLength(2);
    expect(ops[0].name).toBe("Sophie");
    expect(ops[1].name).toBe("Eric");
  });
});

describe("parsePeople", () => {
  it("parse nom:rôle séparés par des virgules", () => {
    const p = parsePeople("Sophie:ménage, Eric:dépannage");
    expect(p).toEqual([{ name: "Sophie", role: "ménage" }, { name: "Eric", role: "dépannage" }]);
  });
  it("rôle par défaut si absent", () => {
    expect(parsePeople("Sophie")[0].role).toBe("intervenant");
  });
});

describe("matchPerson + trackedOpenings", () => {
  it("reconnaît Sophie ET Eric, insensible à la casse", () => {
    expect(matchPerson("SOPHIE", PEOPLE)).toBe("Sophie");
    expect(matchPerson("eric f", PEOPLE)).toBe("Eric");
    expect(matchPerson("Perso", PEOPLE)).toBeNull();
  });
  it("filtre les ouvertures des personnes suivies et marque who + source garage", () => {
    const ops = [op("2026-11-04T15:11:00Z", "1", "Sophie"), op("2026-11-04T13:00:00Z", "2", "Perso"), op("2026-11-04T09:00:00Z", "3", "Eric")];
    const g = trackedOpenings(ops, PEOPLE);
    expect(g.map((x) => x.who).sort()).toEqual(["Eric", "Sophie"]);
    expect(g.every((x) => x.source === "garage")).toBe(true);
  });
});

describe("newArrivalsSince — dédoublonnage PAR personne", () => {
  it("dédoublonne la même personne (<45 min) mais garde deux personnes différentes", () => {
    const list: CleaningArrival[] = [
      { source: "porte", at: d("2026-11-04T15:00:00Z"), who: "Sophie" },
      { source: "garage", at: d("2026-11-04T15:10:00Z"), who: "Sophie" }, // même venue de Sophie
      { source: "garage", at: d("2026-11-04T15:12:00Z"), who: "Eric" },   // Eric, autre personne
    ];
    const fresh = newArrivalsSince(list, d("2026-11-04T14:00:00Z").getTime());
    expect(fresh.map((f) => f.who)).toEqual(["Sophie", "Eric"]);
  });
  it("rien si tout est antérieur", () => {
    const list: CleaningArrival[] = [{ source: "garage", at: d("2026-11-01T10:00:00Z"), who: "Sophie" }];
    expect(newArrivalsSince(list, d("2026-11-02T00:00:00Z").getTime())).toHaveLength(0);
  });
});

describe("estimateExit + buildSessions", () => {
  const arrival = d("2026-11-04T09:00:00Z");
  it("prend le dernier mouvement caméra dans la fenêtre de 8 h", () => {
    const motions = [d("2026-11-04T09:30:00Z"), d("2026-11-04T11:00:00Z"), d("2026-11-04T20:00:00Z")];
    const { exit, by } = estimateExit(arrival, motions, []);
    expect(by).toBe("camera");
    expect(exit?.toISOString()).toBe("2026-11-04T11:00:00.000Z");
  });
  it("retombe sur le bouton poussoir sinon", () => {
    const { by } = estimateExit(arrival, [], [d("2026-11-04T10:30:00Z")]);
    expect(by).toBe("bouton");
  });
  it("inconnu si aucun signe", () => expect(estimateExit(arrival, [], []).by).toBe("inconnu"));
  it("buildSessions calcule la durée et garde who", () => {
    const arr: CleaningArrival[] = [{ source: "garage", at: arrival, who: "Sophie" }];
    const s = buildSessions(arr, [d("2026-11-04T11:00:00Z")], []);
    expect(s[0].minutes).toBe(120);
    expect(s[0].who).toBe("Sophie");
  });
});

describe("merge + maxArrivalMs", () => {
  it("fusionne et trie", () => {
    const g: CleaningArrival[] = [{ source: "garage", at: d("2026-11-04T15:00:00Z"), who: "Eric" }];
    const p: CleaningArrival[] = [{ source: "porte", at: d("2026-11-03T09:00:00Z"), who: "Sophie" }];
    expect(mergeArrivals(g, p).map((a) => a.who)).toEqual(["Sophie", "Eric"]);
  });
  it("maxArrivalMs rend le plus grand instant ou le fallback", () => {
    expect(maxArrivalMs([], 42)).toBe(42);
  });
});
