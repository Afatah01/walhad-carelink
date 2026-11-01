"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/Brand";
import { IconTelegram, IconSms, IconShield, IconDrop } from "@/components/ui/Icons";
import { useI18n } from "@/components/i18n/I18nProvider";

export function SiteFooter({ contact }: { contact?: { email?: string | null; phone?: string | null; address?: string | null } }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("footer.product"),
      links: [
        { label: t("nav.features"), href: "/features" },
        { label: t("nav.how"), href: "/how-it-works" },
        { label: t("nav.products"), href: "/products" },
        { label: t("nav.pricing"), href: "/pricing" },
        { label: t("nav.hospital"), href: "/hospital-solutions" },
      ],
    },
    {
      title: t("footer.company"),
      links: [
        { label: t("nav.about"), href: "/about" },
        { label: t("nav.contact"), href: "/contact" },
        { label: t("footer.demo"), href: "/login" },
      ],
    },
    {
      title: t("footer.support"),
      links: [
        { label: "FAQ", href: "/faq" },
        { label: "Hospital onboarding", href: "/contact?topic=hospital" },
        { label: "Technical support", href: "/contact?topic=technical" },
        { label: "Privacy & safety", href: "/legal/privacy" },
        { label: "Terms of service", href: "/legal/terms" },
      ],
    },
  ];

  return (
    <footer className="relative mt-auto border-t border-line bg-[#f7fafc]">
      <div className="shell py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <BrandLockup logoSize={46} showTagline />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Helping families stay connected, informed, and prepared through intelligent glucose monitoring
              technology.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="pill pill-teal">
                <IconTelegram size={13} /> Telegram Bot
              </span>
              <span className="pill pill-brand">
                <IconSms size={13} /> SMS alerts
              </span>
              <span className="pill pill-muted">
                <IconDrop size={13} /> FreeStyle Libre
              </span>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-navy-900">{col.title}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-muted transition-colors hover:text-brand-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-lg bg-teal-50 text-teal-700">
              <IconShield size={16} />
            </span>
            <p className="text-[0.78rem] leading-relaxed text-muted">{t("footer.notice")}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <p>
            © {year} Walhad CareLink. {t("footer.rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {contact?.email ? (
              <a href={`mailto:${contact.email}`} className="link-underline hover:text-brand-700">
                {contact.email}
              </a>
            ) : null}
            {contact?.phone ? (
              <a href={`tel:${contact.phone}`} className="link-underline hover:text-brand-700">
                {contact.phone}
              </a>
            ) : null}
            {contact?.address ? <span>{contact.address}</span> : null}
            <Link href="/legal/privacy" className="link-underline hover:text-brand-700">
              Privacy
            </Link>
            <Link href="/legal/terms" className="link-underline hover:text-brand-700">
              Terms
            </Link>
          </div>
        </div>

        <p className="mt-5 text-[0.7rem] leading-relaxed text-muted/80">
          FreeStyle Libre is a trademark of Abbott. Walhad CareLink is an independent platform and is not
          affiliated with, endorsed by, or sponsored by Abbott. Access to Libre cloud data requires official
          partner approval where applicable.
        </p>
      </div>
    </footer>
  );
}
