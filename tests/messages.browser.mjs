import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve, sep} from 'node:path';
import assert from 'node:assert/strict';
import WebSocket from 'next/dist/compiled/ws/index.js';
const tempRoot = resolve(tmpdir());
const profile = await mkdtemp(join(tempRoot, 'falak-messages-'));
const browser = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], {windowsHide: true});
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Chrome did not start')), 15000);
    browser.on('error', reject);
    browser.stderr.on('data', chunk => {const match = String(chunk).match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) {clearTimeout(timer); resolve(match[1]);}});
  });
  const tabs = await (await fetch(`http://${new URL(endpoint).host}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.once('open', resolve));
  let sequence = 0;
  const pending = new Map();
  socket.on('message', data => {const message = JSON.parse(String(data)); const item = pending.get(message.id); if (item) {pending.delete(message.id); clearTimeout(item.timer); if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);}});
  const command = (method, params = {}) => new Promise((resolve, reject) => {const id = ++sequence; pending.set(id, {resolve, reject, timer: setTimeout(() => reject(new Error(`Timeout: ${method}`)), 15000)}); socket.send(JSON.stringify({id, method, params}));});
  const evaluate = async expression => {const result = await command('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true}); if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value;};
  const wait = async expression => {const deadline = Date.now() + 45000; while (Date.now() < deadline) {if (await evaluate(`Boolean(${expression})`)) return; await new Promise(resolve => setTimeout(resolve, 150));} throw new Error(`Timed out: ${expression}`);};
  await command('Page.navigate', {url: process.env.TEST_BASE_URL || 'http://localhost:3000'});
  await wait(`document.querySelector('.taxi-slide[data-active="true"] .taxi-hero-message')`);
  await wait(`Object.keys(document.querySelector('.taxi-slide[data-active="true"] .taxi-hero-message')).some(key => key.startsWith('__reactProps'))`);
  for (const width of [1280, 375]) {
    await command('Emulation.setDeviceMetricsOverride', {width, height: 850, deviceScaleFactor: 1, mobile: width < 500});
    await evaluate(`document.querySelector('.taxi-slide[data-active="true"] .taxi-hero-message').click()`);
    await wait(`document.querySelector('.website-message-dialog').open`);
    await wait(`!document.querySelector('.website-message-send').disabled`);
    assert.equal(await evaluate(`document.activeElement.id`), 'website-message-name');
    assert.equal(await evaluate(`document.querySelector('#website-message-name').required`), true);
    assert.equal(await evaluate(`document.querySelector('#website-message-text').required`), true);
    assert.equal(await evaluate(`document.querySelector('.website-message-dialog form').checkValidity()`), false);
    const bounds = await evaluate(`(() => {const r=document.querySelector('.website-message-dialog').getBoundingClientRect();return {left:r.left,right:r.right,scrollWidth:document.querySelector('.website-message-dialog').scrollWidth,clientWidth:document.querySelector('.website-message-dialog').clientWidth};})()`);
    assert.ok(bounds.left >= 0 && bounds.right <= width);
    assert.ok(bounds.scrollWidth <= bounds.clientWidth);
    await command('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    await command('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27});
    await wait(`!document.querySelector('.website-message-dialog').open`);
    console.log(`PASS: ${width}px popup layout, required fields, focus and Escape`);
  }
} finally {
  socket?.close(); browser.kill();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const target = resolve(profile);
  assert.ok(target.startsWith(tempRoot + sep) && target.includes('falak-messages-'));
  await rm(target, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
}
