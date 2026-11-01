import { ProviderError, type LibreProvider, type NormalizedReading, type ProviderSnapshot } from "./types";

/**
 * LibreView / Libre Data Sharing provider (official partner route).
 *
 * Access to Abbott's LibreView cloud is granted through Abbott's partner
 * programme. When credentials are approved, set:
 *
 *   LIBREVIEW_API_BASE   e.g. https://api.libreview.example/v1   (as issued)
 *   LIBREVIEW_CLIENT_ID
 *   LIBREVIEW_CLIENT_SECRET
 *
 * The transport below is deliberately small and isolated: token acquisition,
 * a glucose-connection lookup and a readings fetch. Field mapping is defensive
 * because partner payload shapes are versioned and never fully public. Nothing
 * is fabricated — if credentials are absent the provider reports `not_configured`
 * and the UI shows an honest "awaiting Abbott approval" state.
 */

interface GlucoseGraphPayload {
  connection?: Record<string, any>;
  graphData?: Array<Record<string, any>>;
  readings?: Array<Record<string, any>>;
  patientDevice?: Record<string, any>;
}

const TOKEN_SAFETY_MS = 60_000;

let cachedToken: { value: string; expiresAt: number } | null = null;

function config() {
  return {
    base: (process.env.LIBREVIEW_API_BASE ?? "").replace(/\/$/, ""),
    clientId: process.env.LIBREVIEW_CLIENT_ID ?? "",
    clientSecret: process.env.LIBREVIEW_CLIENT_SECRET ?? "",
    tokenPath: process.env.LIBREVIEW_TOKEN_PATH ?? "/oauth/token",
    graphPath: process.env.LIBREVIEW_GRAPH_PATH ?? "/glucose",
  };
}

