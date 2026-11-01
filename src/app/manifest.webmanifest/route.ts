import { brand } from "@/lib/brand";

export const dynamic = "force-static";

export function GET() {
  return Response.json({
    name: `${brand.suite} — Glucose monitoring & family alerts`,
    short_name: brand.suite,
    description: brand.tagline,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#002F65",
    orientation: "portrait-primary",
    categories: ["health", "medical", "productivity"],
    icons: [
      { src: brand.logo.icon192, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: brand.logo.icon512, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: brand.logo.icon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Glucose dashboard", url: "/dashboard" },
      { name: "Telegram alerts", url: "/dashboard/telegram" },
      { name: "Notification centre", url: "/dashboard/notifications" },
    ],
  });
}
