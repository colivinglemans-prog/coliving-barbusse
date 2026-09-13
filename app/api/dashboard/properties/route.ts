import { NextRequest, NextResponse } from "next/server";
import { getProperties } from "@/lib/beds24";
import { guard } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  try {
    const properties = await getProperties();
    return NextResponse.json(properties);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
