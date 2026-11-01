"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import {
  IconCheck,
  IconFamily,
  IconInfo,
  IconLock,
  IconPin,
  IconPlus,
  IconRefresh,
  IconSms,
  IconTelegram,
  IconUsers,
  IconX,
} from "@/components/ui/Icons";
import { relativeTime } from "@/lib/glucose";

export function FamilyView() {
  const { activeId, active } = useDashboardCtx();
  const [data, setData] = useState<any>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", relation: "Family", sms: true, telegram: true, location: false });

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/family?patientId=${activeId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(userId: number, patch: Record<string, unknown>) {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch("/api/family", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId, userId, ...patch }),
    });
    const json = await res.json();
    setBusy(false);
    if (!json.ok) notify(json.error ?? "Could not update permissions.");
    await load();
  }

  async function remove(userId: number, name: string) {
    if (!activeId) return;
    if (!window.confirm(`Remove ${name} from this care circle? They will stop receiving alerts immediately.`)) return;
    setBusy(true);
    await fetch("/api/family", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId, userId }),
    });
    setBusy(false);
    notify(`${name} removed from the care circle.`);
    await load();
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId) return;
    setBusy(true);
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        patientId: activeId,
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        relation: form.relation,
        receiveSms: form.sms,
        receiveTelegram: form.telegram,
        canViewLocation: form.location,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      notify(json.created ? "Family member added — ask them to set a password from the sign-in page." : "Existing account added to this care circle.");
      setAdding(false);
      setForm({ name: "", email: "", phone: "", relation: "Family", sms: true, telegram: true, location: false });
      await load();
    } else {
      notify(json.error ?? "Could not add this person.");
    }
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const canManage = data.canManage;
  const seatsUsed = data.members.length;
  const limit = data.recipientLimit;
  const atLimit = limit !== null && seatsUsed >= limit;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Family &amp; caregivers</h1>
          <p className="text-[0.82rem] text-muted">
            Manage who can see {active?.name}&apos;s readings and who receives alerts.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn btn-sm btn-ghost">
            <IconRefresh size={14} />
          </button>
          <button onClick={() => setAdding((v) => !v)} disabled={!canManage || atLimit} className="btn btn-sm btn-primary">
            <IconPlus size={14} /> Add person
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card p-4">
          <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Alert recipients</p>
          <p className="mt-0.5 text-xl font-extrabold text-navy-900">
            {seatsUsed}
            <span className="ml-1 text-[0.8rem] font-bold text-muted">/ {limit ?? "custom"}</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
            <div
              className={`h-full rounded-full ${atLimit ? "bg-high" : "bg-gradient-to-r from-brand-500 to-teal-500"}`}
              style={{ width: `${limit ? Math.min(100, (seatsUsed / limit) * 100) : 22}%` }}
            />
          </div>
          <p className="mt-2 text-[0.7rem] text-muted">{data.planName ?? "No active plan"} plan</p>
        </div>
        <div className="card p-4">
          <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Telegram linked</p>
          <p className="mt-0.5 text-xl font-extrabold text-navy-900">
            {data.members.filter((m: any) => m.telegram === "active").length}
          </p>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
            Telegram is included on your plan. Recipients link their own chat from the Telegram page.
          </p>
        </div>
        <div className="card p-4">
          <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Location access</p>
          <p className="mt-0.5 text-xl font-extrabold text-navy-900">
            {data.members.filter((m: any) => m.canViewLocation).length}
          </p>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
            Only recipients with location permission can see a shared location.
          </p>
        </div>
      </div>

      {adding ? (
        <form onSubmit={invite} className="card-lg p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.95rem] font-extrabold text-navy-900">Add a family member or caregiver</h2>
            <button type="button" onClick={() => setAdding(false)} className="text-muted hover:text-navy-800">
              <IconX size={16} />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">Full name</span>
              <input
                required
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Amina Yusuf"
              />
            </label>
            <label className="block">
              <span className="label">Email address</span>
              <input
                required
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="name@example.com"
              />
            </label>
            <label className="block">
              <span className="label">Mobile number (for SMS)</span>
              <input
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+252 61 000 0000"
              />
            </label>
            <label className="block">
              <span className="label">Relationship</span>
              <select className="field" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })}>
                {["Family", "Spouse", "Parent", "Child", "Sibling", "Caregiver", "Clinician", "Other"].map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {[
              { key: "sms" as const, label: "SMS alerts", icon: IconSms },
              { key: "telegram" as const, label: "Telegram alerts", icon: IconTelegram },
              { key: "location" as const, label: "View location", icon: IconPin },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <button
                  type="button"
                  key={c.key}
                  onClick={() => setForm({ ...form, [c.key]: !form[c.key] })}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[0.8rem] font-bold transition ${
                    form[c.key] ? "border-brand-200 bg-brand-50 text-brand-700" : "border-line bg-white text-muted"
                  }`}
                >
                  <Icon size={15} />
                  {c.label}
                  {form[c.key] ? <IconCheck size={13} className="ml-auto" /> : null}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
              {busy ? "Adding…" : "Add to care circle"}
            </button>
            <p className="text-[0.72rem] text-muted">They can adjust their own channels later.</p>
          </div>
        </form>
      ) : null}

      {atLimit ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#f0d3ac] bg-high-soft/60 p-3.5">
          <IconInfo size={15} className="mt-0.5 flex-none text-high" />
          <p className="text-[0.78rem] leading-relaxed text-[#8a5a11]">
            You have reached the {limit}-recipient limit for the {data.planName} plan. Upgrade your plan to add
            more people.
          </p>
        </div>
      ) : null}

      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconUsers size={16} className="text-brand-600" /> Care circle
          </h2>
        </div>
        {data.members.length ? (
          <ul className="divide-y divide-line">
            {data.members.map((m: any) => (
              <li key={m.userId} className="px-4 py-4">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-[0.72rem] font-extrabold text-white">
                    {m.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-[0.88rem] font-bold text-navy-900">
                      {m.name}
                      <span className="pill pill-muted text-[0.56rem]">{m.relation}</span>
                      {m.telegram === "active" ? (
                        <span className="pill pill-ok text-[0.54rem]">Telegram linked</span>
                      ) : null}
                    </p>
                    <p className="truncate text-[0.72rem] text-muted">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ""}
                    </p>
                    {m.addedAt ? (
                      <p className="text-[0.66rem] text-muted">Added {relativeTime(m.addedAt)}</p>
                    ) : null}
                  </div>
                  {canManage ? (
                    <button
                      onClick={() => remove(m.userId, m.name)}
                      disabled={busy}
                      className="rounded-lg border border-line px-2 py-1 text-[0.68rem] font-bold text-muted transition hover:border-[#f6d2d2] hover:text-low"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {[
                    { key: "receive_push", label: "Push", value: m.receivePush },
                    { key: "receive_sms", label: "SMS", value: m.receiveSms },
                    { key: "receive_telegram", label: "Telegram", value: m.receiveTelegram },
                    { key: "can_view_location", label: "Location", value: m.canViewLocation },
                  ].map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      disabled={!canManage || busy}
                      onClick={() => toggle(m.userId, { [c.key]: !c.value })}
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[0.72rem] font-bold transition ${
                        c.value ? "border-teal-200 bg-teal-50/70 text-teal-700" : "border-line bg-white text-muted"
                      } ${canManage ? "" : "opacity-60"}`}
                      aria-pressed={c.value}
                    >
                      {c.label}
                      <span className={`h-1.5 w-1.5 rounded-full ${c.value ? "bg-teal-500" : "bg-[#c3cfdb]"}`} />
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <IconFamily size={22} className="mx-auto text-muted" />
            <p className="mt-2 text-[0.86rem] font-bold text-navy-900">No family members yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[0.76rem] text-muted">
              Add the first person so alerts have somewhere to go.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
        <IconLock size={15} className="mt-0.5 flex-none text-navy-600" />
        <p className="text-[0.74rem] leading-relaxed text-muted">
          Family members with alert permission see readings and alerts but never billing or administrative
          settings. Location access requires the patient&apos;s explicit consent and can be withdrawn at any time.
        </p>
      </div>
    </div>
  );
}
