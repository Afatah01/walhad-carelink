/**
 * Glucose domain logic.
 *
 * All glucose values are *stored* in mg/dL (the unit used by FreeStyle Libre
 * cloud APIs). Display conversion happens at the presentation layer only.
 * Reference: ADA / International Consensus on Time in Range (2019).
 */

export type Unit = "mg/dL" | "mmol/L";
export type GlucoseLevel = "very-low" | "low" | "in-range" | "high" | "very-high" | "critical";
export type Freshness = "live" | "recent" | "stale" | "missing";
export type TrendKey = "rapid-rise" | "rise" | "slow-rise" | "steady" | "slow-fall" | "fall" | "rapid-fall";

export const MGDL_PER_MMOL = 18.0182;

export interface Thresholds {
  veryLow: number;
  low: number;
  high: number;
  veryHigh: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  veryLow: 54,
  low: 70,
  high: 180,
  veryHigh: 250,
};

export interface ThresholdsMmol {
  veryLow: number;
  low: number;
  high: number;
  veryHigh: number;
}

export function thresholdsFor(unit: Unit, t: Thresholds = DEFAULT_THRESHOLDS): ThresholdsMmol {
  if (unit === "mmol/L") {
    return {
      veryLow: round1(t.veryLow / MGDL_PER_MMOL),
      low: round1(t.low / MGDL_PER_MMOL),
      high: round1(t.high / MGDL_PER_MMOL),
      veryHigh: round1(t.veryHigh / MGDL_PER_MMOL),
    };
  }
  return { ...t };
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function toMmol(mgdl: number): number {
  return round1(mgdl / MGDL_PER_MMOL);
}

export function toMgdl(value: number, unit: Unit): number {
  return unit === "mmol/L" ? Math.round(value * MGDL_PER_MMOL) : Math.round(value);
}

/** Convert a stored mg/dL value into the display unit (already rounded). */
export function convert(mgdl: number, unit: Unit): number {
  return unit === "mmol/L" ? toMmol(mgdl) : Math.round(mgdl);
}

export function formatGlucose(mgdl: number, unit: Unit): string {
  return unit === "mmol/L" ? toMmol(mgdl).toFixed(1) : String(Math.round(mgdl));
}

export function classify(mgdl: number, t: Thresholds = DEFAULT_THRESHOLDS): GlucoseLevel {
  if (mgdl < t.veryLow) return "critical";
  if (mgdl < t.low) return "low";
  if (mgdl <= t.high) return "in-range";
  if (mgdl <= t.veryHigh) return "high";
  return "very-high";
}

export const LEVEL_META: Record<
  GlucoseLevel,
  { label: string; short: string; color: string; soft: string; text: string; border: string }
> = {
  "very-low": {
    label: "Critically Low",
    short: "CRITICAL",
    color: "#b3261e",
    soft: "#fdecec",
    text: "#8f1d17",
    border: "#f5c9c6",
  },
  critical: {
    label: "Critically Low",
    short: "CRITICAL",
    color: "#b3261e",
    soft: "#fdecec",
    text: "#8f1d17",
    border: "#f5c9c6",
  },
  low: {
    label: "Low",
    short: "LOW",
    color: "#d64545",
    soft: "#fdecec",
    text: "#a52a2a",
    border: "#f6d2d2",
  },
  "in-range": {
    label: "In Range",
    short: "IN RANGE",
    color: "#0f9d76",
    soft: "#e7f7f1",
    text: "#087a5c",
    border: "#c9ecdf",
  },
  high: {
    label: "High",
    short: "HIGH",
    color: "#d98324",
    soft: "#fdf3e6",
    text: "#a4620f",
    border: "#f4e0c4",
  },
  "very-high": {
    label: "Very High",
    short: "VERY HIGH",
    color: "#b55d0c",
    soft: "#fdf0e1",
    text: "#8c4708",
    border: "#f0d3ac",
  },
};

export const TREND_META: Record<
  TrendKey,
  { arrows: string; label: string; short: string; mgdlPerMin: number; rotation: number }
> = {
  "rapid-rise": { arrows: "↑↑", label: "Rising quickly", short: "Rising fast", mgdlPerMin: 3, rotation: -60 },
  rise: { arrows: "↑", label: "Rising", short: "Rising", mgdlPerMin: 2, rotation: -35 },
  "slow-rise": { arrows: "↗", label: "Rising slowly", short: "Rising slowly", mgdlPerMin: 1, rotation: -20 },
  steady: { arrows: "→", label: "Steady", short: "Steady", mgdlPerMin: 0, rotation: 0 },
  "slow-fall": { arrows: "↘", label: "Falling slowly", short: "Falling slowly", mgdlPerMin: -1, rotation: 20 },
  fall: { arrows: "↓", label: "Falling", short: "Falling", mgdlPerMin: -2, rotation: 35 },
  "rapid-fall": { arrows: "↓↓", label: "Falling quickly", short: "Falling fast", mgdlPerMin: -3, rotation: 60 },
};

/** Map an Abbott Libre trend index (1..5) or text to our canonical key. */
export function normalizeTrend(input: number | string | null | undefined): TrendKey {
  if (input === null || input === undefined) return "steady";
  if (typeof input === "number") {
    switch (Math.round(input)) {
      case 1:
        return "rapid-fall";
      case 2:
        return "fall";
      case 3:
        return "steady";
      case 4:
        return "rise";
      case 5:
        return "rapid-rise";
      default:
        return "steady";
    }
  }
  const s = input.toLowerCase().replace(/[\s_-]/g, "");
  if (s.includes("rapidfall") || s.includes("fastdown") || s.includes("decreasingfast")) return "rapid-fall";
  if (s.includes("rapidrise") || s.includes("fastup") || s.includes("increasingfast")) return "rapid-rise";
  if (s.includes("fall") || s.includes("down") || s.includes("decreas")) return "fall";
  if (s.includes("rise") || s.includes("up") || s.includes("increas")) return "rise";
  if (s.includes("steady") || s.includes("flat") || s.includes("stable")) return "steady";
  return "steady";
}

/** Derive trend from a short reading history when the API does not supply one. */
export function deriveTrend(readings: { value: number; takenAt: number }[]): TrendKey {
  if (readings.length < 2) return "steady";
  const recent = readings.slice(-6);
  const first = recent[0];
  const last = recent[recent.length - 1];
  const minutes = Math.max(1, (last.takenAt - first.takenAt) / 60_000);
  const slope = (last.value - first.value) / minutes;
  if (slope >= 2) return "rapid-rise";
  if (slope >= 0.8) return "rise";
  if (slope >= 0.25) return "slow-rise";
  if (slope <= -2) return "rapid-fall";
  if (slope <= -0.8) return "fall";
  if (slope <= -0.25) return "slow-fall";
  return "steady";
}

/** Data freshness must never present stale numbers as live readings. */
export function freshness(takenAtMs: number, now = Date.now()): Freshness {
  const ageMin = (now - takenAtMs) / 60_000;
  if (!Number.isFinite(ageMin) || ageMin < 0) return "live";
  // FreeStyle Libre streams roughly every 5 minutes; allow one missed sync
  // interval before labelling data as delayed.
  if (ageMin <= 8) return "live";
  if (ageMin <= 20) return "recent";
  if (ageMin <= 60) return "stale";
  return "missing";
}

export const FRESHNESS_META: Record<
  Freshness,
  { label: string; tone: "ok" | "warn" | "bad"; detail: string }
> = {
  live: { label: "Live", tone: "ok", detail: "Synced within the last few minutes" },
  recent: { label: "Slightly delayed", tone: "warn", detail: "Last sync was a few minutes ago" },
  stale: { label: "Delayed", tone: "warn", detail: "Reading is older than 20 minutes" },
  missing: { label: "Not current", tone: "bad", detail: "No recent reading — showing last known value" },
};

export interface ReadingLike {
  value: number;
  takenAt: number;
}

export interface GlucoseStats {
  count: number;
  average: number;
  min: number;
  max: number;
  sd: number;
  cv: number;
  gmi: number;
  tir: number;
  tbr: number;
  tbrVeryLow: number;
  tar: number;
  tarVeryHigh: number;
  lows: number;
  highs: number;
}

export function computeStats(readings: ReadingLike[]): GlucoseStats {
  const n = readings.length;
  if (!n) {
    return {
      count: 0, average: 0, min: 0, max: 0, sd: 0, cv: 0, gmi: 0,
      tir: 0, tbr: 0, tbrVeryLow: 0, tar: 0, tarVeryHigh: 0, lows: 0, highs: 0,
    };
  }
  let sum = 0, min = Infinity, max = -Infinity, low = 0, veryLow = 0, high = 0, veryHigh = 0, inRange = 0;
  for (const r of readings) {
    sum += r.value;
    if (r.value < min) min = r.value;
    if (r.value > max) max = r.value;
    if (r.value < DEFAULT_THRESHOLDS.veryLow) {
      veryLow++;
      low++;
    } else if (r.value < DEFAULT_THRESHOLDS.low) {
      low++;
    } else if (r.value > DEFAULT_THRESHOLDS.veryHigh) {
      veryHigh++;
      high++;
    } else if (r.value > DEFAULT_THRESHOLDS.high) {
      high++;
    } else {
      inRange++;
    }
  }
  const average = sum / n;
  const variance = readings.reduce((acc, r) => acc + (r.value - average) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const pct = (x: number) => Math.round((x / n) * 1000) / 10;
  return {
    count: n,
    average: Math.round(average * 10) / 10,
    min,
    max,
    sd: Math.round(sd * 10) / 10,
    cv: average ? Math.round((sd / average) * 1000) / 10 : 0,
    // GMI (Bergenstal 2018): 3.31 + 0.02392 × mean glucose (mg/dL)
    gmi: Math.round((3.31 + 0.02392 * average) * 10) / 10,
    tir: pct(inRange),
    tbr: pct(low),
    tbrVeryLow: pct(veryLow),
    tar: pct(high),
    tarVeryHigh: pct(veryHigh),
    lows: low,
    highs: high,
  };
}

/** Bucket readings into hourly averages for a compact chart series. */
export function hourlyAverages(readings: ReadingLike[], hours = 24, now = Date.now()) {
  const buckets = new Map<number, { sum: number; n: number }>();
  const start = now - hours * 3_600_000;
  for (const r of readings) {
    if (r.takenAt < start) continue;
    const key = Math.floor(r.takenAt / 3_600_000);
    const b = buckets.get(key) ?? { sum: 0, n: 0 };
    b.sum += r.value;
    b.n += 1;
    buckets.set(key, b);
  }
  const out: { t: number; value: number }[] = [];
  for (let h = 0; h < hours; h++) {
    const key = Math.floor((start + h * 3_600_000 + 3_600_000) / 3_600_000);
    const b = buckets.get(key);
    if (b && b.n) out.push({ t: key * 3_600_000, value: Math.round(b.sum / b.n) });
  }
  return out;
}

/** Daily aggregates used by the weekly / 14-day trend chart. */
export function dailyAverages(readings: ReadingLike[], days = 7, now = Date.now()) {
  const out: { t: number; avg: number; min: number; max: number; count: number }[] = [];
  const dayMs = 86_400_000;
  for (let d = days - 1; d >= 0; d--) {
    const dayStart = new Date(now - d * dayMs);
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime();
    const end = start + dayMs;
    const slice = readings.filter((r) => r.takenAt >= start && r.takenAt < end);
    if (!slice.length) continue;
    const stat = computeStats(slice);
    out.push({ t: start, avg: Math.round(stat.average), min: stat.min, max: stat.max, count: slice.length });
  }
  return out;
}

export function relativeTime(ms: number, now = Date.now(), locale = "en"): string {
  const diff = Math.round((now - ms) / 1000);
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (abs < 86_400) return rtf.format(-Math.round(diff / 3600), "hour");
  if (abs < 604_800) return rtf.format(-Math.round(diff / 86_400), "day");
  return rtf.format(-Math.round(diff / 604_800), "week");
}

export function clockTime(ms: number, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(ms));
}

export function stampTime(ms: number, timeZone?: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(ms));
}
