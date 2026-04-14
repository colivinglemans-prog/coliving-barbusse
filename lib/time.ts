const TZ = "Europe/Paris";

/** Current date/time in Paris timezone */
export function nowParis(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
}

/** Current hour in Paris (0-23) */
export function currentHourParis(): number {
  return nowParis().getHours();
}

/** Today's date as "YYYY-MM-DD" in Paris timezone */
export function todayParis(): string {
  const d = nowParis();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Tomorrow's date as "YYYY-MM-DD" in Paris timezone */
export function tomorrowParis(): string {
  const d = nowParis();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
