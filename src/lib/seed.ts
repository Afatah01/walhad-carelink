import { db } from "./db/client";
import { migrate } from "./db/migrate";
import { nowIso, J, num } from "./db/repo-util";
import {
  addMember,
  audit,
  createOrg,
  createPatient,
  createUser,
  findUserByEmail,
  getSetting,
  patientMembers,
  setSetting,
  updatePatient,
} from "./db/repo";
import { ingestReadingsBulk, recordSync } from "./db/repo-glucose";
import { DEFAULT_PLANS, upsertPlan } from "./billing/plans";
import { createSubscription, confirmPayment, invoiceNumber } from "./billing/subscriptions";
import { demoProvider } from "./libre/demo";
import { DEMO_TELEGRAM_PREVIEWS } from "./demo-telegram";

/**
 * Idempotent demo workspace.
 *
 * Creates two family households and one hospital organisation so every surface
 * of the product (family alerts, escalation, clinician dashboard, billing) can be
 * demonstrated. Demo accounts are clearly labelled and must be disabled in a
 * real deployment by setting SEED_DEMO=false.
 */

export interface SeedResult {
  created: boolean;
  accounts: { email: string; password: string; role: string; label: string }[];
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "CareLink2026!";

export async function ensureSeed(): Promise<SeedResult> {
  await migrate();
  const already = await getSetting("seed_version");
  if (already === "2") {
    return { created: false, accounts: demoAccounts() };
  }

  /* --------------------------- plans --------------------------- */
  for (const plan of DEFAULT_PLANS) await upsertPlan(plan as any);

  /* --------------------------- family A (Libre + alerts) --------------------------- */
  const aisha = await ensureUser({
    email: "aisha@walhadcarelink.demo",
    name: "Aisha Mohamed",
    role: "patient",
    title: "Primary patient",
    phone: "+252610000101",
    unit: "mg/dL",
    avatarTone: "teal",
  });
  const familyOrg = await ensureFamilyOrg("Mohamed Family", aisha.id);
  const abdullahi = await ensureUser({
    email: "abdullahi@walhadcarelink.demo",
    name: "Abdullahi Mohamed",
    role: "family",
    title: "Husband",
    phone: "+252610000102",
    avatarTone: "brand",
  });
  const hodan = await ensureUser({
    email: "hodan@walhadcarelink.demo",
    name: "Hodan Yusuf",
    role: "family",
    title: "Daughter",
    phone: "+252610000103",
    avatarTone: "navy",
  });

  const aishaPatient = await ensurePatient({
    userId: aisha.id,
    orgId: familyOrg,
    displayName: "Aisha Mohamed",
    relationship: "Self",
    timezone: "Africa/Mogadishu",
    provider: "demo",
    providerPatientId: "demo-aisha",
    sensorWearDays: 14,
  });
  await addMember({
    patientId: aishaPatient,
    userId: abdullahi.id,
    relation: "Husband",
    permission: "full",
    canViewLocation: true,
    receiveSms: true,
    receivePush: true,
    receiveTelegram: true,
  });
  await addMember({
    patientId: aishaPatient,
    userId: hodan.id,
    relation: "Daughter",
    permission: "alerts",
    canViewLocation: true,
    receiveSms: false,
    receivePush: true,
    receiveTelegram: true,
  });

  await seedGlucose(aishaPatient, 14 * 24);

  /* --------------------------- family B (Libre Premium) --------------------------- */
  const fatima = await ensureUser({
    email: "fatima@walhadcarelink.demo",
    name: "Fatima Hassan",
    role: "patient",
    title: "Primary patient",
    phone: "+252610000201",
    unit: "mmol/L",
    avatarTone: "teal",
  });
  const familyB = await ensureFamilyOrg("Hassan Family", fatima.id);
  const yusuf = await ensureUser({
    email: "yusuf@walhadcarelink.demo",
    name: "Yusuf Hassan",
    role: "family",
    title: "Brother",
    phone: "+252610000202",
    avatarTone: "brand",
  });
  const fatimaPatient = await ensurePatient({
    userId: fatima.id,
    orgId: familyB,
    displayName: "Fatima Hassan",
    relationship: "Self",
    timezone: "Africa/Mogadishu",
    unit: "mmol/L",
    provider: "demo",
    providerPatientId: "demo-fatima",
  });
  await addMember({
    patientId: fatimaPatient,
    userId: yusuf.id,
    relation: "Brother",
    permission: "full",
    canViewLocation: true,
    receiveSms: true,
    receivePush: true,
    receiveTelegram: true,
  });
  await seedGlucose(fatimaPatient, 10 * 24);

  /* --------------------------- hospital --------------------------- */
  const hospitalOrg = await ensureHospitalOrg();
  const doctor = await ensureUser({
    email: "doctor@walhadcarelink.demo",
    name: "Dr. Amina Farah",
    role: "doctor",
    title: "Endocrinologist",
    phone: "+252610000301",
    orgId: hospitalOrg,
    avatarTone: "brand",
  });
  const nurse = await ensureUser({
    email: "nurse@walhadcarelink.demo",
    name: "Nurse Khalid Omar",
    role: "nurse",
    title: "Diabetes nurse",
    phone: "+252610000302",
    orgId: hospitalOrg,
    avatarTone: "teal",
  });
  const admin = await ensureUser({
    email: "admin@walhadcarelink.demo",
    name: "Sahra Aden",
    role: "admin",
    title: "Platform administrator",
    phone: "+252610000303",
    avatarTone: "navy",
  });

  const hospitalPatients = [
    { name: "Mohamed Ali", row: 1, since: 12 },
    { name: "Sagal Warsame", row: 2, since: 9 },
    { name: "Abdi Ismail", row: 3, since: 7 },
    { name: "Khadra Osman", row: 4, since: 6 },
    { name: "Bashir Gedi", row: 5, since: 5 },
    { name: "Nimco Jama", row: 6, since: 4 },
  ];
  for (const [i, p] of hospitalPatients.entries()) {
    const patientId = await ensurePatient({
      userId: null,
      orgId: hospitalOrg,
      displayName: p.name,
      relationship: "Inpatient",
      timezone: "Africa/Mogadishu",
      provider: "demo",
      providerPatientId: `demo-hosp-${i + 1}`,
      unit: "mg/dL",
    });
    await seedGlucose(patientId, p.since * 24);
    const existing = await db().get(
      "SELECT id FROM clinician_assignments WHERE patient_id = ? AND clinician_id = ?",
      [patientId, i % 2 === 0 ? doctor.id : nurse.id],
    );
    if (!existing) {
      await db().run(
        "INSERT INTO clinician_assignments (org_id, patient_id, clinician_id, role, created_at) VALUES (?, ?, ?, ?, ?)",
        [hospitalOrg, patientId, i % 2 === 0 ? doctor.id : nurse.id, i % 2 === 0 ? "doctor" : "nurse", nowIso()],
      );
    }
  }

  /* --------------------------- subscriptions --------------------------- */
  await ensureSubscription({ orgId: familyOrg, patientId: aishaPatient, planSlug: "family-premium" });
  await ensureSubscription({ orgId: familyB, patientId: fatimaPatient, planSlug: "family-basic" });
  await ensureSubscription({ orgId: hospitalOrg, patientId: null, planSlug: "hospital", seats: 12 });

  /* --------------------------- alerts history --------------------------- */
  await seedAlertHistory(aishaPatient, abdullahi.id);
  await seedAlertHistory(fatimaPatient, yusuf.id);

  /* --------------------------- demo telegram links (preview only) --------------------------- */
  await seedTelegramPreview(aishaPatient, abdullahi.id, "Abdullahi Mohamed", abdullahi.email);
  await seedTelegramPreview(aishaPatient, hodan.id, "Hodan Yusuf", hodan.email);

  /* --------------------------- contact requests --------------------------- */
  const contacts = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM contact_requests");
  if (num(contacts?.c) === 0) {
    const enquiries = [
      {
        name: "Dr. Ibrahim Suleiman",
        email: "ibrahim.suleiman@hospital.example",
        company: "Borama General Hospital",
        topic: "hospital",
        message:
          "We would like to monitor 40 inpatients across two wards. Please send information about onboarding, staff accounts and custom pricing.",
      },
      {
        name: "Maryan Abdi",
        email: "maryan.abdi@example.com",
        company: "",
        topic: "subscription",
        message: "Can I add two more family members to my plan? My mother cares for my son during the week.",
      },
    ];
    for (const e of enquiries) {
      await db().run(
        `INSERT INTO contact_requests (name, email, company, topic, message, status, ip, created_at)
         VALUES (?, ?, ?, ?, ?, 'new', 'seed', ?)`,
        [e.name, e.email, e.company, e.topic, e.message, nowIso()],
      );
    }
  }

  await audit({
    action: "seed.completed",
    actorLabel: "system",
    entity: "workspace",
    meta: { patients: 8, users: 8 },
  });

  await setSetting("seed_version", "2");
  return { created: true, accounts: demoAccounts() };
}

function demoAccounts() {
  const pw = DEMO_PASSWORD;
  return [
    { email: "aisha@walhadcarelink.demo", password: pw, role: "patient", label: "Aisha — primary patient (Family Premium)" },
    { email: "abdullahi@walhadcarelink.demo", password: pw, role: "family", label: "Abdullahi — family alert recipient" },
    { email: "hodan@walhadcarelink.demo", password: pw, role: "family", label: "Hodan — family alert recipient" },
    { email: "fatima@walhadcarelink.demo", password: pw, role: "patient", label: "Fatima — primary patient (Family Basic)" },
    { email: "yusuf@walhadcarelink.demo", password: pw, role: "family", label: "Yusuf — family alert recipient" },
    { email: "doctor@walhadcarelink.demo", password: pw, role: "doctor", label: "Dr. Amina Farah — hospital dashboard" },
    { email: "nurse@walhadcarelink.demo", password: pw, role: "nurse", label: "Nurse Khalid Omar — hospital dashboard" },
    { email: "admin@walhadcarelink.demo", password: pw, role: "admin", label: "Sahra Aden — full administration" },
  ];
}

async function ensureUser(input: {
  email: string;
  name: string;
  role: any;
  title?: string;
  phone?: string;
  unit?: "mg/dL" | "mmol/L";
  orgId?: number;
  avatarTone?: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    if (input.orgId && !existing.org_id) {
      await db().run("UPDATE users SET org_id = ? WHERE id = ?", [input.orgId, existing.id]);
    }
    return existing;
  }
  return createUser({
    email: input.email,
    name: input.name,
    password: DEMO_PASSWORD,
    role: input.role,
    title: input.title ?? null,
    phone: input.phone ?? null,
    unit: input.unit ?? "mg/dL",
    orgId: input.orgId ?? null,
    avatarTone: input.avatarTone ?? "brand",
  });
}

async function ensureFamilyOrg(name: string, userId: number): Promise<number> {
  const row = await db().get<{ id: number }>("SELECT id FROM organizations WHERE name = ? AND type = 'family'", [name]);
  if (row) return num(row.id);
  const org = await createOrg({
    name,
    type: "family",
    country: "Somalia",
    contactEmail: "support@walhadcarelink.demo",
  });
  await db().run("UPDATE users SET org_id = ? WHERE id = ?", [org.id, userId]);
  return org.id;
}

async function ensureHospitalOrg(): Promise<number> {
  const existing = await db().get<{ id: number }>(
    "SELECT id FROM organizations WHERE name = ? AND type = 'hospital'",
    ["Borama General Hospital"],
  );
  if (existing) return num(existing.id);
  const org = await createOrg({
    name: "Borama General Hospital",
    type: "hospital",
    country: "Somalia",
    contactEmail: "diabetes-unit@hospital.example",
  });
  return org.id;
}

async function ensurePatient(input: Parameters<typeof createPatient>[0]): Promise<number> {
  const existing = await db().get<{ id: number }>("SELECT id FROM patients WHERE provider_patient_id = ?", [
    input.providerPatientId ?? "",
  ]);
  if (existing) return num(existing.id);
  const p = await createPatient(input);
  return p.id;
}

async function ensureSubscription(input: {
  orgId: number;
  patientId: number | null;
  planSlug: string;
  seats?: number;
}) {
  const existing = await db().get<{ id: number }>("SELECT id FROM subscriptions WHERE org_id = ?", [input.orgId]);
  if (existing) return;
  const intent = await createSubscription({
    planSlug: input.planSlug,
    orgId: input.orgId,
    patientId: input.patientId,
    seats: input.seats ?? 1,
    provider: "seed",
  });
  const payment = await db().get<{ provider_ref: string }>(
    "SELECT provider_ref FROM payments WHERE subscription_id = ? ORDER BY id ASC LIMIT 1",
    [intent.subscription.id],
  );
  if (payment?.provider_ref) {
    await confirmPayment({ providerRef: payment.provider_ref, provider: "seed" });
  }
  await db().run("UPDATE subscriptions SET sms_used = ? WHERE id = ?", [
    Math.round(Math.random() * 40),
    intent.subscription.id,
  ]);
}

async function seedGlucose(patientId: number, hours: number) {
  const done = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM glucose_readings WHERE patient_id = ?", [
    patientId,
  ]);
  if (num(done?.c) > 0) return;
  const patient = await db().get<any>("SELECT * FROM patients WHERE id = ?", [patientId]);
  if (!patient) return;
  const snapshot = await demoProvider.fetchSnapshot({
    patient: {
      id: patient.id,
      display_name: patient.display_name,
      provider_patient_id: patient.provider_patient_id,
      provider_region: null,
      credential_cipher: null,
    },
    lookbackHours: hours,
  });
  await ingestReadingsBulk(patientId, snapshot.readings, "demo");
  await recordSync(patientId, "libre", { ok: true, ingested: snapshot.readings.length });
  await updatePatient(patientId, {
    sensor_serial: snapshot.sensor?.serial ?? null,
    sensor_started_at: snapshot.sensor?.startedAt ? new Date(snapshot.sensor.startedAt).toISOString() : null,
    sensor_wear_days: snapshot.sensor?.wearDays ?? 14,
    sensor_battery: 68,
    provider_connected_at: nowIso(),
  });
}

