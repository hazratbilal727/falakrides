import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import vm from "node:vm";
import ts from "typescript";

const root = fileURLToPath(new URL("../../src/features/content/", import.meta.url));
const cache = new Map();
function load(file) {
  const filename = path.resolve(root, file);
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(output, {exports, require: name => load(path.resolve(path.dirname(filename), name + ".ts"))});
  return exports;
}
const {contentFields} = load("fields.ts");
const {changedFields, fieldValue} = load("editor-utils.ts");
const {validateValues} = load("validation.ts");
const {editorSections, sectionContains} = load("editor-sections.ts");

test("combined navigation assigns every original section to exactly one group", () => {
  assert.equal(editorSections.length, 10);
  for (const field of contentFields) {
    assert.equal(editorSections.filter(group => sectionContains(group.id, field.section)).length, 1, field.section);
    assert.equal(sectionContains("all", field.section), true);
  }
});

test("group selection includes related fields and excludes unrelated fields", () => {
  for (const section of ["fleet", "Vehicles"]) assert.equal(sectionContains("vehicles", section), true);
  for (const section of ["contact", "whatsapp-title", "whatsapp-chat", "whatsapp-description"]) assert.equal(sectionContains("contact", section), true);
  assert.equal(sectionContains("contact", "booking"), false);
  assert.equal(sectionContains("unknown", "booking"), false);
});

test("explicit default values and key order do not create false publish changes", () => {
  const field = contentFields[0];
  assert.equal(fieldValue(field, {}), field.value);
  assert.equal(changedFields({[field.id]: field.value}, {}).length, 0);
  const a = contentFields[0].id, b = contentFields[1].id;
  assert.equal(changedFields({[a]: "First", [b]: "Second"}, {[b]: "Second", [a]: "First"}).length, 0);
});

test("removing a live override appears in the publish review as a restored default", () => {
  const field = contentFields[0];
  const changes = changedFields({}, {[field.id]: "Published override"});
  assert.equal(changes.length, 1);
  assert.equal(changes[0].id, field.id);
  assert.equal(fieldValue(changes[0], {}), field.value);
  assert.equal(fieldValue(field, {[field.id]: ""}), "");
});

test("draft validation rejects invalid fields even outside the visible section", () => {
  assert.throws(() => validateValues({"contact.email": "invalid"}), /valid email/);
  assert.throws(() => validateValues({unknown: "Value"}), /Invalid content field/);
  const image = contentFields.find(field => field.kind === "image");
  assert.throws(() => validateValues({[image.id]: "javascript:alert(1)"}), /Unsplash/);
  assert.equal(validateValues({"contact.email": "hello@example.com"})["contact.email"], "hello@example.com");
});

const {defaultWebsite,websiteField,parseWebsite,websiteFromValues,websiteChanges,isSafePublicImage}=load("website-model.ts");
const website=()=>JSON.parse(JSON.stringify(defaultWebsite));
test("current public data is registered with the existing draft and publish editor",()=>{
  assert.equal(contentFields.find(field=>field.id==="public.website").kind,"website");
  assert.equal(parseWebsite(websiteField.value).services.length,3);
  assert.equal(parseWebsite(websiteField.value).vehicles.length,6);
  assert.equal(websiteFromValues({}).faqs.length,6);
  assert.equal(validateValues({"public.website":websiteField.value})["public.website"],websiteField.value);
});
test("website validation rejects unsafe image references, duplicate slugs, unknown sections and malformed records",()=>{
  for(const image of ["javascript:alert(1)","/images/../private.png","https://untrusted.example/car.jpg"]){const d=website();d.slides[0].image=image;assert.throws(()=>parseWebsite(JSON.stringify(d)),/image/i);}
  const d=website();d.services.push({...d.services[0],id:"other"});assert.throws(()=>parseWebsite(JSON.stringify(d)),/unique/i);
  const bad=website();bad.homeSections[0].key="unknown";assert.throws(()=>parseWebsite(JSON.stringify(bad)),/section/i);
  const nested=website();nested.services[0].sections[0].items=[{}];assert.throws(()=>parseWebsite(JSON.stringify(nested)),/destinations/i);
  const nav=website();nav.copy.navHome="";assert.throws(()=>parseWebsite(JSON.stringify(nav)),/Home link/i);
  assert.equal(isSafePublicImage("/images/reference/camry.jpg"),true);
  assert.equal(isSafePublicImage("photo-1565552645632-d725f8bfc19a"),true);
});
test("publish review identifies additions, removals, edits, visibility changes and order changes",()=>{
  const d=website();d.slides[0].title="New public heading";d.faqs[0].visible=false;d.vehicles.pop();d.services.push({...d.services[0],id:"new-service",slug:"new-service"});d.itineraries.reverse();d.copy.footerTitle="Updated footer";
  const changes=websiteChanges(websiteField.value,JSON.stringify(d));
  assert.ok(changes.some(value=>value.includes("Updated slides")));
  assert.ok(changes.some(value=>value.includes("Updated faqs")));
  assert.ok(changes.some(value=>value.includes("Removed vehicles")));
  assert.ok(changes.some(value=>value.includes("Added services")));
  assert.ok(changes.some(value=>value.includes("Reordered itineraries")));
  assert.ok(changes.some(value=>value.includes("Footer: Heading")));
});
test("draft editing retains temporarily incomplete fields until save validation",()=>{
  const d=website();d.slides[0].title="";const values={"public.website":JSON.stringify(d)};
  assert.equal(websiteFromValues(values,true).slides[0].title,"");
  assert.throws(()=>validateValues(values),/slide title/i);
});
