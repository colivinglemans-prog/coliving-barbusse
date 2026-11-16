/**
 * Routes des horaires convenus : écriture admin seulement, lecture admin + viewer, réponse sans
 * donnée personnelle. Beds24 et Redis simulés ; réservations inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  hash: new Map<string, string>(),
  booking: { id: 1000001, arrival: "2027-01-08", departure: "2027-01-10", status: "confirmed", firstName: "Test", email: "x@exemple.fr" },
  neighbours: [] as Array<{ id: number; arrival: string; departure: string; status: string }>,
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
vi.mock("@/lib/beds24", () => ({ getBookingById: async () => h.booking }));
vi.mock("@/lib/bookings", () => ({
  getBookingsWithArchive: async (q: { arrivalFrom?: string; departureFrom?: string }) =>
    h.neighbours.filter((b) => (q.arrivalFrom ? b.arrival === q.arrivalFrom : b.departure === q.departureFrom)),
}));

import { auth, COOKIE_NAME } from "@/lib/auth";
import { DELETE, POST } from "@/app/api/dashboard/bookings/[id]/stay-hours/route";
import { GET } from "@/app/api/dashboard/stay-status/route";

async function req(url: string, role: "admin" | "viewer" | null, init: { method?: string; body?: unknown } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
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

describe("GET /api/dashboard/stay-status", () => {
  it("lisible du viewer : identifiants et heures, rien d'autre", async () => {
    h.hash.set("1000001", JSON.stringify({ departureHour: 16, note: "ne doit pas sortir" }));
    const res = await GET(await req("/api/dashboard/stay-status", "viewer"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ hours: { "1000001": { departureHour: 16 } } });
    expect((await GET(await req("/api/dashboard/stay-status", null))).status).toBe(401);
  });
});
