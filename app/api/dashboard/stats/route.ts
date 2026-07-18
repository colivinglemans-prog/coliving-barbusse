import { NextRequest, NextResponse } from "next/server";
import { getBookings, getProperties, getDailyPrices } from "@/lib/beds24";
import { normalizeChannel } from "@/lib/channel";
import { findEventForStay } from "@/lib/events";
import type { DashboardStats, RevenueMode, MonthRevenue, Beds24Booking, BookingSummary, SplitMetric } from "@/lib/types";

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

/** Signed day difference (peut être 0 ou négatif), contrairement à daysBetween qui plafonne à ≥1. */
function rawDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
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

// Statuts exclus de toutes les stats (annulations + blocages propriétaire à 0 €).
// Cohérent avec lib/bookings.ts et lib/fiscal/revenus.ts.
const EXCLUDED_STATUSES = new Set(["cancelled", "black"]);

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

/**
 * Room-nights occupées à l'intérieur de [windowStart, windowEnd[.
 * Maison entière = 9 room-nights/nuit, chambre seule = 1. Sert au taux
 * d'occupation calendaire (réalisé) et à l'occupation prévisionnelle (on the books).
 */
function occupiedRoomNightsInWindow(
  bookings: Beds24Booking[],
  windowStart: string,
  windowEnd: string,
): number {
  let sum = 0;
  for (const b of bookings) {
    const weight = b.propertyId === WHOLE_HOUSE_PROPERTY_ID ? TOTAL_ROOMS : 1;
    const start = b.arrival > windowStart ? b.arrival : windowStart;
    const end = b.departure < windowEnd ? b.departure : windowEnd;
    const nights = rawDays(start, end);
    if (nights > 0) sum += weight * nights;
  }
  return sum;
}

