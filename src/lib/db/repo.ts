import bcrypt from "bcryptjs";
import { db } from "./client";
import { J, PJ, bool, nowIso, num } from "./repo-util";
import { sha256, randomToken } from "../crypto";

/* ============================== types ============================== */

export type Role = "patient" | "family" | "caregiver" | "doctor" | "nurse" | "admin";

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: Role;
  password_hash: string;
  org_id: number | null;
  phone: string | null;
  timezone: string;
  locale: string;
  unit: "mg/dL" | "mmol/L";
  title: string | null;
  avatar_tone: string | null;
  created_at: string;
  last_login_at: string | null;
}

export interface OrgRow {
  id: number;
  name: string;
  type: "family" | "hospital";
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  created_at: string;
}

export interface PatientRow {
  id: number;
  user_id: number | null;
  org_id: number | null;
  display_name: string;
  relationship: string | null;
  date_of_birth: string | null;
  timezone: string;
  unit: "mg/dL" | "mmol/L";
  target_low: number;
  target_high: number;
  thresholds_json: unknown;
  provider: string;
  provider_patient_id: string | null;
  provider_region: string | null;
  credential_cipher: string | null;
  credential_hint: string | null;
  provider_connected_at: string | null;
  sensor_serial: string | null;
  sensor_started_at: string | null;
  sensor_wear_days: number | null;
  sensor_battery: number | null;
  bridge_key_hash: string | null;
  bridge_last_seen_at: string | null;
  location_consent: number;
  location_lat: number | null;
  location_lon: number | null;
  location_label: string | null;
  location_updated_at: string | null;
  status: string;
  created_at: string;
}

export interface MemberRow {
  id: number;
  patient_id: number;
  user_id: number;
  relation: string;
  permission: "alerts" | "view" | "full";
  can_view_location: number;
  can_acknowledge: number;
  receive_push: number;
  receive_sms: number;
  receive_telegram: number;
  status: string;
  invited_at: string | null;
  accepted_at: string | null;
}

/* ============================== settings ============================== */

export async function getSetting(key: string): Promise<string | null> {
  const row = await db().get<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db().get("SELECT key FROM settings WHERE key = ?", [key]);
  if (existing) {
    await db().run("UPDATE settings SET value = ?, updated_at = ? WHERE key = ?", [value, nowIso(), key]);
  } else {
    await db().run("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)", [key, value, nowIso()]);
  }
}

export async function getSettingJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await getSetting(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ============================== users ============================== */

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return db().get<UserRow>("SELECT * FROM users WHERE lower(email) = lower(?)", [email.trim()]);
}

export async function getUser(id: number): Promise<UserRow | null> {
  return db().get<UserRow>("SELECT * FROM users WHERE id = ?", [id]);
}

export async function listUsers(): Promise<UserRow[]> {
  return db().query<UserRow>("SELECT * FROM users ORDER BY created_at ASC");
}

export async function listClinicians(orgId: number): Promise<UserRow[]> {
  return db().query<UserRow>(
    "SELECT * FROM users WHERE org_id = ? AND role IN ('doctor','nurse','admin') ORDER BY name ASC",
    [orgId],
  );
}

