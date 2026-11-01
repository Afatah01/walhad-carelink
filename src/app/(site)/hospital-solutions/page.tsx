import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, SectionHeading } from "@/components/marketing/PageHero";
import { Reveal } from "@/components/marketing/Reveal";
import { CtaBand } from "@/components/marketing/Sections";
import { FaqAccordion, type FaqItem } from "@/components/marketing/Faq";
import {
  IconAlert,
  IconArrow,
  IconBell,
  IconCard,
  IconChart,
  IconCheck,
  IconClock,
  IconDownload,
  IconHospital,
  IconLock,
  IconSms,
  IconStethoscope,
  IconTelegram,
  IconUsers,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Hospital Solutions",
  description:
    "Centralised glucose monitoring for hospitals and clinics: ward dashboards, patient assignment, staff permissions and escalation-ready alerts.",
};

const FEATURES = [
  { icon: IconHospital, title: "Centralised monitoring", body: "Every monitored patient in one ward view, ranked by clinical attention needed." },
  { icon: IconUsers, title: "Multiple patient profiles", body: "Unlimited patients under a custom agreement, each with their own thresholds." },
  { icon: IconStethoscope, title: "Doctor & nurse access", body: "Assign patients to the clinicians responsible for their care." },
  { icon: IconAlert, title: "Critical alert queue", body: "A prioritised list of readings requiring attention, with acknowledgement state." },
  { icon: IconChart, title: "Glucose history", body: "24-hour, weekly and 90-day views per patient for rounds and review." },
  { icon: IconBell, title: "Emergency notification", body: "Configurable escalation to the on-call clinician." },
  { icon: IconTelegram, title: "Telegram & SMS", body: "Clinical teams notified on the channels they already watch." },
  { icon: IconDownload, title: "Patient reports", body: "Printable summaries with time-in-range and reading coverage." },
  { icon: IconLock, title: "Staff permissions", body: "Nurse, doctor and administrator roles with scoped patient access." },
  { icon: IconCard, title: "Hospital administration", body: "Seats, patients and SMS usage tracked against the agreement." },
  { icon: IconClock, title: "Audit trail", body: "Administrative and clinical actions recorded for governance review." },
  { icon: IconUsers, title: "Custom onboarding", body: "Dedicated setup for ward structure, thresholds and staff training." },
];

const FAQS: FaqItem[] = [
  {
    q: "How is the hospital plan priced?",
    a: "From $100 USD per month as a starting point. The final price depends on the number of monitored patients, the number of healthcare professionals with access, integrations, notification volume and support arrangements. We issue a written quote after a short consultation.",
  },
  {
    q: "Can we use our own LibreView practice?",
    a: "If your hospital already runs a LibreView practice, access can be arranged through an approved partner integration. Where Abbott partner approval is required, we plan that onboarding with you from the start so it never blocks the project.",
  },
  {
    q: "How are staff accounts managed?",
    a: "Administrators create doctor and nurse accounts, assign patients and adjust permissions. Access is removed the moment an account is disabled, and every administrative action is logged.",
  },
  {
    q: "Does the platform replace our EHR?",
    a: "No. Walhad CareLink is a monitoring and alerting layer. Reports can be exported for inclusion in your existing record systems; native EHR integration is available as a custom option.",
  },
  {
    q: "What about consent for inpatients?",
    a: "We support consent capture per monitored patient, with the ability to limit who sees location data. Your governance team sets the policy; the platform enforces the permissions.",
  },
];

