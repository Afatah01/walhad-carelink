import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { CtaBand } from "@/components/marketing/Sections";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "About",
  description: "Walhad CareLink connects FreeStyle Libre monitoring with the people who care for you.",
};

export default function AboutPage() {
  return (
    <>
      <PageHero eyebrow="About" title="Built for families in the Horn of Africa" />

      <section className="shell max-w-3xl pb-14">
        <div className="space-y-4 text-[0.95rem] leading-relaxed text-navy-800/90">
          <p>
            Diabetes care depends on continuity: someone has to notice a low at 3am. {brand.suite} exists so that
            the people who care for a patient can see real glucose readings and act quickly, without the patient
            having to report anything.
          </p>
          <p>
            We connect to FreeStyle Libre sensors through authorised sources only. Every reading on the platform
            arrived from a real sensor — we never display sample or simulated data as if it were a patient&apos;s own.
          </p>
          <p>
            Family plans cover one patient and a small care circle. Hospital plans give clinics staff accounts,
            assigned patient lists and a ward-level view.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Real data only", v: "No simulated readings" },
            { k: "Consent first", v: "Patients control access" },
            { k: "Built for Somalia", v: "Time zones, SMS, Telegram" },
          ].map((c) => (
            <div key={c.k} className="card p-4">
              <p className="text-[0.86rem] font-extrabold text-navy-900">{c.k}</p>
              <p className="mt-0.5 text-[0.76rem] text-muted">{c.v}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Questions?"
        body="We answer every message."
        primary={{ label: "Contact us", href: "/contact" }}
        secondary={{ label: "See pricing", href: "/pricing" }}
      />
    </>
  );
}
