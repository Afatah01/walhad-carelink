import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient } from "@/lib/db/repo";
import { notificationsForPatients } from "@/lib/dashboard";
import { smsConfigured, pushConfigured } from "@/lib/notify/providers";
import { botToken } from "@/lib/notify/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  if (!patientId) return fail("patientId is required", 422);
  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const notifications = await notificationsForPatients([patientId], 80);
  return json({
    ok: true,
    notifications,
    system: {
      push: pushConfigured(),
      sms: smsConfigured(),
      telegram: Boolean(await botToken()),
    },
  });
});
