/**
 * Synchro de la serrure : un code posé dans Beds24 mais refusé par la serrure, pour une arrivée
 * aujourd'hui ou demain, alerte dès le premier passage ; au-delà, règle des deux passages. Une
 * synchro hors `live` alerte sans rien écrire. Le verrou n'est rendu que par son détenteur.
 * Serrure, Beds24, Redis et ntfy simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  store: new Map<string, unknown>(),
  sendNtfy: vi.fn<(body: string, options: { title?: string; priority?: number }) => Promise<void>>(async () => {}),
  bookings: [] as Array<Record<string, unknown>>,
  online: true,
  redisSet: vi.fn<(...args: unknown[]) => Promise<string | null>>(async () => "OK"),
  redisEval: vi.fn<(...args: unknown[]) => Promise<number>>(async () => 1),
  redisGet: vi.fn<(key: string) => Promise<unknown>>(async () => null),
  redisDel: vi.fn<(key: string) => Promise<number>>(async () => 1),
  addNukiPin: vi.fn(async () => {}),
  confirmBooking: vi.fn(async () => {}),
  createKeypadCode: vi.fn(async (): Promise<void> => {
    throw new Error("Nuki 502 : création du code");
  }),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ set: h.redisSet, eval: h.redisEval, get: h.redisGet, del: h.redisDel }),
  hasRedis: () => false,
  redisKey: (...parts: Array<string | number>) => ["barbusse", ...parts].join(":"),
  getJson: async (key: string) => h.store.get(key) ?? null,
  setJson: async (key: string, value: unknown) => {
    h.store.set(key, JSON.parse(JSON.stringify(value)));
  },
}));
vi.mock("@/lib/beds24", () => ({
  addNukiPin: h.addNukiPin,
  confirmBooking: h.confirmBooking,
  getBookingById: async () => null,
  getBookings: async () => h.bookings,
  nukiCodeOf: () => null,
}));
vi.mock("@sejour/socle/lib/nuki", () => ({
  getLockHealth: async () => ({
    online: h.online,
    keypadPaired: true,
    batteryCritical: false,
    keypadBatteryCritical: false,
    batteryChargePercent: 80,
    lockState: null,
    motorBlocked: false,
  }),
  listAuths: async () => [],
  listLog: async () => [],
  listLogSince: async () => [],
  createKeypadCode: h.createKeypadCode,
  updateKeypadCode: vi.fn(),
  deleteAuth: vi.fn(),
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { runAccessSync } from "@/lib/access-sync";

/** 11 h à Paris : de jour. Les tests de nuit posent leur propre heure. */
const DAY = new Date("2026-11-16T10:00:00Z");

function stay(arrivalInDays: number, nights = 2) {
  const today = todayParis();
  return {
    id: 7_000_001,
    propertyId: 303771,
    status: "confirmed",
    firstName: "Voyageur",
    arrival: addDays(today, arrivalInDays),
    departure: addDays(today, arrivalInDays + nights),
    mobile: "",
    phone: "",
    infoItems: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(DAY);
  h.store.clear();
  h.sendNtfy.mockClear();
  h.redisSet.mockClear();
  h.redisEval.mockReset();
  h.redisEval.mockImplementation(async () => 1);
  h.redisGet.mockReset();
  h.redisGet.mockImplementation(async () => null);
  h.redisDel.mockClear();
  h.addNukiPin.mockClear();
  h.createKeypadCode.mockClear();
  h.online = true;
  process.env.NUKI_API_TOKEN = "jeton-de-test";
  process.env.NUKI_SMARTLOCK_ID = "123";
  process.env.NUKI_SYNC_MODE = "live";
  process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
  return () => vi.useRealTimers();
});

describe("pose ratée d'un code déjà dans Beds24", () => {
  it.each([0, 1])("arrivée à J+%i : alerte priorité 5 dès le premier passage, jamais répétée", async (days) => {
    h.bookings = [stay(days)];
    const report = await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.addNukiPin).toHaveBeenCalledTimes(1); // l'ordre Beds24 → serrure est conservé
    expect(h.createKeypadCode).toHaveBeenCalledTimes(1);
    expect(report.alerts.some((a) => a.urgent)).toBe(true);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    const [body, options] = h.sendNtfy.mock.calls[0];
    expect(options.priority).toBe(5);
    expect(options.title).toContain("absent du clavier");
    expect(body).toContain(days === 0 ? "aujourd'hui" : "demain");

    // Deuxième passage, même échec : ni répétée, ni doublée par l'alerte ordinaire des codes.
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("arrivée à J+1 vue par le webhook : l'alerte urgente part aussi", async () => {
    h.bookings = [stay(1)];
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][1].priority).toBe(5);
  });

  it("arrivée à J+5 : règle des deux passages, priorité 4", async () => {
    h.bookings = [stay(5)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][1].priority).toBe(4);
    expect(h.sendNtfy.mock.calls[0][1].title).not.toContain("absent du clavier");
  });

  it("la pose réussit au passage suivant : « codes du jour posés » en priorité 1", async () => {
    h.bookings = [stay(0)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    h.createKeypadCode.mockResolvedValueOnce(undefined);
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    expect(h.sendNtfy.mock.calls[1][1].priority).toBe(1);
  });
});

