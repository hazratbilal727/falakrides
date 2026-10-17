import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
import ts from "typescript";

function security() {
  let now = 1_800_000_000_000;
  const env = {CONTENT_ADMIN_PIN: "12345", CONTENT_SESSION_SECRET: "test-only-secret-32-characters-minimum"};
  const context = {exports: {}, process: {env}, require: () => crypto, Date: {now: () => now}};
  const source = fs.readFileSync(new URL("../../src/features/content/security.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(output, context);
  return {api: context.exports, env, advance: ms => {now += ms;}};
}

test("PIN is required and server configuration fails closed", () => {
  const {api, env} = security();
  assert.equal(api.pinMatches("12345"), true);
  for (const pin of ["00000", "1234", "12345 ", "abcde"]) assert.equal(api.pinMatches(pin), false);
  env.CONTENT_SESSION_SECRET = "short";
  assert.equal(api.configured(), false);
  assert.equal(api.pinMatches("12345"), false);
});

test("content sessions reject tampering, legacy signatures, expired access and changed PINs", () => {
  const {api, env, advance} = security();
  const session = api.createSession();
  assert.equal(api.validSession(session), true);
  assert.equal(api.validSession(undefined), false);
  assert.equal(api.validSession(`${session}.extra`), false);
  assert.equal(api.validSession(session.slice(0, -1) + (session.endsWith("a") ? "b" : "a")), false);
  const value = session.split(".").slice(0, 2).join(".");
  const legacy = crypto.createHmac("sha256", env.CONTENT_SESSION_SECRET).update(value).digest("hex");
  assert.equal(api.validSession(`${value}.${legacy}`), false);
  env.CONTENT_ADMIN_PIN = "67890";
  assert.equal(api.validSession(session), false);
  env.CONTENT_ADMIN_PIN = "12345";
  advance(15 * 60 * 1000);
  assert.equal(api.validSession(session), false);
});

test("PIN attempt limit resets after the cooldown", () => {
  const {api, advance} = security();
  for (let i = 0; i < 5; i++) assert.equal(api.allowRequest("pin", 5, 900000), true);
  assert.equal(api.allowRequest("pin", 5, 900000), false);
  advance(900000);
  assert.equal(api.allowRequest("pin", 5, 900000), true);
});
