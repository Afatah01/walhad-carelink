/**
 * Local demo keep-alive.
 *
 * The demo provider generates a deterministic trace relative to "now", so a
 * seeded database goes stale a few minutes after seeding. This script advances
 * every demo patient by two hours and runs the alert engine — useful while
 * clicking through the product locally.
 *
 *   npx tsx scripts/sync-demo.mts
 */
import { migrate } from "../src/lib/db/migrate";
import { syncPatient, syncablePatients } from "../src/lib/libre";
import { open } from "../src/lib/crypto";
import { evaluatePatient } from "../src/lib/alerts/engine";

const started = Date.now();
await migrate();
const patients = await syncablePatients();
let total = 0;
for (const p of patients) {
  const credential = open(p.credential_cipher);
  const res = await syncPatient(p, credential, 2).catch((err) => ({
    ok: false as const,
    ingested: 0,
    error: { message: String(err) },
  }));
  if (res.ok) {
    total += res.ingested;
    await evaluatePatient(p);
    console.log(`  ${p.display_name.padEnd(18)} +${res.ingested} readings`);
  } else {
    console.log(`  ${p.display_name.padEnd(18)} failed: ${(res as any).error?.message ?? "unknown"}`);
  }
}
console.log(`Synced ${total} readings across ${patients.length} patients in ${Date.now() - started}ms`);
process.exit(0);
