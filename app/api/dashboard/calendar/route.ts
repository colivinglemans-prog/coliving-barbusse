import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/beds24";

export async function GET(request: NextRequest) {
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
