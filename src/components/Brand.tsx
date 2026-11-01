import Image from "next/image";
import Link from "next/link";
import { brand } from "@/lib/brand";

export function Wordmark({
  size = "md",
  withTagline = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
  className?: string;
}) {
  const scale =
    size === "lg" ? "text-2xl md:text-[1.7rem]" : size === "sm" ? "text-lg" : "text-xl";
  return (
    <span className={`flex flex-col leading-none ${className}`}>
      <span className={`wordmark ${scale}`}>
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
      className={`object-contain ${className}`}
    />
  );
}

export function BrandLockup({
  href = "/",
  size = "md",
  showTagline = false,
  logoSize = 46,
  priority = false,
  className = "",
}: {
  href?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  logoSize?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 ${className}`}
      aria-label={`${brand.suite} — home`}
    >
      <span className="grid place-items-center rounded-2xl bg-white ring-1 ring-line shadow-[0_2px_10px_-4px_rgba(0,47,101,0.28)] transition-transform duration-300 group-hover:-translate-y-0.5">
        <LogoMark size={logoSize} priority={priority} className="p-1" />
      </span>
      <Wordmark size={size} withTagline={showTagline} />
    </Link>
  );
}
