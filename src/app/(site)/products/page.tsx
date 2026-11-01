import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import { Reveal } from "@/components/marketing/Reveal";
import {
  IconArrow,
  IconBell,
  IconCheck,
  IconChart,
  IconDrop,
  IconFamily,
  IconGlobe,
  IconHospital,
  IconMonitor,
  IconPhone,
  IconSms,
  IconStethoscope,
  IconTelegram,
  IconUsers,
  IconVolume,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Our Products",
  description:
    "Family glucose monitoring, Telegram and SMS alerting, mobile push, audible alerts, and hospital monitoring — one platform, four products.",
};

const PRODUCTS = [
  {
    tag: "01",
    icon: IconFamily,
    name: "CareLink Family",
    summary: "The family-facing monitoring app: a live glucose view plus multi-channel alerts.",
    bullets: [
      "Live dashboard with trend arrows and freshness labels",
      "Up to 5 authorised family recipients on Premium",
      "Low, high, critical and rapid-change alerts",
      "Acknowledgement tracking and alert history",
      "Location sharing with explicit consent",
    ],
    tone: "from-[#f2f9ff] to-white",
  },
  {
    tag: "02",
    icon: IconTelegram,
    name: "CareLink Alerts",
    summary: "Delivery that fits real life: Telegram, SMS, push, in-app and audible ringing.",
    bullets: [
      "Telegram bot with /glucose, /history, /alerts, /acknowledge",
      "SMS within plan allowance, with delivery receipts",
      "Web push notifications with critical urgency flags",
      "Audible ring for critical readings on open dashboards",
      "Notification centre with retry and error logging",
    ],
    tone: "from-[#f1fbf7] to-white",
  },
  {
    tag: "03",
    icon: IconStethoscope,
    name: "CareLink Clinic",
    summary: "Remote patient monitoring for clinics managing outpatients between visits.",
    bullets: [
      "Patient roster with status and last reading age",
      "Doctor and nurse assignments",
      "Alert escalation into the clinical team",
      "Glucose history and time-in-range summaries",
      "Staff activity audit trail",
    ],
    tone: "from-[#f5f8ff] to-white",
  },
  {
    tag: "04",
    icon: IconHospital,
    name: "CareLink Hospital",
    summary: "Enterprise monitoring across wards, with centralised administration.",
    bullets: [
      "Ward-wide dashboard for every monitored patient",
      "Role permissions for nurses, doctors and administrators",
      "Telegram, SMS and push notifications at scale",
      "Patient reports for rounds and discharge",
      "Custom capacity, onboarding and support",
    ],
    tone: "from-[#f7fafc] to-white",
  },
];

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our products"
        title={
          <>
            One platform,{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              four focused products
            </span>
          </>
        }
        body="Families start with monitoring and alerts. Clinics and hospitals extend the same foundation across teams."
        actions={[
          { label: "View pricing plans", href: "/pricing" },
          { label: "Hospital solutions", href: "/hospital-solutions", variant: "ghost" },
        ]}
      />

      <section className="shell py-14">
        <div className="grid gap-5 lg:grid-cols-2">
          {PRODUCTS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.name} delay={i * 60}>
                <div
                  className={`relative h-full overflow-hidden rounded-[1.6rem] border border-line bg-gradient-to-br ${p.tone} p-6 shadow-soft md:p-7`}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-line">
                      <Icon size={22} />
                    </span>
                    <span className="text-[2rem] font-extrabold leading-none tracking-tight text-navy-100">
                      {p.tag}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-extrabold text-navy-900">{p.name}</h2>
                  <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{p.summary}</p>
                  <ul className="mt-4 space-y-2">
                    {p.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[0.85rem] leading-snug text-navy-800">
                        <span className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full bg-teal-500/15 text-teal-600">
                          <IconCheck size={10} />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bg-[#f7fafc] py-16">
        <div className="shell">
          <h2 className="display-2 text-center">Built on the FreeStyle Libre ecosystem</h2>
          <p className="lead mx-auto mt-3 max-w-2xl text-center">
            Your sensor and the Libre app do the measuring. Walhad CareLink adds the sharing, alerting and
            accountability layer around them.
          </p>
          <div className="mt-9 grid gap-3 md:grid-cols-4">
            {[
              { icon: IconDrop, title: "Sensor", body: "Libre 2 / Libre 3 measures interstitial glucose." },
              { icon: IconPhone, title: "Libre app", body: "Reads the sensor and uploads to the Libre cloud." },
              { icon: IconChart, title: "CareLink", body: "Syncs, scores and watches readings for threshold events." },
              { icon: IconBell, title: "Your people", body: "Push, SMS, Telegram and audible alerts reach the care circle." },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="relative rounded-2xl border border-line bg-white p-5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={17} />
                  </span>
                  <p className="mt-3 text-[0.78rem] font-extrabold uppercase tracking-wider text-teal-600">
                    Stage {i + 1}
                  </p>
                  <p className="text-[0.9rem] font-bold text-navy-900">{s.title}</p>
                  <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{s.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { icon: IconSms, title: "SMS", body: "Reaches family who are not in the app, within allowance." },
              { icon: IconVolume, title: "Audible", body: "Rings in the dashboard when a reading is critical." },
              { icon: IconGlobe, title: "Multi-language", body: "English, Somali and Arabic interfaces." },
            ].map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="flex items-start gap-3 rounded-2xl border border-line bg-white p-4">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-mist text-navy-700">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-[0.88rem] font-bold text-navy-900">{c.title}</p>
                    <p className="text-[0.8rem] leading-relaxed text-muted">{c.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/features" className="btn btn-ghost">
              All features <IconArrow size={15} />
            </Link>
            <Link href="/how-it-works" className="btn btn-ghost">
              How it works
            </Link>
          </div>
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: IconUsers, title: "For families", body: "Peace of mind without hovering over an app all day.", href: "/pricing" },
            { icon: IconMonitor, title: "For caregivers", body: "One place for readings, alerts and acknowledgements.", href: "/features" },
            { icon: IconHospital, title: "For hospitals", body: "Ward-level visibility with staff permissions.", href: "/hospital-solutions" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.title}
                href={c.href}
                className="card card-hover flex items-start gap-3 p-5"
              >
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-navy-50 text-navy-700">
                  <Icon size={18} />
                </span>
                <div>
                  <p className="text-[0.92rem] font-bold text-navy-900">{c.title}</p>
                  <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted">{c.body}</p>
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[0.78rem] font-bold text-brand-600">
                    Learn more <IconArrow size={13} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <CtaBand
        title="Bring the right product to your family"
        body="Most households start with Family Basic. Clinics begin with a hospital consultation."
        primary={{ label: "View pricing", href: "/pricing" }}
        secondary={{ label: "Contact sales", href: "/contact?topic=hospital" }}
      />
    </>
  );
}
