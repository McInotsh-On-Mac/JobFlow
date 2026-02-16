import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import { signup } from "../../lib/auth-actions";
import styles from "./page.module.css";

export default function SignupPage() {
  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.topBar}>
          <BrandLogo />
          <Link className={styles.back} href="/login">
            Log in
          </Link>
        </header>

        <section className={styles.card}>
          <div className={styles.brandBlock}>
            <BrandLogo size="large" href={null} priority />
            <h1>Create your account</h1>
            <p>Start with a clean, focused workspace.</p>
          </div>

          <form className={styles.form} action={signup}>
            <label htmlFor="name">Name</label>
            <input id="name" name="name" type="text" placeholder="Your name" autoComplete="name" required />

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />

            <button type="submit">Create account</button>

            <p className={styles.switchText}>
              Already have an account?{" "}
              <Link href="/login" className={styles.switchLink}>
                Log in
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
