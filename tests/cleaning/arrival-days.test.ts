/**
 * Suivi ménage : le jour d'arrivée des réservations dont un code géré apparaît au journal de la
 * porte (`guestArrivalDays`). Une requête Beds24, gardée 30 min ; relue seulement pour une
 * réservation inconnue ; aucun code, aucun appel. Beds24 et Redis simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const h = vi.hoisted(() => ({
  kv: new Map<string, unknown>(),
  bookings: [] as Array<{ id: number; arrival: string }>,
  calls: [] as unknown[],
  down: false,
}));

vi.mock("@/lib/redis", () => ({
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => ({}),
  getJson: async (k: string) => (h.kv.has(k) ? JSON.parse(JSON.stringify(h.kv.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.kv.set(k, JSON.parse(JSON.stringify(v)));
  },
}));
vi.mock("@/lib/beds24", () => ({
  getBookings: async (q: unknown) => {
    h.calls.push(q);
    if (h.down) throw new Error("Beds24 429");
    return h.bookings;
  },
}));

import { guestArrivalDays } from "@/lib/cleaning/sources";

const code = (bookingId: number, iso: string) => ({ bookingId, at: new Date(iso) });

beforeEach(() => {
  h.kv.clear();
  h.calls = [];
  h.down = false;
  h.bookings = [{ id: 7000001, arrival: "2026-11-04" }];
});

describe("guestArrivalDays", () => {
  it("aucun code géré : aucun appel", async () => {
    expect(await guestArrivalDays([])).toEqual(new Map());
    expect(h.calls).toHaveLength(0);
  });

  it("une requête sur les jours couverts ; le partant (arrivé avant) n'a pas de jour d'arrivée", async () => {
    const codes = [code(7000003, "2026-11-04T09:30:00Z"), code(7000001, "2026-11-04T16:00:00Z")];
    const days = await guestArrivalDays(codes);
    expect(h.calls).toEqual([{ arrivalFrom: "2026-11-04", arrivalTo: "2026-11-04" }]);
    expect(days).toEqual(new Map([[7000001, "2026-11-04"]]));
    // Passage suivant : tout est connu (le partant noté hors fenêtre), pas de relecture.
    await guestArrivalDays(codes);
    expect(h.calls).toHaveLength(1);
  });

  it("une réservation inconnue du cache (réservée le jour même) : relue", async () => {
    await guestArrivalDays([code(7000001, "2026-11-04T16:00:00Z")]);
    h.bookings = [...h.bookings, { id: 7000004, arrival: "2026-11-04" }];
    const days = await guestArrivalDays([code(7000001, "2026-11-04T16:00:00Z"), code(7000004, "2026-11-04T17:00:00Z")]);
    expect(h.calls).toHaveLength(2);
    expect(days.get(7000004)).toBe("2026-11-04");
  });

  it("Beds24 illisible : lève (l'appelant ne fait pas avancer la sortie)", async () => {
    h.down = true;
    await expect(guestArrivalDays([code(7000001, "2026-11-04T16:00:00Z")])).rejects.toThrow("429");
  });
});
