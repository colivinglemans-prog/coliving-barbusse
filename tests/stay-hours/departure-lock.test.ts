/**
 * Alerte « serrure non verrouillée après le départ » : la règle pure (`departureLockCheck`), puis
 * le passage complet (`runDepartureLockCheck`, et sa variante du mode été) avec Nuki, le garage,
 * Redis et ntfy simulés. Surveillance jusqu'à E, la fin de validité réelle du code des partants
 * (complément du 2026-11-16). Horloges injectées ; données inventées : prénoms fictifs,
 * réservations fictives.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { parisInstant } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  mem: new Map<string, unknown>(),
  sendNtfy: vi.fn(async (body: string, options: unknown) => void [body, options]),
  health: { online: true, lockState: 3 as number | null },
  log: [] as unknown[],
  garage: [] as Array<{ at: Date; who: string }>,
  garageMode: "ok" as "ok" | "down" | "hang",
  nukiCalls: 0,
  logCalls: 0,
  garageCalls: 0,
  hang: false,
  logDown: false,
  /** Redis configuré : la table des horaires convenus est relue (`hours`, ou panne). */
  redis: false,
  hours: {} as Record<string, string>,
  hoursDown: false,
  getJsonDown: false,
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => h.redis,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => ({
    hgetall: async () => {
      if (h.hoursDown) throw new Error("Redis injoignable");
      return h.hours;
    },
  }),
  getJson: async (k: string) => {
    if (h.getJsonDown) throw new Error("Redis injoignable");
    return h.mem.has(k) ? JSON.parse(JSON.stringify(h.mem.get(k))) : null;
  },
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
  listLogSince: async () => {
    h.logCalls++;
    if (h.logDown) throw new Error("journal Nuki 503");
    return h.log;
  },
}));
vi.mock("@/lib/cleaning/sources", () => ({
  garageOpenings: async () => {
    h.garageCalls++;
    if (h.garageMode === "down") throw new Error("Intratone 503");
    if (h.garageMode === "hang") await new Promise(() => {});
    return h.garage;
  },
}));

import {
  DEPARTURE_LOCK_GRACE_MINUTES,
  departureLockCheck,
  departureLockTitle,
  isCleaningCode,
  isPersonalCode,
  type DepartureLockInput,
} from "@/lib/departure-detection";
import { departureCodeEnd, runDepartureLockCheck, runDepartureLockCheckSummer, type DepartureStay } from "@/lib/departure-lock";

const DAY = "2027-01-10";
const at = (hour: number, minute = 0) => new Date(parisInstant(DAY, hour).getTime() + minute * 60_000);
const entry = (date: Date, name: string, action = 1, trigger = 255): NukiLogEntry => ({ date: date.toISOString(), action, trigger, state: 0, name });
const LEAVING = "1000001: Test";

const base: DepartureLockInput = {
  now: at(11, 30),
  today: DAY,
  departures: [{ bookingId: 1000001, departureHour: 11 }],
  arrivals: [],
  lock: { online: true, lockState: 3 },
  log: [],
  people: ["Ménagère"],
};
/** Standard : le code des partants ouvre jusqu'à 14 h. */
const standard = { ...base, codeEnd: at(14) };

