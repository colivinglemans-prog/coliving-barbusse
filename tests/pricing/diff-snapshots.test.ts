import { describe, expect, it } from "vitest";
import { diffSnapshots } from "@/lib/pricing/snapshot";
import { calendar, snapshot } from "./fixtures";

/* Tests de caractérisation : ils figent le comportement du 2026-11-07, sans le juger. */

describe("diffSnapshots", () => {
  it("deux photos identiques : aucune différence, dates reprises", () => {
    const days = calendar("2026-11-10", "2026-11-20");
    const d = diffSnapshots(snapshot("2026-11-09", days), snapshot("2026-11-10", days));
    expect(d).toEqual({
      from: "2026-11-09",
      to: "2026-11-10",
      priceChanges: [],
      minStayChanges: [],
      sold: [],
      released: [],
    });
  });

  it("détecte prix, séjour minimum, vente et libération, distance comptée depuis la seconde photo", () => {
    const before = snapshot(
      "2026-11-09",
      calendar("2026-11-10", "2026-11-30", { "2026-11-25": [200, 2, 0] }),
    );
    const after = snapshot(
      "2026-11-10",
      calendar("2026-11-10", "2026-11-30", {
        "2026-11-12": [240, 2, 1], // prix
        "2026-11-15": [200, 3, 1], // séjour minimum
        "2026-11-20": [210, 2, 0], // vendue, et repricée le même jour
        "2026-11-25": [200, 2, 1], // libérée
      }),
    );
    const d = diffSnapshots(before, after);
    expect(d.priceChanges).toEqual([
      { date: "2026-11-12", leadDays: 2, before: 200, after: 240 },
      { date: "2026-11-20", leadDays: 10, before: 200, after: 210 },
    ]);
    expect(d.minStayChanges).toEqual([{ date: "2026-11-15", leadDays: 5, before: 2, after: 3 }]);
    // Le prix de vente est celui de la VEILLE (200), pas celui du jour (210).
    expect(d.sold).toEqual([{ date: "2026-11-20", leadDays: 10, price: 200 }]);
    expect(d.released).toEqual(["2026-11-25"]);
  });

  it("ignore les nuits passées à la date de la seconde photo", () => {
    const before = snapshot("2026-11-05", calendar("2026-11-05", "2026-11-12"));
    const after = snapshot(
      "2026-11-09",
      calendar("2026-11-05", "2026-11-12", {
        "2026-11-06": [999, 9, 0], // passée : ni vente ni changement
        "2026-11-09": [150, 2, 1], // le jour même compte (leadDays 0)
      }),
    );
    const d = diffSnapshots(before, after);
    expect(d.priceChanges).toEqual([{ date: "2026-11-09", leadDays: 0, before: 200, after: 150 }]);
    expect(d.sold).toEqual([]);
    expect(d.minStayChanges).toEqual([]);
  });

  it("ne compare que les nuits présentes dans les deux photos", () => {
    const before = snapshot("2026-11-09", calendar("2026-11-10", "2026-11-15"));
    const after = snapshot(
      "2026-11-10",
      // 2026-11-16 n'existait pas la veille (l'horizon avance d'un jour) : pas un changement.
      calendar("2026-11-10", "2026-11-16", { "2026-11-16": [500, 7, 0] }),
    );
    const d = diffSnapshots(before, after);
    expect(d.priceChanges).toEqual([]);
    expect(d.sold).toEqual([]);
  });
});
