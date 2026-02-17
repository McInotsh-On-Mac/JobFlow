import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "./lib/auth";
import { fetchSupabaseUser, refreshWithToken, type SupabaseSession } from "./lib/supabase-auth";

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/forgot-password", "/reset-password"]);
const PUBLIC_FILE = /\.[^/]+$/;

function setProxySessionCookies(response: NextResponse, session: SupabaseSession) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, session.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: session.expiresIn,
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, session.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });
}

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
  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (accessToken) {
    const user = await fetchSupabaseUser(accessToken);
    isAuthenticated = Boolean(user);
  }

  if (!isAuthenticated && refreshToken) {
    const { session } = await refreshWithToken(refreshToken);

    if (session) {
      setProxySessionCookies(response, session);
      accessToken = session.accessToken;
      const user = await fetchSupabaseUser(accessToken);
      isAuthenticated = Boolean(user);
    } else {
      clearProxySessionCookies(response);
    }
  }

  if (!isAuthenticated && !isPublicRoute) {
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url));
    clearProxySessionCookies(redirectResponse);
    return redirectResponse;
  }

  if (pathname === "/login") {
    clearProxySessionCookies(response);
  }

  return response;
}

export const config = {
  matcher: ["/:path*"],
};
