import { fail, json, route } from "@/lib/api";
import { audit } from "@/lib/db/repo";
import { cancelSubscription, subscriptionFor } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";

export const POST = route(async ({ user }) => {
  const sub = await subscriptionFor({ orgId: user.org_id });
  if (!sub) return fail("No subscription found for this workspace.", 404);
  await cancelSubscription(sub.id, false);
  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "billing.cancel",
    entity: "subscriptions",
    entityId: sub.id,
  });
  return json({ ok: true });
});
