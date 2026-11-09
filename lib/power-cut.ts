/**
 * Détection d'une coupure de courant par les radiateurs (2026-11-09).
 *
 * Trois coupures en trois soirs, et l'hôte ne l'a su que par téléphone : rien ne voyait la
 * maison tomber. Un Heatzy sans courant passe hors ligne ; plusieurs qui tombent **au même
 * passage** (15 min), c'est une coupure, pas un Wi-Fi capricieux.
 *
 * - `cut` : au moins `POWER_CUT_MIN_DEVICES` radiateurs en ligne au passage précédent sont hors
 *   ligne à celui-ci → alerte prioritaire.
 * - `restored` : tous les radiateurs de la coupure sont revenus → « courant revenu » (l'automatisation
 *   réapplique modes et consignes au même passage).
 *
 * Fonction pure ; l'état vit dans Redis.
 */
export const POWER_CUT_MIN_DEVICES = 3;
const CUT_EXPIRY_MS = 6 * 3600 * 1000;

export interface PowerCut {
  since: string;
  devices: string[];
}

export interface PowerCutTransition {
  action: "cut" | "restored" | "none";
  newlyOffline: string[];
  cut: PowerCut | null;
  /** Plus aucun radiateur en ligne : coupure générale, ou box Internet / cloud Heatzy en panne. */
  allOffline: boolean;
}

export function powerCutTransition(
  previousOnline: readonly string[] | null,
  online: readonly string[],
  cut: PowerCut | null,
  now: Date,
): PowerCutTransition {
  const nowOnline = new Set(online);
  const newlyOffline = (previousOnline ?? []).filter((d) => !nowOnline.has(d));
  const allOffline = online.length === 0;
  const newCut = newlyOffline.length >= POWER_CUT_MIN_DEVICES;
  if (cut) {
    // Nouvelle chute pendant une coupure encore ouverte (un radiateur au Wi-Fi capricieux n'est
    // pas revenu, puis le compteur re-disjoncte) : nouvelle alerte, appareils fusionnés.
    if (newCut) {
      const devices = [...new Set([...cut.devices, ...newlyOffline])];
      return { action: "cut", newlyOffline, cut: { since: now.toISOString(), devices }, allOffline };
    }
    if (cut.devices.every((d) => nowOnline.has(d))) return { action: "restored", newlyOffline, cut: null, allOffline };
    // Un circuit resté coupé (disjoncteur divisionnaire non réarmé) ne doit pas garder la
    // coupure ouverte indéfiniment : au-delà de `CUT_EXPIRY_MS`, on l'oublie sans bruit.
    if (now.getTime() - new Date(cut.since).getTime() > CUT_EXPIRY_MS) {
      return { action: "none", newlyOffline, cut: null, allOffline };
    }
    return { action: "none", newlyOffline, cut, allOffline };
  }
  if (newCut) {
    return { action: "cut", newlyOffline, cut: { since: now.toISOString(), devices: newlyOffline }, allOffline };
  }
  return { action: "none", newlyOffline, cut: null, allOffline };
}
