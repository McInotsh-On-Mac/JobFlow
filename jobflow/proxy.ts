import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  DEMO_MODE_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from "./lib/auth";

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);
const PUBLIC_FILE = /\.[^/]+$/;

function clearProxySessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const isDemoMode = request.cookies.get(DEMO_MODE_COOKIE_NAME)?.value === "1";
  const hasSessionCookie = Boolean(accessToken);

  if (!hasSessionCookie && !isDemoMode && !isPublicRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    clearProxySessionCookies(redirectResponse);
    redirectResponse.cookies.set(DEMO_MODE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return redirectResponse;
  }

  if (pathname === "/login") {
    clearProxySessionCookies(response);
    response.cookies.set(DEMO_MODE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/applications/:path*", "/login"],
};
