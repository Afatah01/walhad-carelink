"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useDashboardCtx } from "./DashboardProvider";
import { IconAlert, IconBell, IconCheck, IconX } from "@/components/ui/Icons";

interface OpenAlert {
  id: number;
  kind: string;
  level: string;
  message: string | null;
  value: number | null;
  triggeredAt: number;
  status: string;
  patientName: string;
}

/**
 * Audible alert + live notification toast.
 *
 * Browsers require a user gesture before audio can play, so the WebAudio context
 * is created on first interaction and the ring only runs for critical alerts
 * while the tab is visible. Push notifications cover the background case.
 */
export function AlertRinger() {
  const { activeId, soundOn, setSoundOn } = useDashboardCtx();
  const pathname = usePathname();
  const [alert, setAlert] = useState<OpenAlert | null>(null);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [needsGesture, setNeedsGesture] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const ringTimer = useRef<number | null>(null);
  const lastAlertId = useRef<number | null>(null);

  const ensureAudio = useCallback(() => {
    if (typeof window === "undefined") return null;
    if (!audioRef.current) {
      const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
      if (!Ctor) return null;
      audioRef.current = new Ctor();
    }
    if (audioRef.current.state === "suspended") {
      audioRef.current.resume().catch(() => {});
    }
    return audioRef.current;
  }, []);

  const playChime = useCallback(() => {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.0001;
    master.connect(ctx.destination);
    // gentle two-tone medical chime, repeated twice
    for (let i = 0; i < 2; i++) {
      const start = now + i * 0.55;
      [880, 1174.7].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.45, start + idx * 0.16 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + idx * 0.16 + 0.42);
        osc.connect(gain);
        gain.connect(master);
        osc.start(start + idx * 0.16);
        osc.stop(start + idx * 0.16 + 0.5);
      });
    }
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.05);
  }, [ensureAudio]);

  // Unlock audio on first user interaction.
  useEffect(() => {
    const unlock = () => {
      ensureAudio();
      setNeedsGesture(false);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [ensureAudio]);

  // Poll for open alerts for the active patient.
  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`/api/alerts?patientId=${activeId}&scope=open`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        const first: any = json.alerts?.[0];
        if (cancelled) return;
        if (!first) {
          setAlert(null);
          return;
        }
        setAlert({
          id: first.id,
          kind: first.kind,
          level: first.level,
          message: first.message,
          value: first.value,
          triggeredAt: first.triggeredAt,
          status: first.status,
          patientName: first.patientName ?? "",
        });
        if (first.level === "critical" && lastAlertId.current !== first.id) {
          lastAlertId.current = first.id;
          if (soundOn) {
            const ctx = ensureAudio();
            if (!ctx || ctx.state !== "running") setNeedsGesture(true);
            else playChime();
            if (ringTimer.current) window.clearInterval(ringTimer.current);
            ringTimer.current = window.setInterval(() => {
              if (document.visibilityState === "visible") playChime();
            }, 20_000);
          }
        }
      } catch {
        /* offline */
      }
    };

    load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      if (ringTimer.current) window.clearInterval(ringTimer.current);
    };
  }, [activeId, soundOn, playChime, ensureAudio]);

  const visible = alert && !dismissed.includes(alert.id);

  async function acknowledge() {
    if (!alert) return;
    await fetch("/api/alerts/acknowledge", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ alertId: alert.id }),
    }).catch(() => {});
    setDismissed((d) => [...d, alert.id]);
    setAlert(null);
    if (ringTimer.current) window.clearInterval(ringTimer.current);
  }

  return (
    <>
      {/* sound gate */}
      {needsGesture && soundOn ? (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] md:inset-x-auto md:right-4 md:w-[380px]">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-high-soft text-high">
              <IconBell size={17} />
            </span>
            <p className="flex-1 text-[0.8rem] font-semibold text-navy-900">
              Tap once to enable audible alerts in this browser.
            </p>
            <button type="button" onClick={() => ensureAudio()} className="btn btn-sm btn-primary !px-3 !py-1.5">
              Enable
            </button>
            <button
              type="button"
              onClick={() => setSoundOn(false)}
              className="text-[0.7rem] font-bold text-muted hover:text-navy-800"
            >
              Later
            </button>
          </div>
        </div>
      ) : null}

      {/* critical alert card */}
      {visible && alert ? (
        <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[75] flex justify-end md:inset-x-auto md:right-4 md:bottom-4 md:w-[400px]">
          <div
            className={`pointer-events-auto w-full overflow-hidden rounded-2xl border bg-white shadow-[0_24px_60px_-24px_rgba(12,36,64,0.45)] ${
              alert.level === "critical" ? "border-[#f3c4c1]" : "border-line"
            }`}
            role="alert"
            aria-live="assertive"
          >
            <div
              className={`h-1 w-full ${
                alert.level === "critical"
                  ? "bg-gradient-to-r from-[#b3261e] to-[#e06a5b]"
                  : "bg-gradient-to-r from-high to-[#e8b25c]"
              }`}
            />
            <div className="flex items-start gap-3 p-4">
              <span
                className={`relative grid h-10 w-10 flex-none place-items-center rounded-xl ${
                  alert.level === "critical" ? "bg-low-soft text-low" : "bg-high-soft text-high"
                }`}
              >
                <IconAlert size={19} />
                {alert.level === "critical" ? (
                  <span className="absolute inset-0 rounded-xl border border-low/40 [animation:pulse-ring_2s_infinite]" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-low">
                  {alert.level === "critical" ? "Critical alert" : "Alert"}
                </p>
                <p className="mt-0.5 text-[0.86rem] font-bold leading-snug text-navy-900">
                  {alert.kind.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())}
                  {alert.patientName ? ` · ${alert.patientName}` : ""}
                </p>
                <p className="mt-1 text-[0.78rem] leading-relaxed text-muted">{alert.message}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={acknowledge} className="btn btn-sm btn-primary !px-3 !py-1.5">
                    <IconCheck size={13} /> Acknowledge
                  </button>
                  <Link href="/dashboard/alerts" className="btn btn-sm btn-ghost !px-3 !py-1.5">
                    Open alert
                  </Link>
                  <button
                    type="button"
                    onClick={() => setDismissed((d) => [...d, alert.id])}
                    className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted hover:bg-mist"
                    aria-label="Dismiss"
                  >
                    <IconX size={14} />
                  </button>
                </div>
              </div>
            </div>
            {soundOn ? (
              <div className="flex items-center justify-between border-t border-line bg-[#fbfdff] px-4 py-1.5">
                <span className="flex items-center gap-1.5 text-[0.66rem] font-bold text-muted">
                  <IconBell size={11} /> Ringing every 20 seconds until acknowledged
                </span>
                <button
                  type="button"
                  onClick={() => setSoundOn(false)}
                  className="text-[0.66rem] font-bold text-brand-700 hover:underline"
                >
                  Mute sound
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
