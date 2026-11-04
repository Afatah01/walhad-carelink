import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import { IconBell, IconDrop, IconFamily, IconShield, IconStethoscope, IconUsers } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "How it works",
  description: "Subscribe, connect a FreeStyle Libre source, and share real readings with your family.",
};

const STEPS = [
  {
    icon: IconUsers,
    title: "Subscribe",
    body: "Choose Family Basic, Family Premium or a custom Hospital plan. Your workspace is created immediately.",
  },
  {
    icon: IconDrop,
    title: "Connect your sensor",
    body: "Link an authorised FreeStyle Libre source from Connection settings. No manual entry.",
  },
  {
    icon: IconBell,
    title: "Readings arrive",
    body: "Real glucose data syncs continuously. Old readings are shown as stale, never as current.",
  },
  {
    icon: IconFamily,
    title: "Invite your circle",
    body: "Add family and caregivers. They see only what the patient authorises.",
  },
  {
    icon: IconShield,
    title: "Alerts reach people",
    body: "Low, high and critical events notify recipients with a delivery record for each channel.",
  },
  {
    icon: IconStethoscope,
    title: "Clinicians oversee",
    body: "Hospital staff get an assigned patient list, ward overview and full alert history.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero eyebrow="How it works" title="From subscription to real monitoring" body="Six steps, no manual data entry." />

      <section className="shell pb-14">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card p-5">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={17} />
                  </span>
                  <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-muted">
                    Step {i + 1}
                  </span>
                </div>
                <h2 className="mt-3 text-[0.95rem] font-extrabold text-navy-900">{s.title}</h2>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-muted">{s.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      <CtaBand
        title="Start today"
        body="Most families are monitoring within minutes of connecting a sensor."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}
