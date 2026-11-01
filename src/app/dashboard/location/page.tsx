import { LocationView } from "@/components/app/LocationView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Location sharing", robots: { index: false } };

export default function LocationPage() {
  return <LocationView />;
}
