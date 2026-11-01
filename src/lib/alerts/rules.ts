import { db } from "../db/client";
import { J, PJ, nowIso, num, bool } from "../db/repo-util";
import type { PatientRow } from "../db/repo";

export type AlertKind =
  | "very-low"
  | "low"
  | "high"
  | "very-high"
  | "rapid-change"
  | "missing-readings"
  | "sensor-disconnect"
  | "emergency";

export interface AlertRule {
  id: number;
  patient_id: number;
  kind: AlertKind;
  enabled: boolean;
  threshold: number | null;
  sustained_minutes: number;
  cooldown_minutes: number;
  escalate_after_minutes: number;
  channels: string[];
  label: string | null;
}

export const DEFAULT_RULES: Omit<AlertRule, "id" | "patient_id">[] = [
  {
    kind: "very-low",
    enabled: true,
    threshold: 54,
    sustained_minutes: 0,
    cooldown_minutes: 15,
    escalate_after_minutes: 5,
    channels: ["push", "sms", "telegram", "audible", "inapp"],
    label: "Critical low glucose",
  },
  {
    kind: "low",
    enabled: true,
    threshold: 70,
    sustained_minutes: 0,
    cooldown_minutes: 30,
    escalate_after_minutes: 10,
    channels: ["push", "telegram", "audible", "inapp"],
    label: "Low glucose",
  },
  {
    kind: "high",
    enabled: true,
    threshold: 180,
    sustained_minutes: 15,
    cooldown_minutes: 60,
    escalate_after_minutes: 0,
    channels: ["push", "telegram", "inapp"],
    label: "High glucose",
  },
  {
    kind: "very-high",
    enabled: true,
    threshold: 250,
    sustained_minutes: 15,
    cooldown_minutes: 60,
    escalate_after_minutes: 0,
    channels: ["push", "telegram", "inapp"],
    label: "Very high glucose",
  },
  {
    kind: "rapid-change",
    enabled: true,
    threshold: 3,
    sustained_minutes: 0,
    cooldown_minutes: 45,
    escalate_after_minutes: 0,
    channels: ["telegram", "inapp"],
    label: "Rapid glucose change",
  },
  {
    kind: "missing-readings",
    enabled: true,
    threshold: 25,
    sustained_minutes: 0,
    cooldown_minutes: 180,
    escalate_after_minutes: 0,
    channels: ["telegram", "inapp", "push"],
    label: "No readings received",
  },
  {
    kind: "sensor-disconnect",
    enabled: true,
    threshold: 90,
    sustained_minutes: 0,
    cooldown_minutes: 240,
    escalate_after_minutes: 0,
    channels: ["telegram", "inapp"],
    label: "Sensor sync interrupted",
  },
  {
    kind: "emergency",
    enabled: true,
    threshold: null,
    sustained_minutes: 0,
    cooldown_minutes: 5,
    escalate_after_minutes: 3,
    channels: ["push", "sms", "telegram", "audible", "inapp"],
    label: "Emergency assistance request",
  },
];

function mapRule(r: any): AlertRule {
  return {
    id: num(r.id),
    patient_id: num(r.patient_id),
    kind: r.kind,
    enabled: bool(r.enabled),
    threshold: r.threshold === null ? null : num(r.threshold),
    sustained_minutes: num(r.sustained_minutes),
    cooldown_minutes: num(r.cooldown_minutes),
    escalate_after_minutes: num(r.escalate_after_minutes),
    channels: PJ<string[]>(r.channels_json, []),
    label: r.label,
  };
}

const seedingRules = new Map<number, Promise<AlertRule[]>>();