async function seedAlertHistory(patientId: number, ackUserId: number) {
  const existing = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM alerts WHERE patient_id = ?", [patientId]);
  if (num(existing?.c) > 0) return;

  const rows = await db().query<any>(
    "SELECT * FROM glucose_readings WHERE patient_id = ? ORDER BY taken_at ASC",
    [patientId],
  );
  if (!rows.length) return;

  type Candidate = { kind: string; level: string; value: number; at: number; status: string };
  const candidates: Candidate[] = [];
  let lastLow = 0;
  let lastHigh = 0;
  for (const r of rows) {
    const t = new Date(r.taken_at).getTime();
    if (r.value < 54 && t - lastLow > 8 * 3_600_000) {
      candidates.push({ kind: "very-low", level: "critical", value: r.value, at: t, status: "acknowledged" });
      lastLow = t;
    } else if (r.value < 70 && t - lastLow > 8 * 3_600_000) {
      candidates.push({ kind: "low", level: "warning", value: r.value, at: t, status: "acknowledged" });
      lastLow = t;
    } else if (r.value > 250 && t - lastHigh > 12 * 3_600_000) {
      candidates.push({ kind: "very-high", level: "critical", value: r.value, at: t, status: "resolved" });
      lastHigh = t;
    } else if (r.value > 180 && t - lastHigh > 12 * 3_600_000) {
      candidates.push({ kind: "high", level: "warning", value: r.value, at: t, status: "acknowledged" });
      lastHigh = t;
    }
  }

  const keep = candidates.slice(-9);
  for (const [i, c] of keep.entries()) {
    const recent = i >= keep.length - 2;
    const status = recent ? (i === keep.length - 1 ? "open" : "acknowledged") : c.status;
    const row = await db().get<{ id: number }>(
      `INSERT INTO alerts (patient_id, rule_id, kind, level, value, threshold, message, status, triggered_at,
        acknowledged_by, acknowledged_at, resolved_at, channels_json, created_at)
       VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        c.kind,
        c.level,
        c.value,
        c.kind.includes("low") ? 70 : 180,
        `${c.kind === "low" || c.kind === "very-low" ? "Low" : "High"} glucose recorded at ${c.value} mg/dL.`,
        status,
        new Date(c.at).toISOString(),
        status === "open" ? null : ackUserId,
        status === "open" ? null : new Date(c.at + 6 * 60_000).toISOString(),
        status === "acknowledged" || status === "resolved" ? new Date(c.at + 35 * 60_000).toISOString() : null,
        J(["push", "telegram", "inapp", "audible"]),
        new Date(c.at).toISOString(),
      ],
    );
    if (!row) continue;
    for (const channel of ["push", "telegram", "inapp"]) {
      await db().run(
        `INSERT INTO notifications (alert_id, patient_id, user_id, channel, recipient, status, attempts, created_at, sent_at, acknowledged_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        [
          row.id,
          patientId,
          ackUserId,
          channel,
          channel === "telegram" ? "demo-chat" : "family@walhadcarelink.demo",
          channel === "telegram" ? "skipped" : "sent",
          new Date(c.at).toISOString(),
          new Date(c.at).toISOString(),
          status === "open" ? null : new Date(c.at + 6 * 60_000).toISOString(),
        ],
      );
    }
  }
}

