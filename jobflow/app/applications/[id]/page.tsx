import Link from "next/link";
import { cookies } from "next/headers";
import AppHeader from "../../../components/AppHeader";
import { ACCESS_TOKEN_COOKIE_NAME, DEMO_MODE_COOKIE_NAME } from "../../../lib/auth";
import { addLink, addNote, deleteApplication, markFollowUpDone, setFollowUp, updateApplicationStageStatus } from "../../../lib/application-actions";
import { getDemoApplicationsPageData, getDemoNotesForApplication } from "../../../lib/demo-data";
import {
  fetchApplicationById,
  fetchCompanies,
  fetchFollowUpsForApplication,
  fetchLinksForApplication,
  fetchNotesForApplication,
  type FollowUpRecord,
} from "../../../lib/supabase-data";
import styles from "./page.module.css";

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
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

function formatDateLabel(value: string | null | undefined): string {
  const parsed = parseSupabaseDate(value ?? null);
  if (!parsed) {
    return "Not set";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toDateInput(value: Date): string {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeLinkUrl(url: string): string {
  if (/^[a-z]+:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
}

function isOverdueFollowUp(followUp: FollowUpRecord): boolean {
  const dueDate = parseSupabaseDate(followUp.due_at);
  if (!dueDate) {
    return false;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  return dueStart < todayStart;
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
  const { id } = await params;
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE_NAME)?.value;
  const isDemoMode = cookieStore.get(DEMO_MODE_COOKIE_NAME)?.value === "1" && !accessToken;

  const [application, companies, notes, links, followUps] = accessToken
    ? await Promise.all([
        fetchApplicationById(accessToken, id),
        fetchCompanies(accessToken),
        fetchNotesForApplication(accessToken, id),
        fetchLinksForApplication(accessToken, id),
        fetchFollowUpsForApplication(accessToken, id),
      ])
    : isDemoMode
      ? (() => {
          const demoData = getDemoApplicationsPageData();
          const demoApplication = demoData.applications.find((record) => record.id === id) ?? null;
          const demoNotes = getDemoNotesForApplication(id);
          const demoLinks = demoData.links.filter((record) => record.application_id === id);
          const demoFollowUps = demoData.openFollowUps.filter((record) => record.application_id === id);
          return [demoApplication, demoData.companies, demoNotes, demoLinks, demoFollowUps];
        })()
    : [null, [], [], [], []];
  const usingDemoData = isDemoMode;

  const activeApplication = application;
  const activeCompanies = companies;
  const activeNotes = notes;
  const activeLinks = links;
  const activeFollowUps = followUps;

  if (!activeApplication) {
    return (
      <main className={styles.page}>
        <div className={styles.halo} aria-hidden />
        <div className={styles.shell}>
          <AppHeader current="applications" />
          <section className={styles.emptyState}>
            <h1>Application not found</h1>
            <p>This record might have been deleted or you do not have access to it.</p>
            <Link href="/applications" className={styles.backLink}>
              Back to applications
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const companyName = activeApplication.company_id
    ? activeCompanies.find((company) => company.id === activeApplication.company_id)?.name ?? "Unknown company"
    : "No company set";

  const openFollowUps = activeFollowUps.filter((followUp) => !followUp.completed_at);
  const nextFollowUp = openFollowUps[0] ?? null;
  const defaultFollowUpTarget = new Date();
  defaultFollowUpTarget.setDate(defaultFollowUpTarget.getDate() + 3);
  const defaultFollowUpDate = toDateInput(defaultFollowUpTarget);
  const returnTo = `/applications/${id}`;

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="applications" />

        <section className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <div>
              <p className={styles.company}>{companyName}</p>
              <h1>{activeApplication.role_title ?? "Untitled role"}</h1>
              <p className={styles.metaLine}>Applied {formatDateLabel(activeApplication.applied_at)}</p>
            </div>

            <div className={styles.headerActions}>
              <Link href="/applications" className={styles.backLink}>
                Back to applications
              </Link>
              {usingDemoData ? (
                <span className={styles.demoBadge}>Demo Mode (read-only)</span>
              ) : (
                <form action={deleteApplication}>
                  <input type="hidden" name="application_id" value={id} />
                  <input type="hidden" name="return_to" value="/applications?deleted=1" />
                  <button type="submit" className={styles.deleteButton}>
                    Delete
                  </button>
                </form>
              )}
            </div>
          </div>

          <form className={styles.inlineForm} action={updateApplicationStageStatus}>
            <input type="hidden" name="application_id" value={id} />
            <input type="hidden" name="return_to" value={returnTo} />

            <label htmlFor="stage">Stage</label>
            <select id="stage" name="stage" defaultValue={activeApplication.stage ?? "Applied"} disabled={usingDemoData}>
              <option value="Applied">Applied</option>
              <option value="OA">OA</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>

            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={activeApplication.status ?? "Active"} disabled={usingDemoData}>
              <option value="Active">Active</option>
              <option value="Rejected">Rejected</option>
              <option value="Accepted">Accepted</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>

            <button type="submit" disabled={usingDemoData}>
              Save
            </button>
          </form>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Follow-up</h2>
            <p className={styles.cardSubtitle}>
              {nextFollowUp
                ? `Next follow-up is ${formatDateLabel(nextFollowUp.due_at)}${isOverdueFollowUp(nextFollowUp) ? " (overdue)" : ""}.`
                : "No follow-up scheduled yet."}
            </p>

            {usingDemoData ? (
              <p className={styles.demoNotice}>Demo mode is read-only. Sign in to add or update follow-ups.</p>
            ) : (
              <form className={styles.stackedForm} action={setFollowUp}>
                <input type="hidden" name="application_id" value={id} />
                <input type="hidden" name="return_to" value={returnTo} />

                <label htmlFor="due_date">Set follow-up date</label>
                <input id="due_date" name="due_date" type="date" defaultValue={defaultFollowUpDate} required />

                <label htmlFor="note">Note (optional)</label>
                <input id="note" name="note" type="text" placeholder="What to follow up on..." />

                <button type="submit">
                  Set follow-up
                </button>
              </form>
            )}

            {openFollowUps.length > 0 ? (
              <ul className={styles.followUpList}>
                {openFollowUps.map((followUp) => (
                  <li key={followUp.id}>
                    <div>
                      <p>{formatDateLabel(followUp.due_at)}</p>
                      <span>{followUp.note?.trim() || "No note"}</span>
                    </div>

                    {usingDemoData ? (
                      <span className={styles.readOnlyTag}>Read-only</span>
                    ) : (
                      <form action={markFollowUpDone}>
                        <input type="hidden" name="follow_up_id" value={followUp.id} />
                        <input type="hidden" name="application_id" value={id} />
                        <input type="hidden" name="return_to" value={returnTo} />
                        <button type="submit">Mark done</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className={styles.card}>
            <h2>Notes</h2>
            {usingDemoData ? (
              <p className={styles.demoNotice}>Demo mode is read-only. Sign in to add notes.</p>
            ) : (
              <form className={styles.stackedForm} action={addNote}>
                <input type="hidden" name="application_id" value={id} />
                <input type="hidden" name="return_to" value={returnTo} />

                <label htmlFor="content">Add note</label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  placeholder="Interview notes, reminders, contact context..."
                  required
                />

                <button type="submit">
                  Add note
                </button>
              </form>
            )}

            {activeNotes.length === 0 ? <p className={styles.emptyText}>No notes yet.</p> : null}

            {activeNotes.length > 0 ? (
              <ul className={styles.noteList}>
                {activeNotes.map((note) => (
                  <li key={note.id}>
                    <p>{note.content?.trim() || "Empty note"}</p>
                    <span>{formatDateLabel(note.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        </section>

        <section className={styles.card}>
          <h2>Links</h2>
          {usingDemoData ? (
            <p className={styles.demoNotice}>Demo mode is read-only. Sign in to add links.</p>
          ) : (
            <form className={styles.linkForm} action={addLink}>
              <input type="hidden" name="application_id" value={id} />
              <input type="hidden" name="return_to" value={returnTo} />

              <label htmlFor="label">Label</label>
              <input id="label" name="label" type="text" placeholder="Job posting, OA link..." />

              <label htmlFor="url">URL</label>
              <input id="url" name="url" type="url" placeholder="https://..." required />

              <button type="submit">
                Add link
              </button>
            </form>
          )}

          {activeLinks.length === 0 ? <p className={styles.emptyText}>No links yet.</p> : null}

          {activeLinks.length > 0 ? (
            <div className={styles.linkList}>
              {activeLinks.map((link) => (
                <a key={link.id} href={normalizeLinkUrl(link.url ?? "")} target="_blank" rel="noreferrer" className={styles.linkChip}>
                  {link.label?.trim() || "Open link"}
                </a>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
