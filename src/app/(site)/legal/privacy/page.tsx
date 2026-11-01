import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/marketing/PageHero";
import { siteContact } from "@/lib/site-config";
import { IconShield } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Privacy & data protection",
  description:
    "How Walhad CareLink collects, stores, shares and protects health information, including consent, retention and your rights.",
};

export default function PrivacyPage() {
  const contact = siteContact();
  return (
    <>
      <PageHero
        eyebrow="Legal & privacy"
        title="Privacy and responsible data handling"
        body="Health data belongs to the person it describes. This page explains what we collect, why, and how you stay in control."
      />
      <section className="shell max-w-3xl py-14">
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-teal-100 bg-teal-50/60 p-4">
          <IconShield size={18} className="mt-0.5 flex-none text-teal-700" />
          <p className="text-[0.84rem] leading-relaxed text-navy-800">
            This document is a clear summary of our operating principles. It is not a substitute for a
            jurisdiction-specific legal agreement; hospitals and partners receive a signed data processing
            agreement during onboarding.
          </p>
        </div>
        <Prose>
          <h2>1. Information we process</h2>
          <ul>
            <li><strong>Account information:</strong> name, email address, role, optional phone number and language preference.</li>
            <li><strong>Glucose data:</strong> readings, timestamps, trend information and sensor status retrieved from an authorised Libre data source.</li>
            <li><strong>Alert data:</strong> triggered alerts, notification deliveries, acknowledgements and escalation events.</li>
            <li><strong>Consent records:</strong> who authorised whom to view readings, SMS, Telegram or location.</li>
            <li><strong>Technical logs:</strong> authentication events, administrative actions and integration errors.</li>
          </ul>

          <h2>2. Why we process it</h2>
          <ul>
            <li>To display glucose information to authorised people and clinical teams.</li>
            <li>To deliver alerts through push, SMS, Telegram and in-app channels.</li>
            <li>To operate subscriptions, invoicing and support.</li>
            <li>To maintain security, auditability and service reliability.</li>
          </ul>

          <h2>3. Legal bases and consent</h2>
          <p>
            Where required, we rely on explicit consent for sharing health information with family members and for
            location sharing. Consent can be withdrawn at any time from the dashboard, which immediately stops new
            sharing. Clinical access within a hospital organisation is governed by that organisation&apos;s policy and
            our written agreement with them.
          </p>

          <h2>4. Credentials and security</h2>
          <ul>
            <li>Passwords are hashed with bcrypt; plaintext passwords are never stored.</li>
            <li>Provider sessions and API credentials are encrypted with AES-256-GCM.</li>
            <li>Sessions use http-only, same-site cookies over HTTPS.</li>
            <li>Access is role-based, rate-limited and audit logged.</li>
            <li>Bot tokens and SMS credentials are server-side environment variables, never sent to browsers.</li>
          </ul>

          <h2>5. Sharing with third parties</h2>
          <p>
            We share the minimum necessary data with the service providers that operate the platform: the
            messaging provider used for SMS, Telegram&apos;s Bot API for chat delivery, our push service and the
            Libre data source you authorised. We do not sell health data or use it for advertising.
          </p>

          <h2>6. Retention</h2>
          <p>
            Glucose history and alert logs are retained while your workspace is active, plus a limited window
            after cancellation so you can export your data. Audit logs are retained for security and compliance.
            You can request deletion of account data, subject to legal retention requirements.
          </p>

          <h2>7. Your rights</h2>
          <ul>
            <li>Access a copy of the personal data we hold about you.</li>
            <li>Correct inaccurate account information.</li>
            <li>Withdraw consent for sharing and location at any time.</li>
            <li>Export glucose history and alert logs as CSV.</li>
            <li>Request deletion of your account and associated records.</li>
          </ul>

          <h2>8. International considerations</h2>
          <p>
            We design with privacy regulations such as HIPAA (where applicable to a covered entity or business
            associate), GDPR-style data minimisation and regional health data rules in mind. Where a deployment is
            operated by a hospital, that organisation determines the applicable framework and we operate as its
            processor.
          </p>

          <h2>9. Contact</h2>
          <p>
            {contact.email ? (
              <>Privacy requests can be sent to <a className="font-semibold text-brand-700 link-underline" href={`mailto:${contact.email}`}>{contact.email}</a>.</>
            ) : (
              <>Privacy requests can be submitted through our contact form and are recorded for the operating team.</>
            )}{" "}
            Please include the email address associated with your account so we can verify the request.
          </p>
        </Prose>
      </section>
    </>
  );
}
