/**
 * Shared layout vocabulary for the public site.
 *
 * Every page is composed from these so spacing, widths and background rhythm
 * stay identical — but the *arrangement* differs page to page (editorial,
 * product showcase, timeline, showcase panels). The point is one system, not
 * one template.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow, IconCheck } from "@/components/ui/Icons";

/* ------------------------------------------------------------------ */
/* Page hero                                                           */
/* ------------------------------------------------------------------ */

export function PageHero({
  eyebrow,
  title,
  body,
  tone = "aqua",
  children,
  aside,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  body?: string;
  tone?: "aqua" | "blue" | "white" | "deep";
  children?: ReactNode;
  aside?: ReactNode;
  align?: "left" | "center";
}) {
  const surface =
    tone === "deep"
      ? "bg-deep text-white"
      : tone === "blue"
        ? "hero-wash-blue"
        : tone === "aqua"
          ? "hero-wash"
          : "bg-white border-b border-line";

  return (
    <section className={`relative overflow-hidden ${surface}`}>
      {/* decoration */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <span className="blob blob-aqua -left-24 -top-24 h-[340px] w-[340px] opacity-70" />
        <span className="blob blob-blue -right-20 top-10 h-[300px] w-[300px] opacity-60" />
      </div>

      <div className="shell relative">
        <div
          className={
            aside
              ? "grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-20"
              : align === "center"
                ? "mx-auto max-w-[760px] py-12 text-center md:py-16 lg:py-20"
                : "max-w-[720px] py-12 md:py-16 lg:py-20"
          }
        >
          <div>
            <p className={`eyebrow ${tone === "deep" ? "eyebrow-on-dark" : ""}`}>{eyebrow}</p>
            <h1 className={`mt-3.5 ${tone === "deep" ? "h-page text-white" : "h-page"}`}>{title}</h1>
            {body ? (
              <p className={`body-lg mt-4 ${tone === "deep" ? "text-[#a9c9cd]" : ""} ${align === "center" ? "mx-auto" : ""}`}>
                {body}
              </p>
            ) : null}
            {children ? <div className="mt-7 flex flex-wrap items-center gap-3">{children}</div> : null}
          </div>
          {aside ? <div className="relative">{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section wrapper — controls the background rhythm                    */
/* ------------------------------------------------------------------ */

type Tone = "white" | "page" | "aqua" | "blue" | "deep";

const TONE: Record<Tone, string> = {
  white: "bg-surface",
  page: "bg-page",
  aqua: "bg-aqua",
  blue: "bg-softblue",
  deep: "bg-deep text-white",
};

export function Section({
  children,
  tone = "white",
  tight = false,
  className = "",
  id,
}: {
  children: ReactNode;
  tone?: Tone;
  tight?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`${TONE[tone]} ${tight ? "section-tight" : "section"} ${className}`}>
      <div className="shell">{children}</div>
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  body,
  onDark = false,
  align = "left",
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: string;
  onDark?: boolean;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-[680px] text-center" : "max-w-[640px]"} ${className}`}>
      {eyebrow ? <p className={`eyebrow ${onDark ? "eyebrow-on-dark" : ""}`}>{eyebrow}</p> : null}
      <h2 className={`mt-3 ${onDark ? "h-section text-white" : "h-section"}`}>{title}</h2>
      {body ? (
        <p className={`body-lg mt-3.5 ${onDark ? "text-[#a9c9cd]" : ""} ${align === "center" ? "mx-auto" : ""}`}>{body}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Feature tile                                                        */
/* ------------------------------------------------------------------ */

export function FeatureTile({
  icon,
  title,
  body,
  tone = "teal",
}: {
  icon: ReactNode;
  title: string;
  body: string;
  tone?: "teal" | "blue" | "amber";
}) {
  const tile =
    tone === "blue" ? "icon-tile icon-tile-blue" : tone === "amber" ? "icon-tile icon-tile-amber" : "icon-tile";
  return (
    <div className="group card card-hover p-[26px]">
      <span className={tile}>{icon}</span>
      <h3 className="h-card mt-5">{title}</h3>
      <p className="body-sm mt-2">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Plan card                                                           */
/* ------------------------------------------------------------------ */

export function PlanCard({
  name,
  price,
  from,
  period,
  blurb,
  features,
  cta,
  href,
  recommended = false,
}: {
  name: string;
  price: number;
  from?: boolean;
  period?: string;
  blurb?: string;
  features: string[];
  cta: string;
  href: string;
  recommended?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-[18px] bg-white p-[26px] ${
        recommended
          ? "border-2 border-teal-500 shadow-[0_14px_40px_-22px_rgba(8,127,140,0.45)]"
          : "border border-line shadow-[var(--shadow-card)]"
      }`}
    >
      {recommended ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-white">
          Recommended
        </span>
      ) : null}

      <h3 className="font-[family-name:var(--font-display)] text-[1.05rem] font-bold text-ink">{name}</h3>
      {blurb ? <p className="body-sm mt-1.5">{blurb}</p> : null}

      <div className="mt-5 flex items-end gap-1.5">
        {from ? <span className="mb-1 text-[0.8rem] font-medium text-muted">from</span> : null}
        <span className="font-[family-name:var(--font-display)] text-[2.6rem] font-bold leading-none tracking-[-0.04em] text-deep">
          ${price}
        </span>
        <span className="mb-1.5 text-[0.82rem] font-medium text-muted">/{period ?? "month"}</span>
      </div>

      <ul className="mt-6 flex-1 space-y-3 border-t border-line pt-6">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <span className="mt-[3px] grid h-4 w-4 flex-none place-items-center rounded-full bg-aqua text-teal-500">
              <IconCheck size={10} />
            </span>
            <span className="text-[0.875rem] leading-snug text-ink/85">{f}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`btn mt-6 w-full ${recommended ? "btn-primary" : "btn-ghost"}`}
      >
        {cta}
        <IconArrow size={15} />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA band                                                            */
/* ------------------------------------------------------------------ */

export function CtaBand({
  title,
  body,
  primary,
  secondary,
}: {
  title: string;
  body?: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="bg-surface pb-16 pt-2 md:pb-24">
      <div className="shell">
        <div className="relative isolate overflow-hidden rounded-[28px] bg-deep px-6 py-12 text-center md:px-16 md:py-16">
          <div className="pointer-events-none absolute inset-0" aria-hidden>
            <span className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#1197a1]/22 blur-2xl" />
            <span className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-[#1769d2]/18 blur-2xl" />
            <span className="absolute inset-0 dotted-teal opacity-[0.18]" />
          </div>
          <div className="relative">
            <h2 className="h-section mx-auto max-w-[620px] text-white">{title}</h2>
            {body ? <p className="mx-auto mt-3 max-w-[520px] text-[0.95rem] leading-relaxed text-[#a9c9cd]">{body}</p> : null}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={primary.href} className="btn btn-on-dark">
                {primary.label}
                <IconArrow size={15} />
              </Link>
              {secondary ? (
                <Link href={secondary.href} className="btn btn-outline-dark">
                  {secondary.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