export async function createUser(input: {
  email: string;
  name: string;
  password: string;
  role?: Role;
  orgId?: number | null;
  phone?: string | null;
  title?: string | null;
  timezone?: string;
  unit?: "mg/dL" | "mmol/L";
  avatarTone?: string;
}): Promise<UserRow> {
  const hash = await bcrypt.hash(input.password, 10);
  const row = await db().get<UserRow>(
    `INSERT INTO users (email, name, role, password_hash, org_id, phone, title, timezone, unit, avatar_tone, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.role ?? "family",
      hash,
      input.orgId ?? null,
      input.phone ?? null,
      input.title ?? null,
      input.timezone ?? "Africa/Mogadishu",
      input.unit ?? "mg/dL",
      input.avatarTone ?? "brand",
      nowIso(),
    ],
  );
  if (!row) throw new Error("Could not create user");
  return row;
}

export async function updateUser(
  id: number,
  patch: Partial<Pick<UserRow, "name" | "phone" | "timezone" | "unit" | "locale" | "title" | "role" | "org_id">>,
): Promise<void> {
  const sets: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (!sets.length) return;
  params.push(id);
  await db().run(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function touchLogin(id: number): Promise<void> {
  await db().run("UPDATE users SET last_login_at = ? WHERE id = ?", [nowIso(), id]);
}

export async function verifyPassword(user: UserRow, password: string): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function setPassword(userId: number, password: string): Promise<void> {
  const hash = await bcrypt.hash(password, 10);
  await db().run("UPDATE users SET password_hash = ? WHERE id = ?", [hash, userId]);
}

/* ============================== sessions ============================== */

const SESSION_DAYS = 14;

export async function createSession(userId: number, ip?: string, userAgent?: string): Promise<string> {
  const token = randomToken(32);
  await db().run(
    "INSERT INTO sessions (token_hash, user_id, expires_at, ip, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [
      sha256(token),
      userId,
      nowIso(Date.now() + SESSION_DAYS * 86_400_000),
      ip ?? null,
      userAgent?.slice(0, 250) ?? null,
      nowIso(),
    ],
  );
  return token;
}

export async function userFromSession(token: string | null | undefined): Promise<UserRow | null> {
  if (!token) return null;
  const session = await db().get<{ user_id: number; expires_at: string }>(
    "SELECT user_id, expires_at FROM sessions WHERE token_hash = ?",
    [sha256(token)],
  );
  if (!session) return null;
  if (new Date(session.expires_at).getTime() < Date.now()) {
    await db().run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
    return null;
  }
  return getUser(session.user_id);
}

export async function destroySession(token: string): Promise<void> {
  await db().run("DELETE FROM sessions WHERE token_hash = ?", [sha256(token)]);
}

/* ============================== organizations ============================== */

export async function createOrg(input: {
  name: string;
  type?: "family" | "hospital";
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}): Promise<OrgRow> {
  const row = await db().get<OrgRow>(
    `INSERT INTO organizations (name, type, country, contact_email, contact_phone, address, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.type ?? "family",
      input.country ?? null,
      input.contactEmail ?? null,
      input.contactPhone ?? null,
      input.address ?? null,
      nowIso(),
    ],
  );
  if (!row) throw new Error("Could not create organization");
  return row;
}

export async function getOrg(id: number): Promise<OrgRow | null> {
  return db().get<OrgRow>("SELECT * FROM organizations WHERE id = ?", [id]);
}

export async function listOrgs(type?: "family" | "hospital"): Promise<OrgRow[]> {
  if (type) {
    return db().query<OrgRow>("SELECT * FROM organizations WHERE type = ? ORDER BY name ASC", [type]);
  }
  return db().query<OrgRow>("SELECT * FROM organizations ORDER BY name ASC");
}

/* ============================== patients ============================== */

export async function createPatient(input: {
  userId?: number | null;
  orgId?: number | null;
  displayName: string;
  relationship?: string | null;
  dateOfBirth?: string | null;
  timezone?: string;
  unit?: "mg/dL" | "mmol/L";
  targetLow?: number;
  targetHigh?: number;
  provider?: string;
  providerPatientId?: string | null;
  providerRegion?: string | null;
  sensorSerial?: string | null;
  sensorWearDays?: number;
}): Promise<PatientRow> {
  const row = await db().get<PatientRow>(
    `INSERT INTO patients (user_id, org_id, display_name, relationship, date_of_birth, timezone, unit,
       target_low, target_high, thresholds_json, provider, provider_patient_id, provider_region,
       sensor_serial, sensor_wear_days, location_consent, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', ?)`,
    [
      input.userId ?? null,
      input.orgId ?? null,
      input.displayName,
      input.relationship ?? null,
      input.dateOfBirth ?? null,
      input.timezone ?? "Africa/Mogadishu",
      input.unit ?? "mg/dL",
      input.targetLow ?? 70,
      input.targetHigh ?? 180,
      J({ veryLow: 54, low: input.targetLow ?? 70, high: input.targetHigh ?? 180, veryHigh: 250 }),
      input.provider ?? "demo",
      input.providerPatientId ?? null,
      input.providerRegion ?? "eu",
      input.sensorSerial ?? null,
      input.sensorWearDays ?? 14,
      nowIso(),
    ],
  );
  if (!row) throw new Error("Could not create patient");
  return row;
}

