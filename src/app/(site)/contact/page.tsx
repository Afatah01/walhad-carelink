import type { Metadata } from "next";
import { PageHero } from "@/components/marketing/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { FaqAccordion, type FaqItem } from "@/components/marketing/Faq";
import { siteContact } from "@/lib/site-config";
import { IconClock, IconHospital, IconInfo, IconMessage, IconShield, IconStethoscope } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Walhad CareLink about subscriptions, hospital partnerships, technical support or anything else.",
};

const FAQS: FaqItem[] = [
  {
    q: "How quickly will I hear back?",
    a: "Support requests are answered within one business day. Hospital partnership enquiries receive a written follow-up after a short discovery call.",
  },
  {
    q: "I need help connecting my sensor.",
    a: "Choose topic “Technical support” and include your sensor model and the message you see in the Libre app. Never send your Libre password.",
  },
  {
    q: "Can I request a demo?",
    a: "Yes — mention “demo” in your message. When demo mode is enabled, you can also sign in immediately from the sign-in page with the sample accounts.",
  },
  {
    q: "Do you offer support in Somali or Arabic?",
    a: "Written support is available in English, Somali and Arabic. Mention your preferred language and we will match your request accordingly.",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  const contact = siteContact();
  const initialTopic = ["general", "subscription", "hospital", "technical", "privacy"].includes(params.topic ?? "")
    ? (params.topic as string)
    : "general";

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={
          <>
            Tell us what you need —{" "}
            <span className="bg-gradient-to-r from-brand-600 to-teal-500 bg-clip-text text-transparent">
              we&apos;ll route it properly
            </span>
          </>
        }
        body="Customer support, hospital partnerships, technical help and privacy requests all start here."
      />

      <section className="shell py-14">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-lg border border-line bg-white p-6 shadow-card md:p-8">
            <h2 className="text-lg font-extrabold text-navy-900">Send us a message</h2>
            <p className="mt-1 text-[0.86rem] text-muted">
              Fields marked with * are required. We never ask for your Libre password.
            </p>
            <div className="mt-5">
              <ContactForm initialTopic={initialTopic} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-[0.95rem] font-extrabold text-navy-900">Direct channels</h3>
              {contact.email || contact.phone || contact.address ? (
                <ul className="mt-3 space-y-2.5 text-[0.86rem]">
                  {contact.email ? (
                    <li className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-brand-50 text-brand-600">
                        <IconMessage size={15} />
                      </span>
                      <div>
                        <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">Email</p>
                        <a href={`mailto:${contact.email}`} className="font-semibold text-navy-900 link-underline">
                          {contact.email}
                        </a>
                      </div>
                    </li>
                  ) : null}
                  {contact.phone ? (
                    <li className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-teal-50 text-teal-600">
                        <IconClock size={15} />
                      </span>
                      <div>
                        <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">Phone</p>
                        <a href={`tel:${contact.phone}`} className="font-semibold text-navy-900 link-underline">
                          {contact.phone}
                        </a>
                      </div>
                    </li>
                  ) : null}
                  {contact.address ? (
                    <li className="flex items-start gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-mist text-navy-700">
                        <IconHospital size={15} />
                      </span>
                      <div>
                        <p className="text-[0.72rem] font-bold uppercase tracking-wider text-muted">Office</p>
                        <p className="font-semibold text-navy-900">{contact.address}</p>
                      </div>
                    </li>
                  ) : null}
                </ul>
              ) : (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-mist/70 p-3">
                  <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
                  <p className="text-[0.78rem] leading-relaxed text-muted">
                    Business contact details are not published on this deployment yet. Use the form and your
                    message will be recorded for the operating team.
                  </p>
                </div>
              )}
              {contact.supportHours ? (
                <p className="mt-3 rounded-lg bg-[#fbfdff] p-2.5 text-[0.76rem] text-muted">
                  Support hours: {contact.supportHours}
                </p>
              ) : null}
            </div>

            <div className="card p-5">
              <h3 className="text-[0.95rem] font-extrabold text-navy-900">Choose the right topic</h3>
              <ul className="mt-3 space-y-2.5 text-[0.84rem]">
                {[
                  { icon: IconStethoscope, label: "Technical support", body: "Sensor connection, alert delivery, Telegram linking." },
                  { icon: IconHospital, label: "Hospital partnership", body: "Ward pilots, staff accounts, custom pricing." },
                  { icon: IconShield, label: "Privacy request", body: "Access, correction, deletion or consent withdrawal." },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <li key={t.label} className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-lg bg-mist text-navy-700">
                        <Icon size={14} />
                      </span>
                      <div>
                        <p className="font-bold text-navy-900">{t.label}</p>
                        <p className="text-[0.78rem] leading-relaxed text-muted">{t.body}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#f6d2d2] bg-low-soft p-4">
              <p className="text-[0.82rem] font-bold text-low">Medical emergency?</p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-[#8f2f2f]">
                Do not use this form. Contact local emergency services or your clinical team immediately.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-xl font-extrabold text-navy-900">Contact questions</h2>
            <div className="mt-3">
              <FaqAccordion items={FAQS} defaultOpen={-1} />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-gradient-to-br from-[#f3f9ff] to-[#f1fbf7] p-6">
            <h2 className="text-lg font-extrabold text-navy-900">Prefer to explore first?</h2>
            <p className="mt-2 text-[0.86rem] leading-relaxed text-muted">
              The demo workspace includes two families and a hospital organisation with realistic glucose data,
              alert history and Telegram previews.
            </p>
            <a href="/login" className="btn btn-primary mt-4">
              Open the demo workspace
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
