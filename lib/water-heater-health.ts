import { getExpectedSettings, plausibleMiddle } from "./cozytouch";
import type { CozytouchWaterHeaterStatus } from "./types";

/**
 * Contrôle du ballon : ce qui cloche **maintenant**, chaque constat avec un identifiant stable.
 *
 * Depuis le 2026-11-09 (coupures à 9 kVA) : Éco 55 °C, jamais de boost, **Absence aux heures de
 * pic** (`PEAK_WINDOWS`) quand des voyageurs sont là. Le contrôle compare à ces réglages,
 * recalculés à la même heure que l'automation.
 *
 * - **Absence manquante au pic** : l'appoint peut tourner en plein pic → alerte.
 * - **Absence restée hors pic** : le thermo ne chauffe plus du tout → alerte (douches froides).
 * - **Boost actif**, **mode** autre qu'Éco, **consigne** divergente : alerte.
 * - **PAC à l'arrêt** (`heatPumpStalled`) : le thermo compense par l'appoint, au triple du prix.
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
  | "isAvailable"
  | "mode"
  | "targetTemperature"
  | "boostActive"
  | "absenceActive"
  | "middleTemperature"
  | "bottomTemperature"
>;

export function waterHeaterIssues(
  guests: number,
  hour: number,
  minute: number,
  status: HealthStatus,
  stalled: boolean,
): HealthIssue[] {
  if (!status.isAvailable) {
    return [{ id: "offline", message: "Ballon thermodynamique hors ligne (aucun état remonté)." }];
  }

  const issues: HealthIssue[] = [];
  const expected = getExpectedSettings(guests, hour, minute);
  const absence = status.absenceActive ?? false;

  if (expected.absence && !absence) {
    issues.push({
      id: "absence-missing",
      message: "Heure de pic sans mode Absence : l'appoint de 1 800 W peut tourner en même temps que la maison.",
    });
  }
  if (!expected.absence && absence) {
    issues.push({
      id: "absence-stuck",
      message: "Mode Absence actif hors des heures de pic : le thermo ne chauffe plus du tout.",
    });
  }
  if (status.boostActive) {
    issues.push({ id: "boost-on", message: "Boost actif : 1 800 W d'appoint en plus, jamais demandé par l'automation." });
  }
  if (status.mode !== expected.mode) {
    issues.push({ id: "mode", message: `Mode divergent : attendu ${expected.mode}, constaté ${status.mode}.` });
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
      message: `PAC à l'arrêt depuis au moins deux heures : eau à ${water}°C pour une consigne de ${status.targetTemperature}°C. Le thermo chauffe à l'appoint (coût ×3).`,
    });
  }
  if (plausibleMiddle(status) == null) {
    issues.push({
      id: "middle-missing",
      message: `Sonde du milieu absente ou aberrante (${status.middleTemperature ?? "—"}).`,
    });
  }

  return issues;
}

/** Les constats déjà présents au contrôle précédent : seuls ceux-là partent en alerte. */
export function confirmedIssues(current: readonly HealthIssue[], previousIds: readonly string[]): HealthIssue[] {
  const previous = new Set(previousIds);
  return current.filter((i) => previous.has(i.id));
}
