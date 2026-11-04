import Link from "next/link";
import { BrandLockup } from "@/components/Brand";
import { IconArrow } from "@/components/ui/Icons";
import { brand } from "@/lib/brand";
import type { SiteContact } from "@/lib/site-config";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Our Products", href: "/products" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/faq" },
      { label: "Technical Support", href: "/contact?topic=technical" },
      { label: "Privacy & Safety", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
];

export function SiteFooter({ contact }: { contact?: SiteContact }) {
  return (
    <footer className="bg-[#062f36] text-white">
      <div className="shell">
        {/* four columns */}
        <div className="grid gap-10 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <BrandLockup logoSize={44} size="md" onDark />
            <p className="mt-4 max-w-[300px] text-[0.875rem] leading-relaxed text-[#9fbfc4]">
              Connected glucose monitoring for families and healthcare teams — built around the FreeStyle Libre
              ecosystem.
            </p>
            {contact?.email ? (
              <a
                href={`mailto:${contact.email}`}
                className="mt-5 inline-flex items-center gap-1.5 text-[0.85rem] font-semibold text-[#7fd0d6] transition hover:text-white"
              >
                {contact.email}
                <IconArrow size={13} />
              </a>
            ) : null}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-white">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-[0.875rem] text-[#9fbfc4] transition-colors duration-200 hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* bottom strip */}
        <div className="border-t border-white/10 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="max-w-[720px] text-[0.75rem] leading-relaxed text-[#7f9fa4]">
              Walhad CareLink supports monitoring and does not replace professional medical care or emergency services.
              Always follow the advice of your clinician. In an emergency, contact local emergency services.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] text-[#7f9fa4]">
              <Link href="/legal/privacy" className="transition hover:text-white">
                Privacy
              </Link>
              <Link href="/legal/terms" className="transition hover:text-white">
                Terms
              </Link>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.07] pt-5 md:flex-row md:items-center md:justify-between">
            <p className="text-[0.72rem] text-[#6d8d92]">© {new Date().getFullYear()} {brand.suite}. All rights reserved.</p>
            <p className="max-w-[640px] text-[0.68rem] leading-relaxed text-[#6d8d92]">
              FreeStyle, FreeStyle Libre and LibreLink are trademarks of Abbott. Walhad CareLink is not affiliated with,
              endorsed by or sponsored by Abbott.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
