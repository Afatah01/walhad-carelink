/**
 * Business configuration.
 *
 * Contact details are intentionally NOT hardcoded anywhere in the UI. They are
 * read from environment variables (or the admin settings table) so the operator
 * supplies real, verified information. Empty values hide the corresponding UI.
 */

export interface SiteContact {
  email: string | null;
  phone: string | null;
  address: string | null;
  supportHours: string | null;
}

export function siteContact(): SiteContact {
  return {
    email: process.env.CONTACT_EMAIL?.trim() || null,
    phone: process.env.CONTACT_PHONE?.trim() || null,
    address: process.env.CONTACT_ADDRESS?.trim() || null,
    supportHours: process.env.CONTACT_HOURS?.trim() || null,
  };
}

export function siteUrl(): string {
  return (
    process.env.APP_BASE_URL?.replace(/\/$/, "") ||
    process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, "") ||
    `http://localhost:${process.env.PORT ?? 3000}`
  );
}

export function demoMode(): boolean {
  return process.env.SEED_DEMO !== "false";
}
