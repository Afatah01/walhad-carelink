import type { Metadata } from "next";
import Link from "next/link";
import { IconArrow, IconBell, IconDrop, IconFamily, IconLock, IconShield } from "@/components/ui/Icons";
import { IconCard, CtaBand } from "@/components/site/PageKit";

export const metadata: Metadata = {
  title: "Glucose Monitoring, Connected Care",
  description:
    "Stay connected to real glucose readings. Receive timely alerts and keep your family informed through Walhad CareLink.",
};

const FEATURES = [
  {
    icon: <IconDrop size={20} />,
    title: "Real-Time Monitoring",
    body: "Readings arrive from your Libre sensor through an authorised connection.",
  },
  {
    icon: <IconBell size={20} />,
    title: "Smart Glucose Alerts",
    body: "Low, high and critical events notify the people who can act.",
  },
  {
    icon: <IconFamily size={20} />,
    title: "Family Connectivity",
    body: "Invite family and caregivers with permissions you control.",
  },
  {
    icon: <IconLock size={20} />,
    title: "Secure Data Sharing",
    body: "Only people you authorise can see your glucose information.",
  },
];

const STEPS = [
  { n: "01", title: "Subscribe", body: "Choose a plan." },
  { n: "02", title: "Connect Sensor", body: "Link your Libre source." },
  { n: "03", title: "Monitor", body: "Watch readings and alerts." },
];

export default function HomePage() {
  return (
    <>
      {/* ---------------- hero ---------------- */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-teal-50/50 via-white to-white">
        <div className="shell grid items-center gap-12 py-14 md:py-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1 text-[0.72rem] font-bold text-teal-700">
              <IconShield size={12} /> FreeStyle Libre monitoring
            </span>

            <h1 className="mt-5 text-[2.4rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-navy-900 md:text-[3.4rem]">
              Glucose Monitoring,
              <br />
              <span className="text-teal-600">Connected Care.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[1rem] leading-relaxed text-muted md:text-[1.08rem]">
              Stay connected to real glucose readings. Receive timely alerts and keep your family informed through
              Walhad CareLink.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary btn-lg">
                Get Started <IconArrow size={16} />
              </Link>
              <Link href="/how-it-works" className="btn btn-ghost btn-lg">
                Explore How It Works
              </Link>
            </div>
          </div>

          {/* dashboard illustration — no invented readings */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="card overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-teal-600">
                    <IconDrop size={16} />
                  </span>
                  <div>
                    <p className="text-[0.8rem] font-bold text-navy-900">Glucose</p>
                    <p className="text-[0.66rem] text-muted">Live sensor feed</p>
                  </div>
                </div>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[0.62rem] font-bold text-teal-700">
                  Connected
                </span>
              </div>

              {/* abstract chart, deliberately unlabelled */}
              <div className="mt-5 rounded-xl bg-mist/80 p-4">
                <svg viewBox="0 0 300 90" className="h-[90px] w-full" aria-hidden>
                  <defs>
                    <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0E7C86" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#0E7C86" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 62 C30 58 45 40 70 44 C95 48 108 66 132 60 C156 54 168 30 192 34 C216 38 228 58 252 50 C276 42 290 34 300 36"
                    fill="none"
                    stroke="#0E7C86"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 62 C30 58 45 40 70 44 C95 48 108 66 132 60 C156 54 168 30 192 34 C216 38 228 58 252 50 C276 42 290 34 300 36 L300 90 L0 90 Z"
                    fill="url(#heroFill)"
                  />
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {["Sensor", "Family", "Alerts"].map((label) => (
                  <div key={label} className="rounded-lg border border-line px-2 py-2 text-center">
                    <p className="text-[0.62rem] font-bold uppercase tracking-wide text-muted">{label}</p>
                    <p className="mt-0.5 text-[0.72rem] font-bold text-teal-700">Ready</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-4 -left-4 hidden rounded-xl border border-line bg-white px-3 py-2 shadow-lg sm:block">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-teal-50 text-teal-600">
                  <IconBell size={12} />
                </span>
                <div>
                  <p className="text-[0.66rem] font-bold text-navy-900">Alert sent</p>
                  <p className="text-[0.58rem] text-muted">Family notified</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- four features ---------------- */}
      <section className="shell py-14 md:py-18">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <IconCard key={f.title} icon={f.icon} title={f.title} body={f.body} />
          ))}
        </div>
      </section>

      {/* ---------------- three steps ---------------- */}
      <section className="border-y border-line bg-mist/60 py-14">
        <div className="shell">
          <h2 className="text-center text-[1.35rem] font-extrabold tracking-[-0.03em] text-navy-900 md:text-[1.7rem]">
            How it works
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="flex items-start gap-4 rounded-2xl border border-line bg-white p-5">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-navy-900 text-[0.78rem] font-extrabold text-white">
                  {s.n}
                </span>
                <div>
                  <p className="text-[0.95rem] font-bold text-navy-900">{s.title}</p>
                  <p className="mt-0.5 text-[0.84rem] text-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 text-center">
            <Link href="/how-it-works" className="text-[0.85rem] font-bold text-teal-600 hover:underline">
              See the full process →
            </Link>
          </div>
        </div>
      </section>

      <CtaBand
        title="Start monitoring today"
        body="From $30 per month. Connect a sensor and invite your family."
        primary={{ label: "Get Started", href: "/signup" }}
        secondary={{ label: "View Pricing", href: "/pricing" }}
      />
    </>
  );
}
