/**
 * La synchro de la serrure n'évalue ses alertes qu'au passage horaire du cron : le webhook Beds24
 * se déclenche aussi sur nos propres écritures, et une serrure vue hors ligne entre deux passages
 * suffisait à envoyer une priorité 5 (2026-11-10). Serrure, Beds24, Redis et ntfy simulés ;
 * données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { store, sendNtfy } = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  sendNtfy: vi.fn<(body: string, options: unknown) => Promise<void>>(async () => {}),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ set: async () => "OK", del: async () => 1 }),
  hasRedis: () => false,
  redisKey: (...parts: Array<string | number>) => ["barbusse", ...parts].join(":"),
  getJson: async (key: string) => store.get(key) ?? null,
  setJson: async (key: string, value: unknown) => {
    store.set(key, JSON.parse(JSON.stringify(value)));
  },
}));
vi.mock("@/lib/beds24", () => ({
  addNukiPin: vi.fn(),
  confirmBooking: vi.fn(),
  getBookingById: vi.fn(async () => null),
  getBookings: vi.fn(async () => []),
  nukiCodeOf: () => null,
}));
vi.mock("@sejour/socle/lib/nuki", () => ({
  getLockHealth: async () => ({
    online: false,
    keypadPaired: true,
    batteryCritical: false,
    keypadBatteryCritical: false,
    batteryChargePercent: 80,
    lockState: null,
    motorBlocked: false,
  }),
  listAuths: async () => [],
  listLog: async () => [],
  createKeypadCode: vi.fn(),
  updateKeypadCode: vi.fn(),
  deleteAuth: vi.fn(),
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy }));

import { runAccessSync } from "@/lib/access-sync";

beforeEach(() => {
  store.clear();
  sendNtfy.mockClear();
  process.env.NUKI_API_TOKEN = "jeton-de-test";
  process.env.NUKI_SMARTLOCK_ID = "123";
  process.env.NUKI_SYNC_MODE = "live";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
});

describe("runAccessSync — serrure hors ligne", () => {
  it("passages lancés par le webhook : rien n'est évalué ni envoyé", async () => {
    for (let i = 0; i < 3; i++) await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(sendNtfy).not.toHaveBeenCalled();
    expect([...store.keys()].filter((k) => k.includes("nuki"))).toEqual([]);
  });

  it("cron : rien au 1er passage, une alerte priorité 4 au 2e, rien au 3e", async () => {
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(sendNtfy).not.toHaveBeenCalled();
    await runAccessSync({ dryRun: false, trigger: "cron" });
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(sendNtfy).toHaveBeenCalledTimes(1);
    expect(sendNtfy.mock.calls[0]).toEqual([
      "La serrure est hors ligne pour Nuki : aucun code ne peut lui être envoyé.",
      { title: "Serrure Barbusse", priority: 4, tags: ["lock"] },
    ]);
  });

  it("à blanc (`?dry=1`) : l'état d'alerte n'avance pas", async () => {
    await runAccessSync({ dryRun: true, trigger: "cron" });
    await runAccessSync({ dryRun: true, trigger: "cron" });
    expect(sendNtfy).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
  });
});
