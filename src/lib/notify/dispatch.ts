import { db } from "../db/client";
import { nowIso } from "../db/repo-util";
import { getPatient, getUser, patientMembers, patientThresholds, type PatientRow } from "../db/repo";
import { classify, formatGlucose, LEVEL_META, stampTime, TREND_META, deriveTrend } from "../glucose";
import { latestReading } from "../db/repo-glucose";
import { sendAlertMessage, formatAlert, type InlineButton } from "./telegram";
import { sendSms, sendWebPush, smsConfigured, pushConfigured } from "./providers";

export type DispatchChannel = "push" | "sms" | "telegram" | "audible" | "inapp";

export interface DispatchInput {
  alertId: number;
  patient: PatientRow;
  kind: string;
  level: string;
  value: number | null;
  message: string;
  channels: DispatchChannel[];
  thresholds: { veryLow: number; low: number; high: number; veryHigh: number };
  escalateAfterMinutes: number;
  escalation?: boolean;
}

interface Recipient {
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  push: boolean;
  sms: boolean;
  telegram: boolean;
  chatIds: string[];
  canViewLocation: boolean;
}

export function baseUrl(): string {
  const explicit = process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

async function resolveRecipients(patient: PatientRow, channels: DispatchChannel[]): Promise<Recipient[]> {
  const members = await patientMembers(patient.id);
  const recipients: Recipient[] = [];

  // The patient themselves always gets in-app/push copies of their own alerts.
  if (patient.user_id) {
    const owner = await getUser(patient.user_id);
    if (owner) {
      const tg = await db().query<{ telegram_chat_id: string }>(
        "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id = ? AND status = 'active'",
        [patient.id, owner.id],
      );
      recipients.push({
        userId: owner.id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        push: true,
        sms: false,
        telegram: tg.length > 0,
        chatIds: tg.map((t) => t.telegram_chat_id),
        canViewLocation: true,
      });
    }
  }

  for (const m of members) {
    if (m.status !== "active") continue;
    const tg = await db().query<{ telegram_chat_id: string }>(
      "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id = ? AND status = 'active'",
      [patient.id, m.user_id],
    );
    // Owner-level chat links (user_id null) may also belong to this family.
    const orphan = tg.length
      ? []
      : await db().query<{ telegram_chat_id: string }>(
          "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id IS NULL AND status = 'active'",
          [patient.id],
        );
    recipients.push({
      userId: m.user_id,
      name: m.user.name,
      email: m.user.email,
      phone: m.user.phone,
      push: Boolean(m.receive_push),
      sms: Boolean(m.receive_sms),
      telegram: Boolean(m.receive_telegram),
      chatIds: [...tg, ...orphan].map((t) => t.telegram_chat_id),
      canViewLocation: Boolean(m.can_view_location),
    });
  }

  // Org clinicians linked to the patient.
  if (patient.org_id) {
    const clinicians = await db().query<{ id: number; name: string; email: string; phone: string | null }>(
      `SELECT DISTINCT u.id, u.name, u.email, u.phone FROM users u
       LEFT JOIN clinician_assignments ca ON ca.clinician_id = u.id AND ca.patient_id = ?
       WHERE u.org_id = ? AND u.role IN ('doctor','nurse','admin') AND (ca.id IS NOT NULL OR u.role = 'admin')`,
      [patient.id, patient.org_id],
    );
    for (const c of clinicians) {
      if (recipients.some((r) => r.userId === c.id)) continue;
      const tg = await db().query<{ telegram_chat_id: string }>(
        "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id = ? AND status = 'active'",
        [patient.id, c.id],
      );
      recipients.push({
        userId: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        push: true,
        sms: channels.includes("sms"),
        telegram: true,
        chatIds: tg.map((t) => t.telegram_chat_id),
        canViewLocation: true,
      });
    }
  }

  return recipients;
}

function mapLink(level: string): "critical" | "warning" | "info" {
  if (level === "critical") return "critical";
  if (level === "warning") return "warning";
  return "info";
}

async function record(params: {
  alertId: number;
  patientId: number;
  userId: number | null;
  channel: string;
  recipient: string | null;
  status: string;
  ref?: string | null;
  error?: string | null;
}): Promise<void> {
  await db().run(
    `INSERT INTO notifications (alert_id, patient_id, user_id, channel, recipient, status, provider_ref, error,
      attempts, created_at, sent_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    [
      params.alertId,
      params.patientId,
      params.userId,
      params.channel,
      params.recipient,
      params.status,
      params.ref ?? null,
      params.error ?? null,
      nowIso(),
      params.status === "sent" ? nowIso() : null,
    ],
  );
}

/**
 * Fan an alert out to every configured channel.
 * Each delivery attempt is recorded so the Notification Center can show exactly
 * what was sent, to whom, and whether it succeeded.
 */
export async function dispatchAlert(input: DispatchInput): Promise<void> {
  const { patient, channels } = input;
  const recipients = await resolveRecipients(patient, channels);
  const thresholds = input.thresholds;
  const level = input.value !== null ? classify(input.value, thresholds) : null;
  const unit = patient.unit;
  const valueLabel = input.value !== null ? `${formatGlucose(input.value, unit)} ${unit}` : null;
  const timeLabel = stampTime(Date.now(), patient.timezone);
  const statusLabel = level ? LEVEL_META[level].label : input.kind === "missing-readings" ? "Data delayed" : "Attention needed";

  const locationUrl =
    patient.location_consent && patient.location_lat && patient.location_lon
      ? `https://maps.google.com/?q=${patient.location_lat.toFixed(5)},${patient.location_lon.toFixed(5)}`
      : null;

  const pushPayload = {
    title:
      input.escalation
        ? `Escalated alert — ${patient.display_name}`
        : level === "critical" || level === "low"
          ? `${level === "critical" ? "Critical low" : "Low glucose"} — ${patient.display_name}`
          : level === "high" || level === "very-high"
            ? `High glucose — ${patient.display_name}`
            : `Alert — ${patient.display_name}`,
    body: valueLabel ? `${valueLabel} · ${input.message}` : input.message,
    alertId: input.alertId,
    patientId: patient.id,
    kind: input.kind,
    level: input.level,
    url: `/dashboard?alert=${input.alertId}`,
    requireInteraction: input.level === "critical",
    silent: false,
    tag: `walhad-alert-${patient.id}`,
  };

  /* ------------------------------- in-app ------------------------------- */
  if (channels.includes("inapp") || channels.includes("audible")) {
    // In-app notifications are derived from the alerts table itself; we still
    // record one row per recipient so the Notification Center has an audit trail.
    for (const r of recipients) {
      await record({
        alertId: input.alertId,
        patientId: patient.id,
        userId: r.userId,
        channel: "inapp",
        recipient: r.email,
        status: "sent",
      });
    }
  }

  /* -------------------------------- push -------------------------------- */
  if (channels.includes("push") && pushConfigured()) {
    for (const r of recipients) {
      if (!r.push) continue;
      const subs = await db().query<{ endpoint: string; p256dh: string; auth: string }>(
        "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
        [r.userId],
      );
      if (!subs.length) {
        await record({
          alertId: input.alertId,
          patientId: patient.id,
          userId: r.userId,
          channel: "push",
          recipient: r.name,
          status: "skipped",
          error: "No push subscription registered",
        });
        continue;
      }
      for (const sub of subs) {
        const res = await sendWebPush(sub, pushPayload);
        await record({
          alertId: input.alertId,
          patientId: patient.id,
          userId: r.userId,
          channel: "push",
          recipient: sub.endpoint.slice(0, 120),
          status: res.ok ? "sent" : res.status === "not_configured" ? "skipped" : "failed",
          ref: res.ref,
          error: res.error,
        });
      }
    }
  } else if (channels.includes("push")) {
    await record({
      alertId: input.alertId,
      patientId: patient.id,
      userId: null,
      channel: "push",
      recipient: null,
      status: "skipped",
      error: pushConfigured() ? "No push recipients" : "VAPID keys not configured",
    });
  }

  /* -------------------------------- SMS --------------------------------- */
  if (channels.includes("sms")) {
    for (const r of recipients) {
      if (!r.sms) continue;
      if (!r.phone) {
        await record({
          alertId: input.alertId,
          patientId: patient.id,
          userId: r.userId,
          channel: "sms",
          recipient: r.name,
          status: "skipped",
          error: "Recipient has no phone number",
        });
        continue;
      }
      const body = `Walhad CareLink — ${patient.display_name}: ${valueLabel ?? ""} ${input.kind
        .replace(/-/g, " ")
        .toUpperCase()}. ${input.message}`.slice(0, 300);
      const res = await sendSms(r.phone, body);
      await record({
        alertId: input.alertId,
        patientId: patient.id,
        userId: r.userId,
        channel: "sms",
        recipient: r.phone,
        status: res.ok ? "sent" : res.status === "not_configured" ? "skipped" : "failed",
        ref: res.ref,
        error: res.error,
      });
      if (res.ok) await incrementSmsUsage(patient);
    }
  }

  /* ----------------------------- Telegram ------------------------------- */
  if (channels.includes("telegram")) {
    const text = formatAlert({
      alertId: input.alertId,
      kind: input.kind,
      patientName: patient.display_name,
      valueLabel,
      statusLabel,
      timeLabel,
      locationUrl,
      escalated: input.escalation,
    });
    const rows: InlineButton[][] = [
      [{ text: "✅ Acknowledge", callback_data: `ack:${input.alertId}` }],
      [{ text: "Latest glucose", callback_data: "glucose" }, { text: "Settings", callback_data: "settings" }],
    ];
    let anyTelegram = false;
    for (const r of recipients) {
      if (!r.telegram) continue;
      for (const chatId of r.chatIds) {
        anyTelegram = true;
        const res = await sendAlertMessage(chatId, text, rows);
        await record({
          alertId: input.alertId,
          patientId: patient.id,
          userId: r.userId,
          channel: "telegram",
          recipient: chatId,
          status: res.ok ? "sent" : "failed",
          ref: res.messageId ? String(res.messageId) : null,
          error: res.error,
        });
      }
    }
    if (!anyTelegram) {
      await record({
        alertId: input.alertId,
        patientId: patient.id,
        userId: null,
        channel: "telegram",
        recipient: null,
        status: "skipped",
        error: "No linked Telegram recipients",
      });
    }
  }

  /* --------------------------- audible flags ---------------------------- */
  if (channels.includes("audible")) {
    await record({
      alertId: input.alertId,
      patientId: patient.id,
      userId: null,
      channel: "audible",
      recipient: "Authorised devices",
      status: pushConfigured() ? "sent" : "queued",
      error: pushConfigured() ? null : "Ring alerts play in the open dashboard tab",
    });
  }
}

async function incrementSmsUsage(patient: PatientRow): Promise<void> {
  if (!patient.org_id && !patient.user_id) return;
  const sub = await db().get<{ id: number; sms_used: number }>(
    patient.org_id
      ? "SELECT id, sms_used FROM subscriptions WHERE org_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1"
      : "SELECT s.id, s.sms_used FROM subscriptions s WHERE s.patient_id = ? AND s.status = 'active' ORDER BY s.id DESC LIMIT 1",
    [patient.org_id ?? patient.id],
  );
  if (!sub) return;
  await db().run("UPDATE subscriptions SET sms_used = sms_used + 1, updated_at = ? WHERE id = ?", [nowIso(), sub.id]);
}

/* ---------------------------- manual test send ---------------------------- */

export async function sendChannelTest(input: {
  patientId: number;
  userId: number;
  channel: "telegram" | "sms" | "push";
}): Promise<{ ok: boolean; detail: string }> {
  const patient = await getPatient(input.patientId);
  if (!patient) return { ok: false, detail: "Patient not found" };
  const user = await getUser(input.userId);
  if (!user) return { ok: false, detail: "User not found" };
  const latest = await latestReading(patient.id);
  const value = latest ? `${formatGlucose(latest.value, patient.unit)} ${patient.unit}` : "no reading yet";

  if (input.channel === "telegram") {
    const links = await db().query<{ telegram_chat_id: string }>(
      "SELECT telegram_chat_id FROM telegram_links WHERE patient_id = ? AND user_id = ? AND status = 'active'",
      [patient.id, input.userId],
    );
    if (!links.length) return { ok: false, detail: "This account has no linked Telegram chat yet." };
    let ok = 0;
    for (const l of links) {
      const res = await sendAlertMessage(
        l.telegram_chat_id,
        [
          "🔔 TEST NOTIFICATION — Walhad CareLink",
          "",
          `Patient: ${patient.display_name}`,
          `Latest glucose: ${value}`,
          `Sent: ${stampTime(Date.now(), patient.timezone)}`,
          "",
          "This is a test. Real alerts will look like this.",
        ].join("\n"),
      );
      if (res.ok) ok++;
    }
    return ok ? { ok: true, detail: `Test sent to ${ok} Telegram chat(s).` } : { ok: false, detail: "Telegram rejected the message." };
  }

  if (input.channel === "sms") {
    if (!user.phone) return { ok: false, detail: "Add a mobile number in Settings first." };
    if (!smsConfigured()) return { ok: false, detail: "SMS provider is not configured on this deployment." };
    const res = await sendSms(
      user.phone,
      `Walhad CareLink test — ${patient.display_name}: ${value}. This is a test message.`,
    );
    return res.ok
      ? { ok: true, detail: "Test SMS sent." }
      : { ok: false, detail: res.error ?? "SMS failed." };
  }

  const subs = await db().query<{ endpoint: string; p256dh: string; auth: string }>(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    [user.id],
  );
  if (!subs.length) return { ok: false, detail: "No browser push subscription on this device." };
  if (!pushConfigured()) return { ok: false, detail: "Push (VAPID) keys are not configured on this deployment." };
  const res = await sendWebPush(subs[0], {
    title: "Walhad CareLink test",
    body: `${patient.display_name}: ${value}`,
    url: "/dashboard",
  });
  return res.ok ? { ok: true, detail: "Test push sent." } : { ok: false, detail: res.error ?? "Push failed." };
}

export { patientThresholds, deriveTrend, TREND_META };
