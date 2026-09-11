import { NextRequest, NextResponse } from "next/server";
import { getBookingById } from "@/lib/beds24";
import { guard } from "@/lib/auth";

/**
 * Beds24 dépose le PIN de la serrure Nuki dans les infoItems de la réservation,
 * sous ce code. Il n'apparaît qu'environ 6 jours avant l'arrivée.
 */
const NUKI_INFO_CODE = "NUKI_PIN";

/**
 * Code d'accès d'une réservation. Route dédiée et admin-only : le PIN ne doit jamais
 * transiter dans le payload du calendrier, que le rôle `viewer` peut lire.
 *
 * C'est aussi la seule route qui demande `includeInfoItems` sur une réservation isolée
 * (via `getBookingById`) : la liste générale ne les réclame pas, et l'archive locale s'en
 * voit dépouillée dans `getBookings`.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const refus = await guard.denyNonAdmin(req);
  if (refus) return refus;

  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
  }

  try {
    const booking = await getBookingById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const item = booking.infoItems?.find(
      (i) => (i.code ?? "").toUpperCase() === NUKI_INFO_CODE,
    );
    const code = item?.text?.trim();

    // Ne jamais logger le PIN : le dépôt est public.
    return NextResponse.json({ code: code || null });
  } catch (err) {
    console.error("[nuki-code] lookup failed for booking", id, err);
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
