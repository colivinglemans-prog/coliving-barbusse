import type { Beds24Booking, Beds24Property } from "./types";

const BEDS24_API_URL = "https://api.beds24.com/v2";

async function beds24Fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const token = process.env.BEDS24_API_TOKEN;
  if (!token) throw new Error("BEDS24_API_TOKEN is not set");

  const url = new URL(`${BEDS24_API_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: { token },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Beds24 API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function updateBookingNotes(id: number, notes: string): Promise<void> {
  const token = process.env.BEDS24_API_TOKEN;
  if (!token) throw new Error("BEDS24_API_TOKEN is not set");
  const res = await fetch(`${BEDS24_API_URL}/bookings`, {
    method: "POST",
    headers: { token, "Content-Type": "application/json" },
    body: JSON.stringify([{ id, notes }]),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Beds24 updateBookingNotes failed: ${res.status} ${body}`);
  }
}

export async function getProperties(): Promise<Beds24Property[]> {
  const data = await beds24Fetch<{ data: Beds24Property[] }>("/properties");
  return data.data ?? [];
}

export async function getBookings(params?: {
  arrivalFrom?: string;
  arrivalTo?: string;
  departureFrom?: string;
  departureTo?: string;
  statuses?: string[];
  includeInvoiceItems?: boolean;
}): Promise<Beds24Booking[]> {
  const queryParams: Record<string, string> = {};
  if (params?.arrivalFrom) queryParams.arrivalFrom = params.arrivalFrom;
  if (params?.arrivalTo) queryParams.arrivalTo = params.arrivalTo;
  if (params?.departureFrom) queryParams.departureFrom = params.departureFrom;
  if (params?.departureTo) queryParams.departureTo = params.departureTo;
  if (params?.statuses && params.statuses.length > 0) {
    queryParams.status = params.statuses.join(",");
  }
  if (params?.includeInvoiceItems) {
    queryParams.includeInvoiceItems = "true";
  }

  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", queryParams);
  return data.data ?? [];
}

export async function getBookingById(id: number): Promise<Beds24Booking | null> {
  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", {
    id: String(id),
    includeInvoiceItems: "true",
    includeGuests: "true",
    includeInfoItems: "true",
  });
  return data.data?.[0] ?? null;
}

/**
 * Cherche une réservation Beds24 qui contient un des IDs Stripe dans ses infoItems.
 * Beds24 stocke typiquement le charge id (ch_…) sous le code "STRIPEPAYMENT"
 * avec un texte du genre "Payment 123.45 EUR, ch_3M…".
 */
export async function findBookingByStripeIds(
  stripeIds: string[],
): Promise<Beds24Booking | null> {
  const targets = stripeIds
    .map((s) => s?.trim())
    .filter((s): s is string => Boolean(s));
  if (targets.length === 0) return null;

  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 12, 1);
  const to = new Date(now.getFullYear() + 2, now.getMonth(), 0);
  const arrivalFrom = from.toISOString().split("T")[0];
  const arrivalTo = to.toISOString().split("T")[0];

  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", {
    arrivalFrom,
    arrivalTo,
    includeInfoItems: "true",
    includeGuests: "true",
  });

  const bookings = data.data ?? [];
  const match = bookings.find((b) =>
    b.infoItems?.some(
      (i) =>
        (i.code ?? "").toUpperCase() === "STRIPEPAYMENT" &&
        targets.some((t) => (i.text ?? "").includes(t)),
    ),
  );
  return match ?? null;
}

interface AvailabilityRoom {
  roomId: number;
  propertyId: number;
  availability: Record<string, boolean>;
}

export async function getAvailability(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, boolean>> {
  const data = await beds24Fetch<{ data: AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { startDate: from, endDate: to, propertyId: String(propertyId) },
  );
  // Merge availability across all rooms: a date is occupied if ANY room is unavailable
  const merged: Record<string, boolean> = {};
  for (const room of data.data ?? []) {
    for (const [date, available] of Object.entries(room.availability)) {
      if (merged[date] === undefined) merged[date] = available;
      // If any room is unavailable, mark the date as unavailable
      if (!available) merged[date] = false;
    }
  }
  return merged;
}

/**
 * Returns dates where the WHOLE house is booked (all rooms unavailable).
 * Used for sold-out detection on blog articles.
 */
export async function getFullyBookedDates(
  propertyId: number,
  from: string,
  to: string,
): Promise<Set<string>> {
  const data = await beds24Fetch<{ data: AvailabilityRoom[] }>(
    "/inventory/rooms/availability",
    { startDate: from, endDate: to, propertyId: String(propertyId) },
  );
  const rooms = data.data ?? [];
  if (rooms.length === 0) return new Set();

  // Count for each date how many rooms are unavailable
  const unavailableCount: Record<string, number> = {};
  const totalRooms = rooms.length;
  for (const room of rooms) {
    for (const [date, available] of Object.entries(room.availability)) {
      if (!available) {
        unavailableCount[date] = (unavailableCount[date] ?? 0) + 1;
      }
    }
  }
  // Fully booked = all rooms unavailable that day
  const fullyBooked = new Set<string>();
  for (const [date, count] of Object.entries(unavailableCount)) {
    if (count === totalRooms) fullyBooked.add(date);
  }
  return fullyBooked;
}

interface CalendarEntry {
  from: string;
  to: string;
  minStay?: number;
  price1?: number;
}

interface CalendarRoom {
  roomId: number;
  propertyId: number;
  calendar: CalendarEntry[];
}

/**
 * Fetch daily prices (price1) across all rooms of a property.
 * Returns a map of date → total daily price (sum of all rooms' price1 for that date).
 * Used for dynamic revenue projection.
 */
export async function getDailyPrices(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await beds24Fetch<{ data: CalendarRoom[] }>(
    "/inventory/rooms/calendar",
    {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includePrices: "true",
    },
  );

  const sumByDate: Record<string, number> = {};
  for (const room of data.data ?? []) {
    for (const entry of room.calendar) {
      if (entry.price1 === undefined || entry.price1 === null) continue;
      const start = new Date(entry.from + "T00:00:00");
      const end = new Date(entry.to + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        sumByDate[dateStr] = (sumByDate[dateStr] ?? 0) + entry.price1;
      }
    }
  }
  return sumByDate;
}

export async function getMinStay(
  propertyId: number,
  from: string,
  to: string,
): Promise<Record<string, number>> {
  const data = await beds24Fetch<{ data: CalendarRoom[] }>(
    "/inventory/rooms/calendar",
    {
      propertyId: String(propertyId),
      startDate: from,
      endDate: to,
      includeMinStay: "true",
    },
  );

  const result: Record<string, number> = {};
  for (const room of data.data ?? []) {
    for (const entry of room.calendar) {
      if (entry.minStay === undefined) continue;
      // Expand date range into per-day entries
      const start = new Date(entry.from + "T00:00:00");
      const end = new Date(entry.to + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        result[dateStr] = entry.minStay;
      }
    }
  }
  return result;
}
