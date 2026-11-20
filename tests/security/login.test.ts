import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Connexion au dashboard (socle v3.31.0) : 5 échecs par IP en 15 min, puis 429 ; une seule
 * alerte ntfy au franchissement. Redis absent : magasin en mémoire. Aucun appel réseau.
 */
const ntfy = vi.fn(async (_message: string, _options?: unknown) => {});
vi.mock("@/lib/ntfy", () => ({ sendNtfy: (m: string, o?: unknown) => ntfy(m, o) }));
vi.mock("@/lib/redis", () => ({
  hasRedis: () => false,
  getRedis: () => {
    throw new Error("Redis ne doit pas être lu sans variables");
  },
  redisKey: (...p: Array<string | number>) => ["barbusse", ...p].join(":"),
}));
vi.mock("@sejour/socle/lib/auth-cookie", () => ({ setAuthCookie: vi.fn(async () => {}) }));

const login = (password: string, ip: string) =>
  new Request("https://www.coliving-barbusse.fr/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ password }),
  });

beforeEach(() => {
  vi.stubEnv("DASHBOARD_SECRET", "secret-de-test-assez-long-pour-hs256-0123456789");
  vi.stubEnv("DASHBOARD_PASSWORD", "le-bon-mot-de-passe");
  ntfy.mockClear();
});

describe("POST /api/auth/login", () => {
  it("bon mot de passe : 200, rôle admin, champ success lu par la page", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const res = await POST(login("le-bon-mot-de-passe", "203.0.113.1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, role: "admin" });
  });

  it("5 échecs = 401 (champ error), le 6e = 429 même avec le bon mot de passe, une seule alerte", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) {
      const res = await POST(login("faux", ip));
      expect(res.status).toBe(401);
      expect((await res.json()).error).toBe("Mot de passe incorrect");
    }
    const bloque = await POST(login("le-bon-mot-de-passe", ip));
    expect(bloque.status).toBe(429);
    expect(bloque.headers.get("Retry-After")).toBeTruthy();
    expect((await bloque.json()).error).toBeTruthy();
    expect(ntfy).toHaveBeenCalledTimes(1);
    expect(ntfy.mock.calls[0][0]).toContain(ip);

    // Une autre adresse n'est pas touchée.
    expect((await POST(login("le-bon-mot-de-passe", "203.0.113.10"))).status).toBe(200);
  });
});
