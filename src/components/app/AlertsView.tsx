"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import { IconAlert, IconBell, IconCheck, IconInfo, IconRefresh, IconShield, IconTelegram, IconClock } from "@/components/ui/Icons";
import { relativeTime, stampTime } from "@/lib/glucose";

const CHANNELS = ["push", "sms", "telegram", "audible", "inapp"] as const;

const CHANNEL_LABEL: Record<string, string> = {
  push: "Push",
  sms: "SMS",
  telegram: "Telegram",
  audible: "Audible",
  inapp: "In-app",
};

export function AlertsView() {
  const { activeId, active } = useDashboardCtx();
  const [data, setData] = useState<any>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/alerts?patientId=${activeId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 45_000);
    return () => window.clearInterval(t);
  }, [load]);

  async function patchRule(kind: string, patch: Record<string, unknown>) {
    if (!activeId || !data?.canManage) return;
    setSaving(kind);
    const res = await fetch("/api/alerts/rules", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId, kind, ...patch }),
    });
    const json = await res.json();
    setToast(json.ok ? "Rule updated." : json.error ?? "Could not update rule.");
    setSaving(null);
    await load();
    window.setTimeout(() => setToast(null), 3000);
  }

  async function acknowledge(id: number) {
    await fetch("/api/alerts/acknowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    await load();
  }

  async function testTelegram() {
    if (!activeId) return;
    setSaving("test");
    const res = await fetch("/api/telegram/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId }),
    });
    const json = await res.json();
    setToast(json.detail ?? (json.ok ? "Test sent." : "Test failed."));
    setSaving(null);
    window.setTimeout(() => setToast(null), 5000);
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const unit = active?.unit ?? "mg/dL";
  const canManage = data.canManage;
  const open = data.alerts.filter((a: any) => a.status === "open" || a.status === "escalated");
  const history = data.alerts.filter((a: any) => a.status !== "open" && a.status !== "escalated");

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Alerts & rules</h1>
          <p className="text-[0.82rem] text-muted">
            Configure thresholds, channels and escalation for {data.patientName ?? active?.name}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={testTelegram} disabled={saving === "test"} className="btn btn-sm btn-ghost">
            <IconTelegram size={14} /> Send Telegram test
          </button>
          <button onClick={load} className="btn btn-sm btn-ghost">
            <IconRefresh size={14} /> Refresh
          </button>
        </div>
      </header>

      {!canManage ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-[#fbfdff] p-3.5">
          <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
          <p className="text-[0.78rem] leading-relaxed text-muted">
            You can view alerts for this patient but only the patient or an administrator can change the rules.
          </p>
        </div>
      ) : null}

      {/* open alerts */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconAlert size={16} className="text-low" /> Open alerts
          </h2>
          <span className={`pill ${open.length ? "pill-low" : "pill-ok"} text-[0.62rem]`}>
            {open.length ? `${open.length} awaiting acknowledgement` : "All clear"}
          </span>
        </div>
        {open.length ? (
          <ul className="divide-y divide-line">
            {open.map((a: any) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span
                  className={`grid h-9 w-9 flex-none place-items-center rounded-xl ${
                    a.level === "critical" ? "bg-low-soft text-low" : "bg-high-soft text-high"
                  }`}
                >
                  <IconAlert size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[0.86rem] font-bold capitalize text-navy-900">
                    {a.kind.replace(/-/g, " ")} · {a.value ? `${a.value} ${a.unit ?? unit}` : "data warning"}
                  </p>
                  <p className="text-[0.76rem] leading-snug text-muted">{a.message}</p>
                  <p className="text-[0.66rem] font-semibold text-muted">
                    {stampTime(a.triggeredAt)} · {relativeTime(a.triggeredAt)}
                  </p>
                </div>
                <button onClick={() => acknowledge(a.id)} className="btn btn-sm btn-primary">
                  <IconCheck size={13} /> Acknowledge
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-600">
              <IconCheck size={19} />
            </span>
            <p className="mt-2 text-[0.86rem] font-bold text-navy-900">No open alerts</p>
            <p className="text-[0.76rem] text-muted">
              Readings are within your configured thresholds and notifications are being delivered.
            </p>
          </div>
        )}
      </section>

      {/* rules */}
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconShield size={16} className="text-brand-600" /> Alert rules
          </h2>
          <p className="text-[0.72rem] text-muted">
            Thresholds are evaluated against every new reading. Change one thing at a time — updates apply
            immediately.
          </p>
        </div>
        <ul className="divide-y divide-line">
          {data.rules.map((r: any) => (
            <li key={r.kind} className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-[0.88rem] font-bold capitalize text-navy-900">
                    {r.label}
                    <span className={`pill text-[0.56rem] ${r.enabled ? "pill-ok" : "pill-muted"}`}>
                      {r.enabled ? "enabled" : "disabled"}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[0.74rem] text-muted">{describeRule(r, unit)}</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <span className="text-[0.7rem] font-bold text-muted">{r.enabled ? "On" : "Off"}</span>
                  <button
                    type="button"
                    disabled={!canManage || saving === r.kind}
                    onClick={() => patchRule(r.kind, { enabled: !r.enabled })}
                    className={`relative h-6 w-11 rounded-full transition ${
                      r.enabled ? "bg-teal-500" : "bg-[#d5dfe9]"
                    } ${canManage ? "" : "opacity-50"}`}
                    aria-pressed={r.enabled}
                    aria-label={`Toggle ${r.label}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                        r.enabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {r.threshold !== null ? (
                  <label className="block">
                    <span className="label !mb-1 !text-[0.68rem]">
                      {r.kind.includes("missing") || r.kind.includes("sensor")
                        ? "After (minutes)"
                        : `Threshold (${unit})`}
                    </span>
                    <input
                      type="number"
                      defaultValue={r.threshold}
                      disabled={!canManage}
                      onBlur={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v !== r.threshold) patchRule(r.kind, { threshold: v });
                      }}
                      className="field !py-1.5 !text-[0.82rem]"
                    />
                  </label>
                ) : null}
                <label className="block">
                  <span className="label !mb-1 !text-[0.68rem]">Escalate after (min)</span>
                  <input
                    type="number"
                    defaultValue={r.escalate_after_minutes}
                    disabled={!canManage}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v !== r.escalate_after_minutes)
                        patchRule(r.kind, { escalate_after_minutes: v });
                    }}
                    className="field !py-1.5 !text-[0.82rem]"
                  />
                </label>
                <div className="sm:col-span-2">
                  <span className="label !mb-1 !text-[0.68rem]">Channels</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map((c) => {
                      const on = r.channels.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          disabled={!canManage}
                          onClick={() =>
                            patchRule(r.kind, {
                              channels: on ? r.channels.filter((x: string) => x !== c) : [...r.channels, c],
                            })
                          }
                          className={`rounded-full border px-2.5 py-1 text-[0.68rem] font-bold transition ${
                            on
                              ? "border-brand-200 bg-brand-50 text-brand-700"
                              : "border-line bg-white text-muted hover:border-brand-200"
                          } ${canManage ? "" : "opacity-60"}`}
                          aria-pressed={on}
                        >
                          {CHANNEL_LABEL[c]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* history */}
      <section className="card overflow-hidden">
        <div className="border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconClock size={16} className="text-navy-600" /> Alert history
          </h2>
        </div>
        {history.length ? (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[620px]">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Reading</th>
                  <th>Triggered</th>
                  <th>Acknowledged</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a: any) => (
                  <tr key={a.id}>
                    <td className="font-semibold capitalize text-navy-900">{a.kind.replace(/-/g, " ")}</td>
                    <td className="tabular font-bold">{a.value ? `${a.value} ${a.unit ?? unit}` : "—"}</td>
                    <td className="whitespace-nowrap text-[0.78rem] text-muted">{stampTime(a.triggeredAt)}</td>
                    <td className="whitespace-nowrap text-[0.78rem] text-muted">
                      {a.acknowledgedAt ? relativeTime(a.acknowledgedAt) : "—"}
                    </td>
                    <td>
                      <span className={`pill text-[0.6rem] ${a.status === "acknowledged" ? "pill-ok" : "pill-muted"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <IconBell size={20} className="mx-auto text-muted" />
            <p className="mt-2 text-[0.84rem] font-semibold text-muted">No historical alerts yet.</p>
          </div>
        )}
      </section>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
        <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
        <p className="text-[0.74rem] leading-relaxed text-muted">
          Alerts are best-effort notifications. They cannot replace a clinician&apos;s judgement, and delivery may
          be delayed by network, device or platform restrictions. Escalation notifies the next recipient if the
          first does not acknowledge within the configured window.
        </p>
      </div>
    </div>
  );
}

function describeRule(r: any, unit: string): string {
  switch (r.kind) {
    case "very-low":
      return `Fires immediately below ${r.threshold} ${unit}. Treat as urgent.`;
    case "low":
      return `Fires when a reading is below ${r.threshold} ${unit}.`;
    case "high":
      return `Fires when readings stay above ${r.threshold} ${unit}.`;
    case "very-high":
      return `Fires above ${r.threshold} ${unit}.`;
    case "rapid-change":
      return "Fires when glucose moves unusually quickly in either direction.";
    case "missing-readings":
      return `Fires when no new reading arrives within ${r.threshold} minutes.`;
    case "sensor-disconnect":
      return `Fires when sync appears interrupted for more than ${r.threshold} minutes.`;
    case "emergency":
      return "Patient-triggered request for immediate family attention.";
    default:
      return "Custom rule.";
  }
}
