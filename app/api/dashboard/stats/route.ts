import { NextRequest, NextResponse } from "next/server";
import { getBookings, getProperties } from "@/lib/beds24";
import type { DashboardStats, RevenueMode, MonthRevenue, Beds24Booking, BookingSummary, SplitMetric } from "@/lib/types";

function normalizeChannel(referer: string, channel?: string): string {
  const c = (channel ?? "").toLowerCase();
  const r = referer.toLowerCase();

  if (c === "airbnb" || r.includes("airbnb")) return "Airbnb";
  if (c.includes("booking") || r.includes("booking")) return "Booking.com";
  if (c === "vrbo" || r.includes("abritel") || r.includes("homeaway") || r.includes("vrbo")) return "Abritel";
  if (c === "direct" || r === "direct" || r === "app" || r === "") return "Direct";
  return "Direct";
}

function getDateRange(period: string): { from: string; to: string } {
  const now = new Date();
  const fromDate = new Date(now);
  const toDate = new Date(now);

  switch (period) {
    case "30d":
      fromDate.setDate(fromDate.getDate() - 15);
      toDate.setDate(toDate.getDate() + 15);
      break;
    case "3m":
      fromDate.setMonth(fromDate.getMonth() - 1);
      toDate.setMonth(toDate.getMonth() + 2);
      break;
    case "6m":
      fromDate.setMonth(fromDate.getMonth() - 3);
      toDate.setMonth(toDate.getMonth() + 3);
      break;
    case "1y":
      fromDate.setMonth(fromDate.getMonth() - 6);
      toDate.setMonth(toDate.getMonth() + 6);
      break;
    case "fiscal":
      fromDate.setMonth(0, 1);
      toDate.setMonth(11, 31);
      break;
    default:
      fromDate.setMonth(fromDate.getMonth() - 1);
      toDate.setMonth(toDate.getMonth() + 2);
  }

  return {
    from: fromDate.toISOString().split("T")[0],
    to: toDate.toISOString().split("T")[0],
  };
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.max(1, Math.round((new Date(b).getTime() - new Date(a).getTime()) / msPerDay));
}

function addRevenueToMap(
  map: Map<string, { realized: number; upcoming: number }>,
  month: string,
  amount: number,
  isRealized: boolean,
) {
  const existing = map.get(month) ?? { realized: 0, upcoming: 0 };
  if (isRealized) {
    existing.realized += amount;
  } else {
    existing.upcoming += amount;
  }
  map.set(month, existing);
}

function computeRevenue(
  bookings: Beds24Booking[],
  mode: RevenueMode,
  today: string,
): Map<string, { realized: number; upcoming: number }> {
  const revenueMap = new Map<string, { realized: number; upcoming: number }>();

  for (const b of bookings) {
    const isRealized = b.arrival < today;

    switch (mode) {
      case "byCheckIn": {
        const month = b.arrival.substring(0, 7);
        addRevenueToMap(revenueMap, month, b.price, isRealized);
        break;
      }
      case "byCheckOut": {
        const month = b.departure.substring(0, 7);
        addRevenueToMap(revenueMap, month, b.price, b.departure <= today);
        break;
      }
      case "byBookingDate": {
        const bookingDate = b.bookingTime ? b.bookingTime.substring(0, 10) : b.arrival;
        const month = bookingDate.substring(0, 7);
        addRevenueToMap(revenueMap, month, b.price, bookingDate < today);
        break;
      }
      case "averagedPerNight": {
        const nights = daysBetween(b.arrival, b.departure);
        const perNight = b.price / nights;
        // Spread revenue across each night
        const start = new Date(b.arrival);
        for (let i = 0; i < nights; i++) {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          const dateStr = d.toISOString().split("T")[0];
          const month = dateStr.substring(0, 7);
          addRevenueToMap(revenueMap, month, perNight, dateStr < today);
        }
        break;
      }
    }
  }

  return revenueMap;
}

// Property 303771 = whole house (counts as 9 rooms), Property 310268 = per room (1 room each)
const TOTAL_ROOMS = 9;
const WHOLE_HOUSE_PROPERTY_ID = 303771;

