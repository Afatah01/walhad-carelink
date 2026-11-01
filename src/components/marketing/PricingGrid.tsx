"use client";

import Link from "next/link";
import type { Plan } from "@/lib/billing/plans";
import { IconArrow, IconCheck, IconSpark, IconStethoscope } from "@/components/ui/Icons";

function planIcon(slug: string) {
  return slug === "hospital" ? IconStethoscope : IconSpark;
}

function PriceBlock({ plan, size = "md" }: { plan: Plan; size?: "md" | "lg" }) {
  const amount = plan.price_cents / 100;
  const whole = Math.floor(amount);
  const cents = Math.round((amount - whole) * 100);
  return (
    <div className="flex items-end gap-1.5">
      {plan.price_from ? (
        <span className="pb-2 text-[0.72rem] font-bold uppercase tracking-wider text-muted">From</span>
      ) : null}
      <span
        className={`font-extrabold tracking-tight text-navy-900 ${
          size === "lg" ? "text-[3rem] leading-none" : "text-[2.6rem] leading-none"
        }`}
      >
        <span className="align-top text-[1.3rem] font-bold">$</span>
        {whole}
        {cents ? <span className="text-[1.3rem]">.{String(cents).padStart(2, "0")}</span> : null}
      </span>
      <span className="pb-2 text-[0.8rem] font-semibold text-muted">
        {plan.currency} / {plan.billing_interval}
      </span>
    </div>
  );
}

export function PricingGrid({
  plans,
  compact = false,
  highlightedSlug,
}: {
  plans: Plan[];
  compact?: boolean;
  highlightedSlug?: string | null;
}) {
  return (
    <div className={`grid gap-5 ${compact ? "md:grid-cols-2" : "lg:grid-cols-3"}`}>
      {plans.map((plan) => {
        const featured = plan.highlight === 1 || plan.slug === highlightedSlug;
        const Icon = planIcon(plan.slug);
        const features = compact
          ? plan.features.slice(0, plan.slug === "hospital" ? 6 : 7)
          : plan.features;

        return (
          <div
            key={plan.id}
            className={`relative flex flex-col overflow-hidden rounded-[1.6rem] transition-all duration-300 ${
              featured
                ? "border-2 border-brand-500/70 bg-white shadow-[0_30px_70px_-38px_rgba(0,61,120,0.55)] lg:-translate-y-1.5 lg:scale-[1.015]"
                : "border border-line bg-white shadow-soft hover:-translate-y-1 hover:shadow-card"
            }`}
          >
            {featured ? (
              <>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-400 via-brand-500 to-navy-700" />
                <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-brand-100/60 blur-2xl" />
              </>
            ) : null}

            <div className="flex flex-1 flex-col p-6 md:p-7">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-xl ${
                      featured ? "bg-brand-500 text-white" : "bg-mist text-navy-700"
                    }`}
                  >
                    <Icon size={18} />
                  </span>
                  <div>
                    <h3 className="text-[1.05rem] font-extrabold leading-tight text-navy-900">{plan.name}</h3>
                    {plan.slug === "hospital" ? (
                      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                        {plan.recipient_limit === null ? "Custom capacity" : ""}
                      </p>
                    ) : (
                      <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">
                        {plan.patient_limit ?? 1} primary patient · {plan.recipient_limit ?? "—"} alert recipients
                      </p>
                    )}
                  </div>
                </div>
                {plan.badge ? (
                  <span
                    className={`flex-none rounded-full px-2.5 py-1 text-[0.6rem] font-extrabold uppercase tracking-[0.1em] ${
                      featured ? "bg-teal-500 text-white" : "bg-navy-50 text-navy-700"
                    }`}
                  >
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <p className="mt-3 min-h-[2.6rem] text-[0.84rem] leading-relaxed text-muted">{plan.tagline}</p>

              <div className="mt-4">
                <PriceBlock plan={plan} size={featured ? "lg" : "md"} />
                <p className="mt-1.5 text-[0.72rem] font-semibold text-muted">
                  {plan.slug === "hospital"
                    ? "Final price depends on patients, staff, integrations and notification volume."
                    : "Billed monthly · cancel anytime · taxes where applicable."}
                </p>
              </div>

              <div className="my-5 h-px w-full bg-line" />

              <ul className="flex-1 space-y-2.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[0.84rem] leading-snug text-navy-800">
                    <span
                      className={`mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full ${
                        featured ? "bg-teal-500/15 text-teal-600" : "bg-brand-50 text-brand-600"
                      }`}
                    >
                      <IconCheck size={10} />
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
                {compact && plan.features.length > features.length ? (
                  <li className="pl-6 text-[0.78rem] font-semibold text-brand-600">
                    +{plan.features.length - features.length} more included
                  </li>
                ) : null}
              </ul>

              <Link
                href={plan.cta_href ?? "/pricing"}
                className={`btn mt-6 w-full ${featured ? "btn-primary" : plan.slug === "hospital" ? "btn-ghost" : "btn-teal"}`}
              >
                {plan.cta_label ?? `Choose ${plan.name}`}
                <IconArrow size={16} />
              </Link>
              {plan.slug === "hospital" ? (
                <p className="mt-2 text-center text-[0.7rem] text-muted">Custom quote within 2 business days</p>
              ) : (
                <p className="mt-2 text-center text-[0.7rem] text-muted">
                  Secure checkout · verified payment confirmation
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
