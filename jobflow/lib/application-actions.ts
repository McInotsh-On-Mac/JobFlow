"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE_NAME, DEMO_MODE_COOKIE_NAME, getSupabaseEnv } from "./auth";
import { fetchSupabaseUser } from "./supabase-auth";

const ALLOWED_STAGES = new Set(["Applied", "OA", "Interview", "Offer"]);
const ALLOWED_STATUSES = new Set(["Active", "Rejected", "Accepted", "Withdrawn"]);

type AuthContext = {
  accessToken: string;
  userId: string;
};

function readString(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function safeReturnTo(value: string, fallback: string): string {
  if (!value.startsWith("/")) {
    return fallback;
  }
  return value;
}

function buildHeaders(accessToken: string, preferReturnRepresentation = false): HeadersInit {
  const { anonKey } = getSupabaseEnv();
  const headers: Record<string, string> = {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  if (preferReturnRepresentation) {
    headers.Prefer = "return=representation";
  }

  return headers;
}

async function restRequest(
  accessToken: string,
  pathAndQuery: string,
  init?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: Record<string, unknown>;
    preferReturnRepresentation?: boolean;
  },
): Promise<Response> {
  const { url } = getSupabaseEnv();
  const method = init?.method ?? "GET";
  const body = init?.body;

  return fetch(`${url}/rest/v1/${pathAndQuery}`, {
    method,
    headers: buildHeaders(accessToken, init?.preferReturnRepresentation ?? false),
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;

  if (!accessToken) {
    redirect("/login");
  }

  const user = await fetchSupabaseUser(accessToken);
  if (!user?.id) {
    redirect("/login");
  }

  return {
    accessToken,
    userId: user.id,
  };
}

async function touchApplication(accessToken: string, applicationId: string) {
  await restRequest(accessToken, `applications?id=eq.${encodeURIComponent(applicationId)}`, {
    method: "PATCH",
    body: {
      last_touch_at: new Date().toISOString(),
    },
  });
}

async function findOrCreateCompanyId(accessToken: string, userId: string, companyName: string): Promise<string | null> {
  const existingResponse = await restRequest(
    accessToken,
    `companies?select=id&name=eq.${encodeURIComponent(companyName)}&limit=1`,
  );

  if (existingResponse.ok) {
    const existingPayload = (await existingResponse.json()) as Array<{ id?: string }>;
    const existingId = existingPayload[0]?.id;
    if (existingId) {
      return existingId;
    }
  }

  const createResponse = await restRequest(accessToken, "companies", {
    method: "POST",
    preferReturnRepresentation: true,
    body: {
      user_id: userId,
      name: companyName,
    },
  });

  if (!createResponse.ok) {
    return null;
  }

  const payload = (await createResponse.json()) as { id?: string }[] | { id?: string };
  if (Array.isArray(payload)) {
    return payload[0]?.id ?? null;
  }

  return payload.id ?? null;
}

function normalizeUrl(url: string): string {
  if (!url) {
    return "";
  }
  if (/^[a-z]+:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function buildDueAtTimestamp(dateInput: string): string | null {
  if (!dateInput) {
    return null;
  }

  const parsed = new Date(`${dateInput}T17:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export async function createApplication(formData: FormData) {
  const company = readString(formData, "company");
  const roleTitle = readString(formData, "role_title");
  const stageInput = readString(formData, "stage");
  const appliedAt = readString(formData, "applied_at");
  const jobLink = readString(formData, "job_link");
  const notes = readString(formData, "notes");

  if (!company || !roleTitle) {
    redirect("/applications/new?error=missing");
  }

  const cookieStore = await cookies();
  const isDemoMode = cookieStore.get(DEMO_MODE_COOKIE_NAME)?.value === "1" && !cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  if (isDemoMode) {
    redirect("/applications?demo_preview=1");
  }

  const stage = ALLOWED_STAGES.has(stageInput) ? stageInput : "Applied";
  const { accessToken, userId } = await getAuthContext();
  const companyId = await findOrCreateCompanyId(accessToken, userId, company);

  if (!companyId) {
    redirect("/applications/new?error=company");
  }

  const createResponse = await restRequest(accessToken, "applications", {
    method: "POST",
    preferReturnRepresentation: true,
    body: {
      user_id: userId,
      company_id: companyId,
      role_title: roleTitle,
      stage,
      status: "Active",
      applied_at: appliedAt || null,
    },
  });

  if (!createResponse.ok) {
    redirect("/applications/new?error=save");
  }

  const payload = (await createResponse.json()) as { id?: string }[] | { id?: string };
  const applicationId = Array.isArray(payload) ? payload[0]?.id : payload.id;

  if (!applicationId) {
    redirect("/applications/new?error=save");
  }

  const url = normalizeUrl(jobLink);
  if (url) {
    await restRequest(accessToken, "links", {
      method: "POST",
      body: {
        user_id: userId,
        application_id: applicationId,
        label: "Job Link",
        url,
      },
    });
  }

  if (notes) {
    await restRequest(accessToken, "notes", {
      method: "POST",
      body: {
        user_id: userId,
        application_id: applicationId,
        content: notes,
      },
    });
  }

  redirect("/applications?created=1");
}

export async function updateApplicationStageStatus(formData: FormData) {
  const applicationId = readString(formData, "application_id");
  const stageInput = readString(formData, "stage");
  const statusInput = readString(formData, "status");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/applications");

  if (!applicationId) {
    redirect(returnTo);
  }

  const stage = ALLOWED_STAGES.has(stageInput) ? stageInput : "Applied";
  const status = ALLOWED_STATUSES.has(statusInput) ? statusInput : "Active";
  const { accessToken } = await getAuthContext();

  await restRequest(accessToken, `applications?id=eq.${encodeURIComponent(applicationId)}`, {
    method: "PATCH",
    body: {
      stage,
      status,
      last_touch_at: new Date().toISOString(),
    },
  });

  redirect(returnTo);
}

export async function setFollowUp(formData: FormData) {
  const applicationId = readString(formData, "application_id");
  const dueDate = readString(formData, "due_date");
  const note = readString(formData, "note");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/applications");

  if (!applicationId) {
    redirect(returnTo);
  }

  const dueAt = buildDueAtTimestamp(dueDate);
  if (!dueAt) {
    redirect(returnTo);
  }

  const { accessToken, userId } = await getAuthContext();
  const completedAt = new Date().toISOString();

  await restRequest(
    accessToken,
    `follow_ups?application_id=eq.${encodeURIComponent(applicationId)}&completed_at=is.null`,
    {
      method: "PATCH",
      body: { completed_at: completedAt },
    },
  );

  await restRequest(accessToken, "follow_ups", {
    method: "POST",
    body: {
      user_id: userId,
      application_id: applicationId,
      due_at: dueAt,
      note: note || null,
    },
  });

  await touchApplication(accessToken, applicationId);
  redirect(returnTo);
}

export async function markFollowUpDone(formData: FormData) {
  const followUpId = readString(formData, "follow_up_id");
  const applicationId = readString(formData, "application_id");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/dashboard");

  if (!followUpId) {
    redirect(returnTo);
  }

  const { accessToken } = await getAuthContext();

  await restRequest(accessToken, `follow_ups?id=eq.${encodeURIComponent(followUpId)}`, {
    method: "PATCH",
    body: {
      completed_at: new Date().toISOString(),
    },
  });

  if (applicationId) {
    await touchApplication(accessToken, applicationId);
  }

  redirect(returnTo);
}

export async function deleteApplication(formData: FormData) {
  const applicationId = readString(formData, "application_id");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/applications");

  if (!applicationId) {
    redirect(returnTo);
  }

  const { accessToken } = await getAuthContext();

  await restRequest(accessToken, `applications?id=eq.${encodeURIComponent(applicationId)}`, {
    method: "DELETE",
  });

  redirect(returnTo);
}

export async function addNote(formData: FormData) {
  const applicationId = readString(formData, "application_id");
  const content = readString(formData, "content");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/applications");

  if (!applicationId || !content) {
    redirect(returnTo);
  }

  const { accessToken, userId } = await getAuthContext();

  await restRequest(accessToken, "notes", {
    method: "POST",
    body: {
      user_id: userId,
      application_id: applicationId,
      content,
    },
  });

  await touchApplication(accessToken, applicationId);
  redirect(returnTo);
}

export async function addLink(formData: FormData) {
  const applicationId = readString(formData, "application_id");
  const label = readString(formData, "label");
  const rawUrl = readString(formData, "url");
  const returnTo = safeReturnTo(readString(formData, "return_to"), "/applications");

  if (!applicationId || !rawUrl) {
    redirect(returnTo);
  }

  const url = normalizeUrl(rawUrl);
  const { accessToken, userId } = await getAuthContext();

  await restRequest(accessToken, "links", {
    method: "POST",
    body: {
      user_id: userId,
      application_id: applicationId,
      label: label || "Application Link",
      url,
    },
  });

  await touchApplication(accessToken, applicationId);
  redirect(returnTo);
}