function computeOccupancyByMonth(
  bookings: Beds24Booking[],
): Map<string, { occupied: number; total: number }> {
  // Count room-nights per month
  // Each booking contributes room-nights: whole-house = 9, per-room = 1
  const monthMap = new Map<string, { occupied: number; total: number }>();

  for (const b of bookings) {
    const roomWeight = b.propertyId === WHOLE_HOUSE_PROPERTY_ID ? TOTAL_ROOMS : 1;
    const nights = daysBetween(b.arrival, b.departure);
    const start = new Date(b.arrival);
    for (let i = 0; i < nights; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const month = d.toISOString().split("T")[0].substring(0, 7);
      const existing = monthMap.get(month) ?? { occupied: 0, total: 0 };
      existing.occupied += roomWeight;
      monthMap.set(month, existing);
    }
  }

  // Fill in total room-nights per month (9 rooms × days in month)
  for (const [month, data] of monthMap) {
    const year = parseInt(month.substring(0, 4));
    const m = parseInt(month.substring(5, 7));
    const daysInMonth = new Date(year, m, 0).getDate();
    data.total = TOTAL_ROOMS * daysInMonth;
    // Cap occupied at total (overlapping bookings)
    data.occupied = Math.min(data.occupied, data.total);
  }

  return monthMap;
}

