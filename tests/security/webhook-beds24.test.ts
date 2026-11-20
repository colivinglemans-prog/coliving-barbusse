/**
 * Webhook Beds24 : secret par l'en-tête (voie normale) ou par `?key=` (secours), et **aucune
 * écriture** pour un appel refusé — un appel anonyme écrasait le témoin de l'écran Messages.
 * Synchro, messagerie et Redis simulés ; aucun vrai secret.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  writes: [] as string[],
  sync: vi.fn(async () => ({ mode: "live", actions: [], skipped: undefined })),
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => true,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async () => null,
  setJson: async (k: string) => {
    h.writes.push(k);
  },
  getRedis: () => ({
    set: async (k: string) => {
      h.writes.push(k);
      return "OK";
    },
    lpush: async (k: string) => {
      h.writes.push(k);
    },
    ltrim: async () => {},
    expire: async () => {},
  }),
}));
vi.mock("@/lib/access-sync", () => ({ runAccessSync: h.sync }));
vi.mock("@/lib/messages/engine", () => ({ modes: () => ({ killSwitch: true, modes: {} }), runCron: vi.fn() }));

import { POST } from "@/app/api/webhooks/beds24/route";

const SECRET = "secret-de-test-du-webhook";
const call = (opts: { header?: string; key?: string; ua?: string } = {}) =>
  POST(
    new NextRequest(`https://example.test/api/webhooks/beds24${opts.key ? `?key=${encodeURIComponent(opts.key)}` : ""}`, {
      method: "POST",
      headers: {
        ...(opts.header ? { "x-webhook-secret": opts.header } : {}),
        ...(opts.ua ? { "user-agent": opts.ua } : {}),
      },
    }),
  );

beforeEach(() => {
  h.writes = [];
  h.sync.mockClear();
  process.env.BEDS24_WEBHOOK_SECRET = SECRET;
});

describe("webhook Beds24", () => {
  it("secret par l'en-tête : accepté, témoin écrit avec la voie", async () => {
    const res = await call({ header: SECRET });
    expect(res.status).toBe(200);
    expect(h.sync).toHaveBeenCalledOnce();
    expect(h.writes).toContain("barbusse:webhook:beds24:accepted");
  });

  it("secret par ?key= : accepté en secours", async () => {
    expect((await call({ key: SECRET })).status).toBe(200);
    expect(h.sync).toHaveBeenCalledOnce();
  });

  it("en-tête faux mais ?key= juste : accepté (l'URL reste un secours)", async () => {
    expect((await call({ header: "autre", key: SECRET })).status).toBe(200);
  });

  it.each([
    ["sans secret", {}],
    ["mauvais en-tête", { header: "faux" }],
    ["mauvaise clé", { key: "faux" }],
    ["agent de Beds24, mauvais secret", { header: "faux", ua: "Booking Notifier" }],
  ])("%s : 401, aucune synchro, rien d'écrit", async (_label, opts) => {
    const res = await call(opts);
    expect(res.status).toBe(401);
    expect(h.sync).not.toHaveBeenCalled();
    expect(h.writes).toEqual([]);
  });

  it("secret absent du serveur : 401, rien d'écrit", async () => {
    delete process.env.BEDS24_WEBHOOK_SECRET;
    expect((await call({ header: SECRET })).status).toBe(401);
    expect(h.writes).toEqual([]);
  });
});
