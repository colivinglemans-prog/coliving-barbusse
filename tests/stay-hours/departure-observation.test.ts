/**
 * Détection du départ, phase B (observation) : les fonctions pures (`presenceFromReading`,
 * `lockFacts`, `departureMessage`, `departureTransition`, `departureBadge`), puis le passage complet
 * (`runDepartureObservation`) avec Redis, Nuki, Beds24, Heatzy et ntfy simulés. Horloges
 * injectées ; données inventées : réservations fictives, aucun prénom réel.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NukiLogEntry } from "@sejour/socle/lib/nuki";
import { parisInstant } from "@sejour/socle/lib/time";

const h = vi.hoisted(() => ({
  mem: new Map<string, unknown>(),
  lists: new Map<string, string[]>(),
  sendNtfy: vi.fn(async (body: string, options: unknown) => void [body, options]),
  health: { online: true, lockState: 1 as number | null },
  healthDown: false,
  log: [] as unknown[],
  thread: [] as Array<{ time: string; source: string; message: string }>,
  nukiCalls: 0,
  logCalls: 0,
  messageCalls: 0,
  setDeviceMode: vi.fn(async () => {}),
  setDeviceTemperatures: vi.fn(async () => {}),
}));

vi.mock("@/lib/redis", () => ({
  hasRedis: () => true,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => ({
    set: async (k: string, v: string, o?: { nx?: boolean }) => {
      if (o?.nx && h.mem.has(k)) return null;
      h.mem.set(k, v);
      return "OK";
    },
    del: async (k: string) => h.mem.delete(k),
    rpush: async (k: string, v: string) => {
      h.lists.set(k, [...(h.lists.get(k) ?? []), v]);
    },
    expire: async () => 1,
    scan: async (_c: unknown, o: { match: string }) => {
      const prefix = o.match.replace(/\*$/, "");
      return ["0", [...h.mem.keys()].filter((k) => k.startsWith(prefix))];
    },
    mget: async (...keys: string[]) => keys.map((k) => (h.mem.has(k) ? JSON.parse(JSON.stringify(h.mem.get(k))) : null)),
  }),
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
    if (h.healthDown) throw new Error("Nuki 503");
    return { ...h.health, keypadPaired: true, batteryCritical: false, keypadBatteryCritical: false, batteryChargePercent: 80, motorBlocked: false };
  },
  listLogSince: async () => {
    h.logCalls++;
    return h.log;
  },
}));
vi.mock("@/lib/access-sync", () => ({ nukiConfig: () => ({ token: "t", smartlockId: 1 }) }));
vi.mock("@/lib/beds24", () => ({
  getBookingMessages: async () => {
    h.messageCalls++;
    return h.thread;
  },
}));
// Le chauffage : jamais commandé par l'observation.
vi.mock("@/lib/heatzy", () => ({ setDeviceMode: h.setDeviceMode, setDeviceTemperatures: h.setDeviceTemperatures }));

import {
  EMPTY_PASSES,
  departureBadge,
  departureMessage,
  departureTransition,
  doorClosedBehind,
  housePresence,
  lockFacts,
  presenceFromReading,
  saysDeparted,
  type DepartureFacts,
  type DepartureState,
} from "@/lib/departure-detection";
import {
  departureDetectionMode,
  departureJournalKey,
  departureStateKey,
  readDepartureStates,
  recordDoorCheck,
  runDepartureObservation,
  type DepartureObservationInput,
} from "@/lib/departure-observation";
import type { RadiatorReading } from "@/lib/radiator-load";

const DAY = "2027-01-10";
const ID = 1000001;
const at = (hour: number, minute = 0) => new Date(parisInstant(DAY, hour).getTime() + minute * 60_000);
const entry = (date: Date, name: string, action = 1, trigger = 255): NukiLogEntry => ({ date: date.toISOString(), action, trigger, state: 0, name });
const lockEntry = (date: Date, trigger = 1): NukiLogEntry => ({ date: date.toISOString(), action: 2, trigger, state: 0, name: "" });
const ctx = { departingIds: [ID], arrivingIds: [1000002], people: [] as string[] };
const since = at(0);

const radiator = (name: string, mode: string, extra: Partial<RadiatorReading> = {}): RadiatorReading => ({
  did: `did-${name}`,
  name,
  zoneId: "z",
  online: true,
  attrs: { derog_mode: 3, mode },
  ...extra,
});
const house = (mode: string) => [radiator("Salon", mode), radiator("Chambre 1", mode), radiator("Chambre 2", mode)];

/** Faits d'un passage : porte verrouillée à 8 h 42 derrière les voyageurs, présence au choix. */
function facts(present: boolean | null, extra: Partial<DepartureFacts> = {}): DepartureFacts {
  return {
    presence: present === null ? null : { readable: true, present },
    lockState: 1,
    lock: lockFacts([entry(at(8, 40), `${ID}: Test`), lockEntry(at(8, 42))], since, ctx),
    message: null,
    ...extra,
  };
}

