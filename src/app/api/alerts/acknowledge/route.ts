import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { accessForPatient, audit } from "@/lib/db/repo";
import { acknowledgeAlert } from "@/lib/alerts/engine";
import { db } from "@/lib/db/client";

export const runtime = "nodejs";

const schema = z.object({
  alertId: z.number().int().positive(),
  note: z.string().max(300).optional(),
});

export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const alert = await db().get<{ id: number; patient_id: number }>(
    "SELECT id, patient_id FROM alerts WHERE id = ?",
    [parsed.data.alertId],
  );
  if (!alert) return fail("Alert not found", 404);

  const access = await accessForPatient(user.id, user.role, alert.patient_id);
  if (!access) return fail("You do not have access to this alert.", 403);
  if (!access.canAcknowledge) return fail("Your role cannot acknowledge this alert.", 403);

  const okAck = await acknowledgeAlert({
    alertId: parsed.data.alertId,
    userId: user.id,
    note: parsed.data.note,
  });
  if (!okAck) return fail("This alert is already resolved.", 409);

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "alert.acknowledge",
    entity: "alerts",
    entityId: parsed.data.alertId,
  });

  return json({ ok: true });
});
