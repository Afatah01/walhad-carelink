import type { Metadata } from "next";
import { PageHeader, CtaBand } from "@/components/site/PageKit";
import { IconBell, IconCard, IconDrop, IconFamily, IconMonitor, IconSensor } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "How It Works",
  description: "Six steps from subscription to continuous glucose monitoring.",
};

const STEPS = [
  { icon: <IconCard size={19} />, title: "Subscribe", body: "Choose an appropriate subscription plan." },
  { icon: <IconSensor size={19} />, title: "Connect Your Sensor", body: "Connect an authorised FreeStyle Libre data source." },
  { icon: <IconDrop size={19} />, title: "Receive Glucose Readings", body: "Real sensor readings become available through the authorised connection." },
  { icon: <IconFamily size={19} />, title: "Connect Family Members", body: "Invite authorised family members or caregivers." },
  { icon: <IconBell size={19} />, title: "Receive Alerts", body: "Get notified when configured glucose thresholds or events are detected." },
  { icon: <IconMonitor size={19} />, title: "Monitor and Manage", body: "View readings, history, alerts and monitoring information." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How It Works"
        title="How Walhad CareLink Works"
        intro="Six steps from subscription to continuous monitoring."
      />

      <section className="shell py-14 md:py-20">
        {/* Desktop: horizontal timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            <div className="absolute left-0 right-0 top-[26px] h-px bg-line" aria-hidden />
            <div className="relative grid grid-cols-6 gap-4">
              {STEPS.map((s, i) => (
                <div key={s.title} className="text-center">
                  <div className="mx-auto grid h-[54px] w-[54px] place-items-center rounded-2xl border border-line bg-white text-teal-600 shadow-sm">
                    {s.icon}
                  </div>
                  <p className="mt-3 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-600">
                    Step {i + 1}
                  </p>
                  <p className="mt-1 text-[0.9rem] font-bold leading-tight text-navy-900">{s.title}</p>
                  <p className="mt-1.5 text-[0.8rem] leading-snug text-muted">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile / tablet: vertical timeline */}
        <ol className="space-y-1 lg:hidden">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 pb-7 last:pb-0">
              {i < STEPS.length - 1 ? (
                <span className="absolute left-[21px] top-11 h-full w-px bg-line" aria-hidden />
              ) : null}
              <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-line bg-white text-teal-600 shadow-sm">
                {s.icon}
              </span>
              <div className="pt-0.5">
                <p className="text-[0.66rem] font-bold uppercase tracking-[0.14em] text-teal-600">Step {i + 1}</p>
                <p className="mt-0.5 text-[0.95rem] font-bold text-navy-900">{s.title}</p>
                <p className="mt-1 text-[0.85rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand
        title="Ready to begin?"
        body="From $30 per month."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
