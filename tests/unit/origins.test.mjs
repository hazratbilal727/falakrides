import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source=fs.readFileSync(new URL("../../src/lib/security/origins.ts",import.meta.url),"utf8");
function origins(env, origin){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,process:{env},URL});return Array.from(exports.trustedOrigins(new Request("http://localhost:3001/api/auth/sign-in/email",{headers:{origin}})));}
test("development permits local ports and loopback addresses but rejects other hosts",()=>{
 for(const origin of ["http://localhost:3001","http://127.0.0.1:3002","http://[::1]:3003"])assert.ok(origins({NODE_ENV:"development"},origin).includes(origin));
 for(const origin of ["https://evil.example","http://localhost.evil.example:3001","null"])assert.ok(!origins({NODE_ENV:"development"},origin).includes(origin));
});
test("production trusts only configured origins",()=>{
 const env={NODE_ENV:"production",BETTER_AUTH_URL:"https://falak.example",SITE_URL:"https://www.falak.example/path",AUTH_TRUSTED_ORIGINS:"https://admin.falak.example"};
 const allowed=origins(env,"http://localhost:3001");
 assert.deepEqual(allowed,["https://falak.example","https://www.falak.example","https://admin.falak.example"]);
});
