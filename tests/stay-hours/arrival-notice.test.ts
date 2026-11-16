/**
 * Notification « arrivée imminente » : la règle pure (déclencheur, texte, priorité, dernier
 * départ), l'envoi avec son anti-doublon et sa file de renvoi, puis le passage de la synchro de la
 * serrure qui la déclenche. Serrure, Beds24, Redis, registre du ménage et ntfy simulés ; données
 * inventées.
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
  createKeypadCode: vi.fn(async () => {}),
  updateKeypadCode: vi.fn(async () => {}),
  recordFails: false,
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
    scan: async (_cursor: string | number, options: { match: string }) => {
      if (h.redisDown) throw new Error("Redis injoignable");
      const prefix = options.match.slice(0, -1);
      return ["0", [...h.kv.keys()].filter((k) => k.startsWith(prefix))];
    },
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
  createKeypadCode: h.createKeypadCode,
  updateKeypadCode: h.updateKeypadCode,
  deleteAuth: vi.fn(async () => {}),
}));
vi.mock("@/lib/cleaning/store", () => ({ loadSessions: async () => h.sessions }));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));
vi.mock("@/lib/notify-log", () => ({
  recordNotification: async () => {
    if (h.recordFails) throw new Error("journal illisible");
  },
}));

import {
  arrivalNoticeMessage,
  arrivalNoticeTriggers,
  departureBefore,
  retryArrivalNotices,
  sendArrivalNotices,
  type DepartureInfo,
  type NoticeBooking,
  type NoticeDeps,
  type NoticeTrigger,
} from "@/lib/arrival-notice";
import { runAccessSync } from "@/lib/access-sync";
import { sendNtfy } from "@/lib/ntfy";

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
    departure: { kind: "past", day: "2026-11-15" } as DepartureInfo,
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

  it("dernier départ inconnu (lecture impossible) ou introuvable : priorité 4, aucun ménage annoncé « depuis le dernier départ »", () => {
    const n = arrivalNoticeMessage({ ...base, departure: { kind: "unreadable" } });
    expect(n.priority).toBe(4);
    expect(n.body).toContain("Dernier ménage enregistré : Ménagère, 15/11 11 h 05 ; dernier départ inconnu (lecture impossible).");
    expect(n.body).not.toContain("depuis le dernier départ");
    const none = arrivalNoticeMessage({ ...base, departure: { kind: "none" } });
    expect(none.priority).toBe(4);
    expect(none.body).not.toContain("depuis le dernier départ");
  });

  it("départ encore à venir avant l'arrivée (rotation) : « départ prévu le », priorité 4", () => {
    const n = arrivalNoticeMessage({ ...base, departure: { kind: "upcoming", day: TODAY } });
    expect(n.body).toContain("départ prévu le 16/11");
    expect(n.body).not.toContain("dernier départ");
    expect(n.priority).toBe(4);
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
});

describe("departureBefore (pure)", () => {
  it("dernier départ déjà passé, parmi les séjours vendus autres que celui-ci", () => {
    const option = { ...previous, id: 7000009, departure: "2026-11-15", status: "black" };
    expect(departureBefore([late, previous, option], late, NOW, TODAY)).toEqual({ kind: "past", day: "2026-11-15" });
    expect(departureBefore([late], late, NOW, TODAY)).toEqual({ kind: "none" });
    expect(departureBefore([late], late, NOW, TODAY, false)).toEqual({ kind: "unreadable" });
  });

  it("départ aujourd'hui : passé après son heure, « prévu » avant ; départ demain avant une arrivée demain : « prévu »", () => {
    const leavingToday = { ...previous, departure: TODAY };
    // 11 h pile (NOW) : départ standard passé.
    expect(departureBefore([late, leavingToday], late, NOW, TODAY)).toEqual({ kind: "past", day: TODAY });
    // Départ convenu à 16 h : pas encore passé à 11 h.
    expect(departureBefore([late, { ...leavingToday, departureHour: 16 }], late, NOW, TODAY)).toEqual({ kind: "upcoming", day: TODAY });
    const arrivingTomorrow = { ...late, arrival: "2026-11-17", departure: "2026-11-19" };
    const leavingTomorrow = { ...previous, departure: "2026-11-17" };
    expect(departureBefore([arrivingTomorrow, previous, leavingTomorrow], arrivingTomorrow, NOW, TODAY)).toEqual({ kind: "upcoming", day: "2026-11-17" });
    // Un départ à venir est connu de la synchro elle-même : il prime même si la lecture de plus a échoué.
    expect(departureBefore([arrivingTomorrow, leavingTomorrow], arrivingTomorrow, NOW, TODAY, false)).toEqual({ kind: "upcoming", day: "2026-11-17" });
  });
});

describe("sendArrivalNotices (anti-doublon, file des renvois)", () => {
  const trigger: NoticeTrigger = { bookingId: 7000001, arrival: TODAY, reason: "late-booking", when: "today" };
  const KEY = "barbusse:arrival-notice:7000001:2026-11-16";
  const RETRY = "barbusse:arrival-notice:retry:7000001:2026-11-16";
  let keys: Map<string, string>;
  let send: ReturnType<typeof vi.fn<NoticeDeps["send"]>>;
  const deps = (over: Partial<NoticeDeps> = {}): NoticeDeps => ({
    key: (t) => `barbusse:arrival-notice:${t.bookingId}:${t.arrival}`,
    retryKey: (t) => `barbusse:arrival-notice:retry:${t.bookingId}:${t.arrival}`,
    set: async (key, value, { nx }) => {
      if (nx && keys.has(key)) return null;
      keys.set(key, value);
      return "OK";
    },
    get: async (key) => keys.get(key) ?? null,
    del: async (key) => keys.delete(key),
    listRetryKeys: async () => [...keys.keys()].filter((k) => k.includes(":retry:")),
    loadPastBookings: async () => [previous],
    loadCleanings: async () => [],
    cleaners: ["Ménagère"],
    send,
    now: NOW,
    today: TODAY,
    night: false,
    ...over,
  });

  beforeEach(() => {
    keys = new Map();
    send = vi.fn<NoticeDeps["send"]>(async () => {});
  });

  it("une seule notification par réservation et jour d'arrivée ; la clé est prise avant l'envoi et confirmée après", async () => {
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(1);
    expect(keys.get(KEY)).toBe("sent");
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][2]).toEqual({ title: "Arrivée imminente" });
  });

  it("Redis injoignable : rien n'est envoyé", async () => {
    expect(await sendArrivalNotices([trigger], [late], deps({ set: async () => Promise.reject(new Error("Redis injoignable")) }))).toBe(0);
    expect(await sendArrivalNotices([trigger], [late], deps({ get: async () => Promise.reject(new Error("Redis injoignable")) }))).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("envoi raté : clé retirée, notification mise en file (texte, priorité), renvoyée au passage suivant", async () => {
    send.mockRejectedValueOnce(new Error("ntfy 502"));
    expect(await sendArrivalNotices([trigger], [late], deps())).toBe(0);
    expect(keys.has(KEY)).toBe(false);
    const queued = JSON.parse(keys.get(RETRY)!);
    expect(queued).toMatchObject({ bookingId: 7000001, arrival: TODAY, title: "Arrivée imminente — Lucie", priority: 4 });
    expect(await retryArrivalNotices(deps())).toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toBe(queued.body);
    expect(keys.has(RETRY)).toBe(false);
    expect(keys.get(KEY)).toBe("sent");
    expect(await retryArrivalNotices(deps())).toBe(0);
  });

  it("file : un nouvel échec la garde en file ; déjà partie entre-temps, elle est retirée sans renvoi", async () => {
    send.mockRejectedValueOnce(new Error("ntfy 502"));
    await sendArrivalNotices([trigger], [late], deps());
    send.mockRejectedValueOnce(new Error("ntfy 502"));
    expect(await retryArrivalNotices(deps())).toBe(0);
    expect(keys.has(RETRY)).toBe(true);
    keys.set(KEY, "sent");
    expect(await retryArrivalNotices(deps())).toBe(0);
    expect(keys.has(RETRY)).toBe(false);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("réservations passées illisibles : « dernier départ inconnu (lecture impossible) », priorité 4", async () => {
    await sendArrivalNotices(
      [trigger],
      [late],
      deps({
        loadPastBookings: async () => Promise.reject(new Error("Beds24 503")),
        loadCleanings: async () => [{ who: "Ménagère", arrival: new Date("2026-11-15T10:05:00Z") }],
      }),
    );
    expect(send.mock.calls[0][0]).toContain("dernier départ inconnu (lecture impossible)");
    expect(send.mock.calls[0][0]).not.toContain("depuis le dernier départ");
    expect(send.mock.calls[0][1].priority).toBe(4);
  });

  it("registre du ménage illisible : la notification part quand même, sans rien affirmer", async () => {
    await sendArrivalNotices([trigger], [late], deps({ loadCleanings: async () => Promise.reject(new Error("hgetall")) }));
    expect(send.mock.calls[0][0]).toContain("Registre du ménage illisible");
    expect(send.mock.calls[0][1].priority).toBe(4);
  });
});

describe("sendNtfy du site", () => {
  it("un journal des notifications qui lève après un envoi réussi n'est pas un échec", async () => {
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    h.recordFails = true;
    try {
      await expect(sendNtfy("corps", { title: "Titre" })).resolves.toBeUndefined();
    } finally {
      h.recordFails = false;
    }
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
  /** Le code de la réservation déjà posé, fenêtre à jour. */
  const posted = (arrival: string, departure: string) => ({
    id: "auth-1",
    type: 13,
    name: "7000001: Lucie Test",
    enabled: true,
    code: 456789,
    allowedFromDate: parisInstant(arrival, 14).toISOString(),
    allowedUntilDate: parisInstant(departure, 14).toISOString(),
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    h.kv.clear();
    h.store.clear();
    h.redisDown = false;
    h.sendNtfy.mockReset();
    h.sendNtfy.mockImplementation(async () => {});
    h.auths = [];
    h.sessions = [{ who: "Ménagère", arrival: new Date("2026-11-15T10:05:00Z") }];
    h.bookings = [beds24(late), beds24(previous)];
    h.createKeypadCode.mockReset();
    h.createKeypadCode.mockImplementation(async () => {});
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
    h.auths = [{ ...posted("2026-11-20", "2026-11-22"), name: "7000001: Lucie" }];
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

  it("ntfy en panne au premier passage : la notification part au passage live suivant, une fois", async () => {
    h.sendNtfy.mockRejectedValueOnce(new Error("ntfy 502"));
    await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(notices()).toHaveLength(1);
    expect(h.kv.has("barbusse:arrival-notice:retry:7000001:2026-11-16")).toBe(true);
    // Le code est posé : le passage suivant n'a plus d'action, seule la file renvoie.
    h.auths = [posted(TODAY, "2026-11-18")];
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(notices()).toHaveLength(2);
    expect(h.kv.has("barbusse:arrival-notice:retry:7000001:2026-11-16")).toBe(false);
    await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(notices()).toHaveLength(2);
  });

  it("séjour non tardif, arrivée demain, code déjà à jour : aucune notification", async () => {
    const tomorrow = { ...late, arrival: "2026-11-17", departure: "2026-11-19", bookingTime: "2026-10-01T08:00:00Z" };
    h.bookings = [beds24(tomorrow), beds24(previous)];
    h.auths = [posted("2026-11-17", "2026-11-19")];
    const report = await runAccessSync({ dryRun: false, trigger: "cron" });
    expect(report.actions.filter((a) => a.bookingId === 7000001)).toEqual([]);
    expect(notices()).toHaveLength(0);
  });

  it("création du code en échec pour une réservation tardive : aucune notification", async () => {
    h.createKeypadCode.mockRejectedValue(new Error("Nuki 502"));
    const report = await runAccessSync({ dryRun: false, trigger: "webhook" });
    expect(report.actions.find((a) => a.kind === "create")).toMatchObject({ ok: false });
    expect(notices()).toHaveLength(0);
  });
});
