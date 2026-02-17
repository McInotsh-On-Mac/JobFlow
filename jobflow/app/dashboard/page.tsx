import Link from "next/link";
import { cookies } from "next/headers";
import AppHeader from "../../components/AppHeader";
import BrandLogo from "../../components/BrandLogo";
import { ACCESS_TOKEN_COOKIE_NAME } from "../../lib/auth";
import { markFollowUpDone, setFollowUp } from "../../lib/application-actions";
import { fetchApplicationsPageData, type ApplicationDetailRecord, type ApplicationRecord } from "../../lib/supabase-data";
import DashboardActivityChart, { type ChartPoint } from "./DashboardActivityChart";
import QuickSnapshotCard, { type SnapshotMonthOption } from "./QuickSnapshotCard";
import styles from "./page.module.css";

type AttentionItem = {
  applicationId: string;
  followUpId: string;
  company: string;
  role: string;
  stage: string;
  dueAt: Date;
  dueLabel: string;
};

function parseSupabaseDate(value: string | null | undefined): Date | null {
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

function readApplicationDate(record: ApplicationRecord): Date | null {
  return parseSupabaseDate(record.applied_at) ?? parseSupabaseDate(record.created_at);
}

function getActivityDate(record: ApplicationDetailRecord): Date | null {
  return parseSupabaseDate(record.last_touch_at) ?? parseSupabaseDate(record.applied_at) ?? parseSupabaseDate(record.created_at);
}

function getDayDiff(from: Date, to: Date): number {
  const fromStart = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const toStart = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((toStart.getTime() - fromStart.getTime()) / msPerDay);
}

function toDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toLocalDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDaySeries(records: ApplicationRecord[]): ChartPoint[] {
  const days = 14;
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const orderedKeys: string[] = [];
  const labels = new Map<string, string>();
  const map = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const key = toLocalDayKey(day);
    orderedKeys.push(key);
    labels.set(
      key,
      day.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    );
    map.set(key, 0);
  }

  records.forEach((record) => {
    const date = readApplicationDate(record);
    if (!date) {
      return;
    }

    const key = toLocalDayKey(date);
    if (map.has(key)) {
      map.set(key, (map.get(key) ?? 0) + 1);
    }
  });

  return orderedKeys.map((key) => ({
    label: labels.get(key) ?? key,
    value: map.get(key) ?? 0,
  }));
}

function buildMonthSeries(records: ApplicationRecord[]): ChartPoint[] {
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const currentYear = now.getFullYear();
  const values = new Array<number>(12).fill(0);

  records.forEach((record) => {
    const date = readApplicationDate(record);
    if (!date || date.getFullYear() !== currentYear) {
      return;
    }

    values[date.getMonth()] += 1;
  });

  return monthLabels.map((label, index) => ({ label, value: values[index] }));
}

