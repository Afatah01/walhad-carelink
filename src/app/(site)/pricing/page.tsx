import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { PricingGrid } from "@/components/marketing/PricingGrid";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";
import { IconCheck } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Family Basic $30/month, Family Premium $50/month, and custom hospital plans from $100/month.",
};

export const dynamic = "force-dynamic";

const ROWS: [string, string, string, string][] = [
  ["Monitored patients", "1", "1", "Custom"],
  ["Alert recipients", "2", "5", "Unlimited staff"],
  ["Low & high alerts", "✓", "✓", "✓"],
  ["Rapid-change alerts", "—", "✓", "✓"],
  ["SMS allowance", "100/mo", "400/mo", "Negotiated"],
  ["Telegram alerts", "✓", "✓", "✓"],
  ["Audible ring", "✓", "✓", "✓"],
  ["Location sharing", "—", "✓", "✓"],
  ["Hospital dashboard", "—", "—", "✓"],
  ["Staff accounts", "—", "—", "✓"],
];

export default async function PricingPage() {
  await ensureSeed().catch(() => null);
  const plans = await listPlans().catch(() => []);

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Simple monthly plans"
        body="Three plans. Cancel any time. Payment activates your workspace."
      />

      <section className="shell -mt-6 pb-12">
        <PricingGrid plans={plans} />
        <p className="mt-5 text-center text-[0.8rem] text-muted">
          A plan activates only after the payment provider confirms the transaction.
        </p>
      </section>

      <section className="shell pb-16">
        <h2 className="display-2 mb-4">Compare</h2>
        <div className="card overflow-x-auto">
          <table className="tbl min-w-[640px]">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Basic</th>
                <th className="bg-brand-50/40">Premium</th>
                <th>Hospital</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
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

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white p-5">
          <p className="text-[0.9rem] font-bold text-navy-900">Ready to start?</p>
          <div className="flex gap-2">
            <Link href="/signup" className="btn btn-primary btn-sm">
              Create account
            </Link>
            <Link href="/contact?topic=hospital" className="btn btn-ghost btn-sm">
              Ask about Hospital
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
