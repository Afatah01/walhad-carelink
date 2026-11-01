import { TelegramView } from "@/components/app/TelegramView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Telegram alerts", robots: { index: false } };

export default function TelegramPage() {
  return <TelegramView />;
}
