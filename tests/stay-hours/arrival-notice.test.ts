/**
 * Notification « arrivée imminente » : la règle pure (déclencheur, texte, priorité), l'envoi avec
 * son anti-doublon, puis le passage de la synchro de la serrure qui la déclenche. Serrure, Beds24,
 * Redis, registre du ménage et ntfy simulés ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessAction } from "@sejour/socle/lib/access-codes";
import { parisInstant } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  kv: new Map<string, string>(),
  store: new Map<string, unknown>(),
  redisDown: false,
  sendNtfy: vi.fn<(body: string, options: { title?: string; priority?: number }) => Promise<void>>(async () => {}),
  bookings: [] as Array<Record<string, unknown>>,
  auths: [] as Array<Record<string, unknown>>,
  sessions: [] as Array<{ who: string; arrival: Date }>,
  getBookings: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({
    set: async (key: string, value: string, options?: { nx?: boolean }) => {
      if (h.redisDown) throw new Error("Redis injoignable");
      if (options?.nx && h.kv.has(key)) return null;
      h.kv.set(key, value);
      return "OK";
    },
    get: async (key: string) => h.kv.get(key) ?? null,
    del: async (key: string) => (h.kv.delete(key) ? 1 : 0),
    // Libération du verrou de la synchro : seulement par son détenteur.
    eval: async (_script: string, keys: string[], args: string[]) => (h.kv.get(keys[0]) === args[0] && h.kv.delete(keys[0]) ? 1 : 0),
  }),
  hasRedis: () => false,
  redisKey: (...parts: Array<string | number>) => ["barbusse", ...parts].join(":"),
  getJson: async (key: string) => h.store.get(key) ?? null,
  setJson: async (key: string, value: unknown) => {
    h.store.set(key, JSON.parse(JSON.stringify(value)));
  },
}));
vi.mock("@/lib/beds24", () => ({
  addNukiPin: vi.fn(async () => {}),
  confirmBooking: vi.fn(async () => {}),
  getBookingById: async () => null,
  getBookings: h.getBookings,
  nukiCodeOf: (b: { infoItems?: Array<{ code: string; text: string }> }) => b.infoItems?.find((i) => i.code === "NUKI_PIN")?.text ?? null,
}));
vi.mock("@sejour/socle/lib/nuki", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sejour/socle/lib/nuki")>()),
  getLockHealth: async () => ({
    online: true,
    keypadPaired: true,
    batteryCritical: false,
    keypadBatteryCritical: false,
    batteryChargePercent: 80,
    lockState: 1,
    motorBlocked: false,
  }),
  listAuths: async () => h.auths,
  listLog: async () => [],
  listLogSince: async () => [],
  createKeypadCode: vi.fn(async () => {}),
  updateKeypadCode: vi.fn(async () => {}),
  deleteAuth: vi.fn(async () => {}),
}));
vi.mock("@/lib/cleaning/store", () => ({ loadSessions: async () => h.sessions }));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import {
  arrivalNoticeMessage,
  arrivalNoticeTriggers,
  lastDepartureBefore,
  sendArrivalNotices,
  type NoticeBooking,
  type NoticeDeps,
  type NoticeTrigger,
} from "@/lib/arrival-notice";
import { runAccessSync } from "@/lib/access-sync";

const TODAY = "2026-11-16";
/** 11 h à Paris. */
const NOW = new Date("2026-11-16T10:00:00Z");

