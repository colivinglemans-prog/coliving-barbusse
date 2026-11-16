/**
 * Alerte « serrure non verrouillée après le départ » : la règle pure (`departureLockCheck`), puis
 * le passage complet (`runDepartureLockCheck`, et sa variante du mode été) avec Nuki, le garage,
 * Redis et ntfy simulés. Données inventées : prénoms de ménage fictifs, réservations fictives.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { parisInstant } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  mem: new Map<string, unknown>(),
  sendNtfy: vi.fn(async (body: string, options: unknown) => void [body, options]),
  health: { online: true, lockState: 3 as number | null },
  log: [] as unknown[],
  garage: [] as Array<{ source: string; at: Date; who: string }>,
  nukiCalls: 0,
  hang: false,
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => {
    throw new Error("pas de Redis dans ce test");
  },
  getJson: async (k: string) => (h.mem.has(k) ? JSON.parse(JSON.stringify(h.mem.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.mem.set(k, JSON.parse(JSON.stringify(v)));
  },
}));
vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));
vi.mock("@sejour/socle/lib/nuki", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sejour/socle/lib/nuki")>()),
  getLockHealth: async () => {
    h.nukiCalls++;
    if (h.hang) await new Promise(() => {});
    return { ...h.health, keypadPaired: true, batteryCritical: false, keypadBatteryCritical: false, batteryChargePercent: 80, motorBlocked: false };
  },
  listLogSince: async () => h.log,
}));
vi.mock("@/lib/cleaning/sources", () => ({ garageArrivals: async () => h.garage }));

import {
  DEPARTURE_LOCK_GRACE_MINUTES,
  departureLockCheck,
  isCleaningCode,
  type DepartureLockInput,
} from "@/lib/departure-detection";
import { runDepartureLockCheck, runDepartureLockCheckSummer } from "@/lib/departure-lock";

const DAY = "2027-01-10";
const at = (hour: number, minute = 0) => new Date(parisInstant(DAY, hour).getTime() + minute * 60_000);
const entry = (date: Date, name: string, action = 1): NukiLogEntry => ({ date: date.toISOString(), action, trigger: 255, state: 0, name });

const base: DepartureLockInput = {
  now: at(11, 30),
  today: DAY,
  departures: [{ bookingId: 1000001, departureHour: 11 }],
  arrivals: [],
  lock: { online: true, lockState: 3 },
  log: [],
  people: ["Ménagère"],
};

describe("departureLockCheck (pure)", () => {
  it("délai de grâce de 30 min : rien avant 11 h 30, constat à 11 h 30", () => {
    expect(DEPARTURE_LOCK_GRACE_MINUTES).toBe(30);
    expect(departureLockCheck({ ...base, departures: [] })).toMatchObject({ status: "none", report: "close-silently", alerts: [] });
    expect(departureLockCheck({ ...base, now: at(11, 0) }).status).toBe("none");
    expect(departureLockCheck({ ...base, now: at(11, 29) }).status).toBe("none");
    expect(departureLockCheck({ ...base, now: at(11, 30) }).status).toBe("unlocked");
  });

  it("verrouillée : rien à signaler", () => {
    expect(departureLockCheck({ ...base, lock: { online: true, lockState: 1 } })).toMatchObject({ status: "locked", report: "report", alerts: [] });
  });

  it("déverrouillée : constat priorité 4, identifiant du jour", () => {
    const r = departureLockCheck(base);
    expect(r.status).toBe("unlocked");
    expect(r.alerts).toEqual([
      expect.objectContaining({ id: `departure-lock:${DAY}`, priority: 4, line: expect.stringContaining("départ de 11 h") }),
    ]);
  });

  it("ménage entré à 11 h 05, ou dès 9 h 30 (avant l'heure de départ) : pas d'alerte", () => {
    expect(departureLockCheck({ ...base, log: [entry(at(11, 5), "# Ménagère")] })).toMatchObject({ status: "reoccupied", report: "close-silently" });
    expect(departureLockCheck({ ...base, log: [entry(at(9, 30), "# Ménagère")] }).status).toBe("reoccupied");
    // Avant D − 2 h : c'était un autre passage.
    expect(departureLockCheck({ ...base, log: [entry(at(8, 30), "# Ménagère")] }).status).toBe("unlocked");
  });

  it("entrée du ménage par le garage (Intratone) : maison réoccupée", () => {
    expect(departureLockCheck({ ...base, garage: [{ who: "Ménagère", at: at(10, 45) }] }).status).toBe("reoccupied");
    expect(departureLockCheck({ ...base, garage: [{ who: "Inconnu", at: at(10, 45) }] }).status).toBe("unlocked");
  });

  it("un voyageur prénommé comme la personne du ménage n'est pas le ménage", () => {
    expect(isCleaningCode("# Ménagère", ["Ménagère"])).toBe(true);
    expect(isCleaningCode("Ménagère", ["Ménagère"])).toBe(true);
    expect(isCleaningCode("1000009: Ménagère", ["Ménagère"])).toBe(false);
    expect(departureLockCheck({ ...base, log: [entry(at(11, 10), "1000009: Ménagère")] }).status).toBe("unlocked");
  });

  it("rotation : le code des voyageurs suivants qui ouvre vaut aussi maison occupée", () => {
    const r = departureLockCheck({ ...base, now: at(17, 15), arrivals: [{ bookingId: 1000002 }], log: [entry(at(17, 2), "1000002: Test")] });
    expect(r.status).toBe("reoccupied");
    // Le code du séjour qui part ne compte pas : il est revenu chercher un sac, la porte reste à fermer.
    expect(departureLockCheck({ ...base, now: at(11, 45), log: [entry(at(11, 20), "1000001: Test")] }).status).toBe("unlocked");
  });

  it("départ convenu 16 h : rien à 16 h 15, constat à 16 h 30", () => {
    const late = { ...base, departures: [{ bookingId: 1000001, departureHour: 16 }] };
    expect(departureLockCheck({ ...late, now: at(16, 15) }).status).toBe("none");
    expect(departureLockCheck({ ...late, now: at(16, 30) }).alerts[0].line).toContain("départ de 16 h");
  });

  it("serrure hors ligne, illisible, ou journal illisible : rien n'est conclu, l'état ne bouge pas", () => {
    expect(departureLockCheck({ ...base, lock: { online: false, lockState: 3 } })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...base, lock: null })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...base, log: null })).toMatchObject({ status: "unreadable", report: "skip" });
  });
});

describe("runDepartureLockCheck (passage complet)", () => {
  const bookings = [{ id: 1000001, arrival: "2027-01-08", departure: DAY, status: "confirmed" }];

  beforeEach(() => {
    h.mem.clear();
    h.sendNtfy.mockClear();
    h.health = { online: true, lockState: 3 };
    h.log = [];
    h.garage = [];
    h.nukiCalls = 0;
    h.hang = false;
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "1";
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    process.env.TRACKED_PEOPLE = "Ménagère:ménage";
  });

  it("déverrouillée : constat à 11 h 30, alerte à 11 h 45, jamais répétée, « verrouillée » en priorité 1, puis plus de relevé", async () => {
    await runDepartureLockCheck(bookings, DAY, at(11, 15));
    expect(h.nukiCalls).toBe(0);
    await runDepartureLockCheck(bookings, DAY, at(11, 30));
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await runDepartureLockCheck(bookings, DAY, at(11, 45));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0]).toEqual([
      expect.stringContaining("n'est pas verrouillée"),
      expect.objectContaining({ title: "[Serrure] Serrure non verrouillée — départ de 11 h dépassé", priority: 4 }),
    ]);
    await runDepartureLockCheck(bookings, DAY, at(12, 0));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.health = { online: true, lockState: 1 };
    await runDepartureLockCheck(bookings, DAY, at(12, 15));
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    expect(h.sendNtfy.mock.calls[1][1]).toMatchObject({ title: "[Serrure] Serrure verrouillée", priority: 1 });
    // Journée close : plus d'appel à Nuki.
    const calls = h.nukiCalls;
    expect((await runDepartureLockCheck(bookings, DAY, at(12, 30))).status).toBe("locked");
    expect(h.nukiCalls).toBe(calls);
  });

  it("le ménage entre après l'alerte : elle se referme sans message, et la journée est close", async () => {
    await runDepartureLockCheck(bookings, DAY, at(11, 30));
    await runDepartureLockCheck(bookings, DAY, at(11, 45));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.log = [entry(at(11, 50), "# Ménagère")];
    await runDepartureLockCheck(bookings, DAY, at(12, 0));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.mem.get("barbusse:alert:departure-lock") as { open: boolean }).open).toBe(false);
    expect(h.mem.get(`barbusse:departure-lock:${DAY}`)).toBe("reoccupied");
  });

  it("serrure hors ligne : aucune alerte", async () => {
    h.health = { online: false, lockState: null };
    for (const m of [30, 45, 60]) await runDepartureLockCheck(bookings, DAY, at(11, m));
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("Nuki qui ne répond pas : relevé abandonné au bout de 10 s, rien n'est conclu", async () => {
    vi.useFakeTimers();
    try {
      h.hang = true;
      const p = runDepartureLockCheck(bookings, DAY, at(11, 30));
      await vi.advanceTimersByTimeAsync(10_000);
      expect((await p).status).toBe("unreadable");
    } finally {
      vi.useRealTimers();
    }
  });

  it("départ convenu (horaires joints) : l'heure suit", async () => {
    const late = [{ ...bookings[0], departureHour: 16 }];
    expect((await runDepartureLockCheck(late, DAY, at(11, 45))).status).toBe("none");
    expect((await runDepartureLockCheck(late, DAY, at(16, 30))).status).toBe("unlocked");
  });

  it("mode été : aucun appel avant 11 h 30, Beds24 lu une fois par jour, rien sans départ", async () => {
    const load = vi.fn(async () => bookings);
    expect(await runDepartureLockCheckSummer(DAY, 11 * 60 + 15, load, at(11, 15))).toBeNull();
    expect(load).not.toHaveBeenCalled();
    await runDepartureLockCheckSummer(DAY, 11 * 60 + 30, load, at(11, 30));
    await runDepartureLockCheckSummer(DAY, 11 * 60 + 45, load, at(11, 45));
    expect(load).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);

    h.mem.clear();
    const none = vi.fn(async () => [{ id: 1000005, arrival: "2027-01-01", departure: "2027-01-20", status: "confirmed" }]);
    expect((await runDepartureLockCheckSummer(DAY, 12 * 60, none, at(12, 0)))?.status).toBe("none");
    await runDepartureLockCheckSummer(DAY, 12 * 60 + 15, none, at(12, 15));
    expect(none).toHaveBeenCalledTimes(1);
    expect(h.nukiCalls).toBe(2);
  });
});
