import { getSupabaseEnv } from "./auth";

export type ApplicationRecord = {
  id: string;
  stage: string | null;
  status: string | null;
  applied_at: string | null;
  created_at: string | null;
};

export type ApplicationDetailRecord = {
  id: string;
  company_id: string | null;
  role_title: string | null;
  stage: string | null;
  status: string | null;
  applied_at: string | null;
  last_touch_at: string | null;
  created_at: string | null;
};

export type CompanyRecord = {
  id: string;
  name: string | null;
};

export type ApplicationLinkRecord = {
  id: string;
  application_id: string | null;
  label: string | null;
  url: string | null;
  created_at: string | null;
};

export type FollowUpRecord = {
  id: string;
  application_id: string | null;
  due_at: string | null;
  completed_at: string | null;
  note?: string | null;
  created_at?: string | null;
};

export type NoteRecord = {
  id: string;
  application_id: string | null;
  content: string | null;
  created_at: string | null;
};

export type ApplicationsPageData = {
  applications: ApplicationDetailRecord[];
  companies: CompanyRecord[];
  links: ApplicationLinkRecord[];
  openFollowUps: FollowUpRecord[];
};

function buildRestHeaders(accessToken: string): HeadersInit {
  const { anonKey } = getSupabaseEnv();
  return {
    apikey: anonKey,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function fetchRestRows<T>(accessToken: string, pathAndQuery: string): Promise<T[]> {
  const { url } = getSupabaseEnv();
  const endpoint = `${url}/rest/v1/${pathAndQuery}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: buildRestHeaders(accessToken),
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as T[];
  return Array.isArray(payload) ? payload : [];
}

export async function fetchApplications(accessToken: string): Promise<ApplicationRecord[]> {
  return fetchRestRows<ApplicationRecord>(
    accessToken,
    "applications?select=id,stage,status,applied_at,created_at&order=created_at.asc&limit=5000",
  );
}

export async function fetchApplicationsPageData(accessToken: string): Promise<ApplicationsPageData> {
  const [applications, companies, links, openFollowUps] = await Promise.all([
    fetchRestRows<ApplicationDetailRecord>(
      accessToken,
      "applications?select=id,company_id,role_title,stage,status,applied_at,last_touch_at,created_at&order=created_at.desc&limit=5000",
    ),
    fetchRestRows<CompanyRecord>(accessToken, "companies?select=id,name&limit=5000"),
    fetchRestRows<ApplicationLinkRecord>(accessToken, "links?select=id,application_id,label,url,created_at&order=created_at.desc&limit=10000"),
    fetchRestRows<FollowUpRecord>(
      accessToken,
      "follow_ups?select=id,application_id,due_at,completed_at&completed_at=is.null&order=due_at.asc&limit=5000",
    ),
  ]);

  return {
    applications,
    companies,
    links,
    openFollowUps,
  };
}

export async function fetchCompanies(accessToken: string): Promise<CompanyRecord[]> {
  return fetchRestRows<CompanyRecord>(accessToken, "companies?select=id,name&limit=5000");
}

export async function fetchApplicationById(accessToken: string, applicationId: string): Promise<ApplicationDetailRecord | null> {
  const rows = await fetchRestRows<ApplicationDetailRecord>(
    accessToken,
    `applications?select=id,company_id,role_title,stage,status,applied_at,last_touch_at,created_at&id=eq.${encodeURIComponent(applicationId)}&limit=1`,
  );
  return rows[0] ?? null;
}

export async function fetchNotesForApplication(accessToken: string, applicationId: string): Promise<NoteRecord[]> {
  return fetchRestRows<NoteRecord>(
    accessToken,
    `notes?select=id,application_id,content,created_at&application_id=eq.${encodeURIComponent(applicationId)}&order=created_at.desc&limit=500`,
  );
}

export async function fetchLinksForApplication(accessToken: string, applicationId: string): Promise<ApplicationLinkRecord[]> {
  return fetchRestRows<ApplicationLinkRecord>(
    accessToken,
    `links?select=id,application_id,label,url,created_at&application_id=eq.${encodeURIComponent(applicationId)}&order=created_at.desc&limit=500`,
  );
}

export async function fetchFollowUpsForApplication(accessToken: string, applicationId: string): Promise<FollowUpRecord[]> {
  return fetchRestRows<FollowUpRecord>(
    accessToken,
    `follow_ups?select=id,application_id,due_at,completed_at,note,created_at&application_id=eq.${encodeURIComponent(applicationId)}&order=due_at.asc&limit=500`,
  );
}
