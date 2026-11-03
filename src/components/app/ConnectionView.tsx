"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import {
  IconAlert,
  IconArrow,
  IconCheck,
  IconInfo,
  IconLink,
  IconLock,
  IconRefresh,
  IconShield,
  IconX,
} from "@/components/ui/Icons";

type ProviderKey = "libreview" | "linkup" | "bridge" | "demo";

interface Registry {
  key: ProviderKey;
  label: string;
  description: string;
  enabled: boolean;
  requiresCredentials: boolean;
}

/**
 * Connection settings.
 *
 * This is where a patient (or their clinician) attaches the glucose source that
 * feeds the dashboard. Nothing is simulated: if no provider is connected the
 * dashboard shows an empty state, not invented numbers.
 */
export function ConnectionView() {
  const { activeId, active } = useDashboardCtx();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ provider: "" as ProviderKey | "", patientRef: "", region: "eu" });

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 6000);
  };

  const load = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/connection?patientId=${activeId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function connect(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !form.provider) return;
    setBusy(true);
    const res = await fetch("/api/connection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        patientId: activeId,
        provider: form.provider,
        patientRef: form.patientRef || null,
        region: form.region,
      }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      notify(
        json.mode === "demo"
          ? "Evaluation stream enabled on this record."
          : "Connection saved. Readings will appear after the first successful sync.",
      );
      setForm({ provider: "", patientRef: "", region: "eu" });
      await load();
    } else {
      notify(json.error ?? "Could not save the connection.");
    }
  }

  async function disconnect() {
    if (!activeId) return;
    if (!window.confirm("Disconnect this glucose source? Existing history is kept but no new readings will arrive.")) return;
    setBusy(true);
    const res = await fetch(`/api/connection?patientId=${activeId}`, { method: "DELETE" });
    const json = await res.json();
    setBusy(false);
    notify(json.ok ? "Disconnected." : json.error ?? "Could not disconnect.");
    await load();
  }

  if (!data) return <div className="skeleton h-72 w-full rounded-2xl" />;

  const connected = data.provider && data.provider !== "none";
  const registry: Registry[] = data.providers ?? [];
  const selected = registry.find((p) => p.key === form.provider) ?? null;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="pointer-events-none fixed inset-x-4 bottom-5 z-[60] mx-auto max-w-md rounded-xl bg-navy-900 px-4 py-2.5 text-center text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Connection settings</h1>
          <p className="text-[0.82rem] text-muted">
            Where {active?.name ?? "this patient"}&apos;s glucose readings come from.
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-ghost">
          <IconRefresh size={14} />
        </button>
      </header>

      {/* current state */}
      <section className="card-lg overflow-hidden">
        <div className={`flex flex-wrap items-center gap-3 px-5 py-4 ${connected ? "bg-teal-50" : "bg-[#fbfdff]"}`}>
          <span
            className={`grid h-11 w-11 place-items-center rounded-2xl ${
              connected ? "bg-teal-500 text-white" : "bg-white text-navy-600 ring-1 ring-line"
            }`}
          >
            {connected ? <IconCheck size={20} /> : <IconLink size={20} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-extrabold text-navy-900">
              {connected ? data.providerLabel : "No glucose source connected"}
            </p>
            <p className="text-[0.74rem] font-semibold text-muted">
              {connected
                ? data.patientRef
                  ? `Patient reference ${data.patientRef}${data.region ? ` · region ${data.region.toUpperCase()}` : ""}`
                  : "Awaiting the first successful sync"
                : "The dashboard is empty until a source is connected — nothing is simulated"}
            </p>
          </div>
          {connected ? (
            <button onClick={disconnect} disabled={busy} className="btn btn-sm btn-ghost !text-low">
              <IconX size={14} /> Disconnect
            </button>
          ) : null}
        </div>

        <dl className="grid gap-4 border-t border-line p-5 sm:grid-cols-3">
          <div>
            <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Last successful sync</dt>
            <dd className="mt-0.5 text-[0.84rem] font-bold text-navy-900">
              {data.sync?.lastSuccessAt ? new Date(data.sync.lastSuccessAt).toLocaleString("en-GB") : "Never"}
            </dd>
          </div>
          <div>
            <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Readings stored</dt>
            <dd className="mt-0.5 tabular text-[0.84rem] font-bold text-navy-900">{data.readingCount}</dd>
          </div>
          <div>
            <dt className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Last error</dt>
            <dd className="mt-0.5 truncate text-[0.8rem] font-semibold text-muted">
              {data.sync?.lastError ?? "None"}
            </dd>
          </div>
        </dl>
      </section>

      {/* provider choice */}
      <section className="card-lg p-5">
        <h2 className="text-[0.95rem] font-extrabold text-navy-900">Choose a glucose source</h2>
        <p className="text-[0.78rem] text-muted">
          Only connections authorised by the patient are permitted. Credentials are encrypted at rest and never
          shown again after saving.
        </p>

        <div className="mt-4 grid gap-2.5">
          {registry.map((p) => {
            const disabled = !p.enabled;
            return (
              <button
                key={p.key}
                type="button"
                disabled={disabled}
                onClick={() => setForm({ ...form, provider: p.key })}
                className={`flex items-start gap-3 rounded-xl border-2 p-3.5 text-left transition ${
                  form.provider === p.key ? "border-brand-500 bg-brand-50/50" : "border-line bg-white"
                } ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand-200"}`}
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border-2 ${
                    form.provider === p.key ? "border-brand-500 bg-brand-500 text-white" : "border-[#d3dfeb]"
                  }`}
                >
                  {form.provider === p.key ? <IconCheck size={13} /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[0.86rem] font-bold text-navy-900">{p.label}</span>
                    {disabled ? (
                      <span className="pill pill-muted text-[0.54rem]">not configured</span>
                    ) : null}
                    {p.key === "demo" ? (
                      <span className="pill pill-high text-[0.54rem]">evaluation only</span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[0.74rem] leading-relaxed text-muted">{p.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        {selected ? (
          <form onSubmit={connect} className="mt-4 rounded-xl border border-line bg-[#fbfdff] p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="label">
                  {selected.key === "bridge" ? "Device bridge key" : "Patient reference at the provider"}
                </span>
                <input
                  className="field"
                  value={form.patientRef}
                  onChange={(e) => setForm({ ...form, patientRef: e.target.value })}
                  placeholder={selected.requiresCredentials ? "e.g. 3f9c…" : "optional"}
                />
              </label>
              <label className="block">
                <span className="label">Data region</span>
                <select
                  className="field"
                  value={form.region}
                  onChange={(e) => setForm({ ...form, region: e.target.value })}
                >
                  <option value="eu">Europe (EU)</option>
                  <option value="us">United States (US)</option>
                  <option value="ap">Asia-Pacific (AP)</option>
                  <option value="au">Australia (AU)</option>
                </select>
              </label>
            </div>
            <p className="mt-2.5 flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-muted">
              <IconLock size={13} className="mt-0.5 flex-none text-navy-600" />
              We never ask for, store or transmit a patient&apos;s Libre username or password. Connections use
              provider-issued tokens or a consented share code.
            </p>
            <button type="submit" disabled={busy} className="btn btn-primary btn-sm mt-3">
              {busy ? "Saving…" : "Save connection"}
            </button>
          </form>
        ) : null}
      </section>

      {/* honest status of the integrations */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
          <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
          <div className="text-[0.74rem] leading-relaxed text-muted">
            <p className="font-bold text-navy-800">Why some sources show as not configured</p>
            <p className="mt-1">
              Live LibreView access is granted through Abbott&apos;s partner programme. Until those credentials are
              issued on this deployment, that option stays disabled rather than pretending to work.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
          <IconShield size={15} className="mt-0.5 flex-none text-teal-600" />
          <div className="text-[0.74rem] leading-relaxed text-muted">
            <p className="font-bold text-navy-800">Your data stays yours</p>
            <p className="mt-1">
              Only people you authorise see readings. Disconnecting stops new data immediately and keeps your
              history available for export.
            </p>
          </div>
        </div>
      </div>

      {!connected ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#f0d3ac] bg-high-soft/50 p-4">
          <div className="flex items-start gap-2.5">
            <IconAlert size={15} className="mt-0.5 flex-none text-high" />
            <p className="text-[0.78rem] leading-relaxed text-[#8a5a11]">
              No glucose source is connected, so there are no readings, alerts or reports yet. That is expected —
              the platform will not invent numbers.
            </p>
          </div>
          <Link href="/how-it-works" className="btn btn-sm btn-ghost">
            How data arrives <IconArrow size={13} />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
