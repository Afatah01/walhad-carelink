import { z } from "zod";
import { fail, json, rateLimit } from "@/lib/api";
import { migrate } from "@/lib/db/migrate";
import { createOrg, createPatient, createUser, findUserByEmail, audit } from "@/lib/db/repo";
import { createSubscription } from "@/lib/billing/subscriptions";
import { getPlan } from "@/lib/billing/plans";
import { setSessionCookie } from "@/lib/auth";
import { roleHome } from "@/lib/auth";
import { signIn } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Patient self-service signup.
 *
 * A patient creates their own account, chooses a plan, and gets a patient
 * record of their own. Nothing is pre-provisioned and no clinical data exists
 * yet: the record is created with `provider = 'none'` and zero readings.
 *
 * The subscription is created as PENDING, never active. It only becomes active
 * when a payment is verified through the billing webhook — so a signup alone
 * never unlocks paid features, and no invoice is marked paid without proof.
 */

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(10, "Use at least 10 characters").max(200),
  phone: z
    .string()
    .trim()
    .max(30)
    .optional()
    .or(z.literal("")),
  planSlug: z.enum(["family-basic", "family-premium"]).default("family-basic"),
  timezone: z.string().trim().max(64).default("Africa/Mogadishu"),
  unit: z.enum(["mg/dL", "mmol/L"]).default("mg/dL"),
  /** The person being monitored. Defaults to the account holder. */
  patientName: z.string().trim().max(120).optional().or(z.literal("")),
  relationship: z.string().trim().max(40).optional().or(z.literal("")),
  acceptTerms: z.literal(true, { message: "You must accept the terms" }),
  consentToMonitor: z.literal(true, { message: "Consent is required" }),
  marketingOptIn: z.boolean().optional(),
});

export async function POST(req: Request) {
  await migrate();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const limited = rateLimit(`signup:${ip}`, 5, 60 * 60_000);
  if (!limited.ok) return fail("Too many sign-up attempts. Please try again later.", 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Please check the details you entered.", 422);
  }
  const body = parsed.data;
  const email = body.email.toLowerCase();

  const plan = await getPlan(body.planSlug);
  if (!plan) return fail("That plan is not available.", 422);

  const existing = await findUserByEmail(email);
  if (existing) {
    // Do not reveal whether an account exists beyond what the user already
    // typed; point them at sign-in instead.
    return fail("An account with that email already exists. Try signing in instead.", 409);
  }

  // Every self-service household gets its own organisation, which is what scopes
  // their data. Clinicians in another org can never see it.
  const org = await createOrg({
    name: `${body.name}'s workspace`,
    type: "family",
    contactEmail: email,
    contactPhone: body.phone || undefined,
  });

  const user = await createUser({
    email,
    name: body.name,
    password: body.password,
    role: "patient",
    orgId: org.id,
    phone: body.phone || null,
    timezone: body.timezone,
    unit: body.unit,
  });

  // The monitored person may be the account holder or someone they care for.
  const patient = await createPatient({
    userId: user.id,
    orgId: org.id,
    displayName: body.patientName || body.name,
    relationship: body.relationship || (body.patientName ? "family" : "self"),
    timezone: body.timezone,
    unit: body.unit,
    // No provider. No readings. Data starts only when they connect a sensor.
    provider: "none",
  });

  const subscription = await createSubscription({
    planSlug: body.planSlug,
    orgId: org.id,
    provider: "manual",
  }).catch(() => null);

  await audit({
    actorId: user.id,
    actorLabel: email,
    action: "auth.signup",
    entity: "users",
    entityId: user.id,
    ip,
    meta: {
      plan: body.planSlug,
      patientId: patient.id,
      orgId: org.id,
      subscriptionId: subscription?.subscription?.id ?? null,
      marketingOptIn: Boolean(body.marketingOptIn),
    },
  });

  // Sign them straight in — they should land on their own dashboard.
  const session = await signIn({
    email,
    password: body.password,
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  if (!session.ok) {
    return json({
      ok: true,
      redirect: "/login",
      note: "Account created. Please sign in.",
    });
  }
  await setSessionCookie(session.token);

  return json({
    ok: true,
    redirect: roleHome(user.role),
    user: { id: user.id, name: user.name, email: user.email },
    patient: { id: patient.id, displayName: patient.display_name },
    subscription: subscription
      ? {
          id: subscription.subscription.id,
          status: subscription.subscription.status,
          plan: subscription.plan.slug,
          price: subscription.plan.price_cents / 100,
          checkoutRef: subscription.checkoutRef,
        }
      : null,
    next: {
      connectSensor: `/dashboard/connection?patientId=${patient.id}`,
      billing: "/dashboard/billing",
    },
    message:
      "Account created. Your record has no readings yet — connect an authorised FreeStyle Libre source to begin monitoring.",
  });
}

export async function GET() {
  return json({ ok: true, plans: ["family-basic", "family-premium"] });
}
