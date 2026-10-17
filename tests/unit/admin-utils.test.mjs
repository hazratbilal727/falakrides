import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../../src/features/admin/utils.ts',import.meta.url),'utf8');
const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const context={exports:{}};
vm.runInNewContext(output,context);
const {bookingGradient,createRecordId}=context.exports;

test('empty booking data produces a valid neutral chart',()=>{
  const gradient=bookingGradient([]);
  assert.equal(gradient,'conic-gradient(#e6eae3 0% 100%)');
  assert.ok(!/NaN|Infinity/.test(gradient));
});
test('rejected bookings are counted rather than shown as cancelled',()=>{
  const gradient=bookingGradient([{id:'1',status:'Completed'},{id:'2',status:'Rejected'}]);
  assert.ok(gradient.includes('#15803d 0% 50%'));
  assert.ok(gradient.includes('#d49e8e 50% 100%'));
});
test('new records can be created when randomUUID is unavailable',()=>{
  assert.equal(createRecordId('BO',[]),'BO-000001');
  assert.equal(createRecordId('BO',['BO-000001','BO-000002']),'BO-000003');
});
test('duplicate or failing random generators do not overwrite records',()=>{
  assert.equal(createRecordId('BO',['BO-ABCDEF12','BO-000001'],()=> 'abcdef12-0000'),'BO-000002');
  assert.equal(createRecordId('BO',[],()=>{throw new Error('Not supported')}),'BO-000001');
});
