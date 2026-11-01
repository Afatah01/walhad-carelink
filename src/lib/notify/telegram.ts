import { getSetting } from "../db/repo";

/**
 * Official Telegram Bot API client.
 *
 * The bot token is read server-side only — from the encrypted-free settings
 * table (set through /dashboard/settings or TELEGRAM_BOT_TOKEN env). It is never
 * shipped to the browser and never written into logs.
 */

const API_BASE = process.env.TELEGRAM_API_BASE ?? "https://api.telegram.org";

export interface TgMessage {
  message_id: number;
  chat: { id: number; type: string; username?: string; first_name?: string; last_name?: string; title?: string };
  from?: { id: number; is_bot: boolean; first_name?: string; last_name?: string; username?: string };
  text?: string;
  date: number;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: {
    id: string;
    from: { id: number; username?: string; first_name?: string };
    data?: string;
    message?: TgMessage;
  };
}

export interface TgApiResult<T> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export async function botToken(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (fromEnv) return fromEnv;
  try {
    const stored = await getSetting("telegram_bot_token");
    return stored?.trim() || null;
  } catch {
    return null;
  }
}

export async function botUsername(): Promise<string | null> {
  const fromEnv = process.env.TELEGRAM_BOT_USERNAME?.trim();
  if (fromEnv) return fromEnv.replace(/^@/, "");
  try {
    const stored = await getSetting("telegram_bot_username");
    if (stored) return stored.replace(/^@/, "");
  } catch {
    /* ignore */
  }
  const info = await getMe();
  return info?.username ?? null;
}

async function call<T>(
  method: string,
  payload?: Record<string, unknown>,
  init?: { timeoutMs?: number },
): Promise<TgApiResult<T>> {
  const token = await botToken();
  if (!token) return { ok: false, description: "Bot token not configured" };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), init?.timeoutMs ?? 12_000);
  try {
    const res = await fetch(`${API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload ?? {}),
      signal: controller.signal,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({ ok: false }))) as TgApiResult<T>;
    if (!json.ok) {
      // Never echo the token-bearing URL.
      return { ok: false, description: json.description ?? `Telegram error ${res.status}`, error_code: json.error_code };
    }
    return json;
  } catch (err) {
    return {
      ok: false,
      description: err instanceof Error && err.name === "AbortError" ? "Telegram request timed out" : "Network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

export interface InlineButton {
  text: string;
  web_app?: { url: string };
  url?: string;
  callback_data?: string;
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  opts?: {
    buttons?: InlineButton[][];
    disablePreview?: boolean;
    parseMode?: "HTML" | "Markdown";
  },
): Promise<TgApiResult<TgMessage>> {
  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    disable_web_page_preview: opts?.disablePreview ?? true,
  };
  if (opts?.parseMode) payload.parse_mode = opts.parseMode;
  if (opts?.buttons?.length) payload.reply_markup = { inline_keyboard: opts.buttons };
  return call<TgMessage>("sendMessage", payload);
}

export async function sendChatAction(chatId: string | number, action = "typing") {
  return call<boolean>("sendChatAction", { chat_id: chatId, action });
}

export async function getMe(): Promise<{ id: number; username?: string; first_name?: string } | null> {
  const res = await call<{ id: number; username?: string; first_name?: string }>("getMe");
  return res.ok && res.result ? res.result : null;
}

export async function setWebhook(url: string, secret: string): Promise<TgApiResult<boolean>> {
  return call<boolean>(
    "setWebhook",
    {
      url,
      secret_token: secret,
      allowed_updates: ["message", "edited_message", "callback_query"],
      drop_pending_updates: false,
      max_connections: 40,
    },
    { timeoutMs: 15_000 },
  );
}

export async function deleteWebhook(): Promise<TgApiResult<boolean>> {
  return call<boolean>("deleteWebhook", { drop_pending_updates: false });
}

export async function getWebhookInfo(): Promise<TgApiResult<Record<string, unknown>>> {
  return call<Record<string, unknown>>("getWebhookInfo");
}

export async function answerCallbackQuery(id: string, text?: string): Promise<TgApiResult<boolean>> {
  return call<boolean>("answerCallbackQuery", { callback_query_id: id, text, show_alert: false });
}

/* --------------------------------- helpers -------------------------------- */

export async function verifySecret(headerValue: string | null): Promise<boolean> {
  const expected = (process.env.TELEGRAM_WEBHOOK_SECRET ?? (await getSetting("telegram_webhook_secret")) ?? "").trim();
  if (!expected) return true; // secret not configured yet (setup mode)
  return Boolean(headerValue) && headerValue === expected;
}

export function chatLabel(msg: TgMessage): string {
  const c = msg.chat;
  if (c.type === "private") {
    const full = [msg.from?.first_name, msg.from?.last_name].filter(Boolean).join(" ");
    return full || c.first_name || (c.username ? `@${c.username}` : `Chat ${c.id}`);
  }
  return c.title || `Chat ${c.id}`;
}

export function telegramEnabled(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

/** Fire-and-forget delivery used by the alert dispatcher. */
export async function sendAlertMessage(
  chatId: string,
  text: string,
  buttons?: InlineButton[][],
): Promise<{ ok: boolean; messageId?: number; error?: string }> {
  const res = await sendMessage(chatId, text, { buttons, disablePreview: true });
  if (res.ok && res.result) return { ok: true, messageId: res.result.message_id };
  return { ok: false, error: res.description ?? "unknown" };
}

const KIND_EMOJI: Record<string, string> = {
  "very-low": "🚨",
  low: "🔻",
  high: "🔺",
  "very-high": "🚨",
  "rapid-change": "⚡",
  "missing-readings": "📡",
  "sensor-disconnect": "📶",
  emergency: "🆘",
};

export interface AlertTelegramContext {
  alertId: number;
  kind: string;
  patientName: string;
  valueLabel: string | null;
  statusLabel: string;
  timeLabel: string;
  locationUrl?: string | null;
  escalated?: boolean;
  carePlan?: string;
}

/** Structured, plain-text alert format (matches the product specification). */
export function formatAlert(ctx: AlertTelegramContext): string {
  const emoji = KIND_EMOJI[ctx.kind] ?? "🔔";
  const isCritical = ctx.kind === "very-low" || ctx.kind === "very-high" || ctx.kind === "emergency";
  const title = ctx.escalated
    ? `${emoji} ESCALATED ALERT`
    : isCritical
      ? `${emoji} CRITICAL GLUCOSE ALERT`
      : `${emoji} ${ctx.statusLabel.toUpperCase()} ALERT`;

  const lines: string[] = [title, ""];
  if (isCritical && ctx.kind !== "emergency") {
    lines.push("An urgent glucose alert has been detected.", "");
  }
  if (ctx.escalated) {
    lines.push("No one has acknowledged this alert yet.", "");
  }
  lines.push(`Patient: ${ctx.patientName}`);
  if (ctx.valueLabel) lines.push(`Glucose Reading: ${ctx.valueLabel}`);
  lines.push(`Status: ${ctx.statusLabel}`);
  lines.push(`Time: ${ctx.timeLabel}`);
  lines.push("");
  if (ctx.kind === "emergency") {
    lines.push("Please contact the patient immediately.");
  } else if (isCritical) {
    lines.push("Please contact the patient immediately.");
  } else {
    lines.push("Action: Please contact the patient and follow their established care plan.");
  }
  if (ctx.locationUrl) {
    lines.push("");
    lines.push(`Location: ${ctx.locationUrl}`);
  }
  lines.push("");
  lines.push(`Alert #${ctx.alertId}`);
  return lines.join("\n");
}
