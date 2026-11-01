import { db } from "../db/client";
import { nowIso, num, bool } from "../db/repo-util";
import {
  getPatient,
  getUser,
  patientThresholds,
  type PatientRow,
} from "../db/repo";
import { latestReading, recentReadings } from "../db/repo-glucose";
import { acknowledgeAlert, alertsFor } from "../alerts/engine";
import { classify, convert, formatGlucose, LEVEL_META, relativeTime, stampTime, TREND_META, deriveTrend } from "../glucose";
import { maskEmail, randomToken } from "../crypto";
import {
  chatLabel,
  sendMessage,
  answerCallbackQuery,
  type TgMessage,
  type TgUpdate,
  type InlineButton,
} from "./telegram";

export interface LinkRow {
  id: number;
  user_id: number | null;
  patient_id: number;
  telegram_chat_id: string;
  telegram_username: string | null;
  telegram_display_name: string | null;
  status: string;
  verify_code: string | null;
  notify_low: number;
  notify_high: number;
  notify_critical: number;
  notify_status: number;
  notify_emergency: number;
  notify_trend: number;
  linked_at: string | null;
  created_at: string;
}

export async function activeLinksForChat(chatId: string): Promise<LinkRow[]> {
  return db().query<LinkRow>(
    "SELECT * FROM telegram_links WHERE telegram_chat_id = ? AND status = 'active' ORDER BY id ASC",
    [chatId],
  );
}

export async function linksForPatient(patientId: number): Promise<LinkRow[]> {
  return db().query<LinkRow>(
    "SELECT * FROM telegram_links WHERE patient_id = ? ORDER BY created_at ASC",
    [patientId],
  );
}

/* ------------------------------ linking flow ------------------------------ */