export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get("period") ?? "3m";
    const mode = (request.nextUrl.searchParams.get("mode") ?? "averagedPerNight") as RevenueMode;
    const { from, to } = getDateRange(period);
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);

    const [bookings, properties] = await Promise.all([
      getBookings({ arrivalFrom: from, arrivalTo: to }),
      getProperties(),
    ]);

    // Revenue by month
    const revenueMap = computeRevenue(bookings, mode, today);

    // Occupancy by month (always based on actual nights)
    const occupancyMap = computeOccupancyByMonth(bookings);

    // Build all months in range (ensure continuous months for fiscal view)
    const allMonths = new Set<string>();
    let [curY, curM] = from.substring(0, 7).split("-").map(Number);
    const [endY, endM] = to.substring(0, 7).split("-").map(Number);
    while (curY < endY || (curY === endY && curM <= endM)) {
      allMonths.add(`${curY}-${String(curM).padStart(2, "0")}`);
      curM++;
      if (curM > 12) { curM = 1; curY++; }
    }
    for (const key of revenueMap.keys()) allMonths.add(key);
    for (const key of occupancyMap.keys()) allMonths.add(key);

    const revenueByMonth: MonthRevenue[] = Array.from(allMonths)
      .sort()
      .map((month) => {
        const rev = revenueMap.get(month) ?? { realized: 0, upcoming: 0 };
        const occ = occupancyMap.get(month);
        const occupancyRate = occ ? Math.round((occ.occupied / occ.total) * 100) : 0;
        return {
          month,
          realized: Math.round(rev.realized * 100) / 100,
          upcoming: Math.round(rev.upcoming * 100) / 100,
          isFuture: month > currentMonth,
          occupancyRate,
        };
      });

    // Channel distribution
    const channelMap = new Map<string, { count: number; revenue: number }>();
    for (const b of bookings) {
      const channel = normalizeChannel(b.referer, b.channel);
      const existing = channelMap.get(channel) ?? { count: 0, revenue: 0 };
      channelMap.set(channel, {
        count: existing.count + 1,
        revenue: existing.revenue + b.price,
      });
    }
    const channelDistribution = Array.from(channelMap.entries()).map(
      ([channel, data]) => ({ channel, ...data }),
    );

    // Global occupancy rate (room-nights based)
    let occupancyRate = 0;
    const totalOccupied = Array.from(occupancyMap.values()).reduce((s, v) => s + v.occupied, 0);
    const totalRoomNights = Array.from(occupancyMap.values()).reduce((s, v) => s + v.total, 0);
    if (totalRoomNights > 0) occupancyRate = Math.round((totalOccupied / totalRoomNights) * 100);

    // ─── Split bookings by type ──────────────────────────────
    const houseBookings = bookings.filter((b) => b.propertyId === WHOLE_HOUSE_PROPERTY_ID);
    const roomBookings = bookings.filter((b) => b.propertyId !== WHOLE_HOUSE_PROPERTY_ID);

    function computeNights(list: Beds24Booking[]): number {
      return list.reduce((sum, b) => sum + daysBetween(b.arrival, b.departure), 0);
    }

    const totalNights = computeNights(bookings);
    const houseNights = computeNights(houseBookings);
    const roomNights = computeNights(roomBookings);

    const totalRevenue = bookings.reduce((sum, b) => sum + b.price, 0);
    const houseRevenue = houseBookings.reduce((sum, b) => sum + b.price, 0);
    const roomRevenue = roomBookings.reduce((sum, b) => sum + b.price, 0);

    // TJM (Tarif Journalier Moyen / ADR)
    const tjm: SplitMetric = {
      global: totalNights > 0 ? Math.round(totalRevenue / totalNights) : 0,
      house: houseNights > 0 ? Math.round(houseRevenue / houseNights) : 0,
      room: roomNights > 0 ? Math.round(roomRevenue / roomNights) : 0,
    };

    // RevPAR (Revenue Per Available Room)
    const revpar = totalRoomNights > 0
      ? Math.round((totalRevenue / totalRoomNights) * 100) / 100
      : 0;

    // Durée moyenne de séjour
    const avgStay: SplitMetric = {
      global: bookings.length > 0 ? Math.round((totalNights / bookings.length) * 10) / 10 : 0,
      house: houseBookings.length > 0 ? Math.round((houseNights / houseBookings.length) * 10) / 10 : 0,
      room: roomBookings.length > 0 ? Math.round((roomNights / roomBookings.length) * 10) / 10 : 0,
    };

    // Délai moyen de réservation (jours entre bookingTime et arrival)
    function computeAvgLeadTime(list: Beds24Booking[]): number {
      const withBookingTime = list.filter((b) => b.bookingTime);
      if (withBookingTime.length === 0) return 0;
      const totalDays = withBookingTime.reduce((sum, b) => {
        const bookingDate = b.bookingTime.substring(0, 10);
        return sum + Math.max(0, daysBetween(bookingDate, b.arrival));
      }, 0);
      return Math.round(totalDays / withBookingTime.length);
    }

    const avgLeadTime: SplitMetric = {
      global: computeAvgLeadTime(bookings),
      house: computeAvgLeadTime(houseBookings),
      room: computeAvgLeadTime(roomBookings),
    };

    // ─── Booking summaries ───────────────────────────────────
    function toSummary(b: Beds24Booking): BookingSummary {
      const nights = daysBetween(b.arrival, b.departure);
      return {
        id: b.id,
        guest: `${b.firstName} ${b.lastName}`.trim() || "—",
        arrival: b.arrival,
        departure: b.departure,
        nights,
        price: Math.round(b.price * 100) / 100,
        tjm: nights > 0 ? Math.round(b.price / nights) : 0,
        channel: normalizeChannel(b.referer, b.channel),
        type: b.propertyId === WHOLE_HOUSE_PROPERTY_ID ? "house" : "room",
      };
    }

    // Réservations récentes (10 dernières par arrivée)
    const recentBookings = [...bookings]
      .sort((a, b) => b.arrival.localeCompare(a.arrival))
      .slice(0, 10)
      .map(toSummary);

    // Top réservations par TJM
    const topBookings = [...bookings]
      .map(toSummary)
      .sort((a, b) => b.tjm - a.tjm)
      .slice(0, 10);

    // ─── Projection annuelle ─────────────────────────────────
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear(), 11, 31);
    const daysSoFar = Math.max(1, daysBetween(yearStart.toISOString().split("T")[0], today));
    const daysInYear = daysBetween(yearStart.toISOString().split("T")[0], yearEnd.toISOString().split("T")[0]);
    const daysRemaining = daysInYear - daysSoFar;

    // Realized revenue = bookings with arrival < today
    const realizedRevenue = bookings
      .filter((b) => b.arrival < today)
      .reduce((sum, b) => sum + b.price, 0);
    const avgDailyRevenue = daysSoFar > 0 ? realizedRevenue / daysSoFar : 0;

    const projection = {
      projectedRevenue: Math.round(realizedRevenue + avgDailyRevenue * daysRemaining),
      daysRemaining,
      avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
      realizedRevenue: Math.round(realizedRevenue * 100) / 100,
    };

    const stats: DashboardStats = {
      revenueByMonth,
      occupancyRate,
      channelDistribution,
      totalRevenue,
      totalBookings: bookings.length,
      tjm,
      revpar,
      avgStay,
      avgLeadTime,
      recentBookings,
      topBookings,
      projection,
    };

    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
