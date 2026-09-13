import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/beds24";
import { guard } from "@/lib/auth";

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

    const availability = await getAvailability(Number(propertyId), from, to);
    return NextResponse.json(availability);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
