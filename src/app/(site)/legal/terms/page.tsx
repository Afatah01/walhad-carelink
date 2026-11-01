import type { Metadata } from "next";
import { PageHero, Prose } from "@/components/marketing/PageHero";
import { IconInfo } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms covering acceptable use, subscriptions, alerting limitations, clinical responsibility and account security.",
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal & privacy"
        title="Terms of service"
        body="The practical agreement behind using Walhad CareLink as a family or as a healthcare organisation."
      />
      <section className="shell max-w-3xl py-14">
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-high-soft bg-high-soft/60 p-4">
          <IconInfo size={18} className="mt-0.5 flex-none text-high" />
          <p className="text-[0.84rem] leading-relaxed text-[#7a4a0e]">
            <strong className="font-bold">Not an emergency service.</strong> Walhad CareLink notifies authorised
            people; it does not provide medical care, diagnosis or emergency dispatch. Always follow your care
            plan and contact local emergency services in an emergency.
          </p>
        </div>
        <Prose>
          <h2>1. The service</h2>
          <p>
            Walhad CareLink displays glucose information obtained from an authorised FreeStyle Libre data source and
            delivers notifications to authorised recipients. Data availability depends on your sensor, the Libre
            apps, your device and the availability of the upstream data service.
          </p>

          <h2>2. Accounts and roles</h2>
          <p>
            You must keep your credentials secure and must not share an account. Family recipients only see the
            patients who have authorised them. Clinical accounts must be created by the organisation&apos;s
            administrator and are removed when access is no longer required.
          </p>

          <h2>3. Clinical responsibility</h2>
          <p>
            Glucose values, trends and time-in-range figures are informational. Treatment decisions remain the
            responsibility of the patient and their qualified healthcare professionals. Alerts are provided on a
            best-effort basis and can be delayed or missed during connectivity, device or platform interruptions.
          </p>

          <h2>4. Subscriptions and payment</h2>
          <ul>
            <li>Family plans are billed monthly in advance in USD; hospital plans are quoted per organisation.</li>
            <li>Subscriptions activate only after payment is verified by the payment provider.</li>
            <li>Recipient and SMS limits apply per plan as published on the pricing page.</li>
            <li>You may cancel at any time; access continues until the end of the paid period.</li>
            <li>Taxes are additional where applicable.</li>
          </ul>

          <h2>5. Acceptable use</h2>
          <ul>
            <li>Do not attempt to access data you are not authorised to view.</li>
            <li>Do not scrape, reverse engineer or overload the service.</li>
            <li>Do not use the platform to harass or monitor someone without consent.</li>
            <li>Do not upload unlawful content or attempt to compromise security.</li>
          </ul>

          <h2>6. Third-party services</h2>
          <p>
            The service relies on third-party providers including Abbott&apos;s Libre cloud (where authorised),
            Telegram, SMS gateways and push services. Their availability and terms apply to those components.
            FreeStyle Libre is a trademark of Abbott; Walhad CareLink is an independent platform and is not
            affiliated with or endorsed by Abbott.
          </p>

          <h2>7. Availability and changes</h2>
          <p>
            We work to keep the service available but do not guarantee uninterrupted operation. We may update
            features, and will communicate material changes to plan pricing or limits in advance.
          </p>

          <h2>8. Liability</h2>
          <p>
            To the maximum extent permitted by law, Walhad CareLink is not liable for indirect or consequential
            loss arising from delayed or missed notifications, third-party outages, or clinical decisions made
            without professional advice.
          </p>

          <h2>9. Termination</h2>
          <p>
            We may suspend accounts that breach these terms or endanger other users. You may close your workspace
            at any time; data export is available before closure.
          </p>
        </Prose>
      </section>
    </>
  );
}
