/**
 * Register the Telegram webhook for this deployment.
 *
 *   TELEGRAM_BOT_TOKEN=... APP_BASE_URL=https://your-app.onrender.com \
 *     npm run telegram:set-webhook
 *
 * A random secret is generated once and stored in the settings table; Telegram
 * echoes it back in the X-Telegram-Bot-Api-Secret-Token header so the webhook
 * route can reject anything that did not come from Telegram.
 */
import { randomBytes } from "node:crypto";
import { migrate } from "../src/lib/db/migrate";
import { getSetting, setSetting } from "../src/lib/db/repo";
import { deleteWebhook, getMe, getWebhookInfo, setWebhook } from "../src/lib/notify/telegram";
import { siteUrl } from "../src/lib/site-config";

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set. Add it to .env or your host environment.");
  process.exit(1);
}

await migrate();

const action = process.argv[2] ?? "register";
const base = siteUrl();

if (action === "info") {
  const me = await getMe();
  const info = await getWebhookInfo();
  console.log("Bot:", me?.username ? `@${me.username}` : "unavailable");
  console.log("Webhook:", JSON.stringify(info.result ?? info, null, 2));
  process.exit(0);
}

if (action === "delete") {
  const res = await deleteWebhook();
  console.log(res.ok ? "Webhook removed." : `Failed: ${res.description}`);
  process.exit(res.ok ? 0 : 1);
}

if (!base.startsWith("https://")) {
  console.error(`APP_BASE_URL must be a public HTTPS URL (currently ${base}).`);
  process.exit(1);
}

let secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
if (!secret) {
  secret = (await getSetting("telegram_webhook_secret")) ?? undefined;
  if (!secret) {
    secret = randomBytes(24).toString("hex");
    await setSetting("telegram_webhook_secret", secret);
    console.log("Generated and stored a new webhook secret.");
  }
}

const url = `${base}/api/telegram/webhook`;
const res = await setWebhook(url, secret);
if (res.ok) {
  await setSetting("telegram_webhook_registered_at", new Date().toISOString());
  const me = await getMe();
  if (me?.username) await setSetting("telegram_bot_username", me.username);
  console.log(`Webhook registered: ${url}`);
  console.log(`Bot: @${me?.username ?? "unknown"}`);
} else {
  console.error(`Telegram rejected the webhook: ${res.description}`);
  process.exit(1);
}
process.exit(0);
