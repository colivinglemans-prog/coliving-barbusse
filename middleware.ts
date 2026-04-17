import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "dashboard_token";
const LOCALE_COOKIE = "locale";

function getSecret() {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) throw new Error("DASHBOARD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

function detectLocale(request: NextRequest): "fr" | "en" {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie === "fr" || cookie === "en") return cookie;

  const acceptLang = request.headers.get("accept-language") || "";
  if (acceptLang.startsWith("fr") || acceptLang.includes("fr-")) return "fr";
  return "en";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard auth
  if (
    pathname.startsWith("/dashboard") &&
    !pathname.startsWith("/dashboard/login")
  ) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = (payload.role as string) ?? "admin";

      // Viewers can only access the calendar page
      if (role === "viewer" && pathname === "/dashboard") {
        return NextResponse.redirect(new URL("/dashboard/calendar", request.url));
      }
      if (role === "viewer" && pathname.startsWith("/dashboard/invoices")) {
        return NextResponse.redirect(new URL("/dashboard/calendar", request.url));
      }
      if (role === "viewer" && pathname.startsWith("/api/dashboard/stats")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.redirect(new URL("/dashboard/login", request.url));
    }
  }

  // API routes for dashboard
  if (pathname.startsWith("/api/dashboard")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      const { payload } = await jwtVerify(token, getSecret());
      const role = (payload.role as string) ?? "admin";

      // Viewers cannot access admin-only APIs
      if (
        role === "viewer" &&
        (pathname.startsWith("/api/dashboard/stats") ||
          pathname.startsWith("/api/dashboard/invoices"))
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Locale detection for public pages
  const locale = detectLocale(request);
  const response = NextResponse.next();
  response.headers.set("x-locale", locale);

  // Set locale cookie if not already set
  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    response.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 365 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard",
    "/dashboard/((?!login).*)",
    "/api/dashboard/:path*",
  ],
};
