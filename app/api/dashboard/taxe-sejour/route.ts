import { NextRequest, NextResponse } from "next/server";
import { getBookings } from "@/lib/beds24";
import {
  TAXE_SEJOUR_CONFIG,
  computeTaxeSejour,
  groupByChannel,
  groupByQuarter,
  type ChannelTotals,
  type QuarterTotals,
  type TaxeSejourLine,
} from "@/lib/taxe-sejour";

const EXCLUDED_STATUSES = new Set(["cancelled", "black"]);

export interface TaxeSejourResponse {
  year: number;
  config: typeof TAXE_SEJOUR_CONFIG;
  direct: {
    totalTax: number;
    bookingsCount: number;
    nightsCount: number;
    quarters: QuarterTotals[];
  };
  collectees: {
    channels: ChannelTotals[];
    totalTax: number;
    totalTaxCollected: number;
    bookingsCount: number;
  };
}

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year")) || new Date().getFullYear();

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  let bookings;
  try {
    bookings = await getBookings({
      departureFrom: from,
      departureTo: to,
      includeInvoiceItems: true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Beds24 error" },
      { status: 502 },
    );
  }

  const lines: TaxeSejourLine[] = bookings
    .filter((b) => !EXCLUDED_STATUSES.has((b.status ?? "").toLowerCase()))
    .filter((b) => Boolean(b.arrival) && Boolean(b.departure))
    .map(computeTaxeSejour);

  const directLines = lines.filter((l) => l.channel === "Direct");
  const collecteesLines = lines.filter((l) => l.channel === "Airbnb" || l.channel === "Booking.com");

  const directQuarters = groupByQuarter(directLines, year);
  const collecteesChannels = groupByChannel(collecteesLines, ["Airbnb", "Booking.com"]);

  const response: TaxeSejourResponse = {
    year,
    config: TAXE_SEJOUR_CONFIG,
    direct: {
      totalTax: directLines.reduce((sum, l) => sum + l.taxTotal, 0),
      bookingsCount: directLines.length,
      nightsCount: directLines.reduce((sum, l) => sum + l.nights, 0),
      quarters: directQuarters,
    },
    collectees: {
      channels: collecteesChannels,
      totalTax: collecteesLines.reduce((sum, l) => sum + l.taxTotal, 0),
      totalTaxCollected: collecteesLines.reduce(
        (sum, l) => sum + (l.taxCollected ?? 0),
        0,
      ),
      bookingsCount: collecteesLines.length,
    },
  };

  return NextResponse.json(response);
}
