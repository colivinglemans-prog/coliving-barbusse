import {
  CATCH_UP_BOOST,
  getProfileSettings,
  getWaterHeaterProfile,
  isCatchUpHour,
  plausibleMiddle,
} from "./cozytouch";
import type { CozytouchWaterHeaterStatus } from "./types";

/**
 * Contrôle du ballon : ce qui cloche **maintenant**, chaque constat avec un identifiant stable.
 *
 * L'automation et le contrôle lisent le ballon à la même minute, et Overkiz met du temps à
 * refléter une commande : comparer à l'état attendu à l'instant produisait une fausse alerte à
 * chaque bascule (boost de rattrapage, fenêtres de profil, 11 h). D'où deux règles :
 *
 * - le boost est jugé contre un état **autorisé** (le profil le prévoit, ou un rattrapage est
 *   en cours) et un état **exigé** (le profil le prévoit, ou le milieu est sous le seuil bas),
 *   pas contre une valeur exacte — l'hystérésis laisse les deux possibles entre 40 et 50 °C ;
 * - `confirmedIssues` : un constat n'est signalé que s'il était déjà là au contrôle précédent.
 *   Une bascule que l'automation applique dans l'heure ne survit pas ; une panne, si.
 */
export interface HealthIssue {
  id: string;
  message: string;
}

export type HealthStatus = Pick<
  CozytouchWaterHeaterStatus,
  "isAvailable" | "mode" | "targetTemperature" | "boostActive" | "middleTemperature" | "bottomTemperature"
>;

export function waterHeaterIssues(guests: number, hour: number, status: HealthStatus): HealthIssue[] {
  if (!status.isAvailable) {
    return [{ id: "offline", message: "Ballon thermodynamique hors ligne (aucun état remonté)." }];
  }

  const issues: HealthIssue[] = [];
  const base = getProfileSettings(getWaterHeaterProfile(guests), hour);
  const middle = plausibleMiddle(status);
  // La sonde du milieu, quand un rattrapage est possible (grand groupe, heure de douche).
  const catchUpMiddle = guests >= CATCH_UP_BOOST.minGuests && isCatchUpHour(hour) ? middle : undefined;

  if (status.mode !== base.mode) {
    issues.push({ id: "mode", message: `Mode divergent : attendu ${base.mode}, constaté ${status.mode}.` });
  }
  if (status.targetTemperature !== base.targetTemperature) {
    issues.push({
      id: "target",
      message: `Consigne divergente : attendue ${base.targetTemperature}°C, constatée ${status.targetTemperature}°C.`,
    });
  }

  const boostRequired = base.boost || (catchUpMiddle != null && catchUpMiddle < CATCH_UP_BOOST.start);
  const boostAllowed = base.boost || (catchUpMiddle != null && catchUpMiddle < CATCH_UP_BOOST.stop);

  if (boostRequired && !status.boostActive) {
    issues.push(
      base.boost
        ? { id: "boost-off", message: "Boost divergent : attendu on (fenêtre du profil), constaté off." }
        : {
            id: "underheat",
            message: `Ballon en sous-chauffe sans boost : milieu à ${middle}°C (seuil ${CATCH_UP_BOOST.start}°C, bas ${status.bottomTemperature}°C) avec ${guests} personne(s) présente(s).`,
          },
    );
  }
  if (status.boostActive && !boostAllowed) {
    issues.push({ id: "boost-on", message: "Boost divergent : attendu off, constaté on (résistance du thermo pour rien)." });
  }

  // Mode dégradé, sonde du milieu absente ou aberrante : l'ancienne règle sur la sonde du bas,
  // qui chute à chaque série de douches — d'où la confirmation sur deux contrôles.
  if (middle == null) {
    issues.push({
      id: "middle-missing",
      message: `Sonde du milieu absente ou aberrante (${status.middleTemperature ?? "—"}) : boost de rattrapage désactivé.`,
    });
    if (guests > 0 && isCatchUpHour(hour) && status.bottomTemperature > 0 && status.bottomTemperature < status.targetTemperature - 8) {
      issues.push({
        id: "underheat-bottom",
        message: `Ballon en sous-chauffe : bas à ${status.bottomTemperature}°C (consigne ${status.targetTemperature}°C) avec ${guests} personne(s) présente(s).`,
      });
    }
  }

  return issues;
}

/** Les constats déjà présents au contrôle précédent : seuls ceux-là partent en alerte. */
export function confirmedIssues(current: readonly HealthIssue[], previousIds: readonly string[]): HealthIssue[] {
  const previous = new Set(previousIds);
  return current.filter((i) => previous.has(i.id));
}
