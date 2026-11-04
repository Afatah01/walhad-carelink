import { db } from "./client";
import { schemaStatements } from "./schema";

let migrated = false;
let migrating: Promise<void> | null = null;

/**
 * Idempotent schema creation, cached per process.
 *
 * Every statement is `CREATE ... IF NOT EXISTS`, so running this against an
 * existing database is a no-op. The applied marker is recorded in
 * `schema_migrations` partly for observability and partly so a brand-new free
 * Postgres instance (which arrives completely empty) provisions itself on the
 * first request after a deploy.
 */
/**
 * Additive column migrations.
 *
 * `CREATE TABLE IF NOT EXISTS` cannot add a column to a table that already
 * exists, so each later change is listed here and applied once. Both engines
 * report the current columns, so this is safe to run on every boot.
 */
const COLUMN_ADDITIONS: { table: string; column: string; type: string }[] = [
  // Bridge telemetry reported by the phone bridge on every POST.
  { table: "patients", column: "sensor_status", type: "TEXT" },
  { table: "patients", column: "bridge_status", type: "TEXT" },
  { table: "patients", column: "bridge_battery", type: "INTEGER" },
  // Which provider last wrote to sync_state, and when the bridge last spoke.
  { table: "glucose_readings", column: "received_at", type: "TEXT" },
];

async function existingColumns(table: string): Promise<Set<string>> {
  const d = db();
  if (d.dialect === "pg") {
    const rows = await d.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = ?`,
      [table],
    );
    return new Set(rows.map((r) => r.column_name));
  }
  const rows = await d.query<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((r) => r.name));
}

async function applyColumnAdditions(): Promise<void> {
  const cache = new Map<string, Set<string>>();
  for (const { table, column, type } of COLUMN_ADDITIONS) {
    if (!cache.has(table)) cache.set(table, await existingColumns(table));
    const cols = cache.get(table)!;
    if (cols.has(column)) continue;
    try {
      await db().run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
      cols.add(column);
    } catch {
      // Another instance won the race, or the table does not exist yet.
    }
  }
}

export async function migrate(): Promise<void> {
  if (migrated) return;
  if (migrating) return migrating;
  migrating = (async () => {
    const d = db();
    for (const stmt of schemaStatements(d.dialect)) {
      await d.run(stmt);
    }
    await applyColumnAdditions();
    await d.run(
      `INSERT INTO schema_migrations (name, dialect, applied_at) VALUES (?, ?, ?)
       ON CONFLICT (name) DO NOTHING`.replace(
        // SQLite does not accept ON CONFLICT target-less syntax before 3.24; both
        // engines here support the modern form, but INSERT OR IGNORE is portable.
        "INSERT INTO",
        d.dialect === "pg" ? "INSERT INTO" : "INSERT OR IGNORE INTO",
      ),
      [d.dialect === "pg" ? "0001_init_pg" : "0001_init_sqlite", d.dialect, new Date().toISOString()],
    ).catch(() => {});
    migrated = true;
  })();
  try {
    await migrating;
  } finally {
    migrating = null;
  }
}
