/**
 * cleaning-watch : alerte d'arrivée des codes perso (2026-11-18). Une notification par venue,
 * priorité 2, rien au premier passage, rien de perdu quand une source est illisible, et le nom ne
 * sort que par ntfy (ni réponse JSON, ni journal des notifications). Sources, Redis et ntfy
 * simulés ; noms inventés.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const at = (hhmm: string) => new Date(`2026-11-17T${hhmm}:00Z`);

const h = vi.hoisted(() => ({
  kv: new Map<string, unknown>(),
  garage: [] as Array<{ at: Date; code: string; name: string }>,
  garageError: null as Error | null,
  doorPersonal: [] as Array<{ source: "porte"; at: Date; who: string }>,
  doorError: null as Error | null,
  sent: [] as Array<{ message: string; options: { title?: string; priority?: number }; log?: { title?: string } }>,
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
    get: async (k: string) => (h.kv.has(k) ? JSON.parse(JSON.stringify(h.kv.get(k))) : null),
    set: async (k: string, v: unknown) => {
      h.kv.set(k, v);
      return "OK";
    },
  }),
}));
vi.mock("@/lib/cleaning/sources", () => ({
  readGarageOpenings: async () => {
    if (h.garageError) throw h.garageError;
    return h.garage;
  },
  doorReading: async () => {
    if (h.doorError) throw h.doorError;
    return { arrivals: [], guestCodes: [], personal: h.doorPersonal };
  },
  guestArrivalDays: async () => new Map(),
  cameraMotions: async () => [],
  buttonPresses: async () => [],
}));
vi.mock("@/lib/cleaning/store", () => ({
  upsertSessions: vi.fn(async (sessions: unknown[]) => sessions.length),
  pruneOldSessions: async () => 0,
}));
vi.mock("@/lib/ntfy", () => ({
  sendNtfy: vi.fn(async (message: string, options: { title?: string; priority?: number }, log?: { title?: string }) => {
    h.sent.push({ message, options, log });
  }),
}));
vi.mock("@/lib/heartbeat", () => ({ beat: async () => {} }));
vi.mock("@/lib/alert-memory", () => ({ reportAlerts: async () => {}, reportCronRun: async () => {} }));
vi.mock("@/lib/nuki-log-cursor", () => ({ readLogSince: async (_: string, d: Date) => d, saveLogSince: async () => {} }));

import { GET } from "@/app/api/cron/cleaning-watch/route";
import { upsertSessions } from "@/lib/cleaning/store";

const call = async () => {
  const res = await GET(
    new NextRequest("https://example.test/api/cron/cleaning-watch", { headers: { authorization: "Bearer secret-de-test" } }),
  );
  return { status: res.status, text: await res.text() };
};
const personalAlerts = () => h.sent.filter((s) => s.log?.title === "Accès maison — code perso");

beforeEach(() => {
  h.kv.clear();
  h.sent.length = 0;
  h.garage = [];
  h.garageError = null;
  h.doorPersonal = [];
  h.doorError = null;
  vi.mocked(upsertSessions).mockClear();
  process.env.CRON_SECRET = "secret-de-test";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
  process.env.TRACKED_PEOPLE = "Intervenante:ménage";
  delete process.env.CLEANING_WATCH_ENABLED;
  vi.useFakeTimers({ toFake: ["Date"] });
  return () => vi.useRealTimers();
});

describe("cleaning-watch — codes perso", () => {
  it("premier passage : ligne de base posée, aucune alerte, même avec des codes au journal", async () => {
    vi.setSystemTime(at("08:30"));
    h.garage = [{ at: at("08:00"), code: "1", name: "Perso" }];
    h.doorPersonal = [{ source: "porte", at: at("08:10"), who: "Gaspard" }];
    expect((await call()).status).toBe(200);
    expect(h.sent).toEqual([]);
    expect(h.kv.get("barbusse:cleaning:last-personal")).toEqual({ garage: at("08:00").getTime(), porte: at("08:10").getTime() });
  });

  it("une alerte par venue, priorité 2, nom dans ntfy seulement ; personne suivie et journal non touchés", async () => {
    vi.setSystemTime(at("08:30"));
    await call();

    vi.setSystemTime(at("09:40"));
    h.garage = [
      { at: at("09:00"), code: "1", name: "Perso" },
      { at: at("09:30"), code: "1", name: "Perso" },
    ];
    h.doorPersonal = [{ source: "porte", at: at("09:05"), who: "Gaspard" }];
    const res = await call();
    expect(res.status).toBe(200);
    const alerts = personalAlerts();
    expect(alerts.map((a) => a.options.title)).toEqual(["Accès maison — Perso", "Accès maison — Gaspard"]);
    expect(alerts.every((a) => a.options.priority === 2)).toBe(true);
    expect(alerts[0].message).toBe("Code « Perso » à 10:00 — garage.");
    expect(JSON.parse(res.text).personal).toBe(2);
    expect(res.text).not.toContain("Perso");
    expect(res.text).not.toContain("Gaspard");
    // Les codes perso n'entrent pas dans le journal des intervenants.
    for (const [sessions] of vi.mocked(upsertSessions).mock.calls) expect(sessions).toEqual([]);

    // Passage suivant, rien de neuf : pas de nouvelle alerte.
    vi.setSystemTime(at("09:50"));
    await call();
    expect(personalAlerts()).toHaveLength(2);
  });

  it("garage illisible : rien n'est conclu ni perdu, l'arrivée part au passage suivant", async () => {
    vi.setSystemTime(at("08:30"));
    await call();
    const base = h.kv.get("barbusse:cleaning:last-personal");

    vi.setSystemTime(at("09:40"));
    h.garageError = new Error("délai dépassé");
    const res = await call();
    expect(JSON.parse(res.text).success).toBe(false);
    expect(personalAlerts()).toEqual([]);
    expect(h.kv.get("barbusse:cleaning:last-personal")).toEqual(base);

    vi.setSystemTime(at("09:50"));
    h.garageError = null;
    h.garage = [{ at: at("09:20"), code: "1", name: "Perso" }];
    await call();
    expect(personalAlerts().map((a) => a.options.title)).toEqual(["Accès maison — Perso"]);
  });

  it("journal de la porte illisible : la ligne de base de la porte ne bouge pas", async () => {
    vi.setSystemTime(at("08:30"));
    await call();
    const base = h.kv.get("barbusse:cleaning:last-personal") as { porte: number };

    vi.setSystemTime(at("09:40"));
    h.doorError = new Error("journal tronqué");
    await call();
    expect((h.kv.get("barbusse:cleaning:last-personal") as { porte: number }).porte).toBe(base.porte);

    vi.setSystemTime(at("09:50"));
    h.doorError = null;
    h.doorPersonal = [{ source: "porte", at: at("09:35"), who: "Gaspard" }];
    await call();
    expect(personalAlerts().map((a) => a.options.title)).toEqual(["Accès maison — Gaspard"]);
  });
});
