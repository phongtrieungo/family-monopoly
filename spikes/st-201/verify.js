// B-11 / ST-201: executable evidence for the AC-39 and AC-40 spike contracts.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSpikeServer } from './server.js';

const directory = mkdtempSync(join(tmpdir(), 'st-201-browser-'));
const evidence = new URL('./evidence/', import.meta.url).pathname;
mkdirSync(evidence, { recursive: true });
const server = createSpikeServer(0);
let chrome, socket;
const pending = new Map();
let next = 0;
function send(method, params = {}, sessionId) {
  const id = ++next;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, method, params });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
async function tab(width, mobile) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  await call('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile });
  await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  if (mobile) await call('Emulation.setTouchEmulationEnabled', { enabled: true });
  const run = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description);
    return result.result.value;
  };
  const wait = async (expression) => {
    for (let attempt = 0; attempt < 70; attempt++) {
      if (await run(expression)) return;
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    throw Error('Timed out: ' + expression + '\n' + await run('document.body.innerText'));
  };
  const click = (selector) => run(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const key = async (key, code, keyCode) => {
    await call('Page.bringToFront');
    await call('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode, ...(key === 'Enter' && { text: '\r' }) });
    await call('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
  };
  const tap = async (selector) => {
    const point = await run(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); node.scrollIntoView({ block: 'center' }); const rect = node.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }; })()`);
    await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  return { call, run, wait, click, key, tap };
}

async function startChrome() {
  const profile = join(directory, 'chrome');
  chrome = Bun.spawn([
    process.env.CHROME_BIN ?? 'chromium', '--headless', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank',
  ], { stdout: 'ignore', stderr: 'ignore' });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (chrome.exitCode !== null) throw Error('Chrome exited before opening DevTools');
    let address;
    try {
      const [port, endpoint] = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').trim().split('\n');
      address = `ws://127.0.0.1:${port}${endpoint}`;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await Bun.sleep(100);
      continue;
    }
    socket = new WebSocket(address);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    socket.onmessage = ({ data }) => {
      const { id, result, error } = JSON.parse(data);
      const request = pending.get(id);
      if (!request) return;
      pending.delete(id);
      if (error) request.reject(Error(request.method + ': ' + JSON.stringify(request.params) + ': ' + error.message));
      else request.resolve(result);
    };
    socket.onclose = () => {
      for (const request of pending.values()) request.reject(Error('Chrome DevTools disconnected'));
      pending.clear();
    };
    return;
  }
  throw Error('Timed out starting Chrome DevTools');
}

