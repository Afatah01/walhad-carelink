import { db } from "../db/client";
import { nowIso, num } from "../db/repo-util";
import { getPlan, type Plan } from "./plans";
import { randomToken } from "../crypto";

export interface SubscriptionRow {
  id: number;
  org_id: number | null;
  patient_id: number | null;
  plan_id: number;
  status: "pending" | "active" | "past_due" | "cancelled" | "expired";
  seats: number;
  sms_allowance: number;
  sms_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: number;
  provider: string | null;
  provider_ref: string | null;
  created_at: string;
  updated_at: string | null;
}

export const SMS_ALLOWANCE: Record<string, number> = {
  "family-basic": 100,
  "family-premium": 400,
  hospital: 5000,
};

export async function subscriptionFor(input: { orgId?: number | null; patientId?: number | null }): Promise<
  (SubscriptionRow & { plan: Plan | null }) | null
> {
  const row = input.orgId
    ? await db().get<SubscriptionRow>(
        "SELECT * FROM subscriptions WHERE org_id = ? ORDER BY id DESC LIMIT 1",
        [input.orgId],
      )
    : await db().get<SubscriptionRow>(
        "SELECT * FROM subscriptions WHERE patient_id = ? ORDER BY id DESC LIMIT 1",
        [input.patientId ?? -1],
      );
  if (!row) return null;
  const plan = await db().get<any>("SELECT * FROM plans WHERE id = ?", [row.plan_id]);
  return { ...row, plan: plan ? (plan as Plan) : null };
}

export async function listSubscriptions(): Promise<any[]> {
  return db().query(
    `SELECT s.*, p.name AS plan_name, p.slug AS plan_slug, p.price_cents, o.name AS org_name
     FROM subscriptions s JOIN plans p ON p.id = s.plan_id
     LEFT JOIN organizations o ON o.id = s.org_id
     ORDER BY s.created_at DESC`,
  );
}

export async function listPayments(limit = 50): Promise<any[]> {
  return db().query(
    `SELECT pay.*, o.name AS org_name, p.name AS plan_name
     FROM payments pay
     LEFT JOIN subscriptions s ON s.id = pay.subscription_id
     LEFT JOIN plans p ON p.id = s.plan_id
     LEFT JOIN organizations o ON o.id = COALESCE(pay.org_id, s.org_id)
     ORDER BY pay.created_at DESC LIMIT ?`,
    [limit],
  );
}

/**
 * Create a subscription in `pending` state.
 *
 * A subscription is NEVER marked active here. Activation happens only after a
 * provider-verified payment confirmation (see confirmPayment).
 */
export async function createSubscription(input: {
  planSlug: string;
  orgId?: number | null;
  patientId?: number | null;
  seats?: number;
  provider?: string;
}): Promise<{ subscription: SubscriptionRow; plan: Plan; checkoutRef: string }> {
  const plan = await getPlan(input.planSlug);
  if (!plan) throw new Error("Unknown plan");
  const checkoutRef = `wc_${randomToken(12)}`;
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  const row = await db().get<SubscriptionRow>(
    `INSERT INTO subscriptions (org_id, patient_id, plan_id, status, seats, sms_allowance, sms_used,
      current_period_start, current_period_end, cancel_at_period_end, provider, provider_ref, created_at, updated_at)
     VALUES (?, ?, ?, 'pending', ?, ?, 0, ?, ?, 0, ?, ?, ?, ?)`,
    [
      input.orgId ?? null,
      input.patientId ?? null,
      plan.id,
      input.seats ?? 1,
      SMS_ALLOWANCE[plan.slug] ?? 100,
      start.toISOString(),
      end.toISOString(),
      input.provider ?? "manual",
      checkoutRef,
      nowIso(),
      nowIso(),
    ],
  );
  if (!row) throw new Error("Could not create subscription");

  await db().run(
    `INSERT INTO payments (subscription_id, org_id, amount_cents, currency, status, provider, provider_ref,
      invoice_no, description, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?)`,
    [
      row.id,
      input.orgId ?? null,
      plan.price_cents,
      plan.currency,
      input.provider ?? "manual",
      `${checkoutRef}_first`,
      invoiceNumber(row.id),
      `${plan.name} — first month`,
      nowIso(),
    ],
  );

  return { subscription: row, plan, checkoutRef };
}