describe("departureLockCheck (pure)", () => {
  it("délai de grâce de 30 min : rien avant 11 h 30, constat à 11 h 30", () => {
    expect(DEPARTURE_LOCK_GRACE_MINUTES).toBe(30);
    expect(departureLockCheck({ ...base, departures: [] })).toMatchObject({ status: "none", report: "close-silently", alerts: [] });
    expect(departureLockCheck({ ...base, now: at(11, 0) }).status).toBe("none");
    expect(departureLockCheck({ ...base, now: at(11, 29) }).status).toBe("none");
    expect(departureLockCheck({ ...base, now: at(11, 30) }).status).toBe("unlocked");
  });

  it("verrouillée avant E : rien à signaler, mais la journée n'est pas close ; après E, elle l'est", () => {
    const locked = { ...standard, lock: { online: true, lockState: 1 }, log: undefined };
    expect(departureLockCheck(locked)).toMatchObject({ status: "locked", report: "report", alerts: [], closesDay: false });
    expect(departureLockCheck({ ...locked, now: at(14, 15) })).toMatchObject({ status: "locked", closesDay: true });
    // Sans E (ou E ≤ D + 30 min) : un seul relevé, la règle d'avant.
    expect(departureLockCheck({ ...base, lock: { online: true, lockState: 1 } })).toMatchObject({ status: "locked", closesDay: true });
  });

  it("déverrouillée : constat priorité 4, identifiant du jour", () => {
    const r = departureLockCheck(standard);
    expect(r.status).toBe("unlocked");
    expect(r.guestReturned).toBe(false);
    expect(r.alerts).toEqual([
      expect.objectContaining({ id: `departure-lock:${DAY}`, priority: 4, line: expect.stringContaining("départ de 11 h") }),
    ]);
  });

  it("ménage entré à 11 h 05, ou dès 9 h 30 (avant l'heure de départ) : prise en main, journée close", () => {
    expect(departureLockCheck({ ...standard, log: [entry(at(11, 5), "# Ménagère")] })).toMatchObject({
      status: "reoccupied",
      report: "close-silently",
      closesDay: true,
    });
    expect(departureLockCheck({ ...standard, log: [entry(at(9, 30), "# Ménagère")] }).status).toBe("reoccupied");
    // Avant D − 2 h : c'était un autre passage.
    expect(departureLockCheck({ ...standard, log: [entry(at(8, 30), "# Ménagère")] }).status).toBe("unlocked");
  });

  it("code personnel : protégé (« # … ») ou personne suivie, jamais un code géré ni un code voyageur saisi à la main", () => {
    expect(isPersonalCode("# Hôte", [])).toBe(true);
    expect(isPersonalCode("Ménagère", ["Ménagère"])).toBe(true);
    expect(isPersonalCode("Ami de passage", ["Ménagère"])).toBe(false);
    expect(isPersonalCode("1000009: # Hôte", [])).toBe(false);
    expect(isPersonalCode("", ["Ménagère"])).toBe(false);
    expect(isPersonalCode(null, ["Ménagère"])).toBe(false);
    // Code protégé de l'hôte : prise en main. Code non géré, sans « # », hors TRACKED_PEOPLE : non.
    expect(departureLockCheck({ ...standard, log: [entry(at(11, 10), "# Hôte")] }).status).toBe("reoccupied");
    expect(departureLockCheck({ ...standard, log: [entry(at(11, 10), "Ami de passage")] }).status).toBe("unlocked");
  });

  it("un voyageur prénommé comme la personne du ménage n'est pas le ménage", () => {
    expect(isCleaningCode("# Ménagère", ["Ménagère"])).toBe(true);
    expect(isCleaningCode("Ménagère", ["Ménagère"])).toBe(true);
    expect(isCleaningCode("1000009: Ménagère", ["Ménagère"])).toBe(false);
    expect(departureLockCheck({ ...standard, log: [entry(at(11, 10), "1000009: Ménagère")] }).status).toBe("unlocked");
  });

  it("garage : tout code nommé est une prise en main, même hors TRACKED_PEOPLE ; un code sans nom ou géré, non", () => {
    expect(departureLockCheck({ ...standard, garage: [{ who: "Ménagère", at: at(10, 45) }] }).status).toBe("reoccupied");
    expect(departureLockCheck({ ...standard, garage: [{ who: "Voisin", at: at(10, 45) }] }).status).toBe("reoccupied");
    expect(departureLockCheck({ ...standard, garage: [{ who: "", at: at(10, 45) }] }).status).toBe("unlocked");
    expect(departureLockCheck({ ...standard, garage: [{ who: "1000001: Motos", at: at(10, 45) }] }).status).toBe("unlocked");
    // Garage non lu : on conclut quand même sur la serrure.
    expect(departureLockCheck({ ...standard, garage: null }).status).toBe("unlocked");
  });

  it("l'application Nuki n'est pas une prise en main ; l'alerte le précise", () => {
    const r = departureLockCheck({ ...standard, now: at(11, 45), log: [entry(at(11, 40), "Hôte (application)", 1, 0)] });
    expect(r.status).toBe("unlocked");
    expect(r.alerts[0].line).toContain("Ouverture par l'application à 11:40");
  });

  it("prise en main par l'hôte à 9 h 10, puis retour d'un voyageur à 12 h 10 : alerte, intitulée « retour »", () => {
    const r = departureLockCheck({
      ...standard,
      now: at(12, 30),
      log: [entry(at(9, 10), "# Hôte"), entry(at(12, 10), LEAVING)],
    });
    expect(r).toMatchObject({ status: "unlocked", guestReturned: true });
    expect(r.alerts[0].line).toContain("revenu avec son code à 12:10");
    expect(departureLockTitle(r.departureHour, true)).toBe("Serrure non verrouillée après le retour d'un voyageur");
  });

  it("ouverture par les partants à 10 h (avant D) : pas un retour ; le ménage d'avant ne compte plus", () => {
    const r = departureLockCheck({ ...standard, log: [entry(at(9, 30), "# Ménagère"), entry(at(10, 0), LEAVING)] });
    expect(r).toMatchObject({ status: "unlocked", guestReturned: false });
    expect(departureLockTitle(11, false)).toBe("Serrure non verrouillée — départ de 11 h dépassé");
    // Le ménage entre après eux : prise en main.
    expect(departureLockCheck({ ...standard, log: [entry(at(10, 0), LEAVING), entry(at(10, 30), "# Ménagère")] }).status).toBe("reoccupied");
  });

  it("rotation : le code des voyageurs suivants qui ouvre vaut aussi prise en main", () => {
    const r = departureLockCheck({ ...base, now: at(17, 15), arrivals: [{ bookingId: 1000002 }], log: [entry(at(17, 2), "1000002: Test")] });
    expect(r.status).toBe("reoccupied");
    // Le code du séjour qui part ne compte pas : il est revenu chercher un sac, la porte reste à fermer.
    expect(departureLockCheck({ ...standard, now: at(11, 45), log: [entry(at(11, 20), LEAVING)] }).status).toBe("unlocked");
  });

  it("départ convenu 16 h : rien à 16 h 15, constat à 16 h 30", () => {
    const late = { ...base, departures: [{ bookingId: 1000001, departureHour: 16 }], codeEnd: at(17) };
    expect(departureLockCheck({ ...late, now: at(16, 15) }).status).toBe("none");
    expect(departureLockCheck({ ...late, now: at(16, 30) }).alerts[0].line).toContain("départ de 16 h");
  });

  it("serrure hors ligne, illisible, ou journal illisible : rien n'est conclu, l'état ne bouge pas", () => {
    expect(departureLockCheck({ ...standard, lock: { online: false, lockState: 3 } })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...standard, lock: null })).toMatchObject({ status: "unreadable", report: "skip" });
    expect(departureLockCheck({ ...standard, log: null })).toMatchObject({ status: "unreadable", report: "skip" });
  });

  it("TRACKED_PEOPLE : correspondance en mot entier, sans casse ni accents ; le préfixe # suffit", () => {
    expect(isCleaningCode("Frederic", ["Eric"])).toBe(false);
    expect(isCleaningCode("Frédéric", ["Éric"])).toBe(false);
    expect(isCleaningCode("# éric", ["Eric"])).toBe(true);
    expect(isCleaningCode("Code ERIC-2", ["Éric"])).toBe(true);
    expect(isPersonalCode("Frederic", ["Eric"])).toBe(false);
    expect(isPersonalCode("# Frederic", ["Eric"])).toBe(true);
    expect(departureLockCheck({ ...standard, people: ["Eric"], log: [entry(at(11, 10), "Frederic")] }).status).toBe("unlocked");
  });

  it("serrure en ligne mais état nul ou de passage (2, 4, 7, 255) : rien n'est conclu", () => {
    for (const lockState of [null, 2, 4, 7, 255]) {
      expect(departureLockCheck({ ...standard, lock: { online: true, lockState } })).toMatchObject({ status: "unreadable", report: "skip", alerts: [] });
    }
  });

  it("journal illisible, porte non verrouillée : constat distinct, priorité 3", () => {
    const r = departureLockCheck({ ...standard, log: null });
    expect(r).toMatchObject({ status: "unreadable", report: "skip", alerts: [] });
    expect(r.journalAlerts).toEqual([
      expect.objectContaining({
        id: `departure-lock-log:${DAY}`,
        priority: 3,
        line: expect.stringContaining("impossible de savoir si le ménage est entré"),
      }),
    ]);
  });

  it("E ≤ D + 30 min (rotation) et porte déverrouillée : constat dès le premier relevé, journée non close", () => {
    const r = departureLockCheck({ ...base, departures: [{ bookingId: 1000001, departureHour: 16 }], codeEnd: at(14), now: at(16, 30) });
    expect(r.status).toBe("unlocked");
    expect(r.closesDay).toBeUndefined();
    expect(r.alerts).toHaveLength(1);
  });

  it("plusieurs départs : D est le plus tardif, et un retour se compte après lui", () => {
    const two = {
      ...standard,
      departures: [
        { bookingId: 1000001, departureHour: 11 },
        { bookingId: 1000003, departureHour: 16 },
      ],
      codeEnd: at(17),
    };
    // 12 h 10 : un partant ouvre, mais avant D (16 h) : pas un retour.
    expect(departureLockCheck({ ...two, now: at(16, 30), log: [entry(at(12, 10), LEAVING)] }).guestReturned).toBe(false);
    const r = departureLockCheck({ ...two, now: at(16, 45), log: [entry(at(16, 40), "1000003: Autre")] });
    expect(r).toMatchObject({ status: "unlocked", guestReturned: true });
    expect(r.alerts[0].line).toContain("départ de 16 h");
  });
});

