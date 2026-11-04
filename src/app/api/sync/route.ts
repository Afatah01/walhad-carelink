import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { accessForPatient, getPatient, updatePatient } from "@/lib/db/repo";
import { open } from "@/lib/crypto";
import { syncPatient } from "@/lib/libre";
import { evaluatePatient } from "@/lib/alerts/engine";
import { ingestReadingsBulk } from "@/lib/db/repo-glucose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ patientId: z.number().int().positive() });

/**
 * Manual "sync now". Pulls the provider window, then runs the alert engine so a
 * demo or newly connected sensor behaves exactly like scheduled syncing.
 */
export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can trigger a sync.", 403);

  const patient = await getPatient(parsed.data.patientId);
  if (!patient) return fail("Patient not found", 404);

  const credential = open(patient.credential_cipher);
  const outcome = await syncPatient(patient, credential, 24);

  if (!outcome.ok) {
    return json({
      ok: false,
      error: outcome.error?.message ?? "Provider sync failed",
      code: outcome.error?.code,
      retryable: outcome.error?.retryable,
    });
  }

  // Demo provider may not have produced rows in the last 24h if the DB is fresh.
  if (outcome.ingested === 0 && outcome.snapshot?.readings.length) {
    await ingestReadingsBulk(patient.id, outcome.snapshot.readings, patient.provider);
  }

  await updatePatient(patient.id, { provider_connected_at: new Date().toISOString() });
  const evalResult = await evaluatePatient(patient);

  return json({
    ok: true,
    ingested: outcome.ingested,
    provider: patient.provider,
    triggered: evalResult.triggered.length,
    resolved: evalResult.resolved,
  });
});
