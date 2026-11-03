"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/Brand";
import { useDashboardCtx } from "./DashboardProvider";
import { LanguageSelector } from "@/components/site/SiteHeader";
import { AlertRinger } from "./AlertRinger";
import {
  IconAlert,
  IconArrow,
  IconBell,
  IconCard,
  IconChart,
  IconChevron,
  IconDrop,
  IconFamily,
  IconGrid,
  IconHospital,
  IconLogout,
  IconMenu,
  IconSettings,
  IconLink,
  IconShield,
  IconTelegram,
  IconUsers,
  IconX,
} from "@/components/ui/Icons";

const NAV = [
  {
    section: "Monitoring",
    items: [
      { href: "/dashboard", label: "Glucose dashboard", icon: IconGrid },
      { href: "/dashboard/history", label: "History & reports", icon: IconChart },
      { href: "/dashboard/alerts", label: "Alerts & rules", icon: IconAlert },
      { href: "/dashboard/notifications", label: "Notification centre", icon: IconBell },
      { href: "/dashboard/connection", label: "Connection settings", icon: IconLink },
    ],
  },
  {
    section: "Care circle",
    items: [
      { href: "/dashboard/family", label: "Family & caregivers", icon: IconFamily },
      { href: "/dashboard/telegram", label: "Telegram alerts", icon: IconTelegram },
      { href: "/dashboard/location", label: "Location sharing", icon: IconShield },
    ],
  },
  {
    section: "Account",
    items: [
      { href: "/dashboard/billing", label: "Plan & billing", icon: IconCard },
      { href: "/dashboard/settings", label: "Settings", icon: IconSettings },
    ],
  },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, patients, active, setActiveId } = useDashboardCtx();
  const orgName = user.orgName;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const isClinician = ["doctor", "nurse", "admin"].includes(user.role);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-[68px] items-center justify-between border-b border-line px-4">
        <BrandLockup logoSize={38} size="sm" href="/dashboard" />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="grid h-8 w-8 place-items-center rounded-lg border border-line text-navy-700 lg:hidden"
          aria-label="Close menu"
        >
          <IconX size={16} />
        </button>
      </div>

      {/* patient switcher */}
      {patients.length > 0 ? (
        <div className="border-b border-line p-3">
          <p className="px-1 pb-1.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            {isClinician ? "Monitored patient" : "Active patient"}
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-white px-2.5 py-2 text-left transition hover:border-brand-200"
              aria-expanded={pickerOpen}
            >
              <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-navy-700 text-[0.68rem] font-extrabold text-white">
                {active?.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("") ?? "—"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.82rem] font-bold text-navy-900">
                  {active?.name ?? "No patient"}
                </span>
                <span className="block truncate text-[0.66rem] font-semibold text-muted">
                  {active?.relationship ?? active?.role ?? "—"}
                </span>
              </span>
              <IconChevron size={14} className={`text-muted transition ${pickerOpen ? "rotate-90" : ""}`} />
            </button>
            {pickerOpen && patients.length > 1 ? (
              <div className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-line bg-white p-1 shadow-lg">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setActiveId(p.id);
                      setPickerOpen(false);
                      router.refresh();
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[0.8rem] transition ${
                      p.id === active?.id ? "bg-brand-50 font-bold text-brand-700" : "text-ink hover:bg-mist"
                    }`}
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="ml-2 flex-none text-[0.62rem] uppercase tracking-wider text-muted">
                      {p.unit}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {NAV.map((group) => (
          <div key={group.section} className="mb-3">
            <p className="px-2.5 pb-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const activeItem =
                  item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.83rem] font-semibold transition ${
                        activeItem
                          ? "bg-gradient-to-r from-brand-50 to-teal-50 text-brand-700 ring-1 ring-brand-100"
                          : "text-navy-800/85 hover:bg-mist"
                      }`}
                    >
                      <Icon size={17} className={activeItem ? "text-brand-600" : "text-navy-500"} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {isClinician ? (
          <div className="mb-3">
            <p className="px-2.5 pb-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
              Organisation
            </p>
            <Link
              href="/admin"
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[0.83rem] font-semibold text-navy-800/85 transition hover:bg-mist"
            >
              <IconShield size={17} className="text-navy-500" />
              Admin console
              <IconArrow size={13} className="ml-auto text-muted" />
            </Link>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2.5 rounded-xl bg-mist/70 p-2.5">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white text-[0.72rem] font-extrabold text-navy-800 ring-1 ring-line">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[0.8rem] font-bold text-navy-900">{user.name}</p>
            <p className="truncate text-[0.66rem] font-semibold capitalize text-muted">
              {user.title ?? user.role}
              {orgName ? ` · ${orgName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="grid h-8 w-8 flex-none place-items-center rounded-lg text-muted transition hover:bg-white hover:text-low"
            aria-label="Sign out"
            title="Sign out"
          >
            <IconLogout size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#f6f9fc]">
      <AlertRinger />
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[268px] border-r border-line bg-white lg:block">
        {sidebar}
      </aside>

      {/* mobile drawer */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-navy-900/40 backdrop-blur-sm transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[290px] max-w-[86vw] bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {sidebar}
        </aside>
      </div>

      <div className="lg:pl-[268px]">
        {/* top bar */}
        <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-xl">
          <div className="flex h-[62px] items-center gap-3 px-4 md:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-line text-navy-800 lg:hidden"
              aria-label="Open menu"
            >
              <IconMenu size={18} />
            </button>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.86rem] font-extrabold text-navy-900">
                {pathname === "/dashboard"
                  ? "Glucose dashboard"
                  : pathname
                      .replace("/dashboard/", "")
                      .split("/")[0]
                      .replace(/-/g, " ")
                      .replace(/^./, (c) => c.toUpperCase())}
              </p>
              <p className="flex items-center gap-1.5 text-[0.66rem] font-semibold text-muted">
                <span className="dot dot-live" />
                {user.orgType === "hospital" ? "Hospital workspace" : "Family workspace"}
                {active ? ` · ${active.name}` : ""}
              </p>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard/notifications" className="btn btn-sm btn-quiet" aria-label="Notifications">
                <IconBell size={17} />
              </Link>
              <Link href="/dashboard/telegram" className="btn btn-sm btn-quiet" aria-label="Telegram">
                <IconTelegram size={17} />
              </Link>
            </div>
            <div className="hidden md:block">
              <LanguageSelector compact />
            </div>
            <Link href="/dashboard/alerts" className="btn btn-sm btn-ghost hidden sm:inline-flex">
              <IconAlert size={15} /> Alert rules
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 py-6 md:px-6">{children}</main>

        <footer className="mx-auto w-full max-w-[1320px] px-4 pb-8 md:px-6">
          <div className="flex flex-col items-start justify-between gap-2 border-t border-line pt-4 text-[0.7rem] text-muted md:flex-row md:items-center">
            <p>
              © {new Date().getFullYear()} Walhad CareLink · Connected Families. Safer Together.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/legal/privacy" className="hover:text-brand-700">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-brand-700">
                Terms
              </Link>
              <span className="inline-flex items-center gap-1">
                <IconUsers size={12} /> {patients.length} patient record{patients.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <p className="mt-2 max-w-3xl text-[0.66rem] leading-relaxed text-muted/80">
            Alerts support but do not replace professional medical care or emergency services. Data depends on your
            sensor, the Libre apps and API access.{" "}
            <IconDrop size={10} className="inline text-teal-500" /> Last rendering{" "}
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        </footer>
      </div>
    </div>
  );
}
