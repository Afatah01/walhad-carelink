import { currentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { siteContact } from "@/lib/site-config";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser().catch(() => null);
  const contact = siteContact();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader signedIn={Boolean(user)} />
      <main className="flex-1">{children}</main>
      <SiteFooter contact={contact} />
    </div>
  );
}
