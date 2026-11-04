import type { Metadata } from "next";
import Link from "next/link";
import { IconAlert, IconArrow, IconBell, IconCheck, IconDrop, IconFamily, IconHospital, IconLock, IconMonitor, IconShield, IconUsers } from "@/components/ui/Icons";
import { CtaBand, PageHero, Section, SectionHead } from "@/components/site/Layout";
import { AlertMockup, DashboardMockup, FamilyDiagram, HospitalMockup } from "@/components/site/Mockups";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Monitoring, notifications, family permissions and hospital oversight in one connected platform.",
};

const MONITORING = [
  "Glucose readings",
  "Historical charts",
  "Time-in-range views",
  "Sensor connection status",
];

const ALERT_TYPES = [
  { icon: <IconAlert size={18} />, label: "Low glucose alerts", tone: "amber" },
  { icon: <IconAlert size={18} />, label: "High glucose alerts", tone: "amber" },
  { icon: <IconAlert size={18} />, label: "Rapid-change alerts", tone: "amber" },
  { icon: <IconBell size={18} />, label: "Critical event alerts", tone: "teal" },
];

const CHANNELS = [
  { label: "Telegram", status: "live" as const },
  { label: "Push notifications", status: "live" as const },
  { label: "In-app alerts", status: "live" as const },
  { label: "SMS", status: "provider" as const },
];

const FAMILY = [
  { icon: <IconUsers size={17} />, label: "Member invitations" },
  { icon: <IconShield size={17} />, label: "Caregiver access" },
  { icon: <IconLock size={17} />, label: "Individual permissions" },
  { icon: <IconCheck size={17} />, label: "Patient-controlled consent" },
];

