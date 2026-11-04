import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, CtaBand } from "@/components/site/PageKit";
import { IconArrow, IconCheck } from "@/components/ui/Icons";
import { AcceptedPayments } from "@/components/ui/PaymentIcons";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";

export const metadata: Metadata = {
  title: "Pricing Plans",
  description: "Family Basic $30, Family Premium $50, and custom hospital plans from $100 per month.",
};

export const dynamic = "force-dynamic";

const CARDS = [
  {
    slug: "family-basic",
    name: "Family Basic",
    price: 30,
    from: false,
    featured: false,
    points: [
      "One primary patient",
      "Two family alert recipients",
      "Glucose monitoring dashboard",
      "Basic notifications",
    ],
    cta: "Choose Family Basic",
    href: "/signup?plan=family-basic",
  },
  {
    slug: "family-premium",
    name: "Family Premium",
    price: 50,
    from: false,
    featured: true,
    points: [
      "One primary patient",
      "Five family alert recipients",
      "Advanced notifications",
      "Premium family monitoring features",
    ],
    cta: "Choose Family Premium",
    href: "/signup?plan=family-premium",
  },
  {
    slug: "hospital",
    name: "Custom & Hospital",
    price: 100,
    from: true,
    featured: false,
    points: [
      "Custom patient capacity",
      "Multiple healthcare professionals",
      "Hospital monitoring dashboard",
      "Centralised patient management",
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
  // Read the live catalogue so prices always match the database.
  const plans = await listPlans().catch(() => []);
  const live = CARDS.map((c) => {
    const p = plans.find((x) => x.slug === c.slug);
    return { ...c, price: p ? Math.round(p.price_cents / 100) : c.price };
  });

  return (
    <>
      <PageHeader
        eyebrow="Pricing Plans"
        title="Simple monthly pricing"
        intro="Three plans. Cancel any time."
        center
      />

      <section className="shell -mt-2 py-12 md:py-16">
        <div className="grid gap-4 lg:grid-cols-3">
          {live.map((c) => (
            <div
              key={c.slug}
              className={`relative flex flex-col rounded-[1.4rem] border bg-white p-6 ${
                c.featured
                  ? "border-teal-500 shadow-[0_24px_60px_-34px_rgba(14,124,134,0.5)] lg:-mt-3 lg:mb-3"
                  : "border-line shadow-soft"
              }`}
            >
              {c.featured ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.12em] text-white">
                  Recommended
                </span>
              ) : null}

              <h2 className="text-[1.05rem] font-extrabold text-navy-900">{c.name}</h2>
              <div className="mt-3 flex items-baseline gap-1">
                {c.from ? <span className="text-[0.7rem] font-bold text-muted">from</span> : null}
                <span className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-navy-900">
                  ${c.price}
                </span>
                <span className="text-[0.8rem] font-semibold text-muted">/month</span>
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {c.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-[0.87rem] text-navy-800">
                    <span className="mt-0.5 grid flex-none place-items-center rounded-full bg-teal-50 text-teal-600" style={{ height: 18, width: 18 }}>
                      <IconCheck size={10} />
                    </span>
                    {point}
                  </li>
                ))}
              </ul>

              <Link
                href={c.href}
                className={`btn mt-7 w-full ${c.featured ? "btn-primary" : "btn-ghost"}`}
              >
                {c.cta} <IconArrow size={15} />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <AcceptedPayments />
        </div>
      </section>

      <section className="border-t border-line bg-mist/60 py-14">
        <div className="shell">
          <h2 className="mb-5 text-[1.3rem] font-extrabold tracking-[-0.03em] text-navy-900 md:text-[1.6rem]">
            Compare plans
          </h2>
          {/* desktop / tablet comparison table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="tbl min-w-[620px]">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th>Basic</th>
                  <th className="bg-teal-50/50">Premium</th>
                  <th>Hospital</th>
                </tr>
              </thead>
              <tbody>
                {TABLE.map((row) => (
                  <tr key={row[0]}>
                    <td className="font-semibold text-navy-800">{row[0]}</td>
                    {row.slice(1).map((cell, i) => (
                      <td key={i} className={i === 1 ? "bg-teal-50/50" : ""}>
                        {cell === "✓" ? (
                          <span className="inline-flex items-center gap-1 text-teal-700">
                            <IconCheck size={13} />
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

          {/* mobile: one compact block per feature, no horizontal scrolling */}
          <div className="card divide-y divide-line overflow-hidden md:hidden">
            {TABLE.map((row) => (
              <div key={row[0]} className="p-4">
                <p className="text-[0.82rem] font-bold text-navy-900">{row[0]}</p>
                <div className="mt-1.5 grid grid-cols-3 gap-2 text-[0.72rem]">
                  {["Basic", "Premium", "Hospital"].map((plan, i) => {
                    const cell = row[i + 1];
                    return (
                      <div key={plan}>
                        <span className="block text-[0.6rem] font-bold uppercase tracking-[0.08em] text-muted">
                          {plan}
                        </span>
                        {cell === "✓" ? (
                          <span className="mt-0.5 inline-flex text-teal-700">
                            <IconCheck size={13} />
                          </span>
                        ) : cell === "—" ? (
                          <span className="mt-0.5 inline-block text-muted">—</span>
                        ) : (
                          <span className="mt-0.5 block font-semibold text-navy-900">{cell}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Not sure which plan?"
        body="Start with Family Basic. Upgrade at any time."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "Contact Us", href: "/contact" }}
      />
    </>
  );
}
