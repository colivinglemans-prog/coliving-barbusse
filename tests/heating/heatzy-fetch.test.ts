/**
 * Client Heatzy : un 401 vide le jeton en cache, reconnecte et réessaie **une** fois ; chaque
 * appel part avec un délai d'expiration. `fetch` simulé, aucun appel réel ; données inventées.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/redis", () => ({ getRedis: () => ({}) }));

type Call = { url: string; init: RequestInit };
let calls: Call[] = [];
let devdataStatuses: number[] = [];

function respond(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.resetModules();
  calls = [];
  process.env.HEATZY_EMAIL = "test@example.test";
  process.env.HEATZY_PASSWORD = "mot-de-passe-de-test";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith("/app/login")) return respond(200, { token: `jeton-${calls.length}` });
      const status = devdataStatuses.shift() ?? 200;
      return respond(status, status === 200 ? { attr: { mode: "eco" } } : { error_message: "token invalid" });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("heatzyFetch", () => {
  it("401 : nouveau login et un seul réessai, avec le nouveau jeton", async () => {
    const { getDeviceStatus } = await import("@/lib/heatzy");
    devdataStatuses = [200, 401, 200];
    await getDeviceStatus("did-test"); // login + lecture
    await getDeviceStatus("did-test"); // 401 → login → réessai
    const urls = calls.map((c) => c.url.replace("https://euapi.gizwits.com", ""));
    expect(urls).toEqual([
      "/app/login",
      "/app/devdata/did-test/latest",
      "/app/devdata/did-test/latest",
      "/app/login",
      "/app/devdata/did-test/latest",
    ]);
    const tokens = calls.filter((c) => c.url.includes("devdata")).map((c) => (c.init.headers as Record<string, string>)["X-Gizwits-User-token"]);
    expect(tokens[2]).not.toBe(tokens[1]);
  });

  it("deux 401 de suite : l'erreur remonte, pas de boucle", async () => {
    const { getDeviceStatus } = await import("@/lib/heatzy");
    devdataStatuses = [401, 401, 401];
    await expect(getDeviceStatus("did-test")).rejects.toThrow(/401/);
    expect(calls.filter((c) => c.url.endsWith("/app/login"))).toHaveLength(2);
    expect(calls.filter((c) => c.url.includes("devdata"))).toHaveLength(2);
  });

  it("chaque appel porte un délai d'expiration", async () => {
    const { getDeviceStatus } = await import("@/lib/heatzy");
    devdataStatuses = [200];
    await getDeviceStatus("did-test");
    for (const c of calls) expect(c.init.signal).toBeInstanceOf(AbortSignal);
  });
});