export async function createLinkToken(input: {
  patientId: number;
  userId: number;
  ttlMinutes?: number;
}): Promise<string> {
  
  const token = randomToken(18);
  await db().run(
    `INSERT INTO telegram_link_tokens (token, patient_id, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [
      token,
      input.patientId,
      input.userId,
      nowIso(Date.now() + (input.ttlMinutes ?? 20) * 60_000),
      nowIso(),
    ],
  );
  return token;
}

export async function consumeLinkToken(token: string): Promise<{ patientId: number; userId: number } | null> {
  const row = await db().get<{ id: number; patient_id: number; user_id: number; expires_at: string; used_at: string | null }>(
    "SELECT * FROM telegram_link_tokens WHERE token = ?",
    [token],
  );
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) return null;
  await db().run("UPDATE telegram_link_tokens SET used_at = ? WHERE id = ?", [nowIso(), row.id]);
  return { patientId: row.patient_id, userId: row.user_id };
}

export async function upsertLink(input: {
  patientId: number;
  userId: number | null;
  chatId: string;
  username?: string | null;
  displayName?: string | null;
}): Promise<void> {
  const existing = await db().get<LinkRow>(
    "SELECT * FROM telegram_links WHERE patient_id = ? AND telegram_chat_id = ?",
    [input.patientId, input.chatId],
  );
  if (existing) {
    await db().run(
      `UPDATE telegram_links SET status = 'active', user_id = ?, telegram_username = ?, telegram_display_name = ?,
        linked_at = ? WHERE id = ?`,
      [input.userId ?? existing.user_id, input.username ?? null, input.displayName ?? null, nowIso(), existing.id],
    );
    return;
  }
  await db().run(
    `INSERT INTO telegram_links (user_id, patient_id, telegram_chat_id, telegram_username, telegram_display_name,
      status, notify_low, notify_high, notify_critical, notify_status, notify_emergency, notify_trend, linked_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', 1, 1, 1, 1, 1, 0, ?, ?)`,
    [input.userId, input.patientId, input.chatId, input.username ?? null, input.displayName ?? null, nowIso(), nowIso()],
  );
}

async function resolveLink(chatId: string, patientId?: number): Promise<LinkRow | null> {
  const links = await activeLinksForChat(chatId);
  if (!links.length) return null;
  if (patientId) return links.find((l) => l.patient_id === patientId) ?? null;
  return links[0];
}

/** Verify the Telegram user is still an authorised viewer for the patient. */
async function verifyAccess(chatId: string, patientId: number): Promise<boolean> {
  const link = await db().get<LinkRow>(
    "SELECT * FROM telegram_links WHERE telegram_chat_id = ? AND patient_id = ? AND status = 'active'",
    [chatId, patientId],
  );
  if (!link) return false;
  const patient = await getPatient(patientId);
  if (!patient || patient.status === "archived") return false;
  if (!link.user_id) return true; // owner-level link created during pairing
  const linkUser = await getUser(link.user_id);
  if (!linkUser) return false;
  if (patient.user_id === linkUser.id) return true;
  const member = await db().get<{ status: string }>(
    "SELECT status FROM patient_members WHERE patient_id = ? AND user_id = ? AND status = 'active'",
    [patientId, linkUser.id],
  );
  return Boolean(member);
}

/* --------------------------------- commands -------------------------------- */

const HELP = [
  "Walhad CareLink — Telegram commands",
  "",
  "/status — connection and notification status",
  "/glucose — latest authorised glucose reading",
  "/history — recent readings",
  "/alerts — recent alerts and acknowledgements",
  "/settings — notification preferences",
  "/acknowledge — acknowledge the most recent open alert",
  "/disconnect — stop Telegram notifications",
  "/help — show this message",
  "",
  "Alerts are informational and are not a substitute for emergency services.",
].join("\n");

function trendLabel(trend: ReturnType<typeof deriveTrend>): string {
  return TREND_META[trend].label;
}

async function patientSummary(patient: PatientRow): Promise<string> {
  const latest = await latestReading(patient.id);
  const thresholds = await patientThresholds(patient);
  if (!latest) return `Patient: ${patient.display_name}\nNo readings have been received yet.`;
  const level = classify(latest.value, thresholds);
  const meta = LEVEL_META[level];
  const unit = patient.unit;
  const trend = deriveTrend([{ value: latest.value, takenAt: latest.takenAt }]);
  const age = relativeTime(latest.takenAt);
  return [
    `${patient.display_name}`,
    `Glucose: ${formatGlucose(latest.value, unit)} ${unit}  •  ${meta.label.toUpperCase()}`,
    `Trend: ${trendLabel(trend)}`,
    `Reading time: ${stampTime(latest.takenAt, patient.timezone)} (${age})`,
  ].join("\n");
}

export async function handleUpdate(update: TgUpdate): Promise<void> {
  if (update.callback_query) {
    await handleCallback(update.callback_query);
    return;
  }
  const msg: TgMessage | undefined = update.message ?? update.edited_message;
  if (!msg?.text) return;
  const chatId = String(msg.chat.id);
  const raw = msg.text.trim();
  const [commandRaw, ...args] = raw.split(/\s+/);
  const command = commandRaw.toLowerCase().replace(/@[\w_]+$/, "");

  try {
    switch (command) {
      case "/start":
        await handleStart(msg, args[0]);
        return;
      case "/help":
      case "help":
        await sendMessage(chatId, HELP);
        return;
      case "/status":
        await handleStatus(chatId);
        return;
      case "/glucose":
        await handleGlucose(chatId, args[0]);
        return;
      case "/history":
        await handleHistory(chatId);
        return;
      case "/alerts":
        await handleAlerts(chatId);
        return;
      case "/settings":
        await handleSettings(chatId);
        return;
      case "/acknowledge":
        await handleAcknowledge(chatId);
        return;
      case "/disconnect":
        await handleDisconnect(chatId);
        return;
      default:
        await sendMessage(
          chatId,
          `I didn't recognise that command.\n\nSend /help to see everything I can do.\n\nTip: connect your account from the Walhad CareLink dashboard to receive glucose alerts here.`,
          { buttons: [[{ text: "Open help", callback_data: "help" }]] },
        );
    }
  } catch (err) {
    console.error("[telegram] command failed", command, err instanceof Error ? err.message : err);
    await sendMessage(chatId, "Something went wrong on our side. Please try again in a moment.");
  }
}

async function handleStart(msg: TgMessage, token?: string) {
  const chatId = String(msg.chat.id);
  const username = msg.from?.username ?? null;
  const display = chatLabel(msg);

  if (token) {
    const consumed = await consumeLinkToken(token);
    if (!consumed) {
      await sendMessage(
        chatId,
        "This connection link has expired or was already used.\n\nOpen your Walhad CareLink dashboard and generate a fresh Telegram link.",
      );
      return;
    }
    const patient = await getPatient(consumed.patientId);
    if (!patient) {
      await sendMessage(chatId, "That patient profile is no longer available.");
      return;
    }
    await upsertLink({
      patientId: patient.id,
      userId: consumed.userId,
      chatId,
      username,
      displayName: display,
    });
    await sendMessage(
      chatId,
      [
        "✅ Connected to Walhad CareLink",
        "",
        `You will now receive glucose alerts for ${patient.display_name}.`,
        "Notifications here are informational. In an emergency, contact the patient and local emergency services.",
        "",
        "Useful commands:",
        "/glucose — latest reading",
        "/status — connection status",
        "/settings — notification preferences",
        "/help — all commands",
      ].join("\n"),
      {
        buttons: [
          [{ text: "Latest glucose", callback_data: "glucose" }, { text: "Settings", callback_data: "settings" }],
        ],
      },
    );
    return;
  }

  const links = await activeLinksForChat(chatId);
  if (links.length) {
    const names = await Promise.all(links.map(async (l) => (await getPatient(l.patient_id))?.display_name ?? "Patient"));
    await sendMessage(
      chatId,
      `Welcome back to Walhad CareLink.\n\nThis Telegram account is linked to: ${names.join(", ")}.\n\nUse /glucose for the latest reading or /help for all commands.`,
    );
    return;
  }

  await sendMessage(
    chatId,
    [
      "👋 Welcome to Walhad CareLink",
      "",
      "This bot sends glucose alerts to authorised family members and caregivers.",
      "",
      "To connect this Telegram account:",
      "1. Sign in to your Walhad CareLink dashboard.",
      "2. Open Telegram notifications in the sidebar.",
      "3. Tap “Connect Telegram” and open the link it gives you.",
      "",
      "For your privacy, readings are only shared for patients you are authorised to view.",
    ].join("\n"),
  );
}

async function handleStatus(chatId: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not linked yet. Use the dashboard to generate a connection link.");
    return;
  }
  const lines = ["🔗 Telegram connection status", ""];
  for (const link of links) {
    const patient = await getPatient(link.patient_id);
    if (!patient) continue;
    const allowed = await verifyAccess(chatId, link.patient_id);
    lines.push(`Patient: ${patient.display_name}`);
    lines.push(`Linked: ${allowed ? "✅ active" : "⚠️ no longer authorised"}`);
    lines.push(
      `Notifications: low ${onOff(link.notify_low)} · high ${onOff(link.notify_high)} · critical ${onOff(
        link.notify_critical,
      )} · status ${onOff(link.notify_status)}`,
    );
    lines.push("");
  }
  lines.push("Toggle preferences with /settings.");
  await sendMessage(chatId, lines.join("\n"));
}

