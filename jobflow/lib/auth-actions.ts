"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  DEMO_MODE_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "./auth";
import {
  exchangeRecoveryTokenHash,
  signInWithPassword,
  sendPasswordResetEmail,
  signOutFromSupabase,
  signUpWithPassword,
  updatePasswordWithAccessToken,
  type SupabaseSession,
} from "./supabase-auth";

function redirectWithReason(path: string, error: string, reason?: string): never {
  const params = new URLSearchParams({ error });
  if (reason) {
    params.set("reason", reason.slice(0, 180));
  }

  return redirect(`${path}?${params.toString()}`);
}

async function setSessionCookies(session: SupabaseSession) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: session.accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: session.expiresIn,
  });

  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: session.refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
  });

  cookieStore.set({
    name: DEMO_MODE_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
}

async function getAppBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!host) {
    return "http://localhost:3000";
  }

  const proto =
    headerStore.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    redirectWithReason("/login", "missing");
  }

  let error: string | null = null;
  let session: SupabaseSession | null = null;

  try {
    const result = await signInWithPassword(email, password);
    error = result.error;
    session = result.session;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "Unexpected auth error";
    redirectWithReason("/login", "network", reason);
  }

  if (error || !session) {
    if (error?.toLowerCase().includes("confirm")) {
      redirectWithReason("/login", "confirm_email", error);
    }
    redirectWithReason("/login", "invalid", error ?? "No session returned from auth.");
  }

  await setSessionCookies(session);
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !password) {
    redirectWithReason("/signup", "missing");
  }

  let error: string | null = null;
  let session: SupabaseSession | null = null;

  try {
    const result = await signUpWithPassword(name, email, password);
    error = result.error;
    session = result.session;
  } catch {
    redirectWithReason("/signup", "network");
  }

  if (error) {
    const normalized = error.toLowerCase();
    if (normalized.includes("email rate limit exceeded")) {
      redirectWithReason("/signup", "rate_limit", error);
    }
    if (normalized.includes("already") || normalized.includes("registered")) {
      redirectWithReason("/signup", "exists", error);
    }
    redirectWithReason("/signup", "invalid", error);
  }

  if (!session) {
    redirect("/login?message=check-email");
  }

  await setSessionCookies(session);
  redirect("/dashboard");
}

export async function enterDemoMode() {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set({
    name: DEMO_MODE_COOKIE_NAME,
    value: "1",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirectWithReason("/forgot-password", "missing");
  }

  let error: string | null = null;

  try {
    const baseUrl = await getAppBaseUrl();
    error = await sendPasswordResetEmail(email, `${baseUrl}/reset-password`);
  } catch {
    redirectWithReason("/forgot-password", "network");
  }

  if (error) {
    if (error.toLowerCase().includes("rate limit")) {
      redirectWithReason("/forgot-password", "rate_limit", error);
    }
    redirectWithReason("/forgot-password", "invalid", error);
  }

  redirect("/forgot-password?sent=1");
}

export async function resetPassword(formData: FormData) {
  const accessToken = String(formData.get("access_token") ?? "").trim();
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  const recoveryType = String(formData.get("recovery_type") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  const confirmPassword = String(formData.get("confirm_password") ?? "").trim();

  if (!password || !confirmPassword) {
    redirectWithReason("/reset-password", "missing");
  }

  if (password !== confirmPassword) {
    redirectWithReason("/reset-password", "mismatch");
  }

  if (password.length < 8) {
    redirectWithReason("/reset-password", "weak");
  }

  let verifiedAccessToken = accessToken;
  if (!verifiedAccessToken && tokenHash && (!recoveryType || recoveryType === "recovery")) {
    try {
      const result = await exchangeRecoveryTokenHash(tokenHash);
      if (result.error || !result.session?.accessToken) {
        redirectWithReason("/reset-password", "invalid_link", result.error ?? "Invalid recovery token");
      }
      verifiedAccessToken = result.session.accessToken;
    } catch {
      redirectWithReason("/reset-password", "network");
    }
  }

  if (!verifiedAccessToken) {
    redirectWithReason("/reset-password", "invalid_link");
  }

  let error: string | null = null;
  try {
    error = await updatePasswordWithAccessToken(verifiedAccessToken, password);
  } catch {
    redirectWithReason("/reset-password", "network");
  }

  if (error) {
    redirectWithReason("/reset-password", "invalid", error);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set({
    name: DEMO_MODE_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  redirect("/login?message=password-reset");
}

export async function logout() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  await signOutFromSupabase(accessToken);

  cookieStore.set({
    name: ACCESS_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  cookieStore.set({
    name: REFRESH_TOKEN_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  cookieStore.set({
    name: DEMO_MODE_COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });

  redirect("/login");
}