function buildYearSeries(records: ApplicationRecord[]): ChartPoint[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const values = new Map<number, number>();

  records.forEach((record) => {
    const date = readApplicationDate(record);
    if (!date) {
      return;
    }

    const year = date.getFullYear();
    values.set(year, (values.get(year) ?? 0) + 1);
  });

  const years = Array.from(values.keys()).sort((a, b) => a - b);
  if (years.length === 0) {
    years.push(currentYear);
    values.set(currentYear, 0);
  }

  return years.map((year) => ({
    label: `${year}`,
    value: values.get(year) ?? 0,
  }));
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function buildSnapshotMonthOptions(records: ApplicationRecord[]): SnapshotMonthOption[] {
  const now = new Date();
  const normalizedNow = new Date(now.getFullYear(), now.getMonth(), 1);

  const counts = new Map<string, number>();
  let earliestDate: Date | null = null;

  for (const record of records) {
    const date = readApplicationDate(record);
    if (!date) {
      continue;
    }

    const normalized = new Date(date.getFullYear(), date.getMonth(), 1);
    const key = toMonthKey(normalized);
    counts.set(key, (counts.get(key) ?? 0) + 1);

    if (!earliestDate || normalized < earliestDate) {
      earliestDate = normalized;
    }
  }

  let monthSpan = 12;
  if (earliestDate) {
    const monthDiff =
      (normalizedNow.getFullYear() - earliestDate.getFullYear()) * 12 +
      (normalizedNow.getMonth() - earliestDate.getMonth()) +
      1;
    monthSpan = Math.max(12, Math.min(60, monthDiff));
  }

  const options: SnapshotMonthOption[] = [];
  for (let offset = 0; offset < monthSpan; offset += 1) {
    const target = new Date(normalizedNow);
    target.setMonth(normalizedNow.getMonth() - offset);

    const key = toMonthKey(target);
    const label = target.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({
      key,
      label,
      applications: counts.get(key) ?? 0,
    });
  }

  return options;
}

function buildMedian(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  }
  return sorted[middle];
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const { applications, companies, openFollowUps } = accessToken
    ? await fetchApplicationsPageData(accessToken)
    : { applications: [], companies: [], openFollowUps: [] };

  const chartRecords: ApplicationRecord[] = applications.map((application) => ({
    id: application.id,
    stage: application.stage,
    status: application.status,
    applied_at: application.applied_at,
    created_at: application.created_at,
  }));

  const totalApplications = applications.length;
  const offers = applications.filter((record) => record.stage === "Offer" || record.status === "Accepted").length;
  const responses = applications.filter((record) => record.stage && record.stage !== "Applied").length;
  const responseRate = totalApplications > 0 ? Math.round((responses / totalApplications) * 100) : 0;

  const responseTimes = applications.flatMap((record) => {
    if (!record.stage || record.stage === "Applied") {
      return [] as number[];
    }

    const appliedDate = parseSupabaseDate(record.applied_at);
    const responseDate = parseSupabaseDate(record.last_touch_at) ?? parseSupabaseDate(record.created_at);
    if (!appliedDate || !responseDate) {
      return [] as number[];
    }

    const days = getDayDiff(appliedDate, responseDate);
    return days >= 0 ? [days] : [];
  });
  const medianResponseDays = buildMedian(responseTimes);

  const monthSeries = buildMonthSeries(chartRecords);
  const daySeries = buildDaySeries(chartRecords);
  const yearSeries = buildYearSeries(chartRecords);
  const snapshotMonthOptions = buildSnapshotMonthOptions(chartRecords);

  const companyById = new Map<string, string>();
  companies.forEach((company) => {
    if (!company.id) {
      return;
    }
    companyById.set(company.id, company.name?.trim() || "Unknown company");
  });

  const appById = new Map<string, ApplicationDetailRecord>();
  applications.forEach((application) => {
    appById.set(application.id, application);
  });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const staleFollowUpTarget = new Date(now);
  staleFollowUpTarget.setDate(now.getDate() + 2);
  const staleSuggestedDate = toDateInput(staleFollowUpTarget);

  const attentionItems: AttentionItem[] = openFollowUps.flatMap((followUp) => {
    if (!followUp.id || !followUp.application_id || followUp.completed_at) {
      return [] as AttentionItem[];
    }

    const application = appById.get(followUp.application_id);
    if (!application) {
      return [] as AttentionItem[];
    }

    const dueAt = parseSupabaseDate(followUp.due_at);
    if (!dueAt) {
      return [] as AttentionItem[];
    }

    const companyName = application.company_id
      ? companyById.get(application.company_id) ?? "Unknown company"
      : "No company set";

    return [
      {
        applicationId: application.id,
        followUpId: followUp.id,
        company: companyName,
        role: application.role_title?.trim() || "Untitled role",
        stage: application.stage ?? "Applied",
        dueAt,
        dueLabel: formatDateLabel(dueAt),
      },
    ];
  });

  const overdueItems = attentionItems.filter((item) => item.dueAt < todayStart).slice(0, 10);
  const dueSoonItems = attentionItems
    .filter((item) => {
      const days = getDayDiff(todayStart, item.dueAt);
      return days >= 0 && days <= 7;
    })
    .slice(0, 10);

  const closedStatuses = new Set(["Rejected", "Accepted", "Withdrawn"]);
  const staleItems = applications
    .flatMap((application) => {
      if (!application.id || (application.status && closedStatuses.has(application.status))) {
        return [] as Array<{
          applicationId: string;
          company: string;
          role: string;
          silentDays: number;
          suggestedDate: string;
        }>;
      }

      const activityDate = getActivityDate(application);
      if (!activityDate) {
        return [] as Array<{
          applicationId: string;
          company: string;
          role: string;
          silentDays: number;
          suggestedDate: string;
        }>;
      }

      const silentDays = getDayDiff(activityDate, now);
      if (silentDays < 14) {
        return [] as Array<{
          applicationId: string;
          company: string;
          role: string;
          silentDays: number;
          suggestedDate: string;
        }>;
      }

      const companyName = application.company_id
        ? companyById.get(application.company_id) ?? "Unknown company"
        : "No company set";

      return [
        {
          applicationId: application.id,
          company: companyName,
          role: application.role_title?.trim() || "Untitled role",
          silentDays,
          suggestedDate: staleSuggestedDate,
        },
      ];
    })
    .sort((a, b) => b.silentDays - a.silentDays)
    .slice(0, 6);

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="dashboard" />

        <section className={styles.headerCard}>
          <div className={styles.headerTop}>
            <BrandLogo size="large" href={null} priority />
            <Link href="/applications/new" className={styles.addButton}>
              + Add Application
            </Link>
          </div>

          <h1>Job tracking, simplified.</h1>
          <p>Stay organized, follow up on time, and move through your job search with confidence.</p>
        </section>

        <section className={styles.quickStatsGrid}>
          <article className={styles.quickStatCard}>
            <p className={styles.quickStatLabel}>Applications</p>
            <p className={styles.quickStatValue}>{totalApplications}</p>
          </article>
          <article className={styles.quickStatCard}>
            <p className={styles.quickStatLabel}>Responses</p>
            <p className={styles.quickStatValue}>{responses}</p>
          </article>
          <article className={styles.quickStatCard}>
            <p className={styles.quickStatLabel}>Response Rate</p>
            <p className={styles.quickStatValue}>{responseRate}%</p>
          </article>
          <article className={styles.quickStatCard}>
            <p className={styles.quickStatLabel}>Median Response</p>
            <p className={styles.quickStatValue}>{medianResponseDays === null ? "—" : `${medianResponseDays}d`}</p>
          </article>
        </section>

        <section className={styles.attentionSection}>
          <h2>Needs Attention</h2>

          <div className={styles.attentionGrid}>
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Overdue Follow-ups</h3>
                <span>{overdueItems.length}</span>
              </div>

              {overdueItems.length === 0 ? <p className={styles.emptyText}>No overdue follow-ups.</p> : null}

              {overdueItems.length > 0 ? (
                <ul className={styles.attentionList}>
                  {overdueItems.map((item) => (
                    <li key={item.followUpId}>
                      <div>
                        <p>{item.company}</p>
                        <span>
                          {item.role} • {item.stage} • due {item.dueLabel}
                        </span>
                      </div>

                      <div className={styles.itemActions}>
                        <Link href={`/applications/${item.applicationId}`}>Open</Link>
                        <form action={markFollowUpDone}>
                          <input type="hidden" name="follow_up_id" value={item.followUpId} />
                          <input type="hidden" name="application_id" value={item.applicationId} />
                          <input type="hidden" name="return_to" value="/dashboard" />
                          <button type="submit">Mark Done</button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>

            <article className={styles.card}>
              <div className={styles.cardHead}>
                <h3>Due Soon (7 days)</h3>
                <span>{dueSoonItems.length}</span>
              </div>

              {dueSoonItems.length === 0 ? <p className={styles.emptyText}>No follow-ups due in the next 7 days.</p> : null}

              {dueSoonItems.length > 0 ? (
                <ul className={styles.attentionList}>
                  {dueSoonItems.map((item) => (
                    <li key={item.followUpId}>
                      <div>
                        <p>{item.company}</p>
                        <span>
                          {item.role} • {item.stage} • due {item.dueLabel}
                        </span>
                      </div>

                      <div className={styles.itemActions}>
                        <Link href={`/applications/${item.applicationId}`}>Open</Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </div>
        </section>

        <QuickSnapshotCard totalApplications={totalApplications} offers={offers} monthOptions={snapshotMonthOptions} />

        <section className={`${styles.card} ${styles.staleSection}`}>
          <h2>Stale Applications</h2>
          <p>No updates in 14+ days.</p>

          {staleItems.length === 0 ? <p className={styles.emptyText}>No stale applications right now.</p> : null}

          {staleItems.length > 0 ? (
            <ul className={styles.staleList}>
              {staleItems.map((item) => (
                <li key={item.applicationId}>
                  <div>
                    <p>{item.company}</p>
                    <span>
                      {item.role} • {item.silentDays} days since last update
                    </span>
                  </div>

                  <form action={setFollowUp} className={styles.staleAction}>
                    <input type="hidden" name="application_id" value={item.applicationId} />
                    <input type="hidden" name="return_to" value="/dashboard" />
                    <input type="hidden" name="due_date" value={item.suggestedDate} />
                    <input type="hidden" name="note" value="Follow up from dashboard stale list" />
                    <button type="submit">Set follow-up</button>
                  </form>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className={styles.chartWrap}>
          <article className={`${styles.card} ${styles.chartCard}`}>
            <h2>Application Activity</h2>
            <p className={styles.cardSubtitle}>Switch between day, month, and year trends.</p>
            <DashboardActivityChart dayData={daySeries} monthData={monthSeries} yearData={yearSeries} />
          </article>
        </section>
      </div>
    </main>
  );
}