describe("alerte urgente : minuit et nuit", () => {
  it("pose toujours ratée après minuit : pas de faux « rétabli »", async () => {
    vi.setSystemTime(new Date("2026-11-16T22:30:00Z")); // 23 h 30 à Paris
    h.bookings = [stay(0)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date("2026-11-16T23:30:00Z")); // 0 h 30 le lendemain : l'arrivée est « hier »
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("arrivée demain, la nuit : priorité 4 ; séjour du jour, la nuit : 5", async () => {
    vi.setSystemTime(new Date("2026-11-16T22:00:00Z")); // 23 h à Paris
    h.bookings = [stay(1)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy.mock.calls[0][1].priority).toBe(4);

    h.store.clear();
    h.sendNtfy.mockClear();
    h.bookings = [stay(0)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy.mock.calls[0][1].priority).toBe(5);
  });

  it("arrivée demain qui devient « aujourd'hui » à minuit : pas de nouvel envoi (gravité inchangée)", async () => {
    vi.setSystemTime(new Date("2026-11-16T22:00:00Z"));
    h.bookings = [stay(1)];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    vi.setSystemTime(new Date("2026-11-16T23:30:00Z"));
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });
});

describe("webhook et ntfy en panne", () => {
  it("l'envoi urgent raté ne fait pas lever le passage ; l'alerte repart au suivant", async () => {
    h.bookings = [stay(1)];
    h.sendNtfy.mockRejectedValueOnce(new Error("ntfy 503"));
    const report = await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(report.notified).toBe(0);
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    expect(h.sendNtfy.mock.calls[1][1].priority).toBe(5);
  });
});

describe("NUKI_SYNC_MODE autre que live", () => {
  it("serrure hors ligne : alerte au 2e passage du cron, sans rien écrire ni prendre le verrou", async () => {
    process.env.NUKI_SYNC_MODE = "dry";
    h.online = false;
    h.bookings = [stay(0)];
    const first = await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(first.mode).toBe("dry");
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.sendNtfy).toHaveBeenCalled();
    expect(h.sendNtfy.mock.calls.some(([, o]) => o.title === "Serrure Barbusse")).toBe(true);
    expect(h.addNukiPin).not.toHaveBeenCalled();
    expect(h.createKeypadCode).not.toHaveBeenCalled();
    expect(h.confirmBooking).not.toHaveBeenCalled();
    expect(h.redisSet).not.toHaveBeenCalled();
  });

  it("`?dry=1` : ni écriture ni alerte", async () => {
    h.online = false;
    for (let i = 0; i < 3; i++) await runAccessSync({ dryRun: true, trigger: "cron" });
    expect(h.sendNtfy).not.toHaveBeenCalled();
    expect(h.store.size).toBe(0);
  });
});

describe("verrou", () => {
  it("rendu seulement par son détenteur (libération conditionnelle, valeur unique)", async () => {
    h.bookings = [];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    await runAccessSync({ dryRun: false, trigger: "cron" });
    const owners = h.redisSet.mock.calls.map((c) => c[1]);
    expect(owners[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(owners[1]).not.toBe(owners[0]);
    expect(h.redisEval).toHaveBeenCalledTimes(2);
    const [script, keys, args] = h.redisEval.mock.calls[0] as [string, string[], string[]];
    expect(script).toContain('redis.call("get", KEYS[1]) == ARGV[1]');
    expect(keys).toEqual(["nuki:sync:lock"]);
    expect(args).toEqual([owners[0]]);
  });

  it("script refusé : repli get puis del, seulement si la valeur est toujours la nôtre", async () => {
    h.bookings = [];
    h.redisEval.mockRejectedValue(new Error("EVAL indisponible"));
    h.redisGet.mockImplementation(async () => h.redisSet.mock.calls.at(-1)?.[1]);
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.redisDel).toHaveBeenCalledWith("nuki:sync:lock");

    h.redisDel.mockClear();
    h.redisGet.mockImplementation(async () => "valeur-d-un-autre-passage");
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(h.redisDel).not.toHaveBeenCalled();
  });
});
