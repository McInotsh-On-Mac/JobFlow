import Link from "next/link";
import AppHeader from "../../../components/AppHeader";
import { createApplication } from "../../../lib/application-actions";
import styles from "./page.module.css";

type NewApplicationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

function getErrorMessage(error?: string): string | null {
  if (error === "missing") {
    return "Company and role title are required.";
  }
  if (error === "company") {
    return "Could not create or find the company record.";
  }
  if (error === "save") {
    return "Application could not be saved. Try again.";
  }
  return null;
}

export default async function NewApplicationPage({ searchParams }: NewApplicationPageProps) {
  const params = await searchParams;
  const errorMessage = getErrorMessage(params.error);

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="applications" />

        <section className={styles.card}>
          <div className={styles.header}>
            <h1>Add Application</h1>
            <p>Create a new application entry in under 30 seconds.</p>
          </div>

          <form className={styles.form} action={createApplication}>
            {errorMessage ? <p className={styles.feedbackError}>{errorMessage}</p> : null}

            <label htmlFor="company">Company</label>
            <input id="company" name="company" type="text" placeholder="Company name" required />

            <label htmlFor="role_title">Role Title</label>
            <input id="role_title" name="role_title" type="text" placeholder="Role title" required />

            <label htmlFor="stage">Stage</label>
            <select id="stage" name="stage" defaultValue="Applied">
              <option value="Applied">Applied</option>
              <option value="OA">OA</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
            </select>

            <label htmlFor="applied_at">Applied Date</label>
            <input id="applied_at" name="applied_at" type="date" />

            <label htmlFor="job_link">Job Link</label>
            <input id="job_link" name="job_link" type="url" placeholder="https://..." />

            <label htmlFor="notes">Notes</label>
            <textarea id="notes" name="notes" rows={4} placeholder="Any details from the application..." />

            <div className={styles.actions}>
              <button type="submit" className={`${styles.button} ${styles.primary}`}>
                Save
              </button>
              <Link href="/applications" className={styles.button}>
                Cancel
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
