import Link from "next/link";
import type { ReactNode } from "react";
import { IconArrow } from "@/components/ui/Icons";

/**
 * Page primitives for the public site.
 *
 * Every marketing page is built from these four pieces so the design language
 * is identical everywhere: a compact page header, a card, an icon block and a
 * call-to-action. Pages stay short because these do the heavy lifting.
 */

export function PageHeader({
  eyebrow,
  title,
  intro,
  actions,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  actions?: { label: string; href: string; variant?: "primary" | "ghost" }[];
  center?: boolean;
}) {
  return (
    <header className={`border-b border-line bg-mist/60 ${center ? "text-center" : ""}`}>
      <div className={`shell ${center ? "max-w-2xl" : "max-w-3xl"} py-12 md:py-16`}>
        {eyebrow ? (
          <p
            className={`text-[0.7rem] font-bold uppercase tracking-[0.18em] text-teal-600 ${
              center ? "text-center" : ""
            }`}
          >
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.035em] text-navy-900 md:text-[2.9rem]">
          {title}
        </h1>
        {intro ? (
          <p className={`mt-3 text-[1rem] leading-relaxed text-muted md:text-[1.06rem] ${center ? "mx-auto" : "max-w-2xl"}`}>
            {intro}
          </p>
        ) : null}
        {actions?.length ? (
          <div className={`mt-6 flex flex-wrap gap-2.5 ${center ? "justify-center" : ""}`}>
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`btn ${a.variant === "ghost" ? "btn-ghost" : "btn-primary"}`}
              >
                {a.label}
                <IconArrow size={15} />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

export function Section({
  title,
  intro,
  children,
  tone = "white",
  center = false,
}: {
  title?: string;
  intro?: string;
  children: ReactNode;
  tone?: "white" | "mist";
  center?: boolean;
}) {
  return (
    <section className={tone === "mist" ? "bg-mist/70 py-14 md:py-20" : "py-14 md:py-20"}>
      <div className="shell">
        {title ? (
          <div className={`mb-8 ${center ? "mx-auto max-w-xl text-center" : "max-w-2xl"}`}>
            <h2 className="text-[1.5rem] font-extrabold tracking-[-0.03em] text-navy-900 md:text-[1.9rem]">
              {title}
            </h2>
            {intro ? <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{intro}</p> : null}
          </div>
        ) : null}
        {children}
      </div>
    </section>
  );
}

export function IconCard({
  icon,
  title,
  body,
  href,
  tone = "teal",
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  href?: string;
  tone?: "teal" | "blue" | "amber";
}) {
  const tones = {
    teal: "bg-teal-50 text-teal-600",
    blue: "bg-brand-50 text-brand-600",
    amber: "bg-[#fef4e5] text-amber",
  };
  const inner = (
    <>
      <span className={`grid h-11 w-11 flex-none place-items-center rounded-xl ${tones[tone]}`}>{icon}</span>
      <h3 className="mt-4 text-[1rem] font-bold tracking-[-0.015em] text-navy-900">{title}</h3>
      {body ? <p className="mt-1.5 text-[0.875rem] leading-relaxed text-muted">{body}</p> : null}
      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-bold text-teal-600">
          Learn more <IconArrow size={13} />
        </span>
      ) : null}
    </>
  );

  return href ? (
    <Link href={href} className="card card-hover flex h-full flex-col p-5">
      {inner}
    </Link>
  ) : (
    <div className="card flex h-full flex-col p-5">{inner}</div>
  );
}

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
    <section className="shell pb-16 pt-4">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-navy-900 px-6 py-10 text-center md:px-12 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl"
        />
        <div className="relative">
          <h2 className="mx-auto max-w-xl text-[1.6rem] font-extrabold tracking-[-0.03em] text-white md:text-[2.1rem]">
            {title}
          </h2>
          {body ? <p className="mx-auto mt-2.5 max-w-md text-[0.95rem] leading-relaxed text-white/70">{body}</p> : null}
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link href={primary.href} className="btn bg-white text-navy-900 hover:bg-white/90">
              {primary.label}
              <IconArrow size={15} />
            </Link>
            {secondary ? (
              <Link href={secondary.href} className="btn border-white/25 bg-white/10 text-white hover:bg-white/20">
                {secondary.label}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
