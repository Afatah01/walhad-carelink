import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classify,
  convert,
  computeStats,
  formatGlucose,
  freshness,
  normalizeTrend,
  deriveTrend,
  TREND_META,
} from "../src/lib/glucose";

const T = { low: 70, high: 180, veryLow: 54, veryHigh: 250 };

test("classify maps values onto the five dashboard states", () => {
  assert.equal(classify(45, T), "critical");
  assert.equal(classify(65, T), "low");
  assert.equal(classify(120, T), "in-range");
  assert.equal(classify(200, T), "high");
  assert.equal(classify(300, T), "very-high");
});

test("unit conversion round-trips without drift", () => {
  assert.equal(convert(180, "mmol/L"), 10);
  assert.equal(convert(100, "mg/dL"), 100);
  assert.equal(formatGlucose(103, "mmol/L"), "5.7");
});

test("freshness never reports an old reading as live", () => {
  const now = Date.now();
  assert.equal(freshness(now - 60_000, now), "live");
  assert.equal(freshness(now - 15 * 60_000, now), "recent");
  assert.equal(freshness(now - 45 * 60_000, now), "stale");
  assert.equal(freshness(now - 4 * 3_600_000, now), "missing");
});

test("computeStats produces time-in-range and variability", () => {
  const now = Date.now();
  const readings = [
    { value: 100, takenAt: now - 3000 },
    { value: 120, takenAt: now - 2000 },
    { value: 60, takenAt: now - 1000 },
    { value: 220, takenAt: now },
  ];
  const s = computeStats(readings as any);
  assert.equal(s.count, 4);
  assert.equal(s.tir, 50);
  assert.equal(s.tbr, 25);
  assert.equal(s.tar, 25);
  assert.ok(s.cv > 0 && Number.isFinite(s.cv));
});

test("trend helpers map Abbott indices and deltas", () => {
  assert.equal(normalizeTrend(5), "rapid-rise");
  assert.equal(normalizeTrend(1), "rapid-fall");
  assert.equal(normalizeTrend("steady"), "steady");
  assert.equal(deriveTrend([{ value: 100, takenAt: 0 }, { value: 160, takenAt: 30 * 60_000 }]), "rapid-rise");
  assert.ok(Object.keys(TREND_META).length === 7);
});
