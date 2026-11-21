import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Réservations lointaines (bilan du 2026-11-21) : la seconde lecture filtre sur la **création**
 * (`bookingTimeFrom`), sans borne d'arrivée, et ne garde que la maison.
 */
const h = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("@sejour/socle/lib/beds24-client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sejour/socle/lib/beds24-client")>()),
  createBeds24Client: () => ({ get: h.get }),
}));
vi.mock("@/lib/redis", () => ({ hasRedis: () => false, getRedis: () => null, redisKey: (...k: string[]) => k.join(":") }));

describe("reservationsCreeesDepuis", () => {
  beforeEach(() => h.get.mockReset());

  it("envoie bookingTimeFrom tel quel, sans borne d'arrivée, en lecture fraîche, maison seulement", async () => {
    const { reservationsCreeesDepuis } = await import("@/lib/beds24");
    const { PROPERTY_ID } = await import("@/lib/beds24-property");
    h.get.mockResolvedValue({ data: [{ id: 1, propertyId: PROPERTY_ID }, { id: 2, propertyId: PROPERTY_ID + 1 }] });

    const depuis = new Date(Date.UTC(2026, 10, 18, 7, 0, 0)).toISOString();
    const rows = await reservationsCreeesDepuis(depuis);

    expect(rows.map((b) => b.id)).toEqual([1]);
    const [path, opts] = h.get.mock.calls[0]!;
    expect(path).toBe("/bookings");
    expect(opts.params).toEqual({ propertyId: String(PROPERTY_ID), bookingTimeFrom: "2026-11-18T07:00:00.000Z", includeInfoItems: "true" });
    expect(opts).toMatchObject({ route: "messagerie", fresh: true });
  });
});
