/**
 * Contrôles fonctionnels du pricing après publication — `npm run test:deploy`.
 *
 * Les portes (401/403) sont dans `site.ts`, contrôlées en CI. Ce fichier va plus loin : il
 * appelle les crons du pricing **en mode à blanc** (`?dry=1`), ce qui exige `CRON_SECRET`. La CI
 * ne l'a pas (secret de production) : la suite est alors sautée, et elle tourne **en local après
 * chaque déploiement** (`npm run test:deploy`, `.env.local` chargé par le shell ou exporté).
 *
 * Rien n'est écrit dans Beds24 : `?dry=1` force le calcul à blanc quel que soit
 * `PRICING_PUSH_MODE`, et ne touche ni au dernier passage affiché ni aux cibles de la veille.
 */
import { describe, expect, it } from "vitest";
import { SITE_URL } from "@/lib/site";

const BASE = (process.env.DEPLOY_BASE_URL || SITE_URL).replace(/\/$/, "");
const SECRET = process.env.CRON_SECRET;
const auth = { Authorization: `Bearer ${SECRET}` };

describe.skipIf(!SECRET)("pricing après publication (CRON_SECRET requis)", () => {
  it("le relevé quotidien lit 365 jours de calendrier", async () => {
    const r = await fetch(`${BASE}/api/cron/pricing-snapshot?dry=1`, { headers: auth });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.success).toBe(true);
    expect(body.days).toBeGreaterThanOrEqual(360);
  }, 60_000);

  it("l'envoi des prix calcule à blanc sans rejet ni écart", async () => {
    const r = await fetch(`${BASE}/api/cron/pricing-push?dry=1`, { headers: auth });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.mode).toBe("dry");
    expect(["dry", "nothing", "locked"]).toContain(body.outcome);
    // Bornes absolues et planchers d'événement : une violation est une erreur de grille à corriger.
    expect(body.rejectionsDetail?.filter((r: string) => !/maximum autorisé/.test(r)) ?? []).toEqual([]);
    expect(body.mismatches).toBe(0);
  }, 90_000);

  it("le rapport hebdomadaire se calcule (sans envoi)", async () => {
    const r = await fetch(`${BASE}/api/cron/pricing-report?dry=1`, { headers: auth });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.success).toBe(true);
    expect(typeof body.message).toBe("string");
  }, 90_000);

  it("refuse un Bearer faux", async () => {
    const r = await fetch(`${BASE}/api/cron/pricing-push?dry=1`, { headers: { Authorization: "Bearer faux" } });
    expect(r.status).toBe(401);
  });
});
