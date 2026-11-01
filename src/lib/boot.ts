import { migrate } from "./db/migrate";
import { ensureSeed } from "./seed";
import { getSetting, setSetting } from "./db/repo";
import { db } from "./db/client";
import { syncablePatients, syncPatient } from "./libre";
import { open } from "./crypto";
import { evaluatePatient } from "./alerts/engine";
import type { PatientRow } from "./db/repo";

/**
 * Boot routine for a serverless-ish host.
 *
 * Render's free tier has no cron jobs, spins a service down after 15 minutes of
 * inactivity, and gives the process an ephemeral filesystem. That means nothing
 * can be scheduled from outside and nothing may be assumed to survive a sleep —
 * so the work that a cron job would normally do has to happen lazily, when the
 * app wakes up and serves a request.
 *
 * `ensureBooted()` is the single entry point. It is called from the root layout
 * and from the high-traffic API routes. It:
 *
 *   1. creates the schema if it does not exist (a fresh free Postgres is empty)
 *   2. seeds the demo workspace when SEED_DEMO is on and nothing is seeded yet
 *   3. refreshes demo readings when stored data is older than STALE_MINUTES
 *
 * All three steps are idempotent, cheap after the first call, and guarded so a
 * concurrent burst of requests only ever runs one of them.
 */

const DEFAULT_STALE_MINUTES = 10;
const BOOT_KEY = "boot_completed_at";

let booted = false;
let booting: Promise<void> | null = null;
let lastRefresh = 0;

function staleMinutes(): number {
  const raw = Number(process.env.DEMO_REFRESH_MINUTES);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_STALE_MINUTES;
}

function demoEnabled(): boolean {
  return (process.env.SEED_DEMO ?? "true").toLowerCase() !== "false";
}

/** Failure here must never take down a request — log and continue. */
async function safe(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[boot] ${label} failed:`, err instanceof Error ? err.message : err);
  }
}

async function seedIfEmpty(): Promise<void> {
  if (!demoEnabled()) return;
  const already = await getSetting("seed_version");
  if (already) return;
  const result = await ensureSeed();
  await setSetting(BOOT_KEY, new Date().toISOString());
  console.log(`[boot] demo workspace seeded (${result.created ? "created" : "already present"})`);
}

/**
 * Advance the simulated sensor.
 *
 * The demo provider derives its trace from the current clock, so a database
 * seeded yesterday shows yesterday's numbers. On wake we re-pull the last few
 * hours for every demo patient — that both fills the gap left by the spin-down
 * and refreshes the "current" reading so the dashboard shows `live` rather than
 * `stale`. Real providers (libreview / linkup / bridge) are skipped: for those
 * the normal sync path applies and a wake-up must not fabricate data.
 */
async function refreshDemoData(): Promise<void> {
  if (!demoEnabled()) return;
  const now = Date.now();
  const throttle = staleMinutes() * 60_000;
  if (now - lastRefresh < throttle) return;

  const patients = await syncablePatients();
  const demoPatients = patients.filter((p: PatientRow) => (p.provider ?? "demo") === "demo");
  if (!demoPatients.length) return;

  const newest = await db().get<{ last: string | null }>(
    "SELECT MAX(taken_at) AS last FROM glucose_readings",
  );
  const newestMs = newest?.last ? new Date(newest.last).getTime() : 0;
  const ageMinutes = (now - newestMs) / 60_000;
  if (newestMs && ageMinutes < staleMinutes()) {
    lastRefresh = now;
    return;
  }

  let ingested = 0;
  for (const patient of demoPatients) {
    const outcome = await syncPatient(patient, open(patient.credential_cipher), 6);
    if (outcome.ok) {
      ingested += outcome.ingested;
      await safe("evaluate", async () => {
        await evaluatePatient(patient);
      });
    }
  }
  lastRefresh = now;
  console.log(`[boot] refreshed ${ingested} demo readings across ${demoPatients.length} patients`);
}

export async function ensureBooted(): Promise<void> {
  if (booted) {
    // Still cheap to check on a long-lived process.
    void safe("refresh", refreshDemoData);
    return;
  }
  if (booting) return booting;

  booting = (async () => {
    await safe("migrate", migrate);
    await safe("seed", seedIfEmpty);
    await safe("refresh", refreshDemoData);
    booted = true;
  })();

  try {
    await booting;
  } finally {
    booting = null;
  }
}

/** Exposed for the health endpoint: proves the schema and (optionally) the demo data are present. */
export async function bootStatus(): Promise<{
  migrated: boolean;
  seeded: boolean;
  demoEnabled: boolean;
  latestReading: string | null;
}> {
  const seeded = Boolean(await getSetting("seed_version"));
  const row = await db().get<{ last: string | null }>("SELECT MAX(taken_at) AS last FROM glucose_readings").catch(() => ({
    last: null,
  }));
  return {
    migrated: booted,
    seeded,
    demoEnabled: demoEnabled(),
    latestReading: row?.last ?? null,
  };
}
