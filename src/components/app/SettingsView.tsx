"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconGlobe,
  IconInfo,
  IconLock,
  IconPhone,
  IconRefresh,
  IconShield,
  IconUsers,
} from "@/components/ui/Icons";
import { useI18n } from "@/components/i18n/I18nProvider";

const TAB_KEYS = ["profile", "units", "alerts", "notifications", "security"] as const;
type Tab = (typeof TAB_KEYS)[number];

export function SettingsView() {
  const { activeId, active } = useDashboardCtx();
  const { locale, setLocale } = useI18n();
  const [tab, setTab] = useState<Tab>("profile");
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/settings?patientId=${activeId ?? ""}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(patch: any, message = "Saved.") {
    setBusy(true);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      notify(message);
      await load();
    } else notify(json.error ?? "Could not save changes.");
  }

  if (!data) return <div className="skeleton h-80 w-full rounded-2xl" />;

  const u = data.user;
  const prefs = data.prefs;
  const patient = data.patient;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header>
        <h1 className="text-xl font-extrabold text-navy-900">Settings</h1>
        <p className="text-[0.82rem] text-muted">Your account, display preferences and security.</p>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {TAB_KEYS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-bold capitalize transition ${
              tab === t ? "border-navy-800 bg-navy-800 text-white" : "border-line bg-white text-navy-800 hover:border-brand-200"
            }`}
          >
            {t === "notifications" ? "Notifications" : t}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <ProfileTab u={u} busy={busy} onSave={(p: any) => save(p, "Profile updated.")} />
      ) : null}

      {tab === "units" ? (
        <section className="card-lg p-5">
          <h2 className="text-[0.95rem] font-extrabold text-navy-900">Display preferences</h2>
          <p className="text-[0.78rem] text-muted">Choose how glucose values and language are shown to you.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { value: "mg/dL", title: "mg/dL", sub: "Milligrams per decilitre (US, Somalia)" },
              { value: "mmol/L", title: "mmol/L", sub: "Millimoles per litre (UK, EU)" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => save({ unit: opt.value }, `Unit set to ${opt.value}.`)}
                className={`rounded-xl border-2 p-3.5 text-left transition ${
                  data.unit === opt.value ? "border-brand-500 bg-brand-50/60" : "border-line bg-white hover:border-brand-200"
                }`}
              >
                <p className="flex items-center justify-between text-[0.92rem] font-extrabold text-navy-900">
                  {opt.title}
                  {data.unit === opt.value ? <IconCheck size={15} className="text-brand-600" /> : null}
                </p>
                <p className="mt-0.5 text-[0.72rem] text-muted">{opt.sub}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 border-t border-line pt-4">
            <h3 className="flex items-center gap-1.5 text-[0.88rem] font-bold text-navy-900">
              <IconGlobe size={15} className="text-brand-600" /> Language
            </h3>
            <p className="text-[0.74rem] text-muted">English is the default. Your choice is remembered on this device.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { code: "en", label: "English" },
                { code: "so", label: "Soomaali" },
                { code: "ar", label: "العربية" },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLocale(l.code as any)}
                  className={`rounded-lg border px-3 py-1.5 text-[0.8rem] font-bold transition ${
                    locale === l.code ? "border-brand-500 bg-brand-500 text-white" : "border-line bg-white text-navy-800"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {patient ? (
            <div className="mt-5 border-t border-line pt-4">
              <h3 className="text-[0.88rem] font-bold text-navy-900">Patient profile</h3>
              <p className="text-[0.74rem] text-muted">
                Stored readings remain in mg/dL. Only the display changes.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-line px-3 py-2">
                  <p className="text-[0.66rem] font-bold uppercase tracking-wide text-muted">Patient</p>
                  <p className="text-[0.84rem] font-bold text-navy-900">{patient.display_name}</p>
                </div>
                <div className="rounded-lg border border-line px-3 py-2">
                  <p className="text-[0.66rem] font-bold uppercase tracking-wide text-muted">Target range</p>
                  <p className="text-[0.84rem] font-bold text-navy-900">
                    {patient.thresholds.low}–{patient.thresholds.high} mg/dL
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {tab === "alerts" ? (
        <section className="card-lg p-5">
          <h2 className="text-[0.95rem] font-extrabold text-navy-900">Patient alert thresholds</h2>
          <p className="text-[0.78rem] text-muted">
            Used by the alert engine for {active?.name}. Changes apply to future readings.
          </p>
          {patient ? (
            <ThresholdEditor
              patient={patient}
              busy={busy}
              onSave={(t: any) => save({ thresholds: t }, "Alert thresholds updated.")}
            />
          ) : null}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[#f0d3ac] bg-high-soft/50 p-3.5">
            <IconAlert size={15} className="mt-0.5 flex-none text-high" />
            <p className="text-[0.74rem] leading-relaxed text-[#8a5a11]">
              Alert thresholds are not treatment targets. Confirm them with the patient&apos;s clinician before
              widening them.
            </p>
          </div>
        </section>
      ) : null}

      {tab === "notifications" ? (
        <section className="card-lg p-5">
          <h2 className="text-[0.95rem] font-extrabold text-navy-900">Notification preferences</h2>
          <p className="text-[0.78rem] text-muted">Choose which channels reach you personally.</p>
          <div className="mt-4 space-y-2">
            {[
              { key: "notify_push", label: "Push notifications", icon: IconBell, sub: "In-app and background push where enabled" },
              { key: "notify_sms", label: "SMS messages", icon: IconPhone, sub: "Requires a mobile number on your profile" },
              { key: "notify_telegram", label: "Telegram messages", icon: IconUsers, sub: "Link your chat from the Telegram page" },
              { key: "notify_audible", label: "Audible in-app alerts", icon: IconBell, sub: "Sounds while a dashboard tab is open" },
            ].map((row) => {
              const Icon = row.icon;
              const on = Boolean(prefs?.[row.key]);
              return (
                <div key={row.key} className="flex items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-mist text-navy-700">
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[0.84rem] font-bold text-navy-900">{row.label}</p>
                    <p className="text-[0.7rem] text-muted">{row.sub}</p>
                  </div>
                  <button
                    onClick={() => save({ prefs: { [row.key]: !on } }, `${row.label} ${on ? "off" : "on"}.`)}
                    disabled={busy}
                    className={`relative h-6 w-11 flex-none rounded-full transition ${on ? "bg-teal-500" : "bg-[#cbd7e3]"}`}
                    aria-pressed={on}
                    aria-label={row.label}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`}
                    />
                  </button>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-line bg-[#fbfdff] p-3.5">
            <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
            <p className="text-[0.74rem] leading-relaxed text-muted">
              Audible alerts only work while this browser tab is open. Mobile OS background audio restrictions mean
              in-app sound is not a guaranteed emergency channel — pair it with Telegram and SMS.
            </p>
          </div>
        </section>
      ) : null}

      {tab === "security" ? (
        <div className="space-y-4">
          <section className="card-lg p-5">
            <h2 className="flex items-center gap-1.5 text-[0.95rem] font-extrabold text-navy-900">
              <IconLock size={16} className="text-brand-600" /> Account security
            </h2>
            <dl className="mt-3 space-y-2">
              {[
                ["Email", u.email],
                ["Role", u.role.replace(/_/g, " ")],
                ["Workspace", u.org_name ?? "Personal"],
                ["Last sign-in", u.last_login_at ? new Date(u.last_login_at).toLocaleString("en-GB") : "This session"],
                ["Password", "Managed by your workspace administrator"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between border-b border-line/70 pb-2 last:border-0">
                  <dt className="text-[0.78rem] font-semibold capitalize text-muted">{k}</dt>
                  <dd className="text-[0.8rem] font-bold capitalize text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[0.74rem] leading-relaxed text-muted">
              Passwords are stored as bcrypt hashes and never leave the server. Sessions are signed HTTP-only
              cookies with a 30-day rolling expiry.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
              <IconShield size={16} className="text-teal-600" /> Recent account activity
            </h2>
            <ul className="mt-3 space-y-2">
              {(data.audit ?? []).slice(0, 8).map((a: any) => (
                <li key={a.id} className="flex items-start justify-between gap-3 border-b border-line/70 pb-2 last:border-0">
                  <div>
                    <p className="text-[0.8rem] font-bold capitalize text-navy-900">{a.action.replace(/\./g, " ")}</p>
                    <p className="text-[0.68rem] text-muted">
                      {a.entity} · {a.entity_id ?? "—"}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[0.68rem] font-semibold text-muted">
                    {new Date(a.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
              {!(data.audit ?? []).length ? <li className="text-[0.78rem] text-muted">No activity recorded yet.</li> : null}
            </ul>
          </section>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white p-3.5">
        <div className="flex items-center gap-2 text-[0.74rem] text-muted">
          <IconRefresh size={14} /> Configuration is loaded from the server on every visit.
        </div>
        <a href="/legal/privacy" className="text-[0.74rem] font-bold text-brand-700 hover:underline">
          Privacy policy →
        </a>
      </div>
    </div>
  );
}

function ProfileTab({ u, busy, onSave }: { u: any; busy: boolean; onSave: (p: any) => void }) {
  const [name, setName] = useState(u.name);
  const [phone, setPhone] = useState(u.phone ?? "");
  return (
    <section className="card-lg p-5">
      <h2 className="text-[0.95rem] font-extrabold text-navy-900">Your profile</h2>
      <p className="text-[0.78rem] text-muted">Shown to the family members you are connected with.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="label">Full name</span>
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Email address</span>
          <input className="field bg-mist/60" value={u.email} readOnly />
        </label>
        <label className="block">
          <span className="label">Mobile number</span>
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+252 61 000 0000" />
        </label>
        <label className="block">
          <span className="label">Timezone</span>
          <input className="field bg-mist/60" value={u.timezone ?? "Africa/Mogadishu"} readOnly />
        </label>
      </div>
      <button onClick={() => onSave({ name, phone })} disabled={busy} className="btn btn-primary btn-sm mt-4">
        {busy ? "Saving…" : "Save profile"}
      </button>
    </section>
  );
}

function ThresholdEditor({ patient, busy, onSave }: { patient: any; busy: boolean; onSave: (t: any) => void }) {
  const [t, setT] = useState({
    low: patient.thresholds.low,
    high: patient.thresholds.high,
    criticalLow: patient.thresholds.criticalLow,
    criticalHigh: patient.thresholds.criticalHigh,
  });
  return (
    <div className="mt-4">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { key: "criticalLow" as const, label: "Critical low", tone: "text-low" },
          { key: "low" as const, label: "Low", tone: "text-low" },
          { key: "high" as const, label: "High", tone: "text-high" },
          { key: "criticalHigh" as const, label: "Critical high", tone: "text-high" },
        ].map((f) => (
          <label key={f.key} className="block">
            <span className="label">{f.label}</span>
            <div className="relative">
              <input
                type="number"
                min={30}
                max={500}
                className={`field pr-12 tabular font-bold ${f.tone}`}
                value={t[f.key]}
                onChange={(e) => setT({ ...t, [f.key]: Number(e.target.value) })}
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[0.66rem] font-bold text-muted">
                mg/dL
              </span>
            </div>
          </label>
        ))}
      </div>
      <button onClick={() => onSave(t)} disabled={busy} className="btn btn-primary btn-sm mt-3">
        {busy ? "Saving…" : "Save thresholds"}
      </button>
    </div>
  );
}
