/**
 * Borne de lecture du journal de la serrure : dernier passage réussi moins deux heures, 24 h au
 * premier passage, jamais plus de 48 h. Et les lecteurs passent bien par `listLogSince` (toutes
 * pages), plus par `listLog` (50 lignes au plus). Données inventées.
 */
import { describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  listLogSince: vi.fn<(cfg: unknown, since: Date) => Promise<unknown[]>>(async () => [
    { id: "a", date: "2026-11-15T15:10:00Z", action: 3, trigger: 255, state: 0, name: "7000001: Voyageur" },
    { id: "b", date: "2026-11-15T14:20:00Z", action: 3, trigger: 255, state: 0, name: "7000001: Voyageur" },
    { id: "c", date: "2026-11-15T09:00:00Z", action: 3, trigger: 255, state: 0, name: "# Intervenante test" },
  ]),
  listLog: vi.fn(async () => []),
}));
vi.mock("@sejour/socle/lib/nuki", () => ({ listLogSince: h.listLogSince, listLog: h.listLog }));
vi.mock("@/lib/redis", () => ({
  getRedis: () => ({}),
  hasRedis: () => false,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async () => null,
  setJson: async () => {},
}));

import { logSince } from "@/lib/nuki-log-cursor";
import { readKeypadArrivals } from "@/lib/access-sync";
import { doorArrivals } from "@/lib/cleaning/sources";

const NOW = new Date("2026-11-16T12:00:00Z");

describe("logSince", () => {
  it("premier passage : 24 h", () => {
    expect(logSince(null, NOW).toISOString()).toBe("2026-11-15T12:00:00.000Z");
  });
  it("dernier passage réussi moins deux heures de recouvrement", () => {
    expect(logSince("2026-11-16T11:50:00Z", NOW).toISOString()).toBe("2026-11-16T09:50:00.000Z");
  });
  it("jamais plus de 48 h en arrière, jamais dans le futur, valeur illisible = premier passage", () => {
    expect(logSince("2026-11-01T00:00:00Z", NOW).toISOString()).toBe("2026-11-14T12:00:00.000Z");
    expect(logSince("2026-11-16T15:00:00Z", NOW).toISOString()).toBe(NOW.toISOString());
    expect(logSince("n'importe quoi", NOW).toISOString()).toBe("2026-11-15T12:00:00.000Z");
  });
});

describe("lecteurs du journal", () => {
  it("check-in : toutes pages depuis la borne, première ouverture par réservation", async () => {
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "123";
    const since = new Date("2026-11-15T10:00:00Z");
    const arrivals = await readKeypadArrivals(since);
    expect(h.listLogSince.mock.calls.at(-1)?.[1]).toBe(since);
    expect(arrivals.get(7000001)).toBe("2026-11-15T14:20:00Z");
    expect(h.listLog).not.toHaveBeenCalled();
  });

  it("ménage : idem, code manuel « # nom »", async () => {
    const since = new Date("2026-11-15T08:00:00Z");
    const out = await doorArrivals([{ name: "Intervenante", role: "ménage" }], since);
    expect(h.listLogSince.mock.calls.at(-1)?.[1]).toBe(since);
    expect(out.map((a) => a.who)).toEqual(["Intervenante"]);
    expect(h.listLog).not.toHaveBeenCalled();
  });
});