describe("departureCodeEnd (la formule de la synchro)", () => {
  const leaving: DepartureStay = { id: 1000001, arrival: "2027-01-08", departure: DAY, status: "confirmed" };
  const coming: DepartureStay = { id: 1000002, arrival: DAY, departure: "2027-01-12", status: "confirmed" };

  it("standard : 14 h ; départ convenu 16 h : 17 h ; plusieurs départs : le plus tardif", () => {
    expect(departureCodeEnd([leaving], [1000001])).toEqual(at(14));
    expect(departureCodeEnd([{ ...leaving, departureHour: 16 }], [1000001])).toEqual(at(17));
    const other = { ...leaving, id: 1000003 };
    expect(departureCodeEnd([leaving, { ...other, departureHour: 18 }], [1000001, 1000003])).toEqual(at(19));
  });

  it("rotation, départ convenu 16 h et arrivée standard : E = 14 h, comme le code borné", () => {
    expect(departureCodeEnd([{ ...leaving, departureHour: 16 }, coming], [1000001])).toEqual(at(14));
    // Arrivée convenue à 15 h : le code des arrivants ouvre à 14 h (min(14, 15 − 1)), E = 14 h aussi.
    expect(departureCodeEnd([{ ...leaving, departureHour: 16 }, { ...coming, arrivalHour: 15 }], [1000001])).toEqual(at(14));
    // Une option qui arrive le même jour ne borne rien.
    expect(departureCodeEnd([{ ...leaving, departureHour: 16 }, { ...coming, status: "black" }], [1000001])).toEqual(at(17));
  });
});

