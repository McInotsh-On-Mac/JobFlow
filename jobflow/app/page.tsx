import Link from "next/link";
import AppHeader from "../components/AppHeader";
import BrandLogo from "../components/BrandLogo";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <AppHeader current="home" />

        <section className={styles.hero}>
          <div className={styles.heroTop}>
            <BrandLogo size="large" href={null} priority />
            <div className={styles.quickAccess}>
              <p>Quick Access</p>
              <div className={styles.actions}>
                <Link className={`${styles.button} ${styles.primary}`} href="/dashboard">
                  Dashboard
                </Link>
                <Link className={styles.button} href="/applications">
                  Applications
                </Link>
              </div>
            </div>
          </div>

          <h1>Job tracking, simplified.</h1>
          <p>Stay organized, follow up on time, and move through your job search with confidence.</p>
        </section>
      </div>
    </main>
  );
}
