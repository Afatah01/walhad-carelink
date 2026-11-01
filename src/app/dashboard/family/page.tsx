import { FamilyView } from "@/components/app/FamilyView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Family & caregivers", robots: { index: false } };

export default function FamilyPage() {
  return <FamilyView />;
}
