import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/beds24";
import { beds24ToPayload } from "@/lib/invoice-payload";

export async function GET(request: NextRequest) {
  try {
    const idParam = request.nextUrl.searchParams.get("bookingId");
    if (!idParam) {
      return NextResponse.json({ error: "bookingId manquant" }, { status: 400 });
    }
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: "bookingId invalide" }, { status: 400 });
    }

    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json(
        { error: `Aucune réservation/inquiry Beds24 trouvée pour l'ID ${id}` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      booking,
      payload: beds24ToPayload(booking),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
