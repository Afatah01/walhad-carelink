import { SettingsView } from "@/components/app/SettingsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings", robots: { index: false } };

export default function SettingsPage() {
  return <SettingsView />;
}
