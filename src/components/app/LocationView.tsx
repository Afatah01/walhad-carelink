"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import { IconArrow, IconCheck, IconInfo, IconLock, IconPin, IconRefresh, IconShield } from "@/components/ui/Icons";
import { relativeTime, stampTime } from "@/lib/glucose";

export function LocationView() {
  const { activeId, active } = useDashboardCtx();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number; accuracy: number } | null>(null);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/location?patientId=${activeId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function setConsent(enable: boolean) {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch("/api/location", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        patientId: activeId,
        consent: enable,
        lat: enable && coords ? coords.lat : null,
        lon: enable && coords ? coords.lon : null,
        label: enable ? "Shared from patient device" : null,
      }),
    });
    const json = await res.json();
    setBusy(false);
    notify(json.ok ? (enable ? "Location sharing enabled." : "Location sharing turned off.") : json.error ?? "Action failed.");
    await load();
  }

  async function updatePosition() {
    if (!activeId) return;
    if (!navigator.geolocation) {
      notify("This browser does not support location access.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setCoords({ lat: latitude, lon: longitude, accuracy });
        const res = await fetch("/api/location", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            patientId: activeId,
            consent: true,
            lat: latitude,
            lon: longitude,
            label: "Shared from patient device",
          }),
        });
        const json = await res.json();
        setBusy(false);
        notify(json.ok ? "Location updated." : json.error ?? "Could not save location.");
        await load();
      },
      (err) => {
        setBusy(false);
        notify(
          err.code === err.PERMISSION_DENIED
            ? "Location permission was denied in the browser."
            : "Could not read your location.",
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 },
    );
  }

  if (!data) return <div className="skeleton h-72 w-full rounded-2xl" />;

  const { patient, canManage, recipients } = data;
  const shared = Boolean(patient.shared);

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Location sharing</h1>
          <p className="text-[0.82rem] text-muted">
            Off by default. Only people you authorise see a shared location — and only while sharing is on.
          </p>
        </div>
        <button onClick={load} className="btn btn-sm btn-ghost">
          <IconRefresh size={14} />
        </button>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card-lg overflow-hidden">
          <div className={`flex items-center gap-3 px-5 py-4 ${shared ? "bg-teal-50" : "bg-[#f7fafc]"}`}>
            <span
              className={`grid h-11 w-11 place-items-center rounded-2xl ${
                shared ? "bg-teal-500 text-white" : "bg-white text-navy-600 ring-1 ring-line"
              }`}
            >
              <IconPin size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.95rem] font-extrabold text-navy-900">
                {shared ? "Location sharing is on" : "Location sharing is off"}
              </p>
              <p className="text-[0.74rem] font-semibold text-muted">
                {shared
                  ? `Updated ${patient.updatedAt ? relativeTime(patient.updatedAt) : "recently"}`
                  : "No location is stored or shared right now"}
              </p>
            </div>
            {canManage ? (
              <button
                onClick={() => setConsent(!shared)}
                disabled={busy}
                className={`btn btn-sm ${shared ? "btn-ghost" : "btn-primary"}`}
              >
                {shared ? "Turn off" : "Enable"}
              </button>
            ) : (
              <span className="pill pill-muted text-[0.6rem]">Read only</span>
            )}
          </div>

          <div className="p-5">
            {patient.lat && patient.lon ? (
              <div className="overflow-hidden rounded-xl border border-line">
                <div className="relative h-52 w-full bg-gradient-to-br from-[#eef7ff] to-[#eefaf5]">
                  <div className="absolute inset-0 grid-faint opacity-60" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="relative grid h-10 w-10 place-items-center rounded-full bg-brand-500 text-white shadow-lg">
                      <IconPin size={18} />
                      <span className="absolute inset-0 rounded-full border-2 border-brand-400 [animation:pulse-ring_2.4s_infinite]" />
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[0.66rem] font-bold text-navy-800 shadow-sm">
                    {patient.lat.toFixed(4)}, {patient.lon.toFixed(4)}
                  </div>
                  {patient.updatedAt ? (
                    <div className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[0.66rem] font-semibold text-muted shadow-sm">
                      {stampTime(patient.updatedAt)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2">
                  <p className="text-[0.76rem] font-semibold text-navy-800">{patient.label ?? "Shared location"}</p>
                  <a
                    href={`https://maps.google.com/?q=${patient.lat},${patient.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-sm btn-ghost"
                  >
                    Open in maps <IconArrow size={13} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="grid place-items-center rounded-xl border border-dashed border-line bg-[#fbfdff] p-8 text-center">
                <IconLock size={22} className="text-muted" />
                <p className="mt-2 text-[0.86rem] font-bold text-navy-900">No location shared</p>
                <p className="mx-auto mt-1 max-w-sm text-[0.76rem] leading-relaxed text-muted">
                  When sharing is enabled the patient&apos;s device can publish its position. You can revoke it at
                  any time — past coordinates are not kept.
                </p>
              </div>
            )}

            {canManage ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button onClick={updatePosition} disabled={busy} className="btn btn-sm btn-primary">
                  <IconPin size={14} /> {busy ? "Reading location…" : "Update from this device"}
                </button>
                <p className="text-[0.72rem] text-muted">
                  The browser will ask for permission. Accuracy varies by device.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
              <IconShield size={16} className="text-teal-600" /> Who can see location
            </h2>
            {recipients.length ? (
              <ul className="mt-3 space-y-2">
                {recipients.map((r: any) => (
                  <li key={r.userId} className="flex items-center justify-between rounded-lg border border-line px-3 py-2">
                    <div>
                      <p className="text-[0.82rem] font-bold text-navy-900">{r.name}</p>
                      <p className="text-[0.66rem] text-muted">{r.relation}</p>
                    </div>
                    <span className={`pill text-[0.58rem] ${r.canViewLocation ? "pill-ok" : "pill-muted"}`}>
                      {r.canViewLocation ? "can view" : "no access"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.78rem] text-muted">No family recipients yet.</p>
            )}
            <p className="mt-3 text-[0.72rem] leading-relaxed text-muted">
              Change who can view location from the family page.
            </p>
          </section>

          <section className="card p-5">
            <h2 className="text-[0.9rem] font-extrabold text-navy-900">How consent works</h2>
            <ul className="mt-3 space-y-2">
              {[
                "Location sharing is off until the patient turns it on.",
                "Only recipients with location permission can see it.",
                "Turning sharing off stops new coordinates immediately.",
                "Coordinates are shown only on authorised dashboards and alert messages.",
                "Location is never used for advertising or sold.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-[0.78rem] leading-snug text-muted">
                  <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-teal-50 text-teal-600">
                    <IconCheck size={10} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
            <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
            <p className="text-[0.74rem] leading-relaxed text-muted">
              Premium plans include authorised location sharing. On Family Basic, location stays hidden. You can
              review plan features under Plan &amp; billing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
