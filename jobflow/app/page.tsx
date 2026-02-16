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
          <BrandLogo size="large" href={null} priority />
          <h1>Job tracking, simplified.</h1>
          <p>No fake stats. No fake applications. Just your account and your workflow.</p>
          <div className={styles.actions}>
            <Link className={`${styles.button} ${styles.primary}`} href="/dashboard">
              Dashboard
            </Link>
            <Link className={styles.button} href="/applications">
              Applications
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
