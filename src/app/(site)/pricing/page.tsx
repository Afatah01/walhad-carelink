import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/marketing/PageHero";
import { PricingGrid } from "@/components/marketing/PricingGrid";
import { FaqAccordion, type FaqItem } from "@/components/marketing/Faq";
import { CtaBand } from "@/components/marketing/Sections";
import { Reveal } from "@/components/marketing/Reveal";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";
import {
  IconAlert,
  IconArrow,
  IconCard,
  IconCheck,
  IconClock,
  IconInfo,
  IconShield,
  IconSms,
  IconTelegram,
  IconUsers,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description:
    "Family Basic $30/month, Family Premium $50/month and custom hospital plans from $100/month. Telegram alerts included in every plan.",
};

export const dynamic = "force-dynamic";

const FAQS: FaqItem[] = [
  {
    q: "How is billing handled?",
    a: "Plans are billed monthly in advance. Your first payment activates the workspace; renewals happen on the same day each month. Every payment produces an invoice with a unique reference you can find under Billing in the dashboard.",
  },
  {
    q: "How do family alert limits work?",
    a: "The recipient limit counts the family members and caregivers who can receive alerts for your primary patient — 2 on Family Basic and 5 on Family Premium. Hospital plans are quoted per monitored patient and per staff seat. Changing the limit never deletes your history; extra recipients are simply paused until you upgrade.",
  },
  {
    q: "How do SMS allowances work?",
    a: "Each plan includes a monthly SMS allowance (100 messages on Family Basic, 400 on Premium, negotiated for hospitals). One alert sent to three SMS recipients uses three messages. Allowance usage is visible in the dashboard, and you can disable SMS per recipient at any time to conserve it.",
  },
  {
    q: "Are Telegram notifications really included in every plan?",
    a: "Yes. Telegram is a first-class channel on all three plans — the bot, the commands, and inline acknowledgement. There is no per-message charge for Telegram; the only limit is how many recipients your plan allows.",
  },
  {
    q: "Can I upgrade or downgrade later?",
    a: "Yes. Upgrades take effect once the new payment is verified. Downgrades keep your data and history but reduce recipient and SMS limits at the next billing date. Our team can help you choose if you are unsure.",
  },
  {
    q: "What is included in the hospital plan?",
    a: "The $100/month figure is a starting price, not an unlimited hospital subscription. Final pricing depends on the number of patients monitored, the number of healthcare professionals with access, integrations, notification volume and the services you need. We prepare a written quote after a short consultation.",
  },
  {
    q: "Do prices include taxes?",
    a: "Prices are shown in USD and exclude applicable taxes or local levies. Where tax applies it is added at checkout or stated on the invoice.",
  },
  {
    q: "What happens if I cancel?",
    a: "You keep access until the end of the paid period. Monitoring and alerts stop after that date, and historical readings remain exportable for a limited retention window so you can move to another service.",
  },
];

