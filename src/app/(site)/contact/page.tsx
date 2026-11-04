import type { Metadata } from "next";
import { PageHeader } from "@/components/site/PageKit";
import { ContactForm } from "@/components/site/ContactForm";
import { IconBell, IconLock, IconTelegram } from "@/components/ui/Icons";
import { siteContact } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Walhad CareLink for general enquiries, technical support, hospital partnerships or privacy requests.",
};

const CATEGORIES = [
  "General Enquiry",
  "Technical Support",
  "Hospital Partnership",
  "Privacy Request",
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const params = await searchParams;
  const contact = siteContact();
  const hasPhone = Boolean(contact.phone);

  return (
    <>
      <PageHeader
        eyebrow="Contact Us"
        title="How Can We Help?"
        intro="Send us a message and we will reply by email."
      />

      <section className="shell py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
          <ContactForm initialTopic={params?.topic ?? "general"} />

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">Categories</h2>
              <ul className="mt-3 space-y-2">
                {CATEGORIES.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-[0.86rem] text-navy-800">
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-teal-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card p-5">
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">Support</h2>
              <ul className="mt-3 space-y-3">
                <li className="flex items-start gap-2.5">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-teal-50 text-teal-600">
                    <IconBell size={14} />
                  </span>
                  <div>
                    <p className="text-[0.84rem] font-semibold text-navy-900">Reply time</p>
                    <p className="text-[0.78rem] text-muted">Within one business day.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-teal-50 text-teal-600">
                    <IconLock size={14} />
                  </span>
                  <div>
                    <p className="text-[0.84rem] font-semibold text-navy-900">Privacy requests</p>
                    <p className="text-[0.78rem] text-muted">Data access and deletion.</p>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="grid h-7 w-7 flex-none place-items-center rounded-lg bg-teal-50 text-teal-600">
                    <IconTelegram size={14} />
                  </span>
                  <div>
                    <p className="text-[0.84rem] font-semibold text-navy-900">Technical support</p>
                    <p className="text-[0.78rem] text-muted">Sensor and alert issues.</p>
                  </div>
                </li>
              </ul>
              {contact.email || hasPhone ? (
                <div className="mt-4 border-t border-line pt-3 text-[0.82rem] text-muted">
                  {contact.email ? <p>{contact.email}</p> : null}
                  {contact.phone ? <p>{contact.phone}</p> : null}
                </div>
              ) : null}
            </div>

            <p className="px-1 text-[0.75rem] leading-relaxed text-muted">
              For a medical emergency, contact emergency services. This form is not monitored continuously.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
