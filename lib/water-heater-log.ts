import { getRedis, redisKey } from "./redis";
import type { CozytouchWaterHeaterStatus } from "./types";

/**
 * Journal horaire du ballon, pour savoir **qui chauffe** (PAC ou appoint de 1 800 W) et ce que
 * ça coûte avant de toucher aux profils (revue du 2026-11-07 : rien ne le mesurait).
 *
 * Écrit par `water-heater-automation` à chaque commande appliquée, et sinon une fois par heure
 * (le cron passe toutes les 15 min depuis le 2026-11-09), dans une liste Redis
 * `barbusse:water-heater:log` (plus récent en tête), bornée à 60 jours. L'écart des compteurs
 * cumulés `heatPumpHours` / `electricHours` entre deux entrées donne les heures de PAC et
 * d'appoint de l'heure écoulée. Pas de nom de voyageur : un nombre de personnes seulement.
 */
export const WATER_HEATER_LOG_KEY = redisKey("water-heater", "log");
export const WATER_HEATER_LOG_MAX = 60 * 24;

export interface WaterHeaterLogEntry {
  at: string;
  guests: number;
  profile: string;
  mode: string;
  target: number;
  boost: boolean;
  /** Ancien boost de rattrapage (entrées du 7 au 9/11/2026). */
  catchUp?: boolean;
  /** Heure de pic (Absence attendue) et état Absence constaté (depuis le 2026-11-09). */
  peak?: boolean;
  absence?: boolean;
  /** Version du 9/11 au soir, retirée : charge des radiateurs et appoint permis. */
  radiatorLoadW?: number | null;
  boosterAllowed?: boolean;
  boosterReason?: string;
  bottom: number;
  middle?: number;
  remaining?: number;
  showers?: number;
  heating: boolean;
  powerHeatPump?: number;
  powerElectric?: number;
  heatPumpHours?: number;
  electricHours?: number;
  energy?: number;
  applied: string[];
}

export function logEntry(
  at: Date,
  guests: number,
  profile: string,
  peak: boolean,
  status: CozytouchWaterHeaterStatus,
  applied: string[],
): WaterHeaterLogEntry {
  return {
    at: at.toISOString(),
    guests,
    profile,
    mode: status.mode,
    target: status.targetTemperature,
    boost: status.boostActive,
    peak,
    absence: status.absenceActive ?? false,
    bottom: status.bottomTemperature,
    middle: status.middleTemperature,
    remaining: status.remainingHotWater,
    showers: status.showersRemaining,
    heating: status.isHeating,
    powerHeatPump: status.powerHeatPump,
    powerElectric: status.powerElectric,
    heatPumpHours: status.heatPumpHours,
    electricHours: status.electricHours,
    energy: status.energyConsumption,
    applied,
  };
}

/** Ne lève jamais : un journal raté ne doit pas faire échouer le pilotage. */
export async function appendWaterHeaterLog(entry: WaterHeaterLogEntry): Promise<void> {
  try {
    const redis = getRedis();
    await redis.lpush(WATER_HEATER_LOG_KEY, JSON.stringify(entry));
    await redis.ltrim(WATER_HEATER_LOG_KEY, 0, WATER_HEATER_LOG_MAX - 1);
  } catch (e) {
    console.error("[water-heater-log]", e instanceof Error ? e.message : e);
  }
}

/** Les dernières entrées, plus récente en tête. `[]` si Redis est injoignable. */
export async function readWaterHeaterLog(limit = 12): Promise<WaterHeaterLogEntry[]> {
  try {
    const rows = await getRedis().lrange<unknown>(WATER_HEATER_LOG_KEY, 0, limit - 1);
    return rows.map((r) => (typeof r === "string" ? JSON.parse(r) : r) as WaterHeaterLogEntry);
  } catch (e) {
    console.error("[water-heater-log] lecture:", e instanceof Error ? e.message : e);
    return [];
  }
}

/** La plus récente entrée vieille d'au moins `ageMs` (pour voir si la PAC a tourné depuis). */
export function entryOlderThan(
  entries: readonly WaterHeaterLogEntry[],
  now: Date,
  ageMs: number,
): WaterHeaterLogEntry | null {
  return entries.find((e) => now.getTime() - new Date(e.at).getTime() >= ageMs) ?? null;
}

/** Une entrée par heure au plus quand rien n'a changé : `true` si celle-ci peut s'écrire. */
export async function claimHourlyLogSlot(): Promise<boolean> {
  try {
    const res = await getRedis().set(redisKey("water-heater", "log-slot"), "1", { nx: true, ex: 55 * 60 });
    return res === "OK";
  } catch {
    return true;
  }
}

/** Une Absence journalisée depuis `since` : la PAC a pu s'arrêter normalement. */
export function absenceSince(entries: readonly WaterHeaterLogEntry[], since: string | undefined): boolean {
  if (!since) return false;
  return entries.some((e) => e.at >= since && e.absence === true);
}
