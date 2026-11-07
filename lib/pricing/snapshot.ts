import { getRedis as sharedRedis, hasRedis } from "@/lib/redis";
import { addDays, daysBetween } from "@sejour/socle/lib/dates";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { todayParis } from "@sejour/socle/lib/time";
import { getCalendarDays, type CalendarDay } from "@/lib/beds24";

/**
 * Photo quotidienne du calendrier tarifaire — la mémoire que Beds24 n'a pas.
 *
 * Beyond Pricing pousse chaque jour ses prix et ses séjours minimum dans Beds24, et Beds24
 * écrase la valeur précédente sans en garder trace. Pour évaluer Beyond (et, plus tard, un
 * moteur maison qui le remplacerait), il faut savoir **ce qui était affiché quel jour** :
 * quand un prix a bougé, de combien, et à quel prix une date s'est vendue. D'où une photo par
 * jour, stockée telle quelle dans Upstash.
 *
 * **Volume** : 365 jours × 3 valeurs ≈ 8 Ko par photo, soit ~3 Mo par an — très en deçà
 * du palier gratuit d'Upstash (256 Mo). Pas de TTL : l'historique est la raison d'être.
 *
 * **Une date qui passe de vendable à non vendable** est une réservation (ou un blocage
 * manuel — Beds24 ne fait pas la différence au calendrier). Son prix dans la photo de la
 * veille est le prix auquel Beyond l'affichait au moment de la vente.
 */

export { PROPERTY_ID };
/**
 * Horizon relevé. Beds24 ne rend que 365 jours par appel, et c'est aussi la fenêtre de
 * réservation : au-delà, Beyond pousse des prix mais `numAvail` vaut 0 partout (constaté le
 * 2026-11-07), si bien qu'une vente n'y serait pas distinguable d'une date fermée.
 */
export const SNAPSHOT_HORIZON_DAYS = 365;

/** `[prix, séjour minimum, vendable (1/0)]` — tableau plutôt qu'objet pour diviser le volume par trois. */
export type SnapshotDay = [price: number, minStay: number, available: 0 | 1];

export interface PriceSnapshot {
  /** Jour de la photo (Paris), clé de stockage. */
  date: string;
  /** Horodatage exact, ISO 8601. */
  takenAt: string;
  days: Record<string, SnapshotDay>;
}

const KEY_PREFIX = "pricing:snapshot:barbusse:";

function getRedis() {
  if (!hasRedis()) throw new Error("KV_REST_API_URL / KV_REST_API_TOKEN manquants");
  return sharedRedis();
}

function toSnapshotDay(d: CalendarDay): SnapshotDay {
  return [d.price, d.minStay, d.available ? 1 : 0];
}

/** Relève le calendrier Beds24 du jour sur tout l'horizon. N'écrit rien. */
export async function takeSnapshot(today = todayParis()): Promise<PriceSnapshot> {
  const calendar = await getCalendarDays(
    PROPERTY_ID,
    today,
    addDays(today, SNAPSHOT_HORIZON_DAYS),
  );
  const days: Record<string, SnapshotDay> = {};
  for (const [date, day] of Object.entries(calendar)) days[date] = toSnapshotDay(day);
  if (Object.keys(days).length === 0) {
    throw new Error("Calendrier Beds24 vide : photo refusée plutôt qu'enregistrée vide");
  }
  return { date: today, takenAt: new Date().toISOString(), days };
}

export async function saveSnapshot(snapshot: PriceSnapshot): Promise<void> {
  await getRedis().set(KEY_PREFIX + snapshot.date, snapshot);
}

export async function loadSnapshot(date: string): Promise<PriceSnapshot | null> {
  return (await getRedis().get<PriceSnapshot>(KEY_PREFIX + date)) ?? null;
}

/** Les photos des `count` derniers jours jusqu'à `until` inclus, les manquantes à `null`. */
export async function loadSnapshots(
  until: string,
  count: number,
): Promise<{ date: string; snapshot: PriceSnapshot | null }[]> {
  return loadSnapshotsOn(Array.from({ length: count }, (_, i) => addDays(until, i - count + 1)));
}

