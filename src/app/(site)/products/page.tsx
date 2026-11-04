import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import Link from "next/link";
import { IconArrow, IconFamily, IconStethoscope } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Products",
  description: "Family monitoring and hospital monitoring.",
};

const PRODUCTS = [
  {
    icon: IconFamily,
    name: "Family",
    href: "/signup",
    cta: "Create account",
    body: "One patient, a small care circle, and alerts that reach the right person.",
    points: ["Live glucose from an authorised Libre source", "Low, high and rapid-change alerts", "Up to 5 family recipients"],
  },
  {
    icon: IconStethoscope,
    name: "Hospital",
    href: "/contact?topic=hospital",
    cta: "Talk to us",
    body: "Custom capacity for clinics that monitor many patients at once.",
    points: ["Staff accounts and roles", "Assigned patient lists", "Ward dashboard and reports"],
  },
];

export default function ProductsPage() {
  return (
    <>
      <PageHero eyebrow="Products" title="Two ways to monitor" body="Built on the same glucose engine." />

      <section className="shell pb-14">
        <div className="grid gap-4 md:grid-cols-2">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.name} className="card flex flex-col p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon size={20} />
                </span>
                <h2 className="mt-4 text-[1.15rem] font-extrabold text-navy-900">{p.name}</h2>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">{p.body}</p>
                <ul className="mt-4 flex-1 space-y-1.5">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2 text-[0.8rem] text-navy-800/85">
                      <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-brand-500" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <Link href={p.href} className="btn btn-primary btn-sm mt-5 w-fit">
                  {p.cta} <IconArrow size={14} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <CtaBand
        title="Not sure which fits?"
        body="Family plans start at $30/month. Hospital plans from $100."
        primary={{ label: "See pricing", href: "/pricing" }}
        secondary={{ label: "Contact", href: "/contact" }}
      />
    </>
  );
}
