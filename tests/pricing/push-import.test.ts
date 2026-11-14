import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * « Une seule porte d'écriture des prix » (plan du 2026-11-14) : seul `lib/pricing/push.ts`
 * importe `writeCalendar`, et la voie `tarifs` n'est nommée que dans `lib/beds24.ts`. Un module
 * qui s'en servirait ailleurs contournerait les garde-fous.
 */
const ROOT = join(__dirname, "..", "..");
const SCAN = ["app", "lib", "components", "scripts"];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}

const all = SCAN.flatMap((d) => files(join(ROOT, d))).map((p) => ({
  path: relative(ROOT, p).replace(/\\/g, "/"),
  text: readFileSync(p, "utf8"),
}));

describe("porte unique d'écriture des prix", () => {
  it("seul lib/pricing/push.ts importe writeCalendar", () => {
    const users = all.filter((f) => /\bwriteCalendar\b/.test(f.text)).map((f) => f.path).sort();
    expect(users).toEqual(["lib/beds24.ts", "lib/pricing/push.ts"]);
  });

  it("updateCalendar (socle) n'est appelé que par lib/beds24.ts", () => {
    const users = all.filter((f) => /\bupdateCalendar\b/.test(f.text)).map((f) => f.path);
    expect(users).toEqual(["lib/beds24.ts"]);
  });

  it("le jeton des tarifs n'est lu que par lib/beds24.ts", () => {
    const readers = all.filter((f) => /process\.env\.BEDS24_PRICING_REFRESH_TOKEN/.test(f.text)).map((f) => f.path);
    expect(readers).toEqual(["lib/beds24.ts"]);
  });

  it("la voie « tarifs » n'est nommée que dans lib/beds24.ts (et comme libellé du keepalive)", () => {
    const users = all.filter((f) => /["']tarifs["']/.test(f.text)).map((f) => f.path).sort();
    // Le keepalive n'emploie « tarifs » que comme libellé d'alerte : il passe par
    // refreshBeds24PricingToken, jamais par la voie elle-même.
    expect(users).toEqual(["app/api/cron/beds24-keepalive/route.ts", "lib/beds24.ts"]);
    const keepalive = all.find((f) => f.path === "app/api/cron/beds24-keepalive/route.ts")!;
    expect(keepalive.text).not.toMatch(/writeCalendar|updateCalendar/);
  });

  it("aucune route du dashboard n'importe le module d'envoi, sauf pour le coupe-circuit", () => {
    const dashboard = all.filter((f) => f.path.startsWith("app/api/dashboard/") && /pricing\/push/.test(f.text));
    expect(dashboard.map((f) => f.path)).toEqual(["app/api/dashboard/pricing/halt/route.ts"]);
    expect(dashboard[0].text).not.toMatch(/runPricingPush|writeCalendar/);
  });
});
