import type { Metadata } from "next";
import Link from "next/link";
import { IconArrow, IconBell, IconCheck, IconFamily, IconHospital, IconLock, IconUsers } from "@/components/ui/Icons";
import { CtaBand, PageHero, Section } from "@/components/site/Layout";
import { HospitalMockup, PhoneMockup } from "@/components/site/Mockups";

export const metadata: Metadata = {
  title: "Our products",
  description:
    "One platform, two care environments: connected family monitoring and hospital-grade oversight.",
};

const FAMILY = [
  { icon: <IconFamily size={16} />, label: "One primary patient" },
  { icon: <IconUsers size={16} />, label: "Authorised family members" },
  { icon: <IconBell size={16} />, label: "Glucose alerts" },
  { icon: <IconLock size={16} />, label: "Permission controls" },
];

const HOSPITAL = [
  { icon: <IconUsers size={16} />, label: "Multiple patient monitoring" },
  { icon: <IconHospital size={16} />, label: "Staff accounts and roles" },
  { icon: <IconCheck size={16} />, label: "Patient assignments" },
  { icon: <IconBell size={16} />, label: "Ward overview" },
];

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Our products"
        title="One platform. Two care environments."
        body="Choose a connected monitoring experience designed for families or healthcare organisations."
        tone="white"
      />

      {/* ---------------- family monitoring ---------------- */}
      <section className="bg-aqua section">
        <div className="shell">
          <div className="overflow-hidden rounded-[26px] border border-[#dceaea] bg-white">
            <div className="grid items-center gap-0 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="order-2 p-8 md:p-12 lg:order-1 lg:p-14">
                <span className="inline-flex items-center gap-2 rounded-full bg-aqua px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-teal-500">
                  <IconFamily size={13} />
                  Family Monitoring
                </span>

                <h2 className="h-section mt-5">Built for the household.</h2>
                <p className="body-lg mt-3 max-w-[440px]">
                  One patient, a circle of people who care, and a clear picture of what is happening — without anyone
                  needing to phone around for an update.
                </p>

                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {FAMILY.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-aqua text-teal-500">
                        {f.icon}
                      </span>
                      <span className="text-[0.875rem] text-ink/85">{f.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/signup?plan=family-basic" className="btn btn-primary">
                    Explore Family Monitoring
                    <IconArrow size={15} />
                  </Link>
                  <Link href="/pricing" className="btn btn-ghost">
                    See pricing
                  </Link>
                </div>
              </div>

              <div className="relative order-1 flex items-center justify-center overflow-hidden bg-gradient-to-br from-aqua to-[#f4fafb] p-8 pb-4 lg:order-2 lg:p-12">
                <span className="ring-faint absolute -right-10 -top-10 h-48 w-48" aria-hidden />
                <div className="relative z-10 w-full max-w-[320px]">
                  <PhoneMockup caption="" />
                  <p className="mt-3 text-center text-[0.68rem] font-medium text-faint">Illustrative interface</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- hospital monitoring ---------------- */}
      <section className="bg-softblue section">
        <div className="shell">
          <div className="overflow-hidden rounded-[26px] border border-[#dde9f8] bg-white">
            <div className="grid items-center gap-0 lg:grid-cols-[0.98fr_1.02fr]">
              <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-softblue to-[#f6faff] px-4 py-10 md:p-8 lg:p-10">
                <span className="ring-faint absolute -bottom-12 -left-12 h-48 w-48" aria-hidden />
                <div className="relative z-10 w-full max-w-[500px]">
                  <HospitalMockup caption="" />
                  <p className="mt-3 text-center text-[0.68rem] font-medium text-faint">Illustrative interface</p>
                </div>
              </div>

              <div className="p-8 md:p-12 lg:p-14">
                <span className="inline-flex items-center gap-2 rounded-full bg-softblue px-3 py-1.5 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-brand-500">
                  <IconHospital size={13} />
                  Hospital Monitoring
                </span>

                <h2 className="h-section mt-5">Built for the ward.</h2>
                <p className="body-lg mt-3 max-w-[440px]">
                  A shared workspace for clinical teams — every monitored patient, the staff responsible, and the
                  alerts that need attention.
                </p>

                <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                  {HOSPITAL.map((f) => (
                    <li key={f.label} className="flex items-center gap-2.5">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-softblue text-brand-500">
                        {f.icon}
                      </span>
                      <span className="text-[0.875rem] text-ink/85">{f.label}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link href="/contact?topic=hospital" className="btn btn-primary">
                    Explore Hospital Monitoring
                    <IconArrow size={15} />
                  </Link>
                  <Link href="/features" className="btn btn-ghost">
                    See capabilities
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* small comparison — helps a buyer choose, not a repeat of pricing */}
      <Section tone="white" tight>
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {[
            {
              title: "Choose Family Monitoring if…",
              points: ["You are monitoring one person at home", "Family members need alerts", "You want simple monthly pricing"],
            },
            {
              title: "Choose Hospital Monitoring if…",
              points: ["Your team monitors several patients", "Staff need assigned roles", "You need a ward-level view"],
            },
          ].map((c) => (
            <div key={c.title} className="rounded-[18px] border border-line bg-white p-7">
              <h3 className="h-card">{c.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {c.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-[0.875rem] text-muted">
                    <span className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-aqua text-teal-500">
                      <IconCheck size={10} />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <CtaBand
        title="Not sure which one fits?"
        body="Tell us how you monitor today and we will point you to the right workspace."
        primary={{ label: "Contact Us", href: "/contact" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
