import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { createPatient, createOrg, getPatient, listOrgs, setSetting } from "@/lib/db/repo";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  displayName: z.string().trim().min(2).max(120),
  dateOfBirth: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  timezone: z.string().trim().min(3).max(64).default("Africa/Mogadishu"),
  unit: z.enum(["mg/dL", "mmol/L"]).default("mg/dL"),
  targetLow: z.coerce.number().min(40).max(120).default(70),
  targetHigh: z.coerce.number().min(100).max(300).default(180),
  /** Optional login the record belongs to. Left empty for clinic-managed records. */
  patientEmail: z.string().trim().email().optional().or(z.literal("")),
  patientName: z.string().trim().max(120).optional(),
  orgName: z.string().trim().max(120).optional(),
});

/**
 * Create a patient record.
 *
 * Admins may create records for any patient; clinicians only within their own
 * organisation. Nothing here invents readings — a new record starts with no
 * data at all and stays that way until a Libre source is connected.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "admin" && user.role !== "doctor" && user.role !== "nurse") {
      return NextResponse.json({ ok: false, error: "Only staff can create patient records." }, { status: 403 });
    }

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      return NextResponse.json({ ok: false, error: first?.message ?? "Invalid details" }, { status: 400 });
    }
    const body = parsed.data;

    // Resolve the organisation this record belongs to.
    let orgId = user.org_id ?? null;
    if (user.role === "admin" && !orgId) {
      const orgs = await listOrgs();
      if (orgs.length > 0) orgId = orgs[0].id;
      else orgId = (await createOrg({ name: body.orgName || "Walhad CareLink", type: "family" })).id;
    }

    // Optionally attach the record to an existing login.
    let patientUserId: number | null = null;
    if (body.patientEmail) {
      const existing = await db().get<{ id: number }>("SELECT id FROM users WHERE email = ?", [
        body.patientEmail.toLowerCase(),
      ]);
      if (existing) {
        patientUserId = existing.id;
      } else {
        const { createUser } = await import("@/lib/db/repo");
        const { randomBytes } = await import("node:crypto");
        const temp = `Wc-${randomBytes(6).toString("base64url")}!`;
        const created = await createUser({
          email: body.patientEmail,
          name: body.patientName || body.displayName,
          password: temp,
          role: "patient",
          orgId,
        });
        patientUserId = created.id;
        // Shown once by the UI so the patient can sign in and change it.
        await setSetting(`temp_password:${created.id}`, temp);
      }
    }

    const inserted = await createPatient({
      userId: patientUserId,
      orgId,
      displayName: body.displayName,
      dateOfBirth: body.dateOfBirth || null,
      timezone: body.timezone,
      unit: body.unit,
      targetLow: body.targetLow,
      targetHigh: body.targetHigh,
      // No provider until one is deliberately connected.
      provider: "none",
    });

    // INSERT ... RETURNING is not available on every dialect we support, so read
    // the row back by id before answering.
    const patient = await getPatient(inserted.id);
    if (!patient) {
      return NextResponse.json({ ok: false, error: "The record was created but could not be read back." }, { status: 500 });
    }

    const record = await db().get<any>(
      "SELECT COUNT(*) AS c FROM glucose_readings WHERE patient_id = ?",
      [patient.id],
    );

    return NextResponse.json({
      ok: true,
      patient: {
        id: patient.id,
        displayName: patient.display_name,
        timezone: patient.timezone,
        unit: patient.unit,
        createdAt: patient.created_at,
      },
      readings: num(record?.c ?? 0),
      login: body.patientEmail ? { email: body.patientEmail } : null,
      next: `/dashboard/connection?patientId=${patient.id}`,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    console.error("[patients:create]", err);
    return NextResponse.json({ ok: false, error: "Could not create the patient record." }, { status: 500 });
  }
}

/** Records the caller is allowed to see, used by the admin console list. */
export async function GET() {
  try {
    const user = await requireUser();
    const rows =
      user.role === "admin"
        ? await db().query<any>(
            `SELECT p.id, p.display_name, p.provider, p.provider_connected_at, p.created_at, p.org_id,
                    (SELECT COUNT(*) FROM glucose_readings g WHERE g.patient_id = p.id) AS readings
             FROM patients p WHERE p.status <> 'archived' ORDER BY p.created_at DESC`,
          )
        : await db().query<any>(
            `SELECT p.id, p.display_name, p.provider, p.provider_connected_at, p.created_at, p.org_id,
                    (SELECT COUNT(*) FROM glucose_readings g WHERE g.patient_id = p.id) AS readings
             FROM patients p WHERE p.org_id = ? AND p.status <> 'archived' ORDER BY p.created_at DESC`,
            [user.org_id ?? -1],
          );
    return NextResponse.json({
      ok: true,
      patients: rows.map((r) => ({
        id: r.id,
        displayName: r.display_name,
        provider: r.provider,
        connectedAt: r.provider_connected_at,
        createdAt: r.created_at,
        readings: num(r.readings),
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    }
    return NextResponse.json({ ok: false, error: "Could not list patients." }, { status: 500 });
  }
}

/**
 * Archive a patient record.
 *
 * Medical rows are never hard-deleted by an ordinary action: the record is
 * marked `archived`, its monitoring connection is cleared so nothing more is
 * pulled, and the audit trail keeps who archived it and when.
 */
export async function DELETE(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Administrator access required." }, { status: 403 });
    }
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ ok: false, error: "A valid patient id is required." }, { status: 422 });
    }
    const patient = await db().get<any>("SELECT id, display_name, org_id FROM patients WHERE id = ?", [id]);
    if (!patient) return NextResponse.json({ ok: false, error: "Patient not found." }, { status: 404 });

    await db().run(
      `UPDATE patients
         SET status = 'archived', provider = 'none', provider_patient_id = NULL,
             credential_cipher = NULL, bridge_key_hash = NULL
       WHERE id = ?`,
      [id],
    );
    await db().run("DELETE FROM patient_members WHERE patient_id = ?", [id]);
    await db().run("DELETE FROM clinician_assignments WHERE patient_id = ?", [id]);

    const { audit } = await import("@/lib/db/repo");
    await audit({
      actorId: user.id,
      actorLabel: user.email,
      action: "patient.archive",
      entity: "patients",
      entityId: id,
      meta: { displayName: patient.display_name },
    });

    return NextResponse.json({ ok: true, archived: id });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    return NextResponse.json({ ok: false, error: "Could not archive the record." }, { status: 500 });
  }
}
