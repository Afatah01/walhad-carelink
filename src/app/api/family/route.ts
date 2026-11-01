import { z } from "zod";
import { fail, intParam, json, route } from "@/lib/api";
import {
  accessForPatient,
  audit,
  patientMembers,
  removeMember,
  updateMember,
} from "@/lib/db/repo";
import { inviteMemberByEmail } from "@/lib/db/repo";
import { subscriptionFor } from "@/lib/billing/subscriptions";
import { linksForPatient } from "@/lib/notify/telegram-bot";
import { nowIso } from "@/lib/db/repo-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const members = await patientMembers(patientId);
  const links = await linksForPatient(patientId);
  const sub = await subscriptionFor({ orgId: access.patient.org_id, patientId });

  return json({
    ok: true,
    canManage: access.canManage,
    planName: sub?.plan?.name ?? null,
    recipientLimit: sub?.plan?.recipient_limit ?? 2,
    members: members
      .filter((m) => m.status === "active")
      .map((m) => {
        const tg = links.find((l) => l.user_id === m.user_id);
        return {
          userId: m.user_id,
          name: m.user.name,
          email: m.user.email,
          phone: m.user.phone,
          relation: m.relation,
          permission: m.permission,
          receivePush: Boolean(m.receive_push),
          receiveSms: Boolean(m.receive_sms),
          receiveTelegram: Boolean(m.receive_telegram),
          canViewLocation: Boolean(m.can_view_location),
          telegram: tg?.status ?? "none",
          addedAt: m.id ? Date.now() : null,
        };
      }),
  });
});

const inviteSchema = z.object({
  patientId: z.number().int().positive(),
  name: z.string().trim().min(2, "Enter a name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().max(32).nullable().optional(),
  relation: z.string().trim().max(40).optional(),
  receiveSms: z.boolean().optional(),
  receiveTelegram: z.boolean().optional(),
  canViewLocation: z.boolean().optional(),
});

export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can invite family members.", 403);

  const sub = await subscriptionFor({ orgId: access.patient.org_id, patientId: parsed.data.patientId });
  const limit = sub?.plan?.recipient_limit ?? 2;
  const current = (await patientMembers(parsed.data.patientId)).filter((m) => m.status === "active");
  const existing = current.find((m) => m.user.email.toLowerCase() === parsed.data.email.toLowerCase());
  if (!existing && current.length >= limit) {
    return fail(
      `Your ${sub?.plan?.name ?? "current"} plan includes ${limit} alert recipients. Upgrade the plan to add more people.`,
      409,
    );
  }

  const { user: invited, created } = await inviteMemberByEmail({
    patientId: parsed.data.patientId,
    email: parsed.data.email,
    name: parsed.data.name,
    relation: parsed.data.relation,
    receiveSms: parsed.data.receiveSms,
    phone: parsed.data.phone ?? null,
  });

  if (parsed.data.canViewLocation !== undefined) {
    await updateMember(parsed.data.patientId, invited.id, {
      can_view_location: parsed.data.canViewLocation ? 1 : 0,
    });
  }
  if (parsed.data.receiveTelegram !== undefined) {
    await updateMember(parsed.data.patientId, invited.id, {
      receive_telegram: parsed.data.receiveTelegram ? 1 : 0,
    });
  }

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "family.invite",
    entity: "patient_members",
    entityId: `${parsed.data.patientId}:${invited.id}`,
    meta: { created },
  });

  return json({ ok: true, created });
});

const patchSchema = z.object({
  patientId: z.number().int().positive(),
  userId: z.number().int().positive(),
  receive_push: z.boolean().optional(),
  receive_sms: z.boolean().optional(),
  receive_telegram: z.boolean().optional(),
  can_view_location: z.boolean().optional(),
  can_acknowledge: z.boolean().optional(),
});

export const PATCH = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access?.canManage) return fail("Only the patient or an administrator can change permissions.", 403);

  const { patientId, userId, ...flags } = parsed.data;
  const patch: Record<string, number> = {};
  for (const [k, v] of Object.entries(flags)) {
    if (v !== undefined) patch[k] = v ? 1 : 0;
  }
  await updateMember(patientId, userId, patch as any);
  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "family.permissions",
    entity: "patient_members",
    entityId: `${patientId}:${userId}`,
    meta: patch,
  });
  return json({ ok: true });
});

const delSchema = z.object({ patientId: z.number().int().positive(), userId: z.number().int().positive() });

export const DELETE = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = delSchema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access?.canManage) return fail("Only the patient or an administrator can remove a family member.", 403);

  await removeMember(parsed.data.patientId, parsed.data.userId);
  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "family.remove",
    entity: "patient_members",
    entityId: `${parsed.data.patientId}:${parsed.data.userId}`,
  });
  return json({ ok: true, at: nowIso() });
});
