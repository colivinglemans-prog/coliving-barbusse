/**
 * Délestage tournant des étages (coupures des 7, 8 et 9 novembre 2026 à 9 kVA).
 *
 * À chaque passage de l'automatisation (toutes les 15 min), si la charge estimée des radiateurs
 * dépasse le plafond (`ELECTRICAL_BUDGET.radiatorCapW`), des zones passent en **éco** pour le
 * quart d'heure, dans l'ordre tournant **dernier étage → 1er étage → chambre RDC**. Le RDC (pièces
 * de vie) n'est jamais délesté. On s'arrête dès que la charge estimée sans les zones délestées
 * repasse sous le plafond.
 *
 * Rotation : on repart de la zone qui suit la dernière délestée, et une zone délestée au quart
 * d'heure précédent passe après les autres — une même zone n'a pas froid deux quarts d'heure de
 * suite si une autre peut prendre le relais. Au passage suivant, toutes les zones sont rendues et
 * le calcul recommence.
 *
 * Fonctions pures ; l'état vit dans Redis (`barbusse:heating:shed`).
 */

export const SHED_ORDER = ["dernier", "1er", "chambre-rdc"] as const;

/** Un délestage plus vieux que ça n'existe plus (cron arrêté, passage manqué). */
const STALE_MS = 30 * 60 * 1000;

export interface ShedState {
  /** Zones délestées pour ce quart d'heure. */
  zones: string[];
  /** Index dans `SHED_ORDER` de la prochaine zone à délester. */
  next: number;
  at: string;
  /** Charge estimée avant délestage, et ce qu'il en reste après. */
  totalW: number;
  remainingW: number;
  capW: number;
}

export function planShedding(
  totalW: number,
  byZone: Readonly<Record<string, number>>,
  capW: number,
  prev: ShedState | null,
  now: Date,
): ShedState {
  const fresh = prev !== null && now.getTime() - new Date(prev.at).getTime() < STALE_MS;
  const start = prev ? ((prev.next % SHED_ORDER.length) + SHED_ORDER.length) % SHED_ORDER.length : 0;
  const base = { at: now.toISOString(), totalW, capW };
  if (totalW <= capW) return { ...base, zones: [], next: start, remainingW: totalW };

  const rotated = [...SHED_ORDER.slice(start), ...SHED_ORDER.slice(0, start)];
  const justShed = new Set(fresh ? prev!.zones : []);
  const ordered = [...rotated.filter((z) => !justShed.has(z)), ...rotated.filter((z) => justShed.has(z))];

  const zones: string[] = [];
  let remainingW = totalW;
  for (const z of ordered) {
    if (remainingW <= capW) break;
    const w = byZone[z] ?? 0;
    if (w <= 0) continue;
    zones.push(z);
    remainingW -= w;
  }
  // Une zone prise en route et devenue superflue (une suivante, plus lourde, a suffi) est rendue.
  for (const z of [...zones]) {
    const w = byZone[z] ?? 0;
    if (remainingW + w <= capW) {
      zones.splice(zones.indexOf(z), 1);
      remainingW += w;
    }
  }
  const last = zones.at(-1);
  const next = last ? (SHED_ORDER.indexOf(last as (typeof SHED_ORDER)[number]) + 1) % SHED_ORDER.length : start;
  return { ...base, zones, next, remainingW: Math.round(remainingW) };
}

/** Un délestage encore valable (posé il y a moins de 30 min), pour le reset et le dashboard. */
export function activeShedZones(state: ShedState | null, now: Date): string[] {
  if (!state) return [];
  return now.getTime() - new Date(state.at).getTime() < STALE_MS ? state.zones : [];
}