export async function rulesFor(patient: PatientRow): Promise<AlertRule[]> {
  const rows = await db().query<any>("SELECT * FROM alert_rules WHERE patient_id = ?", [patient.id]);
  if (rows.length) return rows.map(mapRule);

  // Serialise default-rule creation per patient so concurrent pollers cannot
  // race on the (patient_id, kind) unique constraint.
  const inflight = seedingRules.get(patient.id);
  if (inflight) return inflight;

  const task = (async () => {
    for (const r of DEFAULT_RULES) {
      try {
        await db().run(
        `INSERT INTO alert_rules (patient_id, kind, enabled, threshold, sustained_minutes, cooldown_minutes,
          escalate_after_minutes, channels_json, label, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            patient.id,
            r.kind,
            r.enabled ? 1 : 0,
            r.threshold,
            r.sustained_minutes,
            r.cooldown_minutes,
            r.escalate_after_minutes,
            J(r.channels),
            r.label,
            nowIso(),
          ],
        );
      } catch {
        /* rule already exists — concurrent creation */
      }
    }
    const fresh = await db().query<any>("SELECT * FROM alert_rules WHERE patient_id = ?", [patient.id]);
    return fresh.map(mapRule);
  })();

  seedingRules.set(patient.id, task);
  try {
    return await task;
  } finally {
    seedingRules.delete(patient.id);
  }
}

export async function updateRule(
  patientId: number,
  kind: AlertKind,
  patch: Partial<Pick<AlertRule, "enabled" | "threshold" | "sustained_minutes" | "cooldown_minutes" | "escalate_after_minutes" | "channels" | "label">>,
): Promise<void> {
  const sets: string[] = [];
  const params: any[] = [];
  if (patch.enabled !== undefined) {
    sets.push("enabled = ?");
    params.push(patch.enabled ? 1 : 0);
  }
  if (patch.threshold !== undefined) {
    sets.push("threshold = ?");
    params.push(patch.threshold);
  }
  if (patch.sustained_minutes !== undefined) {
    sets.push("sustained_minutes = ?");
    params.push(patch.sustained_minutes);
  }
  if (patch.cooldown_minutes !== undefined) {
    sets.push("cooldown_minutes = ?");
    params.push(patch.cooldown_minutes);
  }
  if (patch.escalate_after_minutes !== undefined) {
    sets.push("escalate_after_minutes = ?");
    params.push(patch.escalate_after_minutes);
  }
  if (patch.channels !== undefined) {
    sets.push("channels_json = ?");
    params.push(J(patch.channels));
  }
  if (patch.label !== undefined) {
    sets.push("label = ?");
    params.push(patch.label);
  }
  if (!sets.length) return;
  params.push(patientId, kind);
  await db().run(`UPDATE alert_rules SET ${sets.join(", ")} WHERE patient_id = ? AND kind = ?`, params);
}

export const ALERT_KIND_META: Record<
  AlertKind,
  { label: string; level: "critical" | "warning" | "info"; description: string; greeting: string }
> = {
  "very-low": {
    label: "Critical low glucose",
    level: "critical",
    description: "Fires immediately below the critical-low threshold.",
    greeting: "CRITICAL GLUCOSE ALERT",
  },
  low: {
    label: "Low glucose",
    level: "warning",
    description: "Fires when a reading falls below the low threshold.",
    greeting: "LOW GLUCOSE ALERT",
  },
  high: {
    label: "High glucose",
    level: "warning",
    description: "Fires when readings stay above the high threshold.",
    greeting: "HIGH GLUCOSE ALERT",
  },
  "very-high": {
    label: "Very high glucose",
    level: "critical",
    description: "Fires above the very-high threshold.",
    greeting: "VERY HIGH GLUCOSE ALERT",
  },
  "rapid-change": {
    label: "Rapid glucose change",
    level: "warning",
    description: "Fires when glucose is moving unusually fast.",
    greeting: "RAPID GLUCOSE CHANGE",
  },
  "missing-readings": {
    label: "Missing readings",
    level: "warning",
    description: "Fires when no new reading has arrived for the configured time.",
    greeting: "GLUCOSE SYNC WARNING",
  },
  "sensor-disconnect": {
    label: "Sensor sync interrupted",
    level: "info",
    description: "Fires when the sensor connection appears interrupted.",
    greeting: "SENSOR CONNECTION ALERT",
  },
  emergency: {
    label: "Emergency assistance",
    level: "critical",
    description: "Patient-triggered request for immediate family attention.",
    greeting: "EMERGENCY ASSISTANCE REQUEST",
  },
};