const onOff = (v: number | boolean) => (bool(v) ? "on" : "off");

async function handleGlucose(chatId: string, patientArg?: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not linked to any patient yet.");
    return;
  }
  const lines: string[] = [];
  for (const link of links) {
    if (patientArg && String(link.patient_id) !== patientArg) continue;
    if (!(await verifyAccess(chatId, link.patient_id))) continue;
    const patient = await getPatient(link.patient_id);
    if (!patient) continue;
    lines.push(await patientSummary(patient));
    lines.push("");
  }
  if (!lines.length) {
    await sendMessage(chatId, "No authorised patient data available for this Telegram account.");
    return;
  }
  await sendMessage(chatId, lines.join("\n").trim());
}

async function handleHistory(chatId: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not linked to any patient yet.");
    return;
  }
  for (const link of links) {
    if (!(await verifyAccess(chatId, link.patient_id))) continue;
    const patient = await getPatient(link.patient_id);
    if (!patient) continue;
    const readings = (await recentReadings(patient.id, 12)).slice(-10);
    const thresholds = await patientThresholds(patient);
    const lines = [`📈 Recent readings — ${patient.display_name}`, ""];
    for (const r of readings.reverse()) {
      const level = classify(r.value, thresholds);
      lines.push(
        `${stampTime(r.takenAt, patient.timezone)}   ${formatGlucose(r.value, patient.unit)} ${patient.unit}   ${LEVEL_META[level].short}`,
      );
    }
    lines.push("");
    lines.push("Use the dashboard for full 24-hour, weekly and 90-day charts.");
    await sendMessage(chatId, lines.join("\n"));
  }
}

