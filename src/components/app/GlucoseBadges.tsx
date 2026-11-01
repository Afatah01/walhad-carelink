import { TREND_META, type TrendKey } from "@/lib/glucose";

const LEVEL_CLASS: Record<string, string> = {
  "very-low": "pill-low",
  critical: "pill-critical",
  low: "pill-low",
  "in-range": "pill-ok",
  high: "pill-high",
  "very-high": "pill-high",
};

export function StatusPill({ level, label }: { level: string; label?: string }) {
  return (
    <span className={`pill text-[0.66rem] uppercase tracking-wide ${LEVEL_CLASS[level] ?? "pill-muted"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label ?? level}
    </span>
  );
}

export function TrendArrow({ trend, size = 14 }: { trend: TrendKey; size?: number }) {
  const meta = TREND_META[trend] ?? TREND_META.steady;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ transform: `rotate(${meta.rotation}deg)` }}
      className="transition-transform"
    >
      <path
        d="M12 4.5v13M6.5 11.5 12 17l5.5-5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrendBadge({ trend, label }: { trend: TrendKey; label?: string }) {
  const meta = TREND_META[trend] ?? TREND_META.steady;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-[0.7rem] font-bold text-navy-700">
      <TrendArrow trend={trend} size={12} />
      {label ?? meta.label}
    </span>
  );
}
