import type { HeatzyMode, HeatzyZone } from "./types";

/**
 * Charge électrique **estimée** des radiateurs (coupures des 7, 8 et 9 novembre 2026 à 9 kVA).
 *
 * Aucun compteur ne mesure ce que consomment les radiateurs : on l'estime à partir de ce que
 * remonte chaque Heatzy (mode, consignes, température, `Heating_state`). Un radiateur à fluide
 * caloporteur ACOVA Atoll LCD (1 000 W) tire sa pleine puissance tant que la pièce est loin de
 * la consigne, puis régule par à-coups. D'où, par radiateur :
 *
 * - écart (consigne − température) ≥ 1 °C : **100 %** ;
 * - écart entre 0 et 1 °C : **100 %** s'il chauffe, **un tiers** sinon (régulation) ;
 * - pièce à la consigne ou au-dessus : **un tiers** s'il chauffe encore, **0** sinon ;
 * - **hors ligne, illisible, ou mode inconnu : 100 %** — on ne sait pas ce qu'il fait, on compte le pire.
 *
 * Fonctions pures : la lecture des radiateurs est dans `readRadiators` (`lib/heatzy.ts`).
 */

export const DEFAULT_RADIATOR_W = 1000;
/** Consigne du hors-gel des Heatzy. */
export const FROST_SETPOINT_C = 7;
export const REGULATING_FACTOR = 1 / 3;

export interface RadiatorReading {
  did: string;
  name: string;
  zoneId: string;
  online: boolean;
  /** Attributs Gizwits (`/app/devdata/{did}/latest`), `null` si illisibles. */
  attrs: Record<string, unknown> | null;
  powerW?: number;
}

export interface RadiatorLoad {
  totalW: number;
  byZone: Record<string, number>;
  /** Radiateurs comptés à 100 % faute de lecture. */
  unknown: string[];
}

function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Consigne (°C) qu'un mode impose. `null` : radiateur arrêté. `undefined` : inconnue.
 * `cft1` / `cft2` sont le confort −1 / −2 °C que le mode présence applique à une pièce vide.
 */
export function setpointOfMode(mode: unknown, cftTenths: unknown, ecoTenths: unknown): number | null | undefined {
  const cft = num(cftTenths);
  const eco = num(ecoTenths);
  if (mode === "stop" || mode === "off") return null;
  if (mode === "fro") return FROST_SETPOINT_C;
  if (mode === "eco") return eco !== undefined ? eco / 10 : undefined;
  if (typeof mode === "string") {
    const m = /^cft(\d)?$/.exec(mode);
    if (m && cft !== undefined) return cft / 10 - (m[1] ? Number(m[1]) : 0);
  }
  return undefined;
}

/** Consigne qu'applique le radiateur **en ce moment**, d'après ce qu'il remonte. */
export function readingSetpoint(r: RadiatorReading): number | null | undefined {
  if (!r.attrs) return undefined;
  return setpointOfMode(r.attrs.mode, r.attrs.cft_temp, r.attrs.eco_temp);
}

/**
 * Consigne que le radiateur aura **après** le passage de l'automatisation : le mode que la zone
 * va recevoir, consignes ramenées à celles de la zone. Sert à estimer la charge avant de
 * décider d'un délestage (une zone délestée au quart d'heure précédent est en éco : sa charge
 * mesurée sous-estime ce qu'elle tirera une fois rendue).
 *
 * `null` (mode attendu) : rien d'imposé, on garde ce que le radiateur fait.
 */
export function expectedSetpoint(
  mode: HeatzyMode | string | null,
  r: RadiatorReading,
  zone: Pick<HeatzyZone, "cftTemp" | "ecoTemp">,
): number | null | undefined {
  if (mode === null) return readingSetpoint(r);
  const attrs = r.attrs ?? {};
  const cap = (actual: unknown, zoneValue: number | undefined) => {
    const a = num(actual);
    if (zoneValue === undefined) return a;
    return a === undefined ? zoneValue : Math.min(a, zoneValue);
  };
  const cft = cap(attrs.cft_temp, zone.cftTemp);
  const eco = cap(attrs.eco_temp, zone.ecoTemp);
  if (mode === "presence") {
    // Déjà en présence : le palier qu'il applique (confort, confort −1, −2 ou éco). Sinon, il
    // vient d'y passer : on compte le confort, le pire cas.
    return attrs.derog_mode === 3 ? setpointOfMode(attrs.mode, cft, eco) : setpointOfMode("cft", cft, eco);
  }
  return setpointOfMode(mode, cft, eco);
}

export function loadFactor(setpointC: number | null | undefined, currentC: number | undefined, heating: boolean): number {
  if (setpointC === null) return 0;
  if (setpointC === undefined || currentC === undefined) return 1;
  const gap = setpointC - currentC;
  if (gap >= 1) return 1;
  if (gap > 0) return heating ? 1 : REGULATING_FACTOR;
  return heating ? REGULATING_FACTOR : 0;
}

/**
 * Charge estimée, en watts, au total et par zone. `setpointFor` donne la consigne à retenir
 * pour chaque radiateur (par défaut, celle qu'il applique en ce moment).
 */
export function estimateRadiatorLoad(
  readings: readonly RadiatorReading[],
  setpointFor: (r: RadiatorReading) => number | null | undefined = readingSetpoint,
): RadiatorLoad {
  const byZone: Record<string, number> = {};
  const unknown: string[] = [];
  let totalW = 0;
  for (const r of readings) {
    const power = r.powerW ?? DEFAULT_RADIATOR_W;
    let factor: number;
    if (!r.online || !r.attrs) {
      factor = 1;
      unknown.push(r.name);
    } else {
      const setpoint = setpointFor(r);
      if (setpoint === undefined) unknown.push(r.name);
      const cur = num(r.attrs.cur_temp);
      factor = loadFactor(setpoint, cur !== undefined ? cur / 10 : undefined, r.attrs.Heating_state === 1);
    }
    const w = power * factor;
    totalW += w;
    byZone[r.zoneId] = (byZone[r.zoneId] ?? 0) + w;
  }
  const round = (w: number) => Math.round(w);
  for (const z of Object.keys(byZone)) byZone[z] = round(byZone[z]);
  return { totalW: round(totalW), byZone, unknown };
}

/**
 * Consignes montées au-dessus de celles de la zone (voyageur qui a touché les boutons du Heatzy).
 * L'automatisation les ramène à chaque passage, toutes les 15 min (2026-11-09) ; le reset le
 * faisait seul, toutes les 4 h. Les boutons restent libres : une hausse dure un quart d'heure.
 */
export function setpointsAboveZone(
  attrs: Record<string, unknown> | null,
  zone: Pick<HeatzyZone, "cftTemp" | "ecoTemp">,
): boolean {
  if (!attrs || zone.cftTemp === undefined || zone.ecoTemp === undefined) return false;
  const cft = num(attrs.cft_temp);
  const eco = num(attrs.eco_temp);
  return (cft !== undefined && cft > zone.cftTemp) || (eco !== undefined && eco > zone.ecoTemp);
}
