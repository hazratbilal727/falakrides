import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source=fs.readFileSync(new URL('../../src/features/admin/exports.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{},TextEncoder,Uint8Array,Blob};
vm.runInNewContext(output,context);
const {exportCsv,exportHtml,assemblePdf}=context.exports;

test('CSV preserves all fields and Unicode, escapes quotes, and neutralizes spreadsheet formulas',()=>{
  const csv=exportCsv([{id:'1',name:'أحمد, "Ali"',note:'\n=1+1'},{id:'2',extra:'+123'}]);
  assert.ok(csv.startsWith('\uFEFF"id","name","note","extra"'));
  assert.ok(csv.includes('أحمد, ""Ali""'));
  assert.ok(csv.includes('"\'\n=1+1"'));
  assert.ok(csv.includes('"\'+123"'));
});
test('HTML escapes markup in titles, field names and values',()=>{
  const html=exportHtml({name:'test',title:'<script>alert(1)</script>',rows:[{id:'1','<img>':'<img src=x onerror=alert(1)>'}]});
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img>'));
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(html.includes('1 records'));
});
test('PDF has valid object offsets and binary stream lengths across multiple pages',()=>{
  const first=new Uint8Array([255,216,0,128,255,217]);
  const second=new Uint8Array([255,216,5,6,255,217]);
  const bytes=assemblePdf([first,second],1240,1754);
  const binary=Buffer.from(bytes).toString('latin1');
  assert.ok(binary.startsWith('%PDF-1.4'));
  assert.ok(binary.includes('/Count 2'));
  assert.equal((binary.match(/\/Length 6 >>\nstream/g)||[]).length,2);
  const xrefOffset=Number(binary.match(/startxref\n(\d+)/)[1]);
  assert.equal(binary.slice(xrefOffset,xrefOffset+4),'xref');
  const entries=binary.slice(xrefOffset).split('\n').slice(3,11);
  entries.forEach((entry,index)=>{
    const offset=Number(entry.slice(0,10));
    assert.ok(binary.slice(offset).startsWith(`${index+1} 0 obj\n`));
  });
});
