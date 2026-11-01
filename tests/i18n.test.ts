import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES, dirFor, translate } from "../src/lib/i18n";

test("English is the default locale and Arabic is RTL", () => {
  assert.equal(LOCALES[0].code, "en");
  assert.equal(dirFor("ar"), "rtl");
  assert.equal(dirFor("en"), "ltr");
  assert.equal(dirFor("so"), "ltr");
});

test("translations fall back to English rather than showing keys", () => {
  const key = "nav.features";
  for (const l of LOCALES) {
    const value = translate(l.code, key);
    assert.ok(value.length > 0);
    assert.notEqual(value, key);
  }
});

test("Somali and Arabic actually differ from English for core strings", () => {
  assert.notEqual(translate("so", "nav.features"), translate("en", "nav.features"));
  assert.notEqual(translate("ar", "nav.features"), translate("en", "nav.features"));
});
