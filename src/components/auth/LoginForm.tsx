"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { IconArrow, IconDrop, IconLock, IconShield, IconTelegram, IconUsers } from "@/components/ui/Icons";

interface DemoAccount {
  email: string;
  password: string;
  role: string;
  label: string;
}

export function LoginForm({ accounts, showDemo }: { accounts: DemoAccount[]; showDemo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not sign in.");
        setBusy(false);
        return;
      }
      router.replace(json.redirect ?? "/dashboard");
      router.refresh();
    } catch {
      setError("Network problem. Please try again.");
      setBusy(false);
    }
  }

  function useAccount(acc: DemoAccount) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.92fr]">
      {/* sign in card */}
      <div className="card-lg border border-line bg-white p-7 shadow-card md:p-9">
        <span className="pill pill-brand">
          <IconLock size={12} /> Secure sign in
        </span>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy-900 md:text-[1.7rem]">
          Sign in to your care dashboard
        </h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">
          Use the account already registered for your family or hospital workspace.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label className="label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="field"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-[#f6d2d2] bg-low-soft px-3.5 py-2.5 text-[0.82rem] font-semibold text-low">
              {error}
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
            {!busy ? <IconArrow size={16} /> : null}
          </button>
        </form>

        <div className="mt-5 flex items-start gap-2 rounded-xl bg-mist/70 p-3">
          <IconShield size={15} className="mt-0.5 flex-none text-teal-600" />
          <p className="text-[0.75rem] leading-relaxed text-muted">
            Sessions are encrypted, http-only cookies. Repeated failed attempts are rate-limited and audited.
          </p>
        </div>

        <p className="mt-5 text-center text-[0.8rem] text-muted">
          Need an account? Account creation is handled by your care provider.{" "}
          <Link href="/contact" className="font-bold text-brand-700 link-underline">
            Contact support
          </Link>
        </p>
      </div>

      {/* demo accounts */}
      <div className="flex flex-col gap-4">
        {showDemo && accounts.length ? (
          <div className="card-lg border border-line bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.95rem] font-extrabold text-navy-900">Evaluation accounts</h2>
              <span className="pill pill-teal">No patient data</span>
            </div>
            <p className="mt-1.5 text-[0.8rem] leading-relaxed text-muted">
              Pick a role to walk through the interface. These accounts own no patient records and contain no
              readings — every dashboard opens empty until a real glucose source is connected.
            </p>
            <div className="mt-4 space-y-2">
              {accounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => useAccount(acc)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    email === acc.email
                      ? "border-brand-300 bg-brand-50/70"
                      : "border-line bg-white hover:border-brand-200 hover:bg-[#fbfdff]"
                  }`}
                >
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-lg text-white ${
                      acc.role === "doctor" || acc.role === "nurse" || acc.role === "admin"
                        ? "bg-navy-700"
                        : acc.role === "patient"
                          ? "bg-teal-500"
                          : "bg-brand-500"
                    }`}
                  >
                    {acc.role === "patient" ? (
                      <IconDrop size={15} />
                    ) : acc.role === "family" ? (
                      <IconUsers size={15} />
                    ) : (
                      <IconTelegram size={15} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.8rem] font-bold text-navy-900">{acc.label}</span>
                    <span className="block truncate text-[0.7rem] text-muted">{acc.email}</span>
                  </span>
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-600">Use</span>
                </button>
              ))}
            </div>
            <p className="mt-3 rounded-lg bg-mist p-2.5 text-[0.72rem] leading-relaxed text-muted">
              Shared demo password: <code className="kbd">{accounts[0]?.password}</code> — change or disable demo
              seeding (SEED_DEMO=false) before production use.
            </p>
          </div>
        ) : null}

        <div className="card-lg border border-line bg-gradient-to-br from-[#f3f9ff] to-[#f1fbf7] p-6">
          <h3 className="text-[0.9rem] font-extrabold text-navy-900">What you can do after signing in</h3>
          <ul className="mt-3 space-y-2 text-[0.82rem] text-navy-800">
            {[
              "Live glucose dashboard with honest freshness labels",
              "Family alert rules, escalation and acknowledgements",
              "Telegram linking, test notifications and history",
              "SMS allowance, plan and invoice visibility",
              "Hospital ward view for clinicians",
            ].map((i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-teal-500" />
                {i}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
