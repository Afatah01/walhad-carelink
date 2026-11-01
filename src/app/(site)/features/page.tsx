import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import {
  IconAlert,
  IconArrow,
  IconBell,
  IconCard,
  IconChart,
  IconCheck,
  IconClock,
  IconDrop,
  IconFamily,
  IconHospital,
  IconInfo,
  IconLock,
  IconMonitor,
  IconPhone,
  IconPin,
  IconRefresh,
  IconSensor,
  IconShield,
  IconSms,
  IconTelegram,
  IconUsers,
  IconVolume,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Real-time glucose monitoring, family alerts, escalation, SMS, Telegram bot commands, location sharing, hospital monitoring and security controls.",
};

const GROUPS = [
  {
    title: "Glucose monitoring",
    blurb: "Clear readings, honest timestamps and charts that make trends obvious.",
    items: [
      { icon: IconDrop, title: "Current glucose", body: "Latest reading in mg/dL or mmol/L with a trend arrow and plain-language status." },
      { icon: IconChart, title: "24-hour, weekly & 90-day charts", body: "Daily curves, weekly averages and time-in-range bands." },
      { icon: IconSensor, title: "Sensor status", body: "Warm-up, active and expired states where your data source supports them." },
      { icon: IconClock, title: "Freshness indicators", body: "Live, delayed or not-current labels so stale readings are never shown as live." },
      { icon: IconRefresh, title: "Auto-sync with retries", body: "Background polling with exponential backoff and recorded failures." },
      { icon: IconInfo, title: "Time in range", body: "TIR, TBR and TAR computed from real readings — no invented numbers." },
    ],
  },
  {
    title: "Family alerts",
    blurb: "Multiple channels, deliberate escalation and a full acknowledgement trail.",
    items: [
      { icon: IconBell, title: "Low & high alerts", body: "Separate critical-low, low, high and very-high thresholds." },
      { icon: IconUsers, title: "Configurable recipients", body: "Choose who receives which channel, per patient." },
      { icon: IconAlert, title: "Escalation", body: "If nobody acknowledges in the configured window, the next contacts are notified." },
      { icon: IconSms, title: "SMS notifications", body: "Text messages within your plan allowance, with delivery state recorded." },
      { icon: IconTelegram, title: "Telegram bot", body: "/glucose, /history, /alerts, /acknowledge and inline acknowledge buttons." },
      { icon: IconVolume, title: "Audible ring", body: "In-dashboard ringing for critical readings, respecting browser autoplay rules." },
    ],
  },
  {
    title: "Safety & access",
    blurb: "Consent-first sharing and role-aware access to patient information.",
    items: [
      { icon: IconPin, title: "Location sharing", body: "Opt-in only, revocable at any moment, visible per recipient permission." },
      { icon: IconShield, title: "Role-based access", body: "Patient, family, caregiver, doctor, nurse and administrator roles." },
      { icon: IconLock, title: "Encrypted credentials", body: "Provider sessions sealed with AES-256-GCM and never sent to browsers." },
      { icon: IconHospital, title: "Hospital monitoring", body: "Ward dashboards, patient assignment and staff activity." },
      { icon: IconCard, title: "Plan-aware limits", body: "Recipient and SMS limits enforced from the plan catalogue." },
      { icon: IconMonitor, title: "Notification centre", body: "One timeline for alerts, deliveries, acknowledgements and system events." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title={
          <>
            Everything a care circle needs,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              nothing it doesn&apos;t
            </span>
          </>
        }
        body="A complete monitoring and alerting platform — designed to be understood by grandparents, teenagers and clinicians alike."
        actions={[
          { label: "See pricing", href: "/pricing" },
          { label: "How it works", href: "/how-it-works", variant: "ghost" },
        ]}
      />

      {GROUPS.map((group, gi) => (
        <section key={group.title} className={gi % 2 ? "bg-[#f7fafc]" : ""}>
          <div className="shell py-16">
            <Reveal>
              <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-end">
                <div>
                  <span className="eyebrow">{`0${gi + 1} — Capability group`}</span>
                  <h2 className="display-2 mt-2">{group.title}</h2>
                </div>
                <p className="max-w-md text-[0.92rem] leading-relaxed text-muted">{group.blurb}</p>
              </div>
            </Reveal>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Reveal key={item.title} delay={i * 40}>
                    <div className="card card-hover h-full p-5">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 ring-1 ring-brand-100">
                        <Icon size={19} />
                      </span>
                      <h3 className="mt-3.5 text-[0.94rem] font-bold text-navy-900">{item.title}</h3>
                      <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted">{item.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      <section className="shell py-16">
        <div className="rounded-[1.8rem] border border-line bg-white p-7 shadow-soft md:p-10">
          <SectionHeading
            eyebrow="What we will never do"
            title="Responsible monitoring, stated plainly"
            body="Trust is the product. These commitments are wired into the architecture, not just the marketing copy."
          />
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {[
              "Store your LibreLink or LibreView password in plain text — ever.",
              "Scrape Abbott services or bypass official authorisation.",
              "Present an old reading as if it were live glucose.",
              "Sell, share or repurpose patient data for advertising.",
              "Guarantee emergency response — we notify, humans act.",
              "Send patient data to Telegram accounts that are not linked and authorised.",
            ].map((rule) => (
              <div key={rule} className="flex items-start gap-2.5 rounded-xl bg-mist/60 p-3.5">
                <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-white text-low ring-1 ring-line">
                  <IconAlert size={11} />
                </span>
                <p className="text-[0.84rem] leading-relaxed text-navy-800">{rule}</p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/pricing" className="btn btn-primary">
              View plans <IconArrow size={16} />
            </Link>
            <Link href="/faq" className="btn btn-ghost">
              Read the FAQ
            </Link>
            <span className="pill pill-ok">
              <IconCheck size={12} /> Consent-first by default
            </span>
          </div>
        </div>
      </section>
    </>
  );
}
