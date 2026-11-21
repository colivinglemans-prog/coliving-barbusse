import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * `runPricingPush` de bout en bout, Redis et Beds24 simulés : l'interrupteur à deux clés est-il
 * vraiment fermé par défaut, et chaque panne pose-t-elle le coupe-circuit ? (relecture Fable,
 * bloquant B2). Données inventées.
 */
const h = vi.hoisted(() => {
  const mem = new Map<string, unknown>();
  const calendar = new Map<string, { price: number; minStay: number; available: boolean }>();
  return {
    mem,
    calendar,
    failGet: false,
    applyWrites: true,
    writeThrows: false,
    readThrowsAfterWrite: false,
    reads: [] as { start: string; end: string }[],
    writes: [] as { from: string; to: string; price1?: number; minStay?: number }[][],
    alerts: [] as string[],
    /** Référence de bascule simulée (`null` = fichier non rempli). */
    refDate: "2026-11-30" as string | null,
  };
});

// Référence complète inventée : 470 € par nuit sur 420 jours à partir du 30/11/2026.
const REF_NIGHTS: Record<string, [number, number]> = {};
for (let i = 0; i < 420; i++) {
  const x = new Date(Date.UTC(2026, 10, 30 + i));
  REF_NIGHTS[x.toISOString().slice(0, 10)] = [470, 2];
}

vi.mock("@/lib/pricing/cutover-ref", () => ({
  get CUTOVER_REF() {
    return { date: h.refDate, nights: h.refDate ? REF_NIGHTS : {} };
  },
  refFromSnapshot: (snap: { date: string }) => ({ date: snap.date, nights: {}, provisional: true }),
}));

vi.mock("@/lib/redis", () => ({
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getRedis: () => ({
    get: async (k: string) => {
      if (h.failGet) throw new Error("redis en panne");
      return h.mem.has(k) ? h.mem.get(k) : null;
    },
    set: async (k: string, v: unknown, opts?: { nx?: boolean }) => {
      if (opts?.nx && h.mem.has(k)) return null;
      h.mem.set(k, v);
      return "OK";
    },
    del: async (k: string) => void h.mem.delete(k),
  }),
  getJson: async (k: string) => (h.mem.has(k) ? JSON.parse(String(h.mem.get(k))) : null),
  setJson: async (k: string, v: unknown) => void h.mem.set(k, JSON.stringify(v)),
}));

vi.mock("@/lib/alerts", () => ({
  sendPricingAlert: async (subject: string) => void h.alerts.push(subject),
}));

