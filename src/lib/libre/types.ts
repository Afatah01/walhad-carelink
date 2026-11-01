/**
 * Libre data-source contract.
 *
 * Every provider normalises to mg/dL + epoch milliseconds. Swapping providers is
 * a configuration change (patients.provider) — the dashboard, alert engine and
 * notification services never talk to a vendor directly.
 */

export type ProviderKey = "demo" | "libreview" | "linkup" | "bridge";

export interface NormalizedReading {
  value: number; // mg/dL
  takenAt: number; // epoch ms
  trend?: string | number; // Abbott trend index (1..5) or text
  source?: string;
}

export interface SensorInfo {
  serial: string | null;
  startedAt: number | null;
  wearDays: number | null;
  active: boolean | null;
  expiresAt: number | null;
}

export interface ProviderSnapshot {
  readings: NormalizedReading[]; // ascending
  sensor: SensorInfo | null;
  patientLabel?: string | null;
  fetchedAt: number;
  /** Provider-reported connectivity, when available. */
  connected: boolean;
  note?: string;
}

export interface ProviderContext {
  patient: {
    id: number;
    display_name: string;
    provider_patient_id: string | null;
    provider_region: string | null;
    credential_cipher: string | null;
  };
  /** Sealed credential already decrypted by the caller (never logged). */
  credential?: string | null;
  /** How far back to fetch, in hours. */
  lookbackHours?: number;
}

export interface LibreProvider {
  key: ProviderKey;
  label: string;
  /** Human explanation surfaced in the UI. */
  description: string;
  /** Whether the operator still has to supply credentials / approval. */
  requiresCredentials: boolean;
  /** Whether this provider is switched on in the current environment. */
  enabled(): boolean;
  fetchSnapshot(ctx: ProviderContext): Promise<ProviderSnapshot>;
}

export class ProviderError extends Error {
  code:
    | "not_configured"
    | "unauthorized"
    | "rate_limited"
    | "network"
    | "invalid_patient"
    | "provider_error";
  retryable: boolean;
  constructor(code: ProviderError["code"], message: string, retryable = false) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.retryable = retryable;
  }
}
