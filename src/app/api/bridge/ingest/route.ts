import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { sha256 } from "@/lib/crypto";
import { ingestReadings, recordSync } from "@/lib/db/repo-glucose";
import { logIntegration } from "@/lib/db/repo";
import { nowIso } from "@/lib/db/repo-util";
import { evaluatePatient } from "@/lib/alerts/engine";
import type { PatientRow } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Bridge ingestion.
 *
 * A phone bridge (LibreLinkUp follower → phone → this endpoint) posts real
 * sensor readings here. Authentication is a per-patient bridge key issued when
 * the patient is connected; only its SHA-256 hash is stored, so a database leak
 * cannot be replayed. The key never appears in the browser.
 *
 *   POST /api/bridge/ingest
 *   Authorization: Bearer <bridge key>
 *   {
 *     "readings": [{ "value": 107, "takenAt": "2026-11-04T00:04:06Z", "trend": 3 }],
 *     "sensor": { "connected": true, "battery": 91 },
 *     "bridge": { "online": true, "battery": 91 },
 *     "syncTime": "2026-11-04T00:04:38Z"
 *   }
 *
 * Every accepted reading is stored, then the alert engine runs so a real
 * hypoglycaemic event turns into a real notification. Nothing here invents
 * data: if the bridge posts nothing, nothing is stored.
 */

const Reading = z.object({
  value: z.coerce.number().min(20).max(600),
  takenAt: z.union([z.string(), z.number()]),
  trend: z.union([z.string(), z.number()]).optional(),
});

const Body = z.object({
  readings: z.array(Reading).max(5000).optional(),
  /** Older bridges post a single reading at the top level. */
  glucose: z.coerce.number().min(20).max(600).optional(),
  reading_time: z.union([z.string(), z.number()]).optional(),
  trend: z.union([z.string(), z.number()]).optional(),
  sensor: z
    .object({
      connected: z.boolean().optional(),
      battery: z.coerce.number().min(0).max(100).nullable().optional(),
      serial: z.string().max(120).nullable().optional(),
    })
    .optional(),
  sensor_connected: z.boolean().optional(),
  battery: z.coerce.number().min(0).max(100).nullable().optional(),
  bridge: z.object({ online: z.boolean().optional(), battery: z.coerce.number().nullable().optional() }).optional(),
  phone_online: z.boolean().optional(),
  syncTime: z.union([z.string(), z.number()]).optional(),
  server_time: z.union([z.string(), z.number()]).optional(),
});

