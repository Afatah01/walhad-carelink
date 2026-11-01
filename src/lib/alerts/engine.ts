import { db } from "../db/client";
import { J, PJ, nowIso, num } from "../db/repo-util";
import { patientThresholds, type PatientRow } from "../db/repo";
import { latestReading, recentReadings } from "../db/repo-glucose";
import { classify, deriveTrend, formatGlucose, TREND_META } from "../glucose";
import { ALERT_KIND_META, rulesFor, type AlertKind, type AlertRule } from "./rules";
import { dispatchAlert, type DispatchChannel } from "../notify/dispatch";

export interface AlertRow {
  id: number;
  patient_id: number;
  rule_id: number | null;
  kind: AlertKind;
  level: "critical" | "warning" | "info";
  value: number | null;
  threshold: number | null;
  message: string | null;
  status: "open" | "acknowledged" | "resolved" | "escalated";
  triggered_at: string;
  escalated_at: string | null;
  resolved_at: string | null;
  acknowledged_by: number | null;
  acknowledged_at: string | null;
  acknowledge_note: string | null;
  location_lat: number | null;
  location_lon: number | null;
  channels_json: unknown;
  created_at: string;
}

function withinCooldown(lastIso: string | null, minutes: number): boolean {
  if (!lastIso) return false;
  return Date.now() - new Date(lastIso).getTime() < minutes * 60_000;
}

async function lastAlert(patientId: number, kind: AlertKind): Promise<AlertRow | null> {
  return db().get<AlertRow>(
    "SELECT * FROM alerts WHERE patient_id = ? AND kind = ? ORDER BY triggered_at DESC LIMIT 1",
    [patientId, kind],
  );
}

function buildMessage(kind: AlertKind, patientName: string, value: number | null, unit: "mg/dL" | "mmol/L") {
  const v = value === null ? "" : formatGlucose(value, unit);
  const u = unit === "mmol/L" ? "mmol/L" : "mg/dL";
  switch (kind) {
    case "very-low":
      return `${patientName}'s glucose is critically low at ${v} ${u}. Please contact them now and follow the care plan.`;
    case "low":
      return `${patientName}'s glucose is low at ${v} ${u}. Please check in and follow the care plan.`;
    case "high":
      return `${patientName}'s glucose is high at ${v} ${u}. A gentle check-in is recommended.`;
    case "very-high":
      return `${patientName}'s glucose is very high at ${v} ${u}. Please contact them.`;
    case "rapid-change":
      return `${patientName}'s glucose is changing quickly (${v} ${u}).`;
    case "missing-readings":
      return `No new glucose readings have arrived from ${patientName}'s sensor for a while. Please check the sensor or phone connection.`;
    case "sensor-disconnect":
      return `${patientName}'s sensor sync looks interrupted. Data may be delayed.`;
    case "emergency":
      return `${patientName} has requested emergency assistance through Walhad CareLink. Please contact them immediately.`;
  }
}

export interface EvaluateResult {
  triggered: { kind: AlertKind; alertId: number }[];
  resolved: number;
  skipped: { kind: AlertKind; reason: string }[];
}

/**
 * Evaluate one patient's rules against the latest data and raise alerts.
 * Idempotent: cooldowns plus open-alert de-duplication prevent alert storms.
 */
