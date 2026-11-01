import { intParam, json, route } from "@/lib/api";
import { patientMembers } from "@/lib/db/repo";
import { listPlans } from "@/lib/billing/plans";
import { subscriptionFor } from "@/lib/billing/subscriptions";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  const orgId = user.org_id;
  const sub = await subscriptionFor({ orgId, patientId: patientId || null });

  const payments = sub
    ? await db().query<any>("SELECT * FROM payments WHERE subscription_id = ? ORDER BY created_at DESC LIMIT 24", [sub.id])
    : await db().query<any>("SELECT * FROM payments WHERE org_id = ? ORDER BY created_at DESC LIMIT 24", [orgId ?? -1]);

  const members = patientId ? (await patientMembers(patientId)).filter((m) => m.status === "active") : [];

  return json({
    ok: true,
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          sms_used: sub.sms_used,
          sms_allowance: sub.sms_allowance,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: Boolean(sub.cancel_at_period_end),
          plan: sub.plan,
        }
      : null,
    plans: await listPlans(),
    usage: { members: members.length },
    payments: payments.map((p) => ({
      id: num(p.id),
      invoice_no: p.invoice_no,
      description: p.description,
      amount_cents: num(p.amount_cents),
      currency: p.currency,
      status: p.status,
      at: new Date(p.paid_at ?? p.created_at).getTime(),
    })),
  });
});
