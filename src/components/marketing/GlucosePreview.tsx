"use client";

import { useMemo } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IconBattery, IconBell, IconDrop, IconSensor, IconTelegram } from "@/components/ui/Icons";

/** Synthetic 24h trace used purely for the marketing preview. */
function series(seed = 7) {
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out: { h: string; v: number }[] = [];
  for (let i = 0; i < 48; i++) {
    const hour = i / 2;
    const meal =
      46 * Math.exp(-((hour - 8.2) ** 2) / 2.6) +
      58 * Math.exp(-((hour - 13.4) ** 2) / 3.1) +
      50 * Math.exp(-((hour - 19.4) ** 2) / 3.4);
    const base = 98 + 12 * Math.exp(-((hour - 6) ** 2) / 3);
    const v = Math.round(base + meal + (rnd() - 0.5) * 14);
    out.push({ h: `${String(Math.floor(hour)).padStart(2, "0")}:${hour % 1 ? "30" : "00"}`, v });
  }
  return out;
}

export function GlucosePreview() {
  const data = useMemo(() => series(), []);

  return (
    <div className="relative">
      {/* glow */}
      <div className="absolute -inset-4 -z-10 rounded-[2.4rem] bg-gradient-to-br from-brand-100/70 via-white to-teal-100/70 blur-xl" />

      <div className="overflow-hidden rounded-[1.9rem] border border-white/70 bg-white shadow-[0_30px_90px_-45px_rgba(0,47,101,0.55)] ring-1 ring-line/70">
        {/* header */}
        <div className="flex items-center justify-between border-b border-line/70 bg-gradient-to-r from-[#f7fbff] to-[#f2fbf7] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-white shadow-sm ring-1 ring-line">
              <IconDrop size={16} className="text-brand-600" />
            </span>
            <div>
              <p className="text-[0.8rem] font-extrabold leading-tight text-navy-900">Aisha&rsquo;s glucose</p>
              <p className="flex items-center gap-1 text-[0.66rem] font-semibold text-muted">
                <span className="dot dot-live" /> Live · synced 2 min ago
              </p>
            </div>
          </div>
          <span className="pill pill-ok">
            <IconSensor size={12} /> Sensor active
          </span>
        </div>

        {/* current reading */}
        <div className="grid grid-cols-[auto_1fr] items-center gap-4 px-4 pb-2 pt-4">
          <div className="flex items-end gap-1.5">
            <span className="tabular text-[3.4rem] font-extrabold leading-none tracking-tight text-navy-900">112</span>
            <span className="pb-1.5 text-xs font-bold text-muted">mg/dL</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill pill-ok text-[0.7rem]">In range</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-1 text-[0.68rem] font-bold text-navy-700">
              <svg width="12" height="12" viewBox="0 0 24 24" className="-rotate-[20deg]" aria-hidden>
                <path d="M12 4v14M6 12l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              </svg>
              Rising slowly
            </span>
            <span className="text-[0.68rem] font-semibold text-muted">6.2 mmol/L</span>
          </div>
        </div>

        {/* chart */}
        <div className="h-[172px] w-full pl-0 pr-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="previewFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066C3" stopOpacity={0.26} />
                  <stop offset="70%" stopColor="#08AE86" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#08AE86" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="previewStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0066C3" />
                  <stop offset="100%" stopColor="#08AE86" />
                </linearGradient>
              </defs>
              <XAxis dataKey="h" ticks={["00:00", "06:00", "12:00", "18:00"]} tickLine={false} axisLine={false} interval={0} />
              <YAxis domain={[40, 260]} ticks={[70, 180]} tickLine={false} axisLine={false} width={44} />
              <ReferenceLine y={180} stroke="#e5b071" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={70} stroke="#e29a9a" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="chart-tip">
                      <p className="t">{label}</p>
                      <p className="v text-brand-700">{payload[0].value} mg/dL</p>
                    </div>
                  ) : null
                }
              />
              <Area
                type="monotone"
                dataKey="v"
                stroke="url(#previewStroke)"
                strokeWidth={2.6}
                fill="url(#previewFill)"
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff", fill: "#0066C3" }}
                animationDuration={1400}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* footer chips */}
        <div className="grid grid-cols-3 gap-2 border-t border-line/70 bg-[#fbfdff] px-3 py-2.5">
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-line">
            <IconBell size={13} className="text-teal-600" />
            <span className="text-[0.66rem] font-bold text-navy-800">3 family alerted</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-line">
            <IconTelegram size={13} className="text-brand-500" />
            <span className="text-[0.66rem] font-bold text-navy-800">Telegram sent</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 ring-1 ring-line">
            <IconBattery size={14} className="text-navy-600" />
            <span className="text-[0.66rem] font-bold text-navy-800">Battery 68%</span>
          </div>
        </div>
      </div>

      {/* floating alert card */}
      <div className="absolute -left-3 bottom-16 hidden w-[228px] rounded-2xl border border-line bg-white/95 p-3 shadow-[0_22px_50px_-28px_rgba(0,47,101,0.5)] backdrop-blur sm:block float">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-low-soft text-low">
            <IconBell size={14} />
          </span>
          <div>
            <p className="text-[0.72rem] font-extrabold text-navy-900">Low glucose alert</p>
            <p className="text-[0.62rem] font-semibold text-muted">Aisha · 63 mg/dL</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <span className="pill pill-low text-[0.58rem] uppercase">Contact now</span>
          <span className="text-[0.6rem] font-semibold text-muted">Acknowledged ✓</span>
        </div>
      </div>
    </div>
  );
}
