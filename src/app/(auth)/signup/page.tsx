import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { SignupForm } from "@/components/auth/SignupForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create your account", robots: { index: false } };

export default async function SignupPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="w-full max-w-3xl">
      <div className="w-full">
        <h1 className="display-2 text-navy-900">Create your account</h1>
        <p className="mt-2 text-[0.92rem] text-muted">Choose a plan. Connect your sensor after signing up.</p>

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
          Need more than 100 patients?{" "}
          <Link href="/contact?topic=hospital" className="font-bold text-brand-700 hover:underline">
            Contact us
          </Link>
        </p>
      </div>
    </div>
  );
}