function normaliseTime(raw: string | number): string | null {
  const d = typeof raw === "number" ? new Date(raw < 1e12 ? raw * 1000 : raw) : new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function authenticate(req: Request): Promise<PatientRow | null> {
  const header = req.headers.get("authorization") ?? "";
  const presented = header.replace(/^Bearer\s+/i, "").trim() || req.headers.get("x-bridge-key")?.trim() || "";
  if (!presented) return null;
  const hash = sha256(presented);
  const patient = await db().get<PatientRow>(
    "SELECT * FROM patients WHERE bridge_key_hash = ? AND status = 'active'",
    [hash],
  );
  return patient ?? null;
}

export async function POST(req: Request) {
  const patient = await authenticate(req);
  if (!patient) {
    // Do not disclose whether the key exists; just refuse.
    return NextResponse.json({ ok: false, error: "Invalid bridge key." }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `${issue?.path.join(".") || "body"}: ${issue?.message ?? "invalid"}` },
      { status: 422 },
    );
  }
  const body = parsed.data;

  // Collect readings from either shape, de-duplicated by timestamp.
  const collected: { value: number; takenAt: number; trend?: string | number }[] = [];
  const seen = new Set<number>();

  for (const r of body.readings ?? []) {
    const iso = normaliseTime(r.takenAt);
    if (!iso) continue;
    const ms = Date.parse(iso);
    if (seen.has(ms)) continue;
    seen.add(ms);
    collected.push({ value: r.value, takenAt: ms, trend: r.trend });
  }

  if (body.glucose && body.reading_time) {
    const iso = normaliseTime(body.reading_time);
    if (iso) {
      const ms = Date.parse(iso);
      if (!seen.has(ms)) collected.push({ value: body.glucose, takenAt: ms, trend: body.trend });
    }
  }

  if (!collected.length) {
    // A heartbeat with no readings is legitimate (sensor between readings) but
    // it is not a sync we can call successful unless it carried state.
    const sensorConnected = body.sensor?.connected ?? body.sensor_connected ?? null;
    if (sensorConnected === null) {
      return NextResponse.json({ ok: false, error: "No readings in payload." }, { status: 422 });
    }
    await recordSync(patient.id, "libre", {
      ok: false,
      error: `Bridge heartbeat without readings (sensor ${sensorConnected ? "connected" : "disconnected"}).`,
    });
    return NextResponse.json({ ok: true, accepted: 0, note: "Heartbeat recorded; no readings in payload." });
  }

  // Oldest first so the alert engine evaluates in clinical order.
  collected.sort((a, b) => a.takenAt - b.takenAt);

  const ingested = await ingestReadings(
    patient.id,
    collected.map((r) => ({ value: r.value, takenAt: r.takenAt, trend: r.trend, source: "bridge" })),
  );

  await recordSync(patient.id, "libre", { ok: true, ingested });

  // Sensor / battery telemetry reported by the bridge.
  const battery = body.bridge?.battery ?? body.battery ?? body.sensor?.battery ?? null;
  const sensorConnected = body.sensor?.connected ?? body.sensor_connected ?? null;
  const updates: string[] = [];
  const params: any[] = [];
  if (typeof battery === "number") {
    updates.push("sensor_battery = ?");
    params.push(Math.round(battery));
  }
  if (body.sensor?.serial) {
    updates.push("sensor_serial = ?");
    params.push(body.sensor.serial.slice(0, 120));
  }
  updates.push("bridge_last_seen_at = ?");
  params.push(nowIso());
  if (typeof battery === "number") {
    updates.push("bridge_battery = ?");
    params.push(Math.round(battery));
  }
  if (body.bridge?.online !== undefined || body.phone_online !== undefined) {
    const online = body.bridge?.online ?? body.phone_online ?? true;
    updates.push("bridge_status = ?");
    params.push(online ? "online" : "offline");
  }
  if (sensorConnected !== null) {
    updates.push("sensor_status = ?");
    params.push(sensorConnected ? "connected" : "disconnected");
  }
  params.push(patient.id);
  await db().run(`UPDATE patients SET ${updates.join(", ")} WHERE id = ?`, params);

  // Run the alert engine on the freshly stored data.
  let triggered: { kind: string; alertId: number }[] = [];
  try {
    const result = await evaluatePatient(patient);
    triggered = result.triggered ?? [];
  } catch (err) {
    await logIntegration({
      provider: "bridge",
      event: "alert_evaluation",
      status: "error",
      message: err instanceof Error ? err.message : "alert evaluation failed",
      meta: { patientId: patient.id },
    }).catch(() => {});
  }

  await logIntegration({
    provider: "bridge",
    event: "ingest",
    status: "ok",
    message: `stored ${ingested} reading(s)`,
    meta: { patientId: patient.id, received: collected.length, ingested },
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    accepted: collected.length,
    ingested,
    duplicates: collected.length - ingested,
    alerts: triggered,
    receivedAt: nowIso(),
  });
}

/** Bridge health probe — lets the phone confirm the key before streaming. */
export async function GET(req: Request) {
  const patient = await authenticate(req);
  if (!patient) return NextResponse.json({ ok: false, error: "Invalid bridge key." }, { status: 401 });
  return NextResponse.json({
    ok: true,
    patient: { id: patient.id, name: patient.display_name },
    endpoint: "/api/bridge/ingest",
    accepted: ["readings[]", "glucose+reading_time", "sensor.battery", "bridge.battery"],
  });
}
