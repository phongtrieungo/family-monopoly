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
const st203Only = process.argv.includes('--st-203');
const st204Only = process.argv.includes('--st-204');
const dice = [[6, 6], [5, 5], [4, 4], [3, 3], [1, 2], [2, 3], [1, 2], [6, 6]];
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
async function tab(width, mobile, reducedMotion = true) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  await call('Emulation.setDeviceMetricsOverride', { width, height: 800, deviceScaleFactor: 1, mobile });
  if (reducedMotion) await call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
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
async function assertCommittedRoll(page) {
  const expected = await page.run(`(() => {
    const game = JSON.parse(sessionStorage.getItem('local-game'));
    const rolled = [...game.history].reverse().flatMap(({ events }) => [...events].reverse()).find(({ type }) => type === 'Rolled');
    const seat = game.snapshot.turn.seats.find(({ id }) => id === rolled.seatId);
    const board = game.board;
    return { dice: rolled.dice.join(' + '), position: seat.position, name: board.copy[board.spaces[seat.position].labelKey], forcedJail: game.history.at(-1).events.some(({ type, seatId }) => type === 'Jailed' && seatId === rolled.seatId) };
  })()`);
  const displayed = await page.run("document.querySelector('#local-roll-result').textContent");
  const saved = await page.run("(() => { const game = JSON.parse(sessionStorage.getItem('local-game')); return JSON.stringify({ lastRoll: game.lastRoll, activeSeatId: game.snapshot.turn.activeSeatId, revision: game.snapshot.revision, text: document.querySelector('#local-roll-result').textContent }); })()");
  assert.ok(displayed.includes(expected.dice), `displayed roll must match committed dice ${expected.dice}; saved=${saved}`);
  assert.ok(displayed.includes(expected.forcedJail ? 'Nhà chờ' : expected.name), `displayed landing must match snapshot: ${displayed}`);
  assert.equal(await page.run("Boolean(document.querySelector('#local-board').dataset.revision && document.querySelector('#local-match').dataset.revision && document.querySelector('#local-board').dataset.revision === document.querySelector('#local-match').dataset.revision)"), true);
  if (await page.run("matchMedia('(prefers-reduced-motion: reduce)').matches")) assert.equal(await page.run("document.querySelector('#local-board').dataset.animating"), 'false');
}
async function handoff(page, touch = false) {
  await page.wait("document.querySelector('#confirm-handoff') && !document.querySelector('#confirm-handoff').disabled");
  if (await page.run("!document.querySelector('#local-handoff').hidden")) {
    if (touch) await page.tap('#confirm-handoff');
    else { await page.run("document.querySelector('#confirm-handoff').focus()"); await page.key('Enter', 'Enter', 13); }
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
let phone;
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
  await startChrome(); desktop = await tab(1440, false, !st203Only);
  await setup(desktop, new URL('/local', server.url).href);
  const desktopDice = [...dice];
  phone = await tab(360, true); await setup(phone, new URL('/local', server.url).href, true);
  await phone.wait("Boolean(document.querySelector('#local-board').dataset.revision && document.querySelector('#local-match').dataset.revision && document.querySelector('#local-board').dataset.revision === document.querySelector('#local-match').dataset.revision)");
  const phoneBoard = await phone.run(`(() => { const board = document.querySelector('#local-board'); const canvas = board.querySelector('canvas'); return { display: getComputedStyle(board).display, boardWidth: board.getBoundingClientRect().width, canvasWidth: canvas.getBoundingClientRect().width }; })()`);
  assert.equal(phoneBoard.display, 'block'); assert.ok(phoneBoard.canvasWidth >= phoneBoard.boardWidth - 2, JSON.stringify(phoneBoard));
  assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
  dice.splice(0, dice.length, ...desktopDice);
  if (st203Only) {
    dice.unshift([1, 2]);
    await handoff(phone, true); await phone.tap(control('Roll')); await phone.wait(enabled('Buy')); await assertCommittedRoll(phone);
    dice.splice(0, dice.length, ...desktopDice);
    dice.unshift([6, 5]);
  }
  const started = await snapshot(desktop); roomId = started.roomId;
  await desktop.wait("Boolean(document.querySelector('#local-board').dataset.revision && document.querySelector('#local-match').dataset.revision && document.querySelector('#local-board').dataset.revision === document.querySelector('#local-match').dataset.revision)");
  baseTurn = structuredClone(store.read().find((entry) => entry.id === roomId).turn);
  const ids = started.turn.seats.map(({ id }) => id);
  assert.equal(started.turn.seats.length, 4); assert.equal(started.profile.rules.id, 'vn-original-v1');
  assert.equal(await desktop.run("document.querySelector('#local-board canvas') !== null"), true);
  assert.equal(await desktop.run("document.querySelectorAll('#local-spaces li').length"), 40);
  assert.equal(await desktop.run("document.querySelector('[data-command=Roll]').disabled || document.querySelector('#local-controls').disabled"), true);
  if (st204Only) {
    await handoff(desktop);
    await seed((turn) => { turn.seats[0].position = 4; turn.decks.chance = ['VN-C10', ...turn.decks.chance.filter((id) => id !== 'VN-C10')]; });
    dice.unshift([1, 2]);
    await desktop.click(control('Roll')); await desktop.wait(enabled('EndTurn'));
    const outcome = () => desktop.run("document.querySelector('#local-outcome').textContent");
    assert.match(await outcome(), /Hoàn tất một đơn hàng/);
    assert.match(await outcome(), /An.*70 xu.*Ngân hàng/);
    assert.match(await outcome(), /An: 1[.,]270 xu/);
    const cardState = await snapshot(desktop);
    const destination = await desktop.run(`(() => { const b = JSON.parse(sessionStorage.getItem('local-game')).board; return b.copy[b.spaces[${cardState.turn.seats[0].position}].labelKey]; })()`);
    assert.ok((await outcome()).includes(`Hiện tại: ${destination}.`));
    const savedOutcome = await outcome();
    const revision = (await snapshot(desktop)).revision;
    await desktop.call('Page.reload'); await desktop.wait("document.querySelector('#local-match')?.dataset.revision === '" + revision + "'");
    await handoff(desktop); assert.equal(await outcome(), savedOutcome);
    await seed((turn) => { turn.seats[0].position = 4; turn.decks.chance = ['VN-C01', ...turn.decks.chance.filter((id) => id !== 'VN-C01')]; });
    dice.unshift([1, 2]);
    await desktop.click(control('Roll')); await desktop.wait(enabled('EndTurn'));
    const moved = await snapshot(desktop);
    const movedName = await desktop.run(`(() => { const b = JSON.parse(sessionStorage.getItem('local-game')).board; return b.copy[b.spaces[${moved.turn.seats[0].position}].labelKey]; })()`);
    assert.ok((await outcome()).includes(`Hiện tại: ${movedName}.`));
    assert.match(await outcome(), /160 xu khi qua quảng trường/);
    await seed((turn) => {
      turn.seats[0].position = 33; turn.seats[0].cash = 0;
      turn.decks.chance = ['VN-C07', ...turn.decks.chance.filter((id) => id !== 'VN-C07')];
      turn.decks.community = ['VN-M11', ...turn.decks.community.filter((id) => id !== 'VN-M11')];
    });
    dice.unshift([1, 2]);
    await desktop.click(control('Roll')); await desktop.wait("document.querySelector('[data-command=SettleDebt]') !== null");
    const chained = await snapshot(desktop);
    assert.equal(chained.turn.pendingDebt.sourceId, 'VN-M11');
    const cards = await desktop.run("[...document.querySelectorAll('#local-outcome-items li')].map((item) => item.textContent)");
    assert.equal(cards.length, 2);
    assert.ok(cards[0].includes('Quay lại tìm chiếc ô.'));
    assert.ok(cards[1].includes('Mua cây cho sân chung.'));
    assert.ok(!cards[0].includes('Hiện tại:') && !cards[0].includes('Đang chờ'));
    assert.ok(cards[1].includes('Hiện tại:') && cards[1].includes('Đang chờ An trả 20 xu'));
    await seed((turn) => { turn.phase = 'AwaitDebt'; turn.seats[0].cash = 80; turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 40, sourceId: 'VN-S39', ledgerType: 'RentPaid' }; turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }]; });
    await desktop.run(`(() => { const original = window.fetch; let lost = false; window.fetch = async (path, options) => { const response = await original(path, options); if (!lost && path === '/api/local/command' && JSON.parse(options.body).type === 'SettleDebt') { lost = true; throw new TypeError('lost response'); } return response; }; })()`);
    await desktop.click(control('SettleDebt')); await desktop.wait("!document.querySelector('#retry-command').disabled && !document.querySelector('#local-retry').hidden");
    assert.match(await outcome(), /An.*40 xu.*Bình/);
    const paid = await snapshot(desktop);
    for (const seat of paid.turn.seats.slice(0, 2)) assert.ok((await outcome()).includes(new Intl.NumberFormat('vi-VN').format(seat.cash) + ' xu'));
    assert.ok((await outcome()).includes(await desktop.run("(() => { const b = JSON.parse(sessionStorage.getItem('local-game')).board; return b.copy[b.spaces[39].labelKey]; })()")));
    const paymentOutcome = await outcome();
    await desktop.click('#retry-command'); await desktop.wait(enabled('EndTurn'));
    assert.equal(await outcome(), paymentOutcome); assert.equal((await snapshot(desktop)).turn.seats[0].cash, 40);
    await desktop.run(`(() => { const original = window.fetch; let gap = false; window.fetch = async (path, options) => {
      if (path.startsWith('/api/local/sync?since=') && !gap) { gap = true; return new Response(JSON.stringify({ error: 'ResyncRequired' }), { status: 409 }); }
      const response = await original(path, options);
      if (gap && path === '/api/local/sync?since=0') { const result = await response.json(); result.history = result.history.flatMap((row) => [row, row]); window.gapRecovered = true; return new Response(JSON.stringify(result)); }
      return response;
    }; })()`);
    await desktop.wait("window.gapRecovered && document.querySelector('#local-announcement').textContent === ''");
    assert.equal(await outcome(), paymentOutcome);
    const recovered = await snapshot(desktop);
    assert.deepEqual(recovered.turn, paid.turn);
    for (const seat of recovered.turn.seats.slice(0, 2)) assert.ok((await outcome()).includes(new Intl.NumberFormat('vi-VN').format(seat.cash) + ' xu'));
    assert.equal(await desktop.run("[...document.querySelectorAll('#local-history li')].filter((item) => item.textContent.includes('An trả 40 xu tiền thuê cho Bình')).length"), 1);
    assert.equal(await desktop.run("[...document.querySelectorAll('#local-outcome-items li')].filter((item) => item.textContent.includes('An trả 40 xu tiền thuê cho Bình')).length"), 1);
    assert.equal(await desktop.run("(() => { const h = JSON.parse(sessionStorage.getItem('local-game')).history; return h.length === new Set(h.map(({ revision }) => revision)).size; })()"), true);

    await seed((turn) => { turn.phase = 'AwaitPurchase'; turn.purchase = { spaceId: 'VN-S01' }; turn.seats[0].position = 1; turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }]; });
    await desktop.click(control('Decline')); await desktop.wait(enabled('Bid'));
    assert.match(await outcome(), /10 xu/);
    await choose(desktop, ids[2]); await desktop.click(control('Bid'));
    await desktop.wait("document.querySelector('#local-outcome').textContent.includes('Chi dẫn đầu')");
    assert.equal(await desktop.run("document.querySelector('#local-bid').min"), '11');
    assert.equal(await desktop.run("document.querySelector('[data-command=Pass]').disabled"), true);
    for (const id of [ids[0], ids[1], ids[3]]) { await choose(desktop, id); await desktop.click(control('Pass')); await desktop.wait("!document.querySelector('#local-controls').disabled || !document.querySelector('#local-handoff').hidden"); }
    await desktop.wait("document.querySelector('#local-outcome').textContent.includes('thắng đấu giá')");
    assert.ok((await outcome()).includes(await desktop.run("(() => { const b = JSON.parse(sessionStorage.getItem('local-game')).board; return b.copy[b.spaces[1].labelKey]; })()")));
    assert.equal((await snapshot(desktop)).turn.ownership['VN-S01'], ids[2]);
    assert.equal((await outcome()).match(/thắng đấu giá/g).length, 1);
    await seed((turn) => {
      turn.phase = 'Auction'; turn.stock.houses = 1;
      turn.ownership = { 'VN-S01': ids[0], 'VN-S03': ids[0], 'VN-S06': ids[1], 'VN-S08': ids[1], 'VN-S09': ids[1] };
      turn.auction = { kind: 'building', targets: { [ids[0]]: 'VN-S01', [ids[1]]: 'VN-S06' }, eligibleSeatIds: [ids[0], ids[1]], highBid: null, resumePhase: 'AwaitEnd' };
    });
    await choose(desktop, ids[1]); await desktop.click(control('Bid'));
    await desktop.wait("document.querySelector('#local-outcome').textContent.includes('Bình dẫn đầu')");
    await choose(desktop, ids[0]); await desktop.click(control('Pass'));
    await desktop.wait("document.querySelector('#local-outcome').textContent.includes('thắng đấu giá')");
    const buildingState = await snapshot(desktop);
    assert.equal(buildingState.turn.buildings['VN-S06'], 1);
    assert.ok((await outcome()).includes(await desktop.run("(() => { const b = JSON.parse(sessionStorage.getItem('local-game')).board; return b.copy[b.spaces[6].labelKey]; })()")));
    await seed((turn) => { turn.phase = 'AwaitPurchase'; turn.purchase = { spaceId: 'VN-S01' }; turn.seats[0].position = 1; turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }]; });
    await desktop.click(control('Decline')); await desktop.wait(enabled('Bid'));
    for (const id of ids) { await choose(desktop, id); await desktop.click(control('Pass')); await desktop.wait("!document.querySelector('#local-controls').disabled || !document.querySelector('#local-handoff').hidden"); }
    await desktop.wait("document.querySelector('#local-outcome').textContent.includes('vẫn ở ngân hàng')");
    const allPass = await snapshot(desktop);
    assert.equal(allPass.turn.ownership['VN-S01'], undefined);
    assert.equal(allPass.turn.auction, undefined);
    await handoff(phone, true);
    // Reuse the same authoritative match at phone width for equivalent outcome text.
    const bundle = await desktop.run("sessionStorage.getItem('local-game')");
    await phone.run(`sessionStorage.setItem('local-game', ${JSON.stringify(bundle)})`);
    await phone.call('Page.reload'); await phone.wait("document.querySelector('#local-outcome')?.textContent.includes('vẫn ở ngân hàng')");
    await handoff(phone, true); assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
    assert.equal(await phone.run(`(() => { const outcome = document.querySelector('#local-outcome'); outcome.scrollIntoView({ block: 'center' }); const rect = outcome.getBoundingClientRect(); const style = getComputedStyle(outcome); return !outcome.hidden && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.right <= 360 && rect.bottom > 0 && rect.top < innerHeight; })()`), true);
    assert.deepEqual((await snapshot(phone)).turn, allPass.turn);

    const disconnectedOutcome = await phone.run(`(() => {
      const outcome = document.querySelector('#local-outcome');
      const rect = outcome.getBoundingClientRect(); const style = getComputedStyle(outcome);
      return { text: outcome.textContent, visible: !outcome.hidden && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.right <= 360 && rect.bottom > 0 && rect.top < innerHeight, width: rect.width, height: rect.height };
    })()`);
    await phone.run("window.originalFetch = window.fetch; window.fetch = (path, options) => path.startsWith('/api/local/sync') ? Promise.reject(new TypeError('disconnect')) : window.originalFetch(path, options)");
    await phone.wait("!document.querySelector('#local-connection').hidden && document.querySelector('#local-controls').disabled");
    assert.deepEqual(await phone.run(`(() => {
      const outcome = document.querySelector('#local-outcome');
      const rect = outcome.getBoundingClientRect(); const style = getComputedStyle(outcome);
      return { text: outcome.textContent, visible: !outcome.hidden && style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0 && rect.left >= 0 && rect.right <= 360 && rect.bottom > 0 && rect.top < innerHeight, width: rect.width, height: rect.height };
    })()`), disconnectedOutcome);
    await phone.run('window.fetch = window.originalFetch'); await phone.wait(enabled('EndTurn'));
    assert.deepEqual((await snapshot(phone)).turn, allPass.turn);
    assert.equal(await phone.run("document.querySelector('#local-outcome').textContent"), await outcome());

    await shot(desktop, 'family-monopoly-st204-desktop.png'); await shot(phone, 'family-monopoly-st204-phone.png');
    console.log(JSON.stringify({ result: 'PASS', contracts: 'ST-204 / AC-35, AC-36, AC-38', flows: ['accepted card and bank credit', 'payment cause and current balances', 'lost response and receipt retry', 'refresh', 'auction leader and minimum', 'settlement and all-pass', 'keyboard handoff', '360px touch and reduced motion', 'disconnect recovery', 'event-gap resync and duplicate history'] }, null, 2));
  } else {
  await desktop.run("document.querySelector('#confirm-handoff').focus()"); await desktop.key('Enter', 'Enter', 13);
  await desktop.wait(enabled('Roll')); await desktop.click(control('Roll'));
  if (st203Only) {
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'true' && !document.querySelector('#skip-local-motion').hidden");
    await desktop.click('#skip-local-motion');
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'false' && document.querySelector('#skip-local-motion').hidden");
  }
  await desktop.wait(enabled('Buy')); await assertCommittedRoll(desktop);
  const purchase = await snapshot(desktop); assert.equal(purchase.turn.phase, 'AwaitPurchase');

  // Third consecutive double must present the committed forced-jail outcome,
  // even though the dice distance itself points somewhere else.
  dice.unshift([1, 1]);
  await seed((turn) => { turn.seats[0].position = 0; turn.seats[0].doubles = 2; });
  await desktop.click(control('Roll')); await desktop.wait(enabled('EndTurn'));
  await desktop.wait("document.querySelector('#local-roll-result').textContent.includes('máy chủ đưa người chơi đến Nhà chờ')");
  const jailed = await snapshot(desktop);
  assert.equal(jailed.turn.seats[0].position, 10); assert.equal(jailed.turn.seats[0].jailed, true);
  await assertCommittedRoll(desktop);
  if (st203Only) {
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'true' && !document.querySelector('#skip-local-motion').hidden");
    await desktop.click('#skip-local-motion');
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'false' && document.querySelector('#skip-local-motion').hidden");
  }
  const initialTurn = structuredClone(baseTurn);
  baseTurn = initialTurn;
  await seed((turn) => { turn.seats[0].position = 38; turn.seats[0].cash = 1040; turn.seats[0].doubles = 0; });
  dice.unshift([2, 3]);
  await desktop.click(control('Roll')); await desktop.wait(enabled('Buy'));
  await desktop.wait("document.querySelector('#local-roll-result').textContent.includes('qua quảng trường')");
  const wrapped = await snapshot(desktop);
  assert.equal(wrapped.turn.seats[0].position, 3); assert.equal(wrapped.turn.seats[0].cash, 1200);
  await assertCommittedRoll(desktop);
  const wrappedTurn = structuredClone(store.read().find((entry) => entry.id === roomId).turn);
  baseTurn = wrappedTurn; await seed(() => {}); await desktop.wait(enabled('Buy'));

  const origin = await desktop.run('performance.timeOrigin'); await desktop.call('Page.reload');
  await desktop.wait(`performance.timeOrigin !== ${origin}`); await desktop.wait("!document.querySelector('#local-handoff').hidden && !document.querySelector('#confirm-handoff').disabled");
  await desktop.wait("Boolean(document.querySelector('#local-board').dataset.revision && document.querySelector('#local-match').dataset.revision && document.querySelector('#local-board').dataset.revision === document.querySelector('#local-match').dataset.revision)");
  assert.equal((await snapshot(desktop)).roomId, roomId);
  if (st203Only) {
    assert.equal(await desktop.run("!document.querySelector('#local-handoff').hidden && document.querySelector('#local-controls').disabled"), true);
    await assertCommittedRoll(desktop);
    assert.equal(await desktop.run("document.querySelector('#local-board').dataset.animating === 'false'"), true);
    await shot(desktop, 'family-monopoly-st203-desktop.png'); await shot(phone, 'family-monopoly-st203-phone.png');
    console.log(JSON.stringify({ result: 'PASS', contracts: 'ST-203 / B-13', browser: 'Chrome desktop and 360px touch, reduced motion', flows: ['committed movement and skip', 'crossing start and award', 'third-double forced jail and skip', 'reduced-motion snap', 'refresh recovery without animation', 'mobile board width and overflow', '40-space accessible list'], screenshots: ['/tmp/family-monopoly-st203-desktop.png', '/tmp/family-monopoly-st203-phone.png'] }, null, 2));
  } else {
  await handoff(desktop);
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

  // Saved decisions start from AwaitRoll, rather than the earlier purchase fixture.
  baseTurn = initialTurn;
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

  assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
  dice[0] = [1, 2]; // Keep this phone purchase fixture on a non-double turn.
  await handoff(phone, true); await phone.tap(control('Roll')); await phone.wait(enabled('Buy')); await assertCommittedRoll(phone);
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
  }
  }
} finally {
  clearTimeout(deadline); socket?.close(); server?.stop(true);
  if (chrome) { chrome.kill(); await chrome.exited; }
  rmSync(directory, { recursive: true, force: true });
}
