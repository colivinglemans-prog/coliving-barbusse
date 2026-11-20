/** Alerte d'arrivée de tous les codes perso (2026-11-18) : logique pure. Données et noms inventés. */
import { describe, expect, it } from "vitest";
import type { KeypadOpening } from "@/lib/cleaning/intratone";
import {
  advancePersonalBaseline,
  freshPersonalVenues,
  parsePeople,
  personalDoorArrivals,
  personalGarageArrivals,
  type CleaningArrival,
} from "@/lib/cleaning/sessions";

const people = parsePeople("Intervenante:ménage,Technicien:dépannage");
const OPENING = new Set([1, 3, 5]);
const at = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00Z`);
const op = (hhmm: string, name: string): KeypadOpening => ({ at: at(hhmm), code: "1", name });
const BOTH = { garage: true, porte: true } as const;
const arr = (source: "garage" | "porte", hhmm: string, who: string): CleaningArrival => ({ source, at: at(hhmm), who });

describe("personalGarageArrivals", () => {
  it("tout code nommé, hors personnes suivies, codes sans nom et codes de réservation", () => {
    const garage = [op("08:00", "Perso"), op("09:00", "Intervenante"), op("10:00", " "), op("11:00", "90000010: Motos")];
    expect(personalGarageArrivals(garage, people).map((a) => [a.source, a.who])).toEqual([["garage", "Perso"]]);
  });
});

describe("personalDoorArrivals", () => {
  it("codes manuels « # Nom » ouverts au clavier, hors suivis, codes de séjour, fermetures et échecs", () => {
    const door = [
      { trigger: 255, state: 0, action: 1, name: "# Gaspard", date: "2026-11-17T08:00:00Z" },
      { trigger: 255, state: 0, action: 1, name: "# Technicien", date: "2026-11-17T09:00:00Z" },
      { trigger: 255, state: 0, action: 1, name: "90000010: Voyageur", date: "2026-11-17T10:00:00Z" },
      { trigger: 255, state: 0, action: 2, name: "# Gaspard", date: "2026-11-17T11:00:00Z" },
      { trigger: 255, state: 11, action: 1, name: "# Gaspard", date: "2026-11-17T12:00:00Z" },
      { trigger: 0, state: 0, action: 1, name: "# Gaspard", date: "2026-11-17T13:00:00Z" },
      { trigger: 255, state: 0, action: 3, name: "Sans dièse", date: "2026-11-17T14:00:00Z" },
    ];
    expect(personalDoorArrivals(door, people, OPENING).map((a) => [a.source, a.who, a.at.toISOString()])).toEqual([
      ["porte", "Gaspard", "2026-11-17T08:00:00.000Z"],
    ]);
  });
});

describe("freshPersonalVenues", () => {
  it("premier passage (aucune ligne de base) : rien n'est signalé", () => {
    expect(freshPersonalVenues([arr("garage", "08:00", "Perso")], {}, BOTH)).toEqual([]);
  });

  it("une venue par personne : garage puis porte à moins de 45 min = une alerte", () => {
    const arrivals = [arr("garage", "08:00", "Gaspard"), arr("porte", "08:30", "Gaspard"), arr("porte", "08:40", "Gaspard")];
    const fresh = freshPersonalVenues(arrivals, { garage: 0, porte: 0 }, BOTH);
    expect(fresh.map((a) => [a.source, a.at.toISOString()])).toEqual([["garage", at("08:00").toISOString()]]);
  });

  it("deux venues séparées de 45 min ou plus : deux alertes", () => {
    const arrivals = [arr("garage", "08:00", "Perso"), arr("garage", "08:45", "Perso")];
    expect(freshPersonalVenues(arrivals, { garage: 0, porte: 0 }, BOTH)).toHaveLength(2);
  });

  it("une venue dont une arrivée a déjà été vue n'est pas resignalée", () => {
    const arrivals = [arr("garage", "08:00", "Gaspard"), arr("porte", "08:20", "Gaspard")];
    expect(freshPersonalVenues(arrivals, { garage: at("08:00").getTime(), porte: at("07:00").getTime() }, BOTH)).toEqual([]);
  });

  it("source illisible : ses arrivées ne sont pas signalées à ce passage", () => {
    const arrivals = [arr("garage", "08:00", "Perso"), arr("porte", "08:00", "Gaspard")];
    const fresh = freshPersonalVenues(arrivals, { garage: 0, porte: 0 }, { garage: false, porte: true });
    expect(fresh.map((a) => a.who)).toEqual(["Gaspard"]);
  });
});

describe("advancePersonalBaseline", () => {
  const now = at("12:00");
  it("premier passage : dernier code vu, ou l'instant du passage sans code", () => {
    expect(advancePersonalBaseline([arr("porte", "08:00", "Gaspard")], {}, BOTH, now)).toEqual({
      garage: now.getTime(),
      porte: at("08:00").getTime(),
    });
  });

  it("source illisible : sa ligne de base ne bouge pas (absente, elle le reste)", () => {
    const base = { porte: at("07:00").getTime() };
    expect(advancePersonalBaseline([arr("porte", "08:00", "Gaspard")], base, { garage: false, porte: true }, now)).toEqual({
      porte: at("08:00").getTime(),
    });
    expect(advancePersonalBaseline([], base, { garage: true, porte: false }, now)).toEqual({
      garage: now.getTime(),
      porte: at("07:00").getTime(),
    });
  });

  it("ne recule jamais", () => {
    const base = { garage: at("10:00").getTime(), porte: at("10:00").getTime() };
    expect(advancePersonalBaseline([arr("garage", "08:00", "Perso")], base, BOTH, now)).toEqual(base);
  });
});
