import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Routes durcies le 2026-11-20 : disponibilités publiques (lecture mensuelle, horizon, cache),
 * calendrier du dashboard (propriété du site, plage bornée), gardes du chauffage.
 * Beds24 et Heatzy sont simulés : aucun appel réseau.
 */
const calls: { kind: string; from: string; to: string; propertyId: number }[] = [];

vi.mock("@/lib/beds24", () => ({
  getAvailability: vi.fn(async (propertyId: number, from: string, to: string) => {
    calls.push({ kind: "avail", from, to, propertyId });
    const out: Record<string, boolean> = {};
    for (let d = new Date(`${from}T12:00:00Z`); d.toISOString().slice(0, 10) <= to; d.setUTCDate(d.getUTCDate() + 1)) {
      out[d.toISOString().slice(0, 10)] = true;
    }
    return out;
  }),
  getMinStay: vi.fn(async (propertyId: number, from: string, to: string) => {
    calls.push({ kind: "minStay", from, to, propertyId });
    return { [from]: 2 };
  }),
}));

vi.mock("@/lib/heatzy", () => ({}));
vi.mock("@/lib/bookings", () => ({}));

const SECRET = "secret-de-test-assez-long-pour-hs256-0123456789";

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv("DASHBOARD_SECRET", SECRET);
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-20T10:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

const get = (path: string, cookie?: string) =>
  new NextRequest(`https://www.example.test${path}`, {
    headers: cookie ? { cookie: `dashboard_token=${cookie}` } : {},
  });

describe("/api/availability", () => {
  it("lit par mois entiers, découpe la fenêtre et pose le Cache-Control public", async () => {
    const { GET } = await import("@/app/api/availability/route");
    const res = await GET(get("/api/availability?mode=map&from=2026-12-10&to=2027-01-05"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, s-maxage=60, stale-while-revalidate=60");
    const json = await res.json();
    expect(Object.keys(json).sort()).toEqual(["dates", "minStay"]);
    expect(Object.keys(json.dates)[0]).toBe("2026-12-10");
    expect(Object.keys(json.dates).at(-1)).toBe("2027-01-05");
    const avail = calls.filter((c) => c.kind === "avail");
    expect(avail.map((c) => [c.from, c.to])).toEqual([
      ["2026-12-01", "2026-12-31"],
      ["2027-01-01", "2027-01-31"],
    ]);
  });

  it("deux fenêtres différentes du même mois lisent la même URL Beds24", async () => {
    const { GET } = await import("@/app/api/availability/route");
    await GET(get("/api/availability?mode=map&from=2027-02-03&to=2027-02-10"));
    await GET(get("/api/availability?mode=map&from=2027-02-11&to=2027-02-20"));
    const urls = new Set(calls.filter((c) => c.kind === "avail").map((c) => `${c.from}/${c.to}`));
    expect([...urls]).toEqual(["2027-02-01/2027-02-28"]);
  });

  it("ramène la fin à aujourd'hui + 400 jours et rend vide au-delà", async () => {
    const { GET } = await import("@/app/api/availability/route");
    const res = await GET(get("/api/availability?mode=map&from=2027-12-01&to=2028-03-01"));
    const json = await res.json();
    expect(Object.keys(json.dates).at(-1)).toBe("2027-12-25");
    calls.length = 0;
    const loin = await GET(get("/api/availability?mode=map&from=2028-06-01&to=2028-06-30"));
    expect(await loin.json()).toEqual({ dates: {}, minStay: {} });
    expect(calls).toHaveLength(0);
  });

  it("ramène le début à aujourd'hui − 31 jours", async () => {
    const { GET } = await import("@/app/api/availability/route");
    const res = await GET(get("/api/availability?mode=map&from=2026-01-01&to=2026-11-30"));
    const json = await res.json();
    expect(Object.keys(json.dates)[0]).toBe("2026-10-20");
  });

  it("mode historique : une nuit hors horizon compte comme prise", async () => {
    const { GET } = await import("@/app/api/availability/route");
    const ok = await (await GET(get("/api/availability?checkIn=2027-03-01&checkOut=2027-03-04"))).json();
    expect(ok.available).toBe(true);
    const loin = await (await GET(get("/api/availability?checkIn=2027-12-20&checkOut=2027-12-30"))).json();
    expect(loin.available).toBe(false);
  });
});

describe("/api/dashboard/calendar", () => {
  it("refuse une autre propriété et une plage trop longue, sert celle du site", async () => {
    const { createToken } = await import("@/lib/auth");
    const { PROPERTY_ID } = await import("@/lib/beds24-property");
    const { GET } = await import("@/app/api/dashboard/calendar/route");
    const t = await createToken("viewer");
    expect((await GET(get(`/api/dashboard/calendar?propertyId=1&from=2027-01-01&to=2027-01-08`, t))).status).toBe(400);
    expect(
      (await GET(get(`/api/dashboard/calendar?propertyId=${PROPERTY_ID}&from=2026-01-01&to=2028-01-01`, t))).status,
    ).toBe(400);
    expect(
      (await GET(get(`/api/dashboard/calendar?propertyId=${PROPERTY_ID}&from=2027-01-08&to=2027-01-01`, t))).status,
    ).toBe(400);
    const ok = await GET(get(`/api/dashboard/calendar?propertyId=${PROPERTY_ID}&from=2027-01-01&to=2027-01-08`, t));
    expect(ok.status).toBe(200);
    expect(calls.every((c) => c.propertyId === PROPERTY_ID)).toBe(true);
  });
});

describe("chauffage : réglages d'installation admin seulement", () => {
  const post = (path: string, cookie: string) =>
    new NextRequest(`https://www.example.test${path}`, {
      method: "POST",
      headers: { cookie: `dashboard_token=${cookie}`, "content-type": "application/json" },
      body: "{}",
    });

  type Handlers = Record<string, (r: NextRequest) => Promise<Response>>;
  const routes: Record<string, () => Promise<unknown>> = {
    "summer-mode": () => import("@/app/api/dashboard/heating/summer-mode/route"),
    "add-device": () => import("@/app/api/dashboard/heating/add-device/route"),
    "pilot-lock": () => import("@/app/api/dashboard/heating/pilot-lock/route"),
    lock: () => import("@/app/api/dashboard/heating/lock/route"),
    scan: () => import("@/app/api/dashboard/heating/scan/route"),
  };

  it.each([
    ["summer-mode", "POST"],
    ["add-device", "POST"],
    ["pilot-lock", "POST"],
    ["lock", "POST"],
    ["scan", "GET"],
  ])("viewer refusé sur %s %s", async (route, method) => {
    const { createToken } = await import("@/lib/auth");
    const mod = (await routes[route]()) as Handlers;
    const t = await createToken("viewer");
    const req = method === "POST" ? post(`/api/dashboard/heating/${route}`, t) : get(`/api/dashboard/heating/${route}`, t);
    expect((await mod[method](req)).status).toBe(403);
  });
});
