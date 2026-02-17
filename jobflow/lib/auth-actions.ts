"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_COOKIE_MAX_AGE_SECONDS,
  REFRESH_TOKEN_COOKIE_NAME,
} from "./auth";
import {
  signInWithPassword,
  signOutFromSupabase,
  signUpWithPassword,
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
  } catch {
    redirectWithReason("/login", "network");
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

  redirect("/login");
}
