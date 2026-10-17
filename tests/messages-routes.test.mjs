import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, mocks) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const exports = {};
  vm.runInNewContext(source, {exports, require: name => mocks[name] || require(name), Date, Response});
  return exports;
}
test('admin replies enforce write permission, validate input, and commit reply with audit', async () => {
  let allowed = false;
  const calls = [];
  const transaction = {webConversation: {update: async data => {calls.push(['update', data]);}}, auditLog: {create: async data => {calls.push(['audit', data]);}}};
  const route = load('src/app/api/admin/messages/[id]/route.ts', {
    '@/lib/auth': {requireAdmin: async (resource, write) => {assert.equal(resource, 'feedback'); assert.equal(write, true); if (!allowed) throw new Error('Forbidden'); return {id: 'admin-test'};}},
    '@/lib/db': {db: {$transaction: async callback => callback(transaction)}},
    '@/lib/security/http': {body: request => request.json(), json: value => Response.json(value), failure: error => Response.json({error: error.message}, {status: error.message === 'Forbidden' ? 403 : 400})},
  });
  const request = message => new Request('http://localhost/api/admin/messages/conversation-test', {method: 'POST', body: JSON.stringify({message}), headers: {'Content-Type': 'application/json'}});
  const context = {params: Promise.resolve({id: 'conversation-test'})};
  assert.equal((await route.POST(request('Reply'), context)).status, 403);
  assert.equal(calls.length, 0);
  allowed = true;
  assert.equal((await route.POST(request(' '), context)).status, 400);
  assert.equal(calls.length, 0);
  assert.equal((await route.POST(request(' Your ride is available. '), context)).status, 200);
  assert.equal(calls[0][1].where.id, 'conversation-test');
  assert.equal(calls[0][1].data.messages.create.sender, 'admin');
  assert.equal(calls[0][1].data.messages.create.text, 'Your ride is available.');
  assert.equal(calls[1][1].data.userId, 'admin-test');
});
test('admin inbox enforces read permission and excludes visitor credentials', async () => {
  let allowed = false;
  let query;
  const route = load('src/app/api/admin/messages/route.ts', {
    '@/lib/auth': {requireAdmin: async resource => {assert.equal(resource, 'feedback'); if (!allowed) throw new Error('Forbidden');}},
    '@/lib/db': {db: {webConversation: {findMany: async input => {query = input; return [{id: 'conversation-test', name: 'Visitor', messages: []}];}}}},
    '@/lib/security/http': {json: value => Response.json(value), failure: () => Response.json({}, {status: 403})},
  });
  assert.equal((await route.GET()).status, 403);
  assert.equal(query, undefined);
  allowed = true;
  assert.equal((await route.GET()).status, 200);
  assert.equal(query.select.tokenHash, undefined);
  assert.equal(query.select.messages.select.text, true);
});

test('conversation management requires write access and audits block, unblock and delete', async () => {
  let allowed = false;
  const changes = [], audits = [];
  const route = load('src/app/api/admin/messages/[id]/route.ts', {
    '@/lib/auth': {requireAdmin: async (resource, write) => {assert.equal(resource, 'feedback'); assert.equal(write, true); if (!allowed) throw new Error('Forbidden'); return {id: 'admin-test'};}},
    '@/lib/db': {db: {$transaction: async callback => callback({webConversation: {update: async args => {changes.push(args);}, delete: async args => {changes.push(args);}}, auditLog: {create: async args => {audits.push(args.data);}}})}},
    '@/lib/security/http': {body: request => request.json(), json: value => Response.json(value), failure: error => Response.json({}, {status: error.message === 'Forbidden' ? 403 : 400})},
  });
  const request = (method, payload) => new Request('http://localhost/api/admin/messages/test', {method, body: JSON.stringify(payload)});
  const context = {params: Promise.resolve({id: 'conversation-test'})};
  assert.equal((await route.PATCH(request('PATCH', {blocked: true}), context)).status, 403);
  assert.equal((await route.DELETE(request('DELETE', {}), context)).status, 403);
  assert.equal(changes.length, 0);
  allowed = true;
  assert.equal((await route.PATCH(request('PATCH', {blocked: 'yes'}), context)).status, 400);
  assert.equal((await route.PATCH(request('PATCH', {blocked: true}), context)).status, 200);
  assert.equal(changes[0].data.blocked, true);
  assert.equal(audits[0].action, 'block');
  assert.equal((await route.PATCH(request('PATCH', {blocked: false}), context)).status, 200);
  assert.equal(changes[1].data.blocked, false);
  assert.equal(audits[1].action, 'unblock');
  assert.equal((await route.DELETE(request('DELETE', {}), context)).status, 200);
  assert.equal(changes[2].where.id, 'conversation-test');
  assert.equal(audits[2].action, 'delete');
});
