import { db } from "@/lib/db/client";
import { ensureBooted } from "@/lib/boot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ultra-light wake-up endpoint for uptime pingers (cron-job.org, UptimeRobot,
 * GitHub Actions). Returns 204 with no body so a 5-minute ping costs almost
 * nothing — but it still touches the database, which keeps a free Render
 * instance from spinning down and triggers the lazy sync in `ensureBooted`.
 *
 * Point the pinger at GET /api/keepalive.
 */
export async function GET() {
  // Kick the boot routine without blocking the response on a long sync.
  void ensureBooted();
  await db()
    .get("SELECT 1 AS ok")
    .catch(() => {});
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}

export async function HEAD() {
  return new Response(null, { status: 204, headers: { "cache-control": "no-store" } });
}
