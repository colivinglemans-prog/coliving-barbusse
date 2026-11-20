/**
 * Session AJCloud de la page Vidéo : reprise sans reconnexion, une seule reconnexion quand le
 * cloud la refuse, jamais de boucle. Client et magasin simulés ; aucun vrai jeton.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
  getJson: async () => null,
  setJson: async () => {},
  getRedis: () => ({ del: async () => 1 }),
}));

import { AjCloud, AjCloudError, type AjCloudConfig, type AjSession } from "@/lib/camera/ajcloud";
import { withCameraSession, type SessionStore } from "@/lib/camera/session";

const config = { email: "camera@example.test", password: "mot-de-passe-de-test", region: "eu" as const };
const fake: AjSession = { agentToken: "agent", accessToken: "acces", signToken: "signe", uid: "u", countryCode: "IT", continentCode: "" };

function memoryStore(initial: AjSession | null) {
  let value = initial;
  const store: SessionStore & { value: () => AjSession | null } = {
    load: async () => value,
    save: async (s) => {
      value = s;
    },
    clear: async () => {
      value = null;
    },
    value: () => value,
  };
  return store;
}

function clientFactory() {
  const logins = vi.fn();
  const make = (c: AjCloudConfig) => {
    const client = new AjCloud(c);
    vi.spyOn(client, "login").mockImplementation(async () => {
      logins();
      client.restore({ ...fake, accessToken: "neuf" });
    });
    return client;
  };
  return { logins, make };
}

describe("withCameraSession", () => {
  it("sans session : une connexion, puis la session est gardée", async () => {
    const store = memoryStore(null);
    const { logins, make } = clientFactory();
    const out = await withCameraSession(config, async () => "ok", store, make);
    expect(out).toBe("ok");
    expect(logins).toHaveBeenCalledTimes(1);
    expect(store.value()?.accessToken).toBe("neuf");
  });

  it("session gardée : aucune connexion", async () => {
    const store = memoryStore(fake);
    const { logins, make } = clientFactory();
    for (let i = 0; i < 5; i++) await withCameraSession(config, async (c) => c.session()?.accessToken, store, make);
    expect(logins).not.toHaveBeenCalled();
  });

  it("session refusée par le cloud : une reconnexion, un seul nouvel essai", async () => {
    const store = memoryStore(fake);
    const { logins, make } = clientFactory();
    const run = vi.fn(async (c: AjCloud) => {
      if (c.session()?.accessToken === "acces") throw new AjCloudError("AJCloud POST uac → 401 expired");
      return "ok";
    });
    expect(await withCameraSession(config, run, store, make)).toBe("ok");
    expect(logins).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(2);
    expect(store.value()?.accessToken).toBe("neuf");
  });

  it("refus persistant : l'erreur remonte, sans boucle", async () => {
    const store = memoryStore(fake);
    const { logins, make } = clientFactory();
    const run = vi.fn(async () => {
      throw new AjCloudError("AJCloud en panne");
    });
    await expect(withCameraSession(config, run, store, make)).rejects.toThrow("AJCloud en panne");
    expect(logins).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it("erreur hors cloud (délai dépassé) : remonte sans reconnexion", async () => {
    const store = memoryStore(fake);
    const { logins, make } = clientFactory();
    await expect(withCameraSession(config, async () => { throw new Error("timeout"); }, store, make)).rejects.toThrow("timeout");
    expect(logins).not.toHaveBeenCalled();
    expect(store.value()).not.toBeNull();
  });
});
