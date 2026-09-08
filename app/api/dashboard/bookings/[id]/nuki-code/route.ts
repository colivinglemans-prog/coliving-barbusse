import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { getBookingById } from "@/lib/beds24";

const COOKIE_NAME = "dashboard_token";

/**
 * Beds24 dépose le PIN de la serrure Nuki dans les infoItems de la réservation,
 * sous ce code. Il n'apparaît qu'environ 6 jours avant l'arrivée.
 */
const NUKI_INFO_CODE = "NUKI_PIN";

function getSecret() {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) throw new Error("DASHBOARD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

/**
 * Code d'accès d'une réservation. Route dédiée et admin-only : le PIN ne doit
 * jamais transiter dans le payload du calendrier, que le rôle viewer peut lire.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let role = "admin";
  try {
    const { payload } = await jwtVerify(token, getSecret());
    role = (payload.role as string) ?? "admin";
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
