import { z } from "zod";
import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient, audit, getPatient, updatePatient } from "@/lib/db/repo";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";
import { providerLabel } from "@/lib/dashboard";
import { providerRegistry, syncPatient } from "@/lib/libre";
import { open } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Glucose source connection.
 *
 * Records which provider feeds a patient record. It stores a reference and a
 * region — never a Libre username, password or share code. The `demo` provider is
 * available only when DEMO_PROVIDER_ENABLED is explicitly switched on, and every
 * surface that renders its output labels it as evaluation data.
 */

function demoProviderAllowed(): boolean {
  return (process.env.DEMO_PROVIDER_ENABLED ?? "false").toLowerCase() === "true";
}

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const patient = access.patient;
  const sync = await db().get<any>(
    "SELECT last_success_at, last_attempt_at, last_error, consecutive_failures FROM sync_state WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
    [patientId],
  );
  const count = await db().get<{ c: number }>(
    "SELECT COUNT(*) AS c FROM glucose_readings WHERE patient_id = ?",
    [patientId],
  );

  const registry = providerRegistry().map((p) => ({
    ...p,
    enabled: p.key === "demo" ? demoProviderAllowed() && p.enabled : p.enabled,
  }));

  return json({
    ok: true,
    canManage: access.canManage,
    provider: patient.provider ?? "none",
    providerLabel: patient.provider && patient.provider !== "none" ? providerLabel(patient.provider) : null,
    patientRef: patient.provider_patient_id ?? null,
    region: patient.provider_region ?? null,
    readingCount: num(count?.c ?? 0),
    sync: sync
      ? {
          lastSuccessAt: sync.last_success_at ? new Date(sync.last_success_at).getTime() : null,
          lastAttemptAt: sync.last_attempt_at ? new Date(sync.last_attempt_at).getTime() : null,
          lastError: sync.last_error ?? null,
          failures: num(sync.consecutive_failures),
        }
      : null,
    providers: registry,
  });
});

const schema = z.object({
  patientId: z.number().int().positive(),
  provider: z.enum(["libreview", "linkup", "bridge", "demo"]),
  patientRef: z.string().trim().max(120).nullable().optional(),
  region: z.enum(["eu", "us", "ap", "au"]).optional(),
});

export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can change the connection.", 403);

  if (parsed.data.provider === "demo" && !demoProviderAllowed()) {
    return fail(
      "The evaluation stream is disabled on this deployment. Connect a real Libre source instead.",
      403,
    );
  }

  const registry = providerRegistry();
  const target = registry.find((p) => p.key === parsed.data.provider);
  if (!target) return fail("Unknown provider", 422);
  if (!target.enabled) {
    return fail(
      `${target.label} is not configured on this deployment. Add its credentials to the server environment first.`,
      409,
    );
  }

  await updatePatient(parsed.data.patientId, {
    provider: parsed.data.provider,
    provider_patient_id: parsed.data.patientRef ?? null,
    provider_region: parsed.data.region ?? "eu",
    provider_connected_at: new Date().toISOString(),
  });

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "connection.set",
    entity: "patients",
    entityId: parsed.data.patientId,
    meta: { provider: parsed.data.provider, region: parsed.data.region ?? "eu" },
  });

  // Attempt an immediate first pull so the user sees whether it works.
  const patient = await getPatient(parsed.data.patientId);
  let firstSync: { ok: boolean; ingested: number; error?: string } = { ok: true, ingested: 0 };
  if (patient) {
    const outcome = await syncPatient(patient, open(patient.credential_cipher), 24);
    firstSync = { ok: outcome.ok, ingested: outcome.ingested, error: outcome.error?.message };
  }

  return json({
    ok: true,
    mode: parsed.data.provider === "demo" ? "demo" : "live",
    firstSync,
  });
});

export const DELETE = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can disconnect.", 403);

  await updatePatient(patientId, {
    provider: "none",
    provider_patient_id: null,
    credential_cipher: null,
    provider_connected_at: null,
    bridge_key_hash: null,
  });

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "connection.disconnect",
    entity: "patients",
    entityId: patientId,
  });

  return json({ ok: true });
});
