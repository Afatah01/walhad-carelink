/**
 * Seed the demo workspace: organisation, staff, patients, 14 days of readings,
 * alert rules, plans and a demo subscription.
 *
 *   SEED_DEMO=true npx tsx scripts/seed.mts
 */
import { ensureSeed } from "../src/lib/seed";

// Seeding is opt-in: a real deployment sets SEED_DEMO=false and this becomes a no-op.
if ((process.env.SEED_DEMO ?? "true").toLowerCase() === "false") {
  console.log("SEED_DEMO=false — skipping demo seed.");
  process.exit(0);
}

const result = await ensureSeed();
console.log(JSON.stringify(result, null, 2));
process.exit(0);
