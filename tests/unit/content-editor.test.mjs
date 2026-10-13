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
  assert.equal(editorSections.length, 9);
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
