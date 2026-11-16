/**
 * Alerte « serrure non verrouillée après le départ » : la règle pure (`departureLockCheck`), puis
 * le passage complet (`runDepartureLockCheck`) avec Nuki, Redis et ntfy simulés. Données
 * inventées : prénoms de ménage fictifs, réservations fictives.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { parisInstant } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  mem: new Map<string, unknown>(),
  sendNtfy: vi.fn(async (body: string, options: unknown) => void [body, options]),
  health: { online: true, lockState: 3 as number | null },
  log: [] as unknown[],
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
  getLockHealth: async () => ({ ...h.health, keypadPaired: true, batteryCritical: false, keypadBatteryCritical: false, batteryChargePercent: 80, motorBlocked: false }),
  listLogSince: async () => h.log,
}));

import { departureLockCheck, type DepartureLockInput } from "@/lib/departure-detection";
import { runDepartureLockCheck } from "@/lib/departure-lock";

const DAY = "2027-01-10";
const at = (hour: number, minute = 0) => new Date(parisInstant(DAY, hour).getTime() + minute * 60_000);
const entry = (date: Date, name: string, action = 1): NukiLogEntry => ({ date: date.toISOString(), action, trigger: 255, state: 0, name });

const base: DepartureLockInput = {
  now: at(11, 0),
  today: DAY,
  departures: [{ bookingId: 1000001, departureHour: 11 }],
  arrivals: [],
  lock: { online: true, lockState: 3 },
  log: [],
  people: ["Ménagère"],
};

describe("departureLockCheck (pure)", () => {
  it("pas de départ, ou départ pas encore passé : rien (et une alerte ouverte se referme sans message)", () => {
    expect(departureLockCheck({ ...base, departures: [] })).toMatchObject({ status: "none", report: "close-silently", alerts: [] });
    expect(departureLockCheck({ ...base, now: at(10, 50) })).toMatchObject({ status: "none", alerts: [] });
  });

  it("verrouillée à 10 h 50 puis 11 h : rien à signaler", () => {
    expect(departureLockCheck({ ...base, now: at(10, 50), lock: { online: true, lockState: 1 } }).alerts).toEqual([]);
    expect(departureLockCheck({ ...base, lock: { online: true, lockState: 1 } })).toMatchObject({ status: "locked", report: "report", alerts: [] });
  });

  it("déverrouillée à 11 h : constat priorité 4, identifiant du jour", () => {
    const r = departureLockCheck(base);
    expect(r.status).toBe("unlocked");
    expect(r.alerts).toEqual([
      expect.objectContaining({ id: `departure-lock:${DAY}`, priority: 4, line: expect.stringContaining("départ de 11 h") }),
    ]);
  });

  it("ouverture par le code du ménage à 11 h 05 : maison de nouveau occupée, pas d'alerte", () => {
    const r = departureLockCheck({ ...base, now: at(11, 15), log: [entry(at(11, 5), "# Ménagère")] });
    expect(r).toMatchObject({ status: "reoccupied", report: "close-silently", alerts: [] });
  });

  it("une ouverture du ménage **avant** l'heure de départ ne compte pas", () => {
    expect(departureLockCheck({ ...base, now: at(11, 15), log: [entry(at(10, 30), "# Ménagère")] }).status).toBe("unlocked");
  });

  it("rotation : le code des voyageurs suivants qui ouvre vaut aussi maison occupée", () => {
    const r = departureLockCheck({ ...base, now: at(17, 15), arrivals: [{ bookingId: 1000002 }], log: [entry(at(17, 2), "1000002: Test")] });
    expect(r.status).toBe("reoccupied");
    // Le code du séjour qui part ne compte pas : il est revenu chercher un sac, la porte reste à fermer.
    expect(departureLockCheck({ ...base, now: at(11, 30), log: [entry(at(11, 20), "1000001: Test")] }).status).toBe("unlocked");
  });

  it("départ convenu 16 h : rien à 15 h 45, alerte à 16 h", () => {
    const late = { ...base, departures: [{ bookingId: 1000001, departureHour: 16 }] };
    expect(departureLockCheck({ ...late, now: at(15, 45) }).status).toBe("none");
    expect(departureLockCheck({ ...late, now: at(16, 0) }).alerts[0].line).toContain("départ de 16 h");
  });

  it("serrure hors ligne, illisible, ou journal illisible : rien n'est conclu, l'état ne bouge pas", () => {
    expect(departureLockCheck({ ...base, lock: { online: false, lockState: 3 } })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...base, lock: null })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...base, log: null })).toMatchObject({ status: "unreadable", report: "skip" });
  });
});

describe("runDepartureLockCheck (passage complet, Nuki et ntfy simulés)", () => {
  const bookings = [{ id: 1000001, arrival: "2027-01-08", departure: DAY, status: "confirmed" }];

  beforeEach(() => {
    h.mem.clear();
    h.sendNtfy.mockClear();
    h.health = { online: true, lockState: 3 };
    h.log = [];
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "1";
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    process.env.TRACKED_PEOPLE = "Ménagère:ménage";
  });

  it("déverrouillée : alerte au 2e relevé seulement (11 h 15), jamais répétée, « verrouillée » en priorité 1", async () => {
    await runDepartureLockCheck(bookings, DAY, at(11, 0));
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await runDepartureLockCheck(bookings, DAY, at(11, 15));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0]).toEqual([
      expect.stringContaining("n'est pas verrouillée"),
      expect.objectContaining({ title: "[Serrure] Serrure non verrouillée — départ de 11 h dépassé", priority: 4 }),
    ]);
    await runDepartureLockCheck(bookings, DAY, at(11, 30));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.health = { online: true, lockState: 1 };
    await runDepartureLockCheck(bookings, DAY, at(11, 45));
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    expect(h.sendNtfy.mock.calls[1][1]).toMatchObject({ title: "[Serrure] Serrure verrouillée", priority: 1 });
  });

  it("le ménage ouvre après l'alerte : elle se referme sans message", async () => {
    await runDepartureLockCheck(bookings, DAY, at(11, 0));
    await runDepartureLockCheck(bookings, DAY, at(11, 15));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.log = [entry(at(11, 20), "# Ménagère")];
    await runDepartureLockCheck(bookings, DAY, at(11, 30));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.mem.get("barbusse:alert:departure-lock") as { open: boolean }).open).toBe(false);
  });

  it("serrure hors ligne : aucune alerte", async () => {
    h.health = { online: false, lockState: null };
    for (const m of [0, 15, 30]) await runDepartureLockCheck(bookings, DAY, at(11, m));
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("départ standard : Nuki n'est pas interrogé avant 11 h", async () => {
    const r = await runDepartureLockCheck(bookings, DAY, at(10, 45));
    expect(r.status).toBe("none");
    expect(h.mem.size).toBe(0);
  });

  it("départ convenu (horaires joints) : l'heure suit", async () => {
    const late = [{ ...bookings[0], departureHour: 16 }];
    expect((await runDepartureLockCheck(late, DAY, at(11, 15))).status).toBe("none");
    expect((await runDepartureLockCheck(late, DAY, at(16, 0))).status).toBe("unlocked");
  });
});
