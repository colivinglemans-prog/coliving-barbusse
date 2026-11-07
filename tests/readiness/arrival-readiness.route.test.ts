import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { accessWindow } from "@sejour/socle/lib/access-codes";

/*
 * La route `/api/cron/arrival-readiness` de bout en bout, sans réseau : Beds24, Heatzy,
 * Cozytouch, Nuki, Redis et ntfy sont simulés. Ce qu'on vérifie, c'est le branchement —
 * sondes, seuils, heures de silence, anti-répétition et surtout le `dryRun`.
 *
 * Novembre : Paris = UTC+1. « 16h35 Paris » = 15:35Z.
 */

const h = vi.hoisted(() => {
  const mem = new Map<string, unknown>();
  return {
    mem,
    bookings: [] as Array<Record<string, unknown>>,
    devices: [] as Array<{ did: string; is_online: boolean }>,
    statuses: {} as Record<string, Record<string, unknown>>,
    water: {} as Record<string, unknown>,
    health: {} as Record<string, unknown>,
    auths: [] as Array<Record<string, unknown>>,
    log: [] as Array<Record<string, unknown>> | null,
    sendNtfy: vi.fn(async () => {}),
  };
});

vi.mock("@/lib/redis", () => ({
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async (k: string) => (h.mem.has(k) ? JSON.parse(JSON.stringify(h.mem.get(k))) : null),
  setJson: async (k: string, v: unknown) => {
    h.mem.set(k, JSON.parse(JSON.stringify(v)));
  },
  stringStore: () => ({
    get: async (k: string) => (h.mem.has(k) ? String(h.mem.get(k)) : null),
    set: async (k: string, v: string) => {
      h.mem.set(k, v);
    },
  }),
  getRedis: () => {
    throw new Error("pas de Redis en test");
  },
  hasRedis: () => false,
}));

vi.mock("@/lib/beds24", () => ({
  PROPERTY_ID: 303771,
  getBookings: vi.fn(async () => h.bookings),
}));

vi.mock("@/lib/access-sync", () => ({
  ACCESS_POLICY: { validFromHour: 14, validUntilHour: 14, missingPinAlertDays: 3, highSeverityDays: 2, urgentSeverityDays: 0 },
  nukiConfig: () => ({ token: "jeton", smartlockId: "1" }),
}));

vi.mock("@/lib/heatzy", () => ({
  getFullZoneConfig: async () => ({
    zones: [
      {
        id: "rdc",
        label: "RDC",
        defaultMode: "fro",
        nightMode: "presence",
        cftTemp: 190,
        ecoTemp: 150,
        devices: [{ did: "SALON", name: "Salon", defaultMode: "fro" }],
      },
      {
        id: "1er",
        label: "1er",
        defaultMode: "fro",
        cftTemp: 190,
        ecoTemp: 150,
        devices: [
          { did: "CH2", name: "Chambre 2", defaultMode: "fro" },
          { did: "CH3", name: "Chambre 3", defaultMode: "fro", unpaired: true },
        ],
      },
    ],
    roomMapping: {},
    excludedDevices: [],
  }),
  getLockedDevices: async () => new Set<string>(),
  getSummerMode: async () => false,
  getDevices: async () => h.devices,
  getDeviceStatus: async (did: string) => {
    const s = h.statuses[did];
    if (!s) throw new Error("statut indisponible");
    return s;
  },
}));

vi.mock("@/lib/cozytouch", () => ({
  getWaterHeaterStatus: async () => h.water,
}));

vi.mock("@sejour/socle/lib/nuki", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sejour/socle/lib/nuki")>()),
  getLockHealth: async () => h.health,
  listAuths: async () => h.auths,
  listLogSince: async () => {
    if (h.log === null) throw new Error("journal illisible");
    return h.log;
  },
}));

vi.mock("@sejour/socle/lib/ntfy", () => ({ sendNtfy: h.sendNtfy }));

import { GET } from "@/app/api/cron/arrival-readiness/route";

const SECRET = "secret-de-test";
const BOOKING = 81234567;

function call(query: string, auth = true) {
  return GET(
    new NextRequest(`https://www.coliving-barbusse.fr/api/cron/arrival-readiness${query}`, {
      headers: auth ? { authorization: `Bearer ${SECRET}` } : {},
    }),
  );
}

function stay(id: number, arrival: string, departure: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    propertyId: 303771,
    roomId: 633259,
    arrival,
    departure,
    status: "confirmed",
    numAdult: 8,
    numChild: 2,
    firstName: "Marie-Claire",
    lastName: "Durand",
    bookingTime: "2026-10-01T10:00:00Z",
    ...extra,
  };
}

function codeFor(id: number, arrival: string, departure: string) {
  return {
    id: `auth-${id}`,
    type: 13,
    name: `${id}: Marie`,
    enabled: true,
    code: 456789,
    ...accessWindow({ arrival, departure }, { validFromHour: 14, validUntilHour: 14 }),
  };
}

const heatzyStatus = (mode: string, tempC: number) => ({
  mode,
  derog_mode: 0,
  cur_temp: tempC * 10,
  cft_temp: 190,
  eco_temp: 150,
});

