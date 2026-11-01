import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient, patientsForUser, getSetting } from "@/lib/db/repo";
import { buildDashboard } from "@/lib/dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const requested = intParam(req, "patientId", 0, 0);
  let access = null;
  if (requested) {
    access = await accessForPatient(user.id, user.role, requested);
    if (!access) return fail("You do not have access to this patient.", 403);
  } else {
    const all = await patientsForUser(user.id, user.role);
    access = all[0] ?? null;
  }
  if (!access) return fail("No patient profile is linked to this account yet.", 404);

  const payload = await buildDashboard(access, user);
  const botUsername = (await getSetting("telegram_bot_username")) ?? process.env.TELEGRAM_BOT_USERNAME ?? null;

  // Never leak provider credentials to the client.
  return json({
    ok: true,
    data: payload,
    meta: {
      botUsername: botUsername?.replace(/^@/, "") ?? null,
      demoData: access.patient.provider === "demo",
      generatedAt: Date.now(),
      accessRole: access.role,
      canViewLocation: access.canViewLocation,
    },
  });
});
