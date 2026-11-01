/**
 * Provision Walhad CareLink on Render through the Render REST API.
 *
 *   RENDER_API_KEY=rnd_... OWNER_ID=tea-... node scripts/provision-render.mjs
 *
 * Creates the Postgres database and the web service, then wires DATABASE_URL
 * between them. Safe to re-run: existing resources are detected by name and
 * reused rather than duplicated.
 *
 * Never commit a RENDER_API_KEY. Pass it through the environment only.
 */

const API = "https://api.render.com/v1";

const NAME = process.env.SERVICE_NAME ?? "walhad-carelink";
const DB_NAME = process.env.DB_SERVICE_NAME ?? "walhad-carelink-db";
const REGION = process.env.RENDER_REGION ?? "frankfurt";
const REPO = process.env.REPO_URL ?? "https://github.com/Afatah01/walhad-carelink";
const BRANCH = process.env.REPO_BRANCH ?? "main";

const KEY = process.env.RENDER_API_KEY;
const OWNER = process.env.OWNER_ID;

if (!KEY) {
  console.error("RENDER_API_KEY is not set.");
  process.exit(1);
}
if (!OWNER) {
  console.error(
    "OWNER_ID is not set. Find it in the Render dashboard: Workspace Settings → General → Workspace ID\n" +
      "(it looks like tea-XXXXXXXXXXXX).",
  );
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error page */
  }
  if (!res.ok) {
    const message = json?.message ?? json?.error ?? text.slice(0, 400);
    throw new Error(`${method} ${path} → ${res.status} ${message}`);
  }
  return json;
}

/** Render's list endpoints wrap entries as [{ service: {...} }, ...] or return bare arrays. */
function unwrap(list, key) {
  if (!Array.isArray(list)) return [];
  return list.map((entry) => (entry && typeof entry === "object" && key in entry ? entry[key] : entry));
}

