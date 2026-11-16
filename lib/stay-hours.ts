import { getRedis, hasRedis, redisKey } from "./redis";
import { parseAgreedHours, withAgreedHours, type AgreedHours, type StayHoursTable } from "./stay-hours-rules";

/**
 * Horaires convenus par réservation (arrivée anticipée, départ tardif) : **la table Redis**.
 * La règle, pure, est dans `lib/stay-hours-rules.ts` (réexportée ici) — voir son en-tête pour le
 * tableau des consommateurs.
 */
export * from "./stay-hours-rules";

/* ── Redis ───────────────────────────────────────────────────────────── */

const KEY = () => redisKey("stay-hours");

/** Toute la table. **Ne lève jamais** : Redis absent ou injoignable ⇒ table vide (heures standard). */
export async function readStayHours(): Promise<StayHoursTable> {
  try {
    if (!hasRedis()) return {};
    const raw = await getRedis().hgetall<Record<string, unknown>>(KEY());
    const table: Record<number, AgreedHours> = {};
    for (const [field, value] of Object.entries(raw ?? {})) {
      const id = Number(field);
      const agreed = parseAgreedHours(value);
      if (Number.isInteger(id) && agreed) table[id] = agreed;
    }
    return table;
  } catch (e) {
    console.error("[stay-hours] lecture impossible :", e instanceof Error ? e.message : e);
    return {};
  }
}

/**
 * La jointure commune aux crons et au dashboard (`heating-automation`, `heating-reset`,
 * `water-heater-*`, `/api/dashboard/heating`, `nuki-sync`) : la table est lue **une fois** par
 * passage, en même temps que les réservations, et tous lisent le même état.
 */
export async function withStayHours<T extends { id: number }>(
  bookings: readonly T[] | Promise<readonly T[]>,
): Promise<Array<T & AgreedHours>> {
  const [list, table] = await Promise.all([bookings, readStayHours()]);
  return withAgreedHours(list, table);
}

/** Enregistre l'accord d'une réservation (le remplace). Un accord vide le retire. Lève en cas d'échec. */
export async function saveStayHours(bookingId: number, agreed: AgreedHours): Promise<void> {
  if (agreed.arrivalHour === undefined && agreed.departureHour === undefined) {
    await clearStayHours(bookingId);
    return;
  }
  await getRedis().hset(KEY(), { [String(bookingId)]: JSON.stringify(agreed) });
}

/** Retire l'accord d'une réservation. Idempotent. Lève en cas d'échec. */
export async function clearStayHours(bookingId: number): Promise<void> {
  await getRedis().hdel(KEY(), String(bookingId));
}
