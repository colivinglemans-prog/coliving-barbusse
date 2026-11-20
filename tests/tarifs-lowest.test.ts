/** « Week-end à partir de » ne prend que de vrais week-ends : 2 nuits arrivant un vendredi. */
import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));

const { lowestWeekendTotal } = await import("../lib/tarifs");

type Row = Parameters<typeof lowestWeekendTotal>[0]["rows"][number];
const row = (checkIn: string, nights: number, total: number, label?: string) =>
  ({ checkIn, nights, label, cells: [{ status: "available", total }] }) as unknown as Row;

describe("lowestWeekendTotal", () => {
  it("ignore un sous-séjour de 2 nuits en semaine (mercredi → vendredi)", () => {
    const grid = { rows: [row("2026-12-09", 2, 900), row("2026-12-11", 2, 1119.42)] };
    expect(lowestWeekendTotal(grid as never)).toBe(1119.42);
  });

  it("ignore les séjours de 4 nuits et les lignes intitulées", () => {
    const grid = { rows: [row("2026-11-23", 4, 800), row("2026-12-25", 2, 700, "Noël")] };
    expect(lowestWeekendTotal(grid as never)).toBeNull();
  });
});
