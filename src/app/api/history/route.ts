import { fail, intParam, json, route } from "@/lib/api";
import { accessForPatient, patientThresholds } from "@/lib/db/repo";
import { readingsSince } from "@/lib/db/repo-glucose";
import { computeStats, dailyAverages, hourlyAverages } from "@/lib/glucose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = route(async ({ req, user }) => {
  const patientId = intParam(req, "patientId", 0, 0);
  const hours = intParam(req, "hours", 168, 1, 24 * 120);
  if (!patientId) return fail("patientId is required", 422);

  const access = await accessForPatient(user.id, user.role, patientId);
  if (!access) return fail("You do not have access to this patient.", 403);

  const now = Date.now();
  const readings = await readingsSince(patientId, now - hours * 3_600_000, 20000);
  const thresholds = await patientThresholds(access.patient);

  const stats = computeStats(readings);
  const series =
    hours <= 24
      ? hourlyAverages(readings, 24, now)
      : readings.map((r) => ({ t: r.takenAt, v: r.value, trend: r.trend }));
  const daily = dailyAverages(readings, Math.min(90, Math.ceil(hours / 24)), now);

  const tir = [
    { id: "very-high", label: "Very high", value: stats.tarVeryHigh, color: "#b55d0c" },
    { id: "high", label: "High", value: Math.max(0, Math.round((stats.tar - stats.tarVeryHigh) * 10) / 10), color: "#d98324" },
    { id: "in-range", label: "In range", value: stats.tir, color: "#0f9d76" },
    { id: "low", label: "Low", value: Math.max(0, Math.round((stats.tbr - stats.tbrVeryLow) * 10) / 10), color: "#d64545" },
    { id: "very-low", label: "Very low", value: stats.tbrVeryLow, color: "#b3261e" },
  ].filter((x) => x.value > 0);

  return json({
    ok: true,
    thresholds,
    stats,
    tir,
    series: series.map((p: any) => ({ t: p.t, v: "v" in p ? p.v : p.value, trend: p.trend ?? null })),
    readings: readings.map((r) => ({ t: r.takenAt, v: r.value, source: r.source })),
    daily,
    patientName: access.patient.display_name,
    unit: access.patient.unit,
  });
});
