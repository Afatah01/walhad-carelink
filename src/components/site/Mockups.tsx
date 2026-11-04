/**
 * Product illustrations.
 *
 * These are UI mockups of the real interface — they show the *structure* of the
 * product (a trend chart, a status row, an alert card) without containing any
 * glucose number, patient name or timestamp. Nothing here can be mistaken for a
 * live reading, which is why every frame carries an "Illustrative" caption.
 *
 * All shapes are plain CSS/SVG so there is no image weight and no layout shift.
 */

import { IconBell, IconCheck, IconDrop, IconFamily, IconHospital, IconLock, IconShield } from "@/components/ui/Icons";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function Chrome({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-[#d8e3e6]" />
      <span className="h-2 w-2 rounded-full bg-[#d8e3e6]" />
      <span className="h-2 w-2 rounded-full bg-[#d8e3e6]" />
      <span className="ml-2 truncate text-[0.6rem] font-medium tracking-wide text-faint">{label}</span>
    </div>
  );
}

/**
 * An abstract glucose curve. No axis values, no current reading — it is a shape,
 * not data.
 */
function Trend({ className = "", stroke = "#087F8C", height = 96 }: { className?: string; stroke?: string; height?: number }) {
  return (
    <svg viewBox="0 0 320 96" preserveAspectRatio="none" className={className} style={{ height }} aria-hidden>
      <defs>
        <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.16" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[24, 48, 72].map((y) => (
        <line key={y} x1="0" y1={y} x2="320" y2={y} stroke="#e9f0f2" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path
        d="M0 62 C 22 62, 30 46, 52 47 S 84 66, 104 60 S 132 30, 158 34 S 194 58, 214 50 S 250 22, 274 28 S 306 46, 320 40 L320 96 L0 96 Z"
        fill="url(#trend-fill)"
      />
      <path
        d="M0 62 C 22 62, 30 46, 52 47 S 84 66, 104 60 S 132 30, 158 34 S 194 58, 214 50 S 250 22, 274 28 S 306 46, 320 40"
        fill="none"
        stroke={stroke}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="274" cy="28" r="4.5" fill="#fff" stroke={stroke} strokeWidth="2.4" />
    </svg>
  );
}

function Tag({ children, tone = "teal" }: { children: React.ReactNode; tone?: "teal" | "blue" | "amber" }) {
  const map = {
    teal: "bg-[#eaf5f5] text-[#087f8c]",
    blue: "bg-[#edf4fc] text-[#1769d2]",
    amber: "bg-[#fdf3e4] text-[#b06f18]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-[3px] text-[0.58rem] font-semibold ${map[tone]}`}>
      {children}
    </span>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 text-center text-[0.68rem] font-medium tracking-wide text-faint">{children}</p>
  );
}

/* ------------------------------------------------------------------ */
/* 1. Phone — the family monitoring app                                */
/* ------------------------------------------------------------------ */

export function PhoneMockup({ className = "", caption = "Illustrative interface" }: { className?: string; caption?: string }) {
  return (
    <div className={className}>
      <div className="relative mx-auto w-[236px] rounded-[38px] border border-[#dbe6e9] bg-white p-[10px] shadow-[0_24px_60px_-28px_rgba(20,50,60,0.35)]">
        {/* speaker / notch */}
        <div className="absolute left-1/2 top-[18px] h-[5px] w-16 -translate-x-1/2 rounded-full bg-[#e3ecee]" />
        <div className="overflow-hidden rounded-[30px] bg-[#f8fbfc]">
          {/* app bar */}
          <div className="flex items-center justify-between px-4 pb-2 pt-7">
            <div>
              <p className="text-[0.55rem] font-semibold uppercase tracking-[0.1em] text-faint">Glucose</p>
              <p className="mt-0.5 font-[family-name:var(--font-display)] text-[0.82rem] font-bold text-[#073b43]">
                Today
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-[3px] text-[0.55rem] font-semibold text-[#16856b] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#16856b]" />
              Live
            </span>
          </div>

          {/* chart card */}
          <div className="mx-3 rounded-2xl border border-[#e8eff1] bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <Tag>In range</Tag>
              <span className="text-[0.55rem] font-medium text-faint">24 h</span>
            </div>
            <Trend className="mt-2 w-full" height={72} />
            <div className="mt-1 flex justify-between text-[0.5rem] font-medium text-[#b3c1c7]">
              <span>00</span>
              <span>06</span>
              <span>12</span>
              <span>18</span>
            </div>
          </div>

          {/* alert row */}
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-[#f6e3c7] bg-[#fdf8ef] px-2.5 py-2">
            <span className="grid h-6 w-6 flex-none place-items-center rounded-lg bg-[#f7e6c9] text-[#b06f18]">
              <IconBell size={12} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.58rem] font-semibold text-[#7a5316]">Alert sent</p>
              <p className="truncate text-[0.52rem] text-[#a8823f]">3 family members notified</p>
            </div>
          </div>

          {/* family row */}
          <div className="mx-3 my-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-md bg-[#eaf5f5] text-[#087f8c]">
                <IconFamily size={11} />
              </span>
              <span className="text-[0.55rem] font-semibold text-[#19323d]">Family</span>
            </div>
            <div className="flex -space-x-1.5">
              {["#087f8c", "#1769d2", "#1197a1"].map((c) => (
                <span
                  key={c}
                  className="h-5 w-5 rounded-full border-2 border-white"
                  style={{ background: `linear-gradient(140deg, ${c}, ${c}bb)` }}
                />
              ))}
              <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-[#eef4f6] text-[0.45rem] font-bold text-[#657782]">
                +2
              </span>
            </div>
          </div>

          {/* tab bar */}
          <div className="flex items-center justify-around border-t border-[#edf3f4] bg-white px-3 py-2">
            {[IconDrop, IconBell, IconFamily, IconLock].map((Icon, i) => (
              <span key={i} className={i === 0 ? "text-[#087f8c]" : "text-[#c2cfd4]"}>
                <Icon size={13} />
              </span>
            ))}
          </div>
        </div>
      </div>
      {caption ? <Caption>{caption}</Caption> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Desktop dashboard — family view                                  */
/* ------------------------------------------------------------------ */

export function DashboardMockup({ className = "", caption = "Illustrative interface" }: { className?: string; caption?: string }) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl border border-[#dbe6e9] bg-white shadow-[0_24px_60px_-30px_rgba(20,50,60,0.35)]">
        <div className="flex items-center justify-between border-b border-[#eaf0f2] bg-[#fbfdfd] px-4 py-2.5">
          <Chrome label="app.walhadcarelink.com" />
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf5f5] px-2 py-[3px] text-[0.55rem] font-semibold text-[#087f8c]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#087f8c]" />
            Connected
          </span>
        </div>

        <div className="grid grid-cols-[112px_1fr]">
          {/* sidebar */}
          <div className="border-r border-[#eaf0f2] bg-[#fbfdfd] p-2.5">
            {["Dashboard", "History", "Alerts", "Family", "Settings"].map((item, i) => (
              <div
                key={item}
                className={`mb-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.55rem] font-semibold ${
                  i === 0 ? "bg-[#eaf5f5] text-[#087f8c]" : "text-[#8b9aa3]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#087f8c]" : "bg-[#dce6e9]"}`} />
                {item}
              </div>
            ))}
          </div>

          {/* main */}
          <div className="p-3">
            <div className="flex items-center justify-between">
              <p className="font-[family-name:var(--font-display)] text-[0.72rem] font-bold text-[#073b43]">
                Glucose monitoring
              </p>
              <span className="rounded-md bg-[#f4f7fb] px-1.5 py-[2px] text-[0.5rem] font-medium text-[#8b9aa3]">
                Last 24 hours
              </span>
            </div>

            {/* stat strip */}
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {[
                { l: "Time in range", t: "teal" },
                { l: "Alerts today", t: "amber" },
                { l: "Sensor", t: "blue" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-[#edf3f4] bg-white px-2 py-1.5">
                  <p className="text-[0.48rem] font-medium text-[#8b9aa3]">{s.l}</p>
                  <div className="mt-1 h-1.5 w-8 rounded-full bg-[#e9f0f2]" />
                </div>
              ))}
            </div>

            {/* chart */}
            <div className="mt-2 rounded-lg border border-[#edf3f4] p-2">
              <Trend className="w-full" height={62} />
            </div>

            {/* table rows */}
            <div className="mt-2 space-y-1">
              {[1, 2].map((n) => (
                <div key={n} className="flex items-center gap-2 rounded-lg bg-[#fafcfc] px-2 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#16856b]" />
                  <div className="h-1.5 flex-1 rounded-full bg-[#eef3f4]" />
                  <div className="h-1.5 w-8 rounded-full bg-[#eef3f4]" />
                  <span className="text-[0.45rem] font-semibold text-[#b3c1c7]">OK</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {caption ? <Caption>{caption}</Caption> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 3. Hospital dashboard — ward overview                               */
/* ------------------------------------------------------------------ */

export function HospitalMockup({ className = "", caption = "Illustrative interface" }: { className?: string; caption?: string }) {
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-2xl border border-[#dbe6e9] bg-white shadow-[0_24px_60px_-30px_rgba(20,50,60,0.35)]">
        <div className="flex items-center justify-between border-b border-[#eaf0f2] bg-[#fbfdfd] px-4 py-2.5">
          <Chrome label="hospital.walhadcarelink.com" />
          <span className="inline-flex items-center gap-1 rounded-full bg-[#edf4fc] px-2 py-[3px] text-[0.55rem] font-semibold text-[#1769d2]">
            <IconHospital size={9} />
            Ward B
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-display)] text-[0.72rem] font-bold text-[#073b43]">
              Ward overview
            </p>
            <span className="rounded-md bg-[#f4f7fb] px-1.5 py-[2px] text-[0.5rem] font-medium text-[#8b9aa3]">
              Assigned staff
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {[0, 1, 2, 3].map((r) => (
              <div key={r} className="flex items-center gap-2 rounded-lg border border-[#edf3f4] bg-white px-2 py-1.5">
                <span className="h-4 w-4 rounded-md bg-[#f0f5f6]" />
                <div className="h-1.5 flex-1 rounded-full bg-[#eef3f4]" />
                <div className="hidden h-1.5 w-10 rounded-full bg-[#eef3f4] sm:block" />
                <span
                  className={`rounded px-1.5 py-[2px] text-[0.45rem] font-semibold ${
                    r === 2 ? "bg-[#fdf3e4] text-[#b06f18]" : "bg-[#e9f4f1] text-[#16856b]"
                  }`}
                >
                  {r === 2 ? "Review" : "Stable"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg bg-[#073b43] px-2 py-2 text-center">
              <p className="text-[0.45rem] font-medium text-[#8fb7bc]">Monitored</p>
              <div className="mx-auto mt-1 h-1.5 w-6 rounded-full bg-[#1197a1]" />
            </div>
            <div className="rounded-lg border border-[#edf3f4] bg-white px-2 py-2 text-center">
              <p className="text-[0.45rem] font-medium text-[#8b9aa3]">Alerts</p>
              <div className="mx-auto mt-1 h-1.5 w-6 rounded-full bg-[#eef3f4]" />
            </div>
          </div>
        </div>
      </div>
      {caption ? <Caption>{caption}</Caption> : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Alert feed — used on the Features page                           */
/* ------------------------------------------------------------------ */

export function AlertMockup({ className = "" }: { className?: string }) {
  const rows = [
    { label: "Low alert", channel: "Telegram", icon: IconBell, tone: "amber" as const },
    { label: "High alert", channel: "SMS", icon: IconBell, tone: "amber" as const },
    { label: "Rapid change", channel: "Push", icon: IconDrop, tone: "blue" as const },
    { label: "Recipients notified", channel: "Family + clinician", icon: IconCheck, tone: "teal" as const },
  ];
  return (
    <div className={`overflow-hidden rounded-2xl border border-[#e4ecef] bg-white shadow-[0_18px_44px_-26px_rgba(20,50,60,0.3)] ${className}`}>
      <div className="flex items-center justify-between border-b border-[#eaf0f2] px-4 py-3">
        <p className="font-[family-name:var(--font-display)] text-[0.78rem] font-bold text-[#073b43]">Alert feed</p>
        <span className="rounded-md bg-[#eaf5f5] px-1.5 py-[3px] text-[0.55rem] font-semibold text-[#087f8c]">
          Delivery status shown per channel
        </span>
      </div>
      <div className="divide-y divide-[#f1f6f7]">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={`grid h-7 w-7 flex-none place-items-center rounded-lg ${
                r.tone === "amber"
                  ? "bg-[#fdf3e4] text-[#b06f18]"
                  : r.tone === "blue"
                    ? "bg-[#edf4fc] text-[#1769d2]"
                    : "bg-[#e9f4f1] text-[#16856b]"
              }`}
            >
              <r.icon size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.72rem] font-semibold text-[#19323d]">{r.label}</p>
              <p className="truncate text-[0.62rem] text-[#8b9aa3]">{r.channel}</p>
            </div>
            <div className="hidden h-1.5 w-12 rounded-full bg-[#eef3f4] sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Family connection diagram                                        */
/* ------------------------------------------------------------------ */

export function FamilyDiagram({ className = "" }: { className?: string }) {
  const members = [
    { label: "Patient", tone: "deep" as const, icon: IconShield },
    { label: "Family", tone: "teal" as const, icon: IconFamily },
    { label: "Caregiver", tone: "blue" as const, icon: IconFamily },
    { label: "Clinician", tone: "teal" as const, icon: IconHospital },
  ];
  return (
    <div className={`relative ${className}`}>
      <div className="relative mx-auto grid max-w-[420px] grid-cols-2 gap-3">
        {members.map((m, i) => (
          <div
            key={m.label}
            className={`rounded-xl border p-3 ${
              m.tone === "deep"
                ? "border-[#073b43] bg-[#073b43] text-white"
                : "border-[#e4ecef] bg-white text-[#19323d]"
            } ${i === 0 ? "col-span-2" : ""}`}
          >
            <span
              className={`grid h-8 w-8 place-items-center rounded-lg ${
                m.tone === "deep" ? "bg-white/12 text-[#7fd0d6]" : m.tone === "blue" ? "bg-[#edf4fc] text-[#1769d2]" : "bg-[#eaf5f5] text-[#087f8c]"
              }`}
            >
              <m.icon size={15} />
            </span>
            <p className="mt-2 text-[0.7rem] font-semibold">{m.label}</p>
            <p className={`text-[0.58rem] ${m.tone === "deep" ? "text-[#a9c9cd]" : "text-[#8b9aa3]"}`}>
              {i === 0 ? "Controls who can view" : "Permission granted"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Illustration for About — abstract care network                   */
/* ------------------------------------------------------------------ */

export function CareIllustration({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="relative mx-auto aspect-square w-full max-w-[380px]">
        {/* concentric rings */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-[#087f8c]/12"
            style={{ inset: `${i * 12}%` }}
          />
        ))}
        <div className="absolute inset-[18%] rounded-full bg-gradient-to-br from-[#eaf5f5] to-[#edf4fc]" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid h-24 w-24 place-items-center rounded-[26px] bg-white shadow-[0_18px_40px_-18px_rgba(20,50,60,0.35)]">
            <IconDrop size={40} className="text-[#087f8c]" />
          </div>
        </div>
        {/* orbiting nodes */}
        {[
          { top: "6%", left: "44%", icon: IconFamily, tone: "bg-[#eaf5f5] text-[#087f8c]" },
          { top: "72%", left: "4%", icon: IconBell, tone: "bg-[#fdf3e4] text-[#b06f18]" },
          { top: "78%", left: "68%", icon: IconLock, tone: "bg-[#edf4fc] text-[#1769d2]" },
        ].map((n, i) => (
          <div
            key={i}
            className={`absolute grid h-12 w-12 place-items-center rounded-2xl shadow-[0_10px_24px_-12px_rgba(20,50,60,0.3)] ${n.tone}`}
            style={{ top: n.top, left: n.left }}
          >
            <n.icon size={20} />
          </div>
        ))}
      </div>
    </div>
  );
}
