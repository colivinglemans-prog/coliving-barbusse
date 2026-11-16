/**
 * Routes des horaires convenus : écriture admin seulement, lecture admin + viewer, réponse sans
 * donnée personnelle. Beds24 et Redis simulés ; réservations inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  hash: new Map<string, string>(),
  booking: { id: 1000001, propertyId: 303771, arrival: "2027-01-08", departure: "2027-01-10", status: "confirmed", firstName: "Test", email: "x@exemple.fr" } as Record<string, unknown>,
  sync: vi.fn(async (options: { dryRun: boolean; trigger: string }): Promise<{ mode: string; actions: Array<{ ok?: boolean }>; skipped?: string }> => {
    void options;
    return { mode: "live", actions: [] };
  }),
  beds24Down: false,
  others: [] as Array<Record<string, unknown>>,
  neighbours: [] as Array<{ id: number; propertyId?: number; arrival: string; departure: string; status: string }>,
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => true,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => ({
    hgetall: async () => Object.fromEntries(h.hash),
    hset: async (_k: string, v: Record<string, string>) => {
      for (const [f, val] of Object.entries(v)) h.hash.set(f, val);
    },
    hdel: async (_k: string, f: string) => h.hash.delete(f),
  }),
}));
vi.mock("@/lib/beds24", () => ({
  getBookingById: async () => h.booking,
  getBookings: async () => {
    if (h.beds24Down) throw new Error("Beds24 injoignable");
    return [h.booking, ...h.others];
  },
}));
vi.mock("@/lib/access-sync", () => ({ runAccessSync: h.sync }));
vi.mock("@/lib/bookings", () => ({
  getBookingsWithArchive: async (q: { arrivalFrom?: string; departureFrom?: string }) =>
    h.neighbours.filter((b) => (q.arrivalFrom ? b.arrival === q.arrivalFrom : b.departure === q.departureFrom)),
}));

import { auth, COOKIE_NAME } from "@/lib/auth";
import { DELETE, POST } from "@/app/api/dashboard/bookings/[id]/stay-hours/route";
import { GET } from "@/app/api/dashboard/stay-status/route";

async function req(
  url: string,
  role: "admin" | "viewer" | null,
  init: { method?: string; body?: unknown; origin?: string | null; contentType?: string } = {},
) {
  const headers: Record<string, string> = { "content-type": init.contentType ?? "application/json" };
  if (init.origin !== null) headers.origin = init.origin ?? "https://example.test";
  if (role) headers.cookie = `${COOKIE_NAME}=${await auth.createToken(role)}`;
  return new NextRequest(`https://example.test${url}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}
const params = { params: Promise.resolve({ id: "1000001" }) };

beforeEach(() => {
  h.hash.clear();
  h.neighbours = [];
  h.others = [];
  h.beds24Down = false;
  h.booking = { ...h.booking, propertyId: 303771, status: "confirmed" };
  h.sync.mockReset();
  h.sync.mockImplementation(async () => ({ mode: "live", actions: [], skipped: undefined }));
  process.env.DASHBOARD_SECRET = "secret-de-test-assez-long-pour-hs256-0000";
});

describe("POST/DELETE /api/dashboard/bookings/[id]/stay-hours", () => {
  it("refusé au viewer et à l'anonyme, sans rien écrire", async () => {
    const url = "/api/dashboard/bookings/1000001/stay-hours";
    expect((await POST(await req(url, "viewer", { method: "POST", body: { departureHour: 16 } }), params)).status).toBe(403);
    expect((await POST(await req(url, null, { method: "POST", body: { departureHour: 16 } }), params)).status).toBe(401);
    expect((await DELETE(await req(url, "viewer", { method: "DELETE" }), params)).status).toBe(403);
    expect(h.hash.size).toBe(0);
  });

  it("admin : enregistre, puis retire", async () => {
    const url = "/api/dashboard/bookings/1000001/stay-hours";
    const res = await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, bookingId: 1000001, hours: { departureHour: 16 } });
    expect(JSON.parse(h.hash.get("1000001")!)).toEqual({ departureHour: 16 });
    expect((await DELETE(await req(url, "admin", { method: "DELETE" }), params)).status).toBe(200);
    expect(h.hash.size).toBe(0);
  });

  it("admin : heure hors bornes refusée (400), départ après l'arrivée suivante refusé (409)", async () => {
    const url = "/api/dashboard/bookings/1000001/stay-hours";
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 9 } }), params)).status).toBe(400);
    h.neighbours = [{ id: 1000002, arrival: "2027-01-10", departure: "2027-01-12", status: "confirmed" }];
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 18 } }), params)).status).toBe(409);
    const ok = await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params);
    expect((await ok.json()).warning).toBe("Une arrivée est prévue le même jour à 17 h.");
  });
});

describe("saisie : origine, format, réservation de la maison", () => {
  const url = "/api/dashboard/bookings/1000001/stay-hours";

  it("autre origine ou sans origine : 403 ; sans JSON : 415", async () => {
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 }, origin: "https://ailleurs.test" }), params)).status).toBe(403);
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 }, origin: null }), params)).status).toBe(403);
    expect((await DELETE(await req(url, "admin", { method: "DELETE", origin: "https://ailleurs.test" }), params)).status).toBe(403);
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 }, contentType: "text/plain" }), params)).status).toBe(415);
    expect(h.hash.size).toBe(0);
  });

  it("autre propriété ou réservation annulée : 404", async () => {
    h.booking = { ...h.booking, propertyId: 310268 };
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params)).status).toBe(404);
    h.booking = { ...h.booking, propertyId: 303771, status: "cancelled" };
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params)).status).toBe(404);
    expect(h.hash.size).toBe(0);
  });

  it("une option qui arrive le même jour n'est pas un voisin (même règle que la popup)", async () => {
    h.neighbours = [{ id: 1000002, arrival: "2027-01-10", departure: "2027-01-12", status: "black" }];
    expect((await POST(await req(url, "admin", { method: "POST", body: { departureHour: 18 } }), params)).status).toBe(200);
  });
});

describe("synchro immédiate de la serrure après la saisie", () => {
  const url = "/api/dashboard/bookings/1000001/stay-hours";

  it("POST et DELETE relancent la synchro comme le webhook (sans alerte du cron)", async () => {
    await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params);
    await DELETE(await req(url, "admin", { method: "DELETE" }), params);
    expect(h.sync.mock.calls).toEqual([[{ dryRun: false, trigger: "dashboard" }], [{ dryRun: false, trigger: "dashboard" }]]);
  });

  it("synchro en échec ou occupée : la saisie reste, 200 avec syncDeferred", async () => {
    h.sync.mockImplementation(async () => {
      throw new Error("Nuki injoignable");
    });
    const res = await POST(await req(url, "admin", { method: "POST", body: { departureHour: 16 } }), params);
    expect(res.status).toBe(200);
    expect((await res.json()).syncDeferred).toBe(true);
    expect(h.hash.has("1000001")).toBe(true);
    h.sync.mockImplementation(async () => ({ mode: "live", actions: [], skipped: "un autre passage est en cours" }));
    expect((await (await DELETE(await req(url, "admin", { method: "DELETE" }), params)).json()).syncDeferred).toBe(true);
  });

  it("saisie refusée : pas de synchro", async () => {
    await POST(await req(url, "viewer", { method: "POST", body: { departureHour: 16 } }), params);
    await POST(await req(url, "admin", { method: "POST", body: { departureHour: 9 } }), params);
    expect(h.sync).not.toHaveBeenCalled();
  });
});

describe("GET /api/dashboard/stay-status", () => {
  it("lisible du viewer : identifiants et heures, rien d'autre", async () => {
    h.hash.set("1000001", JSON.stringify({ departureHour: 16, note: "ne doit pas sortir" }));
    // Une autre propriété et une réservation annulée : jamais servies.
    h.others = [
      { id: 1000002, propertyId: 310268, arrival: "2027-01-08", departure: "2027-01-10", status: "confirmed" },
      { id: 1000003, propertyId: 303771, arrival: "2027-01-08", departure: "2027-01-10", status: "cancelled" },
    ];
    h.hash.set("1000002", JSON.stringify({ departureHour: 16 }));
    h.hash.set("1000003", JSON.stringify({ departureHour: 16 }));
    h.hash.set("1000004", JSON.stringify({ departureHour: 16 }));
    const res = await GET(await req("/api/dashboard/stay-status", "viewer"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hours: { "1000001": { departureHour: 16 } } });
    h.beds24Down = true;
    expect(await (await GET(await req("/api/dashboard/stay-status", "viewer"))).json()).toEqual({ hours: {} });
    expect((await GET(await req("/api/dashboard/stay-status", null))).status).toBe(401);
  });
});
