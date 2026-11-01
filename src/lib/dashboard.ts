import { db } from "./db/client";
import { nowIso, num, PJ } from "./db/repo-util";
import {
  getOrg,
  orgPatients,
  patientMembers,
  patientThresholds,
  type PatientAccess,
  type PatientRow,
  type UserRow,
} from "./db/repo";
import { subscriptionFor } from "./billing/subscriptions";
import { getSyncState, latestReading, readingCount, recentReadings, readingsSince } from "./db/repo-glucose";
import { alertsFor, openAlertsFor } from "./alerts/engine";
import { rulesFor } from "./alerts/rules";
import {
  classify,
  computeStats,
  convert,
  dailyAverages,
  deriveTrend,
  freshness,
  FRESHNESS_META,
  hourlyAverages,
  LEVEL_META,
  stampTime,
  TREND_META,
  type Freshness,
  type TrendKey,
} from "./glucose";
import { linksForPatient } from "./notify/telegram-bot";

export interface DashboardPayload {
  patient: {
    id: number;
    name: string;
    relationship: string | null;
    unit: "mg/dL" | "mmol/L";
    timezone: string;
    thresholds: { veryLow: number; low: number; high: number; veryHigh: number };
    targetLow: number;
    targetHigh: number;
    provider: string;
    providerLabel: string;
    sensor: {
      serial: string | null;
      startedAt: number | null;
      wearDays: number | null;
      daysLeft: number | null;
      battery: number | null;
    };
    location: { shared: boolean; lat: number | null; lon: number | null; label: string | null; updatedAt: number | null };
  };
  canManage: boolean;
  latest: {
    value: number;
    display: number;
    level: keyof typeof LEVEL_META;
    levelLabel: string;
    trend: TrendKey;
    trendLabel: string;
    takenAt: number;
    freshness: Freshness;
    freshnessLabel: string;
    freshnessDetail: string;
    ageMinutes: number | null;
    isCurrent: boolean;
  } | null;
  stats: {
    today: { avg: number; min: number; max: number; count: number };
    week: ReturnType<typeof computeStats>;
    month: ReturnType<typeof computeStats>;
    ninety: ReturnType<typeof computeStats>;
    readings: number;
  };
  charts: {
    day: { t: number; value: number }[];
    week: { t: number; avg: number; min: number; max: number; count: number }[];
    tir: { id: string; label: string; value: number; color: string }[];
  };
  sync: {
    lastSuccessAt: number | null;
    ageMinutes: number | null;
    failures: number;
    lastError: string | null;
    connected: boolean;
  };
  family: {
    id: number;
    name: string;
    email: string;
    relation: string;
    tone: string;
    telegram: "active" | "preview" | "none";
    push: boolean;
    sms: boolean;
    canViewLocation: boolean;
    status: string;
  }[];
  telegram: {
    configured: boolean;
    configuredRecipients: number;
    linkedRecipients: { id: number; name: string; chat: string; status: string; linkedAt: number | null }[];
  };
  alerts: {
    open: {
      id: number;
      kind: string;
      level: string;
      message: string | null;
      value: number | null;
      triggeredAt: number;
      status: string;
    }[];
    recent: {
      id: number;
      kind: string;
      level: string;
      value: number | null;
      status: string;
      triggeredAt: number;
      acknowledgedAt: number | null;
      message: string | null;
    }[];
  };
  rules: {
    kind: string;
    label: string;
    enabled: boolean;
    threshold: number | null;
    channels: string[];
    escalateAfterMinutes: number;
  }[];
  plan: {
    name: string | null;
    slug: string | null;
    status: string;
    recipientLimit: number | null;
    members: number;
    smsAllowance: number;
    smsUsed: number;
  };
  memberPreviews: { name: string; relation: string }[];
}

