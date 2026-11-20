import { NextRequest, NextResponse } from "next/server";
import { daysBetween } from "@sejour/socle/lib/dates";
import { getAvailability } from "@/lib/beds24";
import { PROPERTY_ID } from "@/lib/beds24-property";
import { guard } from "@/lib/auth";

/**
 * Disponibilités brutes pour le dashboard (admin et viewer).
 *
 * Deux garde-fous (2026-11-20) :
 * - **`propertyId` = celui du site, et lui seul.** La route le prenait tel quel : le jeton
 *   Beds24 du site aurait interrogé n'importe quel autre établissement qu'il sait lire ;
 * - **une plage de 400 jours au plus**, au format `YYYY-MM-DD` : sans borne, un appel faisait
 *   travailler Beds24 sur des années et entamait le quota partagé avec le site public.
 */
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 400;

export async function GET(request: NextRequest) {
  const refus = await guard.deny(request, ["admin", "viewer"]);
  if (refus) return refus;

  try {
    const { searchParams } = request.nextUrl;
    const propertyId = searchParams.get("propertyId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!propertyId || !from || !to) {
      return NextResponse.json(
        { error: "propertyId, from, and to are required" },
        { status: 400 },
      );
    }
    if (propertyId !== String(PROPERTY_ID)) {
      return NextResponse.json({ error: "Unknown propertyId" }, { status: 400 });
    }
    if (!DATE.test(from) || !DATE.test(to) || to < from) {
      return NextResponse.json({ error: "from and to must be YYYY-MM-DD, from <= to" }, { status: 400 });
    }
    if (daysBetween(from, to) > MAX_RANGE_DAYS) {
      return NextResponse.json({ error: `Range limited to ${MAX_RANGE_DAYS} days` }, { status: 400 });
    }

    const availability = await getAvailability(PROPERTY_ID, from, to);
    return NextResponse.json(availability);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
