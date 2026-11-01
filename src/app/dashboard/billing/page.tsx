import { BillingView } from "@/components/app/BillingView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Plan & billing", robots: { index: false } };

export default function BillingPage() {
  return <BillingView />;
}
