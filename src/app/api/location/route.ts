import { z } from "zod";
import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient, audit, patientMembers, updatePatient } from "@/lib/db/repo";
import { nowIso } from "@/lib/db/repo-util";
import { subscriptionFor } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Location must be explicitly enabled and is Premium+ or authorised clinical. */
async function premiumAllowed(patientId: number, orgId: number | null): Promise<boolean> {
  const sub = await subscriptionFor({ orgId, patientId });
  if (!sub?.plan) return false;
  return sub.plan.slug !== "family-basic";
}

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const canView = access.canViewLocation;
  const shared = Boolean(access.patient.location_consent) && canView;
  const members = await patientMembers(patientId);

  return json({
    ok: true,
    canManage: access.canManage,
    patient: {
      id: access.patient.id,
      name: access.patient.display_name,
      shared,
      consent: Boolean(access.patient.location_consent),
      lat: shared ? access.patient.location_lat : null,
      lon: shared ? access.patient.location_lon : null,
      label: shared ? access.patient.location_label : null,
      updatedAt: shared && access.patient.location_updated_at ? new Date(access.patient.location_updated_at).getTime() : null,
    },
    recipients: members
      .filter((m) => m.status === "active")
      .map((m) => ({
        userId: m.user_id,
        name: m.user.name,
        relation: m.relation,
        canViewLocation: Boolean(m.can_view_location),
      })),
  });
});

const schema = z.object({
  patientId: z.number().int().positive(),
  consent: z.boolean(),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lon: z.number().min(-180).max(180).nullable().optional(),
  label: z.string().max(120).nullable().optional(),
});

export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);
  if (!access.canManage) return fail("Only the patient or an administrator can change location consent.", 403);

  if (parsed.data.consent) {
    const allowed = await premiumAllowed(access.patient.id, access.patient.org_id);
    if (!allowed) {
      return fail("Authorised location sharing is included in Family Premium and hospital plans.", 402);
    }
  }

  await updatePatient(access.patient.id, {
    location_consent: parsed.data.consent ? 1 : 0,
    location_lat: parsed.data.consent ? parsed.data.lat ?? null : null,
    location_lon: parsed.data.consent ? parsed.data.lon ?? null : null,
    location_label: parsed.data.consent ? parsed.data.label ?? null : null,
    location_updated_at: parsed.data.consent ? nowIso() : null,
  });

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: parsed.data.consent ? "location.enable" : "location.disable",
    entity: "patients",
    entityId: access.patient.id,
  });

  return json({ ok: true });
});
