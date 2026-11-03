"use client";

import { useState } from "react";

/**
 * Logging out is a POST to a route handler, so it must never be a <Link>:
 * Next prefetches links, and a prefetch of a POST-only route returns 405.
 */
export function SignOutButton({ className = "btn btn-sm btn-ghost" }: { className?: string }) {
  const [busy, setBusy] = useState(false);
  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }
  return (
    <button type="button" onClick={signOut} disabled={busy} className={className}>
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
