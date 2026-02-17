import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import { requestPasswordReset } from "../../lib/auth-actions";
import styles from "./page.module.css";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ sent?: string; error?: string; reason?: string }>;
};

function getFeedback(params: { sent?: string; error?: string; reason?: string }) {
  const reason = params.reason ? ` (${params.reason})` : "";

  if (params.sent === "1") {
    return {
      type: "info",
      text: "If that email exists, a reset link has been sent. Check your inbox.",
    };
  }

  if (params.error === "missing") {
    return { type: "error", text: "Enter your email address." };
  }

  if (params.error === "rate_limit") {
    return { type: "error", text: `Too many reset attempts. Try again later${reason}.` };
  }

  if (params.error === "network") {
    return { type: "error", text: `Could not reach Supabase. Try again in a moment${reason}.` };
  }

  if (params.error === "invalid") {
    return { type: "error", text: `Reset request failed. Try again${reason}.` };
  }

  return null;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = await searchParams;
  const feedback = getFeedback(params);

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.topBar}>
          <BrandLogo />
        </header>

        <section className={styles.card}>
          <div className={styles.brandBlock}>
            <BrandLogo size="large" href={null} priority />
            <h1>Reset your password</h1>
            <p>Enter your email and we will send you a secure reset link.</p>
          </div>

          <form className={styles.form} action={requestPasswordReset}>
            {feedback ? (
              <p className={feedback.type === "error" ? styles.feedbackError : styles.feedbackInfo}>{feedback.text}</p>
            ) : null}

            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="you@example.com" autoComplete="email" required />

            <button type="submit">Send reset link</button>

            <Link href="/login" className={styles.doorLink}>
              Back to sign in
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
