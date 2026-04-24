import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "dashboard_token";

function getSecret() {
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) throw new Error("DASHBOARD_SECRET is not set");
  return new TextEncoder().encode(secret);
}

// Paths that previously lived at the root and now belong under /fr/*
const LEGACY_PATHS = ["/blog", "/chambres"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 301 redirect removed /:locale/reservation pages to the locale homepage
  // (which already embeds the reservation calendar in the disponibility section)
  const reservationMatch = pathname.match(/^\/(fr|en)\/reservation(?:\/.*)?$/);
  if (reservationMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/${reservationMatch[1]}`;
    url.search = search;
    return NextResponse.redirect(url, 301);
  }

  // Also redirect bare /reservation → /fr (old pre-i18n URL)
  if (pathname === "/reservation" || pathname.startsWith("/reservation/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/fr";
    url.search = search;
    return NextResponse.redirect(url, 301);
  }

  // 301 redirect old non-localized URLs to /fr/*
  for (const legacy of LEGACY_PATHS) {
    if (pathname === legacy || pathname.startsWith(`${legacy}/`)) {
      const url = request.nextUrl.clone();
      url.pathname = `/fr${pathname}`;
      url.search = search;
      return NextResponse.redirect(url, 301);
    }
  }

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
      if (role === "viewer" && pathname.startsWith("/dashboard/taxe-sejour")) {
        return NextResponse.redirect(new URL("/dashboard/calendar", request.url));
      }
      if (role === "viewer" && pathname.startsWith("/dashboard/fiscal")) {
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

      if (
        role === "viewer" &&
        (pathname.startsWith("/api/dashboard/stats") ||
          pathname.startsWith("/api/dashboard/invoices") ||
          pathname.startsWith("/api/dashboard/taxe-sejour") ||
          pathname.startsWith("/api/dashboard/fiscal"))
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/blog/:path*",
    "/chambres/:path*",
    "/reservation/:path*",
    "/fr/reservation/:path*",
    "/en/reservation/:path*",
    "/dashboard",
    "/dashboard/((?!login).*)",
    "/api/dashboard/:path*",
  ],
};