const late: NoticeBooking = {
  id: 7000001,
  arrival: TODAY,
  departure: "2026-11-18",
  status: "confirmed",
  firstName: "Lucie Test",
  bookingTime: "2026-11-16T08:00:00Z",
  numAdult: 5,
  numChild: 2,
};
const previous: NoticeBooking = { id: 7000000, arrival: "2026-11-13", departure: "2026-11-15", status: "confirmed" };
const create = (bookingId: number): AccessAction => ({
  kind: "create",
  bookingId,
  name: `${bookingId}: Test`,
  pin: "456789",
  allowedFromDate: parisInstant(TODAY, 14).toISOString(),
  allowedUntilDate: parisInstant("2026-11-18", 14).toISOString(),
});
const update = (bookingId: number, from: string, reasons: Array<"window" | "name" | "pin" | "adopt"> = ["window"]): AccessAction => ({
  kind: "update",
  bookingId,
  authId: "auth-1",
  name: `${bookingId}: Test`,
  enabled: true,
  allowedFromDate: from,
  allowedUntilDate: parisInstant("2026-11-18", 14).toISOString(),
  reasons,
});

describe("arrivalNoticeTriggers (pure)", () => {
  it("création du code d'une réservation de dernière minute, arrivée aujourd'hui ou demain", () => {
    expect(arrivalNoticeTriggers({ executed: [create(7000001)], auths: [], bookings: [late], today: TODAY })).toEqual([
      { bookingId: 7000001, arrival: TODAY, reason: "late-booking", when: "today" },
    ]);
    const tomorrow = { ...late, arrival: "2026-11-17", bookingTime: "2026-11-16T09:00:00Z" };
    expect(arrivalNoticeTriggers({ executed: [create(7000001)], auths: [], bookings: [tomorrow], today: TODAY })[0]).toMatchObject({ when: "tomorrow" });
  });

  it("rien pour une réservation faite longtemps avant, ni pour une arrivée après-demain", () => {
    const early = { ...late, bookingTime: "2026-10-01T08:00:00Z" };
    expect(arrivalNoticeTriggers({ executed: [create(7000001)], auths: [], bookings: [early], today: TODAY })).toEqual([]);
    const later = { ...late, arrival: "2026-11-18", departure: "2026-11-20" };
    expect(arrivalNoticeTriggers({ executed: [create(7000001)], auths: [], bookings: [later], today: TODAY })).toEqual([]);
    // Sans date de création exploitable : pas « dernière minute ».
    expect(arrivalNoticeTriggers({ executed: [create(7000001)], auths: [], bookings: [{ ...late, bookingTime: null }], today: TODAY })).toEqual([]);
  });

  it("fenêtre recalée dont le jour d'arrivée a changé : oui ; même jour (heure convenue), ou nom seul : non", () => {
    const moved = { ...late, bookingTime: "2026-10-01T08:00:00Z" };
    const auths = [{ id: "auth-1", type: 13, name: "7000001: Test", enabled: true, allowedFromDate: parisInstant("2026-11-20", 14).toISOString() }];
    expect(
      arrivalNoticeTriggers({ executed: [update(7000001, parisInstant(TODAY, 14).toISOString())], auths, bookings: [moved], today: TODAY }),
    ).toEqual([{ bookingId: 7000001, arrival: TODAY, reason: "arrival-moved", when: "today" }]);
    const sameDay = [{ ...auths[0], allowedFromDate: parisInstant(TODAY, 14).toISOString() }];
    expect(
      arrivalNoticeTriggers({ executed: [update(7000001, parisInstant(TODAY, 12).toISOString())], auths: sameDay, bookings: [moved], today: TODAY }),
    ).toEqual([]);
    expect(
      arrivalNoticeTriggers({ executed: [update(7000001, parisInstant(TODAY, 14).toISOString(), ["name"])], auths, bookings: [moved], today: TODAY }),
    ).toEqual([]);
  });
});

