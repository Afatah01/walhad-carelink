import Link from "next/link";
import { BrandLockup } from "@/components/Brand";
import { IconArrow } from "@/components/ui/Icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[#f6f9fc]">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="shell flex h-20 items-center justify-between">
          <BrandLockup logoSize={58} size="lg" />
          <Link href="/" className="btn btn-sm btn-quiet">
            <IconArrow size={15} className="rotate-180" /> Back to site
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">{children}</main>
      <footer className="border-t border-line bg-white py-4 text-center text-[0.72rem] text-muted">
        Walhad CareLink · Connected Families. Safer Together.
      </footer>
    </div>
  );
}
