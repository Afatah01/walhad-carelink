import type { Dialect } from "./client";

/**
 * Portable schema.
 *
 * Timestamps are stored as ISO-8601 UTC strings (TEXT) in both dialects so that
 * a single repository layer works unchanged on PostgreSQL (Render) and SQLite
 * (local / zero-config preview). Booleans are stored as INTEGER 0/1.
 */
export function schemaStatements(d: Dialect): string[] {
  const PK = d === "pg" ? "SERIAL PRIMARY KEY" : "INTEGER PRIMARY KEY AUTOINCREMENT";
  const JSON = d === "pg" ? "JSONB" : "TEXT";
  const REAL = d === "pg" ? "DOUBLE PRECISION" : "REAL";
  const INT = "INTEGER";

  const raw = [
    /* ------------------------------ platform ------------------------------ */
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS organizations (
      id {{PK}},
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'family',
      country TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      address TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      id {{PK}},
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'family',
      password_hash TEXT NOT NULL,
      org_id ${INT},
      phone TEXT,
      timezone TEXT NOT NULL DEFAULT 'Africa/Mogadishu',
      locale TEXT NOT NULL DEFAULT 'en',
      unit TEXT NOT NULL DEFAULT 'mg/dL',
      title TEXT,
      avatar_tone TEXT DEFAULT 'brand',
      created_at TEXT NOT NULL,
      last_login_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS sessions (
      id {{PK}},
      token_hash TEXT NOT NULL UNIQUE,
      user_id ${INT} NOT NULL,
      expires_at TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS patients (
      id {{PK}},
      user_id ${INT},
      org_id ${INT},
      display_name TEXT NOT NULL,
      relationship TEXT,
      date_of_birth TEXT,
      timezone TEXT NOT NULL DEFAULT 'Africa/Mogadishu',
      unit TEXT NOT NULL DEFAULT 'mg/dL',
      target_low ${REAL} NOT NULL DEFAULT 70,
      target_high ${REAL} NOT NULL DEFAULT 180,
      thresholds_json ${JSON},
      provider TEXT NOT NULL DEFAULT 'demo',
      provider_patient_id TEXT,
      provider_region TEXT DEFAULT 'eu',
      credential_cipher TEXT,
      credential_hint TEXT,
      provider_connected_at TEXT,
      sensor_serial TEXT,
      sensor_started_at TEXT,
      sensor_wear_days ${INT} DEFAULT 14,
      sensor_battery ${INT},
      bridge_key_hash TEXT,
      bridge_last_seen_at TEXT,
      location_consent ${INT} NOT NULL DEFAULT 0,
      location_lat ${REAL},
      location_lon ${REAL},
      location_label TEXT,
      location_updated_at TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS patient_members (
      id {{PK}},
      patient_id ${INT} NOT NULL,
      user_id ${INT} NOT NULL,
      relation TEXT NOT NULL DEFAULT 'family',
      permission TEXT NOT NULL DEFAULT 'alerts',
      can_view_location ${INT} NOT NULL DEFAULT 0,
      can_acknowledge ${INT} NOT NULL DEFAULT 1,
      receive_push ${INT} NOT NULL DEFAULT 1,
      receive_sms ${INT} NOT NULL DEFAULT 0,
      receive_telegram ${INT} NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'active',
      invited_at TEXT,
      accepted_at TEXT,
      UNIQUE (patient_id, user_id)
    )`,

    `CREATE TABLE IF NOT EXISTS clinician_assignments (
      id {{PK}},
      org_id ${INT} NOT NULL,
      patient_id ${INT} NOT NULL,
      clinician_id ${INT} NOT NULL,
      role TEXT NOT NULL DEFAULT 'nurse',
      created_at TEXT NOT NULL,
      UNIQUE (patient_id, clinician_id)
    )`,

    /* ------------------------------ glucose ------------------------------ */
    `CREATE TABLE IF NOT EXISTS glucose_readings (
      id {{PK}},
      patient_id ${INT} NOT NULL,
      value ${REAL} NOT NULL,
      trend TEXT,
      source TEXT NOT NULL DEFAULT 'libre',
      taken_at TEXT NOT NULL,
      received_at TEXT NOT NULL,
      UNIQUE (patient_id, taken_at)
    )`,

    /* ------------------------------ alerts ------------------------------- */
    `CREATE TABLE IF NOT EXISTS alert_rules (
      id {{PK}},
      patient_id ${INT} NOT NULL,
      kind TEXT NOT NULL,
      enabled ${INT} NOT NULL DEFAULT 1,
      threshold ${REAL},
      sustained_minutes ${INT} NOT NULL DEFAULT 0,
      cooldown_minutes ${INT} NOT NULL DEFAULT 30,
      escalate_after_minutes ${INT} NOT NULL DEFAULT 10,
      channels_json ${JSON},
      label TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (patient_id, kind)
    )`,

    `CREATE TABLE IF NOT EXISTS alerts (
      id {{PK}},
      patient_id ${INT} NOT NULL,
      rule_id ${INT},
      kind TEXT NOT NULL,
      level TEXT NOT NULL,
      value ${REAL},
      threshold ${REAL},
      message TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      triggered_at TEXT NOT NULL,
      escalated_at TEXT,
      resolved_at TEXT,
      acknowledged_by ${INT},
      acknowledged_at TEXT,
      acknowledge_note TEXT,
      location_lat ${REAL},
      location_lon ${REAL},
      channels_json ${JSON},
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id {{PK}},
      alert_id ${INT},
      patient_id ${INT},
      user_id ${INT},
      channel TEXT NOT NULL,
      recipient TEXT,
      status TEXT NOT NULL DEFAULT 'queued',
      provider_ref TEXT,
      error TEXT,
      attempts ${INT} NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      acknowledged_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS notification_prefs (
      user_id ${INT} NOT NULL PRIMARY KEY,
      notify_push ${INT} NOT NULL DEFAULT 1,
      notify_sms ${INT} NOT NULL DEFAULT 1,
      notify_telegram ${INT} NOT NULL DEFAULT 1,
      notify_audible ${INT} NOT NULL DEFAULT 0,
      quiet_hours_start TEXT,
      quiet_hours_end TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS push_subscriptions (
      id {{PK}},
      user_id ${INT} NOT NULL,
      endpoint TEXT NOT NULL UNIQUE,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_agent TEXT,
      created_at TEXT NOT NULL,
      last_used_at TEXT
    )`,

    /* ------------------------------ telegram ----------------------------- */
    `CREATE TABLE IF NOT EXISTS telegram_links (
      id {{PK}},
      user_id ${INT},
      patient_id ${INT} NOT NULL,
      telegram_chat_id TEXT NOT NULL,
      telegram_username TEXT,
      telegram_display_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      verify_code TEXT,
      notify_low ${INT} NOT NULL DEFAULT 1,
      notify_high ${INT} NOT NULL DEFAULT 1,
      notify_critical ${INT} NOT NULL DEFAULT 1,
      notify_status ${INT} NOT NULL DEFAULT 1,
      notify_emergency ${INT} NOT NULL DEFAULT 1,
      notify_trend ${INT} NOT NULL DEFAULT 0,
      linked_at TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (patient_id, telegram_chat_id)
    )`,

    `CREATE TABLE IF NOT EXISTS telegram_link_tokens (
      id {{PK}},
      token TEXT NOT NULL UNIQUE,
      patient_id ${INT} NOT NULL,
      user_id ${INT} NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS telegram_messages (
      id {{PK}},
      chat_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      text TEXT,
      patient_id ${INT},
      user_id ${INT},
      created_at TEXT NOT NULL
    )`,

    /* --------------------------- billing -------------------------------- */
    `CREATE TABLE IF NOT EXISTS plans (
      id {{PK}},
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      tagline TEXT,
      price_cents ${INT} NOT NULL,
      price_from ${INT} NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'USD',
      billing_interval TEXT NOT NULL DEFAULT 'month',
      badge TEXT,
      highlight ${INT} NOT NULL DEFAULT 0,
      recipient_limit ${INT},
      patient_limit ${INT},
      features_json ${JSON},
      cta_label TEXT,
      cta_href TEXT,
      sort_order ${INT} NOT NULL DEFAULT 0,
      active ${INT} NOT NULL DEFAULT 1,
      updated_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS subscriptions (
      id {{PK}},
      org_id ${INT},
      patient_id ${INT},
      plan_id ${INT} NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      seats ${INT} NOT NULL DEFAULT 1,
      sms_allowance ${INT} NOT NULL DEFAULT 0,
      sms_used ${INT} NOT NULL DEFAULT 0,
      current_period_start TEXT,
      current_period_end TEXT,
      cancel_at_period_end ${INT} NOT NULL DEFAULT 0,
      provider TEXT,
      provider_ref TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )`,

    `CREATE TABLE IF NOT EXISTS payments (
      id {{PK}},
      subscription_id ${INT},
      org_id ${INT},
      amount_cents ${INT} NOT NULL,
      currency TEXT NOT NULL DEFAULT 'USD',
      status TEXT NOT NULL DEFAULT 'pending',
      provider TEXT,
      provider_ref TEXT,
      invoice_no TEXT,
      description TEXT,
      paid_at TEXT,
      created_at TEXT NOT NULL
    )`,

    /* --------------------------- operations ----------------------------- */
    `CREATE TABLE IF NOT EXISTS contact_requests (
      id {{PK}},
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      topic TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      ip TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id {{PK}},
      actor_id ${INT},
      actor_label TEXT,
      action TEXT NOT NULL,
      entity TEXT,
      entity_id TEXT,
      meta_json ${JSON},
      ip TEXT,
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS integration_logs (
      id {{PK}},
      provider TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT NOT NULL,
      message TEXT,
      meta_json ${JSON},
      created_at TEXT NOT NULL
    )`,

    `CREATE TABLE IF NOT EXISTS sync_state (
      id {{PK}},
      patient_id ${INT} NOT NULL,
      provider TEXT NOT NULL,
      last_success_at TEXT,
      last_attempt_at TEXT,
      last_error TEXT,
      consecutive_failures ${INT} NOT NULL DEFAULT 0,
      readings_ingested ${INT} NOT NULL DEFAULT 0,
      UNIQUE (patient_id, provider)
    )`,

    /* ---------------------------- indexes ------------------------------- */
    `CREATE INDEX IF NOT EXISTS idx_readings_patient_time ON glucose_readings (patient_id, taken_at)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_patient_time ON alerts (patient_id, triggered_at)`,
    `CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_alert ON notifications (alert_id)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications (created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_members_patient ON patient_members (patient_id)`,
    `CREATE INDEX IF NOT EXISTS idx_members_user ON patient_members (user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_telegram_chat ON telegram_links (telegram_chat_id)`,
    `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token_hash)`,
    `CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at)`,
  ];

  return raw.map((sql) => sql.replaceAll("{{PK}}", PK).replaceAll("{{JSON}}", JSON));
}