export async function getPatient(id: number): Promise<PatientRow | null> {
  return db().get<PatientRow>("SELECT * FROM patients WHERE id = ?", [id]);
}

export async function updatePatient(id: number, patch: Record<string, any>): Promise<void> {
  const allowed = new Set([
    "display_name",
    "relationship",
    "date_of_birth",
    "timezone",
    "unit",
    "target_low",
    "target_high",
    "thresholds_json",
    "provider",
    "provider_patient_id",
    "provider_region",
    "credential_cipher",
    "credential_hint",
    "provider_connected_at",
    "sensor_serial",
    "sensor_started_at",
    "sensor_wear_days",
    "sensor_battery",
    "bridge_key_hash",
    "bridge_last_seen_at",
    "location_consent",
    "location_lat",
    "location_lon",
    "location_label",
    "location_updated_at",
    "status",
  ]);
  const sets: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!allowed.has(k) || v === undefined) continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (!sets.length) return;
  params.push(id);
  await db().run(`UPDATE patients SET ${sets.join(", ")} WHERE id = ?`, params);
}

export async function patientThresholds(patient: PatientRow): Promise<{
  veryLow: number;
  low: number;
  high: number;
  veryHigh: number;
}> {
  const parsed = PJ<{ veryLow?: number; low?: number; high?: number; veryHigh?: number }>(
    patient.thresholds_json,
    {},
  );
  return {
    veryLow: num(parsed.veryLow, 54),
    low: num(parsed.low, patient.target_low ?? 70),
    high: num(parsed.high, patient.target_high ?? 180),
    veryHigh: num(parsed.veryHigh, 250),
  };
}

export interface PatientAccess {
  patient: PatientRow;
  role: "owner" | "family" | "caregiver" | "clinician";
  member: MemberRow | null;
  canViewLocation: boolean;
  canAcknowledge: boolean;
  canManage: boolean;
}

export async function patientsForUser(userId: number, role: Role): Promise<PatientAccess[]> {
  const rows = await db().query<any>(
    `SELECT p.*, m.id AS m_id, m.relation, m.permission, m.can_view_location, m.can_acknowledge,
            m.receive_push, m.receive_sms, m.receive_telegram, m.status AS m_status,
            m.invited_at, m.accepted_at, m.patient_id AS m_patient_id, m.user_id AS m_user_id
     FROM patients p
     LEFT JOIN patient_members m ON m.patient_id = p.id AND m.user_id = ?
     WHERE (p.user_id = ? OR m.user_id = ?) AND p.status <> 'archived'
     ORDER BY p.created_at ASC`,
    [userId, userId, userId],
  );

  const out: PatientAccess[] = [];
  for (const r of rows) {
    const member: MemberRow | null = r.m_id
      ? {
          id: num(r.m_id),
          patient_id: num(r.m_patient_id),
          user_id: num(r.m_user_id),
          relation: r.relation,
          permission: r.permission,
          can_view_location: num(r.can_view_location),
          can_acknowledge: num(r.can_acknowledge),
          receive_push: num(r.receive_push),
          receive_sms: num(r.receive_sms),
          receive_telegram: num(r.receive_telegram),
          status: r.m_status,
          invited_at: r.invited_at,
          accepted_at: r.accepted_at,
        }
      : null;
    const isOwner = num(r.user_id) === userId;
    out.push({
      patient: r as PatientRow,
      role: isOwner ? "owner" : member?.permission === "view" ? "family" : "caregiver",
      member,
      canViewLocation: isOwner || bool(member?.can_view_location),
      canAcknowledge: isOwner || bool(member?.can_acknowledge ?? 1),
      canManage: isOwner,
    });
  }

  // Clinicians see every patient assigned to them, plus their whole org for leads.
  if (role === "doctor" || role === "nurse" || role === "admin") {
    const user = await getUser(userId);
    if (user?.org_id) {
      const orgPatients = await db().query<PatientRow>(
        `SELECT p.* FROM patients p
         LEFT JOIN clinician_assignments ca ON ca.patient_id = p.id AND ca.clinician_id = ?
         WHERE p.org_id = ? AND p.status <> 'archived'
         ORDER BY p.display_name ASC`,
        [userId, user.org_id],
      );
      for (const p of orgPatients) {
        if (out.some((o) => o.patient.id === p.id)) continue;
        out.push({
          patient: p,
          role: "clinician",
          member: null,
          canViewLocation: role === "admin" || role === "doctor",
          canAcknowledge: true,
          canManage: role === "admin" || role === "doctor",
        });
      }
    }
  }
  return out;
}