describe("arrivalNoticeMessage (pure)", () => {
  const trigger: NoticeTrigger = { bookingId: 7000001, arrival: TODAY, reason: "late-booking", when: "today" };
  const base = {
    trigger,
    booking: late,
    lastDeparture: "2026-11-15",
    cleanings: [{ who: "Ménagère", arrival: new Date("2026-11-15T10:05:00Z") }],
    cleaners: ["Ménagère"],
    now: NOW,
    night: false,
  };

  it("prénom seul, nombre de voyageurs, dernier ménage et dernier départ ; priorité 2", () => {
    const n = arrivalNoticeMessage(base);
    expect(n.title).toBe("Arrivée imminente — Lucie");
    expect(n.logTitle).toBe("Arrivée imminente");
    expect(n.body).toBe(
      "Arrivée ce soir — réservation de dernière minute, 7 voyageurs.\nDernier ménage enregistré : Ménagère, 15/11 11 h 05 (dernier départ : 15/11).",
    );
    expect(n.priority).toBe(2);
  });

  it("aucun ménage depuis le dernier départ : priorité 4, jamais « non constaté » ; un dépannage ne compte pas", () => {
    const n = arrivalNoticeMessage({
      ...base,
      cleanings: [
        { who: "Ménagère", arrival: new Date("2026-11-12T10:00:00Z") },
        { who: "Dépanneur", arrival: new Date("2026-11-15T15:00:00Z") },
      ],
    });
    expect(n.priority).toBe(4);
    expect(n.body).toContain("Aucun ménage enregistré depuis le dernier départ (dernier départ : 15/11).");
    expect(n.body).not.toContain("non constaté");
    expect(n.body).not.toContain("Dépanneur");
  });

  it("la nuit, une arrivée demain part en priorité 2 ; une arrivée aujourd'hui garde la règle", () => {
    const empty = { ...base, cleanings: [] };
    expect(arrivalNoticeMessage({ ...empty, night: true, trigger: { ...trigger, when: "tomorrow" } }).priority).toBe(2);
    expect(arrivalNoticeMessage({ ...empty, night: true }).priority).toBe(4);
    expect(arrivalNoticeMessage({ ...empty, trigger: { ...trigger, when: "tomorrow" } }).body).toMatch(/^Arrivée demain — /);
  });

  it("date d'arrivée modifiée ; aucune heure d'arrivée annoncée", () => {
    const n = arrivalNoticeMessage({ ...base, trigger: { ...trigger, reason: "arrival-moved" }, booking: { ...late, numChild: 0, numAdult: 1 } });
    expect(n.body.split("\n")[0]).toBe("Arrivée ce soir — date d'arrivée modifiée, 1 voyageur.");
    expect(n.body).not.toMatch(/\b1[4-9] h\b/);
  });

  it("dernier départ : séjours vendus autres que celui-ci, jusqu'au jour d'arrivée compris", () => {
    const option = { ...previous, id: 7000009, departure: "2026-11-16", status: "black" };
    expect(lastDepartureBefore([late, previous, option], late)).toBe("2026-11-15");
    expect(lastDepartureBefore([late], late)).toBeNull();
  });
});

describe("sendArrivalNotices (anti-doublon)", () => {
  const trigger: NoticeTrigger = { bookingId: 7000001, arrival: TODAY, reason: "late-booking", when: "today" };
  let keys: Map<string, string>;
  let send: ReturnType<typeof vi.fn<NoticeDeps["send"]>>;
  const deps = (over: Partial<NoticeDeps> = {}): NoticeDeps => ({
    key: (t) => `barbusse:arrival-notice:${t.bookingId}:${t.arrival}`,
    set: async (key, value, { nx }) => {
      if (nx && keys.has(key)) return null;
      keys.set(key, value);
      return "OK";
    },
    del: async (key) => keys.delete(key),
    loadPastBookings: async () => [previous],
    loadCleanings: async () => [],
    cleaners: ["Ménagère"],
    send,
    now: NOW,
    night: false,
    ...over,
  });

  beforeEach(() => {
    keys = new Map();
    send = vi.fn<NoticeDeps["send"]>(async () => {});
  });

  it("une seule notification par réservation et jour d'arrivée ; la clé est posée après l'envoi", async () => {
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(1);
    expect(keys.get("barbusse:arrival-notice:7000001:2026-11-16")).toBe("sent");
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][2]).toEqual({ title: "Arrivée imminente" });
  });

  it("Redis injoignable : rien n'est envoyé", async () => {
    const down = deps({ set: async () => Promise.reject(new Error("Redis injoignable")) });
    expect(await sendArrivalNotices([trigger], [late], down)).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("envoi raté : la clé est retirée, la notification pourra repartir", async () => {
    send.mockRejectedValueOnce(new Error("ntfy 502"));
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(0);
    expect(keys.size).toBe(0);
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(1);
  });

  it("registre du ménage illisible : la notification part quand même, sans rien affirmer", async () => {
    await sendArrivalNotices([trigger], [late], deps({ loadCleanings: async () => Promise.reject(new Error("hgetall")) }));
    expect(send.mock.calls[0][0]).toContain("Registre du ménage illisible");
    expect(send.mock.calls[0][1].priority).toBe(4);
  });
});

