import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/marketing/Hero";
import { CtaBand } from "@/components/marketing/Sections";
import { PricingGrid } from "@/components/marketing/PricingGrid";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";
import { IconArrow, IconBell, IconStethoscope, IconUsers } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Walhad CareLink — Glucose monitoring with real alerts",
  description:
    "Connect a FreeStyle Libre sensor and share real glucose readings with the people who care for you.",
};

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: IconUsers, title: "Create an account", body: "Pick a plan and sign up in a minute." },
  { icon: IconBell, title: "Connect a sensor", body: "Link an authorised Libre source." },
  { icon: IconStethoscope, title: "Monitor", body: "Live readings and alerts for your care circle." },
];

export default async function HomePage() {
  await ensureSeed().catch(() => null);
  const plans = await listPlans().catch(() => []);

  return (
    <>
      <Hero />

      <section className="shell py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card p-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">Step {i + 1}</p>
                <h2 className="mt-1 text-[1rem] font-extrabold text-navy-900">{s.title}</h2>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f7fafc] py-14" id="pricing">
        <div className="shell">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display-2">Plans</h2>
              <p className="lead mt-2">Three plans. Cancel any time.</p>
            </div>
            <Link href="/pricing" className="text-[0.82rem] font-bold text-brand-700 hover:underline">
              Compare plans <IconArrow size={14} className="inline" />
            </Link>
          </div>
          <PricingGrid plans={plans} compact />
        </div>
      </section>

      <CtaBand
        title="Start monitoring today"
        body="Create an account, connect a sensor, share readings with your family."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "Sign in", href: "/login" }}
      />
    </>
  );
}
