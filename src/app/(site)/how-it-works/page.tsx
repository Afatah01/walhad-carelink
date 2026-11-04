import type { Metadata } from "next";
import Link from "next/link";
import {
  IconArrow,
  IconBell,
  IconDrop,
  IconFamily,
  IconMonitor,
  IconSensor,
  IconCard,
} from "@/components/ui/Icons";
import { CtaBand, PageHero, Section } from "@/components/site/Layout";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "From connecting your sensor to receiving monitoring alerts — the process is designed to be straightforward.",
};

const STEPS = [
  {
    n: "01",
    title: "Subscribe",
    body: "Pick the plan that matches your household or ward. Nothing is activated until payment is confirmed.",
    icon: <IconCard size={22} />,
    tone: "teal" as const,
  },
  {
    n: "02",
    title: "Connect your authorised sensor source",
    body: "Link the FreeStyle Libre source you already use through an approved connection.",
    icon: <IconSensor size={22} />,
    tone: "blue" as const,
  },
  {
    n: "03",
    title: "Receive glucose readings",
    body: "Readings arrive into your dashboard and are stored as history you can review later.",
    icon: <IconDrop size={22} />,
    tone: "teal" as const,
  },
  {
    n: "04",
    title: "Invite authorised family members",
    body: "Add the people who should see readings and alerts. You control who gets access.",
    icon: <IconFamily size={22} />,
    tone: "blue" as const,
  },
  {
    n: "05",
    title: "Receive configured alerts",
    body: "Low, high and rapid-change events notify the recipients and channels you have chosen.",
    icon: <IconBell size={22} />,
    tone: "amber" as const,
  },
  {
    n: "06",
    title: "Monitor through your dashboard",
    body: "Follow the current picture, the history and the alert record from one place.",
    icon: <IconMonitor size={22} />,
    tone: "teal" as const,
  },
];

const toneClass = {
  teal: "bg-aqua text-teal-500",
  blue: "bg-softblue text-brand-500",
  amber: "bg-amber-soft text-warning",
};

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="Simple connections. Better-informed care."
        body="From connecting your sensor to receiving monitoring alerts, the process is designed to be straightforward."
        tone="blue"
        align="center"
      />

      {/* desktop: alternating timeline / mobile: vertical */}
      <Section tone="white">
        <div className="relative mx-auto max-w-[1000px]">
          {/* centre rail (desktop) */}
          <span
            className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#dbe9ec] to-transparent lg:block"
            aria-hidden
          />
          {/* left rail (mobile) */}
          <span
            className="absolute left-[26px] top-2 h-[calc(100%-16px)] w-px bg-gradient-to-b from-[#dbe9ec] via-[#dbe9ec] to-transparent lg:hidden"
            aria-hidden
          />

          <ol className="space-y-6 lg:space-y-0">
            {STEPS.map((s, i) => {
              const isRight = i % 2 === 1;
              return (
                <li key={s.n} className="relative lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-0">
                  {/* the card */}
                  <div className={`pl-[62px] lg:pl-0 ${isRight ? "lg:col-start-3 lg:pl-12" : "lg:col-start-1 lg:pr-12"}`}>
                    <div className="rounded-[18px] border border-line bg-white p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] lg:p-6">
                      <div className="flex items-center gap-3">
                        <span className={`grid h-10 w-10 flex-none place-items-center rounded-[11px] ${toneClass[s.tone]}`}>
                          {s.icon}
                        </span>
                        <h3 className="h-card">{s.title}</h3>
                      </div>
                      <p className="body-sm mt-2.5">{s.body}</p>
                    </div>
                  </div>

                  {/* centre marker */}
                  <div className="absolute left-0 top-4 z-10 lg:static lg:col-start-2 lg:flex lg:h-full lg:items-center lg:justify-center">
                    <span className="grid h-[52px] w-[52px] place-items-center rounded-full border border-[#dbe9ec] bg-white font-[family-name:var(--font-display)] text-[0.85rem] font-bold text-teal-500 shadow-[0_8px_20px_-12px_rgba(20,50,60,0.4)]">
                      {s.n}
                    </span>
                  </div>

                  {/* empty opposite column */}
                  <div className={isRight ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-3 lg:row-start-1"} aria-hidden />
                </li>
              );
            })}
          </ol>
        </div>
      </Section>

      {/* what you need */}
      <Section tone="aqua" tight>
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {[
            { title: "A sensor you already use", body: "FreeStyle Libre through an authorised connection." },
            { title: "A phone or browser", body: "The dashboard works on mobile and desktop." },
            { title: "People you trust", body: "Decide who receives readings and alerts." },
          ].map((c) => (
            <div key={c.title}>
              <h3 className="h-card">{c.title}</h3>
              <p className="body-sm mt-1.5">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-8">
          <Link
            href="/features"
            className="inline-flex items-center gap-1.5 text-[0.875rem] font-semibold text-teal-500 transition hover:gap-2"
          >
            See what the platform does <IconArrow size={14} />
          </Link>
        </p>
      </Section>

      <CtaBand
        title="Ready when you are."
        body="Start with Family Basic and add people as you go."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
