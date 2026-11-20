import { describe, it, expect, beforeEach, vi } from "vitest";

// Redis simulé en mémoire : un hash = une Map de champ → chaîne JSON.
const hash = new Map<string, string>();
const mockRedis = {
  async hgetall() {
    return hash.size ? (Object.fromEntries(hash) as Record<string, unknown>) : null;
  },
  async hset(_key: string, obj: Record<string, string>) {
    for (const [k, v] of Object.entries(obj)) hash.set(k, v);
  },
  async hdel(_key: string, ...fields: string[]) {
    for (const f of fields) hash.delete(f);
  },
};
vi.mock("@/lib/redis", () => ({
  getRedis: () => mockRedis,
  redisKey: (...parts: Array<string | number>) => ["barbusse", ...parts].join(":"),
}));

import { loadSessions, upsertSessions, pruneOldSessions, sessionKey } from "@/lib/cleaning/store";
import type { CleaningSession } from "@/lib/cleaning/sessions";

function sess(who: string, arrivalIso: string, exitMinutes: number | null): CleaningSession {
  const arrival = new Date(arrivalIso);
  const exit = exitMinutes !== null ? new Date(arrival.getTime() + exitMinutes * 60000) : null;
  return {
    who,
    arrival,
    exitEstimate: exit,
    exitBy: exit ? "camera" : "inconnu",
    arrivalSource: "garage",
    minutes: exitMinutes,
  };
}

beforeEach(() => hash.clear());

describe("sessionKey", () => {
  it("clé stable = who:arrivalMs", () => {
    const d = new Date("2026-11-04T15:11:00Z");
    expect(sessionKey("Alice", d)).toBe(`Alice:${d.getTime()}`);
  });
});

describe("upsert + load", () => {
  it("stocke puis relit une session (minutes recalculées)", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 120)]);
    const got = await loadSessions();
    expect(got).toHaveLength(1);
    expect(got[0].who).toBe("Alice");
    expect(got[0].minutes).toBe(120);
  });

  it("la sortie PROGRESSE : une estimation plus tardive remplace", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 60)]);
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 120)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("ne RÉGRESSE jamais : une sortie plus tôt n'écrase pas", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 120)]);
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 30)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("ne remplace JAMAIS une sortie connue par null (la perte corrigée)", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 120)]);
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", null)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("première sortie connue après un null : enregistrée", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", null)]);
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 90)]);
    expect((await loadSessions())[0].minutes).toBe(90);
  });

  it("deux personnes, deux arrivées = deux entrées distinctes", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 60), sess("Bruno", "2026-11-04T14:00:00Z", 30)]);
    const got = await loadSessions();
    expect(got.map((s) => s.who).sort()).toEqual(["Alice", "Bruno"]);
    expect(got[0].arrival.getTime()).toBeGreaterThan(got[1].arrival.getTime()); // plus récent d'abord
  });
});

describe("une venue, un champ (source manquante à un passage)", () => {
  it("porte 9 h 00, puis garage 9 h 20 seul : une seule session, à 9 h 00", async () => {
    await upsertSessions([{ ...sess("Alice", "2026-11-04T09:00:00Z", 60), arrivalSource: "porte" }]);
    await upsertSessions([sess("Alice", "2026-11-04T09:20:00Z", 150)]);
    expect(hash.size).toBe(1);
    const [only] = await loadSessions();
    expect(only.arrival.toISOString()).toBe("2026-11-04T09:00:00.000Z");
    expect(only.arrivalSource).toBe("porte");
    expect(only.minutes).toBe(170); // sortie 11 h 50, la plus tardive
  });

  it("garage 9 h 20 seul, puis porte 9 h 00 : le champ passe à 9 h 00, l'ancien est retiré", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:20:00Z", 60)]);
    await upsertSessions([{ ...sess("Alice", "2026-11-04T09:00:00Z", null), arrivalSource: "porte" }]);
    expect([...hash.keys()]).toEqual([sessionKey("Alice", new Date("2026-11-04T09:00:00Z"))]);
    const [only] = await loadSessions();
    expect(only.minutes).toBe(80); // la sortie connue (10 h 20) est gardée
  });

  it("deux venues à plus de 45 min : deux sessions", async () => {
    await upsertSessions([sess("Alice", "2026-11-04T09:00:00Z", 30)]);
    await upsertSessions([sess("Alice", "2026-11-04T14:00:00Z", 30)]);
    expect(await loadSessions()).toHaveLength(2);
  });

  it("doublons déjà écrits : fusionnés à la lecture", async () => {
    hash.set("a", JSON.stringify({ who: "Alice", arrival: "2026-11-04T09:00:00.000Z", exit: "2026-11-04T10:00:00.000Z", by: "camera", source: "porte" }));
    hash.set("b", JSON.stringify({ who: "Alice", arrival: "2026-11-04T09:20:00.000Z", exit: "2026-11-04T11:00:00.000Z", by: "camera", source: "garage" }));
    const got = await loadSessions();
    expect(got).toHaveLength(1);
    expect(got[0].minutes).toBe(120);
  });
});

describe("pruneOldSessions", () => {
  it("retire les passages de plus de 18 mois", async () => {
    await upsertSessions([
      sess("Bruno", "2024-01-01T09:00:00Z", 60),
      sess("Alice", "2026-11-04T09:00:00Z", 60),
    ]);
    const removed = await pruneOldSessions(Date.parse("2026-11-14T00:00:00Z"));
    expect(removed).toBe(1);
    expect((await loadSessions()).map((s) => s.who)).toEqual(["Alice"]);
  });
});
