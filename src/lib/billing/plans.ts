import { db } from "../db/client";
import { J, PJ, nowIso, num, bool } from "../db/repo-util";

export interface Plan {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  price_cents: number;
  price_from: number;
  currency: string;
  billing_interval: string;
  badge: string | null;
  highlight: number;
  recipient_limit: number | null;
  patient_limit: number | null;
  features: string[];
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  active: number;
}

/**
 * Default catalogue. Prices live in the database (`plans`) and can be edited by
 * an administrator — the marketing page and checkout always read from there, so
 * pricing is never duplicated across components.
 */
export const DEFAULT_PLANS = [
  {
    slug: "family-basic",
    name: "Family Basic",
    tagline: "One patient, low and high alerts.",
    price_cents: 3000,
    price_from: 0,
    currency: "USD",
    billing_interval: "month",
    badge: null,
    highlight: 0,
    recipient_limit: 2,
    patient_limit: 1,
    features: [
      "1 monitored patient",
      "2 alert recipients",
      "Low and high alerts",
      "SMS and push",
      "Telegram bot",
      "Glucose history",
    ],
    cta_label: "Choose Family Basic",
    cta_href: "/pricing?plan=family-basic",
    sort_order: 1,
  },
  {
    slug: "family-premium",
    name: "Family Premium",
    tagline: "All alert types, more caregivers.",
    price_cents: 5000,
    price_from: 0,
    currency: "USD",
    billing_interval: "month",
    badge: "RECOMMENDED PLAN",
    highlight: 1,
    recipient_limit: 5,
    patient_limit: 1,
    features: [
      "1 monitored patient",
      "5 alert recipients",
      "Rapid-change alerts",
      "Emergency escalation",
      "Location sharing",
      "Priority support",
    ],
    cta_label: "Choose Family Premium",
    cta_href: "/pricing?plan=family-premium",
    sort_order: 2,
  },
  {
    slug: "hospital",
    name: "Hospital",
    tagline: "Custom capacity for hospitals and clinics.",
    price_cents: 10000,
    price_from: 1,
    currency: "USD",
    billing_interval: "month",
    badge: null,
    highlight: 0,
    recipient_limit: null,
    patient_limit: null,
    features: [
      "Custom patient capacity",
      "Staff accounts and roles",
      "Hospital dashboard",
      "Patient assignment",
      "Reports",
      "Custom onboarding",
    ],
    cta_label: "Choose Hospital",
    cta_href: "/contact?topic=hospital",
    sort_order: 3,
  },
] as const;

function mapPlan(r: any): Plan {
  return {
    id: num(r.id),
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    price_cents: num(r.price_cents),
    price_from: num(r.price_from),
    currency: r.currency,
    billing_interval: r.billing_interval,
    badge: r.badge,
    highlight: num(r.highlight),
    recipient_limit: r.recipient_limit === null ? null : num(r.recipient_limit),
    patient_limit: r.patient_limit === null ? null : num(r.patient_limit),
    features: PJ<string[]>(r.features_json, []),
    cta_label: r.cta_label,
    cta_href: r.cta_href,
    sort_order: num(r.sort_order),
    active: num(r.active),
  };
}

export async function listPlans(includeInactive = false): Promise<Plan[]> {
  const rows = await db().query<any>(
    includeInactive
      ? "SELECT * FROM plans ORDER BY sort_order ASC"
      : "SELECT * FROM plans WHERE active = 1 ORDER BY sort_order ASC",
  );
  return rows.map(mapPlan);
}

export async function getPlan(slug: string): Promise<Plan | null> {
  const row = await db().get<any>("SELECT * FROM plans WHERE slug = ?", [slug]);
  return row ? mapPlan(row) : null;
}

export async function upsertPlan(plan: (typeof DEFAULT_PLANS)[number] & { id?: number }): Promise<void> {
  const existing = await db().get<{ id: number }>("SELECT id FROM plans WHERE slug = ?", [plan.slug]);
  const values = [
    plan.name,
    plan.tagline,
    plan.price_cents,
    plan.price_from,
    plan.currency,
    plan.billing_interval,
    plan.badge,
    plan.highlight,
    plan.recipient_limit,
    plan.patient_limit,
    J(plan.features),
    plan.cta_label,
    plan.cta_href,
    plan.sort_order,
    nowIso(),
  ];
  if (existing) {
    await db().run(
      `UPDATE plans SET name = ?, tagline = ?, price_cents = ?, price_from = ?, currency = ?, billing_interval = ?,
        badge = ?, highlight = ?, recipient_limit = ?, patient_limit = ?, features_json = ?, cta_label = ?,
        cta_href = ?, sort_order = ?, updated_at = ? WHERE id = ?`,
      [...values, existing.id],
    );
  } else {
    await db().run(
      `INSERT INTO plans (name, tagline, price_cents, price_from, currency, billing_interval, badge, highlight,
        recipient_limit, patient_limit, features_json, cta_label, cta_href, sort_order, updated_at, slug, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [...values, plan.slug],
    );
  }
}

export function formatPrice(plan: Pick<Plan, "price_cents" | "price_from" | "currency">): string {
  const amount = plan.price_cents / 100;
  const str = amount % 1 === 0 ? `$${amount.toFixed(0)}` : `$${amount.toFixed(2)}`;
  return plan.price_from ? `From ${str}` : str;
}

export function priceNumber(plan: Pick<Plan, "price_cents">): number {
  return plan.price_cents / 100;
}

export { bool };
