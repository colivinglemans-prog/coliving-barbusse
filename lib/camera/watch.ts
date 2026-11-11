import type { AjAlarm } from "./ajcloud";

/**
 * Logique pure de la veille caméra : décider quels événements de mouvement sont **nouveaux**
 * depuis le dernier passage, et comment les présenter. Aucune E/S ici — testable sans réseau.
 */

export interface CameraAlert {
  did: string;
  cts: number;
  /** « 11/11 à 15:58 », lu depuis `ctime` (heure locale de la caméra). */
  when: string;
  imageUrl: string | null;
  videoUrl: string | null;
}

/** Les alarmes strictement postérieures à `lastCts`, du plus ancien au plus récent. */
export function newAlarmsSince(alarms: AjAlarm[], lastCts: number): AjAlarm[] {
  return alarms
    .filter((a) => Number(a.cts) > lastCts)
    .sort((a, b) => Number(a.cts) - Number(b.cts));
}

/** Le `cts` le plus élevé d'une liste, ou `fallback` si elle est vide. */
export function maxCts(alarms: AjAlarm[], fallback: number): number {
  return alarms.reduce((max, a) => Math.max(max, Number(a.cts)), fallback);
}

/** Première URL d'une liste d'images/vidéos dont l'URL n'est pas vide. */
function firstUrl(items: Array<{ url: string }> | undefined): string | null {
  if (!Array.isArray(items)) return null;
  const found = items.find((i) => i.url && i.url.length > 0);
  return found ? found.url : null;
}

/** `20261111155820` → `11/11 à 15:58`. Rend la chaîne brute si le format surprend. */
export function formatCtime(ctime: string): string {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(ctime ?? "");
  if (!m) return ctime ?? "";
  const [, , mo, d, h, mi] = m;
  return `${d}/${mo} à ${h}:${mi}`;
}

export function toCameraAlert(alarm: AjAlarm): CameraAlert {
  return {
    did: alarm.did,
    cts: Number(alarm.cts),
    when: formatCtime(alarm.ctime),
    imageUrl: firstUrl(alarm.images),
    videoUrl: firstUrl(alarm.avs),
  };
}
