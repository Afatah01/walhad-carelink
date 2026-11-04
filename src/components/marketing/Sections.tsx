"use client";

import Link from "next/link";
import {
  IconAlert,
  IconArrow,
  IconBell,
  IconChart,
  IconCheck,
  IconDrop,
  IconFamily,
  IconHospital,
  IconMessage,
  IconMonitor,
  IconPhone,
  IconPin,
  IconSensor,
  IconShield,
  IconSms,
  IconTelegram,
  IconVolume,
} from "@/components/ui/Icons";
import { Reveal } from "./Reveal";

/* ------------------------------- benefits -------------------------------- */

export const BENEFITS = [
  {
    icon: IconDrop,
    title: "Real-Time Glucose Monitoring",
    body: "See current glucose, trend arrows and 24-hour history from your FreeStyle Libre data in one calm view.",
    tone: "brand",
  },
  {
    icon: IconFamily,
    title: "Family Glucose Alerts",
    body: "Authorised family members and caregivers receive the readings that matter, with clear context.",
    tone: "teal",
  },
  {
    icon: IconAlert,
    title: "Emergency Notifications",
    body: "A patient can request help instantly, escalating to the next available contact if nobody responds.",
    tone: "low",
  },
  {
    icon: IconSms,
    title: "SMS Notifications",
    body: "When data matters, a text message reaches family members even if they are not in the app.",
    tone: "brand",
  },
  {
    icon: IconVolume,
    title: "Audible Alerts",
    body: "Ringing alerts on the dashboard draw attention to critical readings in a shared room.",
    tone: "high",
  },
  {
    icon: IconTelegram,
    title: "Telegram Bot Notifications",
    body: "A full Telegram bot with /glucose, /history, /alerts and /acknowledge for rapid family response.",
    tone: "teal",
  },
  {
    icon: IconPin,
    title: "Location Sharing",
    body: "Optional, consent-based location so family can reach a patient quickly when it counts.",
    tone: "brand",
  },
  {
    icon: IconMonitor,
    title: "Remote Patient Monitoring",
    body: "Care teams and caregivers follow trends remotely, without asking the patient for numbers.",
    tone: "teal",
  },
  {
    icon: IconHospital,
    title: "Hospital Monitoring Solutions",
    body: "Centralised wards, staff permissions and patient assignment for clinics and hospitals.",
    tone: "brand",
  },
] as const;

const toneMap: Record<string, { bg: string; fg: string; ring: string }> = {
  brand: { bg: "bg-brand-50", fg: "text-brand-600", ring: "ring-brand-100" },
  teal: { bg: "bg-teal-50", fg: "text-teal-600", ring: "ring-teal-100" },
  low: { bg: "bg-low-soft", fg: "text-low", ring: "ring-[#f6d2d2]" },
  high: { bg: "bg-high-soft", fg: "text-high", ring: "ring-[#f4e0c4]" },
};

