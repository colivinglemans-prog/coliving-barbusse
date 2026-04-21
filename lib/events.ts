export interface LeMansEvent {
  name: string;
  /** Inclusive start date YYYY-MM-DD */
  start: string;
  /** Inclusive end date YYYY-MM-DD */
  end: string;
}

/**
 * Known Le Mans events with their date ranges.
 * A booking is considered "linked" to an event if its [arrival, departure[ window
 * overlaps the event window (with a small extension to catch early/late stays).
 */
export const LE_MANS_EVENTS: LeMansEvent[] = [
  // 2025
  { name: "24 Heures Moto 2025", start: "2025-04-18", end: "2025-04-20" },
  { name: "MotoGP France 2025", start: "2025-05-09", end: "2025-05-11" },
  { name: "24 Heures du Mans 2025", start: "2025-06-06", end: "2025-06-15" },
  { name: "24 Heures Rollers 2025", start: "2025-07-05", end: "2025-07-06" },
  { name: "Le Mans Classic 2025", start: "2025-07-03", end: "2025-07-06" },
  { name: "24 Heures Camions 2025", start: "2025-10-04", end: "2025-10-05" },
  { name: "Marathon du Mans 2025", start: "2025-10-12", end: "2025-10-12" },

  // 2026 — Circuit du Mans (calendrier officiel lemans.org)
  { name: "Championnat de l'Ouest Karting / Fun Cup 2026", start: "2026-03-28", end: "2026-03-29" },
  { name: "Superbike 2026", start: "2026-04-04", end: "2026-04-05" },
  { name: "Championnat Mini OGP / E-TROTT 2026", start: "2026-04-11", end: "2026-04-12" },
  { name: "24 Heures Moto 2026", start: "2026-04-18", end: "2026-04-19" },
  { name: "Rallye de la Sarthe 2026", start: "2026-05-02", end: "2026-05-02" },
  { name: "MotoGP France 2026", start: "2026-05-08", end: "2026-05-10" },
  { name: "SWS Karting Finals 2026", start: "2026-05-20", end: "2026-05-23" },
  { name: "Journée Test 24 Heures du Mans 2026", start: "2026-06-01", end: "2026-06-07" },
  { name: "24 Heures du Mans 2026", start: "2026-06-11", end: "2026-06-15" },
  { name: "Le Mans Classic 2026", start: "2026-07-02", end: "2026-07-05" },
  { name: "24 Heures Rollers 2026", start: "2026-07-11", end: "2026-07-12" },
  { name: "Rotax Max Challenge Karting 2026", start: "2026-07-15", end: "2026-07-18" },
  { name: "23H60 2026", start: "2026-08-21", end: "2026-08-23" },
  { name: "24 Heures Vélo 2026", start: "2026-08-29", end: "2026-08-30" },
  { name: "Porsche Sprint / F4 2026", start: "2026-09-11", end: "2026-09-12" },
  { name: "Championnat du Monde Karting KZ 2026", start: "2026-09-16", end: "2026-09-20" },
  { name: "24 Heures Camions 2026", start: "2026-09-26", end: "2026-09-27" },
  { name: "Euro Challenge IAME 2026", start: "2026-10-07", end: "2026-10-11" },
  { name: "Marathon du Mans 2026", start: "2026-10-11", end: "2026-10-11" },
  { name: "Inter Écurie / Slalom ACO 2026", start: "2026-11-07", end: "2026-11-08" },
  { name: "Trophée Tourisme Endurance 2026", start: "2026-11-13", end: "2026-11-15" },
  // Hippodrome des Hunaudières 2026 (réunions hippiques)
  { name: "Réunion hippique Hunaudières", start: "2026-03-04", end: "2026-03-04" },
  { name: "Réunion hippique Hunaudières", start: "2026-03-10", end: "2026-03-10" },
  { name: "Réunion hippique Hunaudières", start: "2026-03-21", end: "2026-03-21" },
  { name: "Réunion hippique Hunaudières", start: "2026-04-05", end: "2026-04-05" },
  { name: "Réunion hippique Hunaudières", start: "2026-05-03", end: "2026-05-03" },
  { name: "Réunion hippique Hunaudières", start: "2026-05-08", end: "2026-05-08" },
  { name: "Réunion hippique Hunaudières", start: "2026-05-21", end: "2026-05-21" },
  // GP Explorer dates annoncées plus tard

  // 2027
  { name: "Le Mans Classic 2027", start: "2027-07-02", end: "2027-07-04" },
];

/**
 * Extension (in days) applied around an event to catch bookings that arrive early
 * or leave late for the occasion.
 */
const EVENT_EXT_DAYS = 2;

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Find the first event that overlaps with [arrival, departure[ (extended window).
 * Returns the event name or null.
 */
export function findEventForStay(arrival: string, departure: string): string | null {
  for (const ev of LE_MANS_EVENTS) {
    const winStart = addDays(ev.start, -EVENT_EXT_DAYS);
    const winEnd = addDays(ev.end, EVENT_EXT_DAYS);
    // Overlap test: arrival < winEnd AND departure > winStart
    if (arrival <= winEnd && departure > winStart) {
      return ev.name;
    }
  }
  return null;
}

/**
 * Find the event (exact core dates, no extension) that includes a given day.
 * Returns the event or null.
 */
export function findEventOnDay(dateStr: string): LeMansEvent | null {
  for (const ev of LE_MANS_EVENTS) {
    if (dateStr >= ev.start && dateStr <= ev.end) return ev;
  }
  return null;
}

/** Short label for calendar display (e.g., "24h Mans", "MotoGP", "Le Mans Classic") */
export function shortEventLabel(name: string): string {
  if (name.includes("24 Heures du Mans")) return "24h Mans";
  if (name.includes("24 Heures Moto")) return "24h Moto";
  if (name.includes("MotoGP")) return "MotoGP";
  if (name.includes("Le Mans Classic")) return "Classic";
  if (name.includes("24 Heures Rollers")) return "24h Rollers";
  if (name.includes("24 Heures Camions")) return "24h Camions";
  if (name.includes("Marathon")) return "Marathon";
  if (name.includes("GP Explorer")) return "GP Explorer";
  if (name.includes("Hunaudières") || name.includes("hippique")) return "Hippodrome";
  if (name.includes("SWS Karting")) return "SWS Karting";
  if (name.includes("Rotax")) return "Rotax Karting";
  if (name.includes("IAME")) return "IAME Karting";
  if (name.includes("Monde Karting")) return "Mondial Karting";
  if (name.includes("Championnat de l'Ouest Karting")) return "Karting Ouest";
  if (name.includes("Fun Cup")) return "Fun Cup";
  if (name.includes("Superbike")) return "Superbike";
  if (name.includes("Mini OGP")) return "Mini OGP";
  if (name.includes("Rallye")) return "Rallye Sarthe";
  if (name.includes("23H60")) return "23H60";
  if (name.includes("Vélo")) return "24h Vélo";
  if (name.includes("Porsche") || name.includes("F4")) return "Porsche/F4";
  if (name.includes("Inter Écurie") || name.includes("Slalom")) return "Slalom ACO";
  if (name.includes("Trophée Tourisme")) return "TTE";
  return name;
}
