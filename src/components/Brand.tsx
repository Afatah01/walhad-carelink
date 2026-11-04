import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export function Wordmark({
  size = "md",
  withTagline = false,
  tone = "default",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  withTagline?: boolean;
  tone?: "default" | "light";
  className?: string;
}) {
  const scale =
    size === "xl"
      ? "text-[1.8rem] md:text-[2.1rem]"
      : size === "lg"
        ? "text-2xl md:text-[1.8rem]"
        : size === "sm"
          ? "text-xl"
          : "text-[1.35rem]";
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`wordmark ${scale} ${tone === "light" ? "wordmark-light" : ""}`}>
        <span className="wm-main">{brand.name} </span>
        <span className="wm-accent">{brand.nameAccent}</span>
      </span>
      {withTagline ? (
        <span className="mt-1 text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-muted">
          {brand.tagline}
        </span>
      ) : null}
    </span>
  );
}

export function LogoMark({
  size = 40,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={brand.logo.emblem}
      alt={`${brand.suite} emblem`}
      width={size}
      height={size}
      priority={priority}
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
}

export function BrandLockup({
  href = "/",
  size = "md",
  showTagline = false,
  logoSize = 52,
  priority = false,
  onDark = false,
  className = "",
}: {
  href?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  logoSize?: number;
  priority?: boolean;
  onDark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 ${className}`}
      aria-label={`${brand.suite} — home`}
    >
      <span
        className={`grid flex-none place-items-center rounded-[1.1rem] bg-white shadow-[0_2px_12px_-4px_rgba(0,47,101,0.25)] transition-transform duration-300 group-hover:-translate-y-0.5 ${
          onDark ? "ring-1 ring-white/15" : "ring-1 ring-line"
        }`}
        style={{ width: logoSize + 8, height: logoSize + 8 }}
      >
        <LogoMark size={logoSize} priority={priority} />
      </span>
      <Wordmark size={size} withTagline={showTagline} tone={onDark ? "light" : "default"} />
    </Link>
  );
}
