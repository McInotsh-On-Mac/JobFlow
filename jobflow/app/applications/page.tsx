import Link from "next/link";
import { cookies } from "next/headers";
import AppHeader from "../../components/AppHeader";
import { ACCESS_TOKEN_COOKIE_NAME, DEMO_MODE_COOKIE_NAME } from "../../lib/auth";
import { deleteApplication, setFollowUp, updateApplicationStageStatus } from "../../lib/application-actions";
import { getDemoApplicationsPageData } from "../../lib/demo-data";
import {
  fetchApplicationsPageData,
  type ApplicationDetailRecord,
  type ApplicationLinkRecord,
  type FollowUpRecord,
} from "../../lib/supabase-data";
import styles from "./page.module.css";

type ApplicationsPageProps = {
  searchParams: Promise<{
    q?: string;
    stage?: string;
    status?: string;
    followup?: string;
    created?: string;
    deleted?: string;
  }>;
};

type FollowUpTone = "due" | "soon" | "scheduled" | "ok" | "closed";

type FollowUpInfo = {
  label: string;
  detail: string;
  tone: FollowUpTone;
  needsAction: boolean;
  dueAt: Date | null;
};

function parseSupabaseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month, day);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDateLabel(date: Date | null): string {
  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pluralizeDays(days: number): string {
  return `${days} day${days === 1 ? "" : "s"}`;
}

function getDayDiff(from: Date, to: Date): number {
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toStart = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((toStart.getTime() - fromStart.getTime()) / msPerDay);
}

function getActivityDate(record: ApplicationDetailRecord): Date | null {
  return parseSupabaseDate(record.last_touch_at) ?? parseSupabaseDate(record.applied_at) ?? parseSupabaseDate(record.created_at);
}

function buildFollowUpInfo(record: ApplicationDetailRecord, followUp: FollowUpRecord | null, now: Date): FollowUpInfo {
  const closedStatuses = new Set(["Rejected", "Accepted", "Withdrawn"]);
  if (record.status && closedStatuses.has(record.status)) {
    return {
      label: "Closed",
      detail: "No follow-up needed",
      tone: "closed",
      needsAction: false,
      dueAt: null,
    };
  }

  const followUpDueDate = parseSupabaseDate(followUp?.due_at ?? null);
  if (followUpDueDate) {
    const daysUntil = getDayDiff(now, followUpDueDate);
    if (daysUntil <= 0) {
      return {
        label: "Follow up due",
        detail: `Due ${formatDateLabel(followUpDueDate)}`,
        tone: "due",
        needsAction: true,
        dueAt: followUpDueDate,
      };
    }

    return {
      label: "Follow up scheduled",
      detail: `Due ${formatDateLabel(followUpDueDate)}`,
      tone: "scheduled",
      needsAction: false,
      dueAt: followUpDueDate,
    };
  }

  const activityDate = getActivityDate(record);
  if (!activityDate) {
    return {
      label: "Missing date",
      detail: "Add an applied date",
      tone: "soon",
      needsAction: true,
      dueAt: null,
    };
  }

  const silentDays = getDayDiff(activityDate, now);
  if (silentDays >= 14) {
    return {
      label: "Follow up now",
      detail: `${pluralizeDays(silentDays)} since last touch`,
      tone: "due",
      needsAction: true,
      dueAt: null,
    };
  }

  if (silentDays >= 7) {
    return {
      label: "Follow up soon",
      detail: `${pluralizeDays(silentDays)} since last touch`,
      tone: "soon",
      needsAction: true,
      dueAt: null,
    };
  }

  return {
    label: "On track",
    detail: `Last touch ${pluralizeDays(silentDays)} ago`,
    tone: "ok",
    needsAction: false,
    dueAt: null,
  };
}

function normalizeLinkUrl(url: string): string {
  if (/^[a-z]+:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function followUpToneClass(tone: FollowUpTone): string {
  if (tone === "due") {
    return styles.followUpDue;
  }
  if (tone === "soon") {
    return styles.followUpSoon;
  }
  if (tone === "scheduled") {
    return styles.followUpScheduled;
  }
  if (tone === "closed") {
    return styles.followUpClosed;
  }
  return styles.followUpOk;
}

function toDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildReturnTo(query: { q: string; stage: string; status: string; followup: string }): string {
  const params = new URLSearchParams();
  if (query.q) {
    params.set("q", query.q);
  }
  if (query.stage !== "All") {
    params.set("stage", query.stage);
  }
  if (query.status !== "All") {
    params.set("status", query.status);
  }
  if (query.followup !== "All") {
    params.set("followup", query.followup);
  }

  const queryString = params.toString();
  return queryString ? `/applications?${queryString}` : "/applications";
}

export default async function ApplicationsPage({ searchParams }: ApplicationsPageProps) {
  const params = await searchParams;
  const searchQuery = String(params.q ?? "").trim();
  const stageFilter = String(params.stage ?? "All");
  const statusFilter = String(params.status ?? "All");
  const followUpFilter = String(params.followup ?? "All");
  const createdMessage = params.created === "1";
  const deletedMessage = params.deleted === "1";

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const isDemoMode = cookieStore.get(DEMO_MODE_COOKIE_NAME)?.value === "1" && !accessToken;
  const { applications, companies, links, openFollowUps } = accessToken
    ? await fetchApplicationsPageData(accessToken)
    : isDemoMode
      ? getDemoApplicationsPageData()
      : { applications: [], companies: [], links: [], openFollowUps: [] };
  const usingDemoData = isDemoMode;

  const companyById = new Map<string, string>();
  companies.forEach((company) => {
    if (!company.id) {
      return;
    }

    companyById.set(company.id, company.name?.trim() || "Unknown company");
  });

  const linksByApplication = new Map<string, ApplicationLinkRecord[]>();
  links.forEach((link) => {
    if (!link.application_id || !link.url) {
      return;
    }

    const current = linksByApplication.get(link.application_id) ?? [];
    current.push(link);
    linksByApplication.set(link.application_id, current);
  });

  const openFollowUpByApplication = new Map<string, FollowUpRecord>();
  openFollowUps.forEach((followUp) => {
    if (!followUp.application_id) {
      return;
    }

    const existing = openFollowUpByApplication.get(followUp.application_id);
    if (!existing) {
      openFollowUpByApplication.set(followUp.application_id, followUp);
      return;
    }

    const existingDue = parseSupabaseDate(existing.due_at);
    const currentDue = parseSupabaseDate(followUp.due_at);
    if (!existingDue || (currentDue && currentDue < existingDue)) {
      openFollowUpByApplication.set(followUp.application_id, followUp);
    }
  });

  const now = new Date();
  const quickFollowUpTarget = new Date(now);
  quickFollowUpTarget.setDate(now.getDate() + 3);
  const defaultFollowUpDate = toDateInput(quickFollowUpTarget);

  const rows = applications.map((application) => {
    const mappedFollowUp = openFollowUpByApplication.get(application.id) ?? null;
    const followUp = buildFollowUpInfo(application, mappedFollowUp, now);
    const appLinks = linksByApplication.get(application.id) ?? [];
    const activityDate = getActivityDate(application);

    return {
      id: application.id,
      roleTitle: application.role_title?.trim() || "Untitled role",
      companyName: application.company_id ? companyById.get(application.company_id) ?? "Unknown company" : "No company set",
      appliedAt: formatDateLabel(parseSupabaseDate(application.applied_at) ?? parseSupabaseDate(application.created_at)),
      stage: application.stage ?? "Applied",
      status: application.status ?? "Active",
      links: appLinks.slice(0, 3),
      extraLinks: Math.max(appLinks.length - 3, 0),
      followUp,
      nextFollowUpDate: formatDateLabel(followUp.dueAt),
      lastUpdatedDate: formatDateLabel(activityDate),
      searchBlob: `${application.role_title ?? ""} ${companyById.get(application.company_id ?? "") ?? ""}`.toLowerCase(),
      defaultFollowUpDate,
    };
  });

  const filteredRows = rows.filter((row) => {
    if (searchQuery && !row.searchBlob.includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (stageFilter !== "All" && row.stage !== stageFilter) {
      return false;
    }

    if (statusFilter !== "All" && row.status !== statusFilter) {
      return false;
    }

    if (followUpFilter === "Needs follow-up" && !row.followUp.needsAction) {
      return false;
    }

    if (followUpFilter === "Overdue" && row.followUp.tone !== "due") {
      return false;
    }

    return true;
  });

  const activeCount = rows.filter((row) => row.status === "Active").length;
  const followUpCount = rows.filter((row) => row.followUp.needsAction).length;
  const returnTo = buildReturnTo({
    q: searchQuery,
    stage: stageFilter,
    status: statusFilter,
    followup: followUpFilter,
  });
  const deleteReturnTo = `${returnTo}${returnTo.includes("?") ? "&" : "?"}deleted=1`;

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="applications" />

        <section className={styles.headerCard}>
          <div className={styles.headerTop}>
            <div>
              <h1>Applications</h1>
              <p>Manage roles, companies, stage, links, and follow-up actions from one list.</p>
            </div>
            {usingDemoData ? (
              <span className={styles.demoChip}>Recruiter Demo (read-only)</span>
            ) : (
              <Link href="/applications/new" className={styles.addButton}>
                + Add Application
              </Link>
            )}
          </div>
        </section>

        <section className={styles.summaryGrid}>
          <article className={`${styles.summaryCard} ${styles.summaryCardPrimary}`}>
            <p className={styles.summaryLabel}>Total Applications</p>
            <p className={styles.summaryValue}>{rows.length}</p>
            <p className={styles.summaryHint}>All jobs tracked</p>
          </article>
          <article className={`${styles.summaryCard} ${styles.summaryCardSecondary}`}>
            <p className={styles.summaryLabel}>Active</p>
            <p className={styles.summaryValue}>{activeCount}</p>
            <p className={styles.summaryHint}>Still in progress</p>
          </article>
          <article className={`${styles.summaryCard} ${styles.summaryCardTertiary}`}>
            <p className={styles.summaryLabel}>Need Follow Up</p>
            <p className={styles.summaryValue}>{followUpCount}</p>
            <p className={styles.summaryHint}>Action recommended now</p>
          </article>
        </section>

        <section className={styles.filtersCard}>
          <form className={styles.filtersForm} method="GET">
            <label htmlFor="q">Search</label>
            <input id="q" name="q" type="search" defaultValue={searchQuery} placeholder="Search company or role" />

            <label htmlFor="stage">Stage</label>
            <select id="stage" name="stage" defaultValue={stageFilter}>
              <option>All</option>
              <option>Applied</option>
              <option>OA</option>
              <option>Interview</option>
              <option>Offer</option>
            </select>

            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={statusFilter}>
              <option>All</option>
              <option>Active</option>
              <option>Rejected</option>
              <option>Accepted</option>
              <option>Withdrawn</option>
            </select>

            <label htmlFor="followup">Follow-up</label>
            <select id="followup" name="followup" defaultValue={followUpFilter}>
              <option>All</option>
              <option>Needs follow-up</option>
              <option>Overdue</option>
            </select>

            <div className={styles.filterActions}>
              <button type="submit">Apply</button>
              <Link href="/applications">Reset</Link>
            </div>
          </form>
        </section>

        {createdMessage ? <p className={styles.feedbackInfo}>Application added successfully.</p> : null}
        {deletedMessage ? <p className={styles.feedbackInfo}>Application deleted.</p> : null}

        {rows.length === 0 ? (
          <section className={styles.emptyState}>
            <h2>No applications yet</h2>
            <p>Add your first application to start tracking.</p>
            <Link href="/applications/new" className={styles.emptyButton}>
              Add your first application
            </Link>
          </section>
        ) : filteredRows.length === 0 ? (
          <section className={styles.emptyState}>
            <h2>No matches</h2>
            <p>Adjust your search or filters and try again.</p>
            <Link href="/applications" className={styles.emptyButton}>
              Clear filters
            </Link>
          </section>
        ) : (
          <section className={styles.list}>
            {filteredRows.map((row) => (
              <article key={row.id} className={styles.applicationCard}>
                <div className={styles.cardTop}>
                  <div>
                    <p className={styles.companyName}>{row.companyName}</p>
                    <h2>{row.roleTitle}</h2>
                  </div>

                  <div className={styles.badgeGroup}>
                    <span className={styles.stageBadge}>{row.stage}</span>
                    <span className={styles.statusBadge}>{row.status}</span>
                    <span className={`${styles.followUpBadge} ${followUpToneClass(row.followUp.tone)}`}>{row.followUp.label}</span>
                  </div>
                </div>

                <dl className={styles.metaGrid}>
                  <div>
                    <dt>Applied</dt>
                    <dd>{row.appliedAt}</dd>
                  </div>
                  <div>
                    <dt>Next Follow-up</dt>
                    <dd>{row.nextFollowUpDate}</dd>
                  </div>
                  <div>
                    <dt>Last Updated</dt>
                    <dd>{row.lastUpdatedDate}</dd>
                  </div>
                </dl>

                <div className={styles.rowActions}>
                  <form className={styles.inlineEditForm} action={updateApplicationStageStatus}>
                    <input type="hidden" name="application_id" value={row.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <label htmlFor={`stage-${row.id}`}>Stage</label>
                    <select id={`stage-${row.id}`} name="stage" defaultValue={row.stage} disabled={usingDemoData}>
                      <option value="Applied">Applied</option>
                      <option value="OA">OA</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                    </select>

                    <label htmlFor={`status-${row.id}`}>Status</label>
                    <select id={`status-${row.id}`} name="status" defaultValue={row.status} disabled={usingDemoData}>
                      <option value="Active">Active</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Withdrawn">Withdrawn</option>
                    </select>

                    <button type="submit" disabled={usingDemoData}>
                      Save
                    </button>
                  </form>

                  <form className={styles.followUpForm} action={setFollowUp}>
                    <input type="hidden" name="application_id" value={row.id} />
                    <input type="hidden" name="return_to" value={returnTo} />
                    <label htmlFor={`due-${row.id}`}>Set follow-up</label>
                    <input
                      id={`due-${row.id}`}
                      name="due_date"
                      type="date"
                      defaultValue={row.defaultFollowUpDate}
                      disabled={usingDemoData}
                      required
                    />
                    <button type="submit" disabled={usingDemoData}>
                      Set
                    </button>
                  </form>

                  <Link href={`/applications/${row.id}`} className={styles.openLink}>
                    Open
                  </Link>

                  <form className={styles.deleteForm} action={deleteApplication}>
                    <input type="hidden" name="application_id" value={row.id} />
                    <input type="hidden" name="return_to" value={deleteReturnTo} />
                    <button type="submit" className={styles.deleteButton} disabled={usingDemoData}>
                      Delete
                    </button>
                  </form>
                </div>

                <div className={styles.linksSection}>
                  <p>Application Links</p>
                  {row.links.length === 0 ? (
                    <span className={styles.muted}>No links yet</span>
                  ) : (
                    <div className={styles.linkChips}>
                      {row.links.map((link) => (
                        <a
                          key={link.id}
                          href={normalizeLinkUrl(link.url ?? "")}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.linkChip}
                        >
                          {link.label?.trim() || "Open link"}
                        </a>
                      ))}
                      {row.extraLinks > 0 ? <span className={styles.moreLinks}>+{row.extraLinks} more</span> : null}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
