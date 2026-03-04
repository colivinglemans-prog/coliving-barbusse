import { NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie } from "@/lib/auth";
import type { DashboardRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  let role: DashboardRole | null = null;

  if (password === process.env.DASHBOARD_PASSWORD) {
    role = "admin";
  } else if (password === process.env.DASHBOARD_PASSWORD_VIEWER) {
    role = "viewer";
  }

  if (!role) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await createToken(role);
  await setAuthCookie(token);

  return NextResponse.json({ success: true, role });
}
