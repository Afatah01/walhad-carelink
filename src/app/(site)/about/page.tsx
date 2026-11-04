import type { Metadata } from "next";
import Link from "next/link";
import { IconArrow, IconDrop, IconFamily, IconLock, IconShield } from "@/components/ui/Icons";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/site/Layout";
import { CareIllustration } from "@/components/site/Mockups";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Walhad CareLink connects patients, families and healthcare teams through accessible glucose monitoring technology.",
};

const VALUES = [
  {
    icon: <IconLock size={26} />,
    title: "Patient privacy",
    body: "Access is granted by the patient, recorded, and can be withdrawn at any time.",
  },
  {
    icon: <IconDrop size={26} />,
    title: "Real sensor data",
    body: "Readings come from an authorised sensor connection — never simulated or invented.",
  },
  {
    icon: <IconFamily size={26} />,
    title: "Connected care",
    body: "Family and clinicians see the same picture, so nobody is working from stale information.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Walhad CareLink"
        title="Technology that brings care closer."
        body="Connecting patients, families and healthcare teams through accessible glucose monitoring technology."
        tone="aqua"
        aside={<CareIllustration />}
      >
        <Link href="/products" className="btn btn-primary">
          See our products <IconArrow size={15} />
        </Link>
      </PageHero>

      {/* editorial mission / vision */}
      <Section tone="white">
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          <article className="relative overflow-hidden rounded-[22px] border border-line bg-white p-8 md:p-10">
            <span className="absolute left-0 top-0 h-full w-1 bg-teal-500" aria-hidden />
            <p className="eyebrow">Our mission</p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-[1.35rem] font-semibold leading-snug tracking-[-0.02em] text-deep md:text-[1.6rem]">
              Make glucose monitoring more accessible and help families stay informed.
            </p>
          </article>

          <article className="relative overflow-hidden rounded-[22px] border border-line bg-white p-8 md:p-10">
            <span className="absolute left-0 top-0 h-full w-1 bg-brand-500" aria-hidden />
            <p className="eyebrow text-brand-500">Our vision</p>
            <p className="mt-4 font-[family-name:var(--font-display)] text-[1.35rem] font-semibold leading-snug tracking-[-0.02em] text-deep md:text-[1.6rem]">
              Build a trusted connected-care platform for families and healthcare organisations.
            </p>
          </article>
        </div>
      </Section>

      {/* values — three columns, deliberately asymmetric from the home tiles */}
      <Section tone="page">
        <div className="grid gap-10 lg:grid-cols-[0.36fr_0.64fr] lg:gap-16">
          <SectionHead
            eyebrow="Our values"
            title="The principles behind every decision."
            body="Three commitments shape what we build, what we store and who can see it."
          />

          <div className="divide-y divide-line border-t border-line">
            {VALUES.map((v, i) => (
              <div key={v.title} className="flex items-start gap-5 py-6 md:gap-7">
                <span className="mt-0.5 w-9 flex-none font-[family-name:var(--font-display)] text-[0.85rem] font-bold text-[#b3c1c7]">
                  0{i + 1}
                </span>
                <span
                  className={`grid h-12 w-12 flex-none place-items-center rounded-[14px] ${
                    i === 0 ? "bg-aqua text-teal-500" : i === 1 ? "bg-softblue text-brand-500" : "bg-amber-soft text-warning"
                  }`}
                >
                  {v.icon}
                </span>
                <div>
                  <h3 className="h-card">{v.title}</h3>
                  <p className="body-sm mt-1.5 max-w-[420px]">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* closing — a quiet quote-style band */}
      <Section tone="aqua" tight>
        <div className="mx-auto max-w-[720px] text-center">
          <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-white text-teal-500 shadow-sm">
            <IconShield size={22} />
          </span>
          <p className="font-[family-name:var(--font-display)] text-[1.25rem] font-semibold leading-snug tracking-[-0.02em] text-deep md:text-[1.5rem]">
            Built around the FreeStyle Libre ecosystem, so families can keep using the sensor they already trust.
          </p>
          <p className="body-sm mx-auto mt-3 max-w-[520px]">
            Walhad CareLink is an independent platform and is not affiliated with Abbott.
          </p>
        </div>
      </Section>

      <CtaBand
        title="See how the platform fits your family or ward."
        primary={{ label: "Our Products", href: "/products" }}
        secondary={{ label: "Contact Us", href: "/contact" }}
      />
    </>
  );
}
