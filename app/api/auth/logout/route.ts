import { NextResponse } from "next/server";
import { removeAuthCookie } from "@sejour/socle/lib/auth-cookie";

export async function POST() {
  await removeAuthCookie();
  return NextResponse.json({ success: true });
}
