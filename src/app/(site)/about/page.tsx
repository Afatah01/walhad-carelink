import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { CtaBand, TrustGrid } from "@/components/marketing/Sections";
import { brand } from "@/lib/brand";
import {
  IconArrow,
  IconChart,
  IconDrop,
  IconFamily,
  IconHospital,
  IconPin,
  IconShield,
  IconSpark,
  IconStethoscope,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Helping families stay connected, informed, and prepared through intelligent glucose monitoring technology.",
};

const PILLARS = [
  {
    icon: IconFamily,
    title: "Family protection",
    body: "Diabetes is rarely managed alone. Walhad CareLink was shaped around the people who already check in by phone — parents, spouses, siblings and carers — and gives them a faster, calmer way to do it.",
  },
  {
    icon: IconDrop,
    title: "Our technology",
    body: "We integrate with the FreeStyle Libre ecosystem through authorised data access. Where partner approval is pending, we run on consented follower connections or your existing secure bridge — never on scraping.",
  },
  {
    icon: IconPin,
    title: "Remote monitoring",
    body: "Readings, trends and alerts reach authorised people wherever they are, with location sharing that is opt-in and instantly revocable.",
  },
  {
    icon: IconStethoscope,
    title: "Healthcare partnerships",
    body: "Hospitals and clinics use the same platform to watch a whole ward, assign patients to staff and document acknowledgements for review.",
  },
];

const VALUES = [
  { icon: IconShield, title: "Security by default", body: "Encrypted credentials, role-based access and audited actions." },
  { icon: IconChart, title: "Honest data", body: "If a reading is stale or missing, we say so — clearly." },
  { icon: IconSpark, title: "Simplicity", body: "Large numbers, plain labels and no medical jargon on family screens." },
  { icon: IconHospital, title: "Clinical respect", body: "We support professional care and never claim to replace it." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About Walhad CareLink"
        title={
          <>
            Helping families stay connected, informed,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              and prepared
            </span>
          </>
        }
        body="Through intelligent glucose monitoring technology."
        actions={[
          { label: "Explore the platform", href: "/features" },
          { label: "Contact us", href: "/contact", variant: "ghost" },
        ]}
      />

      <section className="shell py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <span className="eyebrow">Our mission</span>
            <h2 className="display-2 mt-3">Calm technology for a condition that never pauses</h2>
            <div className="mt-4 space-y-4 text-[0.95rem] leading-relaxed text-muted">
              <p>
                A glucose reading is only useful when the right person sees it in time. Walhad CareLink exists to
                close that gap — turning a stream of numbers into a short, actionable message that reaches a family
                member or a nurse before a difficult moment becomes a dangerous one.
              </p>
              <p>
                We built the platform around three ideas: readings must be honest about their age, alerts must
                reach people on the channels they actually use, and patients must stay in control of who sees what.
              </p>
              <p>
                The name <strong className="font-bold text-navy-800">Walhad</strong> speaks to connection and
                kinship. <strong className="font-bold text-navy-800">CareLink</strong> is the promise: a link
                between the person wearing the sensor and the people who care about them.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="pill pill-brand">FreeStyle Libre connected</span>
              <span className="pill pill-teal">Consent-based sharing</span>
              <span className="pill pill-muted">England · Somalia · Arabic</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-3 -z-10 rounded-[2.2rem] bg-gradient-to-br from-brand-100/60 to-teal-100/60 blur-xl" />
            <Image
              src={brand.logo.full}
              alt={brand.suite}
              width={640}
              height={640}
              className="w-full rounded-[1.8rem] border border-line bg-white object-contain p-4 shadow-card"
            />
            <p className="mt-3 text-center text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {brand.tagline}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f7fafc] py-16">
        <div className="shell">
          <div className="grid gap-4 md:grid-cols-2">
            {PILLARS.map((p, i) => {
              const Icon = p.icon;
              return (
                <Reveal key={p.title} delay={i * 60}>
                  <div className="card h-full p-6">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-line">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-[1.05rem] font-extrabold text-navy-900">{p.title}</h3>
                    <p className="mt-2 text-[0.88rem] leading-relaxed text-muted">{p.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="eyebrow">Our commitment</span>
            <h2 className="display-2 mt-3">Secure and responsible monitoring</h2>
            <p className="lead mt-3">
              Healthcare data deserves healthcare-grade care. We design for privacy regulations including HIPAA
              where applicable, GDPR-style data minimisation, and local requirements in the regions we serve.
            </p>
            <ul className="mt-5 space-y-3">
              {[
                "Consent records for every shared patient relationship.",
                "Audit logs for administrative and clinical actions.",
                "Encryption of provider credentials at rest.",
                "Clear escalation between roles and organisations.",
                "No advertising use of health data — ever.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[0.88rem] text-navy-800">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-teal-500" />
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/legal/privacy" className="btn btn-ghost mt-6">
              Read our privacy approach <IconArrow size={15} />
            </Link>
          </div>
          <div>
            <TrustGrid />
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="shell">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <div key={v.title} className="rounded-2xl border border-line bg-white p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-mist text-navy-700">
                    <Icon size={17} />
                  </span>
                  <p className="mt-3 text-[0.9rem] font-bold text-navy-900">{v.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{v.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CtaBand
        title="Bring your care circle together"
        body="Start with the family plan that fits your household, or talk to us about monitoring across a hospital ward."
        primary={{ label: "View pricing", href: "/pricing" }}
        secondary={{ label: "Contact our team", href: "/contact" }}
      />
    </>
  );
}
