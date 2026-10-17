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
  await evaluate('(() => {const meta=document.createElement("meta" );meta.name="viewport";meta.content="width=device-width, initial-scale=1";document.head.append(meta);})()');
  const {build} = await import('esbuild');
  const compiled = await build({stdin: {contents: 'import React from "react"; import {createRoot} from "react-dom/client"; import HeaderInbox from "./src/features/admin/components/header-inbox"; import "./src/app/admin/admin.css"; createRoot(document.getElementById("root")).render(<div className="admin-app"><header className="adm-topbar" style={{position:"relative",width:"100%",gridColumn:"1 / -1"}}><div className="adm-topbar-right" style={{marginLeft:"auto"}}><HeaderInbox editable={true}/></div></header></div>);', loader:'tsx', resolveDir:process.cwd()}, alias:{'@':process.cwd()+'/src'}, bundle:true, write:false, outfile:'header-inbox-test.js', platform:'browser', jsx:'automatic'});
  await evaluate('document.body.innerHTML = \'<div id="root"></div>\'');
  await evaluate(`(() => {
    window.__tones = 0;
    window.AudioContext = class {
      state = 'running'; currentTime = 0; destination = {};
      resume() {return Promise.resolve();} close() {this.state='closed'; return Promise.resolve();}
      createOscillator() {return {frequency:{value:0},connect(){},disconnect(){},start(){window.__tones++;},stop(){}};}
      createGain() {return {gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
    };
    const originalInterval = window.setInterval;
    window.setInterval = (callback, delay) => originalInterval(callback, delay === 8000 ? 1000 : delay);
    window.__people = [{id:'visitor-one',name:'First Visitor',updatedAt:new Date().toISOString(),messages:Array.from({length:20},(_,i)=>({id:'message-'+i,sender:i%2?'admin':'visitor',text:'Travel question '+i,createdAt:new Date().toISOString()}))},{id:'visitor-two',name:'Second Visitor',updatedAt:new Date().toISOString(),messages:[{id:'second-message',sender:'visitor',text:'Airport pickup?',createdAt:new Date().toISOString()}]}];
    window.__sent = [];
    window.fetch = async (url, options) => {
      if(options?.method === 'POST') {window.__sent.push({url,...JSON.parse(options.body)});const person=window.__people.find(p=>url.endsWith(p.id));person.messages.push({id:'reply-'+Date.now(),sender:'admin',text:JSON.parse(options.body).message,createdAt:new Date().toISOString()});return Response.json({sent:true});}
      return Response.json({conversations:window.__people});
    };
  })()`);
  for(const file of compiled.outputFiles) {
    if(file.path.endsWith('.css')) await evaluate(`(() => {const style=document.createElement('style');style.textContent=${JSON.stringify(file.text)};document.head.append(style);})()`);
    else await evaluate(file.text);
  }
  await wait('document.querySelector(".adm-inbox-trigger")');
  await evaluate(`window.dispatchEvent(new Event('pointerdown'))`);
  for(const width of [1280,375]) {
    await command('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:width<500});
    await evaluate('document.querySelector(".adm-inbox-trigger").click()');
    await wait('document.querySelectorAll(".adm-inbox-person").length === 2');
    const bounds = await evaluate('(() => {const r=document.querySelector(".adm-inbox-dropdown").getBoundingClientRect();return {left:r.left,right:r.right};})()');
    assert.ok(bounds.left >= 0 && bounds.right <= width, JSON.stringify({width, bounds}));
    await evaluate('document.querySelector(".adm-inbox-person").click()');
    await wait('document.querySelector(".adm-inbox-chat").open');
    assert.equal(await evaluate('document.querySelector("#admin-inbox-chat-title").textContent'),'First Visitor');
    const atBottom = '(() => {const e=document.querySelector(".adm-inbox-chat-thread");return Math.abs(e.scrollHeight-e.clientHeight-e.scrollTop)<3;})()';
    await wait(atBottom);
    await wait('document.querySelector("#admin-inbox-reply")');
    await evaluate('(() => {const e=document.querySelector("#admin-inbox-reply");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(e,"Your ride is available.");e.dispatchEvent(new Event("input",{bubbles:true}));})()');
    assert.equal(await evaluate(`document.querySelector('#admin-inbox-reply').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',shiftKey:true,bubbles:true,cancelable:true}))`), true);
    assert.equal(await evaluate(`document.querySelector('#admin-inbox-reply').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true}))`), true);
    assert.equal(await evaluate(`document.querySelector('#admin-inbox-reply').dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}))`), false);
    await wait('window.__sent.length > 0 && document.querySelector("#admin-inbox-reply").value === ""');
    assert.equal(await evaluate('window.__sent.at(-1).url'),'/api/admin/messages/visitor-one');
    await wait(atBottom);
    await command('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await command('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
    await wait('!document.querySelector(".adm-inbox-chat").open');
    await wait('document.activeElement.classList.contains("adm-inbox-trigger")');
    await evaluate('document.querySelector(".adm-inbox-trigger").click()');
    await wait('document.querySelectorAll(".adm-inbox-person").length === 2');
    await evaluate('document.querySelectorAll(".adm-inbox-person")[1].click()');
    await wait('document.querySelector(".adm-inbox-chat").open');
    assert.equal(await evaluate('document.querySelector("#admin-inbox-chat-title").textContent'),'Second Visitor');
    assert.equal(await evaluate('document.querySelectorAll(".adm-inbox-chat-bubble").length'),1);
    await evaluate('document.querySelector(".adm-inbox-close").click()');
    await wait('!document.querySelector(".adm-inbox-chat").open');
    await wait('document.activeElement.classList.contains("adm-inbox-trigger")');
    console.log('PASS: '+width+'px dropdown, visitor selection, popup reply, scroll, Escape and focus');
  }
  assert.equal(await evaluate('window.__tones'), 0);
  await evaluate(`window.__people[1].messages.push({id:'new-visitor-sound',sender:'visitor',text:'A new question',createdAt:new Date().toISOString()})`);
  await wait('window.__tones === 2');
  await new Promise(resolve => setTimeout(resolve, 600));
  assert.equal(await evaluate('window.__tones'), 2);
  await evaluate('document.querySelector(".adm-inbox-trigger").click()');
  await wait('document.querySelector(".adm-inbox-sound")');
  await evaluate('document.querySelector(".adm-inbox-sound").click()');
  assert.equal(await evaluate('document.querySelector(".adm-inbox-sound").getAttribute("aria-pressed")'), 'false');
  await evaluate(`window.__people[1].messages.push({id:'muted-visitor-sound',sender:'visitor',text:'Muted new question',createdAt:new Date().toISOString()})`);
  await wait(`document.querySelectorAll('.adm-inbox-person-copy > span')[1].textContent === 'Muted new question'`);
  assert.equal(await evaluate('window.__tones'), 2);
  console.log('PASS: sound for new visitor messages only, no repeat alerts, mute works');
} finally {
  socket?.close(); browser.kill();
  await new Promise(resolve => setTimeout(resolve, 1000));
  const target = resolve(profile);
  assert.ok(target.startsWith(tempRoot + sep) && target.includes('falak-messages-'));
  await rm(target, {recursive: true, force: true, maxRetries: 5, retryDelay: 200});
}
