import { z } from "zod";
import { fail, json, route } from "@/lib/api";
import { accessForPatient } from "@/lib/db/repo";
import { createLinkToken } from "@/lib/notify/telegram-bot";
import { botUsername, botToken } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MINUTES = 20;

const schema = z.object({ patientId: z.number().int().positive() });

/**
 * Create a single-use linking code for the signed-in account.
 * The code is bound to (patient, user) and consumed by the bot's /start handler.
 */
export const POST = route(async ({ req, user }) => {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("Invalid request", 422);

  const access = await accessForPatient(user.id, user.role, parsed.data.patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const token = await createLinkToken({
    patientId: parsed.data.patientId,
    userId: user.id,
    ttlMinutes: TTL_MINUTES,
  });

  const hasBot = Boolean(await botToken());
  const username = hasBot ? await botUsername() : null;

  return json({
    ok: true,
    token,
    botUsername: username,
    deepLink: username ? `https://t.me/${username}?start=${token}` : null,
    expiresInMinutes: TTL_MINUTES,
  });
});
