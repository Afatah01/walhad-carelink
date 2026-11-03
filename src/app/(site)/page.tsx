import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/marketing/Hero";
import {
  BenefitsGrid,
  ChannelStrip,
  CtaBand,
  HowItWorksSteps,
  StatStrip,
  TelegramSample,
  TrustGrid,
} from "@/components/marketing/Sections";
import { Reveal } from "@/components/marketing/Reveal";
import { PricingGrid } from "@/components/marketing/PricingGrid";
import { brand } from "@/lib/brand";
import { listPlans } from "@/lib/billing/plans";
import { ensureSeed } from "@/lib/seed";
import { IconArrow, IconCheck, IconInfo, IconLock, IconShield, IconStethoscope } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Smarter Glucose Monitoring. Greater Peace of Mind.",
  description:
    "Walhad CareLink connects FreeStyle Libre glucose monitoring with family alerts, SMS, push and Telegram notifications — for families, caregivers and hospitals.",
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeed().catch(() => null);
  const plans = await listPlans().catch(() => []);
  const familyPlans = plans.filter((p) => p.slug !== "hospital").slice(0, 2);

  return (
    <>
      <Hero />

      {/* trust strip */}
      <section className="border-y border-line bg-white/80">
        <div className="shell flex flex-col items-center gap-4 py-5 md:flex-row md:justify-between">
          <p className="text-[0.72rem] font-bold uppercase tracking-[0.16em] text-muted">
            Alerts that reach the right people
          </p>
          <ChannelStrip />
        </div>
      </section>

      {/* benefits */}
      <section className="section" id="benefits">
        <div className="shell">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow justify-center">Everything in one calm dashboard</span>
              <h2 className="display-2 mt-3">Designed for the whole care circle</h2>
              <p className="lead mt-3">
                Patients, parents, caregivers and clinicians each get a clear, permission-aware view — with nine
                capabilities working together behind it.
              </p>
            </div>
          </Reveal>
          <div className="mt-10">
            <BenefitsGrid />
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="relative overflow-hidden bg-[#f7fafc] py-20">
        <div className="shell">
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
              <div className="max-w-xl">
                <span className="eyebrow">How it works</span>
                <h2 className="display-2 mt-3">Four steps to a connected family</h2>
                <p className="lead mt-3">
                  Data availability depends on the supported sensor, API access and synchronisation. We show you
                  exactly what is current — and what is not.
                </p>
              </div>
              <Link href="/how-it-works" className="btn btn-ghost">
                See the full walkthrough <IconArrow size={16} />
              </Link>
            </div>
          </Reveal>
          <div className="mt-9">
            <HowItWorksSteps />
          </div>
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#d9e8f5] bg-white/80 p-3.5">
            <IconInfo size={16} className="mt-0.5 flex-none text-brand-500" />
            <p className="text-[0.8rem] leading-relaxed text-muted">
              <strong className="font-bold text-navy-800">A note on Libre access.</strong> Abbott&apos;s official
              LibreView Data Sharing API is available through an approved partner programme. Where approval is
              pending, Walhad CareLink runs on a consented follower connection or your existing secure phone
              bridge — never on scraping, and never by storing your Libre password in plain text.
            </p>
          </div>
        </div>
      </section>

      {/* telegram + alerting */}
      <section className="section">
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <span className="eyebrow">Telegram that actually works</span>
            <h2 className="display-2 mt-3">A real bot, not a decorative button</h2>
            <p className="lead mt-3">
              Family members link their own Telegram account with a single-use code. From then on they can check
              glucose, review history, read alerts and acknowledge — all inside the app they already use.
            </p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {[
                "/start · /help",
                "/glucose · /history",
                "/alerts · /acknowledge",
                "/status · /settings",
                "Inline acknowledge buttons",
                "Delivery + error tracking",
              ].map((cmd) => (
                <li key={cmd} className="flex items-center gap-2 text-[0.85rem] font-semibold text-navy-800">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <IconCheck size={11} />
                  </span>
                  <span className="kbd">{cmd}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="pill pill-ok">
                <IconLock size={12} /> Webhook secret verified
              </span>
              <span className="pill pill-brand">
                <IconShield size={12} /> Token stays server-side
              </span>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <TelegramSample />
          </Reveal>
        </div>
      </section>

      {/* proof / stats */}
      <section className="bg-[#f7fafc] py-16">
        <div className="shell">
          <div className="mx-auto max-w-3xl text-center">
            <span className="eyebrow justify-center">Built for real family routines</span>
            <h2 className="display-2 mt-3">Clarity instead of constant worry</h2>
          </div>
          <div className="mt-8">
            <StatStrip
              items={[
                { value: "9", label: "Alert & monitoring capabilities", hint: "All included features" },
                { value: "4", label: "Delivery channels", hint: "Push · SMS · Telegram · Audible" },
                { value: "3", label: "Languages", hint: "English · Somali · Arabic" },
                { value: "24/7", label: "Continuous sync", hint: "With retry & failure states" },
              ]}
            />
          </div>
          <div className="mt-8">
            <TrustGrid />
          </div>
        </div>
      </section>

      {/* pricing teaser */}
      {familyPlans.length ? (
        <section className="section">
          <div className="shell">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <span className="eyebrow justify-center">Simple monthly plans</span>
                <h2 className="display-2 mt-3">Start with the plan that fits your family</h2>
                <p className="lead mt-3">
                  Every family plan includes Telegram Bot notifications, glucose history and family alert
                  management. Upgrade whenever you need more people connected.
                </p>
              </div>
            </Reveal>
            <div className="mt-10">
              <PricingGrid plans={familyPlans} compact />
            </div>
            <div className="mt-6 text-center">
              <Link href="/pricing" className="btn btn-ghost">
                Compare all plans <IconArrow size={16} />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* hospital band */}
      <section className="shell pb-16">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2rem] border border-line bg-gradient-to-br from-[#f3f9ff] to-[#f0fbf7] p-7 md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <span className="pill pill-brand">
              <IconStethoscope size={13} /> Hospital & clinic monitoring
            </span>
            <h2 className="display-2 mt-4">One dashboard for every monitored patient</h2>
            <p className="lead mt-3">
              Assign patients to doctors and nurses, watch for critical glucose alerts across a ward, and export
              clinical reports. Staff permissions keep patient data inside the care team.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact?topic=hospital" className="btn btn-primary">
                Talk to our team <IconArrow size={16} />
              </Link>
              <Link href="/contact?topic=hospital" className="btn btn-ghost">
                Talk to sales
              </Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[300px]">
            <Image
              src={brand.logo.full}
              alt={`${brand.suite} brand`}
              width={520}
              height={520}
              className="w-full rounded-3xl bg-white object-contain p-3 shadow-card ring-1 ring-line"
            />
          </div>
        </div>
      </section>

      <CtaBand
        title="Ready to keep your family connected?"
        body="Start with Family Basic today, or talk to us about hospital-wide monitoring. Every plan includes Telegram alerts, glucose history and a real family notification centre."
        primary={{ label: "Get Started", href: "/pricing" }}
        secondary={{ label: "Talk to our team", href: "/contact" }}
      />
    </>
  );
}
