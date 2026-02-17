import { getSupabaseEnv } from "./auth";

type SupabaseAuthPayload = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error_description?: string;
  code?: string;
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

type AuthResult = {
  error: string | null;
  session: SupabaseSession | null;
};

function buildHeaders(accessToken?: string, includeAnonAuthorization = false): HeadersInit {
  const { anonKey } = getSupabaseEnv();
  const headers: Record<string, string> = {
    apikey: anonKey,
    "Content-Type": "application/json",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  } else if (includeAnonAuthorization) {
    headers.Authorization = `Bearer ${anonKey}`;
  }

  return headers;
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
  return payload.error_description ?? payload.error ?? payload.msg ?? payload.code ?? fallback;
}

async function postAuthJson(
  path: string,
  body: Record<string, string | object>,
  includeAnonAuthorization = false,
) {
  return fetch(`${getSupabaseAuthBaseUrl()}${path}`, {
    method: "POST",
    headers: buildHeaders(undefined, includeAnonAuthorization),
    body: JSON.stringify(body),
  });
}

async function resolveAuthResult(response: Response, fallbackError: string): Promise<AuthResult> {
  const payload = await parsePayload(response);

  if (!response.ok) {
    return { error: readError(payload, fallbackError), session: null };
  }

  const session = readSession(payload);

  if (!session) {
    return { error: null, session: null };
  }

  return { error: null, session };
}

export async function signInWithPassword(email: string, password: string) {
  const path = "/token?grant_type=password";
  const body = { email, password };
  const first = await postAuthJson(path, body, false);

  if ((first.status === 401 || first.status === 403) && first.ok === false) {
    const second = await postAuthJson(path, body, true);
    return resolveAuthResult(second, "Unable to sign in.");
  }

  return resolveAuthResult(first, "Unable to sign in.");
}

export async function signUpWithPassword(name: string, email: string, password: string) {
  const path = "/signup";
  const body = {
    email,
    password,
    data: { full_name: name },
  };
  const first = await postAuthJson(path, body, false);

  if ((first.status === 401 || first.status === 403) && first.ok === false) {
    const second = await postAuthJson(path, body, true);
    return resolveAuthResult(second, "Unable to sign up.");
  }

  return resolveAuthResult(first, "Unable to sign up.");
}

export async function refreshWithToken(refreshToken: string) {
  const path = "/token?grant_type=refresh_token";
  const body = { refresh_token: refreshToken };
  const first = await postAuthJson(path, body, false);

  if ((first.status === 401 || first.status === 403) && first.ok === false) {
    const second = await postAuthJson(path, body, true);
    return resolveAuthResult(second, "Unable to refresh session.");
  }

  return resolveAuthResult(first, "Unable to refresh session.");
}

export async function exchangeRecoveryTokenHash(tokenHash: string) {
  const path = "/verify";
  const body = { type: "recovery", token_hash: tokenHash };
  const first = await postAuthJson(path, body, false);

  if ((first.status === 401 || first.status === 403) && first.ok === false) {
    const second = await postAuthJson(path, body, true);
    return resolveAuthResult(second, "Unable to verify recovery token.");
  }

  return resolveAuthResult(first, "Unable to verify recovery token.");
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

export async function sendPasswordResetEmail(email: string, redirectTo: string): Promise<string | null> {
  const body = {
    email,
    redirect_to: redirectTo,
  };

  const first = await postAuthJson("/recover", body, false);
  const firstPayload = await parsePayload(first);

  if (first.ok) {
    return null;
  }

  if (first.status === 401 || first.status === 403) {
    const second = await postAuthJson("/recover", body, true);
    const secondPayload = await parsePayload(second);
    if (second.ok) {
      return null;
    }

    return readError(secondPayload, "Unable to send password reset email.");
  }

  return readError(firstPayload, "Unable to send password reset email.");
}

export async function updatePasswordWithAccessToken(accessToken: string, password: string): Promise<string | null> {
  const response = await fetch(`${getSupabaseAuthBaseUrl()}/user`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
    body: JSON.stringify({ password }),
  });

  if (response.ok) {
    return null;
  }

  const payload = await parsePayload(response);
  return readError(payload, "Unable to update password.");
}
