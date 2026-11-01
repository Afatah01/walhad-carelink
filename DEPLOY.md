# Deployment — Render **free tier**

Repository: **https://github.com/Afatah01/walhad-carelink** (branch `main`)
Blueprint: `render.yaml` — Hobby workspace, **no credit card, nothing billed**

---

## Read this first: what "free" actually costs you

Render's own docs say free instances should not run production applications. Three limits matter
for a glucose monitor, and the app has been adapted to each:

| Limit | Reality | What this repo does about it |
| --- | --- | --- |
| **Spins down after 15 min idle** | Next request waits ~60 s for a cold start | `.github/workflows/keepalive.yml` pings every 5 min (free, no card) |
| **No cron jobs on Free** | Nothing can run on a schedule | The app syncs itself **on wake-up** (`src/lib/boot.ts`) — new readings pulled, alert engine run, notifications sent |
| **Free Postgres expires after 30 days** | Then a 14-day grace period, then **deleted with all data** | Documented migration path below — plan for it, or attach an external database that does not expire |
| **Ephemeral filesystem** | Written files vanish on redeploy / spin-down | All state lives in Postgres. **Do not use the SQLite fallback on Render** |
| **512 MB RAM, 0.1 CPU** | Enough for this app, not for load testing | `PG_POOL_MAX=3` keeps connections modest |

If a demonstration suddenly going offline would be a problem for a patient, this tier is the wrong
place for it. That is a clinical-safety statement, not a hosting preference.

---

## 1. Deploy

1. <https://dashboard.render.com/blueprints> → **New Blueprint Instance**
2. Connect GitHub → pick `Afatah01/walhad-carelink` → Render reads `render.yaml`
3. Fill in the `sync: false` values:

| Variable | Value |
| --- | --- |
| `APP_BASE_URL` | `https://<your-service>.onrender.com` (check the real subdomain after the first deploy) |
| `DEMO_PASSWORD` | a password you choose for the demo logins |
| `SEED_DEMO` | `true` for a demo, `false` for real use |
| `CONTACT_*` | your real contact details — blank means "not shown", never invented |

4. **Apply.** The build takes ~4–6 minutes.

No `db:migrate` or `db:seed` in the start command — a free Postgres is not reachable in the way a
build needs, and more importantly it arrives *empty*. The app provisions itself on the first
request:

```
first request → migrate() → seed (if SEED_DEMO) → refresh demo data → render page
```

You can watch this happen in the Render log:

```
[boot] demo workspace seeded (created)
[boot] refreshed 288 demo readings across 8 patients
```

## 2. Keep it awake (2 minutes)

Repo → **Settings → Secrets and variables → Actions → New repository secret**

- Name: `APP_URL`
- Value: `https://<your-service>.onrender.com`

Then **Actions → Keep-alive → Enable workflow**.

Every 5 minutes it calls `GET /api/keepalive` (returns `204`, touches the database, triggers the
lazy sync) and prints `GET /api/health` so failures are visible. This also stops the 60-second cold
start that would otherwise greet every visitor.

## 3. Optional: Telegram

Needs a public HTTPS URL, so it is a post-deploy step:

```bash
TELEGRAM_BOT_TOKEN=123456:ABC... \
APP_BASE_URL=https://<your-service>.onrender.com \
  npm run telegram:set-webhook
```

Or sign in as the admin account → `/admin` → Integrations → **Register webhook**.

---

## The 30-day database problem

Free Postgres is deleted ~44 days after creation, with all patients, alerts and audit history.
Render emails you before each deadline. Three options:

### A. Migrate to a new free database every 30 days (free, manual)

```bash
# 1. Export before expiry — use the EXTERNAL connection string from the Render dashboard
pg_dump --no-owner --no-acl "$OLD_EXTERNAL_URL" > walhad-backup.sql

# 2. Create a new free Postgres in Render, copy its External URL, then restore
psql "$NEW_EXTERNAL_URL" -f walhad-backup.sql

# 3. In the web service's environment, point DATABASE_URL at the new database
#    (Environment → edit → save, which triggers a redeploy)
```

About 10 minutes. The schema and data survive; the app needs no changes. Keep the `.sql` file
somewhere safe — it contains patient data.

### B. Use a database that does not expire (recommended, still free)

Neon, Supabase and Aiven all offer free PostgreSQL without a 30-day deletion. Create one, then in
Render set:

- `DATABASE_URL` → the provider's connection string (keep `?sslmode=require`)
- `PGSSL` → `true`

Delete the `databases:` block from `render.yaml` so Render stops provisioning its own. This is the
cleanest free setup: stable data, free web tier.

> ⚠️ Never point the app at SQLite on Render. The filesystem is wiped on every spin-down, so the
> database — and every reading — disappears the moment the service sleeps.

### C. Upgrade just the database

Render's cheapest paid Postgres is ~$6–7/month and does not expire. The web service can stay free.
This is the smallest amount of money that removes the data-loss risk.

---

## Local development

```bash
npm install
cp .env.example .env      # set APP_SECRET
npm run db:migrate && npm run db:seed
npm run dev
```

Demo logins (password = `DEMO_PASSWORD`, default `CareLink2026!`):
`aisha@`, `abdullahi@`, `hodan@`, `doctor@`, `nurse@`, `admin@` + `walhadcarelink.demo`

`npm run sync:demo` advances the simulated sensor; on Render this happens automatically on wake.

## Before every push

```bash
npm run typecheck   # tsc --noEmit
npm test            # 16 unit tests
npm run build       # production build
```

`.github/workflows/ci.yml` runs all three on every push and pull request, free on public repos.

## Endpoints worth knowing

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Render health check; reports schema, seed state and latest reading age |
| `GET /api/keepalive` | `204`, no body — what the pinger hits |
| `GET /api/cron/sync` | Full scheduled sync (`Bearer $CRON_SECRET`) — for when you are on a paid plan with real cron |
| `POST /api/telegram/webhook` | Telegram updates, secret-header verified |
| `POST /api/billing/webhook` | Payment confirmations, secret-header verified |