function findByName(items, name) {
  return items.find((i) => i && (i.name === name || i.slug === name)) ?? null;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Poll until a predicate is satisfied or the deadline passes. */
async function waitFor(label, fn, predicate, timeoutMs = 420_000) {
  const started = Date.now();
  let last = null;
  while (Date.now() - started < timeoutMs) {
    last = await fn();
    if (predicate(last)) return last;
    process.stdout.write(`\r  ${label} … ${Math.round((Date.now() - started) / 1000)}s   `);
    await sleep(6_000);
  }
  console.log();
  throw new Error(`${label} did not reach the expected state in time. Last: ${JSON.stringify(last)?.slice(0, 300)}`);
}

async function main() {
  console.log(`\nWalhad CareLink → Render (${REGION})\n`);

  /* ------------------------------------------------------------------ */
  /* 1. Postgres                                                         */
  /* ------------------------------------------------------------------ */
  console.log("1/4  Looking for an existing database…");
  const dbs = unwrap(await call("GET", "/postgres?limit=50"), "postgres");
  let db = findByName(dbs, DB_NAME);

  if (db) {
    console.log(`     Reusing database ${db.name} (${db.id})`);
  } else {
    console.log(`     Creating free Postgres "${DB_NAME}"…`);
    db = await call("POST", "/postgres", {
      name: DB_NAME,
      ownerId: OWNER,
      plan: "free",
      region: REGION,
      version: "16",
      databaseName: "walhad_carelink",
      databaseUser: "walhad",
    });
    console.log(`     Created ${db.id}`);
  }

  console.log("     Waiting for the database to become available…");
  db = await waitFor(
    "database",
    async () => (await call("GET", `/postgres/${db.id}`)) ?? {},
    (d) => ["available", "ready"].includes(String(d.status ?? "").toLowerCase()),
  );
  console.log(`\n     Status: ${db.status}`);

  const connectionString =
    db.connectionString ??
    db.connectionInfo?.internalConnectionString ??
    db.connectionInfo?.externalConnectionString;
  if (!connectionString) {
    throw new Error("The database is available but no connectionString was returned.");
  }
  console.log(`     Internal URL: ${connectionString.replace(/:[^:@/]+@/, ":****@")}`);

  /* ------------------------------------------------------------------ */
  /* 2. Web service                                                      */
  /* ------------------------------------------------------------------ */
  const secret = process.env.APP_SECRET ?? [...crypto.getRandomValues(new Uint8Array(32))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const demoPassword = process.env.DEMO_PASSWORD ?? "CareLink2026!";

  const envVars = [
    { key: "NODE_VERSION", value: "20.20.2" },
    { key: "NODE_ENV", value: "production" },
    { key: "APP_SECRET", value: secret },
    { key: "SEED_DEMO", value: process.env.SEED_DEMO ?? "true" },
    { key: "DEMO_PASSWORD", value: demoPassword },
    { key: "DEMO_REFRESH_MINUTES", value: "10" },
    { key: "PGSSL", value: "true" },
    { key: "PG_POOL_MAX", value: "3" },
  ];

  console.log("\n2/4  Looking for an existing web service…");
  const services = unwrap(await call("GET", "/services?limit=50"), "service");
  let svc = findByName(services, NAME);

  const serviceSpec = {
    type: "web_service",
    name: NAME,
    ownerId: OWNER,
    repo: REPO,
    branch: BRANCH,
    autoDeploy: "yes",
    serviceDetails: {
      env: "node",
      plan: "free",
      region: REGION,
      envSpecificDetails: {
        buildCommand: "npm ci && npm run build",
        startCommand: "npm start",
      },
      healthCheckPath: "/api/health",
    },
  };

  if (svc) {
    console.log(`     Reusing service ${svc.name} (${svc.id}) — updating settings`);
    await call("PATCH", `/services/${svc.id}`, {
      serviceDetails: serviceSpec.serviceDetails,
      branch: BRANCH,
      autoDeploy: "yes",
    });
  } else {
    console.log(`     Creating web service "${NAME}" from ${REPO}…`);
    svc = await call("POST", "/services", serviceSpec);
    console.log(`     Created ${svc.id}`);
  }

  /* ------------------------------------------------------------------ */
  /* 3. Environment variables                                            */
  /* ------------------------------------------------------------------ */
  console.log("\n3/4  Wiring environment variables…");
  const existing = await call("GET", `/services/${svc.id}/env-vars?limit=100`);
  const have = new Set(unwrap(existing, "envVar").map((e) => e.key));
  const toAdd = envVars.filter((e) => !have.has(e.key));
  if (toAdd.length) {
    await call("PUT", `/services/${svc.id}/env-vars`, toAdd);
    console.log(`     Set ${toAdd.map((e) => e.key).join(", ")}`);
  } else {
    console.log("     Already set");
  }

  // DATABASE_URL is managed separately so a re-run never clobbers it.
  const dbVar = unwrap(existing, "envVar").find((e) => e.key === "DATABASE_URL");
  if (!dbVar) {
    await call("POST", `/services/${svc.id}/env-vars`, {
      envVar: { key: "DATABASE_URL", value: connectionString },
    });
    console.log("     Set DATABASE_URL from the new database");
  } else {
    console.log("     DATABASE_URL already present — left untouched");
  }

  // The public URL is only known once Render assigns it; set it now if we can.
  const url = svc.serviceDetails?.url ?? `https://${NAME}.onrender.com`;
  const urlVar = unwrap(existing, "envVar").find((e) => e.key === "APP_BASE_URL");
  if (!urlVar) {
    await call("POST", `/services/${svc.id}/env-vars`, {
      envVar: { key: "APP_BASE_URL", value: url },
    });
    console.log(`     Set APP_BASE_URL=${url}`);
  }

  /* ------------------------------------------------------------------ */
  /* 4. Deploy                                                           */
  /* ------------------------------------------------------------------ */
  console.log("\n4/4  Triggering a deploy…");
  const deploy = await call("POST", `/services/${svc.id}/deploys`, { clearCache: "do_not_clear" });
  console.log(`     Deploy ${deploy.id} started`);

  console.log("\nWaiting for the first build (this takes a few minutes)…");
  await waitFor(
    "deploy",
    async () => (await call("GET", `/services/${svc.id}/deploys/${deploy.id}`)) ?? {},
    (d) => ["live", "build_failed", "canceled", "deactivated"].includes(String(d.status ?? "").toLowerCase()),
    900_000,
  ).then((d) => {
    console.log(`\n     Result: ${d.status}`);
    if (d.status !== "live") {
      console.log("     Check the Render logs for the failure reason.");
      process.exitCode = 1;
    }
  });

  const finalSvc = await call("GET", `/services/${svc.id}`);
  const liveUrl = finalSvc.serviceDetails?.url ?? `https://${NAME}.onrender.com`;

  console.log(`\n──────────────────────────────────────────────────────────
  URL         ${liveUrl}
  Health      ${liveUrl}/api/health
  Keep-alive  ${liveUrl}/api/keepalive
  Database    ${db.name} (${db.plan}) — FREE TIER, expires ~30 days after creation

  Demo logins (password "${demoPassword}"):
    aisha@walhadcarelink.demo      patient
    doctor@walhadcarelink.demo     clinician
    admin@walhadcarelink.demo      administrator

  Next: put ${liveUrl} into docs/github-workflows/keepalive.yml as
  DEFAULT_URL so the free instance stays awake.
──────────────────────────────────────────────────────────\n`);
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}\n`);
  process.exit(1);
});
