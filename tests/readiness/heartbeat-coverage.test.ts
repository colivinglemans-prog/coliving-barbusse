/**
 * Chaque route de `app/api/cron/` bat (`beat("<nom>", …)`) et figure dans `EXPECTED_CRONS`, ou
 * est exemptée avec un motif dans `HEARTBEAT_EXEMPT`. Un cron ajouté sans battement fait échouer
 * ce test : sa panne serait muette.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { EXPECTED_CRONS, HEARTBEAT_EXEMPT } from "@/lib/heartbeat";
import { NO_DRY_MODE } from "@/lib/cron-params";

const SURVEILLANCE_DOC = readFileSync(fileURLToPath(new URL("../../docs/surveillance.md", import.meta.url)), "utf8");

const CRON_DIR = fileURLToPath(new URL("../../app/api/cron/", import.meta.url));
const routes = readdirSync(CRON_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(`${CRON_DIR}${d.name}/route.ts`))
  .map((d) => d.name)
  .sort();
const expected = new Map<string, number>(EXPECTED_CRONS.map((c) => [c.name, c.maxAgeMinutes]));
const source = (name: string) => readFileSync(`${CRON_DIR}${name}/route.ts`, "utf8");

describe("battement de cœur : couverture des crons", () => {
  it("les routes sont bien lues", () => {
    expect(routes.length).toBeGreaterThan(15);
  });

  it.each(routes)("%s : battement ou exemption motivée", (name) => {
    const exempt = HEARTBEAT_EXEMPT[name];
    if (exempt !== undefined) {
      expect(expected.has(name), "exempté et surveillé à la fois").toBe(false);
      expect(exempt.trim().length, "exemption sans motif").toBeGreaterThan(20);
      return;
    }
    expect(expected.has(name), "absent de EXPECTED_CRONS").toBe(true);
    expect(source(name)).toContain(`beat("${name}",`);
  });

  it.each(routes)("%s : `maxDuration` déclaré (60 s au plus, plafond du plan Hobby)", (name) => {
    const m = /export const maxDuration = (\d+);/.exec(source(name));
    expect(m, "maxDuration absent").not.toBeNull();
    expect(Number(m![1])).toBeLessThanOrEqual(60);
  });

  it.each(routes)("%s : mode à blanc par isDryRun, ou listé dans NO_DRY_MODE et dans la doc", (name) => {
    const hasDry = source(name).includes("isDryRun(");
    const listed = (NO_DRY_MODE as readonly string[]).includes(name);
    expect(hasDry !== listed, hasDry ? "mode à blanc présent mais listé sans" : "sans mode à blanc et non listé").toBe(true);
    if (listed) expect(SURVEILLANCE_DOC).toContain("`" + name + "`");
  });

  it("aucun cron attendu sans route, aucune exemption orpheline", () => {
    for (const name of expected.keys()) expect(routes).toContain(name);
    for (const name of Object.keys(HEARTBEAT_EXEMPT)) expect(routes).toContain(name);
  });

  it("tolérances : au moins la cadence, jamais plus de 8 jours", () => {
    for (const c of EXPECTED_CRONS) {
      expect(c.maxAgeMinutes).toBeGreaterThanOrEqual(30);
      expect(c.maxAgeMinutes).toBeLessThanOrEqual(8 * 24 * 60);
    }
    expect(expected.get("water-heater-automation")).toBe(45);
  });
});