export async function evaluatePatient(patient: PatientRow): Promise<EvaluateResult> {
  const result: EvaluateResult = { triggered: [], resolved: 0, skipped: [] };
  const thresholds = await patientThresholds(patient);
  const rules = await rulesFor(patient);
  const latest = await latestReading(patient.id);
  const now = Date.now();

  if (!latest) {
    result.skipped.push({ kind: "low", reason: "no readings yet" });
    return result;
  }

  const ageMin = (now - latest.takenAt) / 60_000;
  const level = classify(latest.value, thresholds);

  const openAlerts = await db().query<AlertRow>(
    "SELECT * FROM alerts WHERE patient_id = ? AND status IN ('open','escalated')",
    [patient.id],
  );

  const activate = async (kind: AlertKind, value: number | null, threshold: number | null, severity = "warning") => {
    const rule = rules.find((r) => r.kind === kind);
    if (!rule || !rule.enabled) {
      result.skipped.push({ kind, reason: "rule disabled" });
      return null;
    }
    const alreadyOpen = openAlerts.find((a) => a.kind === kind);
    if (alreadyOpen) {
      result.skipped.push({ kind, reason: "alert already open" });
      return null;
    }
    const last = await lastAlert(patient.id, kind);
    if (last && withinCooldown(last.triggered_at, rule.cooldown_minutes)) {
      result.skipped.push({ kind, reason: "cooldown" });
      return null;
    }
    return createAlert(patient, rule, kind, value ?? threshold, threshold, severity, thresholds);
  };

  const closeAlerts = async (kinds: AlertKind[]) => {
    for (const kind of kinds) {
      const open = openAlerts.find((a) => a.kind === kind && (a.status === "open" || a.status === "escalated"));
      if (!open) continue;
      await db().run("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?", [nowIso(), open.id]);
      result.resolved++;
    }
  };

  /* -------- low / critical-low -------- */
  const lowRule = rules.find((r) => r.kind === "low");
  const veryLowRule = rules.find((r) => r.kind === "very-low");
  const lowThreshold = veryLowRule?.threshold ?? thresholds.veryLow;

  if (ageMin <= 20) {
    if (level === "critical" && latest.value < lowThreshold) {
      const id = await activate("very-low", latest.value, lowThreshold, "critical");
      if (id) result.triggered.push({ kind: "very-low", alertId: id });
    } else if (level === "low") {
      // Respect "sustained" configuration on the low rule.
      const sustained = lowRule?.sustained_minutes ?? 0;
      let qualifies = true;
      if (sustained > 0) {
        const window = await recentReadings(patient.id, 60);
        const since = now - sustained * 60_000;
        const inWindow = window.filter((r) => r.takenAt >= since);
        qualifies = inWindow.length > 0 && inWindow.every((r) => r.value < (lowRule?.threshold ?? thresholds.low));
      }
      if (qualifies) {
        const id = await activate("low", latest.value, lowRule?.threshold ?? thresholds.low, "warning");
        if (id) result.triggered.push({ kind: "low", alertId: id });
      }
    } else {
      await closeAlerts(["low", "very-low"]);
    }

    /* -------- high / very high -------- */
    if (level === "very-high") {
      const id = await activate("very-high", latest.value, thresholds.veryHigh, "critical");
      if (id) result.triggered.push({ kind: "very-high", alertId: id });
    } else if (level === "high") {
      const rule = rules.find((r) => r.kind === "high");
      const sustained = rule?.sustained_minutes ?? 0;
      let qualifies = sustained === 0;
      if (sustained > 0) {
        const window = await recentReadings(patient.id, 80);
        const since = now - sustained * 60_000;
        const inWindow = window.filter((r) => r.takenAt >= since);
        qualifies = inWindow.length > 0 && inWindow.every((r) => r.value > (rule?.threshold ?? thresholds.high));
      }
      if (qualifies) {
        const id = await activate("high", latest.value, rule?.threshold ?? thresholds.high, "warning");
        if (id) result.triggered.push({ kind: "high", alertId: id });
      }
    } else if (level === "in-range") {
      await closeAlerts(["high", "very-high"]);
    }

    /* -------- rapid change -------- */
    const rapidRule = rules.find((r) => r.kind === "rapid-change");
    if (rapidRule?.enabled) {
      const pts = await recentReadings(patient.id, 8);
      const trend = deriveTrend(pts.map((p) => ({ value: p.value, takenAt: p.takenAt })));
      if (trend === "rapid-rise" || trend === "rapid-fall") {
        const id = await activate("rapid-change", latest.value, null, "warning");
        if (id) result.triggered.push({ kind: "rapid-change", alertId: id });
      }
    }
  }

  /* -------- data freshness -------- */
  const missingRule = rules.find((r) => r.kind === "missing-readings");
  if (missingRule?.enabled && missingRule.threshold) {
    if (ageMin > missingRule.threshold) {
      const id = await activate("missing-readings", null, missingRule.threshold, "warning");
      if (id) result.triggered.push({ kind: "missing-readings", alertId: id });
    } else {
      await closeAlerts(["missing-readings", "sensor-disconnect"]);
    }
  }
  const sensorRule = rules.find((r) => r.kind === "sensor-disconnect");
  if (sensorRule?.enabled && sensorRule.threshold && ageMin > sensorRule.threshold) {
    const id = await activate("sensor-disconnect", null, sensorRule.threshold, "info");
    if (id) result.triggered.push({ kind: "sensor-disconnect", alertId: id });
  }

  return result;
}

