import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import { login } from "../../lib/auth-actions";
import styles from "./page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.topBar}>
          <BrandLogo />
          <Link className={styles.back} href="/signup">
            Sign up
          </Link>
        </header>

        <section className={styles.card}>
          <div className={styles.brandBlock}>
            <BrandLogo size="large" href={null} priority />
            <h1>Welcome back</h1>
            <p>Sign in to access your account.</p>
          </div>

          <form className={styles.form} action={login}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />

            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              required
            />

            <button type="submit">Sign in</button>

            <p className={styles.switchText}>
              Need an account?{" "}
              <Link href="/signup" className={styles.switchLink}>
                Create one
              </Link>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
