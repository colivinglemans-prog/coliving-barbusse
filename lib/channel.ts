export type Channel = "Airbnb" | "Booking.com" | "Abritel" | "Direct";

export function normalizeChannel(referer: string, channel?: string): Channel {
  const c = (channel ?? "").toLowerCase();
  const r = (referer ?? "").toLowerCase();

  if (c === "airbnb" || r.includes("airbnb")) return "Airbnb";
  if (c.includes("booking") || r.includes("booking")) return "Booking.com";
  if (c === "vrbo" || r.includes("abritel") || r.includes("homeaway") || r.includes("vrbo")) return "Abritel";
  return "Direct";
}

/**
 * Taux de commission plateforme **estimé** par canal (fraction 0-1).
 * Beds24 ne transmet pas les commissions Airbnb/Booking comme lignes de facture
 * pour ce compte, donc le CA net du dashboard est estimé à partir de ces taux.
 * Surchargeables via env vars ; défauts = ordres de grandeur marché France.
 */
const DEFAULT_COMMISSION_RATES: Record<Channel, number> = {
  "Airbnb": 0.15,
  "Booking.com": 0.15,
  "Abritel": 0.15,
  "Direct": 0,
};

const COMMISSION_ENV_KEYS: Record<Channel, string> = {
  "Airbnb": "COMMISSION_RATE_AIRBNB",
  "Booking.com": "COMMISSION_RATE_BOOKING",
  "Abritel": "COMMISSION_RATE_ABRITEL",
  "Direct": "COMMISSION_RATE_DIRECT",
};

export function estimatedCommissionRate(channel: Channel): number {
  const raw = process.env[COMMISSION_ENV_KEYS[channel]];
  const parsed = raw !== undefined ? Number(raw) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : DEFAULT_COMMISSION_RATES[channel];
}