beforeEach(() => {
  process.env.CRON_SECRET = SECRET;
  process.env.NTFY_TOPIC = "https://ntfy.invalid/test";
  h.mem.clear();
  h.sendNtfy.mockClear();
  h.bookings = [stay(BOOKING, "2026-11-14", "2026-11-16")];
  h.devices = [
    { did: "SALON", is_online: true },
    { did: "CH2", is_online: true },
    { did: "CH3", is_online: false },
  ];
  h.statuses = { SALON: heatzyStatus("cft", 18), CH2: heatzyStatus("cft", 18) };
  h.water = { isAvailable: true, bottomTemperature: 45, middleTemperature: 55, remainingHotWater: 180, capacity: 250 };
  h.health = {
    online: true,
    keypadPaired: true,
    batteryCritical: false,
    keypadBatteryCritical: false,
    batteryChargePercent: 80,
    lockState: 1,
    motorBlocked: false,
  };
  h.auths = [codeFor(BOOKING, "2026-11-14", "2026-11-16")];
  h.log = [];
});

describe("arrival-readiness — accès", () => {
  it("refuse sans le secret du cron", async () => {
    expect((await call("?dryRun=1", false)).status).toBe(401);
  });

  it("refuse `at` hors dryRun", async () => {
    expect((await call("?at=2026-11-14T15:35:00Z")).status).toBe(400);
  });

  it("refuse un `at` illisible", async () => {
    expect((await call("?dryRun=1&at=demain")).status).toBe(400);
  });
});

describe("arrival-readiness — dryRun", () => {
  it("calcule l'alerte de 16h30 sans rien envoyer ni écrire", async () => {
    h.devices[0].is_online = false; // Salon hors ligne…
    h.mem.set("barbusse:readiness:memory", { misses: { "heating:offline:SALON": 1 } }); // …pour la 2e lecture
    const before = JSON.stringify([...h.mem]);

    const res = await call("?dryRun=1&at=2026-11-14T15:35:00Z");
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(h.sendNtfy).not.toHaveBeenCalled();
    expect(JSON.stringify([...h.mem])).toBe(before);
    const final = body.passes.find((p: { kind: string }) => p.kind === "final");
    expect(final.send).toBe(true);
    expect(final.sent).toBe(false);
    expect(final.preview.priority).toBe(5);
    expect(final.preview.title).toBe("Arrivée 17h — 1 bloquant (16h30)");
    expect(final.preview.body).toContain("Salon : radiateur hors ligne");
    // Chambre 3 (`unpaired`) hors ligne n'apparaît jamais.
    expect(JSON.stringify(body)).not.toContain("CH3");
    // Ni PIN ni nom de famille.
    expect(JSON.stringify(body)).not.toContain("456789");
    expect(JSON.stringify(body)).not.toContain("Durand");
  });
});