/**
 * Telegram preview links are only created when the deployment has no bot token,
 * so the dashboard can demonstrate the recipient list without sending anything.
 * Once a real bot is configured these are replaced by genuine /start pairings.
 */
async function seedTelegramPreview(patientId: number, userId: number, name: string, email: string) {
  if (process.env.TELEGRAM_BOT_TOKEN) return;
  const existing = await db().get("SELECT id FROM telegram_links WHERE patient_id = ? AND telegram_chat_id = ?", [
    patientId,
    `preview:${userId}`,
  ]);
  if (existing) return;
  await db().run(
    `INSERT INTO telegram_links (user_id, patient_id, telegram_chat_id, telegram_username, telegram_display_name,
      status, notify_low, notify_high, notify_critical, notify_status, notify_emergency, notify_trend, linked_at, created_at)
     VALUES (?, ?, ?, ?, ?, 'preview', 1, 1, 1, 1, 1, 0, ?, ?)`,
    [userId, patientId, `preview:${userId}`, name.toLowerCase().replace(/\s+/g, "_"), name, nowIso(), nowIso()],
  );
  await db().run(
    "UPDATE telegram_links SET notify_low = 1, notify_high = 1, notify_critical = 1 WHERE user_id = ? AND patient_id = ?",
    [userId, patientId],
  );
  void email;
  void DEMO_TELEGRAM_PREVIEWS;
}

export async function memberCountFor(patientId: number): Promise<number> {
  const members = await patientMembers(patientId);
  return members.filter((m) => m.status === "active").length;
}

export { invoiceNumber, DEMO_PASSWORD };