describe("runDepartureLockCheck (passage complet)", () => {
  const bookings: DepartureStay[] = [{ id: 1000001, arrival: "2027-01-08", departure: DAY, status: "confirmed" }];
  const run = (minutesAfterMidnight: [number, number], list: readonly DepartureStay[] = bookings) =>
    runDepartureLockCheck(list, DAY, at(...minutesAfterMidnight));
  const titleOf = (i: number) => (h.sendNtfy.mock.calls[i][1] as { title: string }).title;

  beforeEach(() => {
    h.mem.clear();
    h.sendNtfy.mockClear();
    h.health = { online: true, lockState: 3 };
    h.log = [];
    h.garage = [];
    h.garageMode = "ok";
    h.nukiCalls = 0;
    h.logCalls = 0;
    h.garageCalls = 0;
    h.hang = false;
    h.logDown = false;
    h.redis = false;
    h.hours = {};
    h.hoursDown = false;
    h.getJsonDown = false;
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "1";
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    process.env.TRACKED_PEOPLE = "Ménagère:ménage";
  });

  it("déverrouillée : constat à 11 h 30, alerte à 11 h 45, jamais répétée, « verrouillée » en priorité 1, surveillance jusqu'à 14 h", async () => {
    await run([11, 15]);
    expect(h.nukiCalls).toBe(0);
    await run([11, 30]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0]).toEqual([
      expect.stringContaining("n'est pas verrouillée"),
      expect.objectContaining({ title: "[Serrure] Serrure non verrouillée — départ de 11 h dépassé", priority: 4 }),
    ]);
    await run([12, 0]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.health = { online: true, lockState: 1 };
    const logCalls = h.logCalls;
    expect((await run([12, 15])).status).toBe("locked");
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    expect(h.sendNtfy.mock.calls[1][1]).toMatchObject({ title: "[Serrure] Serrure verrouillée", priority: 1 });
    // Porte verrouillée : ni journal ni garage.
    expect(h.logCalls).toBe(logCalls);
    // Avant 14 h, la journée n'est pas close : la serrure est relue à chaque relevé.
    expect(h.mem.has(`barbusse:departure-lock:${DAY}`)).toBe(false);
    const calls = h.nukiCalls;
    await run([12, 30]);
    expect(h.nukiCalls).toBe(calls + 1);
    // 14 h passées, porte verrouillée : journée close, plus d'appel à Nuki.
    expect(await run([14, 0])).toMatchObject({ status: "locked", closesDay: true });
    expect(h.mem.get(`barbusse:departure-lock:${DAY}`)).toBe("locked");
    const closed = h.nukiCalls;
    expect((await run([14, 15])).status).toBe("locked");
    expect(h.nukiCalls).toBe(closed);
  });

  it("verrouillée à 11 h 30 : pas de clôture, le relevé de 11 h 45 relit la serrure ; verrouillée à 14 h 15 : journée close", async () => {
    h.health = { online: true, lockState: 1 };
    expect(await run([11, 30])).toMatchObject({ status: "locked", closesDay: false });
    expect(h.mem.has(`barbusse:departure-lock:${DAY}`)).toBe(false);
    await run([11, 45]);
    expect(h.nukiCalls).toBe(2);
    expect(await run([14, 15])).toMatchObject({ status: "locked", closesDay: true });
    expect(h.mem.get(`barbusse:departure-lock:${DAY}`)).toBe("locked");
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("retour d'un voyageur à 12 h 10, porte ouverte à 12 h 15 et 12 h 30 : alerte au 2e relevé, intitulée « retour »", async () => {
    h.health = { online: true, lockState: 1 };
    for (const t of [[11, 30], [11, 45], [12, 0]] as const) await run([t[0], t[1]]);
    h.health = { online: true, lockState: 3 };
    h.log = [entry(at(12, 10), LEAVING)];
    await run([12, 15]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await run([12, 30]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(titleOf(0)).toBe("[Serrure] Serrure non verrouillée après le retour d'un voyageur");
  });

  it("prise en main par l'hôte à 9 h 10, puis retour d'un voyageur à 12 h 10 : alerte", async () => {
    h.log = [entry(at(9, 10), "# Hôte"), entry(at(12, 10), LEAVING)];
    await run([12, 15]);
    await run([12, 30]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(titleOf(0)).toContain("retour d'un voyageur");
  });

  it("rétabli puis nouvelle ouverture le même jour : l'alerte rouvre", async () => {
    await run([11, 30]);
    await run([11, 45]);
    h.health = { online: true, lockState: 1 };
    await run([12, 0]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(2);
    h.health = { online: true, lockState: 3 };
    h.log = [entry(at(12, 5), LEAVING)];
    await run([12, 15]);
    await run([12, 30]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(3);
    expect(h.sendNtfy.mock.calls[2][1]).toMatchObject({ priority: 4 });
    expect(titleOf(2)).toContain("retour d'un voyageur");
  });

  it("le ménage entre après l'alerte : elle se referme sans message, et la journée est close", async () => {
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    h.log = [entry(at(11, 50), "# Ménagère")];
    await run([12, 0]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.mem.get("barbusse:alert:departure-lock") as { open: boolean }).open).toBe(false);
    expect(h.mem.get(`barbusse:departure-lock:${DAY}`)).toBe("reoccupied");
  });

  it("ménage entré à 11 h, porte déverrouillée jusqu'à 14 h : aucune alerte, et le garage n'est pas lu", async () => {
    h.log = [entry(at(11, 0), "# Ménagère")];
    expect((await run([11, 30])).status).toBe("reoccupied");
    for (let m = 45; m <= 180; m += 15) await run([11 + Math.floor(m / 60), m % 60]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    expect(h.nukiCalls).toBe(1);
    expect(h.garageCalls).toBe(0);
  });

  it("garage en panne ou lent : la serrure est relevée quand même, et l'alerte part", async () => {
    h.garageMode = "down";
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);

    h.mem.clear();
    h.sendNtfy.mockClear();
    h.garageMode = "hang";
    vi.useFakeTimers();
    try {
      for (const m of [30, 45]) {
        const p = run([11, m]);
        await vi.advanceTimersByTimeAsync(8_000);
        expect((await p).status).toBe("unlocked");
      }
    } finally {
      vi.useRealTimers();
    }
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("entrée au garage par un code nommé absent de TRACKED_PEOPLE : prise en main", async () => {
    h.garage = [{ who: "Voisin", at: at(11, 20) }];
    expect((await run([11, 30])).status).toBe("reoccupied");
    expect(h.mem.get(`barbusse:departure-lock:${DAY}`)).toBe("reoccupied");
  });

  it("ouverture par l'application Nuki : pas une prise en main", async () => {
    h.log = [entry(at(11, 20), "Hôte (application)", 1, 0)];
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][0]).toContain("Ouverture par l'application à 11:20");
  });

  it("serrure hors ligne : aucune alerte", async () => {
    h.health = { online: false, lockState: null };
    for (const m of [30, 45, 59]) await run([11, m]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("Nuki qui ne répond pas : relevé abandonné au bout de 10 s, rien n'est conclu", async () => {
    vi.useFakeTimers();
    try {
      h.hang = true;
      const p = run([11, 30]);
      await vi.advanceTimersByTimeAsync(10_000);
      expect((await p).status).toBe("unreadable");
    } finally {
      vi.useRealTimers();
    }
  });

  it("départ convenu 16 h : l'heure suit, surveillance jusqu'à 17 h", async () => {
    const late = [{ ...bookings[0], departureHour: 16 }];
    expect((await run([11, 45], late)).status).toBe("none");
    expect((await run([16, 30], late)).status).toBe("unlocked");
    h.health = { online: true, lockState: 1 };
    expect(await run([16, 45], late)).toMatchObject({ status: "locked", closesDay: false });
    expect(await run([17, 0], late)).toMatchObject({ status: "locked", closesDay: true });
  });

  it("rotation, départ convenu 16 h, arrivée standard : E = 14 h, un seul relevé (verrouillée à 16 h 30 : journée close)", async () => {
    const rotation: DepartureStay[] = [
      { ...bookings[0], departureHour: 16 },
      { id: 1000002, arrival: DAY, departure: "2027-01-12", status: "confirmed" },
    ];
    h.health = { online: true, lockState: 1 };
    expect(await run([16, 30], rotation)).toMatchObject({ status: "locked", closesDay: true });
  });

  it("départ convenu tard : la nuit, l'alerte part en priorité 3", async () => {
    const late = [{ ...bookings[0], departureHour: 22 }];
    await run([22, 30], late);
    await run([22, 45], late);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][1]).toMatchObject({ priority: 3 });
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

  it("journal illisible sur 2 relevés, porte non verrouillée : alerte distincte en priorité 3", async () => {
    h.logDown = true;
    await run([11, 30]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][1]).toMatchObject({ title: "[Serrure] Porte non verrouillée, journal de la serrure illisible", priority: 3 });
    expect(h.sendNtfy.mock.calls[0][0]).toContain("impossible de savoir si le ménage est entré");
  });

  it("serrure dans un état de passage : ni journal ni alerte, le relevé suivant tranche", async () => {
    h.health = { online: true, lockState: 4 };
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    expect(h.logCalls).toBe(0);
    h.health = { online: true, lockState: 3 };
    await run([12, 0]);
    await run([12, 15]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("alerte ouverte : le garage n'est plus relu, la serrure et le journal si", async () => {
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.garageCalls).toBe(2);
    await run([12, 0]);
    await run([12, 15]);
    expect(h.garageCalls).toBe(2);
    expect(h.logCalls).toBe(4);
    expect(h.nukiCalls).toBe(4);
  });

  it("minuit (hiver) : plus de départ, l'alerte ouverte se referme sans message", async () => {
    await run([11, 30]);
    await run([11, 45]);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    const next = "2027-01-11";
    const r = await runDepartureLockCheck(bookings, next, parisInstant(next, 0));
    expect(r.report).toBe("close-silently");
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect((h.mem.get("barbusse:alert:departure-lock") as { open: boolean }).open).toBe(false);
  });

  it("minuit (mode été) : l'alerte ouverte se referme sans message, sans appel à Nuki ni à Beds24", async () => {
    const load = vi.fn(async () => bookings);
    await runDepartureLockCheckSummer(DAY, 11 * 60 + 30, load, at(11, 30));
    await runDepartureLockCheckSummer(DAY, 11 * 60 + 45, load, at(11, 45));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    const calls = h.nukiCalls;
    const next = "2027-01-11";
    expect(await runDepartureLockCheckSummer(next, 0, load, parisInstant(next, 0))).toBeNull();
    expect((h.mem.get("barbusse:alert:departure-lock") as { open: boolean }).open).toBe(false);
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.nukiCalls).toBe(calls);
    expect(load).toHaveBeenCalledTimes(1);
    // À midi, toujours pas de départ ce jour-là : fermeture (déjà faite), rien d'autre.
    expect((await runDepartureLockCheckSummer(next, 12 * 60, load, parisInstant(next, 12)))?.report).toBe("close-silently");
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
  });

  it("Redis illisible (horaires convenus, état d'alerte, fin de journée) : relevé sauté, aucune alerte", async () => {
    h.redis = true;
    h.hoursDown = true;
    for (const m of [30, 45]) expect((await run([11, m])).report).toBe("skip");
    h.hoursDown = false;
    h.getJsonDown = true;
    for (const m of [30, 45, 59]) expect(await run([11, m])).toMatchObject({ status: "unreadable", report: "skip" });
    expect(h.nukiCalls).toBe(0);
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });

  it("le départ convenu est relu dans Redis : 16 h reste 16 h même si la réservation arrive sans", async () => {
    h.redis = true;
    h.hours = { "1000001": JSON.stringify({ departureHour: 16 }) };
    expect((await run([11, 45])).status).toBe("none");
    expect(h.nukiCalls).toBe(0);
  });
});

describe("parade caméra du garage (recentMotion)", () => {
  it("vrai mouvement à 11 h 10 : relevé reporté à 11 h 30 (sans clore la journée), alerte à 12 h 15", () => {
    const r = departureLockCheck({ ...standard, now: at(11, 30), recentMotion: at(11, 10) });
    expect(r).toMatchObject({ status: "presence", report: "skip", alerts: [] });
    expect(r.closesDay).toBeUndefined();
    expect(departureLockCheck({ ...standard, now: at(12, 15), recentMotion: at(11, 10) }).status).toBe("unlocked");
  });

  it("mouvement avant l'heure de départ (partants qui chargent la voiture) : ne reporte rien", () => {
    expect(departureLockCheck({ ...standard, now: at(11, 30), recentMotion: at(10, 50) }).status).toBe("unlocked");
  });

  it("aucun mouvement retenu (ignoré par le filtre, clé illisible, filtre coupé) : alerte", () => {
    expect(departureLockCheck({ ...standard, recentMotion: null }).status).toBe("unlocked");
    expect(departureLockCheck({ ...standard }).status).toBe("unlocked");
  });

  it("porte verrouillée : la caméra ne change rien", () => {
    const locked = { ...standard, lock: { online: true, lockState: 1 }, log: undefined, recentMotion: at(11, 20) };
    expect(departureLockCheck(locked).status).toBe("locked");
  });

  it("passage complet : filtre configuré mais mouvement illisible → l'alerte suit son cours", async () => {
    h.mem.clear();
    h.health = { online: true, lockState: 3 };
    h.log = [];
    h.garage = [];
    h.garageMode = "ok";
    h.hang = false;
    h.logDown = false;
    h.redis = false;
    h.hours = {};
    h.hoursDown = false;
    h.getJsonDown = false;
    process.env.NUKI_API_TOKEN = "jeton-de-test";
    process.env.NUKI_SMARTLOCK_ID = "1";
    process.env.NTFY_TOPIC = "https://ntfy.example.test/sujet-de-test";
    vi.stubEnv("CAMERA_SCENE_FILTER_DIDS", "CAMERA-TEST");
    try {
      const r = await runDepartureLockCheck(
        [{ id: 1000001, arrival: "2027-01-08", departure: DAY }],
        DAY,
        at(11, 30),
      );
      expect(r.status).toBe("unlocked");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
