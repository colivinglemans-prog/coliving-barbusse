import { describe, expect, it } from "vitest";
import { addDays } from "@sejour/socle/lib/dates";
import { todayParis } from "@sejour/socle/lib/time";
import { LE_MANS_EVENTS } from "@/lib/events";
import { ENGINE_CONFIG } from "@/lib/pricing/engine-config";
import { eventFloorOn } from "@/lib/pricing/guards";
import { PUSH_HORIZON_DAYS } from "@/lib/pricing/push";

/**
 * Tout grand événement qui entre dans l'horizon d'envoi doit avoir un plancher dans les
 * garde-fous (relecture Fable) : sans lui, une grille fausse pourrait le brader. Ce test
 * **s'appuie sur la date du jour** exprès : il se mettra à échouer quand les événements 2028
 * entreront dans l'horizon (mi-2027), ce qui est l'alerte voulue — ajouter leurs planchers dans
 * `lib/pricing/guards.ts`.
 */
const keyPrefix = (key: string) => key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "");

describe("planchers des grands événements", () => {
  it("couvrent chaque nuit de grand événement dans l'horizon d'envoi", () => {
    const today = todayParis();
    const horizonEnd = addDays(today, PUSH_HORIZON_DAYS - 1);
    const missing: string[] = [];
    for (const e of LE_MANS_EVENTS) {
      if (!ENGINE_CONFIG.majorEvents.some((r) => r.keyPrefix === keyPrefix(e.key))) continue;
      if (e.end < today || e.start > horizonEnd) continue;
      for (let d = e.start; d <= e.end; d = addDays(d, 1)) {
        if (!eventFloorOn(d)) missing.push(`${e.key} ${d}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
