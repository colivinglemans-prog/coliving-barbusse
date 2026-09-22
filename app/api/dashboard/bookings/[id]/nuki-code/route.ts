import { NextRequest, NextResponse } from "next/server";
import { getBookingById, nukiCodeOf } from "@/lib/beds24";
import { guard } from "@/lib/auth";

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

    // Ne jamais logger le PIN : le dépôt est public.
    return NextResponse.json({ code: nukiCodeOf(booking) });
  } catch (err) {
    console.error("[nuki-code] lookup failed for booking", id, err);
    const message = err instanceof Error ? err.message : "Lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