/** Déroule des passages de 15 min à partir de `start`. */
function run(start: Date, passes: DepartureFacts[], initial: DepartureState | null = null) {
  let state = initial;
  const notified: string[] = [];
  passes.forEach((f, i) => {
    const t = departureTransition(state, f, new Date(start.getTime() + i * 15 * 60_000), DAY);
    state = t.state;
    notified.push(...t.notify);
  });
  return { state: state!, notified };
}

describe("presenceFromReading", () => {
  it("lisible seulement en mode présence, en ligne, ni verrouillé ni hors alertes ; seul `cft` vaut présence", () => {
    expect(presenceFromReading(radiator("Salon", "cft"))).toEqual({ name: "Salon", tier: "cft", present: true });
    expect(presenceFromReading(radiator("Salon", "cft1"))).toEqual({ name: "Salon", tier: "cft1", present: false });
    expect(presenceFromReading(radiator("Salon", "cft2"))?.present).toBe(false);
    expect(presenceFromReading(radiator("Salon", "fro", { attrs: { derog_mode: 0, mode: "fro" } }))).toBeNull();
    expect(presenceFromReading(radiator("Salon", "cft", { online: false }))).toBeNull();
    expect(presenceFromReading(radiator("Salon", "cft", { attrs: null }))).toBeNull();
    expect(presenceFromReading(radiator("Salon", "cft"), { locked: true })).toBeNull();
    expect(presenceFromReading(radiator("Véranda", "cft"), { ignored: true })).toBeNull();
  });

  it("maison : illisible sous 3 radiateurs lisibles", () => {
    expect(housePresence([presenceFromReading(radiator("Salon", "cft")), null, null]).readable).toBe(false);
    expect(housePresence(house("cft1").map((r) => presenceFromReading(r)))).toMatchObject({ readable: true, present: false });
  });
});

describe("lockFacts", () => {
  it("dernier verrouillage, dernière ouverture, catégorie du code et jamais son nom", () => {
    const f = lockFacts(
      [entry(at(7), "# Hôte"), entry(at(8, 40), `${ID}: Test`), lockEntry(at(8, 42)), { ...entry(at(9), "x"), state: 1 }],
      since,
      ctx,
    );
    expect(f.lastLockAt).toBe(at(8, 42).toISOString());
    expect(f.lastOpening).toMatchObject({ actor: "séjour", kind: "ouverture", trigger: 255 });
    expect(f.events.map((e) => e.actor)).toEqual(["code personnel", "séjour", "à la main"]);
    expect(JSON.stringify(f)).not.toContain("Test");
    expect(doorClosedBehind(1, f)).toBe(true);
    expect(doorClosedBehind(3, f)).toBe(false);
    // Une ouverture après le dernier verrouillage : la porte n'est pas fermée derrière quelqu'un.
    expect(doorClosedBehind(1, lockFacts([lockEntry(at(8)), entry(at(9), "# Hôte")], since, ctx))).toBe(false);
    // Rien dans la fenêtre (verrouillée depuis la veille) : fermée.
    expect(doorClosedBehind(1, lockFacts([], since, ctx))).toBe(true);
  });
});

