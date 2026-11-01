import { fail, json } from "@/lib/api";
import { migrate } from "@/lib/db/migrate";
import { syncablePatients, syncPatient } from "@/lib/libre";
import { open } from "@/lib/crypto";
import { evaluatePatient } from "@/lib/alerts/engine";
import { logIntegration } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Scheduled sync. Point a Render Cron Job (or any scheduler) at
 *
 *   GET /api/cron/sync
 *   Authorization: Bearer $CRON_SECRET
 *
 * Every patient is polled, new readings are stored, and the alert engine runs
 * so notifications leave the platform without a browser open.
 */
export async function GET(req: Request) {
  await migrate();
  const secret = process.env.CRON_SECRET ?? process.env.APP_SECRET;
  const provided = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided !== secret) return fail("Unauthorized", 401);

  const patients = await syncablePatients();
  const results: any[] = [];
  let ingested = 0;
  let triggered = 0;

  for (const patient of patients) {
    const outcome = await syncPatient(patient, open(patient.credential_cipher), 3);
    if (outcome.ok) {
      ingested += outcome.ingested;
      const evalResult = await evaluatePatient(patient);
      triggered += evalResult.triggered.length;
      results.push({ patientId: patient.id, ok: true, ingested: outcome.ingested });
    } else {
      results.push({ patientId: patient.id, ok: false, error: outcome.error?.message });
    }
  }

  await logIntegration({
    provider: "cron",
    event: "sync",
    status: "ok",
    message: `${patients.length} patients · ${ingested} readings · ${triggered} alerts`,
  }).catch(() => {});

  return json({ ok: true, patients: patients.length, ingested, triggered, results });
}