async function handleAlerts(chatId: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not linked to any patient yet.");
    return;
  }
  for (const link of links) {
    if (!(await verifyAccess(chatId, link.patient_id))) continue;
    const patient = await getPatient(link.patient_id);
    if (!patient) continue;
    const alerts = (await alertsFor(patient.id, 6)) ?? [];
    if (!alerts.length) {
      await sendMessage(chatId, `No alerts recorded for ${patient.display_name}.`);
      continue;
    }
    const lines = [`🔔 Recent alerts — ${patient.display_name}`, ""];
    for (const a of alerts) {
      const status = a.status.toUpperCase();
      const value = a.value ? ` · ${formatGlucose(a.value, patient.unit)} ${patient.unit}` : "";
      lines.push(`${stampTime(new Date(a.triggered_at).getTime(), patient.timezone)} — ${a.kind.toUpperCase()}${value}`);
      lines.push(`   ${status}`);
    }
    await sendMessage(chatId, lines.join("\n"));
  }
}

async function settingsKeyboard(chatId: string): Promise<InlineButton[][]> {
  const links = await activeLinksForChat(chatId);
  const link = links[0];
  if (!link) return [];
  const mk = (key: string, label: string, value: number) => ({
    text: `${onOff(value) === "on" ? "✅" : "⭕"} ${label}`,
    callback_data: `toggle:${link.patient_id}:${key}`,
  });
  return [
    [mk("low", "Low alerts", link.notify_low), mk("high", "High alerts", link.notify_high)],
    [mk("critical", "Critical alerts", link.notify_critical), mk("status", "Sync warnings", link.notify_status)],
    [mk("emergency", "Emergency requests", link.notify_emergency), mk("trend", "Trend notes", link.notify_trend)],
    [{ text: "↩︎ Refresh", callback_data: "settings" }],
  ];
}

async function handleSettings(chatId: string) {
  const rows = await settingsKeyboard(chatId);
  if (!rows.length) {
    await sendMessage(chatId, "This Telegram account is not linked to any patient yet.");
    return;
  }
  await sendMessage(
    chatId,
    ["⚙️ Telegram notification preferences", "", "Tap a channel to switch it on or off for this chat."].join("\n"),
    { buttons: rows },
  );
}

