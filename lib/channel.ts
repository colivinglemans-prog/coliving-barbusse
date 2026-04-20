export type Channel = "Airbnb" | "Booking.com" | "Abritel" | "Direct";

export function normalizeChannel(referer: string, channel?: string): Channel {
  const c = (channel ?? "").toLowerCase();
  const r = (referer ?? "").toLowerCase();

  if (c === "airbnb" || r.includes("airbnb")) return "Airbnb";
  if (c.includes("booking") || r.includes("booking")) return "Booking.com";
  if (c === "vrbo" || r.includes("abritel") || r.includes("homeaway") || r.includes("vrbo")) return "Abritel";
  return "Direct";
}