describe("arrival-readiness — envoi et anti-répétition", () => {
  it("envoie une fois, puis se tait à gravité égale", async () => {
    h.devices[0].is_online = false;
    h.mem.set("barbusse:readiness:memory", { misses: { "heating:offline:SALON": 1 } });

    // Pas d'`at` hors dryRun : l'heure est simulée par l'horloge système.
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-14T15:35:00Z"));
      await call("");
      expect(h.sendNtfy).toHaveBeenCalledTimes(1);
      const [message, options] = h.sendNtfy.mock.calls[0] as unknown as [string, { priority: number; title: string }];
      expect(options.priority).toBe(5);
      expect(message).toContain("Marie-Claire");
      expect(message).not.toContain("Durand");
      expect(h.mem.get("barbusse:readiness:state:arrival:81234567")).toMatchObject({ open: true });
      expect(h.mem.get("barbusse:heartbeat:arrival-readiness:ok")).toBe("2026-11-14T15:35:00.000Z");

      // Même passage rejoué (cron doublé) : même gravité, rien ne repart.
      await call("");
      expect(h.sendNtfy).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("n'envoie pas d'alerte pour une chambre `unpaired` hors ligne", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      h.mem.set("barbusse:readiness:memory", { misses: { "heating:offline:CH3": 5 } });
      vi.setSystemTime(new Date("2026-11-14T15:35:00Z"));
      await call("");
      expect(h.sendNtfy).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("arrival-readiness — sondes Barbusse", () => {
  it("rotation : l'éco est attendu à 15h30, le confort y est signalé", async () => {
    h.bookings = [stay(81111111, "2026-11-08", "2026-11-10"), stay(BOOKING, "2026-11-10", "2026-11-12")];
    h.auths = [codeFor(BOOKING, "2026-11-10", "2026-11-12")];
    h.statuses = { SALON: heatzyStatus("eco", 16), CH2: heatzyStatus("cft", 16) };

    const body = await (await call("?dryRun=1&at=2026-11-10T14:35:00Z")).json();
    const preheat = body.passes.find((p: { kind: string }) => p.kind === "preheat");
    expect(preheat.turnover).toBe(true);
    const ids = preheat.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain("heating:mode:CH2");
    expect(ids).not.toContain("heating:mode:SALON");
    expect(preheat.findings.find((f: { id: string }) => f.id === "heating:mode:CH2").action).toContain("au lieu de éco");
  });

  it("15h30 : une pièce froide qui ne monte pas est signalée, une pièce à 14 °C non", async () => {
    h.mem.set("barbusse:readiness:baseline:81234567", { SALON: 11, CH2: 12 });
    h.statuses = { SALON: heatzyStatus("cft", 11.5), CH2: heatzyStatus("cft", 14) };
    const body = await (await call("?dryRun=1&at=2026-11-14T14:35:00Z")).json();
    const preheat = body.passes.find((p: { kind: string }) => p.kind === "preheat");
    const ids = preheat.findings.map((f: { id: string }) => f.id);
    expect(ids).toContain("heating:temp:SALON");
    expect(ids).not.toContain("heating:temp:CH2");
  });

  it("16h30 : sous consigne − 3 °C → signalé ; eau à 40 °C et 20 % → signalée", async () => {
    h.statuses = { SALON: heatzyStatus("cft", 15.5), CH2: heatzyStatus("cft", 16) };
    h.water = { isAvailable: true, bottomTemperature: 35, middleTemperature: 40, remainingHotWater: 50, capacity: 250 };
    const body = await (await call("?dryRun=1&at=2026-11-14T15:35:00Z")).json();
    const final = body.passes.find((p: { kind: string }) => p.kind === "final");
    const ids = final.findings.map((f: { id: string }) => f.id);
    expect(ids).toEqual(expect.arrayContaining(["heating:temp:SALON", "waterHeater:level"]));
    expect(ids).not.toContain("heating:temp:CH2"); // 16 ≥ 19 − 3
  });

  it("J-1 19h : aucune température lue, seulement la connectivité", async () => {
    h.statuses = { SALON: heatzyStatus("fro", 5), CH2: heatzyStatus("fro", 5) };
    const body = await (await call("?dryRun=1&at=2026-11-13T17:35:00Z")).json();
    const eve = body.passes.find((p: { kind: string }) => p.kind === "eve");
    expect(eve.notify).toBe(true);
    expect(eve.findings.filter((f: { id: string }) => f.id.startsWith("heating:"))).toEqual([]);
  });
});

describe("arrival-readiness — non-arrivée et pile", () => {
  it("non-arrivée signalée à J+1 9h, une seule fois", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      for (const t of ["2026-11-14T15:35:00Z", "2026-11-14T21:35:00Z", "2026-11-15T07:35:00Z", "2026-11-15T08:35:00Z", "2026-11-15T09:35:00Z"]) {
        vi.setSystemTime(new Date(t));
        await call("");
      }
      const calls = h.sendNtfy.mock.calls as unknown as Array<[string, { priority: number; title: string }]>;
      const noShow = calls.filter(([m]) => m.includes("Aucune entrée avec le code"));
      expect(noShow).toHaveLength(1);
      expect(noShow[0][1].priority).toBe(4);
      expect(noShow[0][1].title).toContain("(9h)");
      expect(noShow[0][0]).toContain("appeler Marie-Claire");
    } finally {
      vi.useRealTimers();
    }
  });

  it("journal illisible → contrôle impossible, jamais « voyageur absent »", async () => {
    h.log = null;
    const body = await (await call("?dryRun=1&at=2026-11-15T07:35:00Z")).json();
    const noShow = body.passes.find((p: { kind: string }) => p.kind === "noShow");
    expect(noShow.findings).toEqual([expect.objectContaining({ id: `presence:${BOOKING}`, status: "unknown" })]);
  });

  it("pile à 20 % → priorité 3, puis 8 % → priorité 4, puis rien à 8 % de nouveau", async () => {
    h.bookings = [];
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      h.health = { ...h.health, batteryChargePercent: 20 };
      vi.setSystemTime(new Date("2026-11-20T07:35:00Z"));
      await call("");
      h.health = { ...h.health, batteryChargePercent: 8 };
      vi.setSystemTime(new Date("2026-11-21T07:35:00Z"));
      await call("");
      vi.setSystemTime(new Date("2026-11-22T07:35:00Z"));
      await call("");
      const priorities = (h.sendNtfy.mock.calls as unknown as Array<[string, { priority: number }]>).map(([, o]) => o.priority);
      expect(priorities).toEqual([3, 4]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("arrivée annoncée à 23h30 : le passage tardif de 22h30 parle malgré les heures de silence", async () => {
    h.bookings = [stay(BOOKING, "2026-11-14", "2026-11-16", { arrivalTime: "23:30" })];
    h.water = { isAvailable: true, bottomTemperature: 30, middleTemperature: 35, remainingHotWater: 20, capacity: 250 };
    const body = await (await call("?dryRun=1&at=2026-11-14T21:35:00Z")).json();
    const late = body.passes.find((p: { kind: string }) => p.kind === "late");
    expect(late.notify).toBe(true);
    expect(late.send).toBe(true);
    expect(late.preview.priority).toBe(4);
    expect(h.sendNtfy).not.toHaveBeenCalled();
  });
});
