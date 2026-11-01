import { z } from "zod";
import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient, audit, patientMembers } from "@/lib/db/repo";
import { linksForPatient, disconnectLink } from "@/lib/notify/telegram-bot";
import { botToken, botUsername } from "@/lib/notify/telegram";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";
import { subscriptionFor } from "@/lib/billing/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskChat(chat: string): string {
  if (chat.startsWith("preview:")) return "preview chat";
  if (chat.length <= 6) return chat;
  return `${chat.slice(0, 3)}•••${chat.slice(-3)}`;
}

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const token = await botToken();
  const username = token ? await botUsername() : null;
  const links = await linksForPatient(patientId);
  const members = await patientMembers(patientId);
  const memberName = new Map(members.map((m) => [m.user_id, m.user.name]));
  const sub = await subscriptionFor({ orgId: access.patient.org_id, patientId });

  const deliveries = await db().query<any>(
    "SELECT id, channel, recipient, status, error, created_at FROM notifications WHERE patient_id = ? ORDER BY created_at DESC LIMIT 25",
    [patientId],
  );

  return json({
    ok: true,
    meta: {
      botConfigured: Boolean(token),
      botUsername: username,
      recipientLimit: sub?.plan?.recipient_limit ?? 2,
      planName: sub?.plan?.name ?? null,
    },
    recipients: links
      .filter((l) => l.status !== "disconnected")
      .map((l) => ({
        id: l.id,
        name: l.telegram_display_name ?? l.telegram_username ?? (l.user_id ? memberName.get(l.user_id) : null) ?? "Telegram user",
        chatMasked: maskChat(l.telegram_chat_id),
        status: l.status,
        linkedAt: l.linked_at ? new Date(l.linked_at).getTime() : null,
        notifyLow: Boolean(l.notify_low),
        notifyHigh: Boolean(l.notify_high),
        notifyCritical: Boolean(l.notify_critical),
        notifyStatus: Boolean(l.notify_status),
        notifyEmergency: Boolean(l.notify_emergency),
        notifyTrend: Boolean(l.notify_trend),
      })),
    deliveries: deliveries.map((d) => ({
      id: num(d.id),
      channel: d.channel,
      recipient: d.recipient ? maskChat(String(d.recipient)) : null,
      status: d.status,
      error: d.error,
      createdAt: new Date(d.created_at).getTime(),
    })),
  });
});

const del = z.object({ linkId: z.number().int().positive() });

export const DELETE = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = del.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const link = await db().get<{ id: number; patient_id: number }>(
    "SELECT id, patient_id FROM telegram_links WHERE id = ?",
    [parsed.data.linkId],
  );
  if (!link) return fail("Link not found", 404);

  const access = await accessForPatient(user.id, user.role, link.patient_id);
  if (!access?.canManage) return fail("Only the patient or an administrator can disconnect a recipient.", 403);

  await disconnectLink(link.id);
  await audit({
    actorId: user.id,
    actorLabel: user.email,
    action: "telegram.disconnect",
    entity: "telegram_links",
    entityId: link.id,
  });
  return json({ ok: true });
});