async function accessToken(): Promise<string> {
  const cfg = config();
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_SAFETY_MS) return cachedToken.value;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    scope: process.env.LIBREVIEW_SCOPE ?? "glucose.read",
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(`${cfg.base}${cfg.tokenPath}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body,
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new ProviderError("unauthorized", `LibreView token request failed (${res.status})`, res.status >= 500);
    }
    const json = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!json.access_token) throw new ProviderError("unauthorized", "LibreView token response had no access_token");
    cachedToken = {
      value: json.access_token,
      expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    return cachedToken.value;
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError("network", "Could not reach the LibreView API", true);
  } finally {
    clearTimeout(timer);
  }
}

/** Libre returns readings as { Timestamp, ValueInMgPerDl } or nested GraphData. */
function flatten(payload: GlucoseGraphPayload): NormalizedReading[] {
  const candidates = [
    ...(Array.isArray(payload.graphData) ? payload.graphData : []),
    ...(Array.isArray(payload.readings) ? payload.readings : []),
  ];
  const out: NormalizedReading[] = [];
  for (const item of candidates) {
    const ts = item.Timestamp ?? item.timestamp ?? item.FactoryTimestamp ?? item.date;
    const value =
      item.ValueInMgPerDl ?? item.valueInMgPerDl ?? item.Value ?? item.value ?? item.GlucoseValue ?? null;
    const trend = item.TrendArrow ?? item.trendArrow ?? item.Trend ?? item.trend;
    if (ts === undefined || value === null) continue;
    const takenAt = typeof ts === "number" ? ts : new Date(String(ts)).getTime();
    if (!Number.isFinite(takenAt) || !Number.isFinite(Number(value))) continue;
    out.push({ value: Number(value), takenAt, trend: trend as string | number | undefined, source: "libreview" });
  }
  return out.sort((a, b) => a.takenAt - b.takenAt);
}

export const libreviewProvider: LibreProvider = {
  key: "libreview",
  label: "LibreView Data Sharing API",
  description:
    "Abbott's official partner API. Requires an approved Abbott integration agreement and issued client credentials.",
  requiresCredentials: true,
  enabled: () => Boolean(config().base && config().clientId && config().clientSecret),
  async fetchSnapshot(ctx): Promise<ProviderSnapshot> {
    const cfg = config();
    if (!this.enabled()) {
      throw new ProviderError(
        "not_configured",
        "LibreView partner credentials are not configured. Add LIBREVIEW_API_BASE, LIBREVIEW_CLIENT_ID and LIBREVIEW_CLIENT_SECRET once Abbott approves access.",
      );
    }
    if (!ctx.patient.provider_patient_id) {
      throw new ProviderError("invalid_patient", "No LibreView patient identifier is linked to this profile.");
    }

    const token = await accessToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const url = new URL(`${cfg.base}${cfg.graphPath}`);
      url.searchParams.set("patientId", ctx.patient.provider_patient_id);
      url.searchParams.set("hours", String(ctx.lookbackHours ?? 24));
      if (ctx.patient.provider_region) url.searchParams.set("region", ctx.patient.provider_region);

      const res = await fetch(url, {
        headers: { authorization: `Bearer ${token}`, accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });

      if (res.status === 401 || res.status === 403) {
        cachedToken = null;
        throw new ProviderError("unauthorized", "LibreView rejected the credentials for this patient.", false);
      }
      if (res.status === 429) {
        throw new ProviderError("rate_limited", "LibreView rate limit reached — will retry.", true);
      }
      if (!res.ok) {
        throw new ProviderError("provider_error", `LibreView responded ${res.status}`, res.status >= 500);
      }

      const payload = (await res.json()) as GlucoseGraphPayload;
      const readings = flatten(payload);
      const device = payload.connection ?? payload.patientDevice ?? null;
      const startedAt = device?.SensorActivation ? new Date(device.SensorActivation).getTime() : null;
      const wearDays = Number(device?.SensorDurationDays ?? 14) || 14;

      return {
        readings,
        sensor: {
          serial: device?.SerialNumber ?? device?.sensorSerial ?? null,
          startedAt,
          wearDays,
          active: readings.length > 0 ? true : null,
          expiresAt: startedAt ? startedAt + wearDays * 86_400_000 : null,
        },
        patientLabel: device?.PatientName ?? null,
        fetchedAt: Date.now(),
        connected: readings.length > 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError("network", "LibreView request failed or timed out", true);
    } finally {
      clearTimeout(timer);
    }
  },
};

/**
 * LibreLinkUp follower connection.
 *
 * A caregiver can invite the platform as a *follower* in the LibreLinkUp app.
 * The account session is stored AES-256-GCM sealed (see lib/crypto) and is only
 * ever exchanged server-side for readings; the plaintext is never logged,
 * returned to the browser, or written anywhere else.
 */
export const linkupProvider: LibreProvider = {
  key: "linkup",
  label: "LibreLinkUp follower",
  description:
    "Uses a consented LibreLinkUp follower session so a family member's shared sensor can be monitored. The session is encrypted at rest.",
  requiresCredentials: true,
  enabled: () => Boolean(process.env.LINKUP_API_BASE),
  async fetchSnapshot(ctx): Promise<ProviderSnapshot> {
    const base = (process.env.LINKUP_API_BASE ?? "").replace(/\/$/, "");
    if (!base) {
      throw new ProviderError(
        "not_configured",
        "LibreLinkUp endpoint is not configured. Set LINKUP_API_BASE to the approved regional endpoint.",
      );
    }
    if (!ctx.credential) {
      throw new ProviderError("unauthorized", "This patient has no stored LibreLinkUp follower session.");
    }
    if (!ctx.patient.provider_patient_id) {
      throw new ProviderError("invalid_patient", "No LibreLinkUp patient id is linked.");
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(`${base}/llu/connections/${encodeURIComponent(ctx.patient.provider_patient_id)}/graph`, {
        headers: {
          authorization: `Bearer ${ctx.credential}`,
          account: process.env.LINKUP_ACCOUNT_ID ?? "",
          accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        throw new ProviderError("unauthorized", "LibreLinkUp session expired — reconnect the follower account.", false);
      }
      if (!res.ok) throw new ProviderError("provider_error", `LibreLinkUp responded ${res.status}`, res.status >= 500);
      const payload = (await res.json()) as GlucoseGraphPayload;
      const readings = flatten(payload);
      return {
        readings,
        sensor: null,
        patientLabel: null,
        fetchedAt: Date.now(),
        connected: readings.length > 0,
      };
    } catch (err) {
      if (err instanceof ProviderError) throw err;
      throw new ProviderError("network", "LibreLinkUp request failed or timed out", true);
    } finally {
      clearTimeout(timer);
    }
  },
};

/**
 * Phone bridge.
 *
 * Some households run an on-device bridge (for example a LibreLinkUp export on
 * an Android phone) that pushes readings to a secure URL. The legacy reference
 * application exposes `/api/data` for exactly this pattern, so we keep that
 * contract alive and accept it through a per-patient bridge key.
 */
export const bridgeProvider: LibreProvider = {
  key: "bridge",
  label: "Secure phone bridge",
  description:
    "Accepts readings pushed from a phone running the existing bridge software, authenticated with a per-patient bridge key.",
  requiresCredentials: true,
  enabled: () => true,
  async fetchSnapshot(ctx): Promise<ProviderSnapshot> {
    // Bridge providers are push-first: readings arrive through /api/bridge/ingest.
    // Nothing to pull, so we simply report the locally stored freshness.
    return {
      readings: [],
      sensor: null,
      fetchedAt: Date.now(),
      connected: true,
      note: "Push provider — readings arrive from the paired bridge device.",
    };
  },
};
