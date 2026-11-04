"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/Brand";
import { IconArrow, IconMenu, IconX } from "@/components/ui/Icons";
import { useI18n } from "@/components/i18n/I18nProvider";

export const NAV_LINKS = [
  { key: "nav.home", href: "/" },
  { key: "nav.about", href: "/about" },
  { key: "nav.products", href: "/products" },
  { key: "nav.how", href: "/how-it-works" },
  { key: "nav.features", href: "/features" },
  { key: "nav.pricing", href: "/pricing" },
  { key: "nav.contact", href: "/contact" },
 ] as const;

export function SiteHeader({ signedIn = false }: { signedIn?: boolean }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "border-line bg-white/95 shadow-[0_4px_20px_-16px_rgba(13,43,49,0.4)] backdrop-blur-xl"
            : "border-line/70 bg-white/85 backdrop-blur-md"
        }`}
      >
        <div className="shell flex h-[80px] items-center justify-between gap-4">
          <BrandLockup priority logoSize={54} size="xl" />

          <nav className="hidden items-center gap-x-0.5 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-[0.84rem] font-semibold transition-colors ${
                  isActive(link.href) ? "text-teal-700" : "text-navy-900/70 hover:text-teal-700"
                }`}
              >
                {t(link.key)}
                {isActive(link.href) ? (
                  <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-teal-500" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="btn btn-sm btn-quiet hidden sm:inline-flex"
            >
              {signedIn ? t("nav.dashboard") : t("nav.signIn")}
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm hidden md:inline-flex">
              {t("nav.getStarted")}
              <IconArrow size={15} />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white text-navy-800 lg:hidden"
              aria-label={t("nav.menu")}
              aria-expanded={open}
            >
              <IconMenu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <div
          className={`absolute inset-0 bg-navy-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 flex h-full w-[min(88vw,380px)] flex-col bg-white shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={t("nav.menu")}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <BrandLockup logoSize={48} size="lg" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line text-navy-800"
              aria-label={t("nav.close")}
            >
              <IconX size={18} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition ${
                  isActive(link.href) ? "bg-brand-50 text-brand-700" : "text-navy-800 hover:bg-mist"
                }`}
              >
                {t(link.key)}
                <IconArrow size={16} className="opacity-40" />
              </Link>
            ))}
          </nav>
          <div className="space-y-2 border-t border-line p-4">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">{t("lang.label")}</span>
            </div>
            <Link href={signedIn ? "/dashboard" : "/login"} className="btn btn-ghost w-full">
              {signedIn ? t("nav.dashboard") : t("nav.signIn")}
            </Link>
            <Link href="/signup" className="btn btn-primary w-full">
              {t("nav.getStarted")}
              <IconArrow size={16} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
