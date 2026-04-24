import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { updateBookingNotes } from "@/lib/beds24";

const COOKIE_NAME = "dashboard_token";

function getSecret() {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) throw new Error("DASHBOARD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function POST(
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

  const body = (await req.json().catch(() => null)) as { notes?: string } | null;
  if (body === null || typeof body.notes !== "string") {
    return NextResponse.json({ error: "Missing notes" }, { status: 400 });
  }

  try {
    await updateBookingNotes(id, body.notes);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[notes] update failed:", err);
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
