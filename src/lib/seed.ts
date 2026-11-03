import { migrate } from "./db/migrate";
import { db } from "./db/client";
import { nowIso, num } from "./db/repo-util";
import { setSetting, getSetting, createOrg, createUser } from "./db/repo";
import { upsertPlan, DEFAULT_PLANS } from "./billing/plans";

export interface SeedAccount {
  email: string;
  password: string;
  role: string;
  label: string;
}

export interface SeedResult {
  created: boolean;
  accounts: SeedAccount[];
}

const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "CareLink2026!";

/**
 * Provision the workspace.
 *
 * This creates **plans only** — the pricing catalogue the marketing site and
 * billing engine read from. It deliberately creates no patients, no readings,
 * no alerts and no staff accounts: the platform ships empty and fills with real
 * data once a Libre provider is connected.
 *
 * Set BOOTSTRAP_ADMIN_EMAIL + BOOTSTRAP_ADMIN_PASSWORD to create the first
 * administrator (see ensureAdmin), and CREATE_DEMO_ACCOUNTS=true to generate the
 * labelled evaluation accounts used in the public demo.
 */
export async function ensureSeed(): Promise<SeedResult> {
  await migrate();
  const already = await getSetting("seed_version");

  // One-time cleanup. Versions 1 and 2 invented patients, readings and staff
  // accounts. Nobody's real data can predate a connected Libre source, so when
  // we find an old version we remove everything clinical exactly once.
  if (already === "1" || already === "2") {
    await purgeFabricatedData();
  }

  if (already !== "3") {
    for (const plan of DEFAULT_PLANS) await upsertPlan(plan as any);
    await setSetting("seed_version", "3");
  }

  const accounts: SeedAccount[] = [];
  const admin = await ensureAdmin();
  if (admin) accounts.push(admin);

  if (demoAccountsEnabled()) {
    accounts.push(...(await ensureDemoAccounts()));
  }

  return { created: accounts.length > 0, accounts };
}

/**
 * Delete every row the old demo seeder created: patients, readings, alerts,
 * sync state, memberships, notifications and the @walhadcarelink.demo accounts.
 * Plans and the schema are left untouched. Idempotent.
 */
export async function purgeFabricatedData(): Promise<{ removed: Record<string, number> }> {
  const removed: Record<string, number> = {};
  const tables = [
    "notifications",
    "alerts",
    "alert_rules",
    "glucose_readings",
    "sync_state",
    "patient_members",
    "clinician_assignments",
    "telegram_link_tokens",
    "telegram_messages",
    "telegram_links",
    "patients",
    "payments",
    "subscriptions",
    "contact_requests",
    "audit_logs",
    "integration_logs",
  ];
  for (const table of tables) {
    try {
      const row = await db().get<any>(`SELECT COUNT(*) AS n FROM ${table}`);
      await db().run(`DELETE FROM ${table}`);
      removed[table] = num(row?.n);
    } catch {
      // Table may not exist in very old schemas — nothing to purge.
    }
  }
  try {
    const demoUsers = await db().query<any>(
      "SELECT id, email FROM users WHERE email LIKE ?",
      ["%@walhadcarelink.demo"],
    );
    for (const u of demoUsers) {
      await db().run("DELETE FROM sessions WHERE user_id = ?", [u.id]);
      await db().run("DELETE FROM users WHERE id = ?", [u.id]);
    }
    removed.users = demoUsers.length;
  } catch {
    /* sessions table may be absent on a fresh install */
  }
  return { removed };
}

function demoAccountsEnabled(): boolean {
  const flag = (process.env.CREATE_DEMO_ACCOUNTS ?? "").toLowerCase();
  if (flag === "true") return true;
  // Kept for backwards compatibility with earlier deployments.
  return (process.env.SEED_DEMO ?? "false").toLowerCase() === "true";
}

/* ------------------------------------------------------------------ */
/* First administrator                                                 */
/* ------------------------------------------------------------------ */

/**
 * Create the bootstrap administrator from environment variables.
 *
 * There is no public sign-up: an operator provisions the first account, signs
 * in, and adds everybody else from the admin console. If the variables are
 * absent nothing happens and the app simply has no accounts yet.
 */
async function ensureAdmin(): Promise<SeedAccount | null> {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return null;

  const existing = await db().get<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
  if (existing) {
    return { email, password, role: "admin", label: "Administrator (already existed)" };
  }

  await createOrg({ name: "Walhad CareLink", type: "family" }).catch(() => null);
  const orgRow = await db().get<{ id: number }>("SELECT id FROM organizations WHERE type = 'family' ORDER BY id LIMIT 1");

  try {
    await createUser({
      email,
      name: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator",
      password,
      role: "admin",
      orgId: orgRow?.id ?? null,
      title: "Platform administrator",
    });
  } catch (err) {
    // Two requests can boot at the same time; whoever loses the race finds the
    // row already there, which is exactly the desired end state.
    const now = await db().get<{ id: number }>("SELECT id FROM users WHERE email = ?", [email]);
    if (now) return { email, password, role: "admin", label: "Administrator (already existed)" };
    throw err;
  }

  await db().run(
    `INSERT INTO audit_logs (actor_id, actor_label, action, entity, entity_id, meta_json, ip, created_at)
     VALUES (NULL, 'system', 'bootstrap.admin', 'users', ?, NULL, NULL, ?)`,
    [email, nowIso()],
  );

  return { email, password, role: "admin", label: "Administrator (created from environment)" };
}

/* ------------------------------------------------------------------ */
/* Optional evaluation accounts                                        */
/* ------------------------------------------------------------------ */

/**
 * Labelled demo accounts for the public evaluation deployment.
 *
 * These have **no patient records and no glucose readings**. They exist so a
 * reviewer can sign in and see the empty state, the Telegram linking flow and
 * the admin console. Every glucose number displayed in the product comes from a
 * real provider connection or is absent.
 */
async function ensureDemoAccounts(): Promise<SeedAccount[]> {
  const orgId = await ensureDemoOrg();
  const people = [
    { email: "patient@walhadcarelink.demo", name: "Demo Patient", role: "patient", title: "Primary patient" },
    { email: "family@walhadcarelink.demo", name: "Demo Family Member", role: "family", title: "Family contact" },
    { email: "admin@walhadcarelink.demo", name: "Demo Administrator", role: "admin", title: "Platform administrator" },
  ];

  const out: SeedAccount[] = [];
  for (const person of people) {
    const existing = await db().get<{ id: number }>("SELECT id FROM users WHERE email = ?", [person.email]);
    if (!existing) {
      await createUser({
        email: person.email,
        name: person.name,
        password: DEMO_PASSWORD,
        role: person.role as any,
        orgId,
        title: person.title,
      });
    }
    out.push({ email: person.email, password: DEMO_PASSWORD, role: person.role, label: `${person.name} — ${person.title}` });
  }
  return out;
}

async function ensureDemoOrg(): Promise<number> {
  const found = await db().get<{ id: number }>("SELECT id FROM organizations WHERE name = ?", ["Demo Workspace"]);
  if (found) return found.id;
  const created = await createOrg({ name: "Demo Workspace", type: "family" });
  return created.id;
}

/* ------------------------------------------------------------------ */
/* Empty-database check used by the boot routine                       */
/* ------------------------------------------------------------------ */

export async function hasAnyPatient(): Promise<boolean> {
  const row = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM patients");
  return num(row?.c) > 0;
}
