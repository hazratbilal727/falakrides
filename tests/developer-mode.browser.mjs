// Run against the local dev server. Availability and PIN setup are never changed.
import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname, resolve, basename} from 'node:path';
import assert from 'node:assert/strict';
import WebSocket from 'next/dist/compiled/ws/index.js';
import {config} from 'dotenv';
config({path: '.env.local', quiet: true});
const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
assert.ok(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD, 'Admin test credentials are required');
const login = await fetch(base + '/api/auth/sign-in/email', {method: 'POST', headers: {'Content-Type':'application/json', Origin: base}, body: JSON.stringify({email:process.env.ADMIN_EMAIL,password:process.env.ADMIN_PASSWORD})});
assert.equal(login.status, 200, 'Test admin signs in');
const cookie = login.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
const profile = await mkdtemp(join(tmpdir(), 'falak-guard-'));
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-software-rasterizer', '--disable-extensions', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {windowsHide: true});
if (process.env.DEBUG_BROWSER) {browser.stderr.on('data', chunk => process.stderr.write(chunk)); browser.on('exit', code => console.log('Chrome exit', code));}
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000);
    browser.on('error', reject);
    browser.stderr.on('data', chunk => {const match = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) {clearTimeout(timer); resolve(match[1]);}});
  });
  const address = new URL(endpoint);
  const tabs = await (await fetch(`http://${address.host}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  if (process.env.DEBUG_BROWSER) {console.log(tabs); socket.addEventListener('message', event => console.log(String(event.data))); socket.addEventListener('close', event => console.log('Socket closed', event.code, event.reason));}
  await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({data}) => {const message = JSON.parse(data); const callback = pending.get(message.id); if (callback) {pending.delete(message.id); if (message.error) callback.reject(new Error(message.error.message)); else callback.resolve(message.result);}});
  const command = (method, params = {}) => new Promise((resolve, reject) => {const id = ++sequence; const timer = setTimeout(() => reject(new Error(`DevTools timed out: ${method}`)), 15000); pending.set(id, {resolve: result => {clearTimeout(timer); resolve(result);}, reject: error => {clearTimeout(timer); reject(error);}}); socket.send(JSON.stringify({id, method, params}));});
  await command('Runtime.enable');
  const evaluate = async expression => {const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const wait = async expression => {const deadline = Date.now() + 45000; while (Date.now() < deadline) {if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 100));} throw new Error(`Timed out: ${expression}`);};
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const input = (selector, value) => evaluate(`(() => {const element = document.querySelector(${JSON.stringify(selector)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event('input', {bubbles:true}));})()`);

  await command('Network.enable');
  await command('Network.setCookies', {cookies: login.headers.getSetCookie().map(value => {const pair=value.split(';')[0];const split=pair.indexOf('=');return {name:pair.slice(0,split),value:pair.slice(split+1),url:base};})});
  for (const method of ['GET','PUT']) {
    const response = await fetch(base+'/api/admin/developer-mode', {method, headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'}, ...(method==='PUT'?{body:JSON.stringify({paused:false,version:0})}:{})});
    assert.equal(response.status, 403, 'Server rejects '+method+' without a PIN');
  }
  console.log('PASS: authenticated reads and writes require the PIN');
  // Mock only PIN UI responses; no live PIN is created and the pause flag is untouched.
  await command('Page.addScriptToEvaluateOnNewDocument', {source: `const originalFetch=window.fetch.bind(window);window.fetch=(input,options)=>{const url=new URL(typeof input==='string'?input:input.url,location.origin);if(url.pathname==='/api/admin/developer-mode/access')return Promise.resolve(new Response(JSON.stringify({configured:true}),{status:200,headers:{'Content-Type':'application/json'}}));if(url.pathname==='/api/admin/developer-mode')return Promise.resolve(new Response(JSON.stringify({paused:false,version:0}),{status:200,headers:{'Content-Type':'application/json'}}));return originalFetch(input,options);};`});
  await command('Page.navigate', {url:base+'/admin/website-content'});
  await wait('document.querySelector(".cms-page-tabs")');
  const developerTab = () => evaluate(`Array.from(document.querySelectorAll('.cms-page-tabs button')).find(button=>button.textContent==='Developer mode').click()`);
  const unlock = async () => {await wait('document.querySelector("#developer-pin")');await input('#developer-pin','12345');await wait('document.querySelector(".cms-developer-switch")');};
  await developerTab();
  await wait('document.querySelector(".cms-developer-pin-dialog[open]")');
  assert.equal(await evaluate('!!document.querySelector(".cms-developer-switch")'),false);
  await unlock();
  await evaluate(`Array.from(document.querySelectorAll('.cms-page-tabs button')).find(button=>button.textContent==='Home').click()`);
  await wait('!document.querySelector(".cms-developer-mode")');
  await developerTab();
  await wait('document.querySelector(".cms-developer-pin-dialog[open]")');
  assert.equal(await evaluate('document.querySelector("#developer-pin").value'),'');
  assert.equal(await evaluate('!!document.querySelector(".cms-developer-switch")'),false);
  console.log('PASS: changing a website content section relocks Developer mode');
  await unlock();
  await click('.adm-sidebar a[href="/admin/bookings"]');
  await wait('location.pathname==="/admin/bookings"');
  await wait('!document.querySelector(".cms-developer-mode")');
  await click('.adm-sidebar a[href="/admin/website-content"]');
  await wait('location.pathname==="/admin/website-content"');
  await wait('document.querySelector(".cms-developer-pin-dialog[open]")');
  assert.equal(await evaluate('!!document.querySelector(".cms-developer-switch")'),false);
  console.log('PASS: changing the main admin section relocks Developer mode');
} finally {
  socket?.close();browser.kill();
  await fetch(base+'/api/auth/sign-out',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:'{}'}).catch(()=>{});
  // Delete only this test's verified temporary Chrome profile.
  if(resolve(dirname(profile))===resolve(tmpdir()) && basename(profile).startsWith('falak-guard-')) await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
}
