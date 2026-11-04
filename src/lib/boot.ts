import { migrate } from "./db/migrate";
import { ensureSeed } from "./seed";
import { getSetting } from "./db/repo";
import { db } from "./db/client";

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
 *   2. seeds the plan catalogue and, if configured, the first administrator
 *
 * Both steps are idempotent, cheap after the first call, and guarded so a
 * concurrent burst of requests only ever runs one of them.
 *
 * It does **not** create patients or readings. Glucose data enters the platform
 * only through a connected Libre provider.
 */

let booted = false;
let booting: Promise<void> | null = null;

/** Failure here must never take down a request — log and continue. */
async function safe(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    console.error(`[boot] ${label} failed:`, err instanceof Error ? err.message : err);
  }
}

async function seedOnce(): Promise<void> {
  const already = await getSetting("seed_version");
  if (already === "3") return;
  const result = await ensureSeed();
  if (result.accounts.length) {
    console.log(`[boot] provisioned ${result.accounts.length} account(s); plans ready`);
  } else {
    console.log("[boot] plans ready — no accounts created (set BOOTSTRAP_ADMIN_EMAIL to create one)");
  }
}

export async function ensureBooted(): Promise<void> {
  if (booted) return;
  if (booting) return booting;

  booting = (async () => {
    await safe("migrate", migrate);
    await safe("seed", seedOnce);
    booted = true;
  })();

  try {
    await booting;
  } finally {
    booting = null;
  }
}

/** Exposed for the health endpoint: proves the schema exists and reports data state. */
export async function bootStatus(): Promise<{
  migrated: boolean;
  seeded: boolean;
  patients: number;
  connectedPatients: number;
  latestReading: string | null;
}> {
  const seeded = Boolean(await getSetting("seed_version"));
  // Archived records are not live patients and must not appear in status.
  const patients = await db()
    .get<{ c: number }>("SELECT COUNT(*) AS c FROM patients WHERE status <> 'archived'")
    .catch(() => ({ c: 0 }));
  const connected = await db()
    .get<{ c: number }>(
      `SELECT COUNT(*) AS c FROM patients
        WHERE status <> 'archived' AND provider <> 'demo' AND provider <> 'none'
          AND provider_patient_id IS NOT NULL`,
    )
    .catch(() => ({ c: 0 }));
  const row = await db()
    .get<{ last: string | null }>(
      `SELECT MAX(g.taken_at) AS last FROM glucose_readings g
        JOIN patients p ON p.id = g.patient_id
        WHERE p.status <> 'archived'`,
    )
    .catch(() => ({ last: null }));
  return {
    migrated: booted,
    seeded,
    patients: Number(patients?.c ?? 0),
    connectedPatients: Number(connected?.c ?? 0),
    latestReading: row?.last ?? null,
  };
}
