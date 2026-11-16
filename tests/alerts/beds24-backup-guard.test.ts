/**
 * Garde-fou de la sauvegarde Beds24 : une sauvegarde sous la moitié de la précédente n'est pas
 * écrite et n'efface rien. L'expression du nom avait perdu ses antislash : `previousCount` rendait
 * toujours `null` et le garde-fou ne jouait plus (2026-11-16). Blob, Beds24 et ntfy simulés ;
 * données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  existing: [] as string[],
  count: 0,
  put: vi.fn(async () => ({})),
  del: vi.fn(async () => {}),
  sendNtfy: vi.fn(async () => {}),
}));

vi.mock("@vercel/blob", () => ({
  list: async () => ({ blobs: h.existing.map((pathname) => ({ pathname })) }),
  put: h.put,
  del: h.del,
}));
vi.mock("@/lib/beds24", () => ({
  getAllBookingsRaw: async () =>
    Array.from({ length: h.count }, (_, i) => ({ id: 1000 + i, propertyId: 1, arrival: "2027-01-01" })),
}));
vi.mock("@/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));
vi.mock("@/lib/heartbeat", () => ({ beat: async () => {} }));

import { GET } from "@/app/api/cron/beds24-backup/route";
import { backupFloor, previousCount } from "@/lib/beds24-backup";

const call = () =>
  GET(new NextRequest("https://example.test/api/cron/beds24-backup", { headers: { authorization: "Bearer secret-de-test" } }));

beforeEach(() => {
  process.env.CRON_SECRET = "secret-de-test";
  h.put.mockClear();
  h.del.mockClear();
  h.sendNtfy.mockClear();
  h.existing = ["beds24-backup/2026-11-01_30.json.gz", "beds24-backup/2026-11-08_32.json.gz", "beds24-backup/autre.txt"];
});

describe("previousCount / backupFloor", () => {
  it("lit le nombre de la sauvegarde la plus récente", () => {
    expect(previousCount(h.existing)).toBe(32);
    expect(previousCount(["beds24-backup/dddd-dd-dd_dd.json.gz"])).toBeNull();
    expect(previousCount([])).toBeNull();
  });

  it("plancher : moitié de la précédente, 1 sans précédente", () => {
    expect(backupFloor(32)).toBe(16);
    expect(backupFloor(31)).toBe(16);
    expect(backupFloor(null)).toBe(1);
  });
});

describe("/api/cron/beds24-backup — garde-fou", () => {
  it("sous la moitié de la précédente : rien n'est écrit ni effacé, 500 et alerte", async () => {
    h.count = 10;
    const res = await call();
    expect(res.status).toBe(500);
    expect(h.put).not.toHaveBeenCalled();
    expect(h.del).not.toHaveBeenCalled();
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.sendNtfy.mock.calls[0] as unknown as [string])[0]).toContain("10 réservation(s) contre 32");
  });

  it("à la moitié ou au-dessus : la sauvegarde est écrite", async () => {
    h.count = 16;
    const res = await call();
    expect(res.status).toBe(200);
    expect(h.put).toHaveBeenCalledTimes(1);
  });
});
