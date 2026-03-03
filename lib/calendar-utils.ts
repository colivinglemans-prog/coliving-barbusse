/** Format a Date to "YYYY-MM-DD" (local time, no timezone issues) */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Parse "YYYY-MM-DD" to a local Date */
export function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Days in a given month (0-indexed month) */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Weekday index of the 1st of the month (0=Mon ... 6=Sun, ISO week) */
export function firstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1;
}

/** Add N months to a {year, month} pair */
export function addMonths(
  year: number,
  month: number,
  n: number,
): { year: number; month: number } {
  const d = new Date(year, month + n, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

/** "YYYY-MM" key from year + 0-indexed month */
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

/** Add N days to a date string, return new date string */
export function addDays(dateStr: string, n: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

export const MONTH_NAMES_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export const DAY_NAMES_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
