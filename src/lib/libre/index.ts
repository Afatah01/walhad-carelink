import { db } from "../db/client";
import { ingestReadings, recordSync } from "../db/repo-glucose";
import type { PatientRow } from "../db/repo";
import { logIntegration } from "../db/repo";
import { demoProvider } from "./demo";
import { bridgeProvider, libreviewProvider, linkupProvider } from "./providers";
import { ProviderError, type LibreProvider, type ProviderKey, type ProviderSnapshot } from "./types";

export * from "./types";

const PROVIDERS: Record<ProviderKey, LibreProvider> = {
  demo: demoProvider,
  libreview: libreviewProvider,
  linkup: linkupProvider,
  bridge: bridgeProvider,
};

export function providerFor(key: string | null | undefined): LibreProvider {
  const k = (key ?? "demo") as ProviderKey;
  return PROVIDERS[k] ?? demoProvider;
}

export function providerRegistry(): {
  key: ProviderKey;
  label: string;
  description: string;
  enabled: boolean;
  requiresCredentials: boolean;
}[] {
  return (Object.keys(PROVIDERS) as ProviderKey[]).map((k) => {
    const p = PROVIDERS[k];
    return {
      key: p.key,
      label: p.label,
      description: p.description,
      enabled: p.enabled(),
      requiresCredentials: p.requiresCredentials,
    };
  });
}

/** Exponential backoff (capped) for retryable provider failures. */
export function retryDelayMs(attempt: number): number {
  const base = 5_000;
  return Math.min(base * 2 ** Math.max(0, attempt - 1), 5 * 60_000);
}

export interface SyncOutcome {
  ok: boolean;
  ingested: number;
  snapshot: ProviderSnapshot | null;
  error?: { code: string; message: string; retryable: boolean };
}

/**
 * Pull the provider window for one patient and persist new readings.
 * Failures are recorded in sync_state (with a consecutive counter) so the UI can
 * surface "connection problem" instead of silently showing stale numbers.
 */
export async function syncPatient(
  patient: PatientRow,
  credential: string | null,
  lookbackHours = 24,
): Promise<SyncOutcome> {
  const provider = providerFor(patient.provider);
  if (!provider.enabled()) {
    return {
      ok: false,
      ingested: 0,
      snapshot: null,
      error: { code: "not_configured", message: provider.description, retryable: false },
    };
  }
  try {
    const snapshot = await provider.fetchSnapshot({
      patient: {
        id: patient.id,
        display_name: patient.display_name,
        provider_patient_id: patient.provider_patient_id,
        provider_region: patient.provider_region,
        credential_cipher: patient.credential_cipher,
      },
      credential,
      lookbackHours,
    });

    let ingested = 0;
    if (snapshot.readings.length) {
      ingested = await ingestReadings(
        patient.id,
        snapshot.readings.map((r) => ({
          value: r.value,
          takenAt: r.takenAt,
          trend: r.trend,
          source: provider.key,
        })),
      );
    }

    await recordSync(patient.id, "libre", { ok: true, ingested });

    if (snapshot.sensor && (snapshot.sensor.serial || snapshot.sensor.startedAt)) {
      const sets: string[] = [];
      const params: any[] = [];
      if (snapshot.sensor.serial) {
        sets.push("sensor_serial = ?");
        params.push(snapshot.sensor.serial);
      }
      if (snapshot.sensor.startedAt) {
        sets.push("sensor_started_at = ?");
        params.push(new Date(snapshot.sensor.startedAt).toISOString());
      }
      if (snapshot.sensor.wearDays) {
        sets.push("sensor_wear_days = ?");
        params.push(snapshot.sensor.wearDays);
      }
      if (sets.length) {
        params.push(patient.id);
        await db().run(`UPDATE patients SET ${sets.join(", ")} WHERE id = ?`, params);
      }
    }

    return { ok: true, ingested, snapshot };
  } catch (err) {
    const pe =
      err instanceof ProviderError
        ? err
        : new ProviderError("provider_error", err instanceof Error ? err.message : "Unknown provider error");
    await recordSync(patient.id, "libre", { ok: false, error: `${pe.code}: ${pe.message}` });
    await logIntegration({
      provider: provider.key,
      event: "sync",
      status: "error",
      message: pe.message,
      meta: { patientId: patient.id, code: pe.code },
    }).catch(() => {});
    return {
      ok: false,
      ingested: 0,
      snapshot: null,
      error: { code: pe.code, message: pe.message, retryable: pe.retryable },
    };
  }
}

/** Patients that should be polled by the scheduled sync job. */
export async function syncablePatients(): Promise<PatientRow[]> {
  // Every patient with a real provider is polled. `none` means the record was
  // never connected, so there is nothing to fetch.
  return db().query<PatientRow>(
    "SELECT * FROM patients WHERE status = 'active' AND provider <> 'none' AND provider IS NOT NULL ORDER BY id ASC",
  );
}