export async function accessForPatient(
  userId: number,
  role: Role,
  patientId: number,
): Promise<PatientAccess | null> {
  const all = await patientsForUser(userId, role);
  return all.find((a) => a.patient.id === patientId) ?? null;
}

export async function orgPatients(orgId: number): Promise<PatientRow[]> {
  return db().query<PatientRow>(
    "SELECT * FROM patients WHERE org_id = ? AND status <> 'archived' ORDER BY display_name ASC",
    [orgId],
  );
}

/* ============================== members ============================== */

export async function patientMembers(patientId: number): Promise<(MemberRow & { user: UserRow })[]> {
  const rows = await db().query<any>(
    `SELECT m.*, u.id AS u_id, u.name AS u_name, u.email AS u_email, u.phone AS u_phone,
            u.role AS u_role, u.title AS u_title, u.avatar_tone AS u_avatar_tone
     FROM patient_members m JOIN users u ON u.id = m.user_id
     WHERE m.patient_id = ? ORDER BY m.id ASC`,
    [patientId],
  );
  return rows.map((r) => ({
    id: num(r.id),
    patient_id: num(r.patient_id),
    user_id: num(r.user_id),
    relation: r.relation,
    permission: r.permission,
    can_view_location: num(r.can_view_location),
    can_acknowledge: num(r.can_acknowledge),
    receive_push: num(r.receive_push),
    receive_sms: num(r.receive_sms),
    receive_telegram: num(r.receive_telegram),
    status: r.status,
    invited_at: r.invited_at,
    accepted_at: r.accepted_at,
    user: {
      id: num(r.u_id),
      name: r.u_name,
      email: r.u_email,
      phone: r.u_phone,
      role: r.u_role,
      title: r.u_title,
      avatar_tone: r.u_avatar_tone,
    } as UserRow,
  }));
}

