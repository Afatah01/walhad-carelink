import type { Metadata } from "next";
import Link from "next/link";
import { IconArrow, IconBell, IconCheck, IconDrop, IconFamily, IconLock, IconShield } from "@/components/ui/Icons";
import { CtaBand, Section, SectionHead } from "@/components/site/Layout";
import { DashboardMockup, PhoneMockup } from "@/components/site/Mockups";
import { PlanCard } from "@/components/site/Layout";
import { getPlan } from "@/lib/billing/plans";

export const metadata: Metadata = {
  title: "Glucose monitoring, connected with care",
  description:
    "Stay connected to real glucose readings. Receive timely alerts and keep your family informed through Walhad CareLink.",
};

const ADVANTAGES = [
  {
    icon: <IconDrop size={24} />,
    title: "Real-time monitoring",
    body: "Readings arrive from your FreeStyle Libre sensor through an authorised connection.",
  },
  {
    icon: <IconBell size={24} />,
    title: "Smart glucose alerts",
    body: "Low, high and rapid-change events notify the people who can act.",
  },
  {
    icon: <IconFamily size={24} />,
    title: "Family connectivity",
    body: "Invite family and caregivers with permissions you control.",
  },
  {
    icon: <IconLock size={24} />,
    title: "Secure data sharing",
    body: "Only the people you authorise can see your glucose information.",
  },
];

const STEPS = [
  { n: "01", title: "Subscribe", body: "Choose the plan that fits your household." },
  { n: "02", title: "Connect", body: "Link your authorised sensor source." },
  { n: "03", title: "Monitor", body: "Follow readings and alerts in one place." },
];

const TRUST = [
  { icon: <IconShield size={14} />, label: "Secure & encrypted" },
  { icon: <IconDrop size={14} />, label: "Real sensor data" },
  { icon: <IconLock size={14} />, label: "Patient-controlled sharing" },
];

const DARK_POINTS = [
  { title: "One live picture", body: "Readings, alerts and family status on a single screen." },
  { title: "Everyone in step", body: "Caregivers see the same information at the same moment." },
  { title: "Clear audit trail", body: "Every alert and every access is recorded." },
];

