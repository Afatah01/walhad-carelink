import { fail, json, route } from "@/lib/api";
import { getSetting, setSetting } from "@/lib/db/repo";
import { deleteWebhook, getWebhookInfo, getMe, setWebhook } from "@/lib/notify/telegram";
import { siteUrl } from "@/lib/site-config";
import { humanCode } from "@/lib/crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only helper that registers the HTTPS webhook with Telegram. */
export const POST = route(
  async ({ req }) => {
    const action = req.nextUrl.searchParams.get("action") ?? "register";
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return fail("TELEGRAM_BOT_TOKEN is not set on this deployment.", 400);

    if (action === "info") {
      const info = await getWebhookInfo();
      const me = await getMe();
      return json({ ok: info.ok, info: info.result ?? null, bot: me });
    }

    if (action === "delete") {
      const res = await deleteWebhook();
      return json({ ok: res.ok, detail: res.description ?? "Webhook removed" });
    }

    let secret: string | undefined = process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined;
    if (!secret) {
      const stored = await getSetting("telegram_webhook_secret");
      if (stored) {
        secret = stored;
      } else {
        const generated = humanCode(40).toLowerCase();
        await setSetting("telegram_webhook_secret", generated);
        secret = generated;
      }
    }

    const base = siteUrl();
    if (!base.startsWith("https://")) {
      return fail("APP_BASE_URL must be a public HTTPS URL before registering a webhook.", 400);
    }

    const res = await setWebhook(`${base}/api/telegram/webhook`, secret);
    if (res.ok) {
      await setSetting("telegram_webhook_registered_at", new Date().toISOString());
      const me = await getMe();
      if (me?.username) await setSetting("telegram_bot_username", me.username);
    }
    return json({
      ok: res.ok,
      detail: res.ok ? "Webhook registered" : res.description ?? "Telegram rejected the webhook",
      url: `${base}/api/telegram/webhook`,
    });
  },
  { roles: ["admin"] },
);
