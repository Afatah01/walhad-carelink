import Link from "next/link";
import { IconArrow } from "@/components/ui/Icons";

export function PageHero({
  eyebrow,
  title,
  body,
  actions,
  children,
  align = "left",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: string;
  actions?: { label: string; href: string; variant?: "primary" | "ghost" | "teal" }[];
  children?: React.ReactNode;
  align?: "left" | "center";
}) {
  return (
    <section className="mesh-hero border-b border-line/70">
      <div className="shell py-12 md:py-16">
        <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
          {eyebrow ? (
            <span className={`eyebrow ${align === "center" ? "justify-center" : ""}`}>{eyebrow}</span>
          ) : null}
          <h1 className="display-1 mt-3 text-navy-900">{title}</h1>
          {body ? <p className="lead mt-4">{body}</p> : null}
          {actions?.length ? (
            <div className={`mt-7 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
              {actions.map((a) => (
                <Link
                  key={a.href + a.label}
                  href={a.href}
                  className={`btn ${
                    a.variant === "ghost" ? "btn-ghost" : a.variant === "teal" ? "btn-teal" : "btn-primary"
                  }`}
                >
                  {a.label}
                  {a.variant !== "ghost" ? <IconArrow size={16} /> : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  center = true,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  center?: boolean;
}) {
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}`}>
      {eyebrow ? <span className={`eyebrow ${center ? "justify-center" : ""}`}>{eyebrow}</span> : null}
      <h2 className="display-2 mt-3">{title}</h2>
      {body ? <p className="lead mt-3">{body}</p> : null}
    </div>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-4 text-[0.94rem] leading-relaxed text-muted [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-navy-900 [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-navy-900 [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-bold [&_strong]:text-navy-800">
      {children}
    </div>
  );
}
