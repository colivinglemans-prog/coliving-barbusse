import { parisClock } from "@sejour/socle/lib/arrival-readiness/schedule";
import type {
  PassKind,
  ProbeFinding,
  ReadinessBooking,
  ReadinessProbe,
  Severity,
} from "@sejour/socle/lib/arrival-readiness/types";
import { expectedHeatingMode, type StayDates } from "@/lib/heating-schedule";
import type { HeatzyMode, HeatzyZone } from "@/lib/types";
import { HEATING_THRESHOLDS } from "./config";

/** Un radiateur tel que lu au moment du passage. */
export interface HeatingReading {
  did: string;
  name: string;
  zone: Pick<HeatzyZone, "nightMode">;
  online: boolean;
  locked: boolean;
  unpaired: boolean;
  /** `null` : statut non demandé à ce passage, ou lecture ratée (`statusFailed`). */
  status: {
    /** Mode réel, `presence` quand `derog_mode` vaut 3. */
    mode: string;
    temperatureC: number | null;
    cftC: number | null;
    ecoC: number | null;
  } | null;
  statusFailed?: boolean;
}

export interface HeatingSnapshot {
  summer: boolean;
  devices: HeatingReading[];
}

export interface HeatingProbeDeps {
  /** `withStatus` : lire mode et températures (sinon la connectivité seule). */
  read(withStatus: boolean): Promise<HeatingSnapshot>;
  /** Températures relevées à 12h30, pour la montée de 15h30. */
  baseline: {
    get(bookingId: number): Promise<Record<string, number> | null>;
    /** Absent en `dryRun` : rien n'est écrit. */
    set?: (bookingId: number, temps: Record<string, number>) => Promise<void>;
  };
  severityByPass: Record<PassKind, Severity>;
}

const STATUS_PASSES: ReadonlySet<PassKind> = new Set(["noon", "preheat", "final"]);

const MODE_LABEL: Record<string, string> = {
  cft: "confort",
  eco: "éco",
  fro: "hors-gel",
  stop: "arrêt",
  presence: "présence",
};
const label = (mode: string) => MODE_LABEL[mode.startsWith("cft") ? "cft" : mode] ?? mode;

function sameMode(actual: string, expected: HeatzyMode): boolean {
  return expected === "cft" ? actual.startsWith("cft") : actual === expected;
}

function isActive(b: ReadinessBooking): boolean {
  return b.status === undefined || b.status === "confirmed";
}

const ok = (id: string, action: string): ProbeFinding => ({ id, severity: 1, blocking: false, action, status: "ok" });

/**
 * Sonde `heating` de Barbusse (radiateurs Heatzy), en lecture seule.
 *
 * - **Ignorés** : radiateurs `unpaired`, verrouillés, exclus (absents des
 *   zones), et tout le chauffage en mode été.
 * - **Chaque passage** : radiateur hors ligne → bloquant (gravité du passage : 5 à 16h30).
 * - **12h30, 15h30, 16h30** : mode réel = mode attendu (`expectedHeatingMode`, la même
 *   fonction que l'automatisation — éco en cas de rotation).
 * - **15h30** : +1 °C depuis 12h30, ou ≥ 14 °C. **16h30** : ≥ consigne du mode attendu − 3 °C.
 * - **Aucune température à partir de 17 h.**
 */
export function createHeatingProbe(deps: HeatingProbeDeps): ReadinessProbe {
  return {
    kind: "heating",
    async check(pass, booking, ctx) {
      if (booking === null) return [];
      const { date, minutes } = parisClock(pass.at);
      const withStatus = STATUS_PASSES.has(pass.kind) && minutes < HEATING_THRESHOLDS.noTemperatureFromMinutes;
      const snap = await deps.read(withStatus);
      if (snap.summer) return [ok("heating:summer", "Mode été : chauffage suspendu, rien à contrôler")];

      const sev = deps.severityByPass[pass.kind];
      const stays: StayDates[] = ctx.bookings.filter(isActive);
      const hour = Math.floor(minutes / 60);
      const devices = snap.devices.filter((d) => !d.unpaired && !d.locked);
      const findings: ProbeFinding[] = [];

      const baseline = pass.kind === "preheat" ? await deps.baseline.get(booking.bookingId) : null;
      const temps: Record<string, number> = {};

      for (const d of devices) {
        const offlineId = `heating:offline:${d.did}`;
        if (!d.online || d.statusFailed) {
          findings.push({
            id: offlineId,
            severity: sev,
            blocking: true,
            action: d.online
              ? `${d.name} : statut illisible, vérifier le radiateur depuis le dashboard`
              : `${d.name} : radiateur hors ligne, vérifier le branchement ou le Wi-Fi`,
            status: "ko",
            unreachable: true,
          });
          continue;
        }
        findings.push(ok(offlineId, `${d.name} en ligne`));
        if (!withStatus || d.status === null) continue;

        const expected = expectedHeatingMode(stays, date, hour, d.zone).mode;
        if (expected !== null) {
          const modeId = `heating:mode:${d.did}`;
          findings.push(
            sameMode(d.status.mode, expected)
              ? ok(modeId, `${d.name} en ${label(expected)}`)
              : {
                  id: modeId,
                  severity: sev,
                  blocking: true,
                  action: `${d.name} en ${label(d.status.mode)} au lieu de ${label(expected)} : relancer l'automatisation ou forcer le mode depuis le dashboard`,
                  status: "ko",
                },
          );
        }

        const t = d.status.temperatureC;
        if (t === null) continue;
        temps[d.did] = t;
        const tempId = `heating:temp:${d.did}`;
        if (pass.kind === "preheat") {
          const base = baseline?.[d.did];
          const rose = base !== undefined && t - base >= HEATING_THRESHOLDS.preheatRiseC;
          findings.push(
            rose || t >= HEATING_THRESHOLDS.preheatFloorC
              ? ok(tempId, `${d.name} à ${t} °C`)
              : {
                  id: tempId,
                  severity: 3,
                  blocking: false,
                  action: `${d.name} à ${t} °C${base !== undefined ? ` (${base} °C à 12h30)` : ""} : ne monte pas, vérifier qu'il chauffe`,
                  status: "ko",
                },
          );
        }
        if (pass.kind === "final" && expected !== null) {
          const target = expected === "cft" ? d.status.cftC : expected === "eco" ? d.status.ecoC : null;
          if (target !== null) {
            const floor = target - HEATING_THRESHOLDS.finalBelowTargetC;
            findings.push(
              t >= floor
                ? ok(tempId, `${d.name} à ${t} °C`)
                : {
                    id: tempId,
                    severity: 4,
                    blocking: false,
                    action: `${d.name} à ${t} °C pour une consigne de ${target} °C : pièce froide à l'arrivée, vérifier le radiateur`,
                    status: "ko",
                  },
            );
          }
        }
      }

      if (pass.kind === "noon" && deps.baseline.set && Object.keys(temps).length > 0) {
        await deps.baseline.set(booking.bookingId, temps);
      }
      return findings;
    },
  };
}
