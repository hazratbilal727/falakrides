import {test} from "node:test";
import assert from "node:assert/strict";
import {config} from "dotenv";
config({path: ".env.local", quiet: true});
const origin = process.env.TEST_BASE_URL || "http://localhost:3000";

test("public content exposes published data without drafts or private access", async () => {
  const response = await fetch(`${origin}/api/content`);
  assert.equal(response.status, 200);
  const content = await response.json();
  assert.ok(content.values && content.catalog);
  assert.equal("draft" in content, false);
  assert.equal((await fetch(`${origin}/api/content?admin=1`)).status, 401);
});

test("a content PIN cannot bypass the administrator login", async () => {
  const response = await fetch(`${origin}/api/content/access`, {method: "POST", headers: {Origin: origin, "Content-Type": "application/json"}, body: JSON.stringify({action: "login", pin: process.env.CONTENT_ADMIN_PIN || "12345"})});
  assert.equal(response.status, 401);
  const write = await fetch(`${origin}/api/content`, {method: "POST", headers: {Origin: origin, "Content-Type": "application/json"}, body: JSON.stringify({action: "publish", version: 0, values: {}})});
  assert.equal(write.status, 401);
});