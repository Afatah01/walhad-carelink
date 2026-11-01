"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDashboardCtx } from "@/components/app/DashboardProvider";
import { DayChart, TirBar, WeekChart } from "./GlucoseChart";
import { IconChart, IconDownload, IconInfo, IconRefresh } from "@/components/ui/Icons";
import { stampTime } from "@/lib/glucose";

const RANGES = [
  { key: "24h", label: "24 hours", hours: 24 },
  { key: "7d", label: "7 days", hours: 24 * 7 },
  { key: "30d", label: "30 days", hours: 24 * 30 },
  { key: "90d", label: "90 days", hours: 24 * 90 },
] as const;

export function HistoryView() {
  const { activeId, active, globalUnit } = useDashboardCtx();
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("7d");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeId) return;
    setLoading(true);
    const hours = RANGES.find((r) => r.key === range)!.hours;
    const res = await fetch(`/api/history?patientId=${activeId}&hours=${hours}`, { cache: "no-store" });
    const json = await res.json();
    if (json.ok) setData(json);
    setLoading(false);
  }, [activeId, range]);

  useEffect(() => {
    load();
  }, [load]);

  const unit = globalUnit;
  const conv = (v: number) => (unit === "mmol/L" ? Math.round((v / 18.0182) * 10) / 10 : Math.round(v));

  const chartData = useMemo(() => {
    if (!data) return { day: [], week: [] };
    return {
      day: data.series.map((p: any) => ({ t: p.t, value: conv(p.v) })),
      week: data.daily.map((p: any) => ({
        t: p.t,
        avg: conv(p.avg),
        min: conv(p.min),
        max: conv(p.max),
        count: p.count,
      })),
    };
  }, [data, unit]);

  function exportCsv() {
    if (!data) return;
    const rows = [["timestamp", "glucose_mgdl", "glucose_" + unit.replace("/", "_"), "trend"]];
    for (const p of data.series) rows.push([new Date(p.t).toISOString(), String(p.v), String(conv(p.v)), p.trend ?? ""]);
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walhad-carelink-${active?.name?.replace(/\s+/g, "-").toLowerCase()}-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-navy-900">History &amp; reports</h1>
          <p className="text-[0.82rem] text-muted">
            Glucose history for {active?.name} — exported data uses the unit you select.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} disabled={!data} className="btn btn-sm btn-ghost">
            <IconDownload size={14} /> Export CSV
          </button>
          <button onClick={load} className="btn btn-sm btn-ghost">
            <IconRefresh size={14} />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`rounded-full border px-3 py-1.5 text-[0.78rem] font-bold transition ${
              range === r.key
                ? "border-brand-500 bg-brand-500 text-white shadow-sm"
                : "border-line bg-white text-navy-800 hover:border-brand-200"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="skeleton h-72 w-full rounded-2xl" />
      ) : !data ? null : (
        <>
          <section className="card-lg p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[0.92rem] font-extrabold text-navy-900">
                Glucose curve · {RANGES.find((r) => r.key === range)?.label}
              </h2>
              <span className="text-[0.7rem] font-semibold text-muted">
                {data.series.length} readings · target{" "}
                {unit === "mmol/L"
                  ? `${conv(data.thresholds.low)}–${conv(data.thresholds.high)} mmol/L`
                  : `${data.thresholds.low}–${data.thresholds.high} mg/dL`}
              </span>
            </div>
            {range === "24h" ? (
              <DayChart
                data={chartData.day}
                unit={unit}
                low={conv(data.thresholds.low)}
                high={conv(data.thresholds.high)}
                height={300}
              />
            ) : (
              <WeekChart
                data={chartData.week}
                unit={unit}
                low={conv(data.thresholds.low)}
                high={conv(data.thresholds.high)}
                height={300}
              />
            )}
          </section>

          <div className="grid gap-4 md:grid-cols-3">
            <section className="card p-5">
              <h2 className="text-[0.9rem] font-extrabold text-navy-900">Time in range</h2>
              <p className="text-[0.72rem] text-muted">{data.stats.count} readings in this period</p>
              <div className="mt-3">
                {data.tir.length ? <TirBar segments={data.tir} /> : <p className="text-[0.8rem] text-muted">No data.</p>}
              </div>
            </section>

            <section className="card p-5">
              <h2 className="text-[0.9rem] font-extrabold text-navy-900">Summary statistics</h2>
              <dl className="mt-3 space-y-2">
                {[
                  ["Average", `${conv(data.stats.average)} ${unit}`],
                  ["Lowest", `${conv(data.stats.min)} ${unit}`],
                  ["Highest", `${conv(data.stats.max)} ${unit}`],
                  ["Std. deviation", `${data.stats.sd} mg/dL`],
                  ["Variability (CV)", `${data.stats.cv}%`],
                  ["Est. GMI", `${data.stats.gmi}%`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between border-b border-line/70 pb-1.5 last:border-0">
                    <dt className="text-[0.78rem] font-semibold text-muted">{label}</dt>
                    <dd className="tabular text-[0.85rem] font-extrabold text-navy-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="card p-5">
              <h2 className="flex items-center gap-1.5 text-[0.9rem] font-extrabold text-navy-900">
                <IconChart size={15} className="text-brand-600" /> Daily averages
              </h2>
              <div className="mt-2 max-h-[220px] overflow-y-auto">
                <table className="w-full text-[0.78rem]">
                  <tbody>
                    {data.daily.map((d: any) => (
                      <tr key={d.t} className="border-b border-line/70 last:border-0">
                        <td className="py-1.5 font-semibold text-navy-800">
                          {new Date(d.t).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}
                        </td>
                        <td className="py-1.5 text-right tabular font-bold text-navy-900">{conv(d.avg)}</td>
                        <td className="py-1.5 pl-2 text-right text-muted">{d.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="card overflow-hidden">
            <div className="border-b border-line px-4 py-3">
              <h2 className="text-[0.9rem] font-extrabold text-navy-900">Reading log</h2>
              <p className="text-[0.72rem] text-muted">Most recent 60 readings in the selected period</p>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              <table className="tbl">
                <thead className="sticky top-0">
                  <tr>
                    <th>Time</th>
                    <th>Glucose</th>
                    <th>Status</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.readings].reverse().slice(0, 60).map((r: any) => (
                    <tr key={`${r.t}-${r.v}`}>
                      <td className="whitespace-nowrap text-[0.8rem] text-muted">{stampTime(r.t)}</td>
                      <td className="tabular font-bold text-navy-900">
                        {conv(r.v)} <span className="text-[0.66rem] font-semibold text-muted">{unit}</span>
                      </td>
                      <td>
                        <span
                          className={`pill text-[0.58rem] ${
                            r.v < data.thresholds.low
                              ? "pill-low"
                              : r.v > data.thresholds.high
                                ? "pill-high"
                                : "pill-ok"
                          }`}
                        >
                          {r.v < data.thresholds.low ? "Low" : r.v > data.thresholds.high ? "High" : "In range"}
                        </span>
                      </td>
                      <td className="text-[0.72rem] capitalize text-muted">{r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5">
            <IconInfo size={15} className="mt-0.5 flex-none text-brand-600" />
            <p className="text-[0.74rem] leading-relaxed text-muted">
              Estimated GMI is calculated from mean glucose and is not a laboratory HbA1c. Time-in-range uses the
              standard 70–180 mg/dL target unless your clinician has agreed different thresholds. Discuss any
              changes with your care team.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
