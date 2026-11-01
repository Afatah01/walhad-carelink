import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { audit } from "@/lib/db/repo";
import { createSubscription } from "@/lib/billing/subscriptions";
import { siteUrl } from "@/lib/site-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ planSlug: z.string().min(2).max(60) });

/**
 * Start a plan change. Creates a PENDING subscription plus a pending invoice —
 * never an active subscription. Activation requires a verified payment.
 */
export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  if (parsed.data.planSlug === "hospital") {
    return json({
      ok: true,
      message:
        "Hospital plans are quoted per organisation. A member of our team will contact you to confirm capacity and pricing.",
    });
  }

  const intent = await createSubscription({
    planSlug: parsed.data.planSlug,
    orgId: user.org_id,
    provider: "manual",
  });

  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "billing.subscribe",
    entity: "subscriptions",
    entityId: intent.subscription.id,
    meta: { plan: intent.plan.slug, checkoutRef: intent.checkoutRef },
  });

  const checkoutUrl = process.env.PAYMENT_CHECKOUT_URL
    ? `${process.env.PAYMENT_CHECKOUT_URL}?ref=${encodeURIComponent(intent.checkoutRef)}&return=${encodeURIComponent(
        `${siteUrl()}/dashboard/billing`,
      )}`
    : null;

  return json({
    ok: true,
    message: checkoutUrl
      ? "Redirecting to secure checkout. Your plan activates after the provider confirms payment."
      : "Plan change created. Connect a payment provider (PAYMENT_CHECKOUT_URL) or confirm the payment in the admin console to activate it.",
    checkoutUrl,
    reference: intent.checkoutRef,
    amountCents: intent.plan.price_cents,
  });
});

