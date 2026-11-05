import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { board, rules } from '../src/domain/synthetic-board.js';
import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { createRequestHandler } from '../src/web/server.js';

const directory = mkdtempSync(join(tmpdir(), 'family-monopoly-acceptance-'));
const dice = [[1, 1], [1, 1], [2, 3]];
const rooms = createRoomService({
  board, rules, startingCash: 100,
  store: createRoomFileStore(join(directory, 'rooms.json')),
  rollDice: () => {
    assert.ok(dice.length, 'unexpected authoritative roll');
    return dice.shift();
  },
});
let server;
let chrome;
let socket;
const deadline = setTimeout(() => {
  console.error('Browser acceptance timed out.');
  chrome?.kill();
  socket?.close();
  server?.stop(true);
  process.exitCode = 1;
}, 60_000);
deadline.unref();

const pending = new Map();
let next = 0;
function send(method, params = {}, sessionId) {
  const id = ++next;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
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
    `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank',
  ], { stdout: 'ignore', stderr: 'inherit' });
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
      if (error) request.reject(Error(error.message));
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

const control = (type) => `[data-command=${type}]`;
const available = (type) => `document.querySelector('${control(type)}:enabled') !== null`;
const hasControl = (type) => `document.querySelector('${control(type)}') !== null`;
const ready = control('Ready');

function api(tab, path, body) {
  return tab.run(`(async () => {
    const body = ${JSON.stringify(body ?? null)};
    const result = await fetch(${JSON.stringify(path)}, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: 'Bearer ' + sessionStorage.getItem('seat'), 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: result.status, body: await result.json() };
  })()`);
}

async function sync(tab) {
  const response = await api(tab, '/api/sync?since=0');
  assert.equal(response.status, 200);
  return response.body;
}

try {
  server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: createRequestHandler(rooms) });
  await startChrome();
  const host = await tab(1280, false);
  const guest = await tab(360, true);
  await host.call('Page.navigate', { url: server.url.href });
  await host.wait("document.querySelector('#entry-form') && document.readyState === 'complete'");
  await host.run("document.querySelector('[name=name]').value = 'Chủ phòng'");
  await host.click('[value=create]');
  await host.wait("document.querySelector('#invite-link').value.startsWith('http')");
  await guest.call('Page.navigate', { url: await host.run("document.querySelector('#invite-link').value") });
  await guest.wait("document.querySelector('[name=invite]')?.value.length > 0");
  await guest.run("document.querySelector('[name=name]').value = 'Khách'");
  await guest.tap('[value=join]');
  await guest.wait("!document.querySelector('#lobby').hidden");
  await host.wait("document.querySelectorAll('#roster li').length === 2");
  await host.click(ready);
  await guest.wait("document.querySelector('#roster').innerText.includes('Chủ phòng · Đã sẵn sàng')");
  await guest.tap(ready);
  await host.wait("!document.querySelector('[data-command=Start]').disabled");
  await host.click('[data-command=Start]');
  await host.wait("!document.querySelector('#match').hidden");
  await guest.wait("!document.querySelector('#match').hidden");
  assert.equal(await guest.run('innerWidth'), 360);
  assert.equal(await guest.run('document.documentElement.scrollWidth'), 360);
  assert.equal(await host.run("document.activeElement.id"), 'turn-heading');


  const started = await sync(host);
  const unauthorized = await api(guest, '/api/command', {
    id: 'unauthorized-roll', type: 'Roll', expectedRevision: started.snapshot.revision,
  });
  assert.deepEqual(unauthorized, { status: 400, body: { error: 'ActionRejected' } });
  const unchanged = await sync(host);
  assert.deepEqual(unchanged, started);

  await host.click(control('Roll'));
  await host.wait(available('Buy'));
  const pendingPurchase = (await sync(host)).snapshot;
  assert.equal(pendingPurchase.turn.phase, 'AwaitPurchase');
  const timeOrigin = await host.run('performance.timeOrigin');
  await host.call('Page.reload');
  await host.wait(`performance.timeOrigin !== ${timeOrigin}`);
  await host.wait(available('Buy'));
  assert.deepEqual((await sync(host)).snapshot, pendingPurchase);

  await host.run("document.querySelector('summary').focus()");
  await host.key('Enter', 'Enter', 13);
  await host.wait("document.querySelector('details').open");
  await host.wait("document.querySelector('#spaces').innerText.includes('Ô 3 · Phố Hà Nội · Vị trí hiện tại')");
  await host.key('Tab', 'Tab', 9);
  assert.equal(await host.run("document.activeElement.dataset.command"), 'Buy');
  await guest.tap('summary');
  await guest.wait("document.querySelector('details').open");
  await guest.wait("document.querySelector('#spaces').innerText.includes('Ô 3 · Phố Hà Nội · Vị trí hiện tại')");

  await host.run(`(() => {
    const fetchRequest = window.fetch;
    window.fetch = (path, options) => {
      if (path === '/api/command') window.purchaseCommand = JSON.parse(options.body);
      return fetchRequest(path, options);
    };
  })()`);
  await host.key('Enter', 'Enter', 13);
  await host.wait(available('EndTurn'));
  const purchased = await sync(host);
  const duplicate = await api(host, '/api/command', await host.run('window.purchaseCommand'));
  assert.equal(duplicate.status, 200);
  assert.deepEqual(duplicate.body, purchased.history.at(-1));
  assert.deepEqual(await sync(host), purchased);
  assert.equal(purchased.snapshot.turn.seats[0].cash, 50);
  assert.deepEqual(purchased.history.at(-1).events.map(({ type, amount }) => ({ type, amount })),
    [{ type: 'PropertyBought', amount: 50 }]);

  await host.click(control('EndTurn'));
  await guest.wait(available('Roll'));
  await guest.tap(control('Roll'));
  await guest.wait(available('EndTurn'));
  await host.wait("document.querySelector('#history').innerText.includes('trả 5 xu tiền thuê')");
  const rented = await sync(guest);
  assert.deepEqual(rented.snapshot.turn.seats.map(({ cash }) => cash), [55, 95]);
  assert.deepEqual(rented.history.at(-1).events.map(({ type }) => type), ['Rolled', 'RentPaid']);
  await guest.tap(control('EndTurn'));
  await host.wait(available('Roll'));
  await host.click(control('Roll'));
  await host.wait(available('Decline'));
  await host.click(control('Decline'));
  await guest.wait(available('Bid'));

  await guest.call('Network.enable');
  const network = { latency: 0, downloadThroughput: -1, uploadThroughput: -1 };
  await guest.call('Network.emulateNetworkConditions', { ...network, offline: true });
  await guest.wait(`!document.querySelector('#connection').hidden && ${hasControl('Bid')} && !(${available('Bid')})`);
  assert.equal(await guest.run("document.querySelector('#match').hidden"), false);
  await guest.call('Network.emulateNetworkConditions', { ...network, offline: false });
  await guest.wait(available('Bid'));
  assert.ok(await guest.run("document.querySelector('[data-command=Bid]').getBoundingClientRect().height >= 44"));
  await guest.run("document.querySelector('#bid-amount').value = '30'");
  await guest.tap(control('Bid'));
  await host.wait("document.querySelector('#turn-context').innerText.includes('đang dẫn đầu với 30 xu')");
  await host.click(control('Pass'));
  await guest.wait("document.querySelector('#announcement').textContent.includes('thắng đấu giá')");
  await host.wait(available('EndTurn'));
  const settled = await sync(host);
  assert.deepEqual(settled.snapshot.turn.seats.map(({ cash }) => cash), [55, 65]);
  assert.deepEqual(settled.history.at(-1).events.map(({ type }) => type), ['AuctionPassed', 'AuctionSettled']);
  assert.equal(settled.snapshot.turn.ownership.rent, rented.snapshot.selfSeatId);
  await host.click(control('EndTurn'));
  await guest.wait(available('Roll'));
  assert.equal(dice.length, 0);

  console.log(JSON.stringify({
    result: 'PASS',
    browser: 'Chrome, independent 1280px keyboard and 360px touch contexts',
    unauthorized: { status: unauthorized.status, revision: started.snapshot.revision, newEvents: 0 },
    refresh: { revision: pendingPurchase.revision, phase: pendingPurchase.turn.phase, sameSeat: true },
    purchaseRetry: { revision: duplicate.body.revision, event: 'PropertyBought', amount: 50, newEvents: 0 },
    rent: { revision: rented.snapshot.revision, event: 'RentPaid', amount: 5 },
    auction: { revision: settled.snapshot.revision, event: 'AuctionSettled', amount: 30 },
    nextTurn: { revision: (await sync(guest)).snapshot.revision, phase: 'AwaitRoll' },
  }, null, 2));
} finally {
  clearTimeout(deadline);
  socket?.close();
  server?.stop(true);
  if (chrome) {
    chrome.kill();
    await chrome.exited;
  }
  rmSync(directory, { recursive: true, force: true });
}