export default async function HomePage() {
  const [basic, premium, hospital] = await Promise.all([
    getPlan("family-basic").catch(() => null),
    getPlan("family-premium").catch(() => null),
    getPlan("hospital").catch(() => null),
  ]);

  const plans = [
    {
      name: "Family Basic",
      price: Math.round((basic?.price_cents ?? 3000) / 100),
      from: false,
      blurb: "One patient, essential alerts.",
      features: ["1 monitored patient", "2 alert recipients", "Low and high alerts", "Telegram alerts"],
      cta: "Choose Family Basic",
      href: "/signup?plan=family-basic",
      recommended: false,
    },
    {
      name: "Family Premium",
      price: Math.round((premium?.price_cents ?? 5000) / 100),
      from: false,
      blurb: "Every alert type, more caregivers.",
      features: ["1 monitored patient", "5 alert recipients", "Rapid-change alerts", "Location sharing"],
      cta: "Choose Family Premium",
      href: "/signup?plan=family-premium",
      recommended: true,
    },
    {
      name: "Custom & Hospital",
      price: Math.round((hospital?.price_cents ?? 10000) / 100),
      from: true,
      blurb: "For clinics and healthcare teams.",
      features: ["Custom patient capacity", "Staff accounts and roles", "Hospital dashboard", "Patient assignment"],
      cta: "Contact Sales",
      href: "/contact?topic=hospital",
      recommended: false,
    },
  ];

  return (
    <>
      {/* ---------------- 1. hero ---------------- */}
      <section className="hero-wash relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="blob blob-aqua -left-32 top-10 h-[420px] w-[420px] opacity-80" />
          <span className="blob blob-blue right-0 top-40 h-[380px] w-[380px] opacity-70" />
          <span className="ring-faint -right-16 -top-16 h-[300px] w-[300px]" />
        </div>

        <div className="shell relative">
          <div className="grid items-center gap-12 py-12 md:py-16 lg:grid-cols-[0.48fr_0.52fr] lg:gap-10 lg:py-20">
            {/* left */}
            <div>
              <p className="eyebrow">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
                Connected glucose monitoring
              </p>

              <h1 className="h-hero mt-4">
                Glucose monitoring,
                <br />
                <span className="text-teal-500">connected with care.</span>
              </h1>

              <p className="body-lg mt-5">
                Stay connected to real glucose readings. Receive timely alerts and keep your family informed through
                Walhad CareLink.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/signup" className="btn btn-primary btn-lg w-full sm:w-auto">
                  Get Started
                  <IconArrow size={16} />
                </Link>
                <Link href="/how-it-works" className="btn btn-ghost btn-lg w-full sm:w-auto">
                  Explore How It Works
                </Link>
              </div>

              <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5">
                {TRUST.map((t) => (
                  <li key={t.label} className="flex items-center gap-1.5 text-[0.8rem] font-medium text-muted">
                    <span className="text-teal-500">{t.icon}</span>
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* right — product illustration */}
            <div className="relative">
              <span className="ring-faint absolute -left-8 top-4 hidden h-44 w-44 lg:block" aria-hidden />
              <span className="ring-faint absolute -bottom-2 right-0 hidden h-28 w-28 lg:block" aria-hidden />

              <div className="relative mx-auto max-w-[540px] pb-4 sm:pb-20">
                {/* ambient glow behind the product */}
                <span
                  className="pointer-events-none absolute inset-x-2 bottom-6 top-4 rounded-[44px] bg-gradient-to-br from-[#dceff0]/70 via-[#e6f0fa]/50 to-transparent blur-2xl"
                  aria-hidden
                />

                {/* dashboard is the primary object */}
                <div className="relative pl-8 sm:pl-12">
                  <DashboardMockup caption="" />
                </div>

                {/* phone overlaps only the lower-left corner */}
                <div className="absolute -bottom-2 -left-3 hidden w-[236px] origin-bottom-left scale-[0.58] sm:block sm:-left-5 sm:scale-[0.66] lg:-left-6">
                  <PhoneMockup caption="" />
                </div>

                {/* floating status chip */}
                <div className="absolute -top-3 right-0 hidden items-center gap-2 rounded-xl border border-line bg-white/95 px-3 py-2 shadow-[0_10px_28px_-14px_rgba(20,50,60,0.35)] backdrop-blur sm:flex">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-aqua text-teal-500">
                    <IconCheck size={14} />
                  </span>
                  <div>
                    <p className="text-[0.68rem] font-semibold leading-tight text-ink">Alerts delivered</p>
                    <p className="text-[0.6rem] leading-tight text-muted">Family + clinician</p>
                  </div>
                </div>
              </div>

              <p className="mt-12 text-center text-[0.7rem] font-medium tracking-wide text-faint lg:mt-9 lg:text-right">
                Illustrative interface — not live patient data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 2. advantages ---------------- */}
      <Section tone="white">
        <SectionHead
          eyebrow="Why Walhad CareLink"
          title="Care that keeps everyone connected."
          body="Four things that matter most to families — and what the platform does about each."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ADVANTAGES.map((a, i) => (
            <div key={a.title} className="group card card-hover p-[26px]">
              <span className={`icon-tile ${i === 1 ? "icon-tile-amber" : i === 2 ? "icon-tile-blue" : ""}`}>
                {a.icon}
              </span>
              <h3 className="h-card mt-5">{a.title}</h3>
              <p className="body-sm mt-2">{a.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ---------------- 3. how it works ---------------- */}
      <Section tone="aqua">
        <div className="grid gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:items-center lg:gap-16">
          <SectionHead
            eyebrow="How it works"
            title="Three steps to connected care."
            body="No new hardware. Connect the source you already use and the platform handles the rest."
          />

          <div className="relative">
            {/* connecting line */}
            <span
              className="absolute left-[28px] top-7 hidden h-[calc(100%-56px)] w-px bg-gradient-to-b from-teal-300 to-transparent sm:block lg:left-7 lg:top-[28px] lg:h-px lg:w-[calc(100%-56px)] lg:bg-gradient-to-r"
              aria-hidden
            />
            <ol className="relative grid gap-6 sm:gap-8 lg:grid-cols-3 lg:gap-6">
              {STEPS.map((s, i) => (
                <li key={s.n} className="flex items-start gap-4 lg:block">
                  <span className="relative z-10 grid h-14 w-14 flex-none place-items-center rounded-full border border-[#cfe4e6] bg-white font-[family-name:var(--font-display)] text-[0.95rem] font-bold text-teal-500 shadow-[0_6px_18px_-10px_rgba(20,50,60,0.35)]">
                    {s.n}
                  </span>
                  <div className="lg:mt-5">
                    <h3 className="h-card">{s.title}</h3>
                    <p className="body-sm mt-1.5 max-w-[240px]">{s.body}</p>
                    {i === 2 ? (
                      <Link
                        href="/how-it-works"
                        className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-teal-500 transition hover:gap-1.5"
                      >
                        See the full process <IconArrow size={13} />
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ---------------- 4. dark feature showcase ---------------- */}
      <section className="bg-deep section relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute -left-24 top-0 h-[380px] w-[380px] rounded-full bg-[#1197a1]/20 blur-3xl" />
          <span className="absolute -bottom-32 right-0 h-[420px] w-[420px] rounded-full bg-[#1769d2]/16 blur-3xl" />
          <span className="absolute inset-0 dotted-teal opacity-[0.14]" />
        </div>

        <div className="shell relative">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-on-dark">The platform</p>
              <h2 className="h-section mt-3 text-white">Your care network, in one place.</h2>
              <p className="mt-3.5 max-w-[480px] text-[1rem] leading-relaxed text-[#a9c9cd]">
                Patients, family members and clinicians see the same picture — with permissions and history behind it.
              </p>

              <ul className="mt-8 space-y-5">
                {DARK_POINTS.map((p) => (
                  <li key={p.title} className="flex gap-3.5">
                    <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg bg-white/10 text-[#7fd0d6]">
                      <IconCheck size={14} />
                    </span>
                    <div>
                      <p className="text-[0.95rem] font-semibold text-white">{p.title}</p>
                      <p className="mt-0.5 text-[0.85rem] leading-relaxed text-[#8fb0b5]">{p.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <Link
                href="/features"
                className="mt-8 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#7fd0d6] transition hover:gap-2 hover:text-white"
              >
                See all capabilities <IconArrow size={14} />
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-sm md:p-4">
                <DashboardMockup caption="" />
              </div>
              <p className="mt-3 text-center text-[0.7rem] font-medium tracking-wide text-[#7f9fa4]">
                Illustrative interface — not live patient data
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- 5. pricing preview ---------------- */}
      <Section tone="white">
        <SectionHead
          eyebrow="Pricing"
          title="Simple plans. Connected care."
          body="Start with a household plan. Move to a hospital workspace when your team needs it."
          align="center"
        />
        <div className="mt-11 grid items-stretch gap-5 lg:grid-cols-3">
          {plans.map((p) => (
            <PlanCard key={p.name} {...p} />
          ))}
        </div>
        <p className="mt-6 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-teal-500 transition hover:gap-2"
          >
            Compare all plans <IconArrow size={14} />
          </Link>
        </p>
      </Section>

      {/* ---------------- 6. final CTA ---------------- */}
      <CtaBand
        title="Stay informed. Stay connected."
        body="Set up your first monitored patient in minutes."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />
    </>
  );
}
