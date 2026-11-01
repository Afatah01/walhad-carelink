import { z } from "zod";
import { fail, intParam, json, route } from "@/lib/api";
import { audit, patientThresholds, updatePatient, updateUser } from "@/lib/db/repo";
import { db } from "@/lib/db/client";
import { nowIso, num } from "@/lib/db/repo-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PREFS = {
  notify_push: 1,
  notify_sms: 1,
  notify_telegram: 1,
  notify_audible: 0,
};

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  const rows = await db().query<any>("SELECT * FROM users WHERE id = ?", [user.id]);
  const u = rows[0];
  if (!u) return fail("Account not found", 404);

  const prefRow = await db().get<any>("SELECT * FROM notification_prefs WHERE user_id = ?", [user.id]);
  const prefs: any = prefRow
    ? {
        notify_push: Boolean(num(prefRow.notify_push)),
        notify_sms: Boolean(num(prefRow.notify_sms)),
        notify_telegram: Boolean(num(prefRow.notify_telegram)),
        notify_audible: Boolean(num(prefRow.notify_audible)),
      }
    : DEFAULT_PREFS;

  let patient: any = null;
  if (patientId) {
    const prows = await db().query<any>("SELECT * FROM patients WHERE id = ?", [patientId]);
    const p = prows[0];
    if (p) {
      const thresholds = await patientThresholds(p);
      patient = { id: p.id, display_name: p.display_name, thresholds };
    }
  }

  const auditRows = await db().query<any>(
    "SELECT id, action, entity, entity_id, created_at FROM audit_logs WHERE actor_id = ? ORDER BY created_at DESC LIMIT 10",
    [user.id],
  );

  return json({
    ok: true,
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      org_name: u.org_name ?? null,
      timezone: u.timezone ?? "Africa/Mogadishu",
      last_login_at: u.last_login_at ?? null,
    },
    unit: patient?.unit ?? u.unit ?? "mg/dL",
    prefs,
    patient,
    audit: auditRows,
  });
});

const patch = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(32).nullable().optional(),
  unit: z.enum(["mg/dL", "mmol/L"]).optional(),
  prefs: z
    .object({
      notify_push: z.boolean().optional(),
      notify_sms: z.boolean().optional(),
      notify_telegram: z.boolean().optional(),
      notify_audible: z.boolean().optional(),
    })
    .optional(),
  thresholds: z
    .object({
      low: z.number().int().min(40).max(180),
      high: z.number().int().min(100).max(400),
      criticalLow: z.number().int().min(30).max(120),
      criticalHigh: z.number().int().min(150).max(500),
    })
    .optional(),
  patientId: z.number().int().positive().optional(),
});

export const PATCH = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = patch.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid request", 422);
  const { name, phone, unit, prefs, thresholds, patientId } = parsed.data;

  if (name || phone !== undefined || unit) {
    await updateUser(user.id, { name, phone, unit });
  }

  if (prefs) {
    const cols = Object.keys(prefs);
    if (cols.length) {
      const existing = await db().get<any>("SELECT user_id FROM notification_prefs WHERE user_id = ?", [user.id]);
      if (existing) {
        await db().run(
          `UPDATE notification_prefs SET ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE user_id = ?`,
          [...cols.map((c) => ((prefs as any)[c] ? 1 : 0)), nowIso(), user.id],
        );
      } else {
        await db().run(
          `INSERT INTO notification_prefs (user_id, ${cols.join(", ")}, created_at, updated_at) VALUES (?, ${cols
            .map(() => "?")
            .join(", ")}, ?, ?)`,
          [user.id, ...cols.map((c) => ((prefs as any)[c] ? 1 : 0)), nowIso(), nowIso()],
        );
      }
    }
  }

  if (thresholds) {
    const pid = patientId ?? 0;
    if (pid) {
      if (user.role !== "admin" && user.role !== "patient") {
        return fail("Only the patient or an administrator can change alert thresholds.", 403);
      }
      await updatePatient(pid, {
        low_threshold: thresholds.low,
        high_threshold: thresholds.high,
        critical_low: thresholds.criticalLow,
        critical_high: thresholds.criticalHigh,
      });
    }
  }

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "settings.update",
    entity: "users",
    entityId: user.id,
    meta: { fields: Object.keys(parsed.data).join(",") },
  });

  return json({ ok: true });
});
