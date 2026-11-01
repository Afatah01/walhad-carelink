import { db } from "@/lib/db/client";
import { bootStatus } from "@/lib/boot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Liveness + readiness, used by Render's health check and by the keep-alive
 * ping. Reports whether the schema exists and whether demo data is fresh, so a
 * cold start that failed to provision is visible instead of silently 500ing.
 */
export async function GET() {
  const started = Date.now();
  let database = "ok";
  let detail: Awaited<ReturnType<typeof bootStatus>> | null = null;
  try {
    await db().get("SELECT 1 AS ok");
    detail = await bootStatus();
  } catch {
    database = "error";
  }
  const body = {
    ok: database === "ok",
    service: "walhad-carelink",
    database,
    tier: process.env.RENDER ? "render" : "local",
    boot: detail,
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };
  return Response.json(body, { status: body.ok ? 200 : 503 });
}
