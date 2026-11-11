/**
 * Détection d'une coupure de courant par les radiateurs (2026-11-09).
 *
 * Trois coupures en trois soirs, et l'hôte ne l'a su que par téléphone : rien ne voyait la
 * maison tomber. Un Heatzy sans courant passe hors ligne ; plusieurs qui tombent **au même
 * passage** (15 min), c'est une coupure, pas un Wi-Fi capricieux.
 *
 * - `suspected` : au moins `POWER_CUT_MIN_DEVICES` radiateurs en ligne au passage précédent sont
 *   hors ligne à celui-ci → coupure **soupçonnée**, mémorisée, sans alerte (2026-11-10 : un cloud
 *   Heatzy ou une box qui décroche une minute ne mérite pas une priorité 5).
 * - `cut` : au passage suivant, au moins `POWER_CUT_MIN_DEVICES` de ces radiateurs sont toujours
 *   hors ligne → alerte prioritaire. Sinon la coupure soupçonnée est oubliée sans bruit.
 * - `restored` : tous les radiateurs d'une coupure **signalée** sont revenus → « courant revenu »,
 *   en priorité 1 (l'automatisation réapplique modes et consignes au même passage).
 *
 * Fonction pure ; l'état vit dans Redis.
 */
export const POWER_CUT_MIN_DEVICES = 3;
const CUT_EXPIRY_MS = 6 * 3600 * 1000;

export interface PowerCut {
  since: string;
  devices: string[];
  /** `false` tant que la coupure n'est vue qu'à un passage. Absent (état d'avant) = signalée. */
  confirmed?: boolean;
}

export interface PowerCutTransition {
  action: "suspected" | "cut" | "restored" | "none";
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
  if (cut && cut.confirmed === false) {
    // Deuxième passage d'une coupure soupçonnée : confirmée si assez de radiateurs manquent encore.
    // Seuls les radiateurs vus aux deux passages confirment ; une chute toute neuve repart en soupçon.
    const stillOffline = cut.devices.filter((d) => !nowOnline.has(d));
    if (stillOffline.length >= POWER_CUT_MIN_DEVICES) {
      const devices = [...new Set([...stillOffline, ...newlyOffline])];
      return { action: "cut", newlyOffline: devices, cut: { since: cut.since, devices, confirmed: true }, allOffline };
    }
    if (newCut) {
      return { action: "suspected", newlyOffline, cut: { since: now.toISOString(), devices: newlyOffline, confirmed: false }, allOffline };
    }
    return { action: "none", newlyOffline, cut: null, allOffline };
  }
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
    return {
      action: "suspected",
      newlyOffline,
      cut: { since: now.toISOString(), devices: newlyOffline, confirmed: false },
      allOffline,
    };
  }
  return { action: "none", newlyOffline, cut: null, allOffline };
}
