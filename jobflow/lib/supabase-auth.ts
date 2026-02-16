import { getSupabaseEnv } from "./auth";

type SupabaseAuthPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  session?: {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  } | null;
  user?: {
    id: string;
    email?: string;
  } | null;
  error?: string;
  msg?: string;
};

export type SupabaseSession = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

function buildHeaders(accessToken?: string): HeadersInit {
  const { anonKey } = getSupabaseEnv();

  return {
    apikey: anonKey,
    Authorization: accessToken ? `Bearer ${accessToken}` : `Bearer ${anonKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseAuthBaseUrl(): string {
  const { url } = getSupabaseEnv();
  return `${url}/auth/v1`;
}

async function parsePayload(response: Response): Promise<SupabaseAuthPayload> {
  try {
    return (await response.json()) as SupabaseAuthPayload;
  } catch {
    return {};
  }
}

function readSession(payload: SupabaseAuthPayload): SupabaseSession | null {
  const accessToken = payload.access_token ?? payload.session?.access_token;
  const refreshToken = payload.refresh_token ?? payload.session?.refresh_token;
  const expiresIn = payload.expires_in ?? payload.session?.expires_in;

  if (!accessToken || !refreshToken || !expiresIn) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

function readError(payload: SupabaseAuthPayload, fallback: string): string {
  return payload.error ?? payload.msg ?? fallback;
}

export async function signInWithPassword(email: string, password: string) {
  const response = await fetch(`${getSupabaseAuthBaseUrl()}/token?grant_type=password`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ email, password }),
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    return { error: readError(payload, "Unable to sign in."), session: null };
  }

  return { error: null, session: readSession(payload) };
}

export async function signUpWithPassword(name: string, email: string, password: string) {
  const response = await fetch(`${getSupabaseAuthBaseUrl()}/signup`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      email,
      password,
      data: { full_name: name },
    }),
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    return { error: readError(payload, "Unable to sign up."), session: null };
  }

  return { error: null, session: readSession(payload) };
}

export async function refreshWithToken(refreshToken: string) {
  const response = await fetch(`${getSupabaseAuthBaseUrl()}/token?grant_type=refresh_token`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  const payload = await parsePayload(response);

  if (!response.ok) {
    return { error: readError(payload, "Unable to refresh session."), session: null };
  }

  return { error: null, session: readSession(payload) };
}

export async function fetchSupabaseUser(accessToken: string) {
  const response = await fetch(`${getSupabaseAuthBaseUrl()}/user`, {
    method: "GET",
    headers: buildHeaders(accessToken),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as SupabaseAuthPayload["user"];
  return payload ?? null;
}

export async function signOutFromSupabase(accessToken?: string) {
  if (!accessToken) {
    return;
  }

  await fetch(`${getSupabaseAuthBaseUrl()}/logout`, {
    method: "POST",
    headers: buildHeaders(accessToken),
  });
}
