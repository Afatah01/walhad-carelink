"use client";

import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import { DEMO_TELEGRAM_PREVIEWS } from "@/lib/demo-telegram";
import {
  IconCheck,
  IconCopy,
  IconInfo,
  IconLink,
  IconRefresh,
  IconSend,
  IconShield,
  IconTelegram,
  IconUsers,
  IconX,
} from "@/components/ui/Icons";
import { relativeTime, stampTime } from "@/lib/glucose";

export function TelegramView() {
  const { activeId, active } = useDashboardCtx();
  const [state, setState] = useState<any>(null);
  const [linking, setLinking] = useState<{ token: string; deepLink: string | null; botUsername: string | null; expiresInMinutes: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLog, setShowLog] = useState(false);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 5000);
  };

  const load = useCallback(async () => {
    if (!activeId) return;
    const res = await fetch(`/api/telegram?patientId=${activeId}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setState(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function startLink() {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch("/api/telegram/link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId }),
    });
    const json = await res.json();
    setBusy(false);
    if (json.ok) {
      setLinking(json);
      notify("One-time connection code created — valid for 20 minutes.");
    } else {
      notify(json.error ?? "Could not create a link.");
    }
  }

  async function test() {
    if (!activeId) return;
    setBusy(true);
    const res = await fetch("/api/telegram/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patientId: activeId }),
    });
    const json = await res.json();
    setBusy(false);
    notify(json.detail ?? (json.ok ? "Test sent." : "Test failed."));
    await load();
  }

  async function disconnect(id: number) {
    setBusy(true);
    await fetch("/api/telegram", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ linkId: id }),
    });
    setBusy(false);
    notify("Telegram recipient disconnected.");
    await load();
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!state) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-32 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  const configured = state.meta.botConfigured;
  const recipients = state.recipients ?? [];
  const previewMode = !configured;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Telegram alerts</h1>
          <p className="text-[0.82rem] text-muted">
            A real bot for {(active?.name ?? "your patient")} — readings, alerts and acknowledgement from inside
            Telegram.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={test} disabled={busy} className="btn btn-sm btn-ghost">
            <IconSend size={14} /> Send test
          </button>
          <button onClick={load} className="btn btn-sm btn-ghost">
            <IconRefresh size={14} />
          </button>
        </div>
      </header>

      {previewMode ? (
        <div className="flex flex-wrap items-start gap-2.5 rounded-xl border border-[#f4e0c4] bg-high-soft/60 p-3.5">
          <IconInfo size={15} className="mt-0.5 flex-none text-high" />
          <div className="min-w-0 flex-1">
            <p className="text-[0.8rem] font-bold text-[#8a5a11]">Bot token not configured on this deployment</p>
            <p className="mt-0.5 text-[0.76rem] leading-relaxed text-[#8a5a11]/85">
              Telegram is fully wired — the moment you set <code className="kbd">TELEGRAM_BOT_TOKEN</code> (and
              optionally <code className="kbd">TELEGRAM_BOT_USERNAME</code>), live linking and delivery switch on.
              The recipient list below is a preview so you can see the flow.
            </p>
          </div>
        </div>
      ) : null}

      {/* connection card */}
      <section className="card-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-[#eef7ff] to-[#eefaf5] px-5 py-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-500 text-white shadow-md">
            <IconTelegram size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.95rem] font-extrabold text-navy-900">Walhad CareLink Bot</p>
            <p className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-muted">
              <span className={`dot ${configured ? "dot-live" : "dot-warn"}`} />
              {configured
                ? `Connected · @${state.meta.botUsername ?? "walhadcarelink_bot"}`
                : "Preview mode — awaiting bot token"}
            </p>
          </div>
          <span className={`pill ${configured ? "pill-ok" : "pill-muted"}`}>
            {recipients.filter((r: any) => r.status === "active").length} active
          </span>
          <button onClick={startLink} disabled={busy} className="btn btn-primary btn-sm">
            <IconLink size={14} /> Connect Telegram
          </button>
        </div>

        {linking ? (
          <div className="border-t border-line bg-white p-5">
            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="text-[0.86rem] font-extrabold text-navy-900">1 · Open the deep link</p>
                {linking.deepLink ? (
                  <a
                    href={linking.deepLink}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-4 py-3 text-[0.88rem] font-bold text-white transition hover:brightness-105"
                  >
                    <IconTelegram size={17} /> Open Telegram &amp; connect
                  </a>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-line bg-mist/50 p-3 text-center">
                    <p className="text-[0.78rem] font-bold text-navy-800">
                      Deep link available once a bot token is configured
                    </p>
                    <p className="mt-1 text-[0.72rem] text-muted">
                      Meanwhile use the code below with your own bot&apos;s /start command.
                    </p>
                  </div>
                )}
                <p className="mt-3 text-[0.76rem] font-bold text-navy-800">2 · Or send this command to the bot</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg border border-line bg-mist/60 px-3 py-2 text-[0.8rem] font-semibold text-navy-900">
                    /start {linking.token}
                  </code>
                  <button onClick={() => copy(`/start ${linking.token}`)} className="btn btn-sm btn-ghost">
                    {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <p className="mt-2 text-[0.7rem] leading-relaxed text-muted">
                  The code expires in {linking.expiresInMinutes} minutes and can be used once. It links only the
                  patient you are viewing — never another family&apos;s data.
                </p>
              </div>
              <div className="rounded-xl border border-line bg-[#f7fafc] p-3">
                <p className="text-[0.72rem] font-extrabold uppercase tracking-wider text-muted">What happens next</p>
                <ol className="mt-2 space-y-2">
                  {[
                    "Telegram opens the bot with your one-time code.",
                    "Press Start — the bot verifies the code server-side.",
                    "The chat is bound to this patient and your account.",
                    "Alerts arrive here; you can acknowledge with one tap.",
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-2 text-[0.78rem] leading-snug text-navy-800">
                      <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-brand-500 text-[0.58rem] font-extrabold text-white">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            <button
              onClick={() => setLinking(null)}
              className="mt-3 inline-flex items-center gap-1 text-[0.72rem] font-bold text-muted hover:text-navy-800"
            >
              <IconX size={12} /> Hide
            </button>
          </div>
        ) : null}
      </section>

      {/* recipients */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconUsers size={16} className="text-brand-600" /> Connected Telegram recipients
          </h2>
          <span className="text-[0.7rem] font-semibold text-muted">
            {recipients.length} of {state.meta.recipientLimit ?? "—"} plan seats
          </span>
        </div>
        {recipients.length ? (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[680px]">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Chat</th>
                  <th>Preferences</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r: any) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-50 text-brand-600">
                          <IconTelegram size={13} />
                        </span>
                        <div>
                          <p className="font-bold text-navy-900">{r.name}</p>
                          <p className="text-[0.68rem] text-muted">
                            {r.linkedAt ? `linked ${relativeTime(r.linkedAt)}` : "awaiting first message"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[150px] truncate font-mono text-[0.72rem] text-muted">{r.chatMasked}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {[
                          ["Low", r.notifyLow],
                          ["High", r.notifyHigh],
                          ["Critical", r.notifyCritical],
                          ["Status", r.notifyStatus],
                        ].map(([label, on]) => (
                          <span
                            key={String(label)}
                            className={`rounded px-1.5 py-0.5 text-[0.56rem] font-extrabold ${
                              on ? "bg-teal-50 text-teal-700" : "bg-[#f1f5f9] text-[#9aaec1]"
                            }`}
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`pill text-[0.6rem] ${
                          r.status === "active" ? "pill-ok" : r.status === "preview" ? "pill-muted" : "pill-high"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => disconnect(r.id)}
                        disabled={busy}
                        className="rounded-lg border border-line px-2 py-1 text-[0.68rem] font-bold text-muted transition hover:border-[#f6d2d2] hover:text-low"
                      >
                        Disconnect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <IconTelegram size={22} className="mx-auto text-muted" />
            <p className="mt-2 text-[0.86rem] font-bold text-navy-900">No Telegram recipients yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[0.76rem] leading-relaxed text-muted">
              Use <strong>Connect Telegram</strong> above to generate a one-time code for each family member or
              caregiver.
            </p>
          </div>
        )}
      </section>

      {/* command reference + preview */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <section className="card p-5">
          <h2 className="text-[0.9rem] font-extrabold text-navy-900">Bot commands</h2>
          <p className="text-[0.72rem] text-muted">Available to every authorised Telegram recipient.</p>
          <ul className="mt-3 space-y-2">
            {[
              ["/start", "Link this chat (with one-time code) or greet a returning user"],
              ["/help", "Show the full command list"],
              ["/status", "Notification connection and preference status"],
              ["/glucose", "Latest authorised glucose reading"],
              ["/history", "Recent readings with status"],
              ["/alerts", "Recent alerts and acknowledgements"],
              ["/settings", "Toggle channels with inline buttons"],
              ["/acknowledge", "Acknowledge the most recent open alert"],
              ["/disconnect", "Stop Telegram notifications for this chat"],
            ].map(([cmd, desc]) => (
              <li key={cmd} className="flex items-start gap-2.5">
                <code className="kbd flex-none">{cmd}</code>
                <span className="text-[0.78rem] leading-snug text-muted">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-[0.9rem] font-extrabold text-navy-900">Example conversation</h2>
            <button
              onClick={() => setShowLog((v) => !v)}
              className="text-[0.7rem] font-bold text-brand-700 hover:underline"
            >
              {showLog ? "Hide" : "Show"} delivery log
            </button>
          </div>
          <div className="space-y-2 bg-[#f2f7fb] p-4">
            {DEMO_TELEGRAM_PREVIEWS.map((m, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-2xl p-2.5 text-[0.78rem] leading-relaxed ${
                  m.from === "bot"
                    ? "rounded-tl-md bg-white text-navy-900 shadow-sm"
                    : "ml-auto rounded-tr-md bg-[#d8f3e9] font-semibold text-[#0b4f3c]"
                }`}
              >
                <p className={m.from === "bot" ? "whitespace-pre-wrap" : "whitespace-pre-wrap"}>{m.text}</p>
                <p className="mt-1 text-right text-[0.58rem] font-semibold text-muted">{m.time}</p>
              </div>
            ))}
          </div>
          {showLog ? (
            <div className="max-h-56 overflow-y-auto border-t border-line">
              {state.deliveries.length ? (
                <ul className="divide-y divide-line">
                  {state.deliveries.map((d: any) => (
                    <li key={d.id} className="flex items-center gap-2 px-4 py-2 text-[0.72rem]">
                      <span
                        className={`h-1.5 w-1.5 flex-none rounded-full ${
                          d.status === "sent" ? "bg-teal-500" : d.status === "failed" ? "bg-low" : "bg-[#c3cfdb]"
                        }`}
                      />
                      <span className="font-semibold text-navy-900">{d.channel}</span>
                      <span className="truncate text-muted">{d.recipient ?? "—"}</span>
                      <span className="ml-auto flex-none font-bold uppercase tracking-wide text-muted">
                        {d.status}
                      </span>
                      <span className="w-16 flex-none text-right text-muted">
                        {stampTime(d.createdAt).split(",")[1] ?? ""}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-4 text-center text-[0.76rem] text-muted">No delivery attempts recorded yet.</p>
              )}
            </div>
          ) : null}
        </section>
      </div>

      {/* security + settings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconShield size={16} className="text-teal-600" /> Security model
          </h2>
          <ul className="mt-3 space-y-2.5">
            {[
              "The bot token lives only in server environment variables — it never reaches the browser.",
              "Webhook requests must carry the secret token header; update verification happens server-side.",
              "One-time linking codes expire in 20 minutes and are invalidated after first use.",
              "Every command re-checks that the Telegram account is still authorised for that patient.",
              "Sensitive data is never sent to chats that are not actively linked to a patient.",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[0.8rem] leading-snug text-muted">
                <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-teal-50 text-teal-600">
                  <IconCheck size={10} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <h2 className="text-[0.9rem] font-extrabold text-navy-900">Notification preferences</h2>
          <p className="text-[0.72rem] text-muted">
            Recipients manage their own toggles with <code className="kbd">/settings</code>. Defaults applied to
            every new link:
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["Low glucose", true],
              ["High glucose", true],
              ["Critical", true],
              ["Sync warnings", true],
              ["Emergency requests", true],
              ["Trend notes", false],
            ].map(([label, on]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-lg border border-line px-2.5 py-2"
              >
                <span className="text-[0.76rem] font-semibold text-navy-800">{label}</span>
                <span className={`pill text-[0.54rem] ${on ? "pill-ok" : "pill-muted"}`}>{on ? "on" : "off"}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[0.72rem] leading-relaxed text-muted">
            Telegram is included on every plan. Only the number of recipients is limited by your subscription.
          </p>
        </section>
      </div>
    </div>
  );
}