export function providerLabel(key: string): string {
  switch (key) {
    case "demo":
      return "Demo sensor stream";
    case "libreview":
      return "LibreView Data Sharing API";
    case "linkup":
      return "LibreLinkUp follower";
    case "bridge":
      return "Secure phone bridge";
    default:
      return key;
  }
}

export async function buildDashboard(access: PatientAccess, user: UserRow): Promise<DashboardPayload> {
  const patient = access.patient;
  const now = Date.now();
  const unit = patient.unit;
  const thresholds = await patientThresholds(patient);

  const latest = await latestReading(patient.id);
  const dayReadings = await readingsSince(patient.id, now - 24 * 3_600_000);
  const weekReadings = await readingsSince(patient.id, now - 7 * 86_400_000);
  const monthReadings = await readingsSince(patient.id, now - 30 * 86_400_000);
  const ninetyReadings = await readingsSince(patient.id, now - 90 * 86_400_000, 40000);

  const today = dayReadings.filter((r) => {
    const d = new Date(r.takenAt);
    d.setHours(0, 0, 0, 0);
    return r.takenAt >= d.getTime();
  });
  const todayStat = computeStats(today);

  const fresh = latest ? freshness(latest.takenAt, now) : "missing";
  const ageMinutes = latest ? Math.round((now - latest.takenAt) / 60_000) : null;
  const level = latest ? classify(latest.value, thresholds) : "in-range";
  const trend: TrendKey = latest
    ? deriveTrend(dayReadings.slice(-8).map((r) => ({ value: r.value, takenAt: r.takenAt })))
    : "steady";

  const week = computeStats(weekReadings);
  const month = computeStats(monthReadings);
  const ninety = computeStats(ninetyReadings);

  const members = await patientMembers(patient.id);
  const links = await linksForPatient(patient.id);
  const linkByUser = new Map<number, (typeof links)[number][]>();
  for (const l of links) {
    if (!l.user_id) continue;
    const list = linkByUser.get(l.user_id) ?? [];
    list.push(l);
    linkByUser.set(l.user_id, list);
  }

  const rules = await rulesFor(patient);
  const open = await openAlertsFor(patient.id);
  const recent = await alertsFor(patient.id, 8);

  const syncState = await getSyncState(patient.id, "libre");
  const sub = await subscriptionFor({ orgId: patient.org_id, patientId: patient.id });

  const sensorStarted = patient.sensor_started_at ? new Date(patient.sensor_started_at).getTime() : null;
  const wearDays = patient.sensor_wear_days ?? 14;
  const daysLeft = sensorStarted ? Math.max(0, Math.ceil((sensorStarted + wearDays * 86_400_000 - now) / 86_400_000)) : null;

  const tir = [
    { id: "very-high", label: "Very high", value: ninety.tarVeryHigh, color: "#b55d0c" },
    { id: "high", label: "High", value: Math.max(0, Math.round((ninety.tar - ninety.tarVeryHigh) * 10) / 10), color: "#d98324" },
    { id: "in-range", label: "In range", value: ninety.tir, color: "#0f9d76" },
    { id: "low", label: "Low", value: Math.max(0, Math.round((ninety.tbr - ninety.tbrVeryLow) * 10) / 10), color: "#d64545" },
    { id: "very-low", label: "Very low", value: ninety.tbrVeryLow, color: "#b3261e" },
  ].filter((x) => x.value > 0);

  return {
    patient: {
      id: patient.id,
      name: patient.display_name,
      relationship: patient.relationship,
      unit,
      timezone: patient.timezone,
      thresholds,
      targetLow: patient.target_low,
      targetHigh: patient.target_high,
      provider: patient.provider,
      providerLabel: providerLabel(patient.provider),
      sensor: {
        serial: patient.sensor_serial,
        startedAt: sensorStarted,
        wearDays,
        daysLeft,
        battery: patient.sensor_battery,
      },
      location: {
        shared: Boolean(patient.location_consent) && access.canViewLocation,
        lat: patient.location_lat,
        lon: patient.location_lon,
        label: patient.location_label,
        updatedAt: patient.location_updated_at ? new Date(patient.location_updated_at).getTime() : null,
      },
    },
    canManage: access.canManage,
    latest: latest
      ? {
          value: latest.value,
          display: convert(latest.value, unit),
          level,
          levelLabel: LEVEL_META[level].label,
          trend,
          trendLabel: TREND_META[trend].label,
          takenAt: latest.takenAt,
          freshness: fresh,
          freshnessLabel: FRESHNESS_META[fresh].label,
          freshnessDetail: FRESHNESS_META[fresh].detail,
          ageMinutes,
          isCurrent: fresh === "live" || fresh === "recent",
        }
      : null,
    stats: {
      today: {
        avg: convert(todayStat.average, unit),
        min: convert(todayStat.min, unit),
        max: convert(todayStat.max, unit),
        count: todayStat.count,
      },
      week,
      month,
      ninety,
      readings: await readingCount(patient.id),
    },
    charts: {
      day: hourlyAverages(dayReadings, 24, now).map((p) => ({ t: p.t, value: convert(p.value, unit) })),
      week: dailyAverages(weekReadings, 7, now).map((p) => ({
        t: p.t,
        avg: convert(p.avg, unit),
        min: convert(p.min, unit),
        max: convert(p.max, unit),
        count: p.count,
      })),
      tir,
    },
    sync: {
      lastSuccessAt: syncState?.last_success_at ? new Date(syncState.last_success_at).getTime() : null,
      ageMinutes: ageMinutes,
      failures: syncState?.consecutive_failures ?? 0,
      lastError: syncState?.last_error ?? null,
      connected: (syncState?.consecutive_failures ?? 0) === 0 && fresh !== "missing",
    },
    family: members
      .filter((m) => m.status === "active")
      .map((m) => {
        const userLinks = linkByUser.get(m.user_id) ?? [];
        const active = userLinks.find((l) => l.status === "active");
        const preview = userLinks.find((l) => l.status === "preview");
        return {
          id: m.id,
          name: m.user.name,
          email: m.user.email,
          relation: m.relation,
          tone: m.user.avatar_tone ?? "brand",
          telegram: active ? "active" : preview ? "preview" : "none",
          push: Boolean(m.receive_push),
          sms: Boolean(m.receive_sms),
          canViewLocation: Boolean(m.can_view_location),
          status: m.status,
        };
      }),
    telegram: {
      configured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      configuredRecipients: links.filter((l) => l.status === "active").length,
      linkedRecipients: links
        .filter((l) => l.status !== "disconnected")
        .map((l) => ({
          id: l.id,
          name: l.telegram_display_name ?? l.telegram_username ?? l.telegram_chat_id,
          chat: l.telegram_chat_id,
          status: l.status,
          linkedAt: l.linked_at ? new Date(l.linked_at).getTime() : null,
        })),
    },
    alerts: {
      open: open.map((a) => ({
        id: a.id,
        kind: a.kind,
        level: a.level,
        message: a.message,
        value: a.value,
        triggeredAt: new Date(a.triggered_at).getTime(),
        status: a.status,
      })),
      recent: recent.map((a) => ({
        id: a.id,
        kind: a.kind,
        level: a.level,
        value: a.value,
        status: a.status,
        triggeredAt: new Date(a.triggered_at).getTime(),
        acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at).getTime() : null,
        message: a.message,
      })),
    },
    rules: rules.map((r) => ({
      kind: r.kind,
      label: r.label ?? r.kind,
      enabled: r.enabled,
      threshold: r.threshold,
      channels: r.channels,
      escalateAfterMinutes: r.escalate_after_minutes,
    })),
    plan: {
      name: sub?.plan?.name ?? null,
      slug: sub?.plan?.slug ?? null,
      status: sub?.status ?? "none",
      recipientLimit: sub?.plan?.recipient_limit ?? 2,
      members: members.filter((m) => m.status === "active").length,
      smsAllowance: sub?.sms_allowance ?? 0,
      smsUsed: sub?.sms_used ?? 0,
    },
    memberPreviews: members.slice(0, 4).map((m) => ({ name: m.user.name, relation: m.relation })),
  };
}

