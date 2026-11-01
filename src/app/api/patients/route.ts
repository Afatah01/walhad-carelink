import { json, route } from "@/lib/api";
import { patientsForUser } from "@/lib/db/repo";
import { latestReading } from "@/lib/db/repo-glucose";
import { classify, convert, freshness } from "@/lib/glucose";
import { patientThresholds } from "@/lib/db/repo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ user }) => {
  const access = await patientsForUser(user.id, user.role);
  const items = [];
  for (const a of access) {
    const latest = await latestReading(a.patient.id);
    const thresholds = await patientThresholds(a.patient);
    items.push({
      id: a.patient.id,
      name: a.patient.display_name,
      relationship: a.patient.relationship,
      unit: a.patient.unit,
      role: a.role,
      canManage: a.canManage,
      provider: a.patient.provider,
      latest: latest
        ? {
            value: convert(latest.value, a.patient.unit),
            takenAt: latest.takenAt,
            level: classify(latest.value, thresholds),
            freshness: freshness(latest.takenAt),
          }
        : null,
    });
  }
  return json({ ok: true, patients: items });
});
