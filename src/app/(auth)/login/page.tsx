import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { currentUser, roleHome } from "@/lib/auth";
import { ensureSeed } from "@/lib/seed";
import { demoMode } from "@/lib/site-config";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await currentUser().catch(() => null);
  if (user) redirect(roleHome(user.role));

  const demo = demoMode();
  let accounts: { email: string; password: string; role: string; label: string }[] = [];
  if (demo) {
    const seeded = await ensureSeed().catch(() => null);
    accounts = seeded?.accounts ?? [];
  }

  return <LoginForm accounts={accounts} showDemo={demo} />;
}
