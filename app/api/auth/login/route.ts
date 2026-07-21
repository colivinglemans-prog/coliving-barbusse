import { NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie } from "@/lib/auth";
import type { DashboardRole } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  let role: DashboardRole | null = null;

  if (password === process.env.DASHBOARD_PASSWORD) {
    role = "admin";
  } else if (
    // Mot de passe viewer générique OU tout mot de passe viewer nommé
    // (ex: DASHBOARD_PASSWORD_VIEWER_Sylvie) → même accès viewer.
    Object.entries(process.env).some(
      ([key, value]) =>
        key.startsWith("DASHBOARD_PASSWORD_VIEWER") &&
        value !== undefined &&
        value !== "" &&
        value === password,
    )
  ) {
    role = "viewer";
  }

  if (!role) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await createToken(role);
  await setAuthCookie(token);

  return NextResponse.json({ success: true, role });
}
