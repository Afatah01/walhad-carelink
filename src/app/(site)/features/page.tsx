import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import {
  IconAlert,
  IconBell,
  IconDrop,
  IconFamily,
  IconLock,
  IconMonitor,
  IconSms,
  IconStethoscope,
  IconTelegram,
  IconUsers,
} from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Features",
  description: "Glucose monitoring, real alerts, family sharing and hospital dashboards.",
};

const GROUPS = [
  {
    title: "Monitoring",
    items: [
      { icon: IconDrop, name: "Live glucose", body: "Readings from an authorised Libre source." },
      { icon: IconMonitor, name: "Charts and history", body: "24-hour and 7-day views, time in range." },
      { icon: IconAlert, name: "Sensor status", body: "Freshness, stale data and disconnections." },
    ],
  },
  {
    title: "Alerts",
    items: [
      { icon: IconBell, name: "Threshold alerts", body: "Low, high, critical and rapid change." },
      { icon: IconSms, name: "SMS and push", body: "Delivery status recorded per recipient." },
      { icon: IconTelegram, name: "Telegram bot", body: "Alerts and acknowledgement in chat." },
    ],
  },
  {
    title: "People and access",
    items: [
      { icon: IconFamily, name: "Family sharing", body: "Invite caregivers with per-person permissions." },
      { icon: IconLock, name: "Consent controls", body: "The patient decides who sees what." },
      { icon: IconStethoscope, name: "Hospital workspace", body: "Staff roles, patient assignment, ward view." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHero eyebrow="Features" title="What the platform does" body="Nine capabilities, one workspace." />

      <section className="shell pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          {GROUPS.map((g) => (
            <div key={g.title}>
              <h2 className="mb-3 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">{g.title}</h2>
              <div className="space-y-2.5">
                {g.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="card p-4">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <Icon size={16} />
                      </span>
                      <p className="mt-2.5 text-[0.88rem] font-extrabold text-navy-900">{item.name}</p>
                      <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted">{item.body}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="See it with your own data"
        body="Create an account and connect a sensor."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "Pricing", href: "/pricing" }}
      />
    </>
  );
}
