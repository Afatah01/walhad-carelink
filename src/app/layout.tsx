import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import { brand } from "@/lib/brand";
import type { Locale } from "@/lib/i18n";
import { dirFor, LOCALES } from "@/lib/i18n";
import { ensureBooted } from "@/lib/boot";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.APP_BASE_URL?.replace(/\/$/, "") ??
      process.env.RENDER_EXTERNAL_URL?.replace(/\/$/, "") ??
      "http://localhost:3000",
  ),
  title: {
    default: `${brand.suite} — Smarter Glucose Monitoring. Greater Peace of Mind.`,
    template: `%s · ${brand.suite}`,
  },
  description:
    "Walhad CareLink connects FreeStyle Libre glucose monitoring with family alerts, SMS, push and Telegram notifications, so families and clinicians can act quickly when it matters.",
  applicationName: brand.suite,
  keywords: [
    "FreeStyle Libre",
    "glucose monitoring",
    "CGM alerts",
    "family health monitoring",
    "diabetes care",
    "Telegram glucose alerts",
    "remote patient monitoring",
  ],
  authors: [{ name: brand.suite }],
  openGraph: {
    title: `${brand.suite} — ${brand.tagline}`,
    description:
      "Intelligent glucose monitoring, real-time family alerts and remote support — built around the FreeStyle Libre ecosystem.",
    siteName: brand.suite,
    type: "website",
    images: [{ url: brand.logo.full, width: 1024, height: 1024, alt: brand.suite }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${brand.suite} — ${brand.tagline}`,
    description:
      "Intelligent glucose monitoring, real-time family alerts and remote support — built around the FreeStyle Libre ecosystem.",
    images: [brand.logo.full],
  },
  icons: {
    icon: [
      { url: brand.logo.favicon32, sizes: "32x32", type: "image/png" },
      { url: brand.logo.favicon64, sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: brand.logo.apple, sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#002F65",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Provision + refresh on the first request after a wake-up. Idempotent and
  // cached per process, so this costs nothing on subsequent renders.
  await ensureBooted();
  const jar = await cookies();
  const cookieLocale = jar.get("walhad_locale")?.value as Locale | undefined;
  const locale: Locale = LOCALES.some((l) => l.code === cookieLocale) ? (cookieLocale as Locale) : "en";

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
