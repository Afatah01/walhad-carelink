import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { accessForPatient, audit } from "@/lib/db/repo";
import { rulesFor, updateRule, type AlertKind, ALERT_KIND_META } from "@/lib/alerts/rules";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = Object.keys(ALERT_KIND_META) as AlertKind[];

const schema = z.object({
  patientId: z.number().int().positive(),
  kind: z.enum(KINDS as [AlertKind, ...AlertKind[]]),
  enabled: z.boolean().optional(),
  threshold: z.number().nullable().optional(),
  sustained_minutes: z.number().int().min(0).max(240).optional(),
  cooldown_minutes: z.number().int().min(0).max(1440).optional(),
  escalate_after_minutes: z.number().int().min(0).max(240).optional(),
  channels: z
    .array(z.enum(["push", "sms", "telegram", "audible", "inapp"]))
    .min(1, "Keep at least one delivery channel")
    .optional(),
});

export const PATCH = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid rule", 422);

  const { patientId, kind, ...patch } = parsed.data;
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can change alert rules.", 403);

  await rulesFor(access.patient); // ensure defaults exist first
  await updateRule(patientId, kind, patch as any);
  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "alert_rule.update",
    entity: "alert_rules",
    entityId: `${patientId}:${kind}`,
    meta: patch,
  });

  return json({ ok: true });
});
