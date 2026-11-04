"use client";

import { useState } from "react";
import Link from "next/link";
import { IconArrow, IconCheck } from "@/components/ui/Icons";

const PLANS = [
  {
    slug: "family-basic" as const,
    name: "Family Basic",
    price: 30,
    blurb: "One patient, low and high alerts",
    features: ["1 monitored patient", "Low & high glucose alerts", "2 family recipients", "Glucose history & reports"],
  },
  {
    slug: "family-premium" as const,
    name: "Family Premium",
    price: 50,
    blurb: "Rapid-change alerts and more caregivers",
    features: [
      "1 monitored patient",
      "All alert types incl. rapid change",
      "5 family recipients",
      "Telegram + SMS channels",
      "Extended history",
    ],
  },
];

export function SignupForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    planSlug: "family-basic" as "family-basic" | "family-premium",
    timezone: "Africa/Mogadishu",
    unit: "mg/dL" as "mg/dL" | "mmol/L",
    patientName: "",
    relationship: "self",
    acceptTerms: false,
    consentToMonitor: false,
    marketingOptIn: false,
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.ok) {
      setBusy(false);
      setError(json.error ?? "Could not create your account.");
      return;
    }
    // Session cookie is already set — go straight to the dashboard.
    window.location.href = json.redirect ?? "/dashboard";
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((p) => {
            const active = form.planSlug === p.slug;
            return (
              <button
                key={p.slug}
                type="button"
                onClick={() => setForm({ ...form, planSlug: p.slug })}
                className={`rounded-2xl border p-4 text-left transition ${
                  active ? "border-brand-400 bg-brand-50/60 ring-2 ring-brand-200" : "border-line bg-white hover:border-brand-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[0.95rem] font-extrabold text-navy-900">{p.name}</p>
                    <p className="text-[0.72rem] font-semibold text-muted">{p.blurb}</p>
                  </div>
                  {active ? <IconCheck size={16} className="text-brand-600" /> : null}
                </div>
                <p className="mt-2 text-[1.6rem] font-extrabold tracking-tight text-navy-900">
                  ${p.price}
                  <span className="text-[0.7rem] font-bold text-muted">/month</span>
                </p>
                <ul className="mt-2 space-y-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-[0.74rem] text-navy-800/80">
                      <IconCheck size={12} className="mt-[3px] flex-none text-teal-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
        <p className="rounded-xl border border-line bg-[#f8fbfe] px-3.5 py-2.5 text-[0.74rem] leading-relaxed text-muted">
          Your plan starts pending. Nothing is charged here — you will receive a payment link, and monitoring unlocks
          once the payment is verified.
        </p>
        <button type="button" onClick={() => setStep(2)} className="btn btn-primary w-full">
          Continue with {PLANS.find((p) => p.slug === form.planSlug)?.name} <IconArrow size={15} />
        </button>
        <p className="text-center text-[0.78rem] text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-brand-700 link-underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      <button type="button" onClick={() => setStep(1)} className="text-[0.76rem] font-bold text-brand-700 hover:underline">
        ← {PLANS.find((p) => p.slug === form.planSlug)?.name} · ${PLANS.find((p) => p.slug === form.planSlug)?.price}/mo
      </button>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Your full name">
          <input required value={form.name} onChange={set("name")} className="input" autoComplete="name" />
        </Field>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={set("email")} className="input" autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <input
            required
            type="password"
            minLength={10}
            value={form.password}
            onChange={set("password")}
            className="input"
            autoComplete="new-password"
          />
        </Field>
        <Field label="Phone (optional)" hint="Used for SMS alerts once a gateway is configured.">
          <input value={form.phone} onChange={set("phone")} className="input" placeholder="+252 …" autoComplete="tel" />
        </Field>
        <Field label="Who is being monitored?">
          <input
            value={form.patientName}
            onChange={set("patientName")}
            className="input"
            placeholder={form.name || "Leave blank if it is you"}
          />
        </Field>
        <Field label="Relationship">
          <select value={form.relationship} onChange={set("relationship")} className="input">
            <option value="self">This is me</option>
            <option value="child">My child</option>
            <option value="parent">My parent</option>
            <option value="family">Another family member</option>
          </select>
        </Field>
        <Field label="Time zone">
          <select value={form.timezone} onChange={set("timezone")} className="input">
            {["Africa/Mogadishu", "Africa/Nairobi", "Africa/Addis_Ababa", "Africa/Djibouti", "Europe/London", "Europe/Istanbul", "Asia/Dubai"].map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Display unit">
          <select value={form.unit} onChange={set("unit")} className="input">
            <option value="mg/dL">mg/dL</option>
            <option value="mmol/L">mmol/L</option>
          </select>
        </Field>
      </div>

      <div className="space-y-2 rounded-xl border border-line bg-white p-3.5">
        <Check checked={form.consentToMonitor} onChange={set("consentToMonitor")}>
          I confirm the person being monitored has consented to glucose data being shared with Walhad CareLink.
        </Check>
        <Check checked={form.acceptTerms} onChange={set("acceptTerms")}>
          I accept the{" "}
          <Link href="/legal/terms" className="font-bold text-brand-700 hover:underline">
            terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="font-bold text-brand-700 hover:underline">
            privacy policy
          </Link>
          .
        </Check>
        <Check checked={form.marketingOptIn} onChange={set("marketingOptIn")}>
          Send me occasional product updates (optional).
        </Check>
      </div>

      {error ? (
        <p className="rounded-xl border border-[#f3cdcd] bg-[#fdf3f3] px-3.5 py-2.5 text-[0.8rem] font-semibold text-[#a12b2b]">
          {error}
        </p>
      ) : null}

      <button type="submit" disabled={busy || !form.acceptTerms || !form.consentToMonitor} className="btn btn-primary w-full">
        {busy ? "Creating your account…" : "Create account"}
      </button>
      <p className="text-center text-[0.72rem] leading-relaxed text-muted">
        Your dashboard starts empty. Readings appear only after you connect an authorised FreeStyle Libre source.
      </p>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.68rem] font-bold uppercase tracking-[0.1em] text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[0.68rem] text-muted">{hint}</span> : null}
    </label>
  );
}

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 flex-none rounded border-line text-brand-600 focus:ring-brand-300"
      />
      <span className="text-[0.78rem] leading-relaxed text-navy-800/85">{children}</span>
    </label>
  );
}
