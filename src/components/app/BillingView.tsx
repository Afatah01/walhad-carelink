"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import { IconArrow, IconCard, IconCheck, IconDownload, IconInfo, IconShield, IconSms } from "@/components/ui/Icons";
import { stampTime } from "@/lib/glucose";

export function BillingView() {
  const { activeId } = useDashboardCtx();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const notify = (m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(null), 6000);
  };

  const load = useCallback(async () => {
    const res = await fetch(`/api/billing?patientId=${activeId ?? ""}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
  }, [activeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function choose(slug: string) {
    setBusy(slug);
    const res = await fetch("/api/billing/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planSlug: slug }),
    });
    const json = await res.json();
    setBusy(null);
    notify(
      json.ok
        ? json.message ?? "Plan change created. A subscription activates only after verified payment confirmation."
        : json.error ?? "Could not start the plan change.",
    );
    await load();
  }

  async function cancel() {
    if (!window.confirm("Cancel the renewal? Access continues until the end of the paid period.")) return;
    setBusy("cancel");
    const res = await fetch("/api/billing/cancel", { method: "POST" });
    const json = await res.json();
    setBusy(null);
    notify(json.ok ? "Renewal cancelled — access continues until the period ends." : json.error ?? "Could not cancel.");
    await load();
  }

  if (!data) return <div className="skeleton h-80 w-full rounded-2xl" />;

  const sub = data.subscription;
  const plan = sub?.plan;
  const smsPct = sub ? Math.min(100, Math.round((sub.sms_used / Math.max(1, sub.sms_allowance)) * 100)) : 0;

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed bottom-5 left-1/2 z-50 max-w-[92vw] -translate-x-1/2 rounded-xl bg-navy-900 px-4 py-2.5 text-[0.8rem] font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">Plan &amp; billing</h1>
          <p className="text-[0.82rem] text-muted">
            Subscription status, SMS allowance, invoices and plan changes.
          </p>
        </div>
        <Link href="/pricing" className="btn btn-sm btn-ghost">
          Compare plans <IconArrow size={14} />
        </Link>
      </header>

      {/* current plan */}
      <section className="card-lg overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 bg-gradient-to-r from-navy-800 to-[#005b8f] px-5 py-5 text-white">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
            <IconCard size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-white/60">Current plan</p>
            <p className="text-lg font-extrabold">{plan?.name ?? "No active plan"}</p>
            <p className="text-[0.76rem] text-white/70">
              {plan
                ? `$${plan.price_cents / 100} ${plan.currency} / ${plan.billing_interval} · ${
                    sub?.status === "active" ? "active" : sub?.status
                  }`
                : "Choose a plan to activate monitoring"}
            </p>
          </div>
          {sub?.status === "active" ? (
            <div className="text-right">
              <p className="text-[0.66rem] font-bold uppercase tracking-wider text-white/60">Renews</p>
              <p className="text-[0.86rem] font-bold">
                {sub.current_period_end
                  ? new Date(sub.current_period_end).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </p>
              {sub.cancel_at_period_end ? (
                <p className="text-[0.66rem] font-bold text-[#ffd7a1]">not renewing</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-3">
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Alert recipients</p>
            <p className="mt-0.5 text-lg font-extrabold text-navy-900">
              {data.usage.members} <span className="text-[0.76rem] font-bold text-muted">/ {plan?.recipient_limit ?? "—"}</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-teal-500"
                style={{ width: `${plan?.recipient_limit ? Math.min(100, (data.usage.members / plan.recipient_limit) * 100) : 0}%` }}
              />
            </div>
          </div>
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">SMS this month</p>
            <p className="mt-0.5 text-lg font-extrabold text-navy-900">
              {sub?.sms_used ?? 0}{" "}
              <span className="text-[0.76rem] font-bold text-muted">/ {sub?.sms_allowance ?? 0}</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-mist">
              <div
                className={`h-full rounded-full ${smsPct > 85 ? "bg-high" : "bg-gradient-to-r from-teal-500 to-brand-500"}`}
                style={{ width: `${smsPct}%` }}
              />
            </div>
            <p className="mt-1 text-[0.66rem] text-muted">Telegram and push are unlimited within fair use.</p>
          </div>
          <div>
            <p className="text-[0.66rem] font-bold uppercase tracking-wider text-muted">Actions</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Link href="/contact?topic=subscription" className="btn btn-sm btn-ghost">
                Upgrade
              </Link>
              {sub?.status === "active" && !sub.cancel_at_period_end ? (
                <button onClick={cancel} disabled={busy === "cancel"} className="btn btn-sm btn-ghost !text-low">
                  Cancel renewal
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* plan options */}
      <section>
        <h2 className="text-[0.95rem] font-extrabold text-navy-900">Available plans</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {data.plans.map((p: any) => {
            const current = p.slug === plan?.slug;
            return (
              <div
                key={p.id}
                className={`flex flex-col rounded-2xl border bg-white p-4 ${
                  current ? "border-brand-400 ring-1 ring-brand-100" : "border-line"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[0.88rem] font-extrabold text-navy-900">{p.name}</p>
                  {current ? <span className="pill pill-ok text-[0.54rem]">current</span> : null}
                </div>
                <p className="mt-1 text-[1.35rem] font-extrabold text-navy-900">
                  ${p.price_cents / 100}
                  <span className="ml-1 text-[0.68rem] font-bold text-muted">/{p.billing_interval}</span>
                </p>
                <ul className="mt-2 flex-1 space-y-1">
                  {p.features.slice(0, 4).map((f: string) => (
                    <li key={f} className="flex items-start gap-1.5 text-[0.74rem] leading-snug text-muted">
                      <IconCheck size={11} className="mt-0.5 flex-none text-teal-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => choose(p.slug)}
                  disabled={current || busy === p.slug}
                  className="btn btn-sm btn-primary mt-3 w-full disabled:opacity-50"
                >
                  {busy === p.slug ? "Starting…" : current ? "Active plan" : `Switch to ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* invoices */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
            <IconCard size={16} className="text-brand-600" /> Invoices &amp; payments
          </h2>
          <span className="text-[0.7rem] font-semibold text-muted">{data.payments.length} records</span>
        </div>
        {data.payments.length ? (
          <div className="overflow-x-auto">
            <table className="tbl min-w-[620px]">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p: any) => (
                  <tr key={p.id}>
                    <td className="font-mono text-[0.74rem] font-bold text-navy-900">{p.invoice_no}</td>
                    <td className="text-[0.8rem] text-muted">{p.description}</td>
                    <td className="tabular font-bold text-navy-900">${(p.amount_cents / 100).toFixed(2)}</td>
                    <td>
                      <span
                        className={`pill text-[0.58rem] ${
                          p.status === "paid" ? "pill-ok" : p.status === "pending" ? "pill-high" : "pill-muted"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[0.76rem] text-muted">{stampTime(p.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="p-5 text-center text-[0.8rem] text-muted">No payments recorded yet.</p>
        )}
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
          <IconShield size={15} className="mt-0.5 flex-none text-teal-600" />
          <p className="text-[0.74rem] leading-relaxed text-muted">
            <strong className="font-bold text-navy-800">Verified payments only.</strong> A subscription is never
            marked active until the payment provider confirms the transaction. Pending invoices stay visible here
            until they are settled.
          </p>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
          <IconSms size={15} className="mt-0.5 flex-none text-brand-600" />
          <p className="text-[0.74rem] leading-relaxed text-muted">
            Unused SMS messages do not roll over. Telegram and push notifications are included on every plan — the
            recipient limit is the only difference between Family Basic and Premium.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
        <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
        <p className="text-[0.74rem] leading-relaxed text-muted">
          Payment provider credentials are configured server-side. This deployment uses a modular payment
          architecture: connect Stripe, Paystack, or another provider through environment variables and webhook
          verification without touching the UI.
        </p>
      </div>
    </div>
  );
}
