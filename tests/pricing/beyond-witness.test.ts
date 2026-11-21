import { describe, expect, it } from "vitest";
import { BeyondApiError, decodeBeyondCalendar, getBeyondCalendar } from "@/lib/pricing/beyond-client";
import { beyondHigherInsights } from "@/lib/pricing/insights";
import type { PriceSnapshot } from "@/lib/pricing/snapshot";

/** Témoin Beyond (API en lecture). Données inventées. */
const SECRET = "bpat_test_0000000000000000";

const sample = {
  data: [
    {
      attributes: {
        date: "2027-04-09",
        availability: "available",
        price: 1060,
        "price-posted": 1056,
        "effective-min-price": 940,
        "min-stay": 3,
        factors: [{ key: "event", ratio: 1.1 }, { key: "dow", ratio: 0.02 }],
      },
    },
    { attributes: { date: "pas une date" } },
  ],
};

describe("client de l'API Beyond", () => {
  it("décode le calendrier et ignore les entrées mal formées", () => {
    expect(decodeBeyondCalendar(sample)).toEqual([
      { date: "2027-04-09", availability: "available", price: 1060, posted: 1056, effectiveMinPrice: 940, minStay: 3, eventRatio: 1.1 },
    ]);
    expect(() => decodeBeyondCalendar({ nope: 1 })).toThrow(BeyondApiError);
  });

  it("n'envoie que des GET, le jeton en en-tête et jamais dans l'URL", async () => {
    let seen: { url: string; init?: RequestInit } | null = null;
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen = { url, init };
      return new Response(JSON.stringify(sample), { status: 200 });
    }) as unknown as typeof fetch;
    await getBeyondCalendar({ token: SECRET, listingId: 1, from: "2027-04-01", to: "2027-04-30", fetchImpl });
    expect(seen!.init?.method).toBe("GET");
    expect(seen!.url).not.toContain(SECRET);
    expect((seen!.init?.headers as Record<string, string>).Authorization).toBe(`Bearer ${SECRET}`);
  });

  it("une erreur ne cite ni le jeton ni la réponse", async () => {
    const fetchImpl = (async () => new Response(`refusé pour ${SECRET}`, { status: 401 })) as unknown as typeof fetch;
    const err = await getBeyondCalendar({ token: SECRET, listingId: 1, from: "2027-04-01", to: "2027-04-30", fetchImpl }).catch(
      (e) => e as Error,
    );
    expect(err).toBeInstanceOf(BeyondApiError);
    expect((err as Error).message).not.toContain(SECRET);
    expect((err as Error).message).toMatch(/401/);
  });
});

describe("« Beyond voit plus haut »", () => {
  const snapshot: PriceSnapshot = {
    date: "2026-12-10",
    takenAt: "x",
    days: { "2027-04-09": [900, 3, 1], "2027-04-10": [900, 3, 0], "2027-04-11": [900, 3, 1] },
  };
  const blocks = [{ id: "24h-moto-2027", label: "24H Moto", from: "2027-04-07", to: "2027-04-11" }];

  it("signale une nuit libre suggérée à plus de +15 %, jamais une nuit vendue", () => {
    const out = beyondHigherInsights({ snapshot, suggested: { "2027-04-09": 1_100, "2027-04-10": 2_000, "2027-04-11": 950 }, blocks });
    expect(out).toHaveLength(1);
    expect(out[0].line).toMatch(/1 nuit\(s\) libre\(s\)/);
  });

  it("rien sous le seuil", () => {
    expect(beyondHigherInsights({ snapshot, suggested: { "2027-04-09": 1_000 }, blocks })).toEqual([]);
  });
});
