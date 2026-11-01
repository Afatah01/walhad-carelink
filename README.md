# Walhad CareLink

**Connected Families. Safer Together.**

Walhad CareLink is a working glucose-monitoring and family-alert platform built around FreeStyle Libre data. A patient's authorised Libre feed is mirrored to a live dashboard; when glucose moves out of range, their care circle is notified by Telegram, SMS, push, in-app message and audible alert. Hospitals get a ward-level console for the same data.

This is an application, not a mockup: every screen you see is reading and writing a real database.

---

## What is included

**Marketing site** — Home, About Us, Our Products, How It Works, Features, Pricing Plans, Hospital Solutions, Contact Us, FAQ, Privacy, Terms. English / Somali / Arabic with a visible language selector (Arabic switches the layout to RTL).

**Patient & family dashboard** (`/dashboard`)
- Current reading in mg/dL *and* mmol/L with trend arrow, sensor status and last-sync time
- 24-hour curve and 7/30/90-day history, time-in-range, variability, estimated GMI
- Explicit `live / recent / stale / missing` freshness states — **an old reading is never presented as live**
- Alerts & rules: thresholds, acknowledgement, notification-type toggles
- Notification centre: every alert, delivery attempt, acknowledgement and connection warning
- Family & caregivers: invite by email, per-recipient channels and location permission
- Telegram alerts: bot status, recipient list, linking codes, test button, delivery log
- Location sharing: opt-in, permission-gated, revocable
- Plan & billing: current plan, SMS allowance, invoices, plan changes
- Settings: profile, units, thresholds, notification channels, security activity

**Hospital console** (`/hospital`) — total patients, attention needed, critical alerts, active connections, monitored-patient table, recent notifications, Telegram status, channel health, staff activity and care team. Access is limited to clinicians and administrators; every view is audited.

**Admin console** (`/admin`) — plans, subscriptions, organisations, staff, contact enquiries, audit log and integration events. Includes Telegram webhook registration.

**Telegram bot** — `/start /help /status /glucose /history /alerts /settings /acknowledge /disconnect`, one-time linking codes (20-minute TTL), per-recipient notification preferences, delivery-error tracking, all ten notification classes (low, high, critical, emergency, trend, sensor disconnected, missing sync, escalation, hospital, subscription).

---

## Quick start

```bash
npm install
cp .env.example .env          # then set APP_SECRET
npm run db:migrate            # create the schema
npm run db:seed               # demo organisation, staff and 8 patients
npm run dev                   # http://localhost:3000
```

Demo accounts (password from `DEMO_PASSWORD`, default `CareLink2026!`):

| Role | Email |
| --- | --- |
| Patient | `aisha@walhadcarelink.demo` |
| Family | `abdullahi@walhadcarelink.demo`, `hodan@walhadcarelink.demo` |
| Clinician | `doctor@walhadcarelink.demo`, `nurse@walhadcarelink.demo` |
| Admin | `admin@walhadcarelink.demo` |

The demo provider generates a realistic 14-day trace relative to *now*. If the seeded data goes stale while you are clicking around, run `npm run sync:demo` to advance it.

```bash
npm test          # 16 unit tests (glucose maths, crypto, plans, i18n)
npm run typecheck # tsc --noEmit
npm run build     # production build
```

---

## Deploying to GitHub + Render

1. Push the repository to GitHub (`.gitignore` keeps `.env`, databases and build output out of git).
2. In Render choose **New + → Blueprint** and select the repo — `render.yaml` provisions a web service and a Postgres database.
3. Fill in the values marked `sync: false`: `APP_BASE_URL` (your `https://…onrender.com` URL), `DEMO_PASSWORD`, and optionally the Telegram / VAPID / Twilio / payment / contact values.
4. Render runs `npm run db:migrate && npm run db:seed && npm start`; the health check is `GET /api/health`.

Without a database the app falls back to a local SQLite file, which is fine for a preview but not for production. Set `DATABASE_URL` to the Render **Internal Database URL**.

**Telegram on Render**

```bash
TELEGRAM_BOT_TOKEN=123456:ABC… APP_BASE_URL=https://your-app.onrender.com \
  npm run telegram:set-webhook
```

Or press **Register webhook** in the admin console. The secret header is generated and stored automatically; the webhook endpoint rejects anything without it.

