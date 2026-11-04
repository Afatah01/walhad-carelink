import type { Metadata } from "next";
import { PageHeader, CtaBand } from "@/components/site/PageKit";
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
  description: "Glucose monitoring, intelligent alerts, family connectivity and hospital management.",
};

type Item = { icon: React.ReactNode; label: string; status?: "live" | "planned" };

const GROUPS: { title: string; accent: "teal" | "blue"; items: Item[] }[] = [
  {
    title: "Glucose Monitoring",
    accent: "teal",
    items: [
      { icon: <IconDrop size={16} />, label: "Live glucose readings" },
      { icon: <IconMonitor size={16} />, label: "Historical glucose charts" },
      { icon: <IconMonitor size={16} />, label: "24-hour and 7-day views" },
      { icon: <IconAlert size={16} />, label: "Time-in-range information" },
      { icon: <IconDrop size={16} />, label: "Sensor connection status" },
    ],
  },
  {
    title: "Intelligent Alerts",
    accent: "blue",
    items: [
      { icon: <IconBell size={16} />, label: "Low glucose alerts" },
      { icon: <IconBell size={16} />, label: "High glucose alerts" },
      { icon: <IconAlert size={16} />, label: "Critical event alerts" },
      { icon: <IconAlert size={16} />, label: "Rapid-change notifications" },
      { icon: <IconSms size={16} />, label: "SMS notifications", status: "planned" },
      { icon: <IconTelegram size={16} />, label: "Telegram notifications" },
      { icon: <IconMonitor size={16} />, label: "Alert delivery status" },
    ],
  },
  {
    title: "Family Connectivity",
    accent: "teal",
    items: [
      { icon: <IconFamily size={16} />, label: "Family member invitations" },
      { icon: <IconUsers size={16} />, label: "Caregiver access" },
      { icon: <IconLock size={16} />, label: "Individual permission management" },
      { icon: <IconLock size={16} />, label: "Patient-controlled consent" },
    ],
  },
  {
    title: "Hospital Management",
    accent: "blue",
    items: [
      { icon: <IconStethoscope size={16} />, label: "Multiple patient monitoring" },
      { icon: <IconUsers size={16} />, label: "Staff accounts and roles" },
      { icon: <IconStethoscope size={16} />, label: "Patient assignments" },
      { icon: <IconMonitor size={16} />, label: "Ward monitoring dashboard" },
      { icon: <IconAlert size={16} />, label: "Monitoring and alert history" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Features"
        title="Platform capabilities"
        intro="What Walhad CareLink actually does — grouped into four areas."
      />

      <section className="shell py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-2">
          {GROUPS.map((g) => (
            <div key={g.title} className="card overflow-hidden">
              <div className={`h-1 w-full ${g.accent === "teal" ? "bg-teal-500" : "bg-brand-500"}`} />
              <div className="p-6">
                <h2 className="text-[1.05rem] font-extrabold tracking-[-0.02em] text-navy-900">{g.title}</h2>
                <ul className="mt-4 space-y-2.5">
                  {g.items.map((item) => (
                    <li key={item.label} className="flex items-center gap-2.5">
                      <span
                        className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${
                          g.accent === "teal" ? "bg-teal-50 text-teal-600" : "bg-brand-50 text-brand-600"
                        }`}
                      >
                        {item.icon}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.86rem] text-navy-800">
                        {item.label}
                        {item.status === "planned" ? (
                          <span className="rounded-full bg-mist px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-muted">
                            Needs provider
                          </span>
                        ) : null}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-[0.78rem] text-muted">
          Items marked <span className="font-bold">Needs provider</span> are built but require an SMS gateway to
          be configured before messages can be delivered.
        </p>
      </section>

      <CtaBand
        title="See it with your own data"
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
