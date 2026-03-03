import { NextRequest, NextResponse } from "next/server";
import { createToken, setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = await createToken();
  await setAuthCookie(token);

  return NextResponse.json({ success: true });
}