export default async function PricingPage() {
  await ensureSeed().catch(() => null);
  const plans = await listPlans().catch(() => []);
  const family = plans.filter((p) => p.slug !== "hospital");
  const hospital = plans.find((p) => p.slug === "hospital");

  const stats = await db()
    .get<{ subscribers: number }>("SELECT COUNT(*) AS subscribers FROM subscriptions WHERE status = 'active'")
    .catch(() => null);

  return (
    <>
      <PageHero
        align="center"
        eyebrow="Pricing plans"
        title={
          <>
            Clear monthly plans for{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              real families
            </span>
          </>
        }
        body="Every plan includes Telegram Bot notifications, glucose history and the family alert centre. No setup fees, no per-alert charges on push or Telegram."
      />

      <section className="shell -mt-4 pb-14">
        <div className="mx-auto mb-10 flex max-w-md items-center justify-center gap-2 rounded-full border border-line bg-white p-1.5 shadow-soft">
          <span className="flex-1 rounded-full bg-gradient-to-r from-brand-500 to-navy-700 px-4 py-2 text-center text-[0.82rem] font-bold text-white">
            Monthly billing
          </span>
          <span className="flex-1 px-4 py-2 text-center text-[0.82rem] font-semibold text-muted">
            Annual (contact us)
          </span>
        </div>

        <PricingGrid plans={plans} />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.78rem] font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5">
            <IconShield size={14} className="text-teal-600" /> Verified payment confirmation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconClock size={14} className="text-teal-600" /> Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconCard size={14} className="text-teal-600" /> Invoices & receipts
          </span>
          {stats?.subscribers ? (
            <span className="inline-flex items-center gap-1.5">
              <IconUsers size={14} className="text-teal-600" /> {num(stats.subscribers)} active workspaces
            </span>
          ) : null}
        </div>
      </section>

      {/* comparison table */}
      <section className="bg-[#f7fafc] py-16">
        <div className="shell">
          <SectionHeading
            eyebrow="Compare"
            title="What each plan includes"
            body="A side-by-side look at the practical differences between plans."
          />
          <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-white shadow-soft">
            <table className="tbl min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-[34%]">Capability</th>
                  <th>Family Basic</th>
                  <th className="bg-brand-50/60">Family Premium</th>
                  <th>Custom & Hospital</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Monthly price", "$30", "$50", "From $100"],
                  ["Primary patients", "1", "1", "Custom capacity"],
                  ["Family alert recipients", "2", "5", "Per agreement"],
                  ["Glucose dashboard & history", "✓", "✓", "✓"],
                  ["Low & high notifications", "✓", "✓", "✓"],
                  ["Push & in-app alerts", "✓", "✓", "✓"],
                  ["Telegram Bot notifications", "✓", "✓", "✓"],
                  ["SMS allowance", "100/mo", "400/mo", "Negotiated"],
                  ["Audible ring alerts", "✓", "✓", "✓"],
                  ["Emergency escalation", "—", "✓", "✓"],
                  ["Authorized location sharing", "—", "✓", "✓"],
                  ["Advanced trend charts", "—", "✓", "✓"],
                  ["Hospital ward dashboard", "—", "—", "✓"],
                  ["Doctor / nurse accounts", "—", "—", "✓"],
                  ["Staff permission management", "—", "—", "✓"],
                  ["Dedicated onboarding", "—", "—", "✓"],
                  ["Support", "Basic", "Priority", "Custom arrangements"],
                ].map((row) => (
                  <tr key={row[0]}>
                    <td className="font-semibold text-navy-800">{row[0]}</td>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className={i === 1 ? "bg-brand-50/40" : ""}>
                        {cell === "✓" ? (
                          <span className="inline-flex items-center gap-1 text-teal-700">
                            <IconCheck size={13} /> Yes
                          </span>
                        ) : cell === "—" ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <span className="font-semibold text-navy-900">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-center text-[0.75rem] text-muted">
            Plan prices and limits are configurable by the platform operator. This page renders live values from the
            plan catalogue.
          </p>
        </div>
      </section>

      {/* terms + faq */}
      <section className="shell py-16">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <span className="eyebrow">Subscription terms</span>
            <h2 className="display-2 mt-3">Straightforward, monthly</h2>
            <div className="mt-5 space-y-3">
              {[
                { icon: IconCard, title: "Billed monthly in advance", body: "USD pricing. Renewals on the same day each month until cancelled." },
                { icon: IconAlert, title: "Verified payments only", body: "A subscription only activates after the payment provider confirms the transaction." },
                { icon: IconUsers, title: "Recipient limits", body: "Alert recipients count family and caregivers per primary patient." },
                { icon: IconSms, title: "SMS allowances", body: "Unused SMS messages do not roll over; push and Telegram are unlimited within fair use." },
                { icon: IconTelegram, title: "Telegram included", body: "All plans include the Telegram bot for every authorised recipient." },
                { icon: IconInfo, title: "Hospital pricing", body: "Starting at $100/month; final quote depends on patients, staff, integrations and volume." },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <div key={t.title} className="flex items-start gap-3 rounded-xl border border-line bg-white p-3.5">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mist text-navy-700">
                      <Icon size={15} />
                    </span>
                    <div>
                      <p className="text-[0.85rem] font-bold text-navy-900">{t.title}</p>
                      <p className="text-[0.8rem] leading-relaxed text-muted">{t.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/legal/terms" className="btn btn-sm btn-ghost">
                Terms of service
              </Link>
              <Link href="/contact?topic=subscription" className="btn btn-sm btn-ghost">
                Ask about billing
              </Link>
            </div>
          </div>

          <div>
            <span className="eyebrow">Pricing questions</span>
            <h2 className="display-2 mt-3">Frequently asked</h2>
            <div className="mt-5">
              <FaqAccordion items={FAQS} />
            </div>
            <div className="mt-5 rounded-2xl border border-line bg-gradient-to-br from-[#f3f9ff] to-[#f1fbf7] p-5">
              <p className="text-[0.9rem] font-bold text-navy-900">Need a hospital quote?</p>
              <p className="mt-1 text-[0.83rem] leading-relaxed text-muted">
                Send us the number of patients, the clinical team structure and any integration requirements — we
                will respond with a written proposal.
              </p>
              <Link href="/contact?topic=hospital" className="btn btn-primary btn-sm mt-3">
                Request a quote <IconArrow size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {hospital ? (
        <section className="shell pb-16">
          <Reveal>
            <div className="rounded-[1.8rem] border border-line bg-navy-900 p-8 text-white md:p-10">
              <div className="grid gap-6 md:grid-cols-[1.4fr_0.6fr] md:items-center">
                <div>
                  <span className="pill bg-white/10 text-white ring-1 ring-white/20">Custom & Hospital</span>
                  <h2 className="mt-4 text-2xl font-extrabold text-white md:text-3xl">
                    Monitoring from {`$${hospital.price_cents / 100}`} / month
                  </h2>
                  <p className="mt-2 max-w-xl text-[0.92rem] leading-relaxed text-white/70">
                    {hospital.tagline} Final pricing reflects patient volume, staff accounts, integrations and
                    notification requirements.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/contact?topic=hospital" className="btn bg-white text-navy-800 hover:bg-white/90">
                    Contact Sales
                  </Link>
                  <Link href="/hospital-solutions" className="btn border-white/25 bg-white/10 text-white">
                    See hospital features
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      ) : null}

      <CtaBand
        title="Start with 30 days of clarity"
        body="Choose a family plan and invite your care circle today. Upgrade whenever your family grows."
        primary={{ label: "Choose Family Premium", href: "/contact?topic=subscription" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />
    </>
  );
}
