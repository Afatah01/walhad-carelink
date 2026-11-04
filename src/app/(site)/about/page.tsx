import type { Metadata } from "next";
import { PageHeader, Section, CtaBand } from "@/components/site/PageKit";
import { IconDrop, IconLock, IconShield, IconUsers, IconMonitor } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Walhad CareLink is a digital healthcare monitoring platform connecting patients, families and healthcare providers.",
};

const COMMITMENTS = [
  { icon: <IconLock size={17} />, label: "Patient privacy" },
  { icon: <IconShield size={17} />, label: "Secure information management" },
  { icon: <IconDrop size={17} />, label: "Real sensor data" },
  { icon: <IconMonitor size={17} />, label: "Responsible monitoring" },
  { icon: <IconUsers size={17} />, label: "Accessible digital healthcare" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="About Walhad CareLink"
        intro="Walhad CareLink is a digital healthcare monitoring platform designed to connect patients, families and healthcare providers through accessible glucose monitoring technology."
      />

      <Section>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6 md:p-8">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-teal-600">Our Mission</p>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-navy-800">
              Make glucose monitoring more accessible and help families remain informed and connected.
            </p>
          </div>
          <div className="card p-6 md:p-8">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-brand-600">Our Vision</p>
            <p className="mt-3 text-[1.05rem] leading-relaxed text-navy-800">
              Build a trusted digital healthcare ecosystem that supports connected care and better-informed
              families.
            </p>
          </div>
        </div>
      </Section>

      <Section tone="mist" title="Our Commitment">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COMMITMENTS.map((c) => (
            <div key={c.label} className="flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-teal-50 text-teal-600">
                {c.icon}
              </span>
              <p className="text-[0.88rem] font-semibold text-navy-900">{c.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Questions about how we work?"
        primary={{ label: "Contact Us", href: "/contact" }}
        secondary={{ label: "Our Products", href: "/products" }}
      />
    </>
  );
}