export async function addMember(input: {
  patientId: number;
  userId: number;
  relation?: string;
  permission?: "alerts" | "view" | "full";
  canViewLocation?: boolean;
  canAcknowledge?: boolean;
  receivePush?: boolean;
  receiveSms?: boolean;
  receiveTelegram?: boolean;
}): Promise<void> {
  const existing = await db().get<MemberRow>(
    "SELECT * FROM patient_members WHERE patient_id = ? AND user_id = ?",
    [input.patientId, input.userId],
  );
  if (existing) {
    await db().run(
      `UPDATE patient_members SET relation = ?, permission = ?, can_view_location = ?, can_acknowledge = ?,
        receive_push = ?, receive_sms = ?, receive_telegram = ?, status = 'active' WHERE id = ?`,
      [
        input.relation ?? existing.relation,
        input.permission ?? existing.permission,
        (input.canViewLocation ?? bool(existing.can_view_location)) ? 1 : 0,
        (input.canAcknowledge ?? bool(existing.can_acknowledge)) ? 1 : 0,
        (input.receivePush ?? bool(existing.receive_push)) ? 1 : 0,
        (input.receiveSms ?? bool(existing.receive_sms)) ? 1 : 0,
        (input.receiveTelegram ?? bool(existing.receive_telegram)) ? 1 : 0,
        existing.id,
      ],
    );
    return;
  }
  await db().run(
    `INSERT INTO patient_members (patient_id, user_id, relation, permission, can_view_location,
      can_acknowledge, receive_push, receive_sms, receive_telegram, status, invited_at, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      input.patientId,
      input.userId,
      input.relation ?? "family",
      input.permission ?? "alerts",
      input.canViewLocation ? 1 : 0,
      input.canAcknowledge === false ? 0 : 1,
      input.receivePush === false ? 0 : 1,
      input.receiveSms ? 1 : 0,
      input.receiveTelegram === false ? 0 : 1,
      nowIso(),
      nowIso(),
    ],
  );
}

export async function updateMember(
  patientId: number,
  userId: number,
  patch: Partial<{
    relation: string;
    permission: string;
    can_view_location: number;
    can_acknowledge: number;
    receive_push: number;
    receive_sms: number;
    receive_telegram: number;
    status: string;
  }>,
): Promise<void> {
  const sets: string[] = [];
  const params: any[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    sets.push(`${k} = ?`);
    params.push(v);
  }
  if (!sets.length) return;
  params.push(patientId, userId);
  await db().run(`UPDATE patient_members SET ${sets.join(", ")} WHERE patient_id = ? AND user_id = ?`, params);
}

export async function removeMember(patientId: number, userId: number): Promise<void> {
  await db().run("DELETE FROM patient_members WHERE patient_id = ? AND user_id = ?", [patientId, userId]);
}

/** Find or create a lightweight account for an invited family member. */
export async function inviteMemberByEmail(input: {
  patientId: number;
  email: string;
  name: string;
  relation?: string;
  receiveSms?: boolean;
  phone?: string | null;
}): Promise<{ user: UserRow; created: boolean }> {
  let user = await findUserByEmail(input.email);
  let created = false;
  if (!user) {
    user = await createUser({
      email: input.email,
      name: input.name,
      password: randomToken(18),
      role: "family",
      phone: input.phone ?? null,
    });
    created = true;
  }
  await addMember({
    patientId: input.patientId,
    userId: user.id,
    relation: input.relation,
    permission: "alerts",
    receiveSms: input.receiveSms ?? false,
    receivePush: true,
    receiveTelegram: true,
  });
  return { user, created };
}

/* ============================== audit ============================== */

export async function audit(input: {
  actorId?: number | null;
  actorLabel?: string | null;
  action: string;
  entity?: string;
  entityId?: string | number;
  meta?: unknown;
  ip?: string | null;
}): Promise<void> {
  await db().run(
    `INSERT INTO audit_logs (actor_id, actor_label, action, entity, entity_id, meta_json, ip, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.actorId ?? null,
      input.actorLabel ?? null,
      input.action,
      input.entity ?? null,
      input.entityId !== undefined ? String(input.entityId) : null,
      J(input.meta ?? null),
      input.ip ?? null,
      nowIso(),
    ],
  );
}

export async function recentAudit(limit = 25): Promise<any[]> {
  return db().query(
    `SELECT a.*, u.name AS actor_name FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_id
     ORDER BY a.created_at DESC LIMIT ?`,
    [limit],
  );
}

export async function logIntegration(input: {
  provider: string;
  event: string;
  status: "ok" | "warn" | "error";
  message?: string;
  meta?: unknown;
}): Promise<void> {
  await db().run(
    `INSERT INTO integration_logs (provider, event, status, message, meta_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.provider, input.event, input.status, input.message ?? null, J(input.meta ?? null), nowIso()],
  );
}

export async function recentIntegrations(limit = 15): Promise<any[]> {
  return db().query("SELECT * FROM integration_logs ORDER BY created_at DESC LIMIT ?", [limit]);
}

/* ============================== contact ============================== */

export async function createContactRequest(input: {
  name: string;
  email: string;
  company?: string;
  topic: string;
  message: string;
  ip?: string;
}): Promise<void> {
  await db().run(
    `INSERT INTO contact_requests (name, email, company, topic, message, status, ip, created_at)
     VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    [input.name, input.email, input.company ?? null, input.topic, input.message, input.ip ?? null, nowIso()],
  );
}

export async function listContactRequests(limit = 40): Promise<any[]> {
  return db().query("SELECT * FROM contact_requests ORDER BY created_at DESC LIMIT ?", [limit]);
}
