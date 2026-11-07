import type { PassKind, ProbeFinding, ReadinessProbe, Severity } from "@sejour/socle/lib/arrival-readiness/types";
import type { CozytouchWaterHeaterStatus } from "@/lib/types";
import { WATER_THRESHOLDS } from "./config";

export interface WaterHeaterProbeDeps {
  read(): Promise<CozytouchWaterHeaterStatus>;
  severityByPass: Record<PassKind, Severity>;
}

/** Passages où la réserve d'eau chaude est mesurée : juste avant l'arrivée, standard ou tardive. */
const LEVEL_PASSES: ReadonlySet<PassKind> = new Set(["final", "late"]);

/**
 * Sonde `waterHeater` de Barbusse (ballon thermodynamique Atlantic, Cozytouch), en lecture
 * seule.
 *
 * - **Chaque passage** : ballon joignable, sinon bloquant.
 * - **16h30, et une heure avant une arrivée tardive annoncée** : eau ≥ 50 °C (sonde du milieu,
 *   à défaut celle du bas) **ou** ≥ 60 % du ballon encore chaud.
 *
 * Le passage `late` mesure l'eau après 17 h : c'est sa raison d'être. Sans lui, une arrivée
 * à 23 h découvrirait le ballon vidé par la rotation de la journée. La règle « rien après
 * 17 h » vaut pour les températures des pièces, pas pour le ballon.
 */
export function createWaterHeaterProbe(deps: WaterHeaterProbeDeps): ReadinessProbe {
  return {
    kind: "waterHeater",
    async check(pass, booking) {
      if (booking === null) return [];
      const sev = deps.severityByPass[pass.kind];
      let status: CozytouchWaterHeaterStatus | null = null;
      try {
        status = await deps.read();
      } catch {
        status = null;
      }
      if (status === null || !status.isAvailable) {
        return [
          {
            id: "waterHeater:online",
            severity: sev,
            blocking: true,
            action: "Ballon d'eau chaude injoignable par Cozytouch : vérifier le Wi-Fi du ballon",
            status: "ko",
            unreachable: true,
          },
        ];
      }
      const findings: ProbeFinding[] = [
        { id: "waterHeater:online", severity: 1, blocking: false, action: "Ballon en ligne", status: "ok" },
      ];
      if (!LEVEL_PASSES.has(pass.kind)) return findings;

      const temp = status.middleTemperature ?? status.bottomTemperature;
      const ratio =
        status.remainingHotWater != null && status.capacity ? status.remainingHotWater / status.capacity : null;
      const hot =
        temp >= WATER_THRESHOLDS.minTemperatureC || (ratio !== null && ratio >= WATER_THRESHOLDS.minRemainingRatio);
      const pct = ratio !== null ? `, ${Math.round(ratio * 100)} % du ballon` : "";
      findings.push(
        hot
          ? { id: "waterHeater:level", severity: 1, blocking: false, action: `Eau chaude : ${temp} °C${pct}`, status: "ok" }
          : {
              id: "waterHeater:level",
              severity: 4,
              blocking: false,
              action: `Eau chaude insuffisante (${temp} °C${pct}) : lancer le Boost depuis le dashboard`,
              status: "ko",
            },
      );
      return findings;
    },
  };
}
