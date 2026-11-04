import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Section } from "@/components/site/PageKit";
import { IconArrow, IconCheck, IconFamily, IconStethoscope } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Our Products",
  description: "Family monitoring and hospital monitoring from Walhad CareLink.",
};

const PRODUCTS = [
  {
    id: "family",
    icon: <IconFamily size={24} />,
    tone: "teal",
    name: "Family Monitoring",
    tagline: "Personal glucose monitoring with connected family support.",
    points: [
      "One primary patient",
      "Family and caregiver connections",
      "Glucose monitoring dashboard",
      "Customisable alerts",
      "Authorised data sharing",
    ],
    href: "/signup",
    cta: "Explore Family Monitoring",
  },
  {
    id: "hospital",
    icon: <IconStethoscope size={24} />,
    tone: "blue",
    name: "Hospital Monitoring",
    tagline: "Centralised glucose monitoring for hospitals and healthcare organisations.",
    points: [
      "Multiple patient monitoring",
      "Healthcare staff accounts",
      "Patient assignments",
      "Ward monitoring dashboard",
      "Monitoring reports",
    ],
    href: "/signup?plan=hospital",
    cta: "Explore Hospital Monitoring",
  },
];

export default function ProductsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Our Products"
        title="Two ways to monitor"
        intro="Family monitoring for households. Hospital monitoring for clinical teams."
      />

      <Section>
        <div className="grid gap-5 lg:grid-cols-2">
          {PRODUCTS.map((p) => (
            <div key={p.id} className="card flex flex-col overflow-hidden">
              <div className={`h-1 w-full ${p.tone === "teal" ? "bg-teal-500" : "bg-brand-500"}`} />
              <div className="flex flex-1 flex-col p-6 md:p-8">
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${
                    p.tone === "teal" ? "bg-teal-50 text-teal-600" : "bg-brand-50 text-brand-600"
                  }`}
                >
                  {p.icon}
                </span>
                <h2 className="mt-4 text-[1.3rem] font-extrabold tracking-[-0.02em] text-navy-900">{p.name}</h2>
                <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted">{p.tagline}</p>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.88rem] text-navy-800">
                      <span
                        className={`mt-0.5 grid h-4.5 w-4.5 flex-none place-items-center rounded-full ${
                          p.tone === "teal" ? "bg-teal-50 text-teal-600" : "bg-brand-50 text-brand-600"
                        }`}
                        style={{ height: 18, width: 18 }}
                      >
                        <IconCheck size={10} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.href}
                  className={`btn mt-6 w-full ${p.tone === "teal" ? "btn-primary" : "btn-ghost"}`}
                >
                  {p.cta} <IconArrow size={15} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
