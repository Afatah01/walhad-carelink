import { db } from "./client";
import { J, PJ, nowIso, num } from "./repo-util";
import { deriveTrend, normalizeTrend, type ReadingLike, type TrendKey } from "../glucose";

export interface ReadingRow {
  id: number;
  patient_id: number;
  value: number;
  trend: string | null;
  source: string;
  taken_at: string;
  received_at: string;
}

export interface ReadingPoint extends ReadingLike {
  trend: TrendKey;
  source: string;
  id: number;
}

function map(row: ReadingRow): ReadingPoint {
  return {
    id: row.id,
    value: row.value,
    trend: normalizeTrend(row.trend),
    source: row.source,
    takenAt: new Date(row.taken_at).getTime(),
  };
}

/**
 * Persist provider readings. Dedupes on (patient, taken_at) so re-syncing the
 * same provider window is idempotent.
 */
export async function ingestReadings(
  patientId: number,
  readings: { value: number; takenAt: number; trend?: string | number; source?: string }[],
): Promise<number> {
  if (!readings.length) return 0;
  const d = db();
  const nowMs = Date.now();
  const MAX_FUTURE_MS = 90_000;
  let inserted = 0;
  await d.tx(async (t) => {
    for (const r of readings) {
      if (!Number.isFinite(r.value) || r.value <= 0) continue;
      // A glucose reading cannot arrive from the future. Reject clock-skewed or
      // corrupt timestamps rather than storing them and showing "in 3 hours".
      if (!Number.isFinite(r.takenAt) || r.takenAt > nowMs + MAX_FUTURE_MS) continue;
      const takenAt = new Date(r.takenAt).toISOString();
      try {
        await t.run(
          `INSERT INTO glucose_readings (patient_id, value, trend, source, taken_at, received_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [patientId, Math.round(r.value), String(r.trend ?? "steady"), r.source ?? "libre", takenAt, nowIso()],
        );
        inserted++;
      } catch {
        /* duplicate reading — ignore */
      }
    }
  });
  return inserted;
}

export async function latestReading(patientId: number): Promise<ReadingPoint | null> {
  const row = await db().get<ReadingRow>(
    "SELECT * FROM glucose_readings WHERE patient_id = ? ORDER BY taken_at DESC LIMIT 1",
    [patientId],
  );
  return row ? map(row) : null;
}

export async function readingsSince(patientId: number, sinceMs: number, limit = 5000): Promise<ReadingPoint[]> {
  const rows = await db().query<ReadingRow>(
    "SELECT * FROM glucose_readings WHERE patient_id = ? AND taken_at >= ? ORDER BY taken_at ASC LIMIT ?",
    [patientId, new Date(sinceMs).toISOString(), limit],
  );
  return rows.map(map);
}

export async function recentReadings(patientId: number, limit = 288): Promise<ReadingPoint[]> {
  const rows = await db().query<ReadingRow>(
    "SELECT * FROM glucose_readings WHERE patient_id = ? ORDER BY taken_at DESC LIMIT ?",
    [patientId, limit],
  );
  return rows.map(map).reverse();
}

export async function readingCount(patientId: number): Promise<number> {
  const row = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM glucose_readings WHERE patient_id = ?", [
    patientId,
  ]);
  return num(row?.c);
}

/** Trend derived from the last ~20 minutes of data when the API omits it. */
export async function trendFor(patientId: number, fallback: TrendKey): Promise<TrendKey> {
  const pts = await recentReadings(patientId, 8);
  if (pts.length < 2) return fallback;
  return deriveTrend(pts);
}

/* ============================== sync state ============================== */

export interface SyncStateRow {
  id: number;
  patient_id: number;
  provider: string;
  last_success_at: string | null;
  last_attempt_at: string | null;
  last_error: string | null;
  consecutive_failures: number;
  readings_ingested: number;
}

export async function getSyncState(patientId: number, provider: string): Promise<SyncStateRow | null> {
  return db().get<SyncStateRow>("SELECT * FROM sync_state WHERE patient_id = ? AND provider = ?", [
    patientId,
    provider,
  ]);
}

export async function recordSync(
  patientId: number,
  provider: string,
  outcome: { ok: boolean; error?: string; ingested?: number },
): Promise<void> {
  const existing = await getSyncState(patientId, provider);
  const now = nowIso();
  if (!existing) {
    await db().run(
      `INSERT INTO sync_state (patient_id, provider, last_success_at, last_attempt_at, last_error,
        consecutive_failures, readings_ingested) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        patientId,
        provider,
        outcome.ok ? now : null,
        now,
        outcome.error ?? null,
        outcome.ok ? 0 : 1,
        outcome.ingested ?? 0,
      ],
    );
    return;
  }
  if (outcome.ok) {
    await db().run(
      `UPDATE sync_state SET last_success_at = ?, last_attempt_at = ?, last_error = NULL,
        consecutive_failures = 0, readings_ingested = readings_ingested + ? WHERE id = ?`,
      [now, now, outcome.ingested ?? 0, existing.id],
    );
  } else {
    await db().run(
      "UPDATE sync_state SET last_attempt_at = ?, last_error = ?, consecutive_failures = consecutive_failures + 1 WHERE id = ?",
      [now, (outcome.error ?? "unknown error").slice(0, 400), existing.id],
    );
  }
}

/** True when the provider has not produced a reading recently. */
export async function syncHealth(patientId: number) {
  const last = await latestReading(patientId);
  const state = await getSyncState(patientId, "libre");
  const ageMin = last ? (Date.now() - last.takenAt) / 60_000 : null;
  return {
    lastReadingAt: last?.takenAt ?? null,
    ageMinutes: ageMin === null ? null : Math.round(ageMin),
    lastSuccessAt: state?.last_success_at ?? null,
    lastError: state?.last_error ?? null,
    failures: state?.consecutive_failures ?? 0,
  };
}

/* ============================== demo helpers ============================== */

export async function hasAnyReadings(patientId: number): Promise<boolean> {
  return (await readingCount(patientId)) > 0;
}

export async function deleteReadings(patientId: number): Promise<void> {
  await db().run("DELETE FROM glucose_readings WHERE patient_id = ?", [patientId]);
}

export function _jsonHelper() {
  return { J, PJ };
}

/** High-volume insert used by seeding (chunked multi-row VALUES). */
export async function ingestReadingsBulk(
  patientId: number,
  readings: { value: number; takenAt: number; trend?: string | number }[],
  source = "demo",
): Promise<number> {
  const d = db();
  const rows = readings.filter((r) => Number.isFinite(r.value) && r.value > 0);
  if (!rows.length) return 0;
  const chunkSize = 100;
  let inserted = 0;
  const now = nowIso();
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const groups = chunk.map(() => "(?, ?, ?, ?, ?, ?)").join(",");
    const params: any[] = [];
    for (const r of chunk) {
      params.push(patientId, Math.round(r.value), String(r.trend ?? "steady"), source, new Date(r.takenAt).toISOString(), now);
    }
    const head = d.dialect === "sqlite" ? "INSERT OR IGNORE INTO" : "INSERT INTO";
    const tail = d.dialect === "sqlite" ? "" : " ON CONFLICT (patient_id, taken_at) DO NOTHING";
    await d.run(
      `${head} glucose_readings (patient_id, value, trend, source, taken_at, received_at) VALUES ${groups}${tail}`,
      params,
    );
    inserted += chunk.length;
  }
  return inserted;
}
