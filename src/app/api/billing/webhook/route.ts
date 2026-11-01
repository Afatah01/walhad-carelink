import { fail, json } from "@/lib/api";
import { confirmPayment } from "@/lib/billing/subscriptions";
import { logIntegration } from "@/lib/db/repo";
import { migrate } from "@/lib/db/migrate";
import { timingSafeEqual } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Payment provider webhook.
 *
 * Only a verified provider callback can activate a subscription. Provider-specific
 * signature verification (Stripe, Paystack, …) can be layered in here once
 * credentials are configured; the shared-secret check below is the baseline.
 */
export async function POST(req: Request) {
  await migrate();
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return fail("Payment webhook is not configured on this deployment.", 503);

  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!timingSafeEqual(provided, secret)) {
    await logIntegration({ provider: "payments", event: "webhook", status: "error", message: "Invalid secret" });
    return fail("Invalid signature", 401);
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return fail("Invalid payload");
  }

  const reference = payload?.reference ?? payload?.data?.reference ?? payload?.provider_ref;
  const amount = payload?.amount ?? payload?.data?.amount;
  if (!reference) return fail("Missing payment reference", 422);

  const result = await confirmPayment({
    providerRef: String(reference),
    provider: payload?.provider ?? "webhook",
    amountCents: typeof amount === "number" ? amount : undefined,
  });

  await logIntegration({
    provider: "payments",
    event: "confirmed",
    status: result.ok ? "ok" : "error",
    message: result.message,
    meta: { reference },
  });

  return json({ ok: result.ok, message: result.message });
}
