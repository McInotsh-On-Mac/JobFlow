import type {
  ApplicationDetailRecord,
  ApplicationLinkRecord,
  ApplicationsPageData,
  CompanyRecord,
  FollowUpRecord,
  NoteRecord,
} from "./supabase-data";

const demoApplications: ApplicationDetailRecord[] = [
  {
    id: "demo-app-1",
    company_id: "demo-company-1",
    role_title: "Frontend Engineer",
    stage: "Applied",
    status: "Active",
    applied_at: "2026-02-03",
    last_touch_at: "2026-02-05T15:00:00Z",
    created_at: "2026-02-03T13:00:00Z",
  },
  {
    id: "demo-app-2",
    company_id: "demo-company-2",
    role_title: "Software Engineer",
    stage: "Interview",
    status: "Active",
    applied_at: "2026-01-20",
    last_touch_at: "2026-02-01T10:00:00Z",
    created_at: "2026-01-20T09:00:00Z",
  },
  {
    id: "demo-app-3",
    company_id: "demo-company-3",
    role_title: "Product Engineer",
    stage: "Offer",
    status: "Active",
    applied_at: "2026-01-06",
    last_touch_at: "2026-01-29T16:00:00Z",
    created_at: "2026-01-06T11:00:00Z",
  },
  {
    id: "demo-app-4",
    company_id: "demo-company-4",
    role_title: "Full Stack Developer",
    stage: "Applied",
    status: "Rejected",
    applied_at: "2025-12-14",
    last_touch_at: "2026-01-04T12:00:00Z",
    created_at: "2025-12-14T10:00:00Z",
  },
  {
    id: "demo-app-5",
    company_id: "demo-company-5",
    role_title: "Platform Engineer",
    stage: "OA",
    status: "Active",
    applied_at: "2026-02-11",
    last_touch_at: "2026-02-12T15:00:00Z",
    created_at: "2026-02-11T14:00:00Z",
  },
  {
    id: "demo-app-6",
    company_id: "demo-company-6",
    role_title: "Backend Engineer",
    stage: "Interview",
    status: "Active",
    applied_at: "2025-11-08",
    last_touch_at: "2025-11-20T09:00:00Z",
    created_at: "2025-11-08T09:00:00Z",
  },
];

const demoCompanies: CompanyRecord[] = [
  { id: "demo-company-1", name: "Nova Systems" },
  { id: "demo-company-2", name: "BluePeak AI" },
  { id: "demo-company-3", name: "Northlane Health" },
  { id: "demo-company-4", name: "Summit Labs" },
  { id: "demo-company-5", name: "OrbitScale" },
  { id: "demo-company-6", name: "SignalGrid" },
];

const demoLinks: ApplicationLinkRecord[] = [
  {
    id: "demo-link-1",
    application_id: "demo-app-1",
    label: "Job Posting",
    url: "https://example.com/jobs/frontend",
    created_at: "2026-02-03T13:02:00Z",
  },
  {
    id: "demo-link-2",
    application_id: "demo-app-2",
    label: "Application Portal",
    url: "https://example.com/jobs/software-engineer",
    created_at: "2026-01-20T09:15:00Z",
  },
  {
    id: "demo-link-3",
    application_id: "demo-app-3",
    label: "Hiring Page",
    url: "https://example.com/jobs/product-engineer",
    created_at: "2026-01-06T11:10:00Z",
  },
  {
    id: "demo-link-4",
    application_id: "demo-app-5",
    label: "OA Link",
    url: "https://example.com/oa/platform-engineer",
    created_at: "2026-02-12T09:00:00Z",
  },
  {
    id: "demo-link-5",
    application_id: "demo-app-6",
    label: "Company Careers",
    url: "https://example.com/careers/backend",
    created_at: "2025-11-08T09:20:00Z",
  },
];

const demoOpenFollowUps: FollowUpRecord[] = [
  {
    id: "demo-followup-1",
    application_id: "demo-app-2",
    due_at: "2026-02-10T17:00:00Z",
    completed_at: null,
    note: "Check in with recruiter after onsite scheduling.",
    created_at: "2026-02-07T10:00:00Z",
  },
  {
    id: "demo-followup-2",
    application_id: "demo-app-5",
    due_at: "2026-02-22T17:00:00Z",
    completed_at: null,
    note: "Follow up after OA submission.",
    created_at: "2026-02-13T11:00:00Z",
  },
];

const demoNotes: NoteRecord[] = [
  {
    id: "demo-note-1",
    application_id: "demo-app-2",
    content: "Recruiter confirmed panel format: API design + behavioral.",
    created_at: "2026-02-01T11:00:00Z",
  },
  {
    id: "demo-note-2",
    application_id: "demo-app-3",
    content: "Offer expected this week pending headcount sign-off.",
    created_at: "2026-01-29T16:30:00Z",
  },
  {
    id: "demo-note-3",
    application_id: "demo-app-6",
    content: "No response in over two weeks. Set follow-up immediately.",
    created_at: "2025-12-03T09:30:00Z",
  },
];

export function getDemoApplicationsPageData(): ApplicationsPageData {
  return {
    applications: demoApplications,
    companies: demoCompanies,
    links: demoLinks,
    openFollowUps: demoOpenFollowUps,
  };
}

export function getDemoNotesForApplication(applicationId: string): NoteRecord[] {
  return demoNotes.filter((note) => note.application_id === applicationId);
}