describe("departureMessage", () => {
  it("reconnaît un départ dans les 5 langues, jamais « pas encore »", () => {
    for (const t of [
      "Bonjour, nous sommes partis, merci pour tout !",
      "On est bien partis, clés sur les portes",
      "Hi, we have just left the house. Thanks!",
      "We checked out at 9",
      "Siamo partiti, grazie mille",
      "Wir sind abgereist, vielen Dank",
      "Hola, ya salimos de la casa",
    ]) {
      expect(saysDeparted(t), t).toBe(true);
    }
    for (const t of ["Nous ne sommes pas encore partis", "We haven't left yet", "On part vers 10 h", "Une partie du groupe dort encore"]) {
      expect(saysDeparted(t), t).toBe(false);
    }
  });

  it("seulement les messages du voyageur reçus le jour du départ ; rend l'heure, pas le texte", () => {
    const thread = [
      { time: at(9, 5).toISOString(), source: "guest", message: "Nous sommes partis" },
      { time: at(8).toISOString(), source: "host", message: "Vous êtes partis ?" },
      { time: new Date(since.getTime() - 3600_000).toISOString(), source: "guest", message: "Nous sommes partis" },
    ];
    expect(departureMessage(thread, since)).toEqual({ at: at(9, 5).toISOString() });
    expect(departureMessage(thread.slice(1), since)).toBeNull();
  });
});

describe("departureTransition (pure)", () => {
  it(`départ constaté par la présence : porte verrouillée et ${EMPTY_PASSES} passages sans présence, notifié une fois`, () => {
    const { state, notified } = run(at(8, 30), [facts(true), facts(false), facts(false), facts(false), facts(false)]);
    expect(state).toMatchObject({ status: "empty", by: "presence", departedAt: at(8, 42).toISOString() });
    expect(notified).toEqual(["departed"]);
    // Deux passages sans présence seulement : soupçon, pas de constat.
    expect(run(at(8, 30), [facts(false), facts(false)]).state.status).toBe("suspected");
  });

  it("verrouillée la veille au soir, sans ouverture : le départ est daté du début de l'absence", () => {
    const f = facts(false, { lock: lockFacts([lockEntry(new Date(since.getTime() - 30 * 60_000))], new Date(since.getTime() - 6 * 3600_000), ctx) });
    const { state } = run(at(9), [f, f, f]);
    expect(state).toMatchObject({ status: "empty", departedAt: at(9).toISOString() });
  });

  it("départ constaté par le message : immédiat, porte verrouillée", () => {
    const { state, notified } = run(at(9, 15), [facts(true, { message: { at: at(9, 5).toISOString() } })]);
    expect(state).toMatchObject({ status: "empty", by: "message", messageAt: at(9, 5).toISOString(), departedAt: at(8, 42).toISOString() });
    expect(notified).toEqual(["departed"]);
  });

  it("retour d'un voyageur : son code rouvre après le constat → `returned`, puis nouveau constat sans nouvelle notification", () => {
    const empty = run(at(8, 45), [facts(false), facts(false), facts(false)]).state;
    expect(empty.status).toBe("empty");
    const back = lockFacts([entry(at(8, 40), `${ID}: Test`), lockEntry(at(8, 42)), entry(at(9, 40), `${ID}: Test`)], since, ctx);
    const r = departureTransition(empty, { ...facts(true), lockState: 3, lock: back }, at(9, 45), DAY);
    expect(r.state).toMatchObject({ status: "returned", returnedAt: at(9, 40).toISOString() });
    expect(r.notify).toEqual([]);
    const relocked = lockFacts([entry(at(9, 40), `${ID}: Test`), lockEntry(at(9, 50))], since, ctx);
    const again = run(at(10), [facts(false, { lock: relocked }), facts(false, { lock: relocked }), facts(false, { lock: relocked })], r.state);
    expect(again.state).toMatchObject({ status: "empty", departedAt: at(9, 50).toISOString() });
    expect(again.notified).toEqual([]);
  });

  it("le ménage ou l'hôte qui ouvrent après le constat : pas un retour", () => {
    const empty = run(at(8, 45), [facts(false), facts(false), facts(false)]).state;
    const host = lockFacts([lockEntry(at(8, 42)), entry(at(9, 40), "# Hôte")], since, ctx);
    expect(departureTransition(empty, { ...facts(true), lockState: 3, lock: host }, at(9, 45), DAY).state.status).toBe("empty");
  });

  it("message de départ, porte non verrouillée : alerte basse une seule fois, pas de constat", () => {
    const open = facts(false, { lockState: 3, lock: null, message: { at: at(9, 5).toISOString() } });
    const { state, notified } = run(at(9, 15), [open, open, open, open]);
    expect(state).toMatchObject({ status: "suspected", leftUnlocked: true });
    expect(notified).toEqual(["left-unlocked"]);
    expect(departureBadge(state, DAY)).toEqual({ icon: "unlocked", line: "Partis sans verrouiller la porte (estimation)" });
  });

  it("serrure ou radiateurs illisibles : aucun constat, aucune notification", () => {
    const noLock = facts(false, { lockState: null, message: { at: at(9).toISOString() } });
    const r1 = run(at(9), [noLock, noLock, noLock, noLock]);
    expect(r1.state.status).toBe("occupied");
    expect(r1.notified).toEqual([]);
    const transient = run(at(9), [facts(false, { lockState: 4 }), facts(false, { lockState: 4 }), facts(false, { lockState: 4 })]);
    expect(transient.notified).toEqual([]);
    // Radiateurs illisibles : la série sans présence ne bouge pas.
    const r2 = run(at(9), [facts(null), facts(null), facts(null), facts(null)]);
    expect(r2.state).toMatchObject({ status: "occupied", absentPasses: 0 });
    expect(r2.notified).toEqual([]);
  });
});

