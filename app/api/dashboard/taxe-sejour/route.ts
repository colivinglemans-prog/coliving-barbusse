import { NextRequest, NextResponse } from "next/server";
import { getBookingsWithArchive } from "@/lib/bookings";
import {
  TAXE_SEJOUR_CONFIG,
  computeTaxeSejour,
  groupByChannel,
  groupByQuarter,
  type ChannelTotals,
  type QuarterTotals,
  type TaxeSejourLine,
} from "@/lib/taxe-sejour";
import { EXCLUDED_STATUSES } from "@sejour/socle/lib/booking-status";


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
    bookings = await getBookingsWithArchive({
      departureFrom: from,
      departureTo: to,
      includeInvoiceItems: true,
    });
  } catch (err) {
    // Le détail reste dans les logs : le message du client Beds24 porte le chemin interne et
    // 200 caractères de la réponse de l'API. Utile pour diagnostiquer, inutile au navigateur —
    // et c'est précisément ce qu'on a retiré du rôle restreint côté Albiez.
    console.error("[taxe-sejour] Beds24 :", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Beds24 momentanément injoignable" }, { status: 502 });
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
