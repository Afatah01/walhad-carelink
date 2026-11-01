import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { seal, open, humanCode, maskEmail, timingSafeEqual, sha256 } from "../src/lib/crypto";

test("provider credentials are encrypted at rest and round-trip", () => {
  const plain = JSON.stringify({ account: "demo", token: "secret-token" });
  const cipher = seal(plain)!;
  assert.ok(!cipher.includes("secret-token"));
  assert.equal(open(cipher), plain);
});

test("bcrypt hashing verifies only the right password", async () => {
  const hash = await bcrypt.hash("CareLink2026!", 10);
  assert.equal(await bcrypt.compare("CareLink2026!", hash), true);
  assert.equal(await bcrypt.compare("wrong-password", hash), false);
});

test("linking codes are random and human-transcribable", () => {
  const a = humanCode(10);
  const b = humanCode(10);
  assert.equal(a.length, 10);
  assert.match(a, /^[A-HJ-NP-Z2-9]+$/);
  assert.notEqual(a, b);
});

test("constant-time compare rejects mismatches", () => {
  assert.equal(timingSafeEqual("abc123", "abc123"), true);
  assert.equal(timingSafeEqual("abc123", "abc124"), false);
  assert.equal(timingSafeEqual("", "x"), false);
});

test("session tokens are stored as hashes and emails are masked", () => {
  assert.equal(sha256("token").length, 64);
  assert.equal(maskEmail("aisha@walhadcarelink.demo"), "ai•••@walhadcarelink.demo");
});