describe("departureBadge", () => {
  it("partis (vert), encore présents (orange, le jour même), partis sans verrouiller (rouge)", () => {
    const empty = run(at(8, 45), [facts(false), facts(false), facts(false)]).state;
    expect(departureBadge(empty, DAY)).toEqual({
      icon: "gone",
      line: "Départ constaté à 8 h 42 (porte verrouillée, plus de présence) (estimation)",
    });
    const present = run(at(8, 15), [facts(true)]).state;
    expect(departureBadge(present, DAY, 16)).toEqual({
      icon: "present",
      line: "Voyageurs encore présents (dernière présence 8 h 15) · départ tardif convenu à 16 h (estimation)",
    });
    expect(departureBadge(present, "2027-01-11")).toBeNull();
    expect(departureBadge({ ...present, door: "unlocked" }, DAY)?.icon).toBe("unlocked");
    expect(departureBadge({ ...present, door: "locked" }, DAY)).toBeNull();
  });
});

describe("runDepartureObservation (passage complet)", () => {
  const bookings = [{ id: ID, arrival: "2027-01-08", departure: DAY, status: "confirmed" }];
  const input = (now: Date, readings: RadiatorReading[] | null = house("cft1")): DepartureObservationInput => ({
    bookings,
    today: DAY,
    now,
    readings,
    lockedDids: new Set(),
    ignoredDids: new Set(),
  });

  beforeEach(() => {
    h.mem.clear();
    h.lists.clear();
    h.sendNtfy.mockClear();
    h.setDeviceMode.mockClear();
    h.setDeviceTemperatures.mockClear();
    h.health = { online: true, lockState: 1 };
    h.healthDown = false;
    h.log = [entry(at(8, 40), `${ID}: Test`), lockEntry(at(8, 42))];
    h.thread = [];
    h.nukiCalls = 0;
    h.logCalls = 0;
    h.messageCalls = 0;
    process.env.NTFY_TOPIC = "topic-de-test";
    delete process.env.DEPARTURE_DETECTION;
  });

  it("interrupteur : défaut `observe`, `live` et `off` reconnus", () => {
    expect(departureDetectionMode(undefined)).toBe("observe");
    expect(departureDetectionMode("n'importe quoi")).toBe("observe");
    expect(departureDetectionMode("LIVE")).toBe("live");
    expect(departureDetectionMode("off")).toBe("off");
  });

  it("constat par la présence : notification « Départ estimé » une fois, journal, chauffage jamais commandé", async () => {
    for (const m of [0, 15, 30, 45, 60]) await runDepartureObservation(input(new Date(at(9).getTime() + m * 60_000)));
    const state = h.mem.get(departureStateKey(ID)) as DepartureState;
    expect(state).toMatchObject({ status: "empty", by: "presence" });
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    const [body, options] = h.sendNtfy.mock.calls[0];
    expect(body).toContain("Départ estimé à 8 h 42 (observation : chauffage non modifié)");
    expect(options).toMatchObject({ priority: 2 });
    const journal = (h.lists.get(departureJournalKey(DAY)) ?? []).map((s) => JSON.parse(s));
    expect(journal).toHaveLength(5);
    expect(journal[0].presence.radiators[0]).toEqual({ name: "Salon", tier: "cft1", present: false });
    expect(journal[0].events.map((e: { actor: string }) => e.actor)).toEqual(["séjour", "à la main"]);
    expect(JSON.stringify(journal)).not.toContain("Test");
    // Observation : aucune commande de radiateur, jamais.
    expect(h.setDeviceMode).not.toHaveBeenCalled();
    expect(h.setDeviceTemperatures).not.toHaveBeenCalled();
  });

  it("`live` (pas encore codé) : observe aussi, sans toucher au chauffage", async () => {
    process.env.DEPARTURE_DETECTION = "live";
    for (const m of [0, 15, 30]) await runDepartureObservation(input(new Date(at(9).getTime() + m * 60_000)));
    expect((h.mem.get(departureStateKey(ID)) as DepartureState).status).toBe("empty");
    expect(h.setDeviceMode).not.toHaveBeenCalled();
  });

  it("messagerie Beds24 : un passage sur deux au plus, plus du tout une fois le départ constaté", async () => {
    h.health = { online: true, lockState: 3 };
    for (const m of [0, 15, 30, 45]) await runDepartureObservation(input(new Date(at(8).getTime() + m * 60_000), house("cft")));
    expect(h.messageCalls).toBe(2);
    // Porte non verrouillée : le journal Nuki n'est pas lu.
    expect(h.logCalls).toBe(0);
    expect(h.nukiCalls).toBe(4);
    // Message reçu, porte verrouillée : constat, et le fil n'est plus relu.
    h.health = { online: true, lockState: 1 };
    h.thread = [{ time: at(9, 5).toISOString(), source: "guest", message: "Nous sommes partis, merci !" }];
    await runDepartureObservation(input(at(9, 10), house("cft")));
    expect((h.mem.get(departureStateKey(ID)) as DepartureState)).toMatchObject({ status: "empty", by: "message" });
    const calls = h.messageCalls;
    for (const m of [40, 70, 100]) await runDepartureObservation(input(new Date(at(9).getTime() + m * 60_000), house("cft")));
    expect(h.messageCalls).toBe(calls);
    // Le texte du message n'est nulle part dans Redis.
    expect(JSON.stringify([...h.mem.values(), ...h.lists.values()])).not.toContain("merci");
  });

  it("message reçu, porte non verrouillée : une alerte basse « Serrure », une seule fois", async () => {
    h.health = { online: true, lockState: 3 };
    h.thread = [{ time: at(9, 5).toISOString(), source: "guest", message: "We have left, thanks" }];
    for (const m of [10, 40, 70]) await runDepartureObservation(input(new Date(at(9).getTime() + m * 60_000)));
    expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    expect(h.sendNtfy.mock.calls[0][1]).toMatchObject({ priority: 2, title: expect.stringContaining("[Serrure]") });
  });

  it("serrure illisible, radiateurs illisibles : rien de notifié", async () => {
    h.healthDown = true;
    for (const m of [0, 15, 30, 45]) await runDepartureObservation(input(new Date(at(9).getTime() + m * 60_000), null));
    expect(h.sendNtfy).not.toHaveBeenCalled();
    expect((h.mem.get(departureStateKey(ID)) as DepartureState).status).toBe("occupied");
  });

  it("hors fenêtre : rien avant 5 h, rien à partir de D + 30 min, rien en `off`, rien sans départ", async () => {
    expect(await runDepartureObservation(input(at(4, 45)))).toBeNull();
    expect(await runDepartureObservation(input(at(11, 30)))).toBeNull();
    expect(await runDepartureObservation({ ...input(at(9)), bookings: [{ ...bookings[0], departure: "2027-01-11" }] })).toBeNull();
    process.env.DEPARTURE_DETECTION = "off";
    expect(await runDepartureObservation(input(at(9)))).toBeNull();
    expect(h.nukiCalls).toBe(0);
    expect(h.messageCalls).toBe(0);
  });

  it("relevé de la porte après le départ : reporté sans relire, lu par le dashboard", async () => {
    await runDepartureObservation(input(at(9)));
    const nuki = h.nukiCalls;
    await recordDoorCheck(bookings, DAY, { status: "unlocked" }, at(11, 30));
    expect(h.nukiCalls).toBe(nuki);
    const states = await readDepartureStates();
    expect(departureBadge(states[ID], DAY)?.icon).toBe("unlocked");
  });
});
