import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentAuth } from "@/lib/auth";
import { patientsForUser } from "@/lib/db/repo";
import { ensureSeed } from "@/lib/seed";
import { DashboardShell } from "@/components/app/DashboardShell";
import { ensureBooted } from "@/lib/boot";
import { DashboardProvider } from "@/components/app/DashboardProvider";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await ensureBooted();
  const auth = await currentAuth().catch(() => null);
  if (!auth) redirect("/login");

  await ensureSeed().catch(() => null);
  const access = await patientsForUser(auth.user.id, auth.user.role);

  if (!access.length && auth.user.org_id === null) redirect("/login");

  return (
    <DashboardProvider
      user={{
        id: auth.user.id,
        name: auth.user.name,
        email: auth.user.email,
        role: auth.user.role,
        title: auth.user.title,
        unit: auth.user.unit,
        orgName: auth.org?.name ?? null,
        orgType: auth.org?.type ?? null,
      }}
      patients={access.map((a) => ({
        id: a.patient.id,
        name: a.patient.display_name,
        relationship: a.patient.relationship,
        role: a.role,
        unit: a.patient.unit,
      }))}
    >
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