async function createAlert(
  patient: PatientRow,
  rule: AlertRule,
  kind: AlertKind,
  value: number | null,
  threshold: number | null,
  severity: string,
  thresholds: { veryLow: number; low: number; high: number; veryHigh: number },
): Promise<number> {
  const meta = ALERT_KIND_META[kind];
  const level =
    kind === "very-low" || kind === "emergency" || severity === "critical"
      ? "critical"
      : (meta.level as "critical" | "warning" | "info");
  const message = buildMessage(kind, patient.display_name, value, patient.unit);

  const row = await db().get<{ id: number }>(
    `INSERT INTO alerts (patient_id, rule_id, kind, level, value, threshold, message, status, triggered_at,
      location_lat, location_lon, channels_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?, ?)`,
    [
      patient.id,
      rule.id,
      kind,
      level,
      value,
      threshold,
      message,
      nowIso(),
      patient.location_consent ? patient.location_lat : null,
      patient.location_consent ? patient.location_lon : null,
      J(rule.channels),
      nowIso(),
    ],
  );

  const id = row?.id ?? 0;
  const channels = rule.channels as DispatchChannel[];

  // Fire-and-forget delivery; failures are recorded per channel.
  dispatchAlert({
    alertId: id,
    patient,
    kind,
    level,
    value,
    message,
    channels,
    thresholds,
    escalateAfterMinutes: rule.escalate_after_minutes,
  }).catch(async (err) => {
    await db().run(
      "UPDATE alerts SET status = 'open' WHERE id = ?",
      [id],
    ).catch(() => {});
    console.error("[alert dispatch]", err);
  });

  return id;
}

export async function acknowledgeAlert(input: {
  alertId: number;
  userId: number;
  note?: string;
}): Promise<boolean> {
  const alert = await db().get<AlertRow>("SELECT * FROM alerts WHERE id = ?", [input.alertId]);
  if (!alert) return false;
  if (alert.status === "resolved") return false;
  await db().run(
    `UPDATE alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ?, acknowledge_note = ?
     WHERE id = ?`,
    [input.userId, nowIso(), input.note ?? null, input.alertId],
  );
  await db().run(
    "UPDATE notifications SET acknowledged_at = ? WHERE alert_id = ? AND acknowledged_at IS NULL",
    [nowIso(), input.alertId],
  );
  return true;
}

export async function resolveAlert(alertId: number): Promise<void> {
  await db().run("UPDATE alerts SET status = 'resolved', resolved_at = ? WHERE id = ?", [nowIso(), alertId]);
}

export async function openAlertsFor(patientId: number): Promise<AlertRow[]> {
  return db().query<AlertRow>(
    "SELECT * FROM alerts WHERE patient_id = ? AND status IN ('open','escalated') ORDER BY triggered_at DESC",
    [patientId],
  );
}

export async function alertsFor(patientId: number, limit = 30): Promise<AlertRow[]> {
  return db().query<AlertRow>(
    "SELECT * FROM alerts WHERE patient_id = ? ORDER BY triggered_at DESC LIMIT ?",
    [patientId, limit],
  );
}

export async function orgAlerts(orgId: number, limit = 30): Promise<(AlertRow & { patient_name: string })[]> {
  return db().query<any>(
    `SELECT a.*, p.display_name AS patient_name FROM alerts a
     JOIN patients p ON p.id = a.patient_id
     WHERE p.org_id = ? ORDER BY a.triggered_at DESC LIMIT ?`,
    [orgId, limit],
  );
}

/** Escalation sweep — called by the scheduler. */
export async function escalateStaleAlerts(): Promise<number> {
  const rows = await db().query<any>(
    `SELECT a.*, r.escalate_after_minutes FROM alerts a
     JOIN alert_rules r ON r.id = a.rule_id
     WHERE a.status = 'open' AND r.escalate_after_minutes > 0`,
  );
  let escalated = 0;
  for (const row of rows) {
    const ageMin = (Date.now() - new Date(row.triggered_at).getTime()) / 60_000;
    if (ageMin < num(row.escalate_after_minutes)) continue;
    await db().run("UPDATE alerts SET status = 'escalated', escalated_at = ? WHERE id = ?", [nowIso(), row.id]);
    await db().run("UPDATE notifications SET attempts = attempts WHERE alert_id = ?", [row.id]);
    const patient = await db().get<PatientRow>("SELECT * FROM patients WHERE id = ?", [row.patient_id]);
    if (patient) {
      await dispatchAlert({
        alertId: row.id,
        patient,
        kind: row.kind,
        level: row.level,
        value: row.value,
        message: `ESCALATED — no acknowledgement yet. ${row.message ?? ""}`,
        channels: ["push", "sms", "telegram", "audible"],
        thresholds: await patientThresholds(patient),
        escalateAfterMinutes: 0,
        escalation: true,
      }).catch(() => {});
    }
    escalated++;
  }
  return escalated;
}

export function alertValueLabel(alert: AlertRow, unit: "mg/dL" | "mmol/L"): string {
  if (alert.value === null) return "—";
  return `${formatGlucose(alert.value, unit)} ${unit === "mmol/L" ? "mmol/L" : "mg/dL"}`;
}

export { TREND_META, PJ };
