import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import { login } from "../../lib/auth-actions";
import RecoveryRedirect from "./RecoveryRedirect";
import styles from "./page.module.css";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string; reason?: string }>;
};

function getFeedback(params: { error?: string; message?: string; reason?: string }) {
  const reason = params.reason ? ` (${params.reason})` : "";

  if (params.error === "missing") {
    return { type: "error", text: "Enter your email and password." };
  }

  if (params.error === "invalid") {
    return { type: "error", text: `Login failed. Check your credentials and try again${reason}.` };
  }

  if (params.error === "confirm_email") {
    return { type: "error", text: `Confirm your email first, then log in${reason}.` };
  }

  if (params.error === "network") {
    return { type: "error", text: `Could not reach Supabase. Try again in a moment${reason}.` };
  }

  if (params.message === "check-email") {
    return { type: "info", text: "Account created. Check your email to confirm your account." };
  }

  if (params.message === "password-reset") {
    return { type: "info", text: "Password updated. Sign in with your new password." };
  }

  return null;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const feedback = getFeedback(params);

  return (
    <main className={styles.page}>
      <RecoveryRedirect />
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.topBar}>
          <BrandLogo />
        </header>

        <section className={styles.card}>
          <div className={styles.brandBlock}>
            <BrandLogo size="large" href={null} priority />
            <h1>Welcome back</h1>
            <p>Sign in to access your account.</p>
          </div>

          <form className={styles.form} action={login}>
            {feedback ? (
              <p className={feedback.type === "error" ? styles.feedbackError : styles.feedbackInfo}>{feedback.text}</p>
            ) : null}

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

            <Link className={styles.forgotLink} href="/forgot-password">
              Forgot password?
            </Link>

            <Link href="/signup" className={styles.doorLink}>
              New here? Create your account
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
