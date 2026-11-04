import type { Metadata } from "next";
import { ContactForm } from "@/components/site/ContactForm";
import { ContactFaq } from "@/components/site/ContactFaq";
import { CtaBand, Section, SectionHead } from "@/components/site/Layout";
import { IconAlert, IconArrow, IconLock, IconSend, IconShield } from "@/components/ui/Icons";
import { siteContact } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact the Walhad CareLink team for technical support, hospital partnerships or general enquiries.",
};

const CATEGORIES = [
  { icon: <IconSend size={18} />, title: "General enquiry", body: "Questions about the platform, plans or coverage." },
  { icon: <IconShield size={18} />, title: "Technical support", body: "Sensor connection, notifications or dashboard issues." },
  { icon: <IconAlert size={18} />, title: "Hospital partnership", body: "Ward monitoring, staff accounts and onboarding." },
  { icon: <IconLock size={18} />, title: "Privacy request", body: "Access, correction or deletion of your data." },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const contact = siteContact();

  return (
    <>
      {/* hero — deep teal */}
      <section className="relative overflow-hidden bg-deep">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute -left-24 -top-24 h-[380px] w-[380px] rounded-full bg-[#1197a1]/22 blur-3xl" />
          <span className="absolute -right-16 top-10 h-[340px] w-[340px] rounded-full bg-[#1769d2]/18 blur-3xl" />
          <span className="absolute inset-0 dotted-teal opacity-[0.13]" />
        </div>
        <div className="shell relative">
          <div className="grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[0.62fr_0.38fr] lg:py-20">
          <div className="max-w-[640px]">
            <p className="eyebrow eyebrow-on-dark">Contact us</p>
            <h1 className="h-page mt-3.5 text-white">Let&rsquo;s talk about connected care.</h1>
            <p className="mt-4 max-w-[560px] text-[1rem] leading-relaxed text-[#a9c9cd]">
              Contact our team for technical support, hospital partnerships or general enquiries.
            </p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 text-[0.78rem] font-medium text-[#cbe0e3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7fd0d6]" />
              We reply within one business day
            </p>
          </div>

          {/* decorative support card */}
          <div className="hidden lg:block">
            <div className="ml-auto max-w-[300px] rounded-2xl border border-white/12 bg-white/[0.06] p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-white/12 text-[#7fd0d6]">
                  <IconSend size={16} />
                </span>
                <div>
                  <p className="text-[0.82rem] font-semibold text-white">Send us a message</p>
                  <p className="text-[0.68rem] text-[#8fb0b5]">Every enquiry is read by a person</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {["Technical support", "Hospital partnership", "Privacy request"].map((t) => (
                  <div key={t} className="flex items-center justify-between rounded-lg bg-white/[0.05] px-3 py-2">
                    <span className="text-[0.72rem] text-[#cbe0e3]">{t}</span>
                    <IconArrow size={11} className="text-[#7fd0d6]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* two-column: info left, form right */}
      <section className="bg-page section">
        <div className="shell">
          <div className="grid gap-8 lg:grid-cols-[0.42fr_0.58fr] lg:gap-12">
            {/* left */}
            <div>
              <h2 className="h-card">What can we help with?</h2>
              <div className="mt-5 space-y-2.5">
                {CATEGORIES.map((c) => (
                  <div
                    key={c.title}
                    className="flex items-start gap-3.5 rounded-[14px] border border-line bg-white px-4 py-3.5"
                  >
                    <span className="mt-0.5 grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-aqua text-teal-500">
                      {c.icon}
                    </span>
                    <div>
                      <p className="text-[0.875rem] font-semibold text-ink">{c.title}</p>
                      <p className="mt-0.5 text-[0.78rem] leading-relaxed text-muted">{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              {contact.email ? (
                <div className="mt-6 rounded-[14px] border border-line bg-white p-4">
                  <p className="text-[0.72rem] font-bold uppercase tracking-[0.1em] text-faint">Email us directly</p>
                  <a
                    href={`mailto:${contact.email}`}
                    className="mt-1.5 inline-flex items-center gap-1.5 text-[0.9rem] font-semibold text-teal-500 transition hover:gap-2"
                  >
                    {contact.email}
                    <IconArrow size={13} />
                  </a>
                </div>
              ) : null}

              <div className="mt-6 flex items-start gap-2.5 rounded-[14px] border border-[#f0dfc4] bg-amber-soft/50 px-4 py-3.5">
                <span className="mt-0.5 text-warning">
                  <IconAlert size={16} />
                </span>
                <p className="text-[0.78rem] leading-relaxed text-[#7a5a1c]">
                  <strong className="font-semibold">Not for emergencies.</strong> This form is not monitored
                  continuously. For a medical emergency, contact local emergency services.
                </p>
              </div>
            </div>

            {/* right — the form is the focus */}
            <div>
              <ContactForm initialTopic={topic} />
              <p className="mt-4 text-center text-[0.72rem] leading-relaxed text-muted">
                By sending this form you agree that we may contact you about this enquiry. We do not sell or share your
                details.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* compact FAQ */}
      <Section tone="white" tight>
        <SectionHead eyebrow="FAQ" title="Common questions" align="center" />
        <div className="mt-7">
          <ContactFaq />
        </div>
      </Section>

      <CtaBand
        title="Prefer to see the platform first?"
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
