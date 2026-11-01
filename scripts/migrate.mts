/** Create or update the schema for the configured database. */
import { migrate } from "../src/lib/db/migrate";
import { db } from "../src/lib/db/client";

await migrate();
const tables = process.env.DATABASE_URL
  ? "postgres"
  : (
      await db().query<{ c: number }>("SELECT COUNT(*) AS c FROM sqlite_master WHERE type='table'")
    )[0]?.c ?? 0;
console.log(`Schema ready (${tables} tables).`);
process.exit(0);
