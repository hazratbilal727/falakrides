import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../../src/features/content/website-availability.ts", import.meta.url), "utf8");
const {outputText} = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}});
const {isPublicPage, websitePaused, websiteAvailabilityResponse} = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));

test("only an explicit persisted boolean pauses the site", () => {
  assert.equal(websitePaused({paused: true}), true);
  for (const value of [null, undefined, {}, {paused: false}, {paused: "true"}, {paused: 1}]) assert.equal(websitePaused(value), false);
});

test("all public pages are blocked with an uncached 404 and resume immediately", async () => {
  let paused = false;
  const read = async () => ({paused});
  assert.equal(await websiteAvailabilityResponse("/", read), null);
  paused = true;
  for (const pathname of ["/", "/about", "/vehicles", "/services/airport", "/book-a-ride", "/dashboard", "/admin-example", "/apiary"]) {
    const response = await websiteAvailabilityResponse(pathname, read);
    assert.equal(response?.status, 404, pathname);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-robots-tag"), "noindex");
    assert.match(await response.text(), /Page not found/);
  }
  paused = false;
  assert.equal(await websiteAvailabilityResponse("/vehicles", read), null);
});

test("admin, login, APIs and assets remain accessible without querying availability", async () => {
  for (const pathname of ["/admin", "/admin/website-content", "/login", "/login/", "/register", "/api/auth/sign-in/email", "/api/admin/developer-mode", "/_next/static/app.js", "/images/car.webp", "/fonts/inter.ttf", "/favicon.ico", "/robots.txt", "/sitemap.xml"]) {
    assert.equal(isPublicPage(pathname), false, pathname);
    assert.equal(await websiteAvailabilityResponse(pathname, async () => {throw new Error("Recovery routes must not query the pause flag");}), null);
  }
});
