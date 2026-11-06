import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { vnNeighborhoodBoard, vnOriginalRules } from '../src/domain/vn-original-content.js';
import { board, rules } from '../src/domain/synthetic-board.js';
import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { createRequestHandler } from '../src/web/server.js';

const directory = mkdtempSync(join(tmpdir(), 'family-monopoly-acceptance-'));
const dice = [[6, 6], [5, 5], [4, 4], [3, 3], [1, 2], [2, 3], [1, 2], [6, 6], [5, 5], [4, 4], [3, 3], [1, 2]];
const store = createRoomFileStore(join(directory, 'rooms.json'));
const rooms = createRoomService({ board, rules, startingCash: 100, store });
const localRooms = createRoomService({ board: vnNeighborhoodBoard, rules: vnOriginalRules, startingCash: 1200, store,
  rollDice: () => { assert.ok(dice.length, 'unexpected authoritative roll'); return dice.shift(); }, shuffleDeck: (ids) => ids });
let server;
let chrome;
let socket;
const deadline = setTimeout(() => {
  console.error('Browser acceptance timed out.');
  chrome?.kill();
  socket?.close();
  server?.stop(true);
  process.exitCode = 1;
}, 120_000);
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

const control = (type) => `[data-command="${type}"]`;
const enabled = (type) => `document.querySelector('${control(type)}:enabled') !== null`;
async function snapshot(page) {
  return page.run(`(async () => {
    const game = JSON.parse(sessionStorage.getItem('local-game'));
    const response = await fetch('/api/local/sync?since=0', { headers: { Authorization: 'Bearer ' + game.sessions[0].session } });
    if (!response.ok) throw Error('Sync failed'); return (await response.json()).snapshot;
  })()`);
}
async function handoff(page, touch = false) {
  await page.wait("document.querySelector('#confirm-handoff') && !document.querySelector('#confirm-handoff').disabled");
  if (await page.run("!document.querySelector('#local-handoff').hidden")) {
    if (touch) await page.tap('#confirm-handoff'); else await page.click('#confirm-handoff');
  }
  await page.wait("!document.querySelector('#local-controls').disabled");
}
async function choose(page, id) {
  await page.wait("!document.querySelector('#local-actor').disabled");
  await page.run(`(() => { const select = document.querySelector('#local-actor'); select.value = ${JSON.stringify(id)}; select.dispatchEvent(new Event('change')); })()`);
  await handoff(page);
}
async function setup(page, url, touch = false) {
  await page.call('Page.navigate', { url });
  await page.wait("document.querySelector('#local-setup-form') && document.readyState === 'complete'");
  await page.run("['An', 'Bình', 'Chi', 'Dũng'].forEach((name, i) => document.querySelector('[name=player' + (i + 1) + ']').value = name)");
  if (touch) await page.tap('#start-local'); else await page.click('#start-local');
  await page.wait("!document.querySelector('#local-match').hidden && !document.querySelector('#confirm-handoff').disabled");
}
let desktop;
let baseTurn;
let roomId;
async function seed(change) {
  const records = store.read(); const room = records.find((entry) => entry.id === roomId);
  room.turn = structuredClone(baseTurn); room.status = 'InMatch'; change(room.turn);
  room.revision += 1; room.history.push({ revision: room.revision, events: [] }); store.write(records);
  await desktop.wait(`document.querySelector('#local-match').dataset.revision === '${room.revision}'`);
  if (await desktop.run("!document.querySelector('#local-handoff').hidden")) await handoff(desktop);
}
async function shot(page, name) {
  const { data } = await page.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join('/tmp', name), Buffer.from(data, 'base64'));
}
try {
  server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: createRequestHandler(rooms, { localRooms }) });
  await startChrome(); desktop = await tab(1440, false);
  await setup(desktop, new URL('/local', server.url).href);
  const started = await snapshot(desktop); roomId = started.roomId;
  baseTurn = structuredClone(store.read().find((entry) => entry.id === roomId).turn);
  const ids = started.turn.seats.map(({ id }) => id);
  assert.equal(started.turn.seats.length, 4); assert.equal(started.profile.rules.id, 'vn-original-v1');
  assert.equal(await desktop.run("document.querySelectorAll('#local-board .tile').length"), 40);
  assert.equal(await desktop.run("document.querySelector('[data-command=Roll]').disabled || document.querySelector('#local-controls').disabled"), true);
  await desktop.run("document.querySelector('#confirm-handoff').focus()"); await desktop.key('Enter', 'Enter', 13);
  await desktop.wait(enabled('Roll')); await desktop.click(control('Roll')); await desktop.wait(enabled('Buy'));
  const purchase = await snapshot(desktop); assert.equal(purchase.turn.phase, 'AwaitPurchase');
  const origin = await desktop.run('performance.timeOrigin'); await desktop.call('Page.reload');
  await desktop.wait(`performance.timeOrigin !== ${origin}`); await desktop.wait("!document.querySelector('#local-handoff').hidden && !document.querySelector('#confirm-handoff').disabled");
  assert.equal((await snapshot(desktop)).roomId, roomId); await handoff(desktop);
  await desktop.run(`(() => { const original = window.fetch; let lost = false; window.fetch = async (path, options) => {
    const response = await original(path, options);
    if (!lost && path === '/api/local/command' && JSON.parse(options.body).type === 'Buy') { lost = true; throw new TypeError('Injected lost response'); }
    return response;
  }; })()`);
  await desktop.click(control('Buy')); await desktop.wait("!document.querySelector('#local-retry').hidden && !document.querySelector('#retry-command').disabled");
  assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1100);
  await desktop.click('#retry-command'); await desktop.wait(enabled('EndTurn'));
  assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1100);
  assert.equal(store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'PropertyBought').length, 1);
  await desktop.click(control('EndTurn')); await handoff(desktop); await desktop.click(control('Roll')); await desktop.wait(enabled('Decline'));
  await desktop.click(control('Decline')); await desktop.wait(enabled('Bid'));
  await choose(desktop, ids[2]); await desktop.click(control('Bid'));
  await desktop.wait("document.querySelector('#local-context').textContent.includes('Đấu giá') && document.querySelector('#local-history').textContent.includes('10 xu')");
  for (const id of [ids[0], ids[1], ids[3]]) { await choose(desktop, id); await desktop.click(control('Pass')); await desktop.wait("!document.querySelector('#local-controls').disabled || !document.querySelector('#local-handoff').hidden"); }
  await handoff(desktop); await desktop.wait(enabled('EndTurn'));
  const auction = await snapshot(desktop); assert.equal(auction.turn.activeSeatId, ids[1]); assert.equal(auction.turn.ownership['VN-S05'], ids[2]); assert.equal(auction.turn.seats[2].cash, 1190);
  await desktop.click(control('EndTurn')); await handoff(desktop); await desktop.click(control('Roll')); await desktop.wait(enabled('EndTurn'));
  assert.equal((await snapshot(desktop)).turn.seats[2].cash, 1184);
  await shot(desktop, 'family-monopoly-local-desktop.png');

  // Saved decision fixtures use the same four sessions and production HTTP/UI path.
  await seed((turn) => { turn.seats[0].jailed = true; turn.seats[0].position = 10; turn.retainedCards[ids[0]] = ['VN-C09']; turn.decks.chance = turn.decks.chance.filter((id) => id !== 'VN-C09'); });
  await desktop.wait(enabled('UseReleaseCard')); await desktop.click(control('UseReleaseCard')); await desktop.wait(enabled('Roll'));
  assert.equal((await snapshot(desktop)).turn.seats[0].jailed, false);
  await seed((turn) => { turn.seats[0].jailed = true; turn.seats[0].position = 10; });
  await desktop.wait(enabled('PayJail')); await desktop.click(control('PayJail')); await desktop.wait(enabled('Roll')); assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1150);

  await seed((turn) => { turn.phase = 'AwaitDebt'; turn.seats[0].cash = 0; turn.ownership = { 'VN-S01': ids[0], 'VN-S39': ids[1] }; turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 40, ledgerType: 'RentPaid', sourceId: 'VN-S39' }; turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }]; });
  await desktop.click('#asset-details summary'); await desktop.click(control('Mortgage')); await desktop.wait(enabled('SettleDebt')); await desktop.click(control('SettleDebt')); await desktop.wait(enabled('EndTurn'));
  assert.equal((await snapshot(desktop)).turn.seats[0].cash, 0);

  await seed((turn) => { turn.phase = 'AwaitAcquisition'; turn.ownership['VN-S14'] = ids[0]; turn.mortgages['VN-S14'] = true; turn.acquisition = { kind: 'acquisition', seatId: ids[0], spaceId: 'VN-S14' }; turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }]; });
  await desktop.wait(enabled('ChooseMortgage')); await desktop.click(control('ChooseMortgage')); await desktop.wait(enabled('EndTurn')); assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1191);

  await seed((turn) => { turn.ownership = { 'VN-S01': ids[0] }; });
  await desktop.click('#trade-details summary');
  await desktop.run(`(() => { document.querySelector('#trade-properties-${ids[0]}').options[0].selected = true; document.querySelector('#trade-cash-${ids[1]}').value = 20; })()`);
  await desktop.click(control('OfferTrade')); await desktop.wait(enabled('TradeHandoff')); await desktop.click(control('TradeHandoff')); await handoff(desktop);
  await desktop.wait(enabled('AcceptTrade')); await desktop.click(control('AcceptTrade'));
  await desktop.wait("document.querySelector('#local-history').textContent.includes('hoàn tất giao dịch')"); assert.equal((await snapshot(desktop)).turn.ownership['VN-S01'], ids[1]);

  await seed((turn) => { turn.ownership = { 'VN-S01': ids[0], 'VN-S03': ids[0] }; }); await choose(desktop, ids[0]);
  await desktop.click('#asset-details summary'); await desktop.click(control('Build'));
  await desktop.wait("document.querySelector('#local-bank').textContent.includes('31 nhà')"); assert.equal((await snapshot(desktop)).turn.buildings['VN-S01'], 1);
  await desktop.click('#asset-details summary'); await desktop.click(control('SellBuilding')); await desktop.wait("document.querySelector('#local-bank').textContent.includes('32 nhà')");

  await seed((turn) => { turn.stock.houses = 1; turn.ownership = { 'VN-S01': ids[0], 'VN-S03': ids[0], 'VN-S06': ids[1], 'VN-S08': ids[1], 'VN-S09': ids[1] }; });
  await desktop.click('#asset-details summary'); await desktop.click(control('Build')); await handoff(desktop);
  await desktop.wait(enabled('BuildingDemand')); await desktop.click(control('BuildingDemand')); await desktop.wait(enabled('Bid')); await desktop.click(control('Bid'));
  await choose(desktop, ids[0]); await desktop.click(control('Pass')); await desktop.wait("document.querySelector('#local-bank').textContent.includes('0 nhà')"); assert.equal((await snapshot(desktop)).turn.buildings['VN-S06'], 1);

  await seed((turn) => { turn.stock = { houses: 0, hotels: 9 }; turn.ownership = { 'VN-S11': ids[0], 'VN-S13': ids[0], 'VN-S14': ids[0] }; turn.buildings = { 'VN-S11': 5, 'VN-S13': 5, 'VN-S14': 5 }; });
  await desktop.run("document.querySelector('[data-command=LiquidateHotels]').closest('details').open = true"); await desktop.click(control('LiquidateHotels'));
  await desktop.wait("document.querySelector('#local-bank').textContent.includes('12 khách sạn')"); assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1320);

  await seed((turn) => { turn.phase = 'AwaitDebt'; turn.seats[0].cash = 0; turn.seats[2].eliminated = true; turn.seats[3].eliminated = true; turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 10 }; });
  await desktop.wait(enabled('Bankrupt')); await desktop.click(control('Bankrupt')); await desktop.wait("!document.querySelector('#local-winner').hidden");
  assert.match(await desktop.run("document.querySelector('#local-winner').textContent"), /Bình thắng/);

  const phone = await tab(360, true); await setup(phone, new URL('/local', server.url).href, true);
  assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
  await handoff(phone, true); await phone.tap(control('Roll')); await phone.wait(enabled('Buy'));
  await phone.tap('#local-space-details summary'); assert.equal(await phone.run("document.querySelectorAll('#local-spaces li').length"), 40);
  await phone.tap(control('Buy')); await phone.wait(enabled('EndTurn'));
  await phone.run("window.originalFetch = window.fetch; window.fetch = (path, options) => path.startsWith('/api/local/sync') ? Promise.reject(new TypeError('Injected disconnect')) : window.originalFetch(path, options)");
  await phone.wait("!document.querySelector('#local-connection').hidden && document.querySelector('#local-controls').disabled");
  await phone.run('window.fetch = window.originalFetch'); await phone.wait(enabled('EndTurn'));
  assert.equal(await phone.run("document.querySelector('#local-error').hidden"), true);
  assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
  assert.ok(await phone.run("document.querySelector('[data-command=EndTurn]').getBoundingClientRect().height >= 44"));
  await phone.run("document.querySelector('#local-space-details').open = false; window.scrollTo(0, 0)");
  await shot(phone, 'family-monopoly-local-phone.png');
  assert.equal(dice.length, 0);
  console.log(JSON.stringify({ result: 'PASS', contracts: 'AC-33–38', peoplePerPage: 4, browser: 'Chrome 1440px keyboard and 360px touch, reduced motion', flows: ['setup', 'handoff', 'purchase refresh', 'lost-response retry', 'explicit auction actors', 'rent', 'jail fee and release card', 'debt liquidation and settlement', 'mortgage acquisition', 'trade confirmation', 'building and sale', 'building demand auction', 'hotel shortage liquidation', 'winner', 'offline recovery'], screenshots: ['/tmp/family-monopoly-local-desktop.png', '/tmp/family-monopoly-local-phone.png'] }, null, 2));
} finally {
  clearTimeout(deadline); socket?.close(); server?.stop(true);
  if (chrome) { chrome.kill(); await chrome.exited; }
  rmSync(directory, { recursive: true, force: true });
}
