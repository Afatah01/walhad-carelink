# Technical audit — 2026-11-04

## Already working (preserved, not replaced)
- PostgreSQL schema (25 tables), idempotent migrations, boot provisioning.
- Session auth (httpOnly cookie, hashed tokens), `patientsForUser` RBAC including
  org-scoped clinician access. Verified: cross-tenant reads return 403.
- Alert engine: rule evaluation, dedupe, cooldown, escalation, acknowledgement.
  Verified: a controlled 48 mg/dL reading raised a `very-low` critical alert,
  acknowledgement persisted.
- Notification dispatch with truthful per-channel status. Verified: unconfigured
  channels record `skipped` with the real reason (no VAPID keys, no phone number,
  no Telegram link) — never "delivered".
- Telegram Bot API client + webhook + linking flow.
- Billing: pending-subscription model that refuses to activate without verified
  payment.

## Broken or missing (fixed in this pass)
1. **Bridge provider was a stub.** `bridgeProvider.fetchSnapshot` returned
   `connected: true` with **zero readings**, and `/api/sync` short-circuited
   bridge patients claiming "readings push automatically" — but no ingest
   endpoint existed anywhere in the codebase. A patient could be "connected"
   and receive nothing, forever.
   Fixed: real poll adapter + `POST /api/bridge/ingest` (per-patient SHA-256
   bridge key), and `/api/sync` now polls and evaluates alerts.
2. **Timestamp corruption.** The live bridge's `history[].t` runs ~3h ahead of
   its own `reading_time`. Readings were stored in the future and displayed as
   "in 3 hours". Fixed: anchor the series on the authoritative timestamp, and
   reject any reading dated more than 90s ahead at the storage layer.
3. **No hospital provisioning API.** Organisations/Staff tabs were read-only;
   there was no way to create a hospital or a clinician account.
   Fixed: `POST/GET /api/orgs` creating a hospital plus its clinical lead.
4. **Schema drift on existing databases.** `CREATE TABLE IF NOT EXISTS` cannot
   add columns. Added an additive column-migration step.

## Still requires external credentials (cannot be completed independently)
- LibreView Data Sharing API — needs Abbott partner approval.
- SMS — needs Twilio or an HTTP SMS gateway.
- Web push — needs VAPID keys.
- Payments — needs a provider account; activation stays blocked until a verified
  payment arrives.
