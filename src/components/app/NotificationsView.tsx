"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconPhone,
  IconRefresh,
  IconSms,
  IconTelegram,
  IconVolume,
  IconWarning,
} from "@/components/ui/Icons";
import { relativeTime, stampTime } from "@/lib/glucose";

const CHANNEL_ICON: Record<string, any> = {
  push: IconPhone,
  sms: IconSms,
  telegram: IconTelegram,
  audible: IconVolume,
  inapp: IconBell,
};

const FILTERS = ["all", "critical", "alerts", "delivery", "system"] as const;

export function NotificationsView() {
  const { activeId } = useDashboardCtx();
  const [items, setItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [system, setSystem] = useState<any>(null);

  const load = useCallback(async () => {
    if (!activeId) return;
    const [n, a] = await Promise.all([
      fetch(`/api/notifications?patientId=${activeId}`, { cache: "no-store" }).then((r) => r.json()),
      fetch(`/api/alerts?patientId=${activeId}`, { cache: "no-store" }).then((r) => r.json()),
    ]);
    if (n.ok) {
      setItems(n.notifications);
      setSystem(n.system);
    }
    if (a.ok) setAlerts(a.alerts);
    setLoading(false);
  }, [activeId]);

  useEffect(() => {
    load();
    const t = window.setInterval(load, 40_000);
    return () => window.clearInterval(t);
  }, [load]);

  const timeline = useMemo(() => {
    const alertEvents = alerts.map((a: any) => ({
      type: "alert" as const,
      id: `a-${a.id}`,
      alertId: a.id,
      at: a.triggeredAt,
      level: a.level,
      kind: a.kind,
      status: a.status,
      value: a.value,
      message: a.message,
      acknowledgedAt: a.acknowledgedAt,
      unit: a.unit,
    }));
    const deliveries = items.map((n: any) => ({
      type: "delivery" as const,
      id: `n-${n.id}`,
      alertId: n.alertId,
      at: n.createdAt,
      channel: n.channel,
      status: n.status,
      recipient: n.recipient,
      error: n.error,
      patientName: n.patientName,
    }));
    return [...alertEvents, ...deliveries].sort((a, b) => b.at - a.at);
  }, [alerts, items]);

  const filtered = timeline.filter((e) => {
    if (filter === "all") return true;
    if (filter === "critical") return e.type === "alert" && e.level === "critical";
    if (filter === "alerts") return e.type === "alert";
    if (filter === "delivery") return e.type === "delivery";
    return false;
  });

  const counts = {
    alerts: timeline.filter((e) => e.type === "alert").length,
    delivered: items.filter((i: any) => i.status === "sent").length,
    failed: items.filter((i: any) => i.status === "failed").length,
    skipped: items.filter((i: any) => i.status === "skipped").length,
    open: alerts.filter((a: any) => a.status === "open" || a.status === "escalated").length,
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Notification centre</h1>
          <p className="text-[0.82rem] text-muted">
            Every alert, delivery attempt, acknowledgement and connection warning in one timeline.
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-ghost">
          <IconRefresh size={14} /> Refresh
        </button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Open alerts", value: counts.open, tone: counts.open ? "low" : "ok" },
          { label: "Delivered", value: counts.delivered, tone: "ok" },
          { label: "Failed", value: counts.failed, tone: counts.failed ? "high" : "muted" },
          { label: "Skipped", value: counts.skipped, tone: "muted" },
        ].map((s) => (
          <div key={s.label} className="card p-3.5">
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">{s.label}</p>
            <p
              className={`mt-0.5 tabular text-xl font-extrabold ${
                s.tone === "low" ? "text-low" : s.tone === "ok" ? "text-teal-700" : s.tone === "high" ? "text-high" : "text-navy-900"
              }`}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {system ? (
        <div className="grid gap-3 md:grid-cols-3">
          <SystemTile
            label="Push (Web Push)"
            state={system.push ? "configured" : "not configured"}
            ok={system.push}
            hint={system.push ? "VAPID keys present" : "Set VAPID keys to deliver background push"}
          />
          <SystemTile
            label="SMS gateway"
            state={system.sms ? "configured" : "not configured"}
            ok={system.sms}
            hint={system.sms ? "Provider credentials present" : "Set TWILIO_* or SMS_HTTP_*"}
          />
          <SystemTile
            label="Telegram bot"
            state={system.telegram ? "configured" : "preview"}
            ok={system.telegram}
            hint={system.telegram ? "Bot token present" : "Set TELEGRAM_BOT_TOKEN"}
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-bold capitalize transition ${
              filter === f
                ? "border-navy-800 bg-navy-800 text-white"
                : "border-line bg-white text-navy-800 hover:border-brand-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
          </div>
        ) : filtered.length ? (
          <ul className="divide-y divide-line">
            {filtered.slice(0, 60).map((e) => (
              <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                {e.type === "alert" ? (
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                      e.level === "critical" ? "bg-low-soft text-low" : e.level === "warning" ? "bg-high-soft text-high" : "bg-brand-50 text-brand-600"
                    }`}
                  >
                    <IconAlert size={15} />
                  </span>
                ) : (
                  <span
                    className={`grid h-8 w-8 flex-none place-items-center rounded-lg ${
                      e.status === "sent" ? "bg-teal-50 text-teal-600" : e.status === "failed" ? "bg-low-soft text-low" : "bg-mist text-navy-500"
                    }`}
                  >
                    {(CHANNEL_ICON[e.channel] ?? IconBell)({ size: 15 })}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[0.84rem] font-bold text-navy-900">
                    {e.type === "alert" ? (
                      <>
                        <span className="capitalize">{e.kind.replace(/-/g, " ")}</span>
                        {e.value ? ` · ${e.value} ${e.unit}` : ""}
                        <span className="ml-2 rounded bg-mist px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase text-navy-700">
                          {e.status}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="capitalize">{e.channel}</span> delivery
                        <span
                          className={`ml-2 rounded px-1.5 py-0.5 text-[0.58rem] font-extrabold uppercase ${
                            e.status === "sent" ? "bg-teal-50 text-teal-700" : e.status === "failed" ? "bg-low-soft text-low" : "bg-[#f1f5f9] text-[#7b8fa3]"
                          }`}
                        >
                          {e.status}
                        </span>
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[0.76rem] text-muted">
                    {e.type === "alert"
                      ? e.message
                      : e.error
                        ? e.error
                        : `to ${e.recipient ?? "recipient"}${e.patientName ? ` · ${e.patientName}` : ""}`}
                  </p>
                  <p className="mt-0.5 text-[0.66rem] font-semibold text-muted">
                    {stampTime(e.at)} · {relativeTime(e.at)}
                    {e.type === "alert" && e.acknowledgedAt ? ` · acknowledged ${relativeTime(e.acknowledgedAt)}` : ""}
                  </p>
                </div>
                {e.type === "alert" ? (
                  <Link href="/dashboard/alerts" className="btn btn-sm btn-quiet !px-2 !py-1 text-[0.7rem]">
                    View
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-teal-50 text-teal-600">
              <IconCheck size={20} />
            </span>
            <p className="mt-2 text-[0.9rem] font-bold text-navy-900">Nothing to show</p>
            <p className="mx-auto mt-1 max-w-sm text-[0.78rem] leading-relaxed text-muted">
              When an alert fires or a notification is delivered, it appears here with the exact channel and
              delivery result.
            </p>
          </div>
        )}
      </section>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
        <IconWarning size={15} className="mt-0.5 flex-none text-high" />
        <p className="text-[0.74rem] leading-relaxed text-muted">
          A &ldquo;skipped&rdquo; delivery means the channel was requested but is not available on this deployment — for
          example SMS without provider credentials, or Telegram before a bot token is configured. Nothing is ever
          reported as delivered when it was not.
        </p>
      </div>
    </div>
  );
}

function SystemTile({ label, state, ok, hint }: { label: string; state: string; ok: boolean; hint: string }) {
  return (
    <div className="card flex items-start gap-3 p-3.5">
      <span className={`mt-0.5 h-2 w-2 flex-none rounded-full ${ok ? "bg-teal-500" : "bg-[#d5a24a]"}`} />
      <div>
        <p className="text-[0.82rem] font-bold text-navy-900">{label}</p>
        <p className={`text-[0.7rem] font-bold uppercase tracking-wide ${ok ? "text-teal-700" : "text-high"}`}>{state}</p>
        <p className="text-[0.7rem] leading-snug text-muted">{hint}</p>
      </div>
    </div>
  );
}
