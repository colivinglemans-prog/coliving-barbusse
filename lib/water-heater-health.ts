import { getExpectedSettings, plausibleMiddle } from "./cozytouch";
import type { CozytouchWaterHeaterStatus } from "./types";

/**
 * Contrôle du ballon : ce qui cloche **maintenant**, chaque constat avec un identifiant stable.
 *
 * Depuis le 2026-11-09 (coupures à 9 kVA), le contrôle juge contre **la décision mémorisée** par
 * l'automation (`barbusse:water-heater:booster`) au lieu de la recalculer : une seconde lecture
 * des radiateurs pourrait conclure autrement. Sans décision récente, l'appoint compte comme
 * non permis.
 *
 * - **Appoint non permis** : le ballon doit être en PAC seule (`manualEcoActive`), boost coupé.
 *   Un autre mode ou un boost actif, c'est l'appoint de 1 800 W qui peut tourner : alerte.
 * - **Appoint permis** : l'automation l'autorise, elle ne l'exige pas ; rien n'est signalé sur le
 *   mode ou le boost.
 * - **PAC à l'arrêt** (`heatPumpStalled`) : compteur immobile depuis une heure, eau sous la
 *   consigne. En PAC seule, plus rien ne chauffe le thermo : c'est le ballon classique qui porte
 *   tout.
 *
 * `confirmedIssues` : un constat n'est signalé que s'il était déjà là au contrôle précédent. Une
 * bascule que l'automation applique dans le quart d'heure ne survit pas ; une panne, si.
 */
export interface HealthIssue {
  id: string;
  message: string;
}

export type HealthStatus = Pick<
  CozytouchWaterHeaterStatus,
  "isAvailable" | "mode" | "targetTemperature" | "boostActive" | "middleTemperature" | "bottomTemperature"
>;

export function waterHeaterIssues(
  guests: number,
  status: HealthStatus,
  boosterAllowed: boolean,
  stalled: boolean,
): HealthIssue[] {
  if (!status.isAvailable) {
    return [{ id: "offline", message: "Ballon thermodynamique hors ligne (aucun état remonté)." }];
  }

  const issues: HealthIssue[] = [];
  const expected = getExpectedSettings(guests, boosterAllowed);

  if (!boosterAllowed) {
    if (status.mode !== "manualEcoActive") {
      issues.push({
        id: "booster-mode",
        message: `Appoint électrique possible alors qu'il n'est pas permis : mode ${status.mode} au lieu de manualEcoActive (PAC seule).`,
      });
    }
    if (status.boostActive) {
      issues.push({ id: "boost-on", message: "Boost actif alors que l'appoint n'est pas permis (1 800 W en plus)." });
    }
  }
  if (status.targetTemperature !== expected.targetTemperature) {
    issues.push({
      id: "target",
      message: `Consigne divergente : attendue ${expected.targetTemperature}°C, constatée ${status.targetTemperature}°C.`,
    });
  }
  if (stalled) {
    const water = plausibleMiddle(status) ?? status.bottomTemperature;
    issues.push({
      id: "pac-stalled",
      message: `PAC à l'arrêt depuis au moins une heure : eau à ${water}°C pour une consigne de ${status.targetTemperature}°C. Le ballon classique fournit seul l'eau chaude.`,
    });
  }
  if (plausibleMiddle(status) == null) {
    issues.push({
      id: "middle-missing",
      message: `Sonde du milieu absente ou aberrante (${status.middleTemperature ?? "—"}) : l'appoint ne peut être décidé que sur une PAC à l'arrêt.`,
    });
  }

  return issues;
}

/** Les constats déjà présents au contrôle précédent : seuls ceux-là partent en alerte. */
export function confirmedIssues(current: readonly HealthIssue[], previousIds: readonly string[]): HealthIssue[] {
  const previous = new Set(previousIds);
  return current.filter((i) => previous.has(i.id));
}
