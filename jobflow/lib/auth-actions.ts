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
    redirect("/login?error=missing");
  }

  const { error, session } = await signInWithPassword(email, password);

  if (error || !session) {
    redirect("/login?error=invalid");
  }

  await setSessionCookies(session);
  redirect("/");
}

export async function signup(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (!name || !email || !password) {
    redirect("/signup?error=missing");
  }

  const { error, session } = await signUpWithPassword(name, email, password);

  if (error) {
    redirect("/signup?error=invalid");
  }

  if (!session) {
    redirect("/login?message=check-email");
  }

  await setSessionCookies(session);
  redirect("/");
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
