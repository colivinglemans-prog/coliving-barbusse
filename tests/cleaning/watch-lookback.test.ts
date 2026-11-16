/**
 * Suivi ménage : une arrivée par la porte reste lue tant que sa sortie peut progresser. Avec la
 * seule borne « dernier passage − 2 h », l'arrivée de 9 h sortait de la lecture au passage de
 * 12 h 45 : sortie figée et arrivée au garage à 9 h 20 comptée comme une seconde session.
 * Sources, Redis et ntfy simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const at = (hhmm: string) => new Date(`2026-11-16T${hhmm}:00Z`);

const h = vi.hoisted(() => ({
  kv: new Map<string, unknown>(),
  stored: new Map<string, { exit: string | null }>(),
  motions: [] as Date[],
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => true,
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
    set: async (k: string, v: unknown) => {
      h.kv.set(k, v);
      return "OK";
    },
  }),
}));
vi.mock("@/lib/cleaning/sources", () => ({
  garageArrivals: async () => [{ source: "garage", at: at("09:20"), who: "Intervenante" }],
  // Le journal de la porte ne rend que ce qui est postérieur à `since`, comme `listLogSince`.
  doorArrivals: async (_people: unknown, since: Date) =>
    [{ source: "porte", at: at("09:00"), who: "Intervenante" }].filter((a) => a.at >= since),
  cameraMotions: async () => h.motions,
  buttonPresses: async () => [],
}));
vi.mock("@/lib/cleaning/store", () => ({
  upsertSessions: async (sessions: Array<{ who: string; arrival: Date; exitEstimate: Date | null }>) => {
    for (const s of sessions) {
      const key = `${s.who}:${s.arrival.toISOString()}`;
      const prev = h.stored.get(key)?.exit ?? null;
      const next = s.exitEstimate?.toISOString() ?? null;
      h.stored.set(key, { exit: next && (!prev || next > prev) ? next : prev });
    }
    return sessions.length;
  },
  pruneOldSessions: async () => 0,
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: vi.fn(async () => {}) }));

import { GET } from "@/app/api/cron/cleaning-watch/route";

const call = () =>
  GET(new NextRequest("https://example.test/api/cron/cleaning-watch", { headers: { authorization: "Bearer secret-de-test" } }));

beforeEach(() => {
  h.kv.clear();
  h.stored.clear();
  process.env.CRON_SECRET = "secret-de-test";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
  process.env.NUKI_API_TOKEN = "jeton-de-test";
  process.env.NUKI_SMARTLOCK_ID = "123";
  process.env.TRACKED_PEOPLE = "Intervenante:ménage";
  delete process.env.CLEANING_WATCH_ENABLED;
  vi.useFakeTimers({ toFake: ["Date"] });
  return () => vi.useRealTimers();
});

describe("cleaning-watch — journal relu sur 10 h au moins", () => {
  it("arrivée porte 9 h, passages 11 h 15 et 12 h 45 : une seule session, sortie 12 h 30", async () => {
    vi.setSystemTime(at("11:15"));
    h.motions = [at("10:50")];
    expect((await call()).status).toBe(200);

    vi.setSystemTime(at("12:45"));
    h.motions = [at("10:50"), at("12:30")];
    expect((await call()).status).toBe(200);

    expect([...h.stored.keys()]).toEqual([`Intervenante:${at("09:00").toISOString()}`]);
    expect(h.stored.get(`Intervenante:${at("09:00").toISOString()}`)?.exit).toBe(at("12:30").toISOString());
  });
});
