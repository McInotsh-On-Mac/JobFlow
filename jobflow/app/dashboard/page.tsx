import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import styles from "./page.module.css";

export default function DashboardPage() {
  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="dashboard" />

        <section className={styles.headerCard}>
          <p className={styles.kicker}>Raw Account</p>
          <h1>Dashboard</h1>
          <p>Clean view of your account and application state.</p>
        </section>

        <section className={styles.grid}>
          <article className={styles.card}>
            <h2>Account</h2>
            <p>No profile data yet.</p>
            <Link href="/">Open home</Link>
          </article>

          <article className={styles.card}>
            <h2>Applications</h2>
            <p>No applications yet.</p>
            <Link href="/applications">Open applications</Link>
          </article>
        </section>
      </div>
    </main>
  );
}
