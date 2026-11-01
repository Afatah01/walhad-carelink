"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DayPoint {
  t: number;
  value: number;
}

export interface WeekPoint {
  t: number;
  avg: number;
  min: number;
  max: number;
  count: number;
}

/** A day bucket may also carry n=0 (no readings) — those points are skipped. */
const hasValue = (v: unknown) => typeof v === "number" && Number.isFinite(v);

const fmtTime = (t: number) =>
  new Date(t).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (t: number) => new Date(t).toLocaleDateString("en-GB", { weekday: "short" });

/** Explicit tick set so the first tick never collides with the y-axis labels. */
function dayTicks(data: { t: number }[]): number[] {
  const n = data.length;
  if (n <= 8) return data.map((d) => d.t);
  const step = Math.ceil(n / 7);
  const out: number[] = [];
  for (let i = 0; i < n; i += step) out.push(data[i].t);
  return out;
}

/** 24-hour glucose curve with target band and low/high shading. */
export function DayChart({
  data,
  unit,
  low,
  high,
  height = 260,
}: {
  data: DayPoint[];
  unit: "mg/dL" | "mmol/L";
  low: number;
  high: number;
  height?: number;
}) {
  const domain = useMemo<[number, number]>(() => {
    const values = data.map((d) => d.value).filter(hasValue);
    if (!values.length) return unit === "mmol/L" ? [2, 18] : [40, 320];
    const min = Math.min(...values, low) - (unit === "mmol/L" ? 1.2 : 22);
    const max = Math.max(...values, high) + (unit === "mmol/L" ? 1.8 : 34);
    return [Math.max(0, Math.round(min)), Math.round(max)];
  }, [data, low, high, unit]);

  if (!data.length) {
    return (
      <div className="grid place-items-center rounded-xl bg-mist/50 text-center" style={{ height }}>
        <div>
          <p className="text-[0.85rem] font-bold text-navy-800">No readings in the last 24 hours</p>
          <p className="mt-1 text-[0.76rem] text-muted">
            We will plot the curve as soon as new data arrives from the sensor.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 10, left: 2, bottom: 6 }}>
          <defs>
            <linearGradient id="dayFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066C3" stopOpacity={0.24} />
              <stop offset="72%" stopColor="#08AE86" stopOpacity={0.07} />
              <stop offset="100%" stopColor="#08AE86" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="dayStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0066C3" />
              <stop offset="100%" stopColor="#08AE86" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef3f8" vertical={false} />
          <ReferenceArea y1={low} y2={high} fill="#0f9d76" fillOpacity={0.06} />
          <ReferenceLine y={high} stroke="#e0a95e" strokeDasharray="5 5" strokeWidth={1} />
          <ReferenceLine y={low} stroke="#e29a9a" strokeDasharray="5 5" strokeWidth={1} />
          <XAxis
            dataKey="t"
            tickFormatter={fmtTime}
            tickLine={false}
            axisLine={false}
            minTickGap={38}
            interval="preserveStartEnd"
          />
          <YAxis domain={domain} tickLine={false} axisLine={false} width={40} tickCount={5} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as DayPoint;
              const v = p.value;
              const tone = v < low ? "text-low" : v > high ? "text-high" : "text-teal-600";
              return (
                <div className="chart-tip">
                  <p className="t">{fmtTime(p.t)}</p>
                  <p className={`v ${tone}`}>
                    {v} {unit}
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#dayStroke)"
            strokeWidth={2.6}
            fill="url(#dayFill)"
            dot={false}
            connectNulls
            activeDot={{ r: 4.5, strokeWidth: 2, stroke: "#fff", fill: "#0066C3" }}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Seven-day range chart (min–max bar with average line). */
export function WeekChart({
  data,
  unit,
  low,
  high,
  height = 240,
}: {
  data: WeekPoint[];
  unit: "mg/dL" | "mmol/L";
  low: number;
  high: number;
  height?: number;
}) {
  const points = useMemo(
    () =>
      data.map((d) =>
        d.count > 0 && hasValue(d.avg) && hasValue(d.min) && hasValue(d.max) ? d : { ...d, avg: null, min: null, max: null },
      ),
    [data],
  );
  const filled = points.filter((d) => hasValue(d.min) && hasValue(d.max));

  if (!filled.length) {
    return (
      <div className="grid place-items-center rounded-xl bg-mist/50 text-center" style={{ height }}>
        <p className="text-[0.82rem] font-semibold text-muted">Not enough history yet for a weekly view.</p>
      </div>
    );
  }
  const domain: [number, number] = [
    Math.max(0, Math.floor(Math.min(...filled.map((d) => d.min as number)) - (unit === "mmol/L" ? 1 : 20))),
    Math.ceil(Math.max(...filled.map((d) => d.max as number), high) + (unit === "mmol/L" ? 1.5 : 28)),
  ];
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 12, left: 2, bottom: 6 }}>
          <CartesianGrid stroke="#eef3f8" vertical={false} />
          <ReferenceArea y1={low} y2={high} fill="#0f9d76" fillOpacity={0.06} />
          <ReferenceLine y={high} stroke="#e0a95e" strokeDasharray="5 5" strokeWidth={1} />
          <ReferenceLine y={low} stroke="#e29a9a" strokeDasharray="5 5" strokeWidth={1} />
          <XAxis
            dataKey="t"
            ticks={dayTicks(points)}
            tickFormatter={fmtDay}
            tickLine={false}
            axisLine={false}
            interval={0}
            padding={{ left: 14, right: 14 }}
          />
          <YAxis domain={domain} tickLine={false} axisLine={false} width={40} tickCount={5} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as WeekPoint;
              return (
                <div className="chart-tip">
                  <p className="t">{new Date(p.t).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
                  <p className="v text-brand-700">
                    Avg {p.avg} {unit}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] font-semibold text-muted">
                    Range {p.min}–{p.max} · {p.count} readings
                  </p>
                </div>
              );
            }}
          />
          <Line type="monotone" dataKey="min" stroke="#bfd8ee" strokeWidth={1.5} dot={false} strokeDasharray="3 3" connectNulls />
          <Line type="monotone" dataKey="max" stroke="#bfd8ee" strokeWidth={1.5} dot={false} strokeDasharray="3 3" connectNulls />
          <Line
            type="monotone"
            dataKey="avg"
            connectNulls
            stroke="#0066C3"
            strokeWidth={2.8}
            dot={{ r: 3.5, fill: "#fff", stroke: "#0066C3", strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Time-in-range stacked bar. */
export function TirBar({
  segments,
}: {
  segments: { id: string; label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-mist">
        {segments.map((s) => (
          <div
            key={s.id}
            style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.value}%`}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.id} className="flex items-center justify-between text-[0.76rem]">
            <span className="flex items-center gap-1.5 font-semibold text-navy-800">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="tabular font-bold text-navy-900">{s.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Toggle between 24h and 7d for the main chart. */
export function ChartTabs({
  tab,
  setTab,
}: {
  tab: "day" | "week";
  setTab: (t: "day" | "week") => void;
}) {
  return (
    <div className="flex rounded-full border border-line bg-white p-0.5">
      {(["day", "week"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTab(t)}
          className={`rounded-full px-3 py-1 text-[0.74rem] font-bold transition ${
            tab === t ? "bg-navy-800 text-white" : "text-muted hover:text-navy-800"
          }`}
        >
          {t === "day" ? "24 hours" : "7 days"}
        </button>
      ))}
    </div>
  );
}
