import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {config} from 'dotenv';
import {neon} from '@neondatabase/serverless';
config({path: '.env.local', quiet: true});
const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
function client() {
  const jar = new Map();
  return async (path, method = 'GET', payload, customOrigin = origin) => {
    const response = await fetch(origin + path, {method, headers: {Origin: customOrigin, 'Content-Type': 'application/json', Cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; ')}, body: payload === undefined ? undefined : JSON.stringify(payload)});
    for (const cookie of response.headers.getSetCookie()) {const pair = cookie.split(';')[0]; const index = pair.indexOf('='); jar.set(pair.slice(0, index), pair.slice(index + 1));}
    return {status: response.status, result: await response.json()};
  };
}
test('website messages validate and persist privately across requests', async () => {
  const visitor = client(), stranger = client();
  const name = `Message test ${randomUUID()}`;
  const sql = neon(process.env.DATABASE_URL);
  const schema = new URL(process.env.DATABASE_URL).searchParams.get('schema') || 'public';
  assert.match(schema, /^[A-Za-z_][A-Za-z0-9_]*$/);
  try {
    assert.equal((await visitor('/api/messages')).result.conversation, null);
    assert.equal((await visitor('/api/admin/messages')).status, 401);
    assert.equal((await visitor('/api/messages', 'POST', {name: ' ', message: 'Hello'})).status, 400);
    assert.equal((await visitor('/api/messages', 'POST', {name, message: ' '})).status, 400);
    assert.equal((await visitor('/api/messages', 'POST', {name, message: 'Hello'}, 'https://invalid.example')).status, 403);
    const sent = await visitor('/api/messages', 'POST', {name, message: 'Can you help with my journey?'});
    assert.equal(sent.status, 201, JSON.stringify(sent.result));
    assert.equal(sent.result.conversation.messages.length, 1);
    assert.equal((await stranger('/api/messages')).result.conversation, null);
    assert.equal((await stranger('/api/admin/messages/not-owned', 'POST', {message: 'Not allowed'})).status, 401);
    assert.equal((await visitor('/api/messages')).result.conversation.messages[0].text, 'Can you help with my journey?');
    assert.equal((await visitor('/api/messages', 'POST', {name, message: 'Jeddah to Makkah'})).result.conversation.messages.length, 2);
    assert.equal((await stranger('/api/messages')).result.conversation, null);
  } finally {
    await sql.query(`DELETE FROM "${schema}"."WebConversation" WHERE name = $1`, [name]);
  }
});
