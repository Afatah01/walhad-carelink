import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { createOrg, createUser, listOrgs, audit } from "@/lib/db/repo";
import { num } from "@/lib/db/repo-util";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["family", "hospital"]).default("hospital"),
  country: z.string().trim().max(80).optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  contactPhone: z.string().trim().max(40).optional(),
  address: z.string().trim().max(240).optional(),
  /** Optional first staff member created with the hospital. */
  adminEmail: z.string().trim().email().optional().or(z.literal("")),
  adminName: z.string().trim().max(120).optional(),
  adminPassword: z.string().min(8).max(200).optional(),
});

/** List organisations with real counts. */
export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "admin" && user.role !== "doctor") {
      return NextResponse.json({ ok: false, error: "Administrator access required." }, { status: 403 });
    }
    const orgs = await listOrgs();
    const out = [];
    for (const o of orgs) {
      const counts = await db().get<any>(
        `SELECT
           (SELECT COUNT(*) FROM patients WHERE org_id = ? AND status <> 'archived') AS patients,
           (SELECT COUNT(*) FROM users WHERE org_id = ? AND role IN ('doctor','nurse')) AS staff,
           (SELECT COUNT(*) FROM patients WHERE org_id = ? AND provider_connected_at IS NOT NULL) AS connected`,
        [o.id, o.id, o.id],
      );
      out.push({
        id: o.id,
        name: o.name,
        type: o.type,
        country: o.country,
        patients: num(counts?.patients),
        staff: num(counts?.staff),
        connected: num(counts?.connected),
        createdAt: o.created_at,
      });
    }
    return NextResponse.json({ ok: true, orgs: out });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    return NextResponse.json({ ok: false, error: "Could not list organisations." }, { status: 500 });
  }
}

/** Create a hospital (or family) organisation, optionally with its first staff login. */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Administrator access required." }, { status: 403 });
    }

    const parsed = Body.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 422 });
    }
    const body = parsed.data;

    const existing = await db().get<{ id: number }>("SELECT id FROM organizations WHERE name = ?", [body.name]);
    if (existing) {
      return NextResponse.json({ ok: false, error: "An organisation with that name already exists." }, { status: 409 });
    }

    const org = await createOrg({
      name: body.name,
      type: body.type,
      country: body.country || undefined,
      contactEmail: body.contactEmail || undefined,
      contactPhone: body.contactPhone || undefined,
      address: body.address || undefined,
    });

    let staff: { email: string; password: string } | null = null;

    if (body.adminEmail) {
      const dupe = await db().get<{ id: number }>("SELECT id FROM users WHERE email = ?", [
        body.adminEmail.toLowerCase(),
      ]);
      if (dupe) {
        return NextResponse.json(
          { ok: false, error: "That email already has an account.", orgId: org.id },
          { status: 409 },
        );
      }
      const password =
        body.adminPassword || `${randomBytes(9).toString("base64url")}!Aa1`;
      const created = await createUser({
        email: body.adminEmail,
        name: body.adminName || body.name,
        password,
        role: body.type === "hospital" ? "doctor" : "patient",
        orgId: org.id,
        title: body.type === "hospital" ? "Clinical lead" : null,
      });
      staff = { email: body.adminEmail, password };
    }

    await audit({
      actorId: user.id,
      actorLabel: user.email,
      action: "org.create",
      entity: "organizations",
      entityId: org.id,
      meta: { name: body.name, type: body.type },
    });

    return NextResponse.json({
      ok: true,
      org: { id: org.id, name: org.name, type: org.type },
      staff,
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ ok: false, error: err.message }, { status: err.status });
    console.error("[orgs:create]", err);
    return NextResponse.json({ ok: false, error: "Could not create the organisation." }, { status: 500 });
  }
}
