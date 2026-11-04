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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* floating navigation container */}
      <div className="sticky top-0 z-50 pt-3 md:pt-4">
        <div className="shell">
          <header
            className={`mx-auto flex h-[64px] max-w-[1240px] items-center justify-between gap-4 rounded-[16px] border border-hair bg-white/[0.96] pl-3 pr-2.5 backdrop-blur-md transition-shadow duration-300 md:h-[76px] md:pl-4 md:pr-3 ${
              scrolled ? "shadow-[0_8px_30px_rgba(20,50,60,0.10)]" : "shadow-[0_8px_30px_rgba(20,50,60,0.07)]"
            }`}
          >
            <Link href="/" className="flex flex-none items-center gap-2.5" aria-label="Walhad CareLink home">
              <BrandLockup logoSize={40} size="md" />
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {NAV_LINKS.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-[9px] px-[13px] py-[10px] text-[0.875rem] font-[550] transition-colors duration-200 ${
                      active ? "bg-aqua text-teal-500" : "text-[#52636b] hover:text-teal-500"
                    }`}
                  >
                    {t(link.key)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex flex-none items-center gap-2">
              <Link
                href={signedIn ? "/dashboard" : "/login"}
                className="btn btn-sm btn-quiet hidden sm:inline-flex"
              >
                {signedIn ? t("nav.dashboard") : t("nav.signIn")}
              </Link>
              <Link href="/signup" className="btn btn-sm btn-primary hidden md:inline-flex">
                {t("nav.getStarted")}
                <IconArrow size={14} />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-[10px] border border-line bg-white text-deep lg:hidden"
                aria-label={t("nav.menu")}
                aria-expanded={open}
              >
                <IconMenu size={19} />
              </button>
            </div>
          </header>
        </div>
      </div>

      {/* mobile drawer */}
      <div className={`fixed inset-0 z-[60] lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-[#073b43]/35 backdrop-blur-sm transition-opacity duration-300 ${
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
          <div className="flex items-center justify-between border-b border-hair px-5 py-4">
            <BrandLockup logoSize={38} size="md" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-9 w-9 place-items-center rounded-[10px] border border-line text-deep"
              aria-label={t("nav.close")}
            >
              <IconX size={18} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Mobile">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`mb-0.5 block rounded-[10px] px-3.5 py-3 text-[0.95rem] font-[550] transition-colors ${
                    active ? "bg-aqua text-teal-500" : "text-[#52636b] hover:bg-mist hover:text-teal-500"
                  }`}
                >
                  {t(link.key)}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-hair p-4">
            <Link
              href={signedIn ? "/dashboard" : "/login"}
              className="btn btn-ghost mb-2.5 w-full"
            >
              {signedIn ? t("nav.dashboard") : t("nav.signIn")}
            </Link>
            <Link href="/signup" className="btn btn-primary w-full">
              {t("nav.getStarted")}
              <IconArrow size={15} />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