export function BenefitsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {BENEFITS.map((b, i) => {
        const tone = toneMap[b.tone] ?? toneMap.brand;
        const Icon = b.icon;
        return (
          <Reveal key={b.title} delay={i * 45}>
            <div className="card card-hover h-full p-5">
              <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone.bg} ${tone.fg} ring-1 ${tone.ring}`}>
                <Icon size={21} />
              </span>
              <h3 className="mt-4 text-[0.98rem] font-bold text-navy-900">{b.title}</h3>
              <p className="mt-1.5 text-[0.86rem] leading-relaxed text-muted">{b.body}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ------------------------------ how it works ----------------------------- */

export const STEPS = [
  {
    n: "01",
    title: "Connect your authorised FreeStyle Libre account",
    body: "Link the Libre account you already use. We never ask for your Libre password to be stored in plain text — credentials are sealed with AES-256-GCM.",
    icon: IconShield,
  },
  {
    n: "02",
    title: "Connect your glucose data to the platform",
    body: "Depending on your sensor and access level, readings sync automatically from the approved Libre data service.",
    icon: IconSensor,
  },
  {
    n: "03",
    title: "Add authorised family members or caregivers",
    body: "Invite the people you trust through the existing supported account functionality, then set exactly what each person may see.",
    icon: IconFamily,
  },
  {
    n: "04",
    title: "Receive alerts and monitor remotely",
    body: "Low, high and critical readings trigger push, SMS, Telegram and audible alerts — with acknowledgement tracking.",
    icon: IconBell,
  },
] as const;

export function HowItWorksSteps({ dense = false }: { dense?: boolean }) {
  return (
    <div className={`grid gap-4 ${dense ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <Reveal key={s.n} delay={i * 60}>
            <div className="relative h-full overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-soft transition hover:border-brand-200">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-teal-50 text-brand-600 ring-1 ring-brand-100">
                  <Icon size={20} />
                </span>
                <span className="text-2xl font-extrabold tracking-tight text-navy-100">{s.n}</span>
              </div>
              <h3 className="mt-4 text-[0.95rem] font-bold leading-snug text-navy-900">{s.title}</h3>
              <p className="mt-1.5 text-[0.84rem] leading-relaxed text-muted">{s.body}</p>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ---------------------------------- CTA ---------------------------------- */

export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="shell pb-20">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-navy-800 via-[#003a73] to-[#005b8f] px-6 py-12 text-white md:px-14 md:py-16">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-brand-400/25 blur-3xl" />
        <div className="relative max-w-2xl">
          <h2 className="display-2 !text-white">{title}</h2>
          <p className="mt-3 text-[1rem] leading-relaxed text-white/75">{body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={primary.href} className="btn btn-lg bg-white text-navy-800 hover:bg-white/90">
              {primary.label}
              <IconArrow size={17} />
            </Link>
            {secondary ? (
              <Link
                href={secondary.href}
                className="btn btn-lg border-white/25 bg-white/10 text-white hover:bg-white/15"
              >
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ stat strip ------------------------------- */

export function StatStrip({
  items,
}: {
  items: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line bg-white p-4 shadow-soft md:grid-cols-4 md:p-5">
      {items.map((s) => (
        <div key={s.label} className="px-2 py-1 text-center md:text-left">
          <p className="text-2xl font-extrabold tracking-tight text-navy-900 md:text-[1.7rem]">{s.value}</p>
          <p className="mt-0.5 text-[0.74rem] font-bold uppercase tracking-wide text-navy-700">{s.label}</p>
          {s.hint ? <p className="mt-0.5 text-[0.7rem] text-muted">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}

/* --------------------------- alert channel strip -------------------------- */

export function ChannelStrip() {
  const channels = [
    { icon: IconPhone, label: "Push notifications" },
    { icon: IconSms, label: "SMS" },
    { icon: IconTelegram, label: "Telegram Bot" },
    { icon: IconVolume, label: "Audible ring" },
    { icon: IconMessage, label: "In-app centre" },
    { icon: IconPin, label: "Location" },
  ];
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {channels.map((c) => {
        const Icon = c.icon;
        return (
          <span
            key={c.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[0.78rem] font-semibold text-navy-800 shadow-[0_1px_2px_rgba(12,36,64,0.04)]"
          >
            <Icon size={14} className="text-brand-500" />
            {c.label}
          </span>
        );
      })}
    </div>
  );
}

/* -------------------------- notification sample -------------------------- */

export function TrustGrid() {
  const items = [
    { icon: IconShield, title: "Encrypted credentials", body: "Provider sessions sealed with AES-256-GCM and never exposed to the browser." },
    { icon: IconFamily, title: "Consent by design", body: "Location and readings are only shared with people the patient authorises." },
    { icon: IconChart, title: "Honest data states", body: "Stale readings are labelled — never dressed up as live glucose values." },
    { icon: IconMonitor, title: "Role-based access", body: "Doctors, nurses and administrators see only what their role permits." },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((i, idx) => {
        const Icon = i.icon;
        return (
          <Reveal key={i.title} delay={idx * 50}>
            <div className="flex h-full items-start gap-3 rounded-2xl border border-line bg-white p-4">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-navy-50 text-navy-700">
                <Icon size={17} />
              </span>
              <div>
                <p className="text-[0.9rem] font-bold text-navy-900">{i.title}</p>
                <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted">{i.body}</p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}
