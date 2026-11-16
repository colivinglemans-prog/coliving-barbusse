/**
 * `heating-reset` : si tous les radiateurs refusent, le passage est une erreur (502, battement
 * `error`, erreur suivie), plus un « succès » qui remettait l'alerte à zéro. Heatzy, Redis et
 * ntfy simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  mem: new Map<string, unknown>(),
  cut: null as null | { since: string; devices: string[] },
  sendNtfy: vi.fn(async () => {}),
  setDeviceMode: vi.fn(async (): Promise<void> => {
    throw new Error("Heatzy API error: 500");
  }),
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
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
vi.mock("@/lib/heatzy", () => ({
  getSummerMode: async () => false,
  getLockedDevices: async () => new Set<string>(),
  getFullZoneConfig: async () => ({
    zones: [
      {
        id: "z1",
        name: "Zone test",
        cftTemp: 190,
        ecoTemp: 160,
        devices: [
          { did: "d1", name: "Radiateur A" },
          { did: "d2", name: "Radiateur B" },
        ],
      },
    ],
  }),
  setDeviceMode: h.setDeviceMode,
  setDeviceTemperatures: async () => {},
  getDeviceStatus: async () => ({}),
}));
vi.mock("@/lib/bookings", () => ({ getActiveBookings: async () => [] }));
vi.mock("@/lib/heating-state", () => ({ readShedState: async () => null, readPowerCut: async () => h.cut }));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { GET } from "@/app/api/cron/heating-reset/route";

const call = () =>
  GET(new NextRequest("https://example.test/api/cron/heating-reset", { headers: { authorization: "Bearer secret-de-test" } }));

beforeEach(() => {
  h.mem.clear();
  h.sendNtfy.mockClear();
  h.cut = null;
  process.env.CRON_SECRET = "secret-de-test";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
});

describe("heating-reset — tous les radiateurs refusent", () => {
  it("502, battement en erreur, alerte au 2e passage seulement", async () => {
    const res = await call();
    expect(res.status).toBe(502);
    expect(h.mem.get("barbusse:heartbeat:heating-reset:ok")).toBeUndefined();
    expect(String(h.mem.get("barbusse:heartbeat:heating-reset"))).toContain('"error"');
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await call();
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("un seul refus sur deux : passage réussi", async () => {
    h.setDeviceMode.mockResolvedValueOnce(undefined);
    const res = await call();
    expect(res.status).toBe(200);
    expect(h.mem.get("barbusse:heartbeat:heating-reset:ok")).toBeDefined();
  });

  it("pendant une coupure de courant : 200, battement ok, aucune alerte", async () => {
    h.cut = { since: "2026-11-16T18:00:00Z", devices: ["Radiateur A", "Radiateur B"] };
    for (let i = 0; i < 2; i++) expect((await call()).status).toBe(200);
    expect(h.mem.get("barbusse:heartbeat:heating-reset:ok")).toBeDefined();
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });
});
