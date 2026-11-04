import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser, canManageOrg } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";
import { listClinicians, listContactRequests, listOrgs, recentAudit, recentIntegrations, listUsers } from "@/lib/db/repo";
import { listPlans } from "@/lib/billing/plans";
import { botToken } from "@/lib/notify/telegram";
import { AdminPanels } from "@/components/app/AdminPanels";
import { SignOutButton } from "@/components/app/SignOutButton";
import { BrandLockup } from "@/components/Brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin console", robots: { index: false } };

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  const [orgs, plans, users, contacts, audit, integrations, clinicians] = await Promise.all([
    listOrgs(),
    listPlans(true),
    listUsers(),
    listContactRequests(20),
    recentAudit(15),
    recentIntegrations(8),
    user.org_id ? listClinicians(user.org_id) : Promise.resolve([]),
  ]);

  const counts = await Promise.all(
    orgs.map(async (o) => {
      const row = await db().get<{ c: number }>("SELECT COUNT(*) AS c FROM patients WHERE org_id = ? AND status <> 'archived'", [o.id]);
      return { orgId: o.id, patients: num(row?.c ?? 0) };
    }),
  );
  const patientCount = new Map(counts.map((c) => [c.orgId, c.patients]));

  const subs = await db().query<any>(
    `SELECT s.id, s.status, s.current_period_end, s.sms_used, s.sms_allowance, p.name AS plan, p.price_cents
     FROM subscriptions s LEFT JOIN plans p ON p.id = s.plan_id ORDER BY s.created_at DESC LIMIT 12`,
  );
  const paid = await db().get<{ total: number }>(
    "SELECT COALESCE(SUM(amount_cents), 0) AS total FROM payments WHERE status = 'paid'",
  );
  const hasBot = Boolean(await botToken());

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <header className="border-b border-line bg-white">
        <div className="shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLockup href="/" size="sm" logoSize={34} />
            <span className="h-4 w-px bg-line" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">Admin console</span>
            <span className="h-4 w-px bg-line" />
            <span className="text-[0.9rem] font-extrabold text-navy-900">{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="btn btn-sm btn-ghost">
              Family view
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="shell py-6">
        <h1 className="text-2xl font-extrabold text-navy-900">Workspace administration</h1>
        <p className="text-[0.84rem] text-muted">
          Organisations, plans, subscriptions, staff, integrations and the audit trail.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Organisations", value: orgs.length },
            { label: "Accounts", value: users.length },
            { label: "Active subscriptions", value: subs.filter((s) => s.status === "active").length },
            { label: "Verified revenue", value: `$${((paid?.total ?? 0) / 100).toLocaleString("en-US")}` },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">{s.label}</p>
              <p className="mt-1 tabular text-2xl font-extrabold text-navy-900">{s.value}</p>
            </div>
          ))}
        </div>

        <AdminPanels
          hasBot={hasBot}
          plans={plans.map((p) => ({
            slug: p.slug,
            name: p.name,
            price: p.price_cents / 100,
            interval: p.billing_interval,
            recipients: p.recipient_limit,
            patients: p.patient_limit,
            active: Boolean(p.active),
            badge: p.badge,
          }))}
          subscriptions={subs.map((s) => ({
            id: num(s.id),
            plan: s.plan,
            status: s.status,
            renews: s.current_period_end,
            sms: `${num(s.sms_used)}/${num(s.sms_allowance)}`,
            price: `$${num(s.price_cents) / 100}`,
          }))}
          orgs={orgs.map((o) => ({
            id: o.id,
            name: o.name,
            type: o.type,
            patients: patientCount.get(o.id) ?? 0,
          }))}
          staff={clinicians.map((c) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            role: c.role,
            title: c.title,
            lastLogin: c.last_login_at,
          }))}
          contacts={contacts.map((c: any) => ({
            id: c.id,
            name: c.name,
            email: c.email,
            topic: c.topic,
            message: c.message,
            at: c.created_at,
            status: c.status,
          }))}
          audit={audit.map((a: any) => ({
            id: a.id,
            action: a.action,
            actor: a.actor_label ?? "system",
            entity: `${a.entity ?? ""} ${a.entity_id ?? ""}`.trim(),
            at: a.created_at,
          }))}
          integrations={integrations.map((i: any) => ({
            id: i.id,
            provider: i.provider,
            event: i.event,
            status: i.status,
            message: i.message,
            at: i.created_at,
          }))}
        />
      </div>
    </main>
  );
}