/** Les photos de dates précises (format `YYYY-MM-DD` exigé : la clé ne se forge pas). */
export async function loadSnapshotsOn(
  dates: string[],
): Promise<{ date: string; snapshot: PriceSnapshot | null }[]> {
  assertDates(dates);
  if (dates.length === 0) return [];
  const values = await getRedis().mget<(PriceSnapshot | null)[]>(
    ...dates.map((d) => KEY_PREFIX + d),
  );
  return dates.map((date, i) => ({ date, snapshot: values[i] ?? null }));
}

function assertDates(dates: string[]): void {
  for (const d of dates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) throw new Error(`Date de photo invalide : ${d}`);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * Prix du moteur maison, calculés le même jour que la photo (simulation)
 *
 * Stockés plutôt que recalculés au moment du rapport : la grille va évoluer, et la comparaison
 * honnête est avec ce que le moteur **aurait affiché ce jour-là**, pas avec ce qu'il dirait
 * aujourd'hui.
 * ────────────────────────────────────────────────────────────────────────── */

/** `[prix, séjour minimum]` par nuit. */
export interface ShadowPrices {
  date: string;
  days: Record<string, [price: number, minStay: number]>;
}

const SHADOW_PREFIX = "pricing:shadow:barbusse:";

export async function saveShadow(shadow: ShadowPrices): Promise<void> {
  await getRedis().set(SHADOW_PREFIX + shadow.date, shadow);
}

export async function loadShadows(
  until: string,
  count: number,
): Promise<{ date: string; shadow: ShadowPrices | null }[]> {
  return loadShadowsOn(Array.from({ length: count }, (_, i) => addDays(until, i - count + 1)));
}

export async function loadShadowsOn(
  dates: string[],
): Promise<{ date: string; shadow: ShadowPrices | null }[]> {
  assertDates(dates);
  if (dates.length === 0) return [];
  const values = await getRedis().mget<(ShadowPrices | null)[]>(
    ...dates.map((d) => SHADOW_PREFIX + d),
  );
  return dates.map((date, i) => ({ date, shadow: values[i] ?? null }));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Différence entre deux photos
 * ────────────────────────────────────────────────────────────────────────── */

export interface PriceChange {
  /** Nuit concernée. */
  date: string;
  /** Jours entre la photo et la nuit — « à combien de jours » le prix a bougé. */
  leadDays: number;
  before: number;
  after: number;
}

export interface MinStayChange {
  date: string;
  leadDays: number;
  before: number;
  after: number;
}

export interface SoldNight {
  date: string;
  leadDays: number;
  /** Prix affiché la veille de la vente (nuit de base, ≤ 9 pers., hors frais et markup canal). */
  price: number;
}

export interface SnapshotDiff {
  from: string;
  to: string;
  priceChanges: PriceChange[];
  minStayChanges: MinStayChange[];
  /** Nuits vendables la veille, plus aujourd'hui : réservées (ou bloquées). */
  sold: SoldNight[];
  /** Nuits non vendables la veille, vendables aujourd'hui : annulations ou déblocages. */
  released: string[];
}

/**
 * Compare deux photos sur les nuits **communes** et encore à venir à la date de la seconde.
 * Les nuits passées entre les deux photos ne comptent ni comme vente ni comme changement.
 */
export function diffSnapshots(before: PriceSnapshot, after: PriceSnapshot): SnapshotDiff {
  const diff: SnapshotDiff = {
    from: before.date,
    to: after.date,
    priceChanges: [],
    minStayChanges: [],
    sold: [],
    released: [],
  };
  for (const [date, now] of Object.entries(after.days)) {
    const prev = before.days[date];
    if (!prev || date < after.date) continue;
    const leadDays = daysBetween(after.date, date);
    if (prev[0] !== now[0]) diff.priceChanges.push({ date, leadDays, before: prev[0], after: now[0] });
    if (prev[1] !== now[1]) diff.minStayChanges.push({ date, leadDays, before: prev[1], after: now[1] });
    if (prev[2] === 1 && now[2] === 0) diff.sold.push({ date, leadDays, price: prev[0] });
    if (prev[2] === 0 && now[2] === 1) diff.released.push(date);
  }
  return diff;
}
