"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardCtx } from "./DashboardProvider";
import { ChartTabs, DayChart, TirBar, WeekChart } from "./GlucoseChart";
import { StatusPill, TrendArrow } from "./GlucoseBadges";
import {
  IconAlert,
  IconArrow,
  IconBattery,
  IconBell,
  IconCheck,
  IconClock,
  IconDrop,
  IconFamily,
  IconInfo,
  IconLock,
  IconPin,
  IconRefresh,
  IconSensor,
  IconTelegram,
  IconVolume,
} from "@/components/ui/Icons";
import { relativeTime, stampTime } from "@/lib/glucose";

interface Payload {
  patient: any;
  canManage: boolean;
  latest: any;
  stats: any;
  charts: any;
  sync: any;
  family: any[];
  telegram: any;
  alerts: any;
  rules: any[];
  plan: any;
}

export function DashboardView() {
  const { activeId, active, globalUnit, setGlobalUnit, soundOn, setSoundOn } = useDashboardCtx();
  const [data, setData] = useState<Payload | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"day" | "week">("day");
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!activeId) {
      // No patient on this account yet — stop the spinner and let the empty
      // state render instead of a skeleton that never resolves.
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/dashboard?patientId=${activeId}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not load the dashboard.");
        setLoading(false);
        return;
      }
      setData(json.data);
      setMeta(json.meta);
      setError(null);
    } catch {
      setError("Network problem — retrying shortly.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function syncNow() {
    if (!activeId) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ patientId: activeId }),
      });
      const json = await res.json();
      setToast(
        json.ok
          ? `Sync complete — ${json.ingested ?? 0} new reading${json.ingested === 1 ? "" : "s"}.`
          : json.error ?? "Sync failed.",
      );
      await load();
    } catch {
      setToast("Sync failed — check the connection.");
    } finally {
      setSyncing(false);
      window.setTimeout(() => setToast(null), 4500);
    }
  }

  async function acknowledge(id: number) {
    await fetch("/api/alerts/acknowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alertId: id }),
    });
    await load();
  }

  if (!activeId && !loading) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-teal-500" />
          <div className="p-7 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <IconSensor size={26} />
            </span>
            <h1 className="mt-4 text-[1.35rem] font-extrabold tracking-tight text-navy-900">
              No patient record yet
            </h1>
            <p className="mx-auto mt-2 max-w-md text-[0.88rem] leading-relaxed text-muted">
              This workspace is empty by design. Create a patient record, then connect an authorised
              FreeStyle Libre source — readings and alerts appear the moment real data arrives.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link href="/admin" className="btn btn-primary">
                Create a patient record <IconArrow size={15} />
              </Link>
              <Link href="/dashboard/connection" className="btn btn-ghost">
                Connection settings
              </Link>
            </div>
            <p className="mt-5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
              Nothing on this platform is simulated
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return <DashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="card p-8 text-center">
        <IconInfo size={26} className="mx-auto text-brand-500" />
        <p className="mt-3 text-[0.95rem] font-bold text-navy-900">{error}</p>
        <button onClick={load} className="btn btn-primary btn-sm mt-4">
          <IconRefresh size={14} /> Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const unit = globalUnit;
  const showMmol = unit === "mmol/L";
  // A zero here means "no readings" (or a 0% share), never a real 0 mg/dL.
  const convertValue = (v: number | null | undefined) =>
    v === null || v === undefined || Number.isNaN(Number(v)) || Number(v) <= 0
      ? null
      : showMmol
        ? Math.round((v / 18.0182) * 10) / 10
        : Math.round(v);

  const latest = data.latest;
  const openAlerts = data.alerts.open;
  const plan = data.plan;
  const recipientPct =
    plan.recipientLimit && plan.recipientLimit > 0
      ? Math.min(100, Math.round((plan.members / plan.recipientLimit) * 100))
      : 0;
  const smsPct = plan.smsAllowance ? Math.min(100, Math.round((plan.smsUsed / plan.smsAllowance) * 100)) : 0;

  const dayData = showMmol
    ? data.charts.day.map((p: any) => ({ t: p.t, value: convertValue(p.value) }))
    : data.charts.day;
  const weekData = showMmol
    ? data.charts.week.map((p: any) => ({
        ...p,
        avg: convertValue(p.avg),
        min: convertValue(p.min),
        max: convertValue(p.max),
      }))
    : data.charts.week;

  const lowLine = showMmol ? Math.round((data.patient.thresholds.low / 18.0182) * 10) / 10 : data.patient.thresholds.low;
  const highLine = showMmol ? Math.round((data.patient.thresholds.high / 18.0182) * 10) / 10 : data.patient.thresholds.high;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      {/* no source connected — the honest empty state */}
      {!data.latest && meta?.demoData !== true ? (
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <div className="h-1 w-full bg-gradient-to-r from-brand-500 to-teal-500" />
          <div className="flex flex-wrap items-center gap-4 p-4">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-brand-50 text-brand-600">
              <IconInfo size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.92rem] font-extrabold text-navy-900">No glucose source connected yet</p>
              <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted">
                Readings, alerts and reports stay empty until this record is linked to an authorised FreeStyle
                Libre source. Nothing is simulated.
              </p>
            </div>
            <Link href="/dashboard/connection" className="btn btn-sm btn-primary">
              Connect a source <IconArrow size={14} />
            </Link>
          </div>
        </div>
      ) : null}

      {meta?.demoData ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#f0d3ac] bg-high-soft/50 px-3.5 py-2">
          <IconInfo size={14} className="text-high" />
          <p className="text-[0.76rem] font-semibold text-[#8a5a11]">
            Evaluation data — this record is using the simulator, not a real sensor.
          </p>
          <Link href="/dashboard/connection" className="ml-auto text-[0.74rem] font-bold text-brand-700 hover:underline">
            Connection settings
          </Link>
        </div>
      ) : null}

      {/* open alert banner */}
      {openAlerts.length ? (
        <div className="overflow-hidden rounded-2xl border border-[#f3c4c1] bg-white">
          <div className="h-1 w-full bg-gradient-to-r from-[#b3261e] to-[#e06a5b]" />
          <div className="flex flex-wrap items-center gap-3 p-4">
            <span className="relative grid h-10 w-10 flex-none place-items-center rounded-xl bg-low-soft text-low">
              <IconAlert size={19} />
              <span className="absolute inset-0 rounded-xl border border-low/40 [animation:pulse-ring_2s_infinite]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.1em] text-low">
                {openAlerts[0].level === "critical" ? "Critical alert" : "Alert"} · needs acknowledgement
              </p>
              <p className="text-[0.88rem] font-bold leading-snug text-navy-900">{openAlerts[0].message}</p>
              <p className="text-[0.7rem] font-semibold text-muted">
                {stampTime(openAlerts[0].triggeredAt, data.patient.timezone)} ·{" "}
                {relativeTime(openAlerts[0].triggeredAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => acknowledge(openAlerts[0].id)} className="btn btn-sm btn-primary">
                <IconCheck size={13} /> Acknowledge
              </button>
              <Link href="/dashboard/alerts" className="btn btn-sm btn-ghost">
                Details
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[1.62fr_1fr]">
        {/* ------------------------------ hero card ----------------------------- */}
        <section className="card-lg relative overflow-hidden border border-line bg-white p-5 md:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-brand-100/60 to-teal-100/50 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-md">
                <IconDrop size={21} />
              </span>
              <div>
                <h1 className="text-[1.12rem] font-extrabold leading-tight text-navy-900 md:text-[1.25rem]">
                  {data.patient.name}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.72rem] font-semibold text-muted">
                  <span className="inline-flex items-center gap-1">
                    <span
                      className={`dot ${
                        data.sync.connected ? "dot-live" : data.sync.failures > 0 ? "dot-critical" : "dot-warn"
                      }`}
                    />
                    {data.sync.connected
                      ? "Syncing normally"
                      : !data.sync.configured
                        ? "No source connected"
                        : data.sync.failures > 0
                          ? "Sync failing — retrying"
                          : "Waiting for first sync"}
                  </span>
                  {data.sync.configured ? <>· <span>{data.patient.providerLabel}</span></> : null}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-full border border-line bg-white p-0.5">
                {(["mg/dL", "mmol/L"] as const).map((u) => (
                  <button
                    key={u}
                    onClick={() => setGlobalUnit(u)}
                    className={`rounded-full px-2.5 py-1 text-[0.7rem] font-bold transition ${
                      unit === u ? "bg-navy-800 text-white" : "text-muted hover:text-navy-800"
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
              <button onClick={syncNow} disabled={syncing} className="btn btn-sm btn-ghost">
                <IconRefresh size={14} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Syncing…" : "Sync now"}
              </button>
            </div>
          </div>

          <div className="relative mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <div>
              <div className="flex items-end gap-2">
                <span
                  className="tabular text-[4rem] font-extrabold leading-[0.9] tracking-tight md:text-[4.6rem]"
                  style={{ color: latest ? levelColor(latest.level) : "#8fa3b8" }}
                >
                  {latest ? convertValue(latest.value) : "—"}
                </span>
                <span className="pb-2 text-[0.8rem] font-bold text-muted">{unit}</span>
              </div>
              {latest ? (
                <p className="mt-1 flex items-center gap-2">
                  <StatusPill level={latest.level} label={latest.levelLabel} />
                  <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[0.7rem] font-bold text-navy-700">
                    <TrendArrow trend={latest.trend} size={13} /> {latest.trendLabel}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[0.8rem] font-semibold text-muted">No readings yet</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              <MiniStat
                icon={<IconClock size={14} />}
                label="Last reading"
                value={latest ? relativeTime(latest.takenAt) : "—"}
                hint={latest ? stampTime(latest.takenAt, data.patient.timezone) : "awaiting data"}
              />
              <MiniStat
                icon={<IconSensor size={14} />}
                label="Data freshness"
                value={latest ? latest.freshnessLabel : "No data"}
                hint={latest ? latest.freshnessDetail : "check the sensor"}
                tone={latest ? (latest.isCurrent ? "ok" : "warn") : "muted"}
              />
              <MiniStat
                icon={<IconBattery size={14} />}
                label="Sensor"
                value={
                  data.patient.sensor.daysLeft !== null
                    ? `${data.patient.sensor.daysLeft} days left`
                    : data.patient.sensor.serial ?? "—"
                }
                hint={
                  data.patient.sensor.battery
                    ? `Battery ${data.patient.sensor.battery}%`
                    : data.patient.sensor.serial ?? "wear period unknown"
                }
              />
              <MiniStat
                icon={<IconVolume size={14} />}
                label="Audible alerts"
                value={soundOn ? "On" : "Muted"}
                hint="ring on critical readings"
                tone={soundOn ? "ok" : "muted"}
                action={
                  <button
                    onClick={() => setSoundOn(!soundOn)}
                    className="text-[0.68rem] font-bold text-brand-700 hover:underline"
                  >
                    {soundOn ? "Mute" : "Enable"}
                  </button>
                }
              />
            </div>
          </div>

          {/* chart */}
          <div className="relative mt-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[0.78rem] font-bold text-navy-900">
                {tab === "day" ? "Last 24 hours" : "Last 7 days"}
                <span className="ml-2 text-[0.68rem] font-semibold text-muted">
                  target {showMmol ? `${lowLine}–${highLine} mmol/L` : `${lowLine}–${highLine} mg/dL`}
                </span>
              </p>
              <ChartTabs tab={tab} setTab={setTab} />
            </div>
            {tab === "day" ? (
              <DayChart data={dayData} unit={unit} low={lowLine} high={highLine} height={250} />
            ) : (
              <WeekChart data={weekData} unit={unit} low={lowLine} high={highLine} height={250} />
            )}
          </div>

          <div className="relative mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
            <FooterStat
              label="Today's average"
              value={`${convertValue(data.stats.today.avg) ?? "—"}`}
              unit={convertValue(data.stats.today.avg) ? unit : undefined}
              hint={data.stats.today.count === 0 ? "no readings today" : undefined}
            />
            <FooterStat
              label="Time in range (90d)"
              value={data.stats.ninety.count > 0 ? `${data.stats.ninety.tir}%` : "—"}
              tone={data.stats.ninety.count > 0 ? (data.stats.ninety.tir >= 70 ? "ok" : "warn") : undefined}
              hint={data.stats.ninety.count === 0 ? "needs readings" : undefined}
            />
            <FooterStat
              label="Est. GMI (90d)"
              value={data.stats.ninety.count > 0 ? `${data.stats.ninety.gmi}%` : "—"}
              hint={data.stats.ninety.count === 0 ? "needs readings" : "not a lab HbA1c"}
            />
          </div>
        </section>

        {/* ------------------------------ right rail ---------------------------- */}
        <div className="space-y-4">
          {/* family notification status */}
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[0.86rem] font-extrabold text-navy-900">
                <IconFamily size={16} className="text-brand-600" /> Family notifications
              </h2>
              <Link href="/dashboard/family" className="text-[0.7rem] font-bold text-brand-700 hover:underline">
                Manage
              </Link>
            </div>
            <ul className="mt-3 space-y-2">
              {data.family.length ? (
                data.family.slice(0, 4).map((m: any) => (
                  <li key={m.id} className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-mist text-[0.62rem] font-extrabold text-navy-800">
                      {m.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[0.78rem] font-bold text-navy-900">{m.name}</p>
                      <p className="truncate text-[0.64rem] font-semibold text-muted">{m.relation}</p>
                    </div>
                    <div className="flex flex-none items-center gap-1">
                      {m.push ? <ChannelDot label="Push" tone="on" /> : null}
                      {m.sms ? <ChannelDot label="SMS" tone="on" /> : null}
                      <ChannelDot
                        label="TG"
                        tone={m.telegram === "active" ? "on" : m.telegram === "preview" ? "preview" : "off"}
                      />
                    </div>
                  </li>
                ))
              ) : (
                <li className="rounded-lg bg-mist/60 p-2.5 text-[0.76rem] text-muted">
                  No family recipients yet. Invite someone from the family page.
                </li>
              )}
            </ul>
            <div className="mt-3 flex items-center justify-between rounded-lg bg-mist/60 px-2.5 py-2">
              <span className="text-[0.68rem] font-bold text-navy-800">
                Plan seats {plan.members}/{plan.recipientLimit ?? "—"}
              </span>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500" style={{ width: `${recipientPct}%` }} />
              </div>
            </div>
          </section>

          {/* telegram card */}
          <section className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-line bg-gradient-to-r from-[#eef7ff] to-[#eefaf5] px-4 py-2.5">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500 text-white">
                <IconTelegram size={14} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.82rem] font-extrabold text-navy-900">Telegram Bot</p>
                <p className="text-[0.62rem] font-semibold text-muted">
                  {data.telegram.configured
                    ? `${data.telegram.configuredRecipients} linked chat${data.telegram.configuredRecipients === 1 ? "" : "s"}`
                    : "Preview mode — bot token not set"}
                </p>
              </div>
              <span className={`pill ${data.telegram.configured ? "pill-ok" : "pill-muted"} text-[0.6rem]`}>
                {data.telegram.configured ? "Connected" : "Preview"}
              </span>
            </div>
            <div className="p-4">
              <ul className="space-y-1.5">
                {data.telegram.linkedRecipients.length ? (
                  data.telegram.linkedRecipients.slice(0, 3).map((r: any) => (
                    <li key={r.id} className="flex items-center justify-between text-[0.76rem]">
                      <span className="truncate font-semibold text-navy-900">{r.name}</span>
                      <span
                        className={`pill text-[0.56rem] ${
                          r.status === "active" ? "pill-ok" : r.status === "preview" ? "pill-muted" : "pill-high"
                        }`}
                      >
                        {r.status === "preview" ? "preview" : r.status}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="text-[0.76rem] text-muted">No Telegram recipients linked yet.</li>
                )}
              </ul>
              <div className="mt-3 flex gap-2">
                <Link href="/dashboard/telegram" className="btn btn-sm btn-primary flex-1">
                  <IconTelegram size={13} /> {data.telegram.configuredRecipients ? "Manage bot" : "Connect Telegram"}
                </Link>
              </div>
            </div>
          </section>

          {/* SMS allowance */}
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[0.86rem] font-extrabold text-navy-900">SMS allowance</h2>
              <span className="text-[0.68rem] font-bold text-muted">
                {plan.smsUsed}/{plan.smsAllowance || "—"}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-mist">
              <div
                className={`h-full rounded-full ${
                  smsPct > 85 ? "bg-gradient-to-r from-high to-[#e8b25c]" : "bg-gradient-to-r from-teal-500 to-brand-500"
                }`}
                style={{ width: `${smsPct}%` }}
              />
            </div>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-muted">
              {plan.name ? `${plan.name} plan · ` : ""}
              SMS is used only when an alert rule includes the SMS channel.
            </p>
          </section>

          {/* location */}
          <section className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-[0.86rem] font-extrabold text-navy-900">
                <IconPin size={15} className="text-teal-600" /> Location sharing
              </h2>
              <span className={`pill text-[0.58rem] ${data.patient.location.shared ? "pill-ok" : "pill-muted"}`}>
                {data.patient.location.shared ? "Shared" : "Off"}
              </span>
            </div>
            {data.patient.location.shared && data.patient.location.lat ? (
              <div className="mt-2">
                <p className="text-[0.76rem] font-semibold text-navy-900">
                  {data.patient.location.label ?? "Shared location"}
                </p>
                <p className="text-[0.66rem] text-muted">
                  Updated{" "}
                  {data.patient.location.updatedAt ? relativeTime(data.patient.location.updatedAt) : "recently"}
                </p>
                <a
                  href={`https://maps.google.com/?q=${data.patient.location.lat},${data.patient.location.lon}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm btn-ghost mt-2 w-full"
                >
                  Open in maps <IconArrow size={13} />
                </a>
              </div>
            ) : (
              <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted">
                Location stays private until the patient explicitly shares it.
                {data.canManage ? (
                  <Link href="/dashboard/location" className="ml-1 font-bold text-brand-700 hover:underline">
                    Manage
                  </Link>
                ) : null}
              </p>
            )}
          </section>
        </div>
      </div>

      {/* -------------------------- analytics row -------------------------- */}
      <div className="grid gap-4 md:grid-cols-3">
        <section className="card p-4 md:p-5">
          <h2 className="text-[0.88rem] font-extrabold text-navy-900">Time in range</h2>
          <p className="text-[0.68rem] font-semibold text-muted">Last 90 days · {data.stats.ninety.count} readings</p>
          <div className="mt-3">
            {data.charts.tir.length ? (
              <TirBar segments={data.charts.tir} />
            ) : (
              <p className="text-[0.78rem] text-muted">Not enough data yet.</p>
            )}
          </div>
        </section>

        <section className="card p-4 md:p-5">
          <h2 className="text-[0.88rem] font-extrabold text-navy-900">Averages</h2>
          <p className="text-[0.68rem] font-semibold text-muted">All values converted to {unit}</p>
          <dl className="mt-3 space-y-2">
            {[
              ["Today", data.stats.today.avg, data.stats.today.count],
              ["7 days", data.stats.week.average, data.stats.week.count],
              ["30 days", data.stats.month.average, data.stats.month.count],
              ["90 days", data.stats.ninety.average, data.stats.ninety.count],
            ].map(([label, avg, count]) => (
              <div key={String(label)} className="flex items-center justify-between border-b border-line/70 pb-1.5 last:border-0">
                <dt className="text-[0.78rem] font-semibold text-muted">{label}</dt>
                <dd className="text-right">
                  <span className="tabular text-[0.92rem] font-extrabold text-navy-900">
                    {convertValue(Number(avg)) ?? "—"}
                  </span>
                  {Number(count) > 0 ? (
                    <span className="ml-1 text-[0.66rem] font-semibold text-muted">{unit}</span>
                  ) : null}
                  <span className="ml-2 text-[0.64rem] text-muted">({count})</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card p-4 md:p-5">
          <h2 className="text-[0.88rem] font-extrabold text-navy-900">Quality indicators</h2>
          <p className="text-[0.68rem] font-semibold text-muted">Computed from stored readings only</p>
          <dl className="mt-3 space-y-2">
            {[
              [
                "Variability (CV)",
                data.stats.ninety.count > 0 ? `${data.stats.ninety.cv}%` : "—",
                data.stats.ninety.count === 0
                  ? "needs readings"
                  : data.stats.ninety.cv <= 36
                    ? "Target ≤ 36%"
                    : "Above target",
              ],
              ["Low events (90d)", `${data.stats.ninety.lows}`, "readings below low"],
              ["High events (90d)", `${data.stats.ninety.highs}`, "readings above high"],
              ["Readings stored", `${data.stats.readings}`, "total in your account"],
            ].map(([label, value, hint]) => (
              <div key={label} className="flex items-center justify-between border-b border-line/70 pb-1.5 last:border-0">
                <dt className="text-[0.78rem] font-semibold text-muted">{label}</dt>
                <dd className="text-right">
                  <span className="tabular text-[0.88rem] font-extrabold text-navy-900">{value}</span>
                  <span className="ml-1.5 text-[0.62rem] text-muted">{hint}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* ------------------------- recent alerts ------------------------- */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.88rem] font-extrabold text-navy-900">
            <IconBell size={16} className="text-brand-600" /> Recent alerts
          </h2>
          <Link href="/dashboard/alerts" className="text-[0.72rem] font-bold text-brand-700 hover:underline">
            All alerts & rules
          </Link>
        </div>
        {data.alerts.recent.length ? (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[640px]">
              <thead>
                <tr>
                  <th>Alert</th>
                  <th>Reading</th>
                  <th>Status</th>
                  <th>Triggered</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.alerts.recent.slice(0, 6).map((a: any) => (
                  <tr key={a.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 flex-none rounded-full ${
                            a.level === "critical" ? "bg-low" : a.level === "warning" ? "bg-high" : "bg-brand-400"
                          }`}
                        />
                        <span className="font-semibold capitalize text-navy-900">{a.kind.replace(/-/g, " ")}</span>
                      </div>
                    </td>
                    <td className="tabular font-bold text-navy-900">
                      {a.value ? `${convertValue(a.value)} ${unit}` : "—"}
                    </td>
                    <td>
                      <span
                        className={`pill text-[0.62rem] ${
                          a.status === "open"
                            ? "pill-low"
                            : a.status === "escalated"
                              ? "pill-critical"
                              : a.status === "acknowledged"
                                ? "pill-ok"
                                : "pill-muted"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[0.78rem] text-muted">
                      {relativeTime(a.triggeredAt)}
                    </td>
                    <td className="text-right">
                      {a.status === "open" || a.status === "escalated" ? (
                        <button onClick={() => acknowledge(a.id)} className="btn btn-sm btn-primary !px-2.5 !py-1">
                          <IconCheck size={12} /> Ack
                        </button>
                      ) : (
                        <span className="text-[0.7rem] font-semibold text-muted">
                          {a.acknowledgedAt ? `Acked ${relativeTime(a.acknowledgedAt)}` : "Resolved"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-teal-50 text-teal-600">
              <IconCheck size={18} />
            </span>
            <p className="mt-2 text-[0.86rem] font-bold text-navy-900">No alerts recorded</p>
            <p className="text-[0.76rem] text-muted">Glucose has stayed within your configured thresholds.</p>
          </div>
        )}
      </section>

      <PrivacyNote />
    </div>
  );
}

function levelColor(level: string) {
  switch (level) {
    case "critical":
    case "very-low":
      return "#b3261e";
    case "low":
      return "#d64545";
    case "high":
      return "#d98324";
    case "very-high":
      return "#b55d0c";
    default:
      return "#0f9d76";
  }
}

function MiniStat({
  icon,
  label,
  value,
  hint,
  tone = "muted",
  action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "ok" | "warn" | "muted";
  action?: React.ReactNode;
}) {
  const toneClass =
    tone === "ok" ? "text-teal-700" : tone === "warn" ? "text-high" : "text-navy-800";
  return (
    <div className="rounded-xl border border-line bg-[#fbfdff] px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted">
        {icon}
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.08em]">{label}</span>
        {action ? <span className="ml-auto">{action}</span> : null}
      </div>
      <p className={`mt-0.5 truncate text-[0.84rem] font-extrabold ${toneClass}`}>{value}</p>
      {hint ? <p className="truncate text-[0.62rem] font-medium text-muted">{hint}</p> : null}
    </div>
  );
}

function FooterStat({
  label,
  value,
  unit,
  tone,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "ok" | "warn";
  hint?: string;
}) {
  return (
    <div>
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">{label}</p>
      <p
        className={`tabular text-[1rem] font-extrabold ${
          tone === "ok" ? "text-teal-700" : tone === "warn" ? "text-high" : "text-navy-900"
        }`}
      >
        {value}
        {unit ? <span className="ml-1 text-[0.64rem] font-semibold text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="text-[0.6rem] text-muted">{hint}</p> : null}
    </div>
  );
}

function ChannelDot({ label, tone }: { label: string; tone: "on" | "off" | "preview" }) {
  const cls =
    tone === "on"
      ? "bg-teal-50 text-teal-700 ring-teal-100"
      : tone === "preview"
        ? "bg-[#f1f5f9] text-[#7b8fa3] ring-line"
        : "bg-white text-[#c3cfdb] ring-line";
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-[0.55rem] font-extrabold ring-1 ${cls}`} title={label}>
      {label}
    </span>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
      <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg bg-mist text-navy-700">
        <IconLock size={14} />
      </span>
      <p className="text-[0.72rem] leading-relaxed text-muted">
        Glucose data is visible only to you and the people you authorize. Clinical access is limited to assigned
        staff. Alerts support — but do not replace — professional medical care or emergency services, and delivery
        can be affected by network, sensor or device interruptions.
      </p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1.62fr_1fr]">
        <div className="card-lg h-[520px] p-6">
          <div className="skeleton h-5 w-40 rounded-md" />
          <div className="skeleton mt-4 h-16 w-32 rounded-lg" />
          <div className="skeleton mt-6 h-[240px] w-full rounded-xl" />
        </div>
        <div className="space-y-4">
          <div className="card h-40 p-4">
            <div className="skeleton h-4 w-32 rounded-md" />
            <div className="skeleton mt-3 h-3 w-full rounded-md" />
            <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
          </div>
          <div className="card h-32 p-4">
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton mt-3 h-3 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { useMemo };
