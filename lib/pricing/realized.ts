import { addDays } from "@sejour/socle/lib/dates";
import { soldBookings } from "@sejour/socle/lib/booking-status";
import type { Booking } from "@sejour/socle/lib/booking";
import type { LocalEvent } from "@sejour/socle/lib/events";
import { eventNights } from "./engine";
import type { EventRule } from "./engine-config";
import { EXTRA_PERSON_PER_NIGHT, GUESTS_INCLUDED } from "./channel-prices";

/**
 * Ce qui s'est **vraiment vendu**, ramené à la même grandeur que les prix Beds24 : une nuit de
 * base pour 9 personnes au plus, avant majoration du canal et frais. Sert à la page Pricing pour
 * comparer Beyond et le moteur au réalisé de l'an dernier.
 *
 * ⚠️ **C'est une estimation, et elle se lit en ordre de grandeur.**
 * - On retire un ménage de 280 € et un linge de 15 €/voyageur à toutes les réservations, alors
 *   que début 2026 Airbnb fondait le ménage dans le prix et que Booking facturait 250 € sans linge.
 * - La majoration du canal est celle d'aujourd'hui, alors que Booking est passé de ×1,15 à ×1,25 le
 *   2026-09-18 et Abritel de ×1 à ×1,15.
 * - `Booking.channel` est normalisé : HomeToGo et l'agence des 24 Heures y sont « Direct », donc
 *   divisés par 0,93 au lieu de 1,2 ou 1. Le canal brut n'est pas dans le type canonique.
 */
const CLEANING = 280;
const LINEN_PER_GUEST = 15;
const CHANNEL_FACTOR: Record<string, number> = {
  Airbnb: 1,
  "Booking.com": 1.25,
  Abritel: 1.15,
  Direct: 0.93,
};

/** Prix de base estimé par nuit d'une réservation, ou `null` si on ne peut pas l'estimer. */
export function estimatedBasePerNight(b: Booking): number | null {
  if ((b.units ?? 1) !== 1 || b.nights <= 0 || b.guests == null || b.guests <= 0) return null;
  const factor = CHANNEL_FACTOR[b.channel] ?? 1;
  const accommodation = (b.gross - CLEANING - LINEN_PER_GUEST * b.guests) / factor;
  const extra = Math.max(0, b.guests - GUESTS_INCLUDED) * EXTRA_PERSON_PER_NIGHT;
  const base = accommodation / b.nights - extra;
  return base > 0 ? Math.round(base) : null;
}

/** Base estimée par nuit vendue, sur les nuits de `from` à `to` incluses. */
export function realizedByNight(stays: Booking[], from: string, to: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of soldBookings(stays)) {
    if (b.departure <= from || b.arrival > to) continue;
    const base = estimatedBasePerNight(b);
    if (base == null) continue;
    for (let d = b.arrival; d < b.departure; d = addDays(d, 1)) {
      if (d >= from && d <= to) out[d] = base;
    }
  }
  return out;
}

const keyPrefix = (key: string) => key.replace(/-\d{4}(-\d{2}-\d{2})?$/, "");

/**
 * Le réalisé de l'**édition précédente** d'un événement : les événements ne se calent pas à
 * 364 jours (MotoGP 2026 le 8-10/05, 2027 le 14-16/05), d'où ce rapprochement par clé.
 */
export function realizedForEvent(
  stays: Booking[],
  edition: LocalEvent,
  catalog: LocalEvent[],
  rule: EventRule,
): { name: string; avg: number; nights: number } | null {
  const prefix = keyPrefix(edition.key);
  const previous = catalog
    .filter((e) => keyPrefix(e.key) === prefix && e.end < edition.start)
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  if (!previous) return null;
  const nights = eventNights(previous, rule.extendBefore);
  const realized = realizedByNight(stays, nights[0], nights.at(-1)!);
  const values = nights.flatMap((n) => (realized[n] != null ? [realized[n]] : []));
  if (values.length === 0) return { name: previous.name, avg: 0, nights: 0 };
  return {
    name: previous.name,
    avg: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    nights: values.length,
  };
}
