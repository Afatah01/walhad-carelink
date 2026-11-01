import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient } from "@/lib/db/repo";
import { alertsFor, openAlertsFor } from "@/lib/alerts/engine";
import { rulesFor } from "@/lib/alerts/rules";
import { patientThresholds } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const scope = req.nextUrl.searchParams.get("scope");
  const rows = scope === "open" ? await openAlertsFor(patientId) : await alertsFor(patientId, 40);
  const thresholds = await patientThresholds(access.patient);

  return json({
    ok: true,
    alerts: rows.map((a) => ({
      id: a.id,
      kind: a.kind,
      level: a.level,
      value: a.value,
      threshold: a.threshold,
      message: a.message,
      status: a.status,
      triggeredAt: new Date(a.triggered_at).getTime(),
      acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at).getTime() : null,
      escalatedAt: a.escalated_at ? new Date(a.escalated_at).getTime() : null,
      resolvedAt: a.resolved_at ? new Date(a.resolved_at).getTime() : null,
      patientName: access.patient.display_name,
      unit: access.patient.unit,
    })),
    rules: await rulesFor(access.patient),
    thresholds,
    unit: access.patient.unit,
    canManage: access.canManage,
  });
});
