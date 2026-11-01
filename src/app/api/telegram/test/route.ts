import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { accessForPatient } from "@/lib/db/repo";
import { sendChannelTest } from "@/lib/notify/dispatch";
import { sendTestNotification } from "@/lib/notify/telegram-bot";
import { db } from "@/lib/db/client";
import { botToken } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  patientId: z.number().int().positive(),
  channel: z.enum(["telegram", "sms", "push"]).optional(),
});

export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const channel = parsed.data.channel ?? "telegram";
  const hasToken = Boolean(await botToken());

  if (channel === "telegram" && !hasToken) {
    // Preview deployments still record the attempt so the delivery log is honest.
    await db().run(
      `INSERT INTO notifications (alert_id, patient_id, user_id, channel, recipient, status, error, attempts, created_at)
       VALUES (NULL, ?, ?, 'telegram', NULL, 'skipped', ?, 1, ?)`,
      [
        parsed.data.patientId,
        user.id,
        "TELEGRAM_BOT_TOKEN is not configured on this deployment",
        new Date().toISOString(),
      ],
    );
    return json({
      ok: false,
      detail:
        "Telegram bot token is not configured on this deployment. Set TELEGRAM_BOT_TOKEN and the bot will deliver live messages.",
    });
  }

  const result = await sendChannelTest({
    patientId: parsed.data.patientId,
    userId: user.id,
    channel,
  });

  // Also exercise the multi-chat sender when the patient has several links.
  if (channel === "telegram" && result.ok) {
    const links = await db().query<{ telegram_chat_id: string }>(
      "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id = ? AND status = 'active'",
      [parsed.data.patientId, user.id],
    );
    for (const l of links) {
      await sendTestNotification(l.telegram_chat_id, access.patient);
    }
  }

  return json({ ok: result.ok, detail: result.detail });
});
