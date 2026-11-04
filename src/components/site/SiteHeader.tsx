"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "@/components/Brand";
import { IconArrow, IconGlobe, IconMenu, IconX } from "@/components/ui/Icons";
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

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, list, t } = useI18n();
  const [open, setOpen] = useState(false);
  const current = list.find((l) => l.code === locale) ?? list[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-white/80 px-2.5 py-1.5 text-xs font-bold text-navy-800 transition hover:border-brand-200 hover:bg-white"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.label")}
      >
        <IconGlobe size={15} />
        {compact ? current.code.toUpperCase() : current.native}
      </button>
      {open ? (
        <>
          <button className="fixed inset-0 z-30 cursor-default" aria-hidden onClick={() => setOpen(false)} tabIndex={-1} />
          <ul
            role="listbox"
            className="absolute right-0 z-40 mt-2 w-40 overflow-hidden rounded-xl border border-line bg-white p-1 shadow-lg"
          >
            {list.map((l) => (
              <li key={l.code}>
                <button
                  role="option"
                  aria-selected={l.code === locale}
                  onClick={() => {
                    setLocale(l.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    l.code === locale ? "bg-brand-50 font-bold text-brand-700" : "text-ink hover:bg-mist"
                  }`}
                >
                  <span>{l.native}</span>
                  <span className="text-[0.65rem] uppercase tracking-wider text-muted">{l.code}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

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
            ? "border-line/90 bg-white/92 shadow-[0_6px_24px_-18px_rgba(0,47,101,0.5)] backdrop-blur-xl"
            : "border-transparent bg-white/75 backdrop-blur-md"
        }`}
      >
        <div className="shell flex h-[72px] items-center justify-between gap-4">
          <BrandLockup priority logoSize={44} size="md" />

          <nav className="hidden items-center gap-x-0.5 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative whitespace-nowrap rounded-full px-2.5 py-2 text-[0.82rem] font-semibold transition-colors ${
                  isActive(link.href)
                    ? "text-brand-700"
                    : "text-navy-800/80 hover:text-brand-700"
                }`}
              >
                {t(link.key)}
                {isActive(link.href) ? (
                  <span className="absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-gradient-to-r from-teal-500 to-brand-500" />
                ) : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <LanguageSelector />
            </div>
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="btn btn-sm btn-ghost hidden sm:inline-flex"
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
            <BrandLockup logoSize={38} size="sm" />
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
              <LanguageSelector compact />
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
