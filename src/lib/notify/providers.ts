/**
 * Outbound channel adapters.
 *
 * Every adapter is a thin, replaceable function. Credentials live in environment
 * variables; when a channel is not configured the adapter reports
 * `not_configured` so the UI can show an honest delivery state instead of
 * pretending a message went out.
 */

export type DeliveryStatus =
  | "sent"
  | "queued"
  | "failed"
  | "skipped"
  | "not_configured"
  | "no_recipient";

export interface DeliveryResult {
  ok: boolean;
  status: DeliveryStatus;
  ref?: string | null;
  error?: string | null;
  provider: string;
}

const TIMEOUT = 12_000;

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------- SMS ---------------------------------- */

export function smsConfigured(): boolean {
  return Boolean(
    (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) ||
      (process.env.SMS_HTTP_URL && process.env.SMS_HTTP_TOKEN),
  );
}

export async function sendSms(to: string, body: string): Promise<DeliveryResult> {
  const e164 = normalizeE164(to);
  if (!e164) return { ok: false, status: "no_recipient", provider: "sms", error: "Invalid phone number" };
  if (!smsConfigured()) {
    return {
      ok: false,
      status: "not_configured",
      provider: "sms",
      error: "SMS provider credentials are not configured (TWILIO_* or SMS_HTTP_*).",
    };
  }

  // Twilio REST API
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
    try {
      const res = await withTimeout((signal) =>
        fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: "POST",
          headers: {
            authorization: `Basic ${auth}`,
            "content-type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: e164,
            From: process.env.TWILIO_FROM_NUMBER!,
            Body: body,
          }),
          signal,
        }),
      );
      const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) {
        return { ok: false, status: "failed", provider: "twilio", error: json.message ?? `HTTP ${res.status}` };
      }
      return { ok: true, status: "sent", provider: "twilio", ref: json.sid ?? null };
    } catch (err) {
      return { ok: false, status: "failed", provider: "twilio", error: errText(err) };
    }
  }

  // Generic HTTP SMS gateway
  try {
    const res = await withTimeout((signal) =>
      fetch(process.env.SMS_HTTP_URL!, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.SMS_HTTP_TOKEN}`,
        },
        body: JSON.stringify({ to: e164, message: body }),
        signal,
      }),
    );
    if (!res.ok) return { ok: false, status: "failed", provider: "sms-http", error: `HTTP ${res.status}` };
    return { ok: true, status: "sent", provider: "sms-http" };
  } catch (err) {
    return { ok: false, status: "failed", provider: "sms-http", error: errText(err) };
  }
}

export function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+") && digits.length >= 8 && digits.length <= 16) return digits;
  if (/^\d{7,15}$/.test(digits)) return `+${digits}`;
  return null;
}

/* --------------------------------- email --------------------------------- */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(to: string, subject: string, text: string): Promise<DeliveryResult> {
  if (!emailConfigured()) {
    return { ok: false, status: "not_configured", provider: "email", error: "RESEND_API_KEY / EMAIL_FROM not set." };
  }
  try {
    const res = await withTimeout((signal) =>
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text }),
        signal,
      }),
    );
    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, status: "failed", provider: "resend", error: json.message ?? `HTTP ${res.status}` };
    return { ok: true, status: "sent", provider: "resend", ref: json.id ?? null };
  } catch (err) {
    return { ok: false, status: "failed", provider: "resend", error: errText(err) };
  }
}

/* ------------------------------ web push --------------------------------- */

export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendWebPush(
  sub: PushSubscriptionRecord,
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  if (!pushConfigured()) {
    return {
      ok: false,
      status: "not_configured",
      provider: "web-push",
      error: "VAPID keys are not configured.",
    };
  }
  try {
    const webpush = await import("web-push");
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:support@example.com",
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload),
      { TTL: 300, urgency: (payload.urgency as "high" | "normal") ?? "high" },
    );
    return { ok: true, status: "sent", provider: "web-push" };
  } catch (err: any) {
    const code = err?.statusCode;
    if (code === 404 || code === 410) {
      return { ok: false, status: "failed", provider: "web-push", error: "Subscription expired (410)" };
    }
    return { ok: false, status: "failed", provider: "web-push", error: errText(err) };
  }
}

function errText(err: unknown): string {
  if (err instanceof Error) {
    if (err.name === "AbortError") return "Request timed out";
    return err.message.slice(0, 300);
  }
  return "Unknown error";
}