async function handleCallback(cb: NonNullable<TgUpdate["callback_query"]>) {
  const chatId = String(cb.message?.chat.id ?? cb.from.id);
  const data = cb.data ?? "";
  try {
    if (data === "help") {
      await answerCallbackQuery(cb.id);
      await sendMessage(chatId, HELP);
      return;
    }
    if (data === "glucose") {
      await answerCallbackQuery(cb.id);
      await handleGlucose(chatId);
      return;
    }
    if (data === "settings") {
      await answerCallbackQuery(cb.id);
      await handleSettings(chatId);
      return;
    }
    if (data.startsWith("ack:")) {
      const alertId = Number(data.split(":")[1]);
      const ok = await acknowledgeFromTelegram(chatId, alertId);
      await answerCallbackQuery(cb.id, ok ? "Alert acknowledged" : "Could not acknowledge");
      if (ok) await sendMessage(chatId, `✅ Alert #${alertId} acknowledged. Thank you — please also contact the patient.`);
      return;
    }
    if (data.startsWith("toggle:")) {
      const [, patientIdRaw, key] = data.split(":");
      const patientId = Number(patientIdRaw);
      const allowedKeys = ["low", "high", "critical", "status", "emergency", "trend"];
      if (!allowedKeys.includes(key) || !(await verifyAccess(chatId, patientId))) {
        await answerCallbackQuery(cb.id, "Not authorised");
        return;
      }
      const link = await resolveLink(chatId, patientId);
      if (!link) {
        await answerCallbackQuery(cb.id, "Not linked");
        return;
      }
      const column = `notify_${key}`;
      const next = bool((link as any)[column]) ? 0 : 1;
      await db().run(`UPDATE telegram_links SET ${column} = ? WHERE id = ?`, [next, link.id]);
      await answerCallbackQuery(cb.id, next ? "Enabled" : "Disabled");
      const rows = await settingsKeyboard(chatId);
      if (cb.message) {
        await sendMessage(chatId, "Preferences updated.", { buttons: rows });
      }
      return;
    }
    await answerCallbackQuery(cb.id);
  } catch (err) {
    console.error("[telegram] callback failed", err instanceof Error ? err.message : err);
    await answerCallbackQuery(cb.id, "Something went wrong");
  }
}

export async function acknowledgeFromTelegram(chatId: string, alertId: number): Promise<boolean> {
  const alert = await db().get<{ id: number; patient_id: number }>("SELECT id, patient_id FROM alerts WHERE id = ?", [
    alertId,
  ]);
  if (!alert) return false;
  const link = await db().get<LinkRow>(
    "SELECT * FROM telegram_links WHERE telegram_chat_id = ? AND patient_id = ? AND status = 'active'",
    [chatId, alert.patient_id],
  );
  if (!link) return false;
  if (!(await verifyAccess(chatId, alert.patient_id))) return false;
  
  return acknowledgeAlert({
    alertId,
    userId: link.user_id ?? 0,
    note: "Acknowledged via Telegram",
  });
}

async function handleAcknowledge(chatId: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not linked to any patient yet.");
    return;
  }
  const candidates: { alert: any; patient: PatientRow }[] = [];
  for (const link of links) {
    if (!(await verifyAccess(chatId, link.patient_id))) continue;
    const patient = await getPatient(link.patient_id);
    if (!patient) continue;
    const alerts = await alertsFor(patient.id, 5);
    const open = alerts.find((a) => a.status === "open" || a.status === "escalated");
    if (open) candidates.push({ alert: open, patient });
  }
  if (!candidates.length) {
    await sendMessage(chatId, "There are no open alerts to acknowledge. Thank you for checking.");
    return;
  }
  for (const { alert, patient } of candidates) {
    const ok = await acknowledgeFromTelegram(chatId, alert.id);
    if (ok) {
      await sendMessage(
        chatId,
        `✅ Acknowledged alert #${alert.id} for ${patient.display_name}.\n\nPlease also contact the patient and follow their care plan.`,
      );
    }
  }
}

async function handleDisconnect(chatId: string) {
  const links = await activeLinksForChat(chatId);
  if (!links.length) {
    await sendMessage(chatId, "This Telegram account is not currently linked.");
    return;
  }
  await db().run("UPDATE telegram_links SET status = 'disconnected' WHERE telegram_chat_id = ?", [chatId]);
  await sendMessage(
    chatId,
    "Telegram notifications have been disconnected for this chat.\n\nYou can reconnect any time from your Walhad CareLink dashboard.",
  );
}

export async function disconnectLink(linkId: number): Promise<void> {
  await db().run("UPDATE telegram_links SET status = 'disconnected' WHERE id = ?", [linkId]);
}

export async function sendTestNotification(chatId: string, patient: PatientRow): Promise<{ ok: boolean; error?: string }> {
  const latest = await latestReading(patient.id);
  const value = latest ? `${formatGlucose(latest.value, patient.unit)} ${patient.unit}` : "no reading yet";
  const res = await sendMessage(
    chatId,
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
  return res.ok ? { ok: true } : { ok: false, error: res.description };
}

export { formatGlucose, convert, maskEmail, num };
