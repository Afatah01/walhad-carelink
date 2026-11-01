import { ProviderError, type LibreProvider, type NormalizedReading, type ProviderSnapshot } from "./types";

/**
 * Deterministic demo provider.
 *
 * Produces a physiologically plausible 14-day trace (meal excursions, dawn
 * phenomena, occasional overnight lows, sensor warm-up gaps) so the whole
 * platform — alerts, escalation, charts, hospital view — can be exercised
 * without touching a real patient's data.
 *
 * Clearly labelled "Demo data" everywhere in the UI. Never used for a patient
 * whose provider has been switched to a live vendor.
 */

const STEP_MS = 5 * 60 * 1000;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small deterministic PRNG. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

/** Gaussian-ish noise from uniform PRNG. */
function noise(r: () => number, sd: number) {
  return (r() + r() + r() - 1.5) * 2 * sd;
}

const MEALS = [
  { hour: 7.5, amplitude: 55, spread: 1.15 },
  { hour: 13.0, amplitude: 70, spread: 1.35 },
  { hour: 19.5, amplitude: 62, spread: 1.5 },
  { hour: 22.5, amplitude: 22, spread: 0.9 },
];

function baselineFor(hour: number) {
  // Dawn phenomenon: rises between 04:00 and 08:00.
  const dawn = 14 * Math.exp(-((hour - 6.2) ** 2) / 3.2);
  return 96 + dawn;
}

function valueAt(ms: number, seed: number): number {
  const d = new Date(ms);
  const hour = d.getHours() + d.getMinutes() / 60;
  const r = rng(seed + Math.floor(ms / 3_600_000));
  let v = baselineFor(hour);
  for (const m of MEALS) {
    const delta = hour - m.hour;
    v += m.amplitude * Math.exp(-(delta * delta) / (2 * m.spread * m.spread));
  }
  // Activity / stress wobble + slow sinusoidal drift.
  v += 9 * Math.sin((hour / 24) * Math.PI * 2 + seed % 7) + noise(r, 6.5);

  // Occasional overnight low (roughly one in three nights, around 02:00-04:00).
  const dayIndex = Math.floor(ms / 86_400_000);
  const lowNight = hash(`low-${seed}-${dayIndex}`) % 3 === 0;
  if (lowNight && hour > 1.2 && hour < 4.6) {
    v -= 44 * Math.exp(-((hour - 3.0) ** 2) / 0.55);
  }
  // Rare post-lunch high.
  const highDay = hash(`high-${seed}-${dayIndex}`) % 5 === 0;
  if (highDay && hour > 13.2 && hour < 15.4) {
    v += 62 * Math.exp(-((hour - 14.2) ** 2) / 0.7);
  }
  return Math.max(38, Math.min(330, Math.round(v)));
}

function trendIndex(ms: number, seed: number): number {
  const before = valueAt(ms - 15 * 60_000, seed);
  const now = valueAt(ms, seed);
  const delta = now - before;
  if (delta >= 18) return 5;
  if (delta >= 6) return 4;
  if (delta <= -18) return 1;
  if (delta <= -6) return 2;
  return 3;
}

function generate(seedKey: string, hours: number, now = Date.now()): NormalizedReading[] {
  const seed = hash(seedKey);
  const start = Math.floor((now - hours * 3_600_000) / STEP_MS) * STEP_MS;
  const end = Math.floor(now / STEP_MS) * STEP_MS;
  const out: NormalizedReading[] = [];
  for (let t = start; t <= end; t += STEP_MS) {
    // Simulate a 22-minute sensor gap every 11 hours to exercise "missing data" UI.
    const slot = Math.floor(t / (11 * 3_600_000));
    if (hash(`gap-${seedKey}-${slot}`) % 7 === 0) {
      const offset = (hash(`off-${seedKey}-${slot}`) % (11 * 12)) * STEP_MS;
      const gapStart = (t - (t % (11 * 3_600_000))) + offset;
      if (t >= gapStart && t < gapStart + 22 * 60_000) continue;
    }
    out.push({
      value: valueAt(t, seed),
      takenAt: t,
      trend: trendIndex(t, seed),
      source: "demo",
    });
  }
  return out;
}

export const demoProvider: LibreProvider = {
  key: "demo",
  label: "Demo sensor stream",
  description:
    "A realistic simulated FreeStyle Libre trace used for evaluation, training and previews. No real patient data.",
  requiresCredentials: false,
  enabled: () => true,
  async fetchSnapshot(ctx): Promise<ProviderSnapshot> {
    const hours = ctx.lookbackHours ?? 24 * 14;
    if (!Number.isFinite(ctx.patient.id)) {
      throw new ProviderError("invalid_patient", "Demo provider requires a patient record.");
    }
    const readings = generate(`patient-${ctx.patient.id}`, hours);
    const startedAt = Date.now() - 6 * 86_400_000;
    return {
      readings,
      sensor: {
        serial: `DEMO-${(hash(String(ctx.patient.id)) % 900000 + 100000).toString()}`,
        startedAt,
        wearDays: 14,
        active: true,
        expiresAt: startedAt + 14 * 86_400_000,
      },
      patientLabel: ctx.patient.display_name,
      fetchedAt: Date.now(),
      connected: true,
      note: "Simulated data — not from a FreeStyle Libre sensor.",
    };
  },
};