export async function GET(request: NextRequest) {
  try {
    const period = request.nextUrl.searchParams.get("period") ?? "3m";
    const mode = (request.nextUrl.searchParams.get("mode") ?? "averagedPerNight") as RevenueMode;
    const { from, to } = getDateRange(period);
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = today.substring(0, 7);

    // Fenêtre glissante pour l'occupation prévisionnelle (90 prochains jours),
    // indépendante de la période sélectionnée. -30j pour capter les séjours en cours.
    const fwdWindowStart = addDaysStr(today, -30);
    const fwdWindowEnd = addDaysStr(today, 90);

    const [rawBookings, properties, forwardBookings] = await Promise.all([
      getBookings({ arrivalFrom: from, arrivalTo: to }),
      getProperties(),
      getBookings({ arrivalFrom: fwdWindowStart, arrivalTo: fwdWindowEnd }),
    ]);

    // Exclut annulations et blocages propriétaire (0 €) qui faussaient revenus,
    // TJM, occupation et le premium événementiel.
    const bookings = rawBookings.filter(
      (b) => !EXCLUDED_STATUSES.has((b.status ?? "").toLowerCase()),
    );

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
        // RevPAR mensuel = revenu du mois (réalisé + réservé) ÷ nuits disponibles.
        // La maison = 1 unité louable → nuits dispo = jours du mois.
        const [mY, mM] = month.split("-").map(Number);
        const daysInMonth = new Date(mY, mM, 0).getDate();
        const revpar = daysInMonth > 0 ? Math.round((rev.realized + rev.upcoming) / daysInMonth) : 0;
        return {
          month,
          realized: Math.round(rev.realized * 100) / 100,
          upcoming: Math.round(rev.upcoming * 100) / 100,
          isFuture: month > currentMonth,
          occupancyRate,
          revpar,
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

    // Taux d'occupation global — calendaire, sur la partie *écoulée* de la période
    // (façon YTD). Nuits disponibles = 9 chambres × jours écoulés. On ne compte pas
    // les mois futurs invendus (gérés par l'occupation prévisionnelle) et, à l'inverse,
    // on n'exclut plus les mois creux passés (ancien biais qui gonflait le taux).
    const occWindowEnd = to < today ? to : today;
    const availableRoomNights = TOTAL_ROOMS * Math.max(0, rawDays(from, occWindowEnd));
    const occupiedRoomNights = occupiedRoomNightsInWindow(bookings, from, occWindowEnd);
    const occupancyRate =
      availableRoomNights > 0 ? Math.round((occupiedRoomNights / availableRoomNights) * 100) : 0;

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

    // RevPAR (Revenue Per Available Night) = TJM × taux d'occupation.
    // Contrairement au TJM (revenu par nuit *vendue*), le RevPAR intègre les
    // nuits vides : il est donc toujours ≤ TJM et reflète le rendement réel.
    const occRatio = occupancyRate / 100;
    const revpar: SplitMetric = {
      global: Math.round(tjm.global * occRatio),
      house: Math.round(tjm.house * occRatio),
      room: Math.round(tjm.room * occRatio),
    };

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

    // ─── Part des réservations directes (0 commission) ───────
    const directBookings = bookings.filter(
      (b) => normalizeChannel(b.referer, b.channel) === "Direct",
    );
    const directRevenue = directBookings.reduce((s, b) => s + b.price, 0);
    const directRevenueShare =
      totalRevenue > 0 ? Math.round((directRevenue / totalRevenue) * 100) : 0;
    const directBookingShare =
      bookings.length > 0 ? Math.round((directBookings.length / bookings.length) * 100) : 0;

    // ─── Occupation prévisionnelle 90 j (occupancy on the books) ─
    const forwardActive = forwardBookings.filter(
      (b) => !EXCLUDED_STATUSES.has((b.status ?? "").toLowerCase()),
    );
    const forwardAvailable = TOTAL_ROOMS * rawDays(today, fwdWindowEnd);
    const forwardOccupied = occupiedRoomNightsInWindow(forwardActive, today, fwdWindowEnd);
    const forwardOccupancy90 =
      forwardAvailable > 0 ? Math.round((forwardOccupied / forwardAvailable) * 100) : 0;

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
        bookingTime: b.bookingTime,
        event: findEventForStay(b.arrival, b.departure),
      };
    }

    // Réservations récentes (10 dernières par date de réservation)
    const recentBookings = [...bookings]
      .sort((a, b) => (b.bookingTime || "").localeCompare(a.bookingTime || ""))
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
    const yearStartStr = yearStart.toISOString().split("T")[0];
    const yearEndStr = yearEnd.toISOString().split("T")[0];
    const daysSoFar = Math.max(1, daysBetween(yearStartStr, today));
    const daysInYear = daysBetween(yearStartStr, yearEndStr);
    const daysRemaining = daysInYear - daysSoFar;

    // Realized = past bookings, Confirmed = future bookings already booked
    const realizedRevenue = bookings
      .filter((b) => b.arrival < today)
      .reduce((sum, b) => sum + b.price, 0);
    const confirmedUpcoming = bookings
      .filter((b) => b.arrival >= today)
      .reduce((sum, b) => sum + b.price, 0);

    // Count future days already covered by confirmed bookings
    const confirmedFutureNights = bookings
      .filter((b) => b.departure > today)
      .reduce((sum, b) => {
        const start = b.arrival < today ? today : b.arrival;
        const end = b.departure > yearEndStr ? yearEndStr : b.departure;
        return sum + Math.max(0, daysBetween(start, end));
      }, 0);
    // Uncovered future days = remaining days minus already-booked room-nights / 9 rooms
    const uncoveredDays = Math.max(0, daysRemaining - Math.round(confirmedFutureNights / TOTAL_ROOMS));

    const avgDailyRevenue = daysSoFar > 0 ? realizedRevenue / daysSoFar : 0;

    const minimumRevenue = realizedRevenue + confirmedUpcoming;
    const projectedRevenue = minimumRevenue + avgDailyRevenue * uncoveredDays;

    // Dynamic pricing projection: fetch Beds24 daily prices × occupancy ratio
    const occupancyRatio = occupancyRate / 100;
    let dynamicPricingRevenue: number | null = null;
    if (uncoveredDays > 0) {
      try {
        const priceMap = await getDailyPrices(WHOLE_HOUSE_PROPERTY_ID, today, yearEndStr);
        // Sum daily prices for the rest of the year, weighted by occupancy ratio
        let futurePricingSum = 0;
        for (const [dateStr, price] of Object.entries(priceMap)) {
          if (dateStr >= today && dateStr <= yearEndStr) {
            futurePricingSum += price;
          }
        }
        // Subtract already-confirmed nights to avoid double-counting
        const confirmedFuturePricingSum = bookings
          .filter((b) => b.departure > today)
          .reduce((sum, b) => {
            const start = b.arrival < today ? today : b.arrival;
            const end = b.departure > yearEndStr ? yearEndStr : b.departure;
            let subtotal = 0;
            const d = new Date(start + "T00:00:00");
            const endDate = new Date(end + "T00:00:00");
            while (d < endDate) {
              const key = d.toISOString().split("T")[0];
              subtotal += priceMap[key] ?? 0;
              d.setDate(d.getDate() + 1);
            }
            return sum + subtotal;
          }, 0);
        const uncoveredPricingSum = Math.max(0, futurePricingSum - confirmedFuturePricingSum);
        dynamicPricingRevenue = Math.round(minimumRevenue + uncoveredPricingSum * occupancyRatio);
      } catch (err) {
        console.warn("[stats] Dynamic pricing fetch failed:", err);
        dynamicPricingRevenue = null;
      }
    }

    const projection = {
      projectedRevenue: Math.round(projectedRevenue),
      daysRemaining,
      avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
      realizedRevenue: Math.round(realizedRevenue * 100) / 100,
      confirmedUpcoming: Math.round(confirmedUpcoming * 100) / 100,
      minimumRevenue: Math.round(minimumRevenue * 100) / 100,
      dynamicPricingRevenue,
      occupancyRatio: Math.round(occupancyRatio * 1000) / 1000,
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
      directRevenueShare,
      directBookingShare,
      forwardOccupancy90,
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
