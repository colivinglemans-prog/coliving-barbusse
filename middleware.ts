import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "dashboard_token";

function getSecret() {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) throw new Error("DASHBOARD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/dashboard/login", request.url));
  }
}

export const config = {
  matcher: ["/dashboard", "/dashboard/((?!login).*)", "/api/dashboard/:path*"],
};
