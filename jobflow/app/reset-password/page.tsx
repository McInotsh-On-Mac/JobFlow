import Link from "next/link";
import BrandLogo from "../../components/BrandLogo";
import ResetPasswordForm from "./ResetPasswordForm";
import styles from "./page.module.css";

type ResetPasswordPageProps = {
  searchParams: Promise<{ error?: string; reason?: string }>;
};

function getFeedback(error?: string, reason?: string) {
  const detail = reason ? ` (${reason})` : "";

  if (error === "missing") {
    return "Enter and confirm your new password.";
  }

  if (error === "mismatch") {
    return "Passwords do not match.";
  }

  if (error === "weak") {
    return "Password must be at least 8 characters.";
  }

  if (error === "invalid_link") {
    return "Reset link is missing or expired. Request a new one.";
  }

  if (error === "network") {
    return `Could not reach Supabase. Try again in a moment${detail}.`;
  }

  if (error === "invalid") {
    return `Password reset failed. Request a new link and try again${detail}.`;
  }

  return null;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const feedback = getFeedback(params.error, params.reason);

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
            <h1>Set a new password</h1>
            <p>Choose a secure password to finish resetting your account.</p>
          </div>

          <ResetPasswordForm serverFeedback={feedback} />
        </section>

        <Link href="/forgot-password" className={styles.helperLink}>
          Need a new reset email?
        </Link>
      </div>
    </main>
  );
}
