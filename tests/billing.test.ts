import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_PLANS } from "../src/lib/billing/plans";

test("catalog matches the published price list", () => {
  const bySlug = Object.fromEntries(DEFAULT_PLANS.map((p) => [p.slug, p]));
  assert.equal(bySlug["family-basic"].price_cents, 3000);
  assert.equal(bySlug["family-basic"].recipient_limit, 2);
  assert.equal(bySlug["family-premium"].price_cents, 5000);
  assert.equal(bySlug["family-premium"].recipient_limit, 5);
  assert.equal(bySlug["family-premium"].highlight, 1);
  assert.equal(bySlug["hospital"].price_from, 1, "hospital price is a starting price");
  assert.equal(bySlug["hospital"].price_cents, 10000);
  assert.equal(bySlug["hospital"].recipient_limit, null, "hospital capacity is custom, not unlimited");
});

test("every plan includes Telegram in its feature list", () => {
  for (const plan of DEFAULT_PLANS) {
    const text = plan.features.join(" ").toLowerCase();
    assert.ok(text.includes("telegram"), `${plan.slug} should mention Telegram`);
  }
});

test("premium-only features are not advertised on basic", () => {
  const basic = DEFAULT_PLANS.find((p) => p.slug === "family-basic")!;
  assert.ok(!basic.features.join(" ").toLowerCase().includes("location"));
});
