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
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    throw new Error(`Beds24 API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
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
}): Promise<Beds24Booking[]> {
  const queryParams: Record<string, string> = {};
  if (params?.arrivalFrom) queryParams.arrivalFrom = params.arrivalFrom;
  if (params?.arrivalTo) queryParams.arrivalTo = params.arrivalTo;
  if (params?.departureFrom) queryParams.departureFrom = params.departureFrom;
  if (params?.departureTo) queryParams.departureTo = params.departureTo;
  if (params?.statuses && params.statuses.length > 0) {
    queryParams.status = params.statuses.join(",");
  }

  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", queryParams);
  return data.data ?? [];
}

export async function getBookingById(id: number): Promise<Beds24Booking | null> {
  const data = await beds24Fetch<{ data: Beds24Booking[] }>("/bookings", {
    id: String(id),
    includeInvoiceItems: "true",
    includeGuests: "true",
  });
  return data.data?.[0] ?? null;
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

interface CalendarEntry {
  from: string;
  to: string;
  minStay?: number;
}

interface CalendarRoom {
  roomId: number;
  propertyId: number;
  calendar: CalendarEntry[];
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