/** Global, cross-patient notifications for the notification centre. */
export async function notificationsForPatients(patientIds: number[], limit = 40) {
  if (!patientIds.length) return [];
  const rows = await db().query<any>(
    `SELECT n.*, p.display_name AS patient_name, u.name AS user_name
     FROM notifications n
     JOIN patients p ON p.id = n.patient_id
     LEFT JOIN users u ON u.id = n.user_id
     ORDER BY n.created_at DESC LIMIT 200`,
  );
  return rows
    .filter((r) => patientIds.includes(num(r.patient_id)))
    .slice(0, limit)
    .map((r) => ({
      id: num(r.id),
      alertId: r.alert_id ? num(r.alert_id) : null,
      patientId: num(r.patient_id),
      patientName: r.patient_name,
      channel: r.channel,
      recipient: r.recipient,
      status: r.status,
      error: r.error,
      createdAt: new Date(r.created_at).getTime(),
      sentAt: r.sent_at ? new Date(r.sent_at).getTime() : null,
      acknowledgedAt: r.acknowledged_at ? new Date(r.acknowledged_at).getTime() : null,
      user: r.user_name,
    }));
}

export function alertsWithPatient(rows: any[]) {
  return rows.map((a) => ({
    ...a,
    triggeredAt: new Date(a.triggered_at ?? a.created_at).getTime(),
  }));
}

