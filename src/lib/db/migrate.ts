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
export async function migrate(): Promise<void> {
  if (migrated) return;
  if (migrating) return migrating;
  migrating = (async () => {
    const d = db();
    for (const stmt of schemaStatements(d.dialect)) {
      await d.run(stmt);
    }
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
