import { getBookings, getDailyPrices } from "@/lib/beds24";
import type { Beds24Booking } from "@/lib/types";
import type { BienFiscal } from "./config";
import { computeCABooking, computeCommissionBooking } from "./commissions";

const EXCLUDED_STATUSES = new Set(["cancelled", "black"]);

export interface RevenusBien {
  bienId: string;
  bienNom: string;
  /** CA brut hors commissions et hors taxes (à déclarer fiscalement) réalisé YTD */
  realized: number;
  /** CA brut confirmé (résa futures à venir jusqu'au 31/12) */
  confirmedUpcoming: number;
  /** CA brut projeté année pleine */
  projectedTotal: number;
  dynamicPricingTotal: number | null;
  occupancyRatio: number;
  /** Commissions plateforme extraites des invoiceItems Beds24 (YTD) */
  commissionsRealized: number;
  /** Commissions projetées sur l'année (taux moyen YTD × CA projeté) */
  commissionsProjected: number;
  source: "beds24" | "manuel";
  propertyIds?: number[];
}

function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 86400000));
}

function isCurrentYear(year: number): boolean {
  return year === new Date().getFullYear();
}

/**
 * Répartit le CA d'une résa entre part réalisée (passé) et part confirmée (futur),
 * au prorata des nuitées. Utilise le CA brut Beds24 (invoiceItems).
 */
function splitBooking(
  b: Beds24Booking,
  caBrut: number,
  today: string,
  yearEndStr: string,
): { realized: number; upcoming: number } {
  if (b.departure <= today) {
    return { realized: caBrut, upcoming: 0 };
  }
  if (b.arrival >= today) {
    return { realized: 0, upcoming: caBrut };
  }
  const totalNights = Math.max(1, daysBetween(b.arrival, b.departure));
  const pastNights = Math.max(0, daysBetween(b.arrival, today));
  const futureEnd = b.departure > yearEndStr ? yearEndStr : b.departure;
  const futureNights = Math.max(0, daysBetween(today, futureEnd));
  const perNight = caBrut / totalNights;
  return {
    realized: perNight * pastNights,
    upcoming: perNight * futureNights,
  };
}

async function computeBeds24Revenus(
  bien: Extract<BienFiscal, { source: "beds24" }>,
  year: number,
): Promise<RevenusBien> {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const today = new Date().toISOString().split("T")[0];
  const yearStart = from;
  const yearEnd = to;
  const currentYear = isCurrentYear(year);
  const clampedToday = currentYear ? today : yearEnd;

  const bookings = (
    await getBookings({
      arrivalFrom: from,
      arrivalTo: to,
      includeInvoiceItems: true,
    })
  ).filter(
    (b) =>
      !EXCLUDED_STATUSES.has((b.status ?? "").toLowerCase()) &&
      bien.propertyIds.includes(b.propertyId) &&
      b.arrival &&
      b.departure,
  );

  let realized = 0;
  let confirmedUpcoming = 0;
  let occupiedNights = 0;
  let commissionsRealized = 0;

  for (const b of bookings) {
    const caBrut = computeCABooking(b);
    const { realized: r, upcoming: u } = splitBooking(b, caBrut, clampedToday, yearEnd);
    realized += r;
    confirmedUpcoming += u;
    // Les commissions sont rattachées à la résa entière : on les compte au
    // réalisé dès que la résa est terminée (départ ≤ today).
    if (b.departure <= clampedToday) {
      commissionsRealized += computeCommissionBooking(b);
    }
    const start = b.arrival < yearStart ? yearStart : b.arrival;
    const end = b.departure > yearEnd ? yearEnd : b.departure;
    occupiedNights += Math.max(0, daysBetween(start, end));
  }

  const yearDays = daysBetween(yearStart, yearEnd) + 1;
  const daysSoFar = currentYear ? Math.max(1, daysBetween(yearStart, today)) : yearDays;
  const occupancyRatio = Math.min(
    1,
    occupiedNights / (daysSoFar * Math.max(1, bien.propertyIds.length > 1 ? 9 : 1)),
  );

  let projectedTotal = realized + confirmedUpcoming;
  let dynamicPricingTotal: number | null = null;

  if (currentYear) {
    const daysRemaining = Math.max(0, daysBetween(today, yearEnd));
    const avgDaily = daysSoFar > 0 ? realized / daysSoFar : 0;
    projectedTotal = realized + confirmedUpcoming + avgDaily * daysRemaining;

    if (daysRemaining > 0 && bien.propertyIds.length > 0) {
      try {
        const priceMap = await getDailyPrices(bien.propertyIds[0], today, yearEnd);
        let futureSum = 0;
        for (const [dateStr, price] of Object.entries(priceMap)) {
          if (dateStr >= today && dateStr <= yearEnd) futureSum += price;
        }
        dynamicPricingTotal = Math.round(realized + confirmedUpcoming + futureSum * occupancyRatio);
      } catch {
        dynamicPricingTotal = null;
      }
    }
  }

  // Projection des commissions au taux moyen observé YTD
  const tauxCommissionMoyen = realized > 0 ? commissionsRealized / realized : 0;
  const commissionsProjected = projectedTotal * tauxCommissionMoyen;

  return {
    bienId: bien.id,
    bienNom: bien.nom,
    realized: Math.round(realized * 100) / 100,
    confirmedUpcoming: Math.round(confirmedUpcoming * 100) / 100,
    projectedTotal: Math.round(projectedTotal * 100) / 100,
    dynamicPricingTotal,
    occupancyRatio: Math.round(occupancyRatio * 1000) / 1000,
    commissionsRealized: Math.round(commissionsRealized * 100) / 100,
    commissionsProjected: Math.round(commissionsProjected * 100) / 100,
    source: "beds24",
    propertyIds: bien.propertyIds,
  };
}

function computeManuelRevenus(
  bien: Extract<BienFiscal, { source: "manuel" }>,
): RevenusBien {
  return {
    bienId: bien.id,
    bienNom: bien.nom,
    realized: bien.caHT,
    confirmedUpcoming: 0,
    projectedTotal: bien.caHT,
    dynamicPricingTotal: null,
    occupancyRatio: 0,
    commissionsRealized: 0,
    commissionsProjected: 0,
    source: "manuel",
  };
}

export async function computeRevenusBien(
  bien: BienFiscal,
  year: number,
): Promise<RevenusBien> {
  if (bien.source === "beds24") return computeBeds24Revenus(bien, year);
  return computeManuelRevenus(bien);
}
