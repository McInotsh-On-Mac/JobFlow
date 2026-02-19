"use client";

import { useEffect } from "react";

export default function RecoveryRedirect() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);

    const searchType = searchParams.get("type");
    const hashType = hashParams.get("type");
    const searchTokenHash = searchParams.get("token_hash");
    const searchAccessToken = searchParams.get("access_token");
    const hashAccessToken = hashParams.get("access_token");
    const code = searchParams.get("code");

    const isRecovery = searchType === "recovery" || hashType === "recovery";
    const hasRecoveryToken = Boolean(searchTokenHash || searchAccessToken || hashAccessToken || code);

    if (!isRecovery || !hasRecoveryToken) {
      return;
    }

    const target = `${window.location.origin}/reset-password${window.location.search}${window.location.hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
