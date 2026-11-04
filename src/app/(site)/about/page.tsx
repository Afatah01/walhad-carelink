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
        <div className="space-y-4 text-[0.98rem] leading-relaxed text-navy-800/90">
          <p>
            {brand.suite} connects FreeStyle Libre sensors to the people who care for a patient, so a low at 3am
            reaches someone who can act.
          </p>
          <p>
            Every reading on the platform came from a real sensor. We never show simulated or sample data as if it
            were a patient&apos;s own.
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
