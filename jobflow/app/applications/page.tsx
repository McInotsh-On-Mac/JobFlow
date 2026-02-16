import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import styles from "./page.module.css";

export default function ApplicationsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="applications" />

        <section className={styles.emptyState}>
          <h1>Applications</h1>
          <p>No applications in this account yet.</p>
          <div className={styles.actions}>
            <Link className={`${styles.button} ${styles.primary}`} href="/dashboard">
              Back to dashboard
            </Link>
            <Link className={styles.button} href="/">
              Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
