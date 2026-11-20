/**
 * Notifications d'arrivée : la clé anti-doublon est réservée avant l'envoi (`SET NX`) et rendue si
 * l'envoi échoue ; un journal de serrure illisible alerte au 2e passage. Beds24, serrure, Redis et
 * ntfy simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  kv: new Map<string, unknown>(),
  sendNtfy: vi.fn<(body: string, options: { title?: string; priority?: number }) => Promise<void>>(async () => {}),
  keypad: vi.fn<(since: Date) => Promise<Map<number, string>>>(async () => new Map([[7000001, "2026-11-16T15:05:00Z"]])),
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async (k: string) => (h.kv.has(k) ? JSON.parse(JSON.stringify(h.kv.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.kv.set(k, JSON.parse(JSON.stringify(v)));
  },
  stringStore: () => ({
    get: async (k: string) => (h.kv.has(k) ? String(h.kv.get(k)) : null),
    set: async (k: string, v: string) => {
      h.kv.set(k, v);
    },
  }),
  getRedis: () => ({
    get: async (k: string) => h.kv.get(k) ?? null,
    set: async (k: string, v: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && h.kv.has(k)) return null;
      h.kv.set(k, v);
      return "OK";
    },
    del: async (k: string) => (h.kv.delete(k) ? 1 : 0),
  }),
}));
vi.mock("@/lib/bookings", () => ({
  getBookingsWithArchive: async () => [
    { id: 7000001, status: "confirmed", firstName: "Voyageur", arrival: "2026-11-16", departure: "2026-11-18", numAdult: 2, infoItems: [] },
  ],
}));
vi.mock("@/lib/access-sync", () => ({ readKeypadArrivals: h.keypad }));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { GET } from "@/app/api/cron/checkin-notifications/route";

const call = () =>
  GET(new NextRequest("https://example.test/api/cron/checkin-notifications", { headers: { authorization: "Bearer secret-de-test" } }));
const checkinSends = () => h.sendNtfy.mock.calls.filter(([, o]) => o.title?.startsWith("🔑"));

beforeEach(() => {
  h.kv.clear();
  h.sendNtfy.mockReset();
  h.sendNtfy.mockImplementation(async () => {});
  h.keypad.mockReset();
  h.keypad.mockImplementation(async () => new Map([[7000001, "2026-11-16T15:05:00Z"]]));
  process.env.CRON_SECRET = "secret-de-test";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
  delete process.env.CHECKIN_NOTIFICATIONS_ENABLED;
});

describe("checkin-notifications", () => {
  it("journal lisible : succès", async () => {
    expect((await (await call()).json()).success).toBe(true);
  });

  it("deux passages concurrents : une seule notification", async () => {
    await Promise.all([call(), call()]);
    expect(checkinSends()).toHaveLength(1);
    await call();
    expect(checkinSends()).toHaveLength(1);
  });

  it("envoi raté : la clé est rendue, le passage suivant renvoie", async () => {
    h.sendNtfy.mockRejectedValueOnce(new Error("ntfy 503"));
    const first = await (await call()).json();
    expect(first.errors).toHaveLength(1);
    expect(h.kv.has("checkin:notified:7000001")).toBe(false);
    await call();
    expect(checkinSends()).toHaveLength(2); // l'échec, puis le renvoi réussi
    expect(h.kv.has("checkin:notified:7000001")).toBe(true);
  });

  it("journal de la serrure illisible : alerte au 2e passage, une seule fois", async () => {
    h.keypad.mockRejectedValue(new Error("Nuki 503 : lecture du journal"));
    const first = await call();
    // Plus de « succès » quand le journal est illisible ; 200 quand même (pas de courriel cron-job.org).
    expect(first.status).toBe(200);
    expect((await first.json()).success).toBe(false);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await call();
    await call();
    const alerts = h.sendNtfy.mock.calls.filter(([, o]) => o.title?.includes("journal de la serrure illisible"));
    expect(alerts).toHaveLength(1);
  });
});