export interface OrgOverview {
  org: { id: number; name: string; type: string } | null;
  patients: PatientRow[];
  totals: {
    patients: number;
    attention: number;
    critical24h: number;
    activeConnections: number;
    notifications24h: number;
  };
}

/** Aggregated numbers for the hospital / enterprise console. */
export async function orgOverview(orgId: number): Promise<OrgOverview> {
  const org = await getOrg(orgId);
  const patients = await orgPatients(orgId);
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();

  const latestRows = await db().query<any>(
    `SELECT g.patient_id, MAX(g.taken_at) AS last_at FROM glucose_readings g
     JOIN patients p ON p.id = g.patient_id WHERE p.org_id = ? GROUP BY g.patient_id`,
    [orgId],
  );
  const lastByPatient = new Map<number, number>(
    latestRows.map((r) => [num(r.patient_id), new Date(r.last_at).getTime()]),
  );

  let attention = 0;
  let activeConnections = 0;
  const now = Date.now();
  for (const p of patients) {
    const last = lastByPatient.get(p.id);
    if (!last) {
      attention += 1;
      continue;
    }
    const ageMin = (now - last) / 60000;
    if (ageMin > 20) attention += 1;
    else activeConnections += 1;
    const reading = await db().get<{ value: number }>(
      "SELECT value FROM glucose_readings WHERE patient_id = ? ORDER BY taken_at DESC LIMIT 1",
      [p.id],
    );
    const t = await patientThresholds(p);
    if (reading && (reading.value < t.low || reading.value > t.high)) attention += 1;
  }

  const critical = await db().get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM alerts a JOIN patients p ON p.id = a.patient_id
     WHERE p.org_id = ? AND a.level = 'critical' AND a.triggered_at >= ?`,
    [orgId, since],
  );
  const notifs = await db().get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM notifications n JOIN patients p ON p.id = n.patient_id
     WHERE p.org_id = ? AND n.created_at >= ?`,
    [orgId, since],
  );

  return {
    org: org ? { id: org.id, name: org.name, type: org.type } : null,
    patients,
    totals: {
      patients: patients.length,
      attention,
      critical24h: num(critical?.c ?? 0),
      activeConnections,
      notifications24h: num(notifs?.c ?? 0),
    },
  };
}

export { stampTime, PJ, nowIso };
