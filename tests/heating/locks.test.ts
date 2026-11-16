import { describe, expect, it } from "vitest";
import { lockUntilFor, locksToRelease } from "@/lib/heating-locks";
import type { Beds24Booking } from "@/lib/types";

// Données inventées.
function stay(id: number, arrival: string, departure: string, status = "confirmed"): Beds24Booking {
  return { id, arrival, departure, status, numAdult: 4, numChild: 0 } as unknown as Beds24Booking;
}

describe("lockUntilFor — date de fin d'un verrou posé aujourd'hui", () => {
  it("séjour en cours : son départ", () => {
    expect(lockUntilFor([stay(1, "2030-03-10", "2030-03-14")], "2030-03-11")).toBe("2030-03-14");
  });

  it("jour de rotation : le départ des arrivants, pas celui des partants", () => {
    const b = [stay(1, "2030-03-08", "2030-03-11"), stay(2, "2030-03-11", "2030-03-13")];
    expect(lockUntilFor(b, "2030-03-11")).toBe("2030-03-13");
  });

  it("maison vide : le départ du prochain séjour", () => {
    const b = [stay(2, "2030-04-01", "2030-04-03"), stay(3, "2030-05-01", "2030-05-02")];
    expect(lockUntilFor(b, "2030-03-20")).toBe("2030-04-03");
  });

  it("jour de départ sans suite : aujourd'hui (levé à la libération)", () => {
    expect(lockUntilFor([stay(1, "2030-03-08", "2030-03-11")], "2030-03-11")).toBe("2030-03-11");
  });

  it("aucun séjour, ou seulement une demande : pas de date", () => {
    expect(lockUntilFor([], "2030-03-11")).toBeNull();
    expect(lockUntilFor([stay(9, "2030-03-12", "2030-03-14", "request")], "2030-03-11")).toBeNull();
  });
});

describe("locksToRelease — verrous rendus à l'automatisation", () => {
  const base = { today: "2030-03-11", hasCheckOutToday: true, occupied: false };

  it("rotation : le verrou des partants est levé, celui posé pour les arrivants reste", () => {
    const release = locksToRelease({
      ...base,
      locked: new Set(["partants", "arrivants"]),
      until: { partants: "2030-03-11", arrivants: "2030-03-13" },
    });
    expect(release).toEqual(["partants"]);
  });

  it("maison encore occupée (avant la libération, ou départ convenu) : rien", () => {
    expect(
      locksToRelease({ ...base, occupied: true, locked: new Set(["a"]), until: { a: "2030-03-11" } }),
    ).toEqual([]);
  });

  it("date dépassée de 2 jours (crons manqués) : levé, même sans départ aujourd'hui", () => {
    expect(
      locksToRelease({ ...base, hasCheckOutToday: false, locked: new Set(["a"]), until: { a: "2030-03-09" } }),
    ).toEqual(["a"]);
  });

  it("verrou ancien sans date : règle d'avant, levé seulement un jour de départ", () => {
    expect(locksToRelease({ ...base, locked: new Set(["vieux"]), until: {} })).toEqual(["vieux"]);
    expect(
      locksToRelease({ ...base, hasCheckOutToday: false, locked: new Set(["vieux"]), until: {} }),
    ).toEqual([]);
  });

  it("verrou daté dans le futur : jamais levé par un autre départ", () => {
    expect(
      locksToRelease({ ...base, locked: new Set(["a"]), until: { a: "2030-04-03" } }),
    ).toEqual([]);
  });
});
