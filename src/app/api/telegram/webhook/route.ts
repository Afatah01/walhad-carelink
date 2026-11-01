import type { NextRequest } from "next/server";
import { migrate } from "@/lib/db/migrate";
import { handleUpdate } from "@/lib/notify/telegram-bot";
import { verifySecret, type TgUpdate } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Telegram webhook endpoint.
 *
 * Always answers 200 so Telegram does not retry-storm, but rejects requests that
 * do not carry the configured secret token header.
 */
export async function POST(req: NextRequest) {
  try {
    await migrate();
    const secretOk = await verifySecret(req.headers.get("x-telegram-bot-api-secret-token"));
    if (!secretOk) {
      return Response.json({ ok: false }, { status: 401 });
    }

    const update = (await req.json()) as TgUpdate;
    if (!update || typeof update.update_id !== "number") {
      return Response.json({ ok: true });
    }

    // Log the incoming chat id (never the token) for debugging.
    const chat = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
    if (chat) {
      const { db } = await import("@/lib/db/client");
      await db()
        .run(
          `INSERT INTO telegram_messages (chat_id, direction, text, created_at) VALUES (?, 'in', ?, ?)`,
          [String(chat), (update.message?.text ?? "callback").slice(0, 400), new Date().toISOString()],
        )
        .catch(() => {});
    }

    // Process asynchronously but await in serverless runtimes to avoid truncation.
    await handleUpdate(update);
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook]", err instanceof Error ? err.message : err);
    return Response.json({ ok: true });
  }
}

export async function GET() {
  return Response.json({ ok: true, endpoint: "telegram-webhook" });
}