**Scheduled sync** — create a Render Cron Job (`*/5 * * * *`) hitting `GET /api/cron/sync` with `Authorization: Bearer $CRON_SECRET`. Every patient is polled, new readings stored and the alert engine run, so alerts leave the platform without a browser open.

---

## Architecture

```
src/app/(site)      marketing pages          src/lib/db        portable schema + repositories
src/app/(auth)      sign-in                  src/lib/libre     provider abstraction (demo/LibreView/LibreLinkUp/bridge)
src/app/dashboard   patient & family app     src/lib/alerts    rule evaluation, escalation, acknowledgement
src/app/hospital    clinical console         src/lib/notify    Telegram bot, SMS, push, dispatch
src/app/admin       workspace admin          src/lib/billing   plans, subscriptions, verified payments
src/app/api         JSON APIs, cron, webhooks
```

- **One SQL layer, two dialects.** The same repository code runs on SQLite (zero-config local) and PostgreSQL (Render).
- **Provider abstraction.** Abbott's official LibreView API is partner-gated; the LibreLinkUp consent flow is the practical alternative. Neither is hard-wired into the UI — swap credentials in `.env` and the rest of the platform is unchanged. **Patients' Libre passwords are never stored**; only an encrypted provider token.
- **Pricing is data.** Plans, prices, feature lists, recipient limits and badges live in the `plans` table and are read by the marketing grid, the billing page and the subscription engine. Nothing is duplicated in components.
- **Payments are verified.** `createSubscription` writes a `pending` row and a pending invoice. Only a provider callback to `/api/billing/webhook` (secret-checked) can activate it. Invoice numbers follow `WC-YYYYMM-#####`.

### Security posture (HIPAA-minded)

| Area | Implementation |
| --- | --- |
| Transport | HTTPS enforced by the host; HSTS + security headers in `next.config.ts` |
| Passwords | bcrypt, never returned by any API |
| Sessions | signed HTTP-only cookies, 30-day rolling expiry, hashed tokens in the database |
| Access control | per-patient RBAC: patient, family member, nurse, doctor, admin — with separate manage / acknowledge / location permissions |
| Data at rest | provider credentials encrypted with AES-256-GCM derived from `APP_SECRET` |
| Secrets | environment only — the Telegram token never reaches the browser |
| Input validation | zod on every mutating endpoint |
| Rate limiting | login and public endpoints |
| Audit | every access, acknowledgement, permission change and admin action is logged with actor, entity and timestamp |
| Webhooks | constant-time secret comparison for Telegram and payments |
| PHI | restricted to authorised recipients; sensitive detail is never pushed to unlinked chats |

Alerts support care decisions. They are not a guaranteed emergency medical response, and in-app sound only works while a dashboard tab is open.

---

## Environment variables

See `.env.example` for the full annotated list. The essentials:

| Variable | Purpose |
| --- | --- |
| `APP_BASE_URL` | Public HTTPS URL (webhooks, deep links) |
| `APP_SECRET` | Session signing + credential encryption |
| `DATABASE_URL` | Postgres connection string (empty → SQLite) |
| `SEED_DEMO` / `DEMO_PASSWORD` | Demo workspace and its password |
| `TELEGRAM_BOT_TOKEN` | Bot API token (server only) |
| `VAPID_*` | Web push keys |
| `TWILIO_*` or `SMS_HTTP_*` | SMS delivery |
| `PAYMENT_CHECKOUT_URL`, `PAYMENT_WEBHOOK_SECRET` | Payment provider |
| `CONTACT_EMAIL/PHONE/ADDRESS/HOURS` | Public contact details — left blank, nothing is shown |

No phone number, email address or business address is invented anywhere in the product; these come from configuration.

---

## Limitations, stated plainly

- Abbott partner credentials are required for live LibreView data. Until they are issued the app runs on the clearly-labelled demo provider or the LibreLinkUp consent flow.
- Data availability depends on the sensor, the Libre apps, the API and the sync interval — the UI says so on every relevant screen.
- SMS delivery depends on a configured provider and an included allowance; Telegram and push are included on all plans.
- Background audio and browser notifications are constrained by the operating system; they are paired with Telegram and SMS rather than relied on alone.
- The hospital plan is priced **from** $100/month — capacity is quoted, not unlimited.

## License

Proprietary. © Walhad CareLink.
