import { addDays } from "@sejour/socle/lib/dates";
import { getJson, redisKey, setJson } from "@/lib/redis";
import { getBeyondCalendar, type BeyondCalendarDay } from "./beyond-client";

/**
 * **Témoin Beyond** après la bascule (plan du 2026-11-21, B5) : chaque matin, le prix que Beyond
 * **aurait** suggéré, relevé par son API en lecture. Hors du chemin critique : appelé par le cron
 * `pricing-snapshot` **après** l'enregistrement de la photo, dans son propre `try` ; une panne ne
 * touche jamais la photo, ni l'envoi des prix.
 *
 * Le jeton `BEYOND_API_TOKEN` n'est lu qu'ici (test `push-import`) ; sans lui, le témoin est
 * « non configuré », sans autre source.
 */

/** Annonce Beyond de la maison (« Holiday Home », seule annonce du compte au 2026-11-21). */
export const BEYOND_LISTING_ID = 3757925;
const KEY_PREFIX = redisKey("pricing", "beyond");
const HORIZON_DAYS = 365;

/** Jour → [suggéré, publié, prix minimum effectif, séjour minimum, ratio événement]. */
export type WitnessDay = [price: number | null, posted: number | null, minPrice: number | null, minStay: number | null, event: number | null];

export interface BeyondWitness {
  date: string;
  takenAt: string;
  days: Record<string, WitnessDay>;
}

export function compactWitness(date: string, takenAt: string, days: readonly BeyondCalendarDay[]): BeyondWitness {
  return {
    date,
    takenAt,
    days: Object.fromEntries(days.map((d) => [d.date, [d.price, d.posted, d.effectiveMinPrice, d.minStay, d.eventRatio]])),
  };
}

export type WitnessOutcome = { status: "stored"; days: number } | { status: "not-configured" } | { status: "error"; message: string };

export async function takeBeyondWitness(today: string, options: { dry?: boolean } = {}): Promise<WitnessOutcome> {
  const token = process.env.BEYOND_API_TOKEN?.trim();
  if (!token) return { status: "not-configured" };
  try {
    const days = await getBeyondCalendar({
      token,
      listingId: BEYOND_LISTING_ID,
      from: today,
      to: addDays(today, HORIZON_DAYS - 1),
    });
    if (!options.dry) await setJson(`${KEY_PREFIX}:${today}`, compactWitness(today, new Date().toISOString(), days));
    return { status: "stored", days: days.length };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message.slice(0, 160) : "erreur inconnue" };
  }
}

export async function loadBeyondWitness(date: string): Promise<BeyondWitness | null> {
  return getJson<BeyondWitness>(`${KEY_PREFIX}:${date}`);
}

/** Prix suggérés du témoin d'un jour, par nuit (vide si absent). */
export async function getBeyondCalendarFromWitness(date: string): Promise<Record<string, number | null>> {
  const w = await loadBeyondWitness(date);
  return w ? Object.fromEntries(Object.entries(w.days).map(([d, v]) => [d, v[0]])) : {};
}
