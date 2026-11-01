import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/marketing/PageHero";
import { HowItWorksSteps, CtaBand } from "@/components/marketing/Sections";
import { Reveal } from "@/components/marketing/Reveal";
import {
  IconArrow,
  IconBell,
  IconCheck,
  IconClock,
  IconDrop,
  IconGlobe,
  IconInfo,
  IconRefresh,
  IconSensor,
  IconShield,
  IconTelegram,
  IconUsers,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Four steps from an authorised FreeStyle Libre account to real-time family alerts — with honest notes about API availability and data sync.",
};

const DETAILS = [
  {
    step: "Step 1",
    title: "Authorise your Libre data source",
    icon: IconShield,
    points: [
      "Choose an approved connection path: LibreView partner API, a consented LibreLinkUp follower session, or your existing secure phone bridge.",
      "Credentials are encrypted with AES-256-GCM before storage and are never returned to the browser.",
      "You can revoke access at any time; revoking stops syncing immediately.",
    ],
  },
  {
    step: "Step 2",
    title: "Let readings sync",
    icon: IconRefresh,
    points: [
      "The platform polls your data source on a schedule and stores each reading with its original timestamp.",
      "Duplicates are ignored, so re-fetching a window never inflates history.",
      "If the source is unreachable, retries back off and the dashboard shows a connection warning instead of pretending data is live.",
    ],
  },
  {
    step: "Step 3",
    title: "Invite the people you trust",
    icon: IconUsers,
    points: [
      "Family members and caregivers are added through the existing supported account functionality.",
      "Each recipient has their own channel preferences: push, SMS, Telegram, audible and in-app.",
      "Plan limits set the maximum number of alert recipients (2 on Family Basic, 5 on Family Premium).",
    ],
  },
  {
    step: "Step 4",
    title: "Watch, alert, acknowledge",
    icon: IconBell,
    points: [
      "Low, high and critical thresholds trigger notifications within seconds of being detected.",
      "If nobody acknowledges within the escalation window, the next contacts are notified.",
      "Every delivery and acknowledgement is stored in the notification centre for review.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From sensor to family alert in{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              four clear steps
            </span>
          </>
        }
        body="No technical knowledge required. If you can receive a text message, you can be part of the care circle."
        actions={[
          { label: "Get Started", href: "/pricing" },
          { label: "Read the FAQ", href: "/faq", variant: "ghost" },
        ]}
      />

      <section className="shell py-14">
        <HowItWorksSteps dense />
      </section>

      <section className="bg-[#f7fafc] py-16">
        <div className="shell space-y-4">
          {DETAILS.map((d, i) => {
            const Icon = d.icon;
            return (
              <Reveal key={d.title} delay={i * 50}>
                <div className="grid gap-5 rounded-2xl border border-line bg-white p-6 md:grid-cols-[auto_1fr] md:p-7">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-700 text-white shadow-[0_10px_22px_-14px_rgba(0,61,120,0.8)]">
                      <Icon size={21} />
                    </span>
                  </div>
                  <div>
                    <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.16em] text-teal-600">
                      {d.step}
                    </span>
                    <h3 className="mt-1 text-[1.15rem] font-extrabold text-navy-900">{d.title}</h3>
                    <ul className="mt-3 space-y-2">
                      {d.points.map((p) => (
                        <li key={p} className="flex items-start gap-2 text-[0.87rem] leading-relaxed text-muted">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-brand-400" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="shell py-16">
        <SectionHeading
          eyebrow="Setting expectations"
          title="What affects data availability"
          body="We would rather explain the limits than over-promise. These factors genuinely change what you will see."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: IconSensor,
              title: "Sensor & device",
              body: "Libre 2 and Libre 3 transmit differently. Some readers require a manual scan, and warm-up periods produce no readings.",
            },
            {
              icon: IconGlobe,
              title: "Country & account type",
              body: "Libre cloud access, follower invitations and API availability vary by region and by the app your clinic uses.",
            },
            {
              icon: IconShield,
              title: "Official API approval",
              body: "Abbott's Data Sharing API requires a partner agreement. Until approved, we run on your consented follower or bridge connection.",
            },
            {
              icon: IconClock,
              title: "Phones & internet",
              body: "If the patient's phone loses connectivity or the app is closed, readings stop arriving and alerts switch to a data warning.",
            },
            {
              icon: IconBell,
              title: "Device notification rules",
              body: "Mobile operating systems can suppress background audio. Ring alerts work best with the dashboard open.",
            },
            {
              icon: IconDrop,
              title: "Clinical interpretation",
              body: "Trends and time-in-range help conversations with your clinician. They are not a diagnosis.",
            },
          ].map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal key={c.title} delay={i * 40}>
                <div className="card h-full p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-mist text-navy-700">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-3 text-[0.92rem] font-bold text-navy-900">{c.title}</h3>
                  <p className="mt-1.5 text-[0.83rem] leading-relaxed text-muted">{c.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#d9e8f5] bg-[#f4faff] p-4">
          <IconInfo size={18} className="mt-0.5 flex-none text-brand-600" />
          <p className="text-[0.85rem] leading-relaxed text-navy-800">
            <strong className="font-bold">Never an emergency service.</strong> Walhad CareLink notifies authorised
            people. It does not dispatch ambulances, and it cannot guarantee delivery during network outages. In a
            medical emergency, contact local emergency services immediately.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="shell grid gap-4 md:grid-cols-3">
          {[
            { icon: IconTelegram, title: "Telegram in 30 seconds", body: "Open the dashboard, tap Connect Telegram, follow the deep link." },
            { icon: IconUsers, title: "Invite family", body: "Add up to 5 recipients and choose their channels." },
            { icon: IconCheck, title: "Acknowledge alerts", body: "One tap in the app, a reply in Telegram, or on the dashboard." },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-2xl border border-line bg-gradient-to-br from-white to-[#f8fbfe] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-teal-600 shadow-sm ring-1 ring-line">
                  <Icon size={18} />
                </span>
                <p className="mt-3 text-[0.92rem] font-bold text-navy-900">{s.title}</p>
                <p className="mt-1 text-[0.82rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
        <div className="shell mt-7 text-center">
          <Link href="/pricing" className="btn btn-primary">
            Choose your plan <IconArrow size={16} />
          </Link>
        </div>
      </section>

      <CtaBand
        title="See it with your own family data"
        body="Create your workspace, connect your Libre account and invite your first family member in a few minutes."
        primary={{ label: "Get Started", href: "/pricing" }}
        secondary={{ label: "Talk to us", href: "/contact" }}
      />
    </>
  );
}