vi.mock("@/lib/beds24", () => ({
  getCalendarDays: async (_p: number, start: string, end: string) => {
    h.reads.push({ start, end });
    // Comme Beds24 : jamais plus de 365 jours par appel.
    const span = (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000 + 1;
    if (span > 365) throw new Error(`lecture de ${span} jours refusée`);
    if (h.readThrowsAfterWrite && h.writes.length > 0) throw new Error("relecture impossible");
    const out: Record<string, { price: number; minStay: number; available: boolean }> = {};
    for (let d = start; d <= end; d = next(d)) {
      out[d] = h.calendar.get(d) ?? { price: 470, minStay: 2, available: true };
    }
    return out;
  },
  writeCalendar: async (spans: { from: string; to: string; price1?: number; minStay?: number }[]) => {
    if (h.writeThrows) throw new Error("Beds24 a expiré");
    h.writes.push(spans);
    if (h.applyWrites) {
      for (const s of spans) {
        for (let d = s.from; d <= s.to; d = next(d)) {
          const cur = h.calendar.get(d) ?? { price: 470, minStay: 2, available: true };
          h.calendar.set(d, { ...cur, price: s.price1 ?? cur.price, minStay: s.minStay ?? cur.minStay });
        }
      }
    }
    return { warnings: [] };
  },
}));

function next(d: string): string {
  const x = new Date(`${d}T00:00:00Z`);
  x.setUTCDate(x.getUTCDate() + 1);
  return x.toISOString().slice(0, 10);
}

const { runPricingPush, HALT_KEY, countDailyChanges } = await import("@/lib/pricing/push");

const TODAY = "2026-12-01";
const env = { ...process.env };

beforeEach(() => {
  h.mem.clear();
  h.calendar.clear();
  h.failGet = false;
  h.applyWrites = true;
  h.writeThrows = false;
  h.readThrowsAfterWrite = false;
  h.reads.length = 0;
  h.writes.length = 0;
  h.alerts.length = 0;
  h.refDate = "2026-11-30";
  // Plus de variables de bascule : les limites sont datées dans lib/pricing/cutover.ts.
  delete process.env.PRICING_MAX_DATES;
  delete process.env.PRICING_MAX_CHANGE;
});
afterEach(() => {
  process.env = { ...env };
});

describe("runPricingPush", () => {
  it("off par défaut : ni lecture ni écriture", async () => {
    delete process.env.PRICING_PUSH_MODE;
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("off");
    expect(h.reads).toEqual([]);
    expect(h.writes).toEqual([]);
  });

  it("une valeur inconnue vaut off", async () => {
    process.env.PRICING_PUSH_MODE = "LIVE";
    expect((await runPricingPush({ today: TODAY })).outcome).toBe("off");
  });

  it("dry : lit 395 jours en deux appels, calcule, n'écrit rien", async () => {
    process.env.PRICING_PUSH_MODE = "dry";
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("dry");
    expect(run.writes).toBeGreaterThan(0);
    expect(h.writes).toEqual([]);
    expect(h.reads).toHaveLength(2);
    expect(h.reads[1].end).toBe("2027-12-30");
  });

  it("live : écrit seulement price1 et minStay, relit, et rend « written »", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("written");
    expect(h.writes).toHaveLength(1);
    // Deux lectures avant l'envoi, puis la relecture de contrôle, elle aussi en tranches.
    expect(h.reads.length).toBeGreaterThanOrEqual(3);
    for (const span of h.writes[0]) {
      expect(Object.keys(span).sort()).toEqual(expect.arrayContaining(["from", "to"]));
      expect(Object.keys(span).every((k) => ["from", "to", "price1", "minStay"].includes(k))).toBe(true);
    }
    expect(h.mem.has(HALT_KEY)).toBe(false);
  });

  it("live mais coupe-circuit posé : n'écrit rien", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.mem.set(HALT_KEY, JSON.stringify({ since: "x", reason: "test" }));
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("halted");
    expect(h.writes).toEqual([]);
  });

  it("forceDry ne rend jamais plus permissif et ne touche ni au dernier passage ni aux cibles", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    const run = await runPricingPush({ today: TODAY, forceDry: true });
    expect(run.outcome).toBe("dry");
    expect(h.writes).toEqual([]);
    expect(h.mem.has("barbusse:pricing:push-last")).toBe(false);
    expect(h.mem.has(`barbusse:pricing:push-targets:${TODAY}`)).toBe(false);
  });

  it("live et Redis illisible au contrôle du coupe-circuit : n'écrit rien", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    // La lecture du halt est le seul `get` brut de Redis du parcours : elle échoue, on n'écrit pas.
    h.failGet = true;
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("halted");
    expect(h.writes).toEqual([]);
  });

  it("relecture qui lève après l'écriture : coupe-circuit et alerte", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.readThrowsAfterWrite = true;
    await expect(runPricingPush({ today: TODAY })).rejects.toThrow("relecture impossible");
    expect(h.mem.has(HALT_KEY)).toBe(true);
    expect(h.alerts[0]).toMatch(/Panne pendant l'envoi/);
  });

  it("une nuit non lue compte comme vendable pour le moteur (pas de faux trou)", async () => {
    const { buildTargets } = await import("@/lib/pricing/push");
    const cal = { "2027-03-02": { price: 470, minStay: 2, available: true } };
    const t = buildTargets("2027-03-02", cal, 3);
    expect(t["2027-03-02"].minStay).toBe(2);
  });

  it("écart à la relecture : pose le coupe-circuit, ne renvoie rien", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.applyWrites = false;
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("mismatch");
    expect(run.mismatches.length).toBeGreaterThan(0);
    expect(h.writes).toHaveLength(1);
    expect(h.mem.has(HALT_KEY)).toBe(true);
  });

  it("panne pendant l'envoi : coupe-circuit, alerte immédiate, erreur remontée", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.writeThrows = true;
    await expect(runPricingPush({ today: TODAY })).rejects.toThrow("Beds24 a expiré");
    expect(h.mem.has(HALT_KEY)).toBe(true);
    expect(h.alerts[0]).toMatch(/Panne pendant l'envoi/);
    expect([...h.mem.keys()].some((k) => k.endsWith(":intent"))).toBe(true);
  });

  it("verrou déjà pris : aucun appel", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.mem.set("barbusse:pricing:push-lock", "autre");
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("locked");
    expect(h.reads).toEqual([]);
  });

  it("le journal garde toutes les écritures, push-last un échantillon de 20", async () => {
    process.env.PRICING_PUSH_MODE = "dry";
    const run = await runPricingPush({ today: TODAY });
    const journal = JSON.parse(String(h.mem.get(`barbusse:pricing:push-journal:${run.at}`)));
    expect(journal.lines).toHaveLength(run.writes);
    expect(run.sample.length).toBeLessThanOrEqual(20);
  });

  it("mesure le régime quotidien : cibles du jour contre celles de la veille", () => {
    expect(countDailyChanges(null, { "2027-01-01": [470, 2] }, "2027-01-01")).toBeNull();
    expect(
      countDailyChanges(
        { "2027-01-01": [470, 2], "2027-01-02": [470, 2] },
        { "2027-01-01": [470, 2], "2027-01-02": [490, 2], "2027-01-03": [500, 2] },
        "2027-01-01",
      ),
    ).toBe(1);
  });

  it("live sans référence de bascule : rejet en bloc, rien n'est écrit (fail closed)", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    h.refDate = null;
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("rejected");
    expect(run.rejections[0]).toMatch(/Référence de bascule absente/);
    expect(h.writes).toHaveLength(0);
  });

  it("réel : le palier et la fin de bascule ne sont mémorisés qu'après une écriture réelle", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    const dry = await runPricingPush({ today: TODAY, forceDry: true });
    expect(dry.outcome).toBe("dry");
    expect(h.mem.has("barbusse:pricing:markdown:24h-moto-2027")).toBe(false);
    expect(h.mem.has("barbusse:pricing:cutover-done")).toBe(false);

    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("written");
    expect(JSON.parse(String(h.mem.get("barbusse:pricing:markdown:24h-moto-2027")))).toMatchObject({ step: 0, frozen: false });
    expect(h.mem.has("barbusse:pricing:cutover-done")).toBe(true);
  });

  it("réel : référence provisoire ou incomplète = rejet en bloc", async () => {
    const { referenceProblems } = await import("@/lib/pricing/push");
    expect(referenceProblems({ date: "2026-11-30", nights: {} }, TODAY)[0]).toMatch(/incomplète/);
    expect(referenceProblems({ date: "2026-11-30", nights: REF_NIGHTS, provisional: true }, TODAY)[0]).toMatch(/provisoire/);
    expect(referenceProblems({ date: "2026-11-30", nights: REF_NIGHTS }, TODAY)).toEqual([]);
  });

  it("une variable plus large que le garde-fou est ignorée et reste signalée même après écriture", async () => {
    process.env.PRICING_PUSH_MODE = "live";
    process.env.PRICING_MAX_CHANGE = "10";
    const run = await runPricingPush({ today: TODAY });
    expect(run.outcome).toBe("written");
    expect(run.warnings.some((w) => w.startsWith("PRICING_MAX_CHANGE=10 ignorée"))).toBe(true);
  });
});
