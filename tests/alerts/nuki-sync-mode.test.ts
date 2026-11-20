/**
 * Synchro de la serrure laissée à blanc (`NUKI_SYNC_MODE` autre que `live`) : plus aucun code
 * n'est posé, l'hôte doit le savoir. Règle commune : deux passages de suite, une seule alerte,
 * « rétabli » en priorité 1. Synchro, Redis et ntfy simulés.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  kv: new Map<string, unknown>(),
  sendNtfy: vi.fn<(body: string, options: { title?: string; priority?: number }) => Promise<void>>(async () => {}),
  run: vi.fn(async () => ({ mode: "dry", stays: 0, actions: [], alerts: [], notified: 0 })),
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async (k: string) => (h.kv.has(k) ? JSON.parse(JSON.stringify(h.kv.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.kv.set(k, JSON.parse(JSON.stringify(v)));
  },
}));
vi.mock("@/lib/heartbeat", () => ({ beat: async () => {} }));
vi.mock("@/lib/access-sync", () => ({
  runAccessSync: h.run,
  syncIsLive: () => process.env.NUKI_SYNC_MODE === "live",
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { GET } from "@/app/api/cron/nuki-sync/route";

const call = (query = "") =>
  GET(new NextRequest(`https://example.test/api/cron/nuki-sync${query}`, { headers: { authorization: "Bearer secret-de-test" } }));
const modeSends = () => h.sendNtfy.mock.calls.filter(([, o]) => o.title?.includes("Synchro des codes"));

beforeEach(() => {
  h.kv.clear();
  h.sendNtfy.mockReset();
  h.sendNtfy.mockImplementation(async () => {});
  process.env.CRON_SECRET = "secret-de-test";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
  process.env.NUKI_SYNC_MODE = "live";
});

describe("nuki-sync — mode de la synchro", () => {
  it("en live : aucune alerte", async () => {
    await call();
    await call();
    expect(modeSends()).toHaveLength(0);
  });

  it("à blanc : alerte au 2e passage, une seule fois, puis « rétabli » en priorité 1", async () => {
    process.env.NUKI_SYNC_MODE = "dry";
    await call();
    expect(modeSends()).toHaveLength(0);
    await call();
    await call();
    expect(modeSends()).toHaveLength(1);
    expect(modeSends()[0][1].priority).toBe(4);
    process.env.NUKI_SYNC_MODE = "live";
    await call();
    expect(modeSends()).toHaveLength(2);
    expect(modeSends()[1][1].priority).toBe(1);
  });

  it("variable absente : même alerte", async () => {
    delete process.env.NUKI_SYNC_MODE;
    await call();
    await call();
    expect(modeSends()).toHaveLength(1);
  });

  it("?dry=1 n'évalue rien", async () => {
    process.env.NUKI_SYNC_MODE = "dry";
    await call("?dry=1");
    await call("?dry=1");
    expect(modeSends()).toHaveLength(0);
  });
});
