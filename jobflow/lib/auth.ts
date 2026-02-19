export const ACCESS_TOKEN_COOKIE_NAME = "jobflow_access_token";
export const REFRESH_TOKEN_COOKIE_NAME = "jobflow_refresh_token";
export const DEMO_MODE_COOKIE_NAME = "jobflow_demo_mode";

export const REFRESH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, anonKey };
}
