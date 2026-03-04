import { NextRequest, NextResponse } from "next/server";
import { getTokenRole, COOKIE_NAME } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = await getTokenRole(token);
  return NextResponse.json({ role });
}