export default function HospitalSolutionsPage() {
  return (
    <>
      <PageHero
        eyebrow="Hospital & clinic solutions"
        title={
          <>
            Every monitored patient,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              one clinical view
            </span>
          </>
        }
        body="Walhad CareLink gives diabetes teams a calm, prioritised view of glucose across a ward — with alerts that reach the right clinician and an audit trail behind every acknowledgement."
        actions={[
          { label: "Request a quote", href: "/contact?topic=hospital" },
          { label: "See the dashboard", href: "/login", variant: "ghost" },
        ]}
      />

      <section className="border-b border-line bg-white py-10">
        <div className="shell grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: "Ward-wide", label: "Patient visibility", hint: "Ranked by attention needed" },
            { value: "3", label: "Clinical roles", hint: "Doctor · nurse · administrator" },
            { value: "4", label: "Alert channels", hint: "Push · SMS · Telegram · in-app" },
            { value: "Custom", label: "Capacity & integration", hint: "Quoted per organisation" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-line bg-[#fbfdff] p-4">
              <p className="text-xl font-extrabold tracking-tight text-navy-900">{s.value}</p>
              <p className="text-[0.75rem] font-bold uppercase tracking-wide text-navy-700">{s.label}</p>
              <p className="mt-0.5 text-[0.72rem] text-muted">{s.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell py-16">
        <SectionHeading
          eyebrow="Built for clinical teams"
          title="Clinical monitoring without the noise"
          body="Designed with the realities of ward rounds, shift handovers and on-call escalation."
        />
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 35}>
                <div className="card card-hover h-full p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-navy-50 to-teal-50 text-navy-700 ring-1 ring-line">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-3 text-[0.92rem] font-bold text-navy-900">{f.title}</h3>
                  <p className="mt-1.5 text-[0.83rem] leading-relaxed text-muted">{f.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="relative overflow-hidden bg-navy-900 py-16 text-white">
        <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="shell grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="pill bg-white/10 text-white ring-1 ring-white/20">Hospital dashboard</span>
            <h2 className="mt-4 text-3xl font-extrabold text-white">What the ward team sees</h2>
            <ul className="mt-5 space-y-3">
              {[
                "Total monitored patients and how many need attention now",
                "Critical alerts with value, time and acknowledgement state",
                "Active monitoring connections and last sync per patient",
                "Recent notifications across telegram, SMS and push",
                "Staff activity and assignment overview",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5 text-[0.9rem] text-white/80">
                  <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full bg-teal-400/20 text-teal-300">
                    <IconCheck size={11} />
                  </span>
                  {line}
                </li>
              ))}
            </ul>
            <Link href="/login" className="btn mt-6 bg-white text-navy-800 hover:bg-white/90">
              Explore the hospital demo <IconArrow size={16} />
            </Link>
            <p className="mt-2 text-[0.74rem] text-white/50">
              Demo credentials are listed on the sign-in page when demo mode is enabled.
            </p>
          </div>

          {/* dashboard mock */}
          <div className="rounded-[1.5rem] border border-white/15 bg-white/5 p-3 backdrop-blur">
            <div className="rounded-xl bg-white p-4 text-navy-900 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">Ward A · Diabetes unit</p>
                  <p className="text-lg font-extrabold">6 patients monitored</p>
                </div>
                <span className="pill pill-low text-[0.62rem]">2 need attention</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {[
                  { name: "Mohamed Ali", value: "58", status: "Critical low", tone: "low" },
                  { name: "Sagal Warsame", value: "212", status: "High", tone: "high" },
                  { name: "Abdi Ismail", value: "104", status: "In range", tone: "ok" },
                  { name: "Khadra Osman", value: "96", status: "In range", tone: "ok" },
                ].map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-lg border border-line px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-mist text-[0.6rem] font-bold text-navy-700">
                        {p.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                      <span className="text-[0.78rem] font-semibold">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular text-[0.85rem] font-extrabold">{p.value}</span>
                      <span
                        className={`pill text-[0.56rem] ${
                          p.tone === "low" ? "pill-low" : p.tone === "high" ? "pill-high" : "pill-ok"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg bg-mist px-2.5 py-2">
                <span className="flex items-center gap-1.5 text-[0.68rem] font-bold text-navy-800">
                  <IconTelegram size={12} className="text-brand-500" /> Telegram on-call notified
                </span>
                <span className="flex items-center gap-1 text-[0.62rem] font-semibold text-teal-700">
                  <IconSms size={11} /> SMS delivered
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { step: "01", title: "Consultation", body: "We map your wards, patient volume and clinical workflow." },
            { step: "02", title: "Pilot", body: "A small ward goes live with thresholds agreed by your team." },
            { step: "03", title: "Rollout", body: "Staff accounts, training and escalation policy across departments." },
          ].map((s) => (
            <div key={s.step} className="rounded-2xl border border-line bg-white p-6">
              <span className="text-2xl font-extrabold text-navy-100">{s.step}</span>
              <p className="mt-1 text-[1rem] font-extrabold text-navy-900">{s.title}</p>
              <p className="mt-1.5 text-[0.85rem] leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f7fafc] py-16">
        <div className="shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="eyebrow">Hospital FAQ</span>
            <h2 className="display-2 mt-3">Procurement questions, answered</h2>
            <p className="lead mt-3">
              If your team needs documentation for a security or clinical governance review, we can provide it
              during onboarding.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="pill pill-brand">Role-based access</span>
              <span className="pill pill-teal">Audit logs</span>
              <span className="pill pill-muted">Consent capture</span>
            </div>
          </div>
          <FaqAccordion items={FAQS} />
        </div>
      </section>

      <CtaBand
        title="Plan your hospital pilot"
        body="Tell us your ward size and clinical workflow. We will propose a pilot configuration and a written quote."
        primary={{ label: "Contact Sales", href: "/contact?topic=hospital" }}
        secondary={{ label: "View pricing", href: "/pricing" }}
      />
    </>
  );
}