const HOSPITAL = [
  { icon: <IconUsers size={17} />, label: "Patient assignment" },
  { icon: <IconShield size={17} />, label: "Staff roles and accounts" },
  { icon: <IconHospital size={17} />, label: "Ward monitoring" },
  { icon: <IconBell size={17} />, label: "Alert history per patient" },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Everything connected to your care."
        body="Monitoring, notifications, family permissions and hospital oversight in one platform."
        tone="white"
      />

      {/* ---------------- 1. monitoring — blue showcase ---------------- */}
      <Section tone="blue">
        <div className="grid items-center gap-12 lg:grid-cols-[0.46fr_0.54fr] lg:gap-16">
          <div>
            <p className="eyebrow text-brand-500">Monitoring</p>
            <h2 className="h-section mt-3">The picture, without the guesswork.</h2>
            <p className="body-lg mt-3.5 max-w-[440px]">
              Readings, trends and sensor status together, so you can tell at a glance whether everything is running.
            </p>

            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {MONITORING.map((m) => (
                <li key={m} className="flex items-center gap-2.5 text-[0.9rem] text-ink/85">
                  <span className="grid h-6 w-6 flex-none place-items-center rounded-md bg-white text-brand-500 shadow-sm">
                    <IconCheck size={12} />
                  </span>
                  {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <DashboardMockup caption="Illustrative interface" />
          </div>
        </div>
      </Section>

      {/* ---------------- 2. alerts — aqua, notification UI ---------------- */}
      <Section tone="aqua">
        <div className="grid items-center gap-12 lg:grid-cols-[0.54fr_0.46fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <AlertMockup />
            <p className="mt-3 text-center text-[0.68rem] font-medium text-faint">Illustrative feed — status is shown per channel</p>
          </div>

          <div className="order-1 lg:order-2">
            <p className="eyebrow">Alerts</p>
            <h2 className="h-section mt-3">The right person, at the right moment.</h2>
            <p className="body-lg mt-3.5 max-w-[440px]">
              Set thresholds once. When something needs attention, the recipients and channels you chose are used.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
              {ALERT_TYPES.map((a) => (
                <div key={a.label} className="flex items-center gap-2.5 rounded-xl border border-[#dceaea] bg-white px-3 py-2.5">
                  <span className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${a.tone === "amber" ? "bg-amber-soft text-warning" : "bg-aqua text-teal-500"}`}>
                    {a.icon}
                  </span>
                  <span className="text-[0.82rem] font-medium text-ink/85">{a.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-faint">Channels</p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {CHANNELS.map((c) => (
                  <span
                    key={c.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold ${
                      c.status === "live"
                        ? "border-[#cfe4e6] bg-white text-ink/85"
                        : "border-[#f0dfc4] bg-amber-soft/60 text-[#8a6118]"
                    }`}
                  >
                    {c.label}
                    {c.status === "provider" ? (
                      <span className="rounded bg-[#f0dfc4]/70 px-1.5 py-[1px] text-[0.58rem] font-bold uppercase tracking-wide">
                        Needs provider
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
              <p className="mt-3 max-w-[420px] text-[0.72rem] leading-relaxed text-muted">
                SMS is built but needs an SMS gateway to be configured before messages can be delivered.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------------- 3. family — diagram ---------------- */}
      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-[0.5fr_0.5fr] lg:gap-16">
          <div>
            <p className="eyebrow">Family connectivity</p>
            <h2 className="h-section mt-3">Shared with the people you choose.</h2>
            <p className="body-lg mt-3.5 max-w-[440px]">
              The patient decides who joins the circle and what each person can see. Access can be changed or removed
              at any time.
            </p>

            <ul className="mt-7 space-y-3">
              {FAMILY.map((f) => (
                <li key={f.label} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-aqua text-teal-500">
                    {f.icon}
                  </span>
                  <span className="text-[0.9rem] text-ink/85">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[22px] border border-line bg-mist p-6 md:p-8">
            <FamilyDiagram />
            <p className="mt-5 text-center text-[0.68rem] font-medium text-faint">Illustrative permission model</p>
          </div>
        </div>
      </Section>

      {/* ---------------- 4. hospital — dark ---------------- */}
      <section className="bg-deep section relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute -right-20 -top-16 h-[380px] w-[380px] rounded-full bg-[#1769d2]/18 blur-3xl" />
          <span className="absolute -bottom-24 left-0 h-[340px] w-[340px] rounded-full bg-[#1197a1]/18 blur-3xl" />
        </div>

        <div className="shell relative">
          <div className="grid items-center gap-12 lg:grid-cols-[0.46fr_0.54fr] lg:gap-16">
            <div>
              <p className="eyebrow eyebrow-on-dark">Hospital management</p>
              <h2 className="h-section mt-3 text-white">Oversight across the whole ward.</h2>
              <p className="mt-3.5 max-w-[440px] text-[1rem] leading-relaxed text-[#a9c9cd]">
                A shared workspace for clinical teams: who is monitored, who is responsible, and which patients need a
                review.
              </p>

              <ul className="mt-7 space-y-3">
                {HOSPITAL.map((h) => (
                  <li key={h.label} className="flex items-center gap-3">
                    <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-white/10 text-[#7fd0d6]">
                      {h.icon}
                    </span>
                    <span className="text-[0.9rem] text-[#cbe0e3]">{h.label}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact?topic=hospital"
                className="mt-8 inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-[#7fd0d6] transition hover:gap-2 hover:text-white"
              >
                Talk about a hospital workspace <IconArrow size={14} />
              </Link>
            </div>

            <div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 md:p-4">
                <HospitalMockup caption="" />
              </div>
              <p className="mt-3 text-center text-[0.7rem] font-medium text-[#7f9fa4]">Illustrative interface</p>
            </div>
          </div>
        </div>
      </section>

      {/* honest status note */}
      <Section tone="page" tight>
        <SectionHead
          eyebrow="Status"
          title="What is available today."
          body="Everything listed above is implemented, with one exception: SMS delivery requires an SMS gateway to be configured on the deployment."
          align="center"
        />
        <div className="mx-auto mt-8 flex max-w-[760px] flex-wrap items-center justify-center gap-3">
          {[
            { label: "Monitoring", ok: true },
            { label: "Telegram + push alerts", ok: true },
            { label: "Family permissions", ok: true },
            { label: "Hospital workspace", ok: true },
            { label: "SMS delivery", ok: false },
          ].map((s) => (
            <span
              key={s.label}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] font-semibold ${
                s.ok ? "border-[#cfe4e6] bg-white text-ink/85" : "border-[#f0dfc4] bg-amber-soft/50 text-[#8a6118]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-success" : "bg-warning"}`} />
              {s.label}
            </span>
          ))}
        </div>
      </Section>

      <CtaBand
        title="See it with your own data."
        body="Connect an authorised sensor source and the dashboard fills in."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
