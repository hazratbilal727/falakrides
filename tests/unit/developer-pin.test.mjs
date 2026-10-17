import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../../src/features/content/developer-pin-crypto.ts", import.meta.url), "utf8");
const {outputText} = ts.transpileModule(source, {compilerOptions: {target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext}});
const {verifyDeveloperPin} = await import("data:text/javascript;base64," + Buffer.from(outputText).toString("base64"));

test("only the requested five-digit PIN unlocks Developer mode", () => {
  assert.equal(verifyDeveloperPin("12345"), true);
  for (const pin of ["", "1234", "123456", "54321", "00000", "12a45", "12345 "]) assert.equal(verifyDeveloperPin(pin), false);
});
