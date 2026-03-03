import { NextRequest, NextResponse } from "next/server";
import { getBookings } from "@/lib/beds24";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const bookings = await getBookings({
      arrivalFrom: searchParams.get("arrivalFrom") ?? undefined,
      arrivalTo: searchParams.get("arrivalTo") ?? undefined,
      departureFrom: searchParams.get("departureFrom") ?? undefined,
      departureTo: searchParams.get("departureTo") ?? undefined,
    });
    return NextResponse.json(bookings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
