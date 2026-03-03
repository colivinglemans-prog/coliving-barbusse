import { NextRequest, NextResponse } from "next/server";
import { getAvailability, getMinStay } from "@/lib/beds24";

const PROPERTY_ID = 303771;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const mode = searchParams.get("mode");

    // Map mode: return full availability for a date range (for the calendar)
    if (mode === "map") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if (!from || !to) {
        return NextResponse.json(
          { error: "from and to are required for map mode" },
          { status: 400 },
        );
      }
      const [availability, minStay] = await Promise.all([
        getAvailability(PROPERTY_ID, from, to),
        getMinStay(PROPERTY_ID, from, to),
      ]);
      return NextResponse.json({ dates: availability, minStay });
    }

    // Legacy check mode: check-in / check-out validation
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { available: false, message: "Dates manquantes." },
        { status: 400 },
      );
    }

    const availability = await getAvailability(PROPERTY_ID, checkIn, checkOut);

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const unavailableDates: string[] = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      if (availability[dateStr] === false) {
        unavailableDates.push(dateStr);
      }
    }

    if (unavailableDates.length === 0) {
      const nights = Math.round((end.getTime() - start.getTime()) / 86400000);
      return NextResponse.json({
        available: true,
        message: `La maison est disponible pour ${nights} nuit${nights > 1 ? "s" : ""} du ${checkIn} au ${checkOut}.`,
      });
    }

    return NextResponse.json({
      available: false,
      message: `La maison n'est pas disponible sur ces dates. ${unavailableDates.length} jour(s) déjà réservé(s).`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json(
      { available: false, message: `Erreur: ${message}` },
      { status: 500 },
    );
  }
}
