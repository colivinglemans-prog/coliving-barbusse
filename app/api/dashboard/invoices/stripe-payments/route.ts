import { NextRequest, NextResponse } from "next/server";
import { listRecentPayments } from "@/lib/stripe";
import { guard } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const refus = await guard.denyNonAdmin(request);
  if (refus) return refus;

  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);
    const daysBack = Number(request.nextUrl.searchParams.get("daysBack") ?? 90);

    const payments = await listRecentPayments({ limit, daysBack });
    return NextResponse.json(payments);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
