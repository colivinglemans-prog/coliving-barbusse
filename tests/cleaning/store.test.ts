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
    expect(sessionKey("Sophie", d)).toBe(`Sophie:${d.getTime()}`);
  });
});

describe("upsert + load", () => {
  it("stocke puis relit une session (minutes recalculées)", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 120)]);
    const got = await loadSessions();
    expect(got).toHaveLength(1);
    expect(got[0].who).toBe("Sophie");
    expect(got[0].minutes).toBe(120);
  });

  it("la sortie PROGRESSE : une estimation plus tardive remplace", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 60)]);
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 120)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("ne RÉGRESSE jamais : une sortie plus tôt n'écrase pas", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 120)]);
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 30)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("ne remplace JAMAIS une sortie connue par null (la perte corrigée)", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 120)]);
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", null)]);
    expect((await loadSessions())[0].minutes).toBe(120);
  });

  it("première sortie connue après un null : enregistrée", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", null)]);
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 90)]);
    expect((await loadSessions())[0].minutes).toBe(90);
  });

  it("deux personnes, deux arrivées = deux entrées distinctes", async () => {
    await upsertSessions([sess("Sophie", "2026-11-04T09:00:00Z", 60), sess("Eric", "2026-11-04T14:00:00Z", 30)]);
    const got = await loadSessions();
    expect(got.map((s) => s.who).sort()).toEqual(["Eric", "Sophie"]);
    expect(got[0].arrival.getTime()).toBeGreaterThan(got[1].arrival.getTime()); // plus récent d'abord
  });
});

describe("pruneOldSessions", () => {
  it("retire les passages de plus de 18 mois", async () => {
    await upsertSessions([
      sess("Eric", "2024-01-01T09:00:00Z", 60),
      sess("Sophie", "2026-11-04T09:00:00Z", 60),
    ]);
    const removed = await pruneOldSessions(Date.parse("2026-11-14T00:00:00Z"));
    expect(removed).toBe(1);
    expect((await loadSessions()).map((s) => s.who)).toEqual(["Sophie"]);
  });
});
