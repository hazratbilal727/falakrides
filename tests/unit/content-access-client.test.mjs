import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = fs.readFileSync(new URL("../../src/features/content/access-client.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
const context = {exports: {}, fetch};
vm.runInNewContext(output, context);
const {ContentAccessClient} = context.exports;

test("default fetch uses the browser global receiver for PIN login and logout", async () => {
  const calls = [];
  const browser = {
    exports: {}, browserGlobal: true,
    fetch: function (url, options) {
      assert.equal(this.browserGlobal, true, "fetch must not receive ContentAccessClient as its receiver");
      calls.push(JSON.parse(options.body).action);
      return Promise.resolve(new Response('{}'));
    },
  };
  vm.runInNewContext(output, browser);
  const client = new browser.exports.ContentAccessClient();
  assert.equal((await client.send("login", "12345")).status, 200);
  assert.equal((await client.send("logout")).status, 200);
  assert.deepEqual(calls, ["login", "logout"]);
});

test("navigation logout waits for a slow PIN response and runs before a later login", async () => {
  const calls = [];
  let release;
  const client = new ContentAccessClient(async (url, options) => {
    const action = JSON.parse(options.body).action;
    calls.push(action);
    if (calls.length === 1) await new Promise(resolve => {release = resolve;});
    if (action === "logout") assert.equal(options.keepalive, true);
    return new Response('{}');
  });
  const login = client.send("login", "12345");
  const logout = client.send("logout");
  const nextLogin = client.send("login", "12345");
  await Promise.resolve();
  assert.deepEqual(calls, ["login"]);
  release();
  await Promise.all([login, logout, nextLogin]);
  assert.deepEqual(calls, ["login", "logout", "login"]);
});

test("a failed PIN request does not prevent queued logout", async () => {
  const calls = [];
  const client = new ContentAccessClient(async (url, options) => {
    const action = JSON.parse(options.body).action;
    calls.push(action);
    if (action === "login") throw new Error("Network failure");
    return new Response('{}');
  });
  const login = client.send("login", "12345");
  const logout = client.send("logout");
  await assert.rejects(login, /Network failure/);
  assert.equal((await logout).status, 200);
  assert.deepEqual(calls, ["login", "logout"]);
});
