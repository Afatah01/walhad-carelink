import { test } from "node:test";
import assert from "node:assert/strict";
import { LOCALES, dirFor, translate } from "../src/lib/i18n";

test("English is the only locale and the document is left-to-right", () => {
  assert.equal(LOCALES.length, 1);
  assert.equal(LOCALES[0].code, "en");
  assert.equal(dirFor("en"), "ltr");
});

test("translations resolve to English strings rather than raw keys", () => {
  for (const l of LOCALES) {
    const value = translate(l.code, "nav.features");
    assert.ok(value.length > 0);
    assert.notEqual(value, "nav.features");
  }
});

test("an unknown locale falls back to English instead of blank output", () => {
  // @ts-expect-error deliberately passing a locale the product no longer ships
  assert.equal(translate("so", "nav.features"), translate("en", "nav.features"));
});