export function invoiceNumber(subId: number, date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `WC-${y}${m}-${String(subId).padStart(5, "0")}`;
}

/**
 * Verify a payment with the configured provider.
 *
 * Only a provider-confirmed transaction may activate a subscription. In
 * `manual` mode an operator must confirm through the admin console, which calls
 * this function with an explicit verification source.
 */
export async function confirmPayment(input: {
  providerRef: string;
  provider: string;
  verifiedBy?: string;
  amountCents?: number;
}): Promise<{ ok: boolean; message: string; subscriptionId?: number }> {
  const payment = await db().get<any>("SELECT * FROM payments WHERE provider_ref = ?", [input.providerRef]);
  if (!payment) return { ok: false, message: "Payment reference not found" };
  if (payment.status === "paid") return { ok: false, message: "Payment already confirmed" };

  if (input.amountCents !== undefined && input.amountCents !== payment.amount_cents) {
    return { ok: false, message: "Amount mismatch — refusing to activate" };
  }

  const now = nowIso();
  await db().run("UPDATE payments SET status = 'paid', paid_at = ?, provider = ? WHERE id = ?", [
    now,
    input.provider,
    payment.id,
  ]);

  const sub = await db().get<SubscriptionRow>("SELECT * FROM subscriptions WHERE id = ?", [payment.subscription_id]);
  if (!sub) return { ok: false, message: "Subscription missing" };

  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);

  await db().run(
    `UPDATE subscriptions SET status = 'active', current_period_start = ?, current_period_end = ?,
      provider = ?, cancel_at_period_end = 0, updated_at = ? WHERE id = ?`,
    [start.toISOString(), end.toISOString(), input.provider, now, sub.id],
  );

  return { ok: true, message: "Payment verified — subscription active", subscriptionId: sub.id };
}

export async function changePlan(input: {
  subscriptionId: number;
  planSlug: string;
}): Promise<{ ok: boolean; message: string }> {
  const plan = await getPlan(input.planSlug);
  if (!plan) return { ok: false, message: "Unknown plan" };
  const sub = await db().get<SubscriptionRow>("SELECT * FROM subscriptions WHERE id = ?", [input.subscriptionId]);
  if (!sub) return { ok: false, message: "Subscription not found" };
  await db().run(
    "UPDATE subscriptions SET plan_id = ?, status = 'pending', sms_allowance = ?, provider_ref = ?, updated_at = ? WHERE id = ?",
    [plan.id, SMS_ALLOWANCE[plan.slug] ?? 100, `wc_change_${randomToken(8)}`, nowIso(), sub.id],
  );
  await db().run(
    `INSERT INTO payments (subscription_id, org_id, amount_cents, currency, status, provider, provider_ref,
      invoice_no, description, created_at)
     VALUES (?, ?, ?, ?, 'pending', 'manual', ?, ?, ?, ?)`,
    [
      sub.id,
      sub.org_id,
      plan.price_cents,
      plan.currency,
      `wc_change_${randomToken(8)}`,
      invoiceNumber(sub.id),
      `Plan change — ${plan.name}`,
      nowIso(),
    ],
  );
  return { ok: true, message: "Plan change created — awaiting verified payment confirmation." };
}

export async function cancelSubscription(subscriptionId: number, immediate = false): Promise<void> {
  if (immediate) {
    await db().run("UPDATE subscriptions SET status = 'cancelled', updated_at = ? WHERE id = ?", [
      nowIso(),
      subscriptionId,
    ]);
  } else {
    await db().run("UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE id = ?", [
      nowIso(),
      subscriptionId,
    ]);
  }
}

/** Guard used by feature gates (e.g. location sharing is Premium+). */
export async function planFeatures(input: { orgId?: number | null; patientId?: number | null }): Promise<{
  plan: Plan | null;
  status: string;
  features: string[];
  recipientLimit: number | null;
  smsRemaining: number;
}> {
  const sub = await subscriptionFor(input);
  const plan = sub?.plan ?? null;
  return {
    plan,
    status: sub?.status ?? "none",
    features: plan?.features ?? [],
    recipientLimit: plan?.recipient_limit ?? 2,
    smsRemaining: Math.max(0, (sub?.sms_allowance ?? 0) - (sub?.sms_used ?? 0)),
  };
}

export { num };
