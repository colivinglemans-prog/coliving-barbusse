/**
 * Règle commune des alertes (2026-11-10) : deux passages KO de suite avant d'alerter, pas de
 * répétition à gravité égale, rétablissement en priorité 1 seulement après une alerte.
 * Redis remplacé par une table en mémoire ; données inventées.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
let redisDown = false;
vi.mock("@/lib/redis", () => ({
  getRedis: () => {
    throw new Error("pas de client Redis dans ce test");
  },
  redisKey: (...parts: Array<string | number>) => ["barbusse", ...parts].join(":"),
  getJson: async (key: string) => {
    if (redisDown) throw new Error("Redis injoignable");
    return store.get(key) ?? null;
  },
  setJson: async (key: string, value: unknown) => {
    if (redisDown) throw new Error("Redis injoignable");
    store.set(key, JSON.parse(JSON.stringify(value)));
  },
}));
// `access-sync` importe le client Redis et Beds24 au chargement : on ne garde que la fonction pure.
vi.mock("@/lib/beds24", () => ({}));

import { reportAlerts, reportCronRun, type TrackedAlert } from "@/lib/alert-memory";
import { trackSyncAlerts, type SyncAlert } from "@/lib/access-sync";

type Sent = { subject: string; body: string; priority: number };
let sent: Sent[];
const send = async (subject: string, body: string, priority: 1 | 2 | 3 | 4 | 5) => {
  sent.push({ subject, body, priority });
};
const OPTS = { title: () => "Serrure", recoveredTitle: "Serrure revenue" };
const offline: TrackedAlert = { id: "lock:0", priority: 4, line: "La serrure est hors ligne." };

beforeEach(() => {
  store.clear();
  redisDown = false;
  sent = [];
});

describe("reportAlerts", () => {
  it("un relevé hors ligne isolé puis le retour : aucune notification", async () => {
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("none");
    expect(await reportAlerts("t", [], send, OPTS)).toBe("none");
    expect(sent).toEqual([]);
  });

  it("deux relevés de suite : une alerte, puis plus rien, puis le retour en priorité 1", async () => {
    await reportAlerts("t", [offline], send, OPTS);
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("open");
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("persist");
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("persist");
    expect(await reportAlerts("t", [], send, OPTS)).toBe("recover");
    expect(sent).toEqual([
      { subject: "Serrure", body: "La serrure est hors ligne.", priority: 4 },
      { subject: "Serrure revenue", body: "Plus aucune alerte en cours.", priority: 1 },
    ]);
  });

  it("le texte qui change ne fait pas repartir l'alerte ; la gravité qui monte, si", async () => {
    const a = (priority: 3 | 5, line: string): TrackedAlert => ({ id: "pin:42", priority, line });
    await reportAlerts("t", [a(3, "PIN manquant à J-3")], send, OPTS);
    await reportAlerts("t", [a(3, "PIN manquant à J-3")], send, OPTS);
    expect(await reportAlerts("t", [a(3, "PIN manquant à J-2 (autre texte)")], send, OPTS)).toBe("persist");
    expect(await reportAlerts("t", [a(5, "PIN manquant le jour même")], send, OPTS)).toBe("escalate");
    expect(sent.map((s) => s.priority)).toEqual([3, 5]);
  });

  it("Redis injoignable : la confirmation est levée, l'alerte part à chaque passage", async () => {
    redisDown = true;
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("open");
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("open");
    expect(sent).toHaveLength(2);
  });

  it("envoi raté (ntfy en panne) : l'alerte repart au passage suivant", async () => {
    const failing = async () => {
      throw new Error("ntfy 502");
    };
    await reportAlerts("t", [offline], send, OPTS);
    await expect(reportAlerts("t", [offline], failing, OPTS)).rejects.toThrow("ntfy 502");
    expect(await reportAlerts("t", [offline], send, OPTS)).toBe("open");
    expect(sent).toHaveLength(1);
  });

  it("rétablissement raté : il repart au passage suivant", async () => {
    await reportAlerts("t", [offline], send, OPTS);
    await reportAlerts("t", [offline], send, OPTS);
    await expect(
      reportAlerts("t", [], async () => { throw new Error("ntfy 502"); }, OPTS),
    ).rejects.toThrow();
    expect(await reportAlerts("t", [], send, OPTS)).toBe("recover");
  });

  it("confirmAfter: 1 alerte dès le premier passage", async () => {
    expect(await reportAlerts("t", [offline], send, { ...OPTS, confirmAfter: 1 })).toBe("open");
  });
});

describe("reportCronRun", () => {
  it("1 erreur : rien ; 2 erreurs : une alerte ; succès : retour en priorité 1", async () => {
    await reportCronRun("cron-x", "Cron X", send, "timeout");
    expect(sent).toEqual([]);
    await reportCronRun("cron-x", "Cron X", send, "HTTP 502");
    await reportCronRun("cron-x", "Cron X", send, "autre erreur");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ subject: "Erreur Cron X", priority: 4 });
    expect(sent[0].body).toContain("HTTP 502");
    await reportCronRun("cron-x", "Cron X", send, null);
    expect(sent[1]).toMatchObject({ subject: "Cron X : de nouveau sans erreur", priority: 1 });
  });

  it("une erreur isolée entre deux succès : rien du tout", async () => {
    await reportCronRun("cron-y", "Cron Y", send, null);
    await reportCronRun("cron-y", "Cron Y", send, "timeout");
    await reportCronRun("cron-y", "Cron Y", send, null);
    expect(sent).toEqual([]);
  });
});

describe("trackSyncAlerts", () => {
  it("sépare la serrure des codes, identifiants sans le message", () => {
    const alerts: SyncAlert[] = [
      { kind: "lock", bookingId: 0, severity: "high", message: "La serrure est hors ligne pour Nuki." },
      { kind: "execution", step: "create", bookingId: 90000010, severity: "high", message: "Réservation 90000010 : échec — HTTP 503" },
    ];
    const { lock, codes } = trackSyncAlerts(alerts);
    expect(lock).toEqual([{ id: "lock:0", priority: 4, line: "La serrure est hors ligne pour Nuki." }]);
    expect(codes.map((c) => c.id)).toEqual(["execution:90000010:create"]);
  });
});
