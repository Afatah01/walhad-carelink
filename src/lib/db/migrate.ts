import { db } from "./client";
import { schemaStatements } from "./schema";

let migrated = false;
let migrating: Promise<void> | null = null;

/** Idempotent schema creation, cached per process. */
export async function migrate(): Promise<void> {
  if (migrated) return;
  if (migrating) return migrating;
  migrating = (async () => {
    const d = db();
    for (const stmt of schemaStatements(d.dialect)) {
      await d.run(stmt);
    }
    migrated = true;
  })();
  try {
    await migrating;
  } finally {
    migrating = null;
  }
}
