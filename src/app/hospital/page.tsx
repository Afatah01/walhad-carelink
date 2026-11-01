import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageOrg, currentUser } from "@/lib/auth";
import { db } from "@/lib/db/client";
import { num } from "@/lib/db/repo-util";
import { listClinicians, patientThresholds, recentAudit, recentIntegrations } from "@/lib/db/repo";
import { readingsSince } from "@/lib/db/repo-glucose";
import { computeStats, relativeTime, stampTime } from "@/lib/glucose";
import { orgOverview } from "@/lib/dashboard";
import { IconAlert, IconArrow, IconBell, IconPin, IconSms, IconTelegram, IconUsers } from "@/components/ui/Icons";
import { StatusPill } from "@/components/app/GlucoseBadges";
import { BrandLockup } from "@/components/Brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hospital console", robots: { index: false } };

export default async function HospitalPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/hospital");
  if (user.role === "family" || user.role === "patient") redirect("/dashboard");

  const orgId = user.org_id;
  if (!orgId) {
    return (
      <main className="shell max-w-2xl py-16">
        <h1 className="text-2xl font-extrabold text-navy-900">No organisation linked</h1>
        <p className="mt-2 text-sm text-muted">
          Your account is not attached to a hospital workspace. Ask an administrator to assign your organisation.
        </p>
        <Link href="/contact?topic=hospital" className="btn btn-primary mt-5">
          Contact sales
        </Link>
      </main>
    );
  }

  const overview = await orgOverview(orgId);
  const patients = overview.patients;
  const clinicians = await listClinicians(orgId);
  const auditRows = await recentAudit(10);
  const integrations = await recentIntegrations(8);

  const detail = await Promise.all(
    patients.slice(0, 24).map(async (p) => {
      const readings = await readingsSince(p.id, Date.now() - 24 * 3600_000, 400);
      const latest = readings.at(-1) ?? null;
      const thresholds = await patientThresholds(p);
      return { p, latest, thresholds, stats: computeStats(readings) };
    }),
  );
  const thresholdsById = new Map(detail.map((d) => [d.p.id, d.thresholds]));

  const events = await db().query<any>(
    `SELECT n.id, n.channel, n.status, n.recipient, n.created_at, p.display_name AS patient
     FROM notifications n JOIN patients p ON p.id = n.patient_id
     WHERE p.org_id = ? ORDER BY n.created_at DESC LIMIT 12`,
    [orgId],
  );

  const telegramLinked = await db().get<{ c: number }>(
    `SELECT COUNT(*) AS c FROM telegram_links l JOIN patients p ON p.id = l.patient_id
     WHERE p.org_id = ? AND l.status = 'active'`,
    [orgId],
  );

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <header className="border-b border-line bg-white">
        <div className="shell flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLockup href="/" size="sm" logoSize={34} />
            <span className="h-4 w-px bg-line" />
            <span className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-muted">Hospital console</span>
            <span className="h-4 w-px bg-line" />
            <span className="text-[0.9rem] font-extrabold text-navy-900">{overview.org?.name ?? "Organisation"}</span>
          </div>
          <div className="flex items-center gap-2">
            {canManageOrg(user.role) ? (
              <Link href="/admin" className="btn btn-sm btn-ghost">
                Admin console
              </Link>
            ) : null}
            <Link href="/dashboard" className="btn btn-sm btn-ghost">
              Family view
            </Link>
            <Link href="/api/auth/logout" className="btn btn-sm btn-ghost">
              Sign out
            </Link>
          </div>
        </div>
      </header>

      <div className="shell py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-navy-900">Patient monitoring overview</h1>
            <p className="text-[0.84rem] text-muted">
              {user.name} · {user.role.replace(/_/g, " ")} · {clinicians.length} clinicians · {patients.length} monitored patients
            </p>
          </div>
          <Link href="/contact?topic=hospital" className="btn btn-sm btn-ghost">
            Request capacity review <IconArrow size={14} />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total patients", value: overview.totals.patients, icon: IconUsers, tone: "text-brand-700 bg-brand-50" },
            { label: "Need attention", value: overview.totals.attention, icon: IconAlert, tone: "text-high bg-high-soft" },
            { label: "Critical alerts (24h)", value: overview.totals.critical24h, icon: IconBell, tone: "text-low bg-low-soft" },
            { label: "Active connections", value: overview.totals.activeConnections, icon: IconPin, tone: "text-teal-700 bg-teal-50" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-wider text-muted">{s.label}</p>
                    <p className="mt-1 tabular text-2xl font-extrabold text-navy-900">{s.value}</p>
                  </div>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${s.tone}`}>
                    <Icon size={17} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Monitored patients</h2>
              <span className="text-[0.7rem] font-semibold text-muted">{detail.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl min-w-[680px]">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Latest</th>
                    <th>Status</th>
                    <th>TIR 24h</th>
                    <th>Last reading</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {detail.map(({ p, latest, stats }) => (
                    <tr key={p.id}>
                      <td>
                        <p className="text-[0.84rem] font-bold text-navy-900">{p.display_name}</p>
                        <p className="text-[0.68rem] text-muted">{p.relationship ?? "Monitored patient"}</p>
                      </td>
                      <td className="tabular font-bold text-navy-900">
                        {latest ? `${Math.round(latest.value)} mg/dL` : "—"}
                      </td>
                      <td>
                        {latest ? (
                          <StatusPill level={levelFor(latest.value, thresholdsById.get(p.id))} />
                        ) : (
                          <span className="pill pill-muted">no data</span>
                        )}
                      </td>
                      <td className="tabular text-[0.8rem] text-muted">{stats.count ? `${stats.tir}%` : "—"}</td>
                      <td className="text-[0.74rem] text-muted">{latest ? relativeTime(latest.takenAt) : "—"}</td>
                      <td className="text-right">
                        <Link href={`/dashboard?patientId=${p.id}`} className="text-[0.72rem] font-bold text-brand-700 hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {!detail.length ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[0.82rem] text-muted">
                        No patients assigned to this organisation yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>

          <div className="space-y-4">
            <section className="card p-4">
              <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
                <IconBell size={15} className="text-brand-600" /> Recent notifications
              </h2>
              <ul className="mt-2.5 space-y-2">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start justify-between gap-3 border-b border-line/70 pb-2 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate text-[0.78rem] font-bold text-navy-900">
                        <span className="capitalize">{e.channel}</span> · {e.patient}
                      </p>
                      <p className="text-[0.66rem] text-muted">
                        {e.status} · {relativeTime(new Date(e.created_at).getTime())}
                      </p>
                    </div>
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 flex-none rounded-full ${
                        e.status === "sent" ? "bg-teal-500" : e.status === "failed" ? "bg-low" : "bg-[#c3cfdb]"
                      }`}
                    />
                  </li>
                ))}
                {!events.length ? <li className="text-[0.78rem] text-muted">No notifications yet.</li> : null}
              </ul>
            </section>

            <section className="card p-4">
              <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
                <IconTelegram size={15} className="text-brand-600" /> Telegram status
              </h2>
              <p className="mt-1 text-[0.78rem] text-muted">
                <span className="tabular text-lg font-extrabold text-navy-900">{telegramLinked?.c ?? 0}</span> linked chats
                across {patients.length} patients.
              </p>
              <Link href="/admin" className="btn btn-sm btn-ghost mt-2 w-full justify-center">
                Manage integration
              </Link>
            </section>

            <section className="card p-4">
              <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
                <IconSms size={15} className="text-brand-600" /> Channel health
              </h2>
              <ul className="mt-2 space-y-1.5">
                {integrations.map((i: any) => (
                  <li key={i.id} className="flex items-center justify-between text-[0.74rem]">
                    <span className="font-semibold capitalize text-navy-800">
                      {i.provider} · {i.event}
                    </span>
                    <span
                      className={`pill text-[0.56rem] ${
                        i.status === "ok" ? "pill-ok" : i.status === "error" ? "pill-low" : "pill-muted"
                      }`}
                    >
                      {i.status}
                    </span>
                  </li>
                ))}
                {!integrations.length ? <li className="text-[0.76rem] text-muted">No integration events.</li> : null}
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Staff activity</h2>
              <p className="text-[0.7rem] text-muted">Authorised access is logged for every patient record view</p>
            </div>
            <ul className="divide-y divide-line">
              {auditRows.map((a: any) => (
                <li key={a.id} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <div>
                    <p className="text-[0.78rem] font-bold capitalize text-navy-900">{a.action.replace(/\./g, " ")}</p>
                    <p className="text-[0.66rem] text-muted">
                      {a.actor_label ?? "system"} · {a.entity} {a.entity_id ?? ""}
                    </p>
                  </div>
                  <span className="whitespace-nowrap text-[0.66rem] font-semibold text-muted">{stampTime(new Date(a.created_at).getTime())}</span>
                </li>
              ))}
              {!auditRows.length ? <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No activity recorded.</li> : null}
            </ul>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">Care team</h2>
              <p className="text-[0.7rem] text-muted">Clinicians with access to this organisation</p>
            </div>
            <ul className="divide-y divide-line">
              {clinicians.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-navy-700 text-[0.66rem] font-extrabold text-white">
                    {c.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.82rem] font-bold text-navy-900">{c.name}</p>
                    <p className="truncate text-[0.66rem] text-muted">{c.title ?? c.role}</p>
                  </div>
                  <span className="text-[0.64rem] font-semibold text-muted">
                    {c.last_login_at ? relativeTime(new Date(c.last_login_at).getTime()) : "never signed in"}
                  </span>
                </li>
              ))}
              {!clinicians.length ? <li className="px-4 py-6 text-center text-[0.8rem] text-muted">No clinicians assigned.</li> : null}
            </ul>
          </section>
        </div>

        <p className="mt-6 text-[0.7rem] leading-relaxed text-muted">
          Only authorised healthcare professionals can access patient information. Every view is recorded in the
          audit log. Alerts support care decisions but do not replace clinical judgement or emergency services.
        </p>
      </div>
    </main>
  );
}

function levelFor(value: number, t?: { low: number; high: number; veryLow: number; veryHigh: number }) {
  const low = t?.low ?? 70;
  const high = t?.high ?? 180;
  if (value <= (t?.veryLow ?? 54)) return "very-low";
  if (value < low) return "low";
  if (value >= (t?.veryHigh ?? 250)) return "very-high";
  if (value > high) return "high";
  return "in-range";
}
