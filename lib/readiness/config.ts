import type { ReadinessSchedule } from "@sejour/socle/lib/arrival-readiness/schedule";
import type { ReadinessPolicy } from "@sejour/socle/lib/arrival-readiness/evaluate";
import type { PassKind, Severity } from "@sejour/socle/lib/arrival-readiness/types";

/**
 * Réglages de la préparation d'arrivée de Barbusse. Le socle n'a aucune valeur par défaut :
 * tout est ici.
 *
 * Le cron (cron-job.org) tourne **toutes les heures à :35, jour et nuit**. Avec une tolérance
 * de 30 min et des fenêtres semi-ouvertes, chaque passage nominal est pris exactement une fois
 * (15h30 → passage de 15h35, J-1 19h → 18h35, J+1 9h → 8h35), et :35 laisse à
 * `heating-automation` (:00, :15, :30) le temps de poser le confort de 15 h avant le contrôle.
 * Les heures de silence (22 h → 8 h) sont appliquées par le socle, pas par l'horaire du cron :
 * le passage `late` d'une arrivée annoncée à 23 h tombe à 22 h et doit pouvoir parler.
 */
export const READINESS_SCHEDULE: ReadinessSchedule = {
  checkIn: "17:00",
  eve: "19:00",
  noon: "12:30",
  preheat: "15:30",
  final: "16:30",
  noShow: "09:00",
  daily: "09:00",
  lateLeadMinutes: 60,
  toleranceMinutes: 30,
  quietFrom: "22:00",
  quietUntil: "08:00",
};

export const READINESS_POLICY: ReadinessPolicy = {
  offlineAfterMisses: 2,
  unknownSeverity: 2,
};

/** Gravité (priorité ntfy) d'un défaut bloquant — serrure, radiateur ou ballon hors ligne — selon le passage. */
export const SEVERITY_BY_PASS: Record<PassKind, Severity> = {
  eve: 3,
  noon: 3,
  preheat: 4,
  final: 5,
  late: 5,
  noShow: 4,
  daily: 3,
};

/** Seuils du chauffage et de l'eau chaude (décidés le 2026-11-07). */
export const HEATING_THRESHOLDS = {
  /** 15h30 : la pièce a pris au moins +1 °C depuis 12h30, ou est déjà à 14 °C. */
  preheatRiseC: 1,
  preheatFloorC: 14,
  /** 16h30 : au plus 3 °C sous la consigne du mode attendu. */
  finalBelowTargetC: 3,
  /** Aucune température lue à partir de 17 h (heure de Paris). */
  noTemperatureFromMinutes: 17 * 60,
} as const;

export const WATER_THRESHOLDS = {
  minTemperatureC: 50,
  minRemainingRatio: 0.6,
} as const;

/** Pile de la serrure : priorité 3 sous 25 %, 4 sous 10 %. */
export const LOCK_BATTERY = { warnBelow: 25, criticalBelow: 10 } as const;

/** Gravité d'une non-arrivée (J+1 9h). */
export const NO_SHOW_SEVERITY: Severity = 4;
