import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/marketing/PageHero";
import { FaqAccordion, type FaqItem } from "@/components/marketing/Faq";
import { CtaBand } from "@/components/marketing/Sections";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description:
    "Answers about FreeStyle Libre integration, family alerts, SMS, Telegram notifications, location sharing, offline behaviour and subscriptions.",
};

const SECTIONS: { title: string; items: FaqItem[] }[] = [
  {
    title: "FreeStyle Libre & data",
    items: [
      {
        q: "How does FreeStyle Libre integration work?",
        a: "Your sensor measures glucose and the Libre app uploads readings to Abbott's cloud. Walhad CareLink reads those readings through an authorised route — the official LibreView Data Sharing API once your organisation is approved, a consented LibreLinkUp follower connection, or your existing secure phone bridge. Readings are stored with their original timestamps and are never edited.",
      },
      {
        q: "Do you need my LibreLink password?",
        a: "No. We never store plain Libre account passwords. Where a follower session is used, it is encrypted with AES-256-GCM at rest and used only server-side to fetch readings. You can revoke the connection at any time.",
      },
      {
        q: "Which sensors and regions are supported?",
        a: "Support depends on the sensor model, the Libre app version and your country's cloud availability. Libre 2 and Libre 3 produce the richest data. During onboarding we confirm exactly what your account can expose before you rely on any alert.",
      },
      {
        q: "What happens if the sensor stops synchronising?",
        a: "After a configurable window without new readings, the dashboard marks the data as delayed and — if you enabled it — sends a sync warning to your family via Telegram, push or SMS. We never show the last value as if it were live.",
      },
      {
        q: "What happens when internet access is interrupted?",
        a: "Readings resume when the patient's phone reconnects to the Libre cloud. Anything that happened during the gap is backfilled with its original timestamps. Alerts during the outage cannot fire, which is why the missing-data warning exists.",
      },
    ],
  },
  {
    title: "Family alerts & channels",
    items: [
      {
        q: "How can family members receive alerts?",
        a: "The patient (or an administrator) invites authorised family members and caregivers. Each recipient chooses their channels: push notifications, SMS, Telegram, audible ring and in-app. Plan limits apply — 2 recipients on Family Basic, 5 on Family Premium.",
      },
      {
        q: "How do SMS notifications work?",
        a: "When an alert rule includes SMS, we send a short text with the patient name, reading and status. Each message counts against your monthly allowance. You can switch SMS off per recipient at any time to conserve allowance, and delivery status is recorded in the notification centre.",
      },
      {
        q: "How do Telegram notifications work?",
        a: "A family member opens the dashboard and generates a single-use connection code, then starts the bot with that code. Their chat is linked to the patient they are authorised to view. From Telegram they can use /glucose, /history, /alerts, /status, /settings, /acknowledge and /disconnect — or tap the inline Acknowledge button.",
      },
      {
        q: "What happens if nobody acknowledges an alert?",
        a: "For plans with escalation, the alert status changes to escalated after the configured window and the next set of contacts is notified. The original alert, deliveries and acknowledgements are all retained in the history.",
      },
      {
        q: "Does the audible ring work with the phone locked?",
        a: "Browsers and mobile operating systems restrict background audio. Ring alerts are most reliable when the dashboard is open; push notifications with critical urgency are used for background delivery where supported.",
      },
    ],
  },
  {
    title: "Privacy, location & safety",
    items: [
      {
        q: "How does location sharing work?",
        a: "Location sharing is off by default and requires explicit consent from the patient. When enabled, authorised recipients can open the shared location during an alert. Consent can be withdrawn at any moment, which immediately stops new location data being shared.",
      },
      {
        q: "Who can see my glucose readings?",
        a: "Only people the patient authorises, plus the clinical team if the patient is monitored by a hospital organisation. Every view is tied to an account with a defined role; family members with 'alerts' permission see readings but not administrative data.",
      },
      {
        q: "Is Walhad CareLink an emergency service?",
        a: "No. We notify authorised people so a human can act. We cannot dispatch emergency services, and delivery can be affected by network, device and platform restrictions. In an emergency, call local emergency services.",
      },
      {
        q: "How is my data protected?",
        a: "HTTPS everywhere, http-only session cookies, bcrypt password hashing, AES-256-GCM encryption of provider credentials, role-based access control, rate limiting, input validation and audit logging of administrative and clinical actions.",
      },
    ],
  },
  {
    title: "Subscriptions & hospitals",
    items: [
      {
        q: "How do monthly subscriptions work?",
        a: "Plans are billed monthly in advance in USD. Your workspace activates after the provider confirms payment, renews on the same date each month, and can be cancelled at any time — access continues until the end of the paid period.",
      },
      {
        q: "How do plan upgrades work?",
        a: "Choose the new plan in Billing, confirm the payment and the higher limits apply immediately. Downgrades take effect at the next renewal so you never lose access mid-month.",
      },
      {
        q: "What is included in the hospital plan?",
        a: "Hospital plans are quoted per organisation: patient capacity, clinical seats, notification volume, integrations and support. The published $100/month is a starting price, not an unlimited subscription.",
      },
      {
        q: "Can I export my data?",
        a: "Yes. Glucose history and alert logs can be exported as CSV from the dashboard. Hospital organisations can also request a structured export during offboarding.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        align="center"
        eyebrow="Help centre"
        title="Frequently asked questions"
        body="Everything families, caregivers and clinical teams ask before they start. If something is missing, contact us and we will answer it directly."
      />

      <section className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-muted">Topics</p>
            <ul className="mt-3 space-y-1">
              {SECTIONS.map((s) => (
                <li key={s.title}>
                  <a
                    href={`#${s.title.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                    className="block rounded-lg px-3 py-2 text-[0.84rem] font-semibold text-navy-800 transition hover:bg-mist hover:text-brand-700"
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-line bg-[#fbfdff] p-3.5">
              <p className="text-[0.8rem] font-bold text-navy-900">Still stuck?</p>
              <p className="mt-1 text-[0.76rem] leading-relaxed text-muted">
                Our support team answers technical and clinical setup questions.
              </p>
              <Link href="/contact" className="btn btn-sm btn-primary mt-2.5 w-full">
                Contact support
              </Link>
            </div>
          </aside>

          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <div key={section.title} id={section.title.toLowerCase().replace(/[^a-z]+/g, "-")}>
                <h2 className="text-xl font-extrabold text-navy-900">{section.title}</h2>
                <div className="mt-3">
                  <FaqAccordion items={section.items} defaultOpen={-1} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Ready when you are"
        body="Choose a plan, connect your Libre account and invite the people who care."
        primary={{ label: "View pricing", href: "/pricing" }}
        secondary={{ label: "Contact us", href: "/contact" }}
      />
    </>
  );
}
