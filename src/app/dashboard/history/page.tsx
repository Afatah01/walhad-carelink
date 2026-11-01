import { HistoryView } from "@/components/app/HistoryView";

export const dynamic = "force-dynamic";
export const metadata = { title: "History & reports", robots: { index: false } };

export default function HistoryPage() {
  return <HistoryView />;
}
