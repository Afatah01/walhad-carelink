import { NotificationsView } from "@/components/app/NotificationsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notification centre", robots: { index: false } };

export default function NotificationsPage() {
  return <NotificationsView />;
}
