import { ConnectionView } from "@/components/app/ConnectionView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connection settings", robots: { index: false } };

export default function ConnectionPage() {
  return <ConnectionView />;
}
