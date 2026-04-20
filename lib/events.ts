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

  // 2026
  { name: "24 Heures Moto 2026", start: "2026-04-17", end: "2026-04-19" },
  { name: "MotoGP France 2026", start: "2026-05-08", end: "2026-05-10" },
  { name: "24 Heures du Mans 2026", start: "2026-06-05", end: "2026-06-14" },
  { name: "24 Heures Rollers 2026", start: "2026-07-11", end: "2026-07-12" },
  { name: "24 Heures Camions 2026", start: "2026-10-02", end: "2026-10-04" },
  { name: "Marathon du Mans 2026", start: "2026-10-11", end: "2026-10-11" },
  { name: "Le Mans Classic 2026", start: "2026-07-03", end: "2026-07-05" },
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
  return name;
}
