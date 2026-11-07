import { getRedis, redisKey } from "./redis";
import type { CozytouchWaterHeaterStatus } from "./types";

/**
 * Journal horaire du ballon, pour savoir **qui chauffe** (PAC ou appoint de 1 800 W) et ce que
 * ça coûte avant de toucher aux profils (revue du 2026-11-07 : rien ne le mesurait).
 *
 * Écrit par `water-heater-automation` à chaque passage réel, dans une liste Redis
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
  catchUp: boolean;
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
  catchUp: boolean,
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
    catchUp,
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
