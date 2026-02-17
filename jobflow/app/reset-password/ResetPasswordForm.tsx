"use client";

import Link from "next/link";
import { useState } from "react";
import { resetPassword } from "../../lib/auth-actions";
import styles from "./page.module.css";

type ResetPasswordFormProps = {
  serverFeedback: string | null;
};

function readRecoveryPayload() {
  if (typeof window === "undefined") {
    return {
      accessToken: "",
      tokenHash: "",
      recoveryType: "",
    };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const searchToken = searchParams.get("access_token");
  const searchTokenHash = searchParams.get("token_hash");
  const searchType = searchParams.get("type") ?? "";
  if (searchToken) {
    return {
      accessToken: searchToken,
      tokenHash: searchTokenHash ?? "",
      recoveryType: searchType,
    };
  }

  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
  if (!hash) {
    return {
      accessToken: "",
      tokenHash: searchTokenHash ?? "",
      recoveryType: searchType,
    };
  }

  const hashParams = new URLSearchParams(hash);
  const type = hashParams.get("type");
  const token = hashParams.get("access_token");
  if (type !== "recovery" || !token) {
    return {
      accessToken: "",
      tokenHash: searchTokenHash ?? "",
      recoveryType: searchType,
    };
  }

  return {
    accessToken: token,
    tokenHash: searchTokenHash ?? "",
    recoveryType: type,
  };
}

export default function ResetPasswordForm({ serverFeedback }: ResetPasswordFormProps) {
  const [linkError, setLinkError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const payload = readRecoveryPayload();
    const tokenInput = form.elements.namedItem("access_token");
    const tokenHashInput = form.elements.namedItem("token_hash");
    const recoveryTypeInput = form.elements.namedItem("recovery_type");

    if (
      !(tokenInput instanceof HTMLInputElement) ||
      !(tokenHashInput instanceof HTMLInputElement) ||
      !(recoveryTypeInput instanceof HTMLInputElement)
    ) {
      event.preventDefault();
      setLinkError("This reset link is invalid or expired. Request a new reset email.");
      return;
    }

    tokenInput.value = payload.accessToken;
    tokenHashInput.value = payload.tokenHash;
    recoveryTypeInput.value = payload.recoveryType;

    if (!payload.accessToken && !payload.tokenHash) {
      event.preventDefault();
      setLinkError("This reset link is invalid or expired. Request a new reset email.");
      return;
    }

    setLinkError(null);
  }

  return (
    <form className={styles.form} action={resetPassword} onSubmit={onSubmit}>
      {serverFeedback ? <p className={styles.feedbackError}>{serverFeedback}</p> : null}
      {linkError ? <p className={styles.feedbackError}>{linkError}</p> : null}

      <input type="hidden" name="access_token" defaultValue="" />
      <input type="hidden" name="token_hash" defaultValue="" />
      <input type="hidden" name="recovery_type" defaultValue="" />

      <label htmlFor="password">New password</label>
      <input id="password" name="password" type="password" placeholder="Enter new password" autoComplete="new-password" required />

      <label htmlFor="confirm_password">Confirm password</label>
      <input
        id="confirm_password"
        name="confirm_password"
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        required
      />

      <button type="submit">
        Update password
      </button>

      <Link href="/login" className={styles.doorLink}>
        Back to sign in
      </Link>
    </form>
  );
}