describe("runAccessSync déclenche la notification", () => {
  const beds24 = (b: NoticeBooking, extra: Record<string, unknown> = {}) => ({
    propertyId: 303771,
    mobile: "",
    phone: "",
    infoItems: [{ code: "NUKI_PIN", text: "456789" }],
    ...b,
    ...extra,
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    h.kv.clear();
    h.store.clear();
    h.redisDown = false;
    h.sendNtfy.mockClear();
    h.auths = [];
    h.sessions = [{ who: "Ménagère", arrival: new Date("2026-11-15T10:05:00Z") }];
    h.bookings = [beds24(late), beds24(previous)];
    h.getBookings.mockReset();
    h.getBookings.mockImplementation(async () => h.bookings);
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "123";
    process.env.NUKI_SYNC_MODE = "live";
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    process.env.TRACKED_PEOPLE = "Ménagère:ménage,Dépanneur:dépannage";
    return () => vi.useRealTimers();
  });

  const notices = () => h.sendNtfy.mock.calls.filter(([, o]) => o.title?.startsWith("Arrivée imminente"));

  it("réservation de dernière minute pour ce soir : une notification, jamais deux", async () => {
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(notices()).toHaveLength(1);
    const [body, options] = notices()[0];
    expect(options).toMatchObject({ title: "Arrivée imminente — Lucie", priority: 2 });
    expect(body).toContain("Dernier ménage enregistré : Ménagère, 15/11 11 h 05 (dernier départ : 15/11)");
    // La lecture de plus : les départs passés.
    expect(h.getBookings).toHaveBeenCalledWith(expect.objectContaining({ departureFrom: "2026-09-17", departureTo: "2026-11-17" }));
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(notices()).toHaveLength(1);
  });

  it("à blanc (`?dry=1`, ou synchro hors live) : rien", async () => {
    await runAccessSync({ dryRun: true, trigger: "cron" });
    process.env.NUKI_SYNC_MODE = "dry";
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(notices()).toHaveLength(0);
  });

  it("arrivée déplacée à aujourd'hui (code existant recalé) : « date d'arrivée modifiée »", async () => {
    h.bookings = [beds24(late, { bookingTime: "2026-10-01T08:00:00Z" }), beds24(previous)];
    h.auths = [
      { id: "auth-1", type: 13, name: "7000001: Lucie", enabled: true, code: 456789, allowedFromDate: parisInstant("2026-11-20", 14).toISOString(), allowedUntilDate: parisInstant("2026-11-22", 14).toISOString() },
    ];
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(notices()).toHaveLength(1);
    expect(notices()[0][0]).toMatch(/^Arrivée ce soir — date d'arrivée modifiée/);
  });

  it("Redis injoignable : la synchro passe, aucune notification", async () => {
    // Le verrou de la synchro est pris avant : on coupe Redis pour la seule notification.
    const original = h.getBookings.getMockImplementation()!;
    h.getBookings.mockImplementation(async (...args: unknown[]) => {
      h.redisDown = true;
      return original(...args);
    });
    await expect(runAccessSync({ dryRun: false, trigger: "webhook" })).resolves.toBeDefined();
    expect(notices()).toHaveLength(0);
  });
});
