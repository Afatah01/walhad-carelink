import Link from "next/link";
import { BrandLockup } from "@/components/Brand";
import { brand } from "@/lib/brand";
import type { SiteContact } from "@/lib/site-config";

const COLUMNS = [
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

export function SiteFooter({ contact }: { contact: SiteContact }) {
  const hasContact = Boolean(contact.email || contact.phone || contact.address);

  return (
    <footer className="border-t border-line bg-white">
      <div className="shell py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,0.8fr)]">
          <div>
            <BrandLockup logoSize={46} size="md" />
            <p className="mt-4 max-w-xs text-[0.85rem] leading-relaxed text-muted">
              Connected glucose monitoring for families and healthcare teams.
            </p>
            {hasContact ? (
              <div className="mt-4 space-y-1 text-[0.82rem] text-muted">
                {contact.email ? <p>{contact.email}</p> : null}
                {contact.phone ? <p>{contact.phone}</p> : null}
                {contact.address ? <p>{contact.address}</p> : null}
              </div>
            ) : null}
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-navy-900">{col.title}</h2>
              <ul className="mt-3.5 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href + l.label}>
                    <Link
                      href={l.href}
                      className="text-[0.85rem] text-muted transition-colors hover:text-teal-600"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-[0.72rem] leading-relaxed text-muted/90">
            Walhad CareLink supports monitoring and does not replace professional medical care or emergency
            services. Always follow the advice of your clinician.
          </p>
          <p className="mt-1.5 text-[0.72rem] leading-relaxed text-muted/90">
            FreeStyle, FreeStyle Libre and LibreLink are trademarks of Abbott. Walhad CareLink is not affiliated
            with, endorsed by or sponsored by Abbott.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[0.75rem] text-muted">
            <p>
              © {new Date().getFullYear()} {brand.suite}
            </p>
            <div className="flex gap-4">
              <Link href="/legal/privacy" className="hover:text-teal-600">
                Privacy
              </Link>
              <Link href="/legal/terms" className="hover:text-teal-600">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