const shot = async (page, name) => {
  const { cssContentSize } = await page.call('Page.getLayoutMetrics');
  const { data } = await page.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 } });
  writeFileSync(join(evidence, name), Buffer.from(data, 'base64'));
};
try {
  const url = server.url.href;
  const request = (path, value) => fetch(new URL(path,url), { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(value) });
  const first=await (await request('/api/roll',{id:'accepted',expectedRevision:0})).json();
  assert.equal(first.revision,1); assert.deepEqual(first.events[0].dice,[1,1]); assert.equal(first.turn.seats[0].position,2);
  assert.deepEqual(await (await request('/api/roll',{id:'accepted',expectedRevision:0})).json(),first);
  assert.equal((await request('/api/roll',{id:'accepted',expectedRevision:1})).status,409);
  assert.equal((await request('/api/roll',{id:'new-stale',expectedRevision:0})).status,409);
  await request('/api/reset',{});
  await startChrome();
  const desktop=await tab(1280,false);
  await desktop.call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await desktop.call('Page.navigate',{url:`${url}?renderer=canvas`});
  await desktop.wait("document.querySelector('#renderer-info').dataset.renderer === 'canvas' && !!document.querySelector('#react-board svg')");
  assert.equal(await desktop.run("document.querySelectorAll('#space-list li').length"),4);
  await shot(desktop,'desktop-canvas.png');
  await desktop.run(`(() => { const canvas = document.querySelector('#phaser-board canvas'); const chunks=[]; const recorder=new MediaRecorder(canvas.captureStream(20), {mimeType:'video/webm'}); window.spikeVideo = new Promise((resolve) => { recorder.ondataavailable = (event) => chunks.push(event.data); recorder.onstop = () => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.readAsDataURL(new Blob(chunks,{type:'video/webm'})); }; }); window.spikeRecorder = recorder; recorder.start(); })()`);
  await desktop.call('Page.bringToFront'); await desktop.click('#roll'); await desktop.wait("document.body.dataset.revision === '1'");
  await desktop.wait("document.querySelector('#phaser-board').dataset.visualX === '420.0' && document.querySelector('#phaser-board').dataset.visualY === '504.0'");
  await desktop.wait("Number(document.body.dataset.motionFrames) > 0");
  const motionFrames = await desktop.run('Number(document.body.dataset.motionFrames)');
  const motionMs = await desktop.run('Number(document.body.dataset.motionMs)');
  await desktop.run('window.spikeRecorder.stop()');
  writeFileSync(join(evidence,'movement.webm'),Buffer.from(await desktop.run('window.spikeVideo'),'base64'));
  assert.equal(await desktop.run("document.querySelector('#phaser-board').dataset.actualX"),'420.0');
  await desktop.wait("document.querySelector('#react-board [data-token=host]').getAttribute('transform') === 'translate(420 504)'");
  await desktop.run("document.querySelector('#space-list').focus()");
  assert.equal(await desktop.run('document.activeElement.id'),'space-list');
  assert.match(await desktop.run("document.querySelector('#result-copy').textContent"),/1 \+ 1/);
  assert.match(await desktop.run("document.querySelector('#space-list li:nth-child(3)').textContent"),/Phố Hà Nội · Mai/);
  assert.match(await desktop.run("document.querySelector('#announcement').textContent"),/Mai đến Phố Hà Nội/);
  await desktop.call('Page.reload'); await desktop.wait("document.body.dataset.revision === '1'");
  assert.match(await desktop.run("document.querySelector('#result-copy').textContent"),/1 \+ 1/);
  await desktop.click('#reset'); await desktop.wait("document.body.dataset.revision === '0'");
  await desktop.click('#roll'); await desktop.wait("document.body.dataset.revision === '1'"); await desktop.click('#skip');
  assert.equal(await desktop.run("document.querySelector('#phaser-board').dataset.visualX"),'420.0');
  const phone=await tab(360,true);
  await phone.call('Page.navigate',{url:`${url}?renderer=canvas`});
  await phone.wait("document.querySelector('#renderer-info').dataset.renderer === 'canvas' && document.body.dataset.revision === '1'");
  await phone.tap('#reset'); await phone.wait("document.body.dataset.revision === '0'");
  await phone.tap('#roll'); await phone.wait("document.body.dataset.revision === '1' && document.querySelector('#phaser-board').dataset.actualY === '504.0'");
  assert.equal(await phone.run('document.documentElement.scrollWidth'),360);
  assert.equal(await phone.run("document.querySelector('#react-board').dataset.visualY"),'504.0');
  assert.ok(await phone.run("document.querySelector('#reset').getBoundingClientRect().height >= 44"));
  await shot(phone,'phone-canvas.png');
  const fallback=await tab(360,true);
  await fallback.call('Page.enable');
  await fallback.call('Page.addScriptToEvaluateOnNewDocument',{source: `(() => { const original=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(kind, ...rest) { if (kind === 'webgl' || kind === 'experimental-webgl' || kind === 'webgl2') return null; return original.call(this,kind,...rest); }; })()`});
  await fallback.call('Page.navigate',{url});
  await fallback.wait("document.querySelector('#renderer-info').dataset.renderer === 'canvas' && document.body.dataset.revision === '1'");
  const webgl=await tab(1280,false);
  await webgl.call('Page.navigate',{url:`${url}?renderer=webgl`});
  await webgl.wait("document.querySelector('#renderer-info').dataset.renderer === 'webgl' && document.body.dataset.revision === '1'");
  await shot(webgl,'desktop-webgl.png');
  assert.equal(await webgl.run("document.querySelector('#react-board').dataset.hostPosition"),'2');
  console.log(JSON.stringify({ result:'PASS', version:'Bun 1.4.4', viewport:['1280px','360px'], renderers:['Phaser Canvas','Phaser WebGL (SwiftShader)','Phaser AUTO without WebGL','React SVG'], dice:[1,1], destination:2, duplicateReceipt:true, motionFrames, motionMs, reducedMotion:true, skip:true, resize:'360px no horizontal overflow', evidence:'spikes/st-201/evidence/' },null,2));
} finally {
  socket?.close(); server.stop(true); if(chrome){ chrome.kill(); await chrome.exited; } rmSync(directory,{recursive:true,force:true});
}
