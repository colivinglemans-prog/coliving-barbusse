import { describe, it, expect } from "vitest";
import type { KeypadOpening } from "@/lib/cleaning/intratone";
import { parseOpenings, parseFrenchDate } from "@/lib/cleaning/intratone";
import {
  trackedOpenings, matchPerson, doorLogArrivals, parsePeople, mergeArrivals, newArrivalsSince,
  maxArrivalMs, estimateExit, buildSessions, guestKeypadEntries, guestKeypadCodes, parisDayOf, type CleaningArrival, type TrackedPerson,
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

describe("doorLogArrivals — journal de la porte", () => {
  // Données inventées : numéros de réservation fictifs.
  const entry = (date: string, name: string, extra: { trigger?: number; state?: number } = {}) =>
    ({ date, name, action: 3, trigger: extra.trigger ?? 255, state: extra.state ?? 0 });

  it("une voyageuse prénommée Sophie (code géré « <n° résa>: Sophie ») n'est pas le ménage", () => {
    const log = [entry("2026-11-04T16:30:00Z", "90000010: Sophie"), entry("2026-11-04T16:31:00Z", "123456: sophie m")];
    expect(doorLogArrivals(log, PEOPLE)).toEqual([]);
  });
  it("garde le code manuel du ménage, avec le nom canonique et la source porte", () => {
    const log = [entry("2026-11-04T09:00:00Z", "# Sophie"), entry("2026-11-04T10:00:00Z", "90000011: Eric"), entry("2026-11-04T11:00:00Z", "Eric dépannage")];
    const a = doorLogArrivals(log, PEOPLE);
    expect(a.map((x) => x.who)).toEqual(["Sophie", "Eric"]);
    expect(a.every((x) => x.source === "porte")).toBe(true);
    expect(a[0].at.toISOString()).toBe("2026-11-04T09:00:00.000Z");
  });
  it("ignore ce qui n'est pas un passage réussi au clavier", () => {
    const log = [entry("2026-11-04T09:00:00Z", "# Sophie", { trigger: 0 }), entry("2026-11-04T09:05:00Z", "# Sophie", { state: 1 })];
    expect(doorLogArrivals(log, PEOPLE)).toEqual([]);
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

import { summarizePeople, monthlyBuckets, parisMonth, parseRates } from "@/lib/cleaning/sessions";
import type { CleaningSession } from "@/lib/cleaning/sessions";

const sess = (who: string, arrivalIso: string, minutes: number | null): CleaningSession => ({
  who, arrival: new Date(arrivalIso), exitEstimate: minutes !== null ? new Date(Date.parse(arrivalIso) + minutes * 60000) : null,
  exitBy: minutes !== null ? "camera" : "inconnu", arrivalSource: "garage", minutes,
});

describe("parseRates", () => {
  it("parse nom:euros, ignore le non-numérique", () => {
    expect(parseRates("Sophie:21, Eric:x, Bob:15")).toEqual({ Sophie: 21, Bob: 15 });
  });
});

describe("parisMonth", () => {
  it("rend YYYY-MM en fuseau Paris", () => {
    expect(parisMonth(new Date("2026-11-04T15:11:00Z"))).toBe("2026-11");
  });
  it("gère un instant UTC proche du changement de jour/mois côté Paris", () => {
    // 31/10 23:30 UTC = 01/11 00:30 Paris (hiver +1h) → novembre
    expect(parisMonth(new Date("2026-10-31T23:30:00Z"))).toBe("2026-11");
  });
});

describe("summarizePeople", () => {
  const PEOPLE2 = [{ name: "Sophie", role: "ménage" }, { name: "Eric", role: "dépannage" }];
  it("compte passages, heures et coût au taux (sessions sans durée exclues du coût)", () => {
    const sessions = [sess("Sophie", "2026-11-04T09:00:00Z", 120), sess("Sophie", "2026-11-06T09:00:00Z", null), sess("Eric", "2026-11-05T09:00:00Z", 30)];
    const sum = summarizePeople(sessions, PEOPLE2, { Sophie: 21 });
    const sophie = sum.find((s) => s.who === "Sophie")!;
    expect(sophie.count).toBe(2);
    expect(sophie.withDuration).toBe(1);
    expect(sophie.totalMinutes).toBe(120);
    expect(sophie.estimatedCost).toBe(42); // 2 h × 21
    const eric = sum.find((s) => s.who === "Eric")!;
    expect(eric.ratePerHour).toBeNull();
    expect(eric.estimatedCost).toBeNull();
  });
});

describe("monthlyBuckets", () => {
  it("regroupe par mois de Paris et par personne, trié croissant", () => {
    const sessions = [sess("Sophie", "2026-10-28T09:00:00Z", 60), sess("Eric", "2026-11-05T09:00:00Z", 60), sess("Sophie", "2026-11-04T09:00:00Z", 60)];
    const buckets = monthlyBuckets(sessions);
    expect(buckets.map((b) => b.month)).toEqual(["2026-10", "2026-11"]);
    expect(buckets[1].counts).toEqual({ Eric: 1, Sophie: 1 });
  });
});

describe("jour de rotation : l'arrivée des voyageurs borne la sortie du ménage", () => {
  // 7000001 arrive le 4 ; 7000003 est parti le 4 (arrivé le 1er) et revient chercher un chargeur.
  const ARRIVALS = new Map([
    [7000001, "2026-11-04"],
    [7000003, "2026-11-01"],
  ]);
  const log = [
    { trigger: 255, state: 0, name: "# Sophie", date: "2026-11-04T10:00:00Z" },
    { trigger: 255, state: 0, name: "7000001: Voyageur", date: "2026-11-04T16:00:00Z" },
    { trigger: 255, state: 1, name: "7000002: Autre", date: "2026-11-04T15:00:00Z" },
  ];
  it("ne garde que les codes gérés, ouvertures réussies", () => {
    expect(guestKeypadCodes(log)).toEqual([{ bookingId: 7000001, at: d("2026-11-04T16:00:00Z") }]);
    expect(guestKeypadEntries(guestKeypadCodes(log), ARRIVALS).map((x) => x.toISOString())).toEqual(["2026-11-04T16:00:00.000Z"]);
  });
  it("les mouvements après l'entrée des voyageurs ne font plus la sortie", () => {
    const motions = [d("2026-11-04T13:30:00Z"), d("2026-11-04T16:20:00Z")];
    expect(estimateExit(d("2026-11-04T10:00:00Z"), motions, [], guestKeypadEntries(guestKeypadCodes(log), ARRIVALS)).exit?.toISOString()).toBe(
      "2026-11-04T13:30:00.000Z",
    );
    // Sans le journal, l'ancienne lecture : 16 h 20.
    expect(estimateExit(d("2026-11-04T10:00:00Z"), motions, []).exit?.toISOString()).toBe("2026-11-04T16:20:00.000Z");
  });
  it("un partant qui revient après l'arrivée du ménage ne tronque pas sa sortie", () => {
    const back = [...log, { trigger: 255, state: 0, name: "7000003: Partant", date: "2026-11-04T10:30:00Z" }];
    const motions = [d("2026-11-04T10:40:00Z"), d("2026-11-04T13:30:00Z"), d("2026-11-04T16:20:00Z")];
    const entries = guestKeypadEntries(guestKeypadCodes(back), ARRIVALS);
    expect(entries.map((x) => x.toISOString())).toEqual(["2026-11-04T16:00:00.000Z"]);
    expect(estimateExit(d("2026-11-04T10:00:00Z"), motions, [], entries).exit?.toISOString()).toBe("2026-11-04T13:30:00.000Z");
    // L'ancienne lecture (tout code géré) : sortie tronquée à 10 h 30, aucun mouvement retenu.
    const all = guestKeypadCodes(back).map((c) => c.at);
    expect(estimateExit(d("2026-11-04T10:00:00Z"), motions, [], all).by).toBe("inconnu");
  });
  it("seulement le jour de l'arrivée, heure de Paris ; une réservation inconnue ne borne rien", () => {
    // Le lendemain de son arrivée, le même voyageur ne borne plus la sortie d'un ménage.
    const nextDay = [{ trigger: 255, state: 0, name: "7000001: Voyageur", date: "2026-11-05T12:00:00Z" }];
    expect(guestKeypadEntries(guestKeypadCodes(nextDay), ARRIVALS)).toEqual([]);
    // 23 h 30 UTC le 3 = 0 h 30 à Paris le 4 : c'est bien le jour de l'arrivée.
    const lateNight = [{ trigger: 255, state: 0, name: "7000001: Voyageur", date: "2026-11-03T23:30:00Z" }];
    expect(parisDayOf(d("2026-11-03T23:30:00Z"))).toBe("2026-11-04");
    expect(guestKeypadEntries(guestKeypadCodes(lateNight), ARRIVALS)).toHaveLength(1);
    const unknown = [{ trigger: 255, state: 0, name: "7000009: Inconnu", date: "2026-11-04T16:00:00Z" }];
    expect(guestKeypadEntries(guestKeypadCodes(unknown), ARRIVALS)).toEqual([]);
  });
});
