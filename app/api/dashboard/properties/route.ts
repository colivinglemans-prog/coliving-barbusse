import { NextResponse } from "next/server";
import { getProperties } from "@/lib/beds24";

export async function GET() {
  try {
    const properties = await getProperties();
    return NextResponse.json(properties);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
