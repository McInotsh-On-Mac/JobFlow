import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import { signup } from "../../lib/auth-actions";
import styles from "./page.module.css";

type SignupPageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

function getSignupFeedback(error?: string, reason?: string) {
  const detail = reason ? ` (${reason})` : "";

  if (error === "missing") {
    return "Complete all fields before creating an account.";
  }

  if (error === "exists") {
    return `That email is already registered. Try logging in instead${detail}.`;
  }

  if (error === "network") {
    return `Could not reach Supabase. Try again in a moment${detail}.`;
  }

  if (error === "rate_limit") {
    return `Supabase email rate limit is hit${detail}. In Supabase Auth, disable email confirmation for development or wait for the limit reset.`;
  }

  if (error === "invalid") {
    return `Signup failed. Check your details and try again${detail}.`;
  }

  return null;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const feedback = getSignupFeedback(params.error, params.reason);

  return (
    <main className={styles.page}>
      <div className={styles.halo} aria-hidden />

      <div className={styles.shell}>
        <section className={styles.card}>
          <div className={styles.brandBlock}>
            <BrandLogo size="large" href={null} priority asset="video" />
            <h1>Create your account</h1>
            <p>Start with a clean, focused workspace.</p>
          </div>

          <form className={styles.form} action={signup}>
            {feedback ? <p className={styles.feedbackError}>{feedback}</p> : null}

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

            <Link href="/login" className={styles.doorLink}>
              Already signed up? Go to sign in
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
