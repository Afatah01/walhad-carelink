import type { Metadata } from "next";
import { CtaBand, PageHero, PlanCard, Section, SectionHead } from "@/components/site/Layout";
import { IconCheck } from "@/components/ui/Icons";
import { AcceptedPayments } from "@/components/ui/PaymentIcons";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Family Basic $30, Family Premium $50, and custom hospital plans from $100 per month.",
};

// Prices come from the live catalogue so the page can never drift from billing.
export const dynamic = "force-dynamic";

const CARDS = [
  {
    slug: "family-basic",
    name: "Family Basic",
    price: 30,
    from: false,
    blurb: "One patient, essential alerts.",
    points: [
      "One primary patient",
      "Two family alert recipients",
      "Glucose monitoring dashboard",
      "Basic notifications",
      "Telegram alerts",
    ],
    cta: "Choose Family Basic",
    href: "/signup?plan=family-basic",
  },
  {
    slug: "family-premium",
    name: "Family Premium",
    price: 50,
    from: false,
    blurb: "Every alert type, more caregivers.",
    points: [
      "One primary patient",
      "Five family alert recipients",
      "Advanced notifications",
      "Rapid-change alerts",
      "Location sharing",
    ],
    cta: "Choose Family Premium",
    href: "/signup?plan=family-premium",
  },
  {
    slug: "hospital",
    name: "Custom & Hospital",
    price: 100,
    from: true,
    blurb: "For clinics and healthcare teams.",
    points: [
      "Custom patient capacity",
      "Multiple healthcare professionals",
      "Hospital monitoring dashboard",
      "Centralised patient management",
      "Staff accounts and roles",
    ],
    cta: "Contact Sales",
    href: "/contact?topic=hospital",
  },
];

const TABLE: [string, string, string, string][] = [
  ["Monitored patients", "1", "1", "Custom"],
  ["Alert recipients", "2", "5", "Unlimited staff"],
  ["Low & high alerts", "✓", "✓", "✓"],
  ["Rapid-change alerts", "—", "✓", "✓"],
  ["Telegram alerts", "✓", "✓", "✓"],
  ["SMS alerts", "—", "✓", "Negotiated"],
  ["Location sharing", "—", "✓", "✓"],
  ["Hospital dashboard", "—", "—", "✓"],
  ["Staff accounts", "—", "—", "✓"],
];

export default async function PricingPage() {
  await ensureSeed().catch(() => null);
  const plans = await listPlans().catch(() => []);
  const live = CARDS.map((c) => {
    const row = plans.find((p) => p.slug === c.slug);
    return { ...c, price: row ? Math.round(row.price_cents / 100) : c.price };
  });

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple plans. Connected care."
        body="Choose the monitoring plan that matches your needs."
        tone="aqua"
        align="center"
      >
        <span className="sr-only">Plans</span>
      </PageHero>

      {/* cards */}
      <Section tone="white">
        <div className="grid items-stretch gap-5 lg:grid-cols-3 lg:gap-6">
          {live.map((c) => (
            <PlanCard
              key={c.slug}
              name={c.name}
              price={c.price}
              from={c.from}
              blurb={c.blurb}
              features={c.points}
              cta={c.cta}
              href={c.href}
              recommended={c.slug === "family-premium"}
            />
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <AcceptedPayments />
          <p className="text-center text-[0.75rem] text-muted">
            Subscriptions are activated only after payment is verified.
          </p>
        </div>
      </Section>

      {/* comparison */}
      <Section tone="page">
        <SectionHead
          eyebrow="Compare"
          title="What is included in each plan."
          body="Same platform, different capacity. Nothing here is an add-on you have to buy separately."
          align="center"
        />

        {/* desktop table */}
        <div className="mx-auto mt-9 hidden max-w-[900px] overflow-hidden rounded-[18px] border border-line bg-white shadow-[var(--shadow-card)] md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-[#fafcfc]">
                <th scope="col" className="px-6 py-4 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-faint">
                  Feature
                </th>
                {["Basic", "Premium", "Hospital"].map((h, i) => (
                  <th
                    key={h}
                    scope="col"
                    className={`px-6 py-4 text-[0.78rem] font-bold ${i === 1 ? "bg-aqua/60 text-teal-500" : "text-ink"}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TABLE.map((row, ri) => (
                <tr key={row[0]} className={ri % 2 === 1 ? "bg-[#fbfdfd]" : "bg-white"}>
                  <th scope="row" className="px-6 py-3.5 text-[0.875rem] font-medium text-ink">
                    {row[0]}
                  </th>
                  {row.slice(1).map((cell, i) => (
                    <td key={i} className={`px-6 py-3.5 text-[0.875rem] ${i === 1 ? "bg-aqua/40" : ""}`}>
                      {cell === "✓" ? (
                        <span className="inline-flex text-teal-500">
                          <IconCheck size={15} />
                        </span>
                      ) : cell === "—" ? (
                        <span className="text-[#b3c1c7]">—</span>
                      ) : (
                        <span className="font-semibold text-ink">{cell}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* mobile — horizontally scrollable, never breaks the page */}
        <div className="mt-8 -mx-5 overflow-x-auto px-5 pb-2 md:hidden">
          <div className="min-w-[560px] overflow-hidden rounded-[18px] border border-line bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-line bg-[#fafcfc]">
                  <th className="px-4 py-3 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-faint">Feature</th>
                  {["Basic", "Premium", "Hospital"].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[0.72rem] font-bold ${i === 1 ? "bg-aqua/60 text-teal-500" : "text-ink"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row, ri) => (
                  <tr key={row[0]} className={ri % 2 === 1 ? "bg-[#fbfdfd]" : "bg-white"}>
                    <th className="px-4 py-3 text-[0.78rem] font-medium text-ink">{row[0]}</th>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className={`px-4 py-3 text-[0.78rem] ${i === 1 ? "bg-aqua/40" : ""}`}>
                        {cell === "✓" ? (
                          <span className="inline-flex text-teal-500">
                            <IconCheck size={13} />
                          </span>
                        ) : cell === "—" ? (
                          <span className="text-[#b3c1c7]">—</span>
                        ) : (
                          <span className="font-semibold text-ink">{cell}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-2 text-center text-[0.7rem] text-faint md:hidden">Scroll the table sideways to see every plan.</p>
      </Section>

      <CtaBand
        title="Not sure which plan fits?"
        body="Start with Family Basic. You can move up at any time."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "Contact Us", href: "/contact" }}
      />
    </>
  );
}
