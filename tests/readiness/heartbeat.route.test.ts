import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({ mem: new Map<string, unknown>(), sendNtfy: vi.fn(async () => {}) }));

vi.mock("@/lib/redis", () => ({
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async (k: string) => (h.mem.has(k) ? JSON.parse(JSON.stringify(h.mem.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.mem.set(k, JSON.parse(JSON.stringify(v)));
  },
  stringStore: () => ({
    get: async (k: string) => (h.mem.has(k) ? String(h.mem.get(k)) : null),
    set: async (k: string, v: string) => {
      h.mem.set(k, v);
    },
  }),
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { GET } from "@/app/api/health/heartbeat/route";
import { beat } from "@/lib/heartbeat";

const NOW = new Date("2026-11-14T12:00:00Z");

async function allFresh() {
  for (const name of ["nuki-sync", "heating-automation", "water-heater-automation", "arrival-readiness", "pricing-push"] as const) {
    await beat(name, "ok", new Date(NOW.getTime() - 10 * 60_000));
  }
}

beforeEach(() => {
  h.mem.clear();
  h.sendNtfy.mockClear();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  return () => vi.useRealTimers();
});

describe("/api/health/heartbeat", () => {
  it("200 quand tout est à l'heure, sans alerte", async () => {
    await allFresh();
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, overdue: 0 });
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("503 avec le seul compte ; les noms partent par ntfy, une fois", async () => {
    await allFresh();
    await beat("heating-automation", "ok", new Date(NOW.getTime() - 60 * 60_000)); // > 45 min
    const res = await GET();
    expect(res.status).toBe(503);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual({ ok: false, overdue: 1 });
    expect(text).not.toContain("heating");
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.sendNtfy.mock.calls[0] as unknown as [string])[0]).toContain("heating-automation");

    await GET();
    expect(h.sendNtfy).toHaveBeenCalledTimes(1); // même état : rien

    await beat("heating-automation", "ok", NOW);
    expect((await GET()).status).toBe(200);
    expect(h.sendNtfy).toHaveBeenCalledTimes(2); // rétablissement
  });

  it("un cron qui échoue à chaque passage finit en retard", async () => {
    await allFresh();
    await beat("nuki-sync", "error", NOW);
    vi.setSystemTime(new Date(NOW.getTime() + 3 * 3600_000));
    for (const name of ["heating-automation", "water-heater-automation", "arrival-readiness", "pricing-push"] as const) {
      await beat(name, "ok", new Date());
    }
    await beat("nuki-sync", "error", new Date());
    expect(await (await GET()).json()).toEqual({ ok: false, overdue: 1 });
  });
});
