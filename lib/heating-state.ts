import { getJson, getRedis, redisKey, setJson } from "./redis";
import type { ShedState } from "./load-shedding";
import type { PowerCut } from "./power-cut";

/**
 * État partagé du chauffage dans Redis, écrit par `heating-automation` (toutes les 15 min) :
 *
 * - `shed` : le délestage du quart d'heure (`lib/load-shedding.ts`), lu par `heating-reset` pour
 *   ne pas rallumer une zone délestée, et par le dashboard ;
 * - `load` : la charge estimée des radiateurs après ce passage, lue par l'automation du ballon
 *   pour décider de l'appoint (une seule lecture des radiateurs pour les deux) ;
 * - `online` / `power-cut` : la détection de coupure (`lib/power-cut.ts`).
 *
 * Lecture et écriture ne lèvent jamais : un Redis injoignable ne doit pas arrêter le chauffage.
 */
export const HEATING_SHED_KEY = redisKey("heating", "shed");
export const HEATING_LOAD_KEY = redisKey("heating", "load");
export const HEATING_ONLINE_KEY = redisKey("heating", "online");
export const HEATING_POWER_CUT_KEY = redisKey("heating", "power-cut");

export interface HeatingLoadMemo {
  /** Charge estimée des radiateurs après les modes posés à ce passage (délestage compris). */
  totalW: number;
  capW: number;
  /** Zones réellement délestées à ce passage (vide en observation). */
  shedZones: string[];
  /** En observation : les zones que le délestage aurait mises en éco. */
  observedShedZones?: string[];
  unknown: string[];
  at: string;
}

const HOUR = 3600;

async function read<T>(key: string): Promise<T | null> {
  try {
    return await getJson<T>(key);
  } catch (e) {
    console.error(`[heating-state] lecture ${key}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function write(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await setJson(key, value, ttlSeconds);
  } catch (e) {
    console.error(`[heating-state] écriture ${key}:`, e instanceof Error ? e.message : e);
  }
}

export const readShedState = () => read<ShedState>(HEATING_SHED_KEY);
export const saveShedState = (s: ShedState) => write(HEATING_SHED_KEY, s, HOUR);

export const readHeatingLoad = () => read<HeatingLoadMemo>(HEATING_LOAD_KEY);
export const saveHeatingLoad = (m: HeatingLoadMemo) => write(HEATING_LOAD_KEY, m, HOUR);

export const readOnlineRadiators = () => read<string[]>(HEATING_ONLINE_KEY);
export const saveOnlineRadiators = (names: string[]) => write(HEATING_ONLINE_KEY, names, 2 * HOUR);

export const readPowerCut = () => read<PowerCut>(HEATING_POWER_CUT_KEY);
export async function savePowerCut(cut: PowerCut | null): Promise<void> {
  if (cut) return write(HEATING_POWER_CUT_KEY, cut, 24 * HOUR);
  try {
    await getRedis().del(HEATING_POWER_CUT_KEY);
  } catch (e) {
    console.error("[heating-state] suppression power-cut:", e instanceof Error ? e.message : e);
  }
}

/** Une charge mémorisée encore valable (moins de 20 min : un passage de 15 min, plus une marge). */
export function freshLoad(memo: HeatingLoadMemo | null, now: Date): HeatingLoadMemo | null {
  if (!memo) return null;
  return now.getTime() - new Date(memo.at).getTime() < 20 * 60 * 1000 ? memo : null;
}
