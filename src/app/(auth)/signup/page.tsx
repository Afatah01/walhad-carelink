import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { SignupForm } from "@/components/auth/SignupForm";
import { BrandLockup } from "@/components/Brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create your account", robots: { index: false } };

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <main className="min-h-screen bg-[#f6f9fc]">
      <header className="border-b border-line bg-white">
        <div className="shell flex h-16 items-center justify-between">
          <BrandLockup href="/" size="sm" logoSize={34} />
          <Link href="/login" className="text-[0.82rem] font-bold text-brand-700 hover:underline">
            Sign in
          </Link>
        </div>
      </header>

      <div className="shell max-w-3xl py-8 md:py-12">
        <h1 className="text-[1.7rem] font-extrabold tracking-tight text-navy-900 md:text-[2rem]">
          Start monitoring in three steps
        </h1>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-muted">
          Choose a plan, create your account, then connect an authorised FreeStyle Libre source. One monitored patient
          per household plan.
        </p>

        <ol className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[0.72rem] font-bold uppercase tracking-[0.12em]">
          {["Plan", "Account", "Connect sensor"].map((label, i) => (
            <li key={label} className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-navy-800 text-[0.6rem] text-white">
                  {i + 1}
                </span>
                <span className={i === 0 ? "text-navy-900" : "text-muted"}>{label}</span>
              </span>
              {i < 2 ? <span className="h-px w-6 bg-line" /> : null}
            </li>
          ))}
        </ol>

        <div className="card mt-6 p-5 md:p-6">
          <SignupForm />
        </div>

        <p className="mt-5 text-center text-[0.74rem] text-muted">
          Running a hospital or clinic?{" "}
          <Link href="/contact?topic=hospital" className="font-bold text-brand-700 hover:underline">
            Request a custom plan
          </Link>
        </p>
      </div>
    </main>
  );
}
