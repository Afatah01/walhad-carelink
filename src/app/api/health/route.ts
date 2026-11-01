import { db } from "@/lib/db/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness + dependency check used by Render health checks. */
export async function GET() {
  const started = Date.now();
  let database = "ok";
  try {
    await db().get("SELECT 1 AS ok");
  } catch {
    database = "error";
  }
  const body = {
    ok: database === "ok",
    service: "walhad-carelink",
    database,
    uptimeSeconds: Math.round(process.uptime()),
    latencyMs: Date.now() - started,
    time: new Date().toISOString(),
  };
  return Response.json(body, { status: body.ok ? 200 : 503 });
}
