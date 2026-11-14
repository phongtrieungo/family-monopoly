import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { vnNeighborhoodBoard, vnOriginalRules } from '../src/domain/vn-original-content.js';
import { board, rules } from '../src/domain/synthetic-board.js';
import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { createRequestHandler } from '../src/web/server.js';

const directory = mkdtempSync(join(tmpdir(), 'family-monopoly-acceptance-'));
const st203Only = process.argv.includes('--st-203');
const st204Only = process.argv.includes('--st-204');
const st206Only = process.argv.includes('--st-206');
const st205Only = process.argv.includes('--st-205');
const dice = [[6, 6], [5, 5], [4, 4], [3, 3], [1, 2], [2, 3], [1, 2], [6, 6]];
const store = createRoomFileStore(join(directory, 'rooms.json'));
const rooms = createRoomService({ board, rules, startingCash: 100, store });
const localRooms = createRoomService({ board: vnNeighborhoodBoard, rules: vnOriginalRules, startingCash: 1200, store,
  rollDice: () => { assert.ok(dice.length, 'unexpected authoritative roll'); return dice.shift(); }, shuffleDeck: (ids) => ids });
const st502Evidence = !st203Only && !st204Only && !st205Only && !st206Only;
let server;
let chrome;
let socket;
const deadline = setTimeout(() => {
  console.error('Browser acceptance timed out.');
  chrome?.kill();
  socket?.close();
  server?.stop(true);
  process.exitCode = 1;
}, st206Only ? 240_000 : 120_000);
deadline.unref();

const pending = new Map();
const dialogResponses = new Map();
let next = 0;
function send(method, params = {}, sessionId) {
  const id = ++next;
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => { pending.delete(id); reject(Error('DevTools timed out: ' + method)); }, 15000);
    pending.set(id, { resolve: (result) => { clearTimeout(timeout); resolve(result); }, reject: (error) => { clearTimeout(timeout); reject(error); } });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
}
async function tab(width, mobile, reducedMotion = true, height = 800) {
  const { browserContextId } = await send('Target.createBrowserContext');
  const { targetId } = await send('Target.createTarget', { url: 'about:blank', browserContextId });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
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
    await call('Page.bringToFront');
    await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', behavior: 'instant' })`);
    await Bun.sleep(100);
    const point = await run(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); const rect = node.getBoundingClientRect(); const x = rect.x + rect.width / 2; const y = rect.y + rect.height / 2; if (!node.contains(document.elementFromPoint(x, y))) throw Error('Touch target is covered or outside viewport'); return { x, y }; })()`);
    try {
      await call('Input.synthesizeTapGesture', { x: point.x, y: point.y, gestureSourceType: 'touch', duration: 50 });
    } catch (error) { throw Error(`Touch ${selector} at ${JSON.stringify(point)}: ${error.message}`); }
  };
  return { call, run, wait, click, key, tap, dialog: (accept) => dialogResponses.set(sessionId, accept) };
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
      const { id, result, error, method, sessionId } = JSON.parse(data);
      if (method === 'Page.javascriptDialogOpening') {
        send('Page.handleJavaScriptDialog', { accept: dialogResponses.get(sessionId) ?? false }, sessionId).catch(() => {});
      }
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
async function setup(page, url, touch = false, count = 4) {
  const previousOrigin = await page.run('performance.timeOrigin');
  await page.call('Page.navigate', { url });
  await page.wait(`performance.timeOrigin !== ${previousOrigin} && document.querySelector('#local-setup-form') && document.readyState === 'complete'`);
  await page.run(`['An', 'Bình', 'Chi', 'Dũng'].slice(0, ${count}).forEach((name, i) => document.querySelector('[name=player' + (i + 1) + ']').value = name)`);
  if (touch) await page.tap('#start-local');
  else { await page.run("document.querySelector('#start-local').focus()"); await page.key('Enter', 'Enter', 13); }
  await page.wait("!document.querySelector('#local-match').hidden && !document.querySelector('#confirm-handoff').disabled");
}
let desktop;
let phone;
let baseTurn;
let roomId;
async function seed(change, touch = false) {
  const records = store.read(); const room = records.find((entry) => entry.id === roomId);
  room.turn = structuredClone(baseTurn); room.status = 'InMatch'; change(room.turn);
  room.revision += 1; room.history.push({ revision: room.revision, events: [] }); store.write(records);
  await desktop.wait(`document.querySelector('#local-match').dataset.revision === '${room.revision}'`);
  if (await desktop.run("!document.querySelector('#local-handoff').hidden")) await handoff(desktop, touch);
}
async function shot(page, name) {
  const { data } = await page.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join('/tmp', name), Buffer.from(data, 'base64'));
}
async function assertInspection(page, touch = false) {
  if (touch) await page.tap('#open-local-spaces');
  else {
    await page.run("document.querySelector('#open-local-spaces').focus()");
    await page.key('Enter', 'Enter', 13);
  }
  assert.equal(await page.run("document.activeElement.id"), 'local-space-heading');
  assert.equal(await page.run("new Set([...document.querySelectorAll('#local-spaces button')].map(button => button.dataset.spaceId)).size"), 40);
  const firstProperty = '[data-space-id="VN-S01"]';
  if (touch) await page.tap(firstProperty);
  else {
    await page.key('Tab', 'Tab', 9);
    assert.equal(await page.run("document.querySelector('#local-space-details').contains(document.activeElement) && getComputedStyle(document.activeElement).outlineStyle !== 'none'"), true);
    await page.run(`document.querySelector('${firstProperty}').focus()`);
    await page.key('Enter', 'Enter', 13);
  }
  assert.equal(await page.run("document.activeElement.id"), 'local-space-heading');
  assert.match(await page.run("document.querySelector('#local-space-copy').textContent"), /VN-S01.*80 xu.*4 xu/);
  if (touch) await page.tap('#back-local-spaces');
  else await page.click('#back-local-spaces');
  assert.equal(await page.run("document.activeElement.dataset.spaceId"), 'VN-S01');
  if (touch) await page.tap('#local-space-details button:not([type])');
  else await page.key('Escape', 'Escape', 27);
  await page.wait("!document.querySelector('#local-space-details').open && document.activeElement.id === 'open-local-spaces'");
}

async function assertTableLayouts(page, command, label) {
  const layouts = [[1440, 900], [1280, 720], [1024, 768], [768, 1024], [360, 800]];
  for (const [width, height] of layouts) {
    await page.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 800 });
    await page.run("document.querySelector('#local-sheet-content').scrollTop = 0; window.scrollTo(0, 0)");
    await page.wait(`innerWidth === ${width} && innerHeight === ${height}`);
    await page.run('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))');
    const layout = await page.run(`(() => {
      const sheet = document.querySelector('#local-sheet');
      const content = document.querySelector('#local-sheet-content');
      const board = document.querySelector('#local-board');
      const seat = document.querySelector('#local-players');
      const action = document.querySelector('${control(command)}');
      const sb = sheet.getBoundingClientRect(), bb = board.getBoundingClientRect();
      const ab = action.getBoundingClientRect(), hb = seat.getBoundingClientRect();
      return { width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight, sheetBottom: sb.bottom, boardBottom: bb.bottom,
        boardBeforeSheet: bb.bottom < sb.top && hb.bottom <= bb.top, landscape: bb.right < sb.left,
        boardVisible: bb.top >= 0 && bb.bottom <= innerHeight,
        actionVisible: ab.top >= sb.top && ab.bottom <= Math.min(sb.bottom, innerHeight),
        scrollable: getComputedStyle(content).overflowY === 'auto', overflow: content.scrollHeight > content.clientHeight };
    })()`);
    assert.equal(layout.width, width, JSON.stringify({ label, width, layout }));
    assert.equal(layout.boardVisible, true, JSON.stringify({ label, width, layout }));
    assert.equal(layout.scrollable, true);
    if (width >= 1024) {
      assert.equal(layout.height, height, JSON.stringify({ label, width, layout }));
      assert.ok(layout.landscape && layout.actionVisible, JSON.stringify({ label, width, layout }));
    } else {
      assert.ok(layout.boardBeforeSheet, JSON.stringify({ label, width, layout }));
      if (command === 'Buy') {
        assert.equal(layout.overflow, true, JSON.stringify({ label, width, layout }));
        assert.equal(layout.actionVisible, true, JSON.stringify({ label, width, layout }));
        assert.equal(await page.run(`document.querySelector('${control('Decline')}').getBoundingClientRect().bottom <= innerHeight`), true);
      } else if (width === 360) assert.equal(layout.actionVisible, true, JSON.stringify({ label, width, layout }));
    }
    await shot(page, `family-monopoly-st502-${label}-${width}.png`);
  }

  // Half the CSS viewport and double the pixel density to exercise 200% browser reflow.
  await page.call('Emulation.setDeviceMetricsOverride', { width: 720, height: 450, deviceScaleFactor: 2, mobile: false });
  assert.equal(await page.run("document.documentElement.scrollWidth"), 720);
  await page.run(`document.querySelector('${control(command)}').focus()`);
  assert.equal(await page.run(`(() => { const rect = document.activeElement.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight; })()`), true);
  await assertInspection(page);
  await page.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await page.run("document.querySelector('#local-sheet-content').scrollTop = 0; window.scrollTo(0, 0)");
}
async function captureApprovedMock() {
  const mock = await tab(1440, false, true, 900);
  const file = pathToFileURL(join(process.cwd(), 'design/game-ui/index.html'));
  for (const [width, height] of [[1440, 900], [360, 800]]) {
    await mock.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 800 });
    for (const fixture of ['table', 'purchase']) {
      file.searchParams.set('scene', fixture);
      await mock.call('Page.navigate', { url: file.href });
      await mock.wait(`new URLSearchParams(location.search).get('scene') === '${fixture}' && document.querySelector('#fixture-select')?.value === '${fixture}' && Boolean(document.querySelector('#space-VN-S01'))`);
      await mock.run("document.querySelector('#game').scrollIntoView({ block: 'start' })");
      await shot(mock, `family-monopoly-st502-mock-${fixture}-${width}.png`);
    }
  }
}

async function assertCanvasFallback(url) {
  const canvas = await tab(360, true);
  await canvas.call('Page.addScriptToEvaluateOnNewDocument', { source: `
    const originalContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...params) {
      return type.includes('webgl') ? null : originalContext.call(this, type, ...params);
    };
  ` });
  dice.unshift([6, 6], [5, 5], [4, 4]);
  await setup(canvas, url, true, 3);
  await canvas.wait("document.querySelector('#local-board').dataset.renderer === 'canvas'");
  assert.equal(await canvas.run("document.querySelectorAll('#local-players > li').length"), 3);
  await assertInspection(canvas, true);
}
try {
  server = Bun.serve({ hostname: '127.0.0.1', port: 0, fetch: createRequestHandler(rooms, { localRooms }) });
  await startChrome(); desktop = await tab(1440, false, !st203Only, 900);
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
  if (st206Only) {
    const evidence = [];
    const browser = await send('Browser.getVersion');
    // Independent saved checkpoints, never a claim of an uninterrupted match.
    for (const count of [2, 4]) {
      for (const touch of [false, true]) {
        dice.splice(0, dice.length, [6, 6], [5, 5], [4, 4], [3, 3]);
        desktop = await tab(touch ? 360 : 1440, touch, touch);
        await setup(desktop, new URL('/local', server.url).href, touch, count);
        const initial = await snapshot(desktop); roomId = initial.roomId;
        baseTurn = structuredClone(store.read().find((room) => room.id === roomId).turn);
        const seats = initial.turn.seats.map(({ id }) => id);
        const action = async (selector) => {
          const origin = selector === '#new-local' ? await desktop.run('performance.timeOrigin') : null;
          if (touch) await desktop.tap(selector);
          else { await desktop.run(`document.querySelector(${JSON.stringify(selector)}).focus()`); await desktop.key('Enter', 'Enter', 13); }
          if (selector === '#new-local' && await desktop.run('performance.timeOrigin') !== origin) {
            await desktop.wait("document.readyState === 'complete' && document.querySelector('#local-setup') && !document.querySelector('#local-setup').hidden");
          } else await desktop.wait("document.querySelector('#new-local') && !document.querySelector('#new-local').disabled");
        };
        await handoff(desktop, touch);
        const checkpoint = async (change) => { await seed(change, touch); await desktop.wait("!document.querySelector('#local-controls').disabled"); };
        const command = (body, actor = 0) => desktop.run(`(async () => {
          const game = JSON.parse(sessionStorage.getItem('local-game'));
          const response = await fetch('/api/local/command', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + game.sessions[${actor}].session }, body: JSON.stringify(${JSON.stringify(body)}) });
          return { status: response.status, body: await response.json() };
        })()`);
        const before = await snapshot(desktop);
        const unauthorized = await command({ id: crypto.randomUUID(), expectedRevision: before.revision, type: 'Roll', payload: {} }, 1);
        const stale = await command({ id: crypto.randomUUID(), expectedRevision: 0, type: 'Roll', payload: {} });
        assert.equal(unauthorized.status, 400); assert.equal(stale.status, 409);
        assert.deepEqual(await snapshot(desktop), before);
        // Confirm cancellation leaves this browser's session and server records intact.
        const saved = await desktop.run("sessionStorage.getItem('local-game')");
        desktop.dialog(false); await action('#new-local');
        assert.equal(await desktop.run("sessionStorage.getItem('local-game')"), saved);
        dice.unshift([1, 2]); await action(control('Roll')); await desktop.wait(enabled('Buy'));
        await assertCommittedRoll(desktop);
        await desktop.run(`(() => { const original = window.fetch; let lost = false; window.fetch = async (path, options) => { const response = await original(path, options); if (!lost && path === '/api/local/command' && JSON.parse(options.body).type === 'Buy') { lost = true; throw new TypeError('injected response loss'); } return response; }; })()`);
        await action(control('Buy')); await desktop.wait("!document.querySelector('#local-retry').hidden && !document.querySelector('#retry-command').disabled");
        const bought = await snapshot(desktop); await action('#retry-command'); await handoff(desktop, touch); await desktop.wait(enabled('EndTurn'));
        assert.deepEqual((await snapshot(desktop)).turn, bought.turn);
        assert.equal((await snapshot(desktop)).revision, bought.revision);
        const purchaseEvents = store.read().find((room) => room.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'PropertyBought');
        assert.equal(purchaseEvents.length, 1);
        await checkpoint((turn) => { turn.phase = 'AwaitPurchase'; turn.purchase = { spaceId: 'VN-S01' }; turn.queue = [{ kind: 'finishRoll', seatId: seats[0] }]; });
        await action(control('Decline')); await desktop.wait(enabled('Bid')); await action(control('Bid'));
        for (const id of seats.slice(1)) {
          await desktop.run(`(() => { const select = document.querySelector('#local-actor'); select.value = ${JSON.stringify(id)}; select.dispatchEvent(new Event('change')); })()`);
          await handoff(desktop, touch); await action(control('Pass'));
          await desktop.wait("!document.querySelector('#local-controls').disabled || !document.querySelector('#local-handoff').hidden");
        }
        await desktop.wait("document.querySelector('#local-history').textContent.includes('thắng đấu giá')");
        assert.equal((await snapshot(desktop)).turn.ownership['VN-S01'], seats[0]);
        await checkpoint((turn) => { turn.seats[0].position = 4; turn.decks.chance = ['VN-C10', ...turn.decks.chance.filter((id) => id !== 'VN-C10')]; });
        dice.unshift([1, 2]); await action(control('Roll')); await desktop.wait(enabled('EndTurn'));
        assert.match(await desktop.run("document.querySelector('#local-outcome').textContent"), /70 xu/);
        await checkpoint((turn) => { turn.phase = 'AwaitDebt'; turn.seats[0].cash = 80; turn.pendingDebt = { kind: 'payment', from: seats[0], to: seats[1], amount: 40, sourceId: 'VN-S39', ledgerType: 'RentPaid' }; turn.queue = [{ kind: 'finishRoll', seatId: seats[0] }]; });
        await action(control('SettleDebt')); await desktop.wait(enabled('EndTurn'));
        assert.equal((await snapshot(desktop)).turn.seats[0].cash, 40);
        await checkpoint((turn) => { turn.ownership = { 'VN-S01': seats[0] }; });
        await action('#trade-details summary');
        await desktop.run(`document.querySelector('#trade-properties-${seats[0]}').options[0].selected = true`);
        await action(control('OfferTrade')); await desktop.wait(enabled('ConfirmOfferTrade')); await action(control('ConfirmOfferTrade'));
        await desktop.wait(enabled('TradeHandoff')); await action(control('TradeHandoff')); await handoff(desktop, touch);
        await desktop.wait(enabled('AcceptTrade')); await action(control('AcceptTrade'));
        await desktop.wait("document.querySelector('#local-history').textContent.includes('hoàn tất giao dịch')");
        assert.equal((await snapshot(desktop)).turn.ownership['VN-S01'], seats[1]);
        await desktop.run("window.originalFetch = window.fetch; window.fetch = (path, options) => path.startsWith('/api/local/sync') ? Promise.reject(new TypeError('disconnect')) : window.originalFetch(path, options)");
        await desktop.wait("!document.querySelector('#local-connection').hidden && document.querySelector('#local-controls').disabled");
        await desktop.run('window.fetch = window.originalFetch'); await desktop.wait("document.querySelector('#local-connection').hidden");
        await checkpoint((turn) => {
          turn.phase = 'AwaitDebt'; turn.seats[0].cash = 0;
          turn.seats.slice(2).forEach((seat) => { seat.eliminated = true; });
          turn.ownership = { 'VN-S14': seats[0] }; turn.mortgages = { 'VN-S14': true };
          turn.pendingDebt = { kind: 'payment', from: seats[0], to: seats[1], amount: 10 };
        });
        await action(control('Bankrupt')); await desktop.wait("!document.querySelector('#local-handoff').hidden"); await handoff(desktop, touch);
        await desktop.wait(enabled('ChooseMortgage'));
        assert.equal(await desktop.run("document.querySelector('#local-winner').hidden"), true);
        const acquisition = await snapshot(desktop); assert.equal(acquisition.status, 'InMatch');
        const rejectedChoice = await command({ id: crypto.randomUUID(), expectedRevision: 0, type: 'ChooseMortgage', payload: { choice: 'keep' } }, 1);
        assert.equal(rejectedChoice.status, 409); assert.deepEqual(await snapshot(desktop), acquisition);
        assert.equal(await desktop.run("document.querySelector('#local-winner').hidden"), true);
        await action(control('ChooseMortgage')); await desktop.wait("!document.querySelector('#local-winner').hidden");
        const finished = await snapshot(desktop); assert.equal(finished.status, 'Finished'); assert.equal(finished.turn.winnerSeatId, seats[1]);
        await desktop.wait("document.activeElement.id === 'local-finish-heading'");
        assert.equal(await desktop.run("document.querySelector('#local-controls').hidden && document.querySelector('#local-actions').querySelectorAll('[data-command]').length === 0"), true);
        assert.doesNotMatch(await desktop.run("document.querySelector('#local-match').textContent"), /đang đến lượt|Lượt của/);
        assert.match(await desktop.run("document.querySelector('#local-board').dataset.centerText"), /Ván đã kết thúc/);
        assert.match(await desktop.run("document.querySelector('#local-board').dataset.centerText"), new RegExp(finished.seats.find(({ id }) => id === seats[1]).name));
        const summary = await desktop.run("document.querySelector('#local-final-seats').textContent");
        assert.equal(await desktop.run("document.querySelectorAll('#local-final-seats li').length"), count);
        assert.match(summary, /Đã phá sản/); assert.match(summary, /thế chấp/);
        const expectedHoldings = await desktop.run(`(() => {
          const game = JSON.parse(sessionStorage.getItem('local-game')); const { turn } = game.snapshot;
          return turn.seats.map((seat) => game.board.spaces.filter((space) => turn.ownership[space.id] === seat.id).map((space) => ({ name: game.board.copy[space.labelKey], mortgaged: Boolean(turn.mortgages[space.id]), level: turn.buildings[space.id] ?? 0 })));
        })()`);
        for (const [index, seat] of finished.turn.seats.entries()) {
          const row = await desktop.run(`document.querySelectorAll('#local-final-seats li')[${index}].textContent`);
          assert.ok(row.includes(new Intl.NumberFormat('vi-VN').format(seat.cash) + ' xu'));
          assert.ok(row.includes(seat.eliminated ? 'Đã phá sản' : 'Không phá sản'));
          for (const holding of expectedHoldings[index]) {
            assert.ok(row.includes(holding.name));
            if (holding.mortgaged) assert.ok(row.includes('(thế chấp)'));
            if (holding.level) assert.ok(row.includes(holding.level === 5 ? '1 khách sạn' : `${holding.level} nhà`));
          }
        }
        if (count === 2) {
          await action('#celebrate-local');
          assert.equal(await desktop.run("document.querySelector('#local-winner').classList.contains('celebrating')"), true);
          if (touch) assert.equal(await desktop.run("getComputedStyle(document.querySelector('#local-winner')).animationName"), 'none');
          await desktop.run("document.querySelector('#new-local').focus()"); await Bun.sleep(1200);
          assert.equal(await desktop.run("document.querySelector('#local-winner').classList.contains('celebrating')"), true);
          assert.equal(await desktop.run('document.activeElement.id'), 'new-local');
        }
        await action('#stop-local-celebration');
        assert.equal(await desktop.run("document.querySelector('#local-winner').classList.contains('celebrating')"), false);
        assert.deepEqual((await snapshot(desktop)).turn, finished.turn);
        // A periodic sync must leave user focus where it is.
        await desktop.run("document.querySelector('#new-local').focus()"); await Bun.sleep(1200);
        assert.equal(await desktop.run('document.activeElement.id'), 'new-local');
        await desktop.call('Page.reload'); await desktop.wait("document.querySelector('#local-winner') && !document.querySelector('#local-winner').hidden");
        assert.equal(await desktop.run("document.querySelector('#local-final-seats').textContent"), summary);
        assert.match(await desktop.run("document.querySelector('#local-announcement').textContent"), /thắng ván chơi/);
        assert.equal(await desktop.run("document.querySelector('#local-winner').classList.contains('celebrating')"), false);
        assert.equal(await desktop.run('document.documentElement.scrollWidth'), touch ? 360 : 1440);
        assert.ok(await desktop.run("document.querySelector('#celebrate-local').getBoundingClientRect().height >= 44"));
        const capture = `family-monopoly-st206-${count}-${touch ? 'phone' : 'desktop'}.png`;
        await desktop.run("document.querySelector('#local-winner').scrollIntoView({ block: 'center' })"); await shot(desktop, capture);
        const retained = store.read().find((room) => room.id === roomId);
        evidence.push({ seats: count, viewport: touch ? 360 : 1440, input: touch ? 'touch' : 'keyboard', reducedMotion: touch, replacementSetupInput: 'keyboard',
          rejected: { unauthorized: unauthorized.status, stale: stale.status, revision: before.revision },
          retry: { revision: bought.revision, propertyBoughtEvents: purchaseEvents.length },
          acquisitionRevision: acquisition.revision, finishedRevision: finished.revision,
          finishEvents: retained.history.flatMap(({ events }) => events).filter(({ type }) => ['SeatBankrupted', 'MatchFinished'].includes(type)).map(({ type }) => type), capture: '/tmp/' + capture });
        desktop.dialog(true); await action('#new-local'); await desktop.wait("document.querySelector('#local-setup') && !document.querySelector('#local-setup').hidden");
        assert.equal(await desktop.run("sessionStorage.getItem('local-game')"), null);
        assert.deepEqual(store.read().find((room) => room.id === roomId).turn, retained.turn);
        // Also exercise confirmed unfinished replacement without deleting server state.
        dice.splice(0, dice.length, [6, 6], [5, 5], [4, 4], [3, 3]);
        // Supplementary replacement fixture uses keyboard submit; primary setup above uses the journey input.
        await setup(desktop, new URL('/local', server.url).href, false, count);
        const unfinished = await snapshot(desktop);
        desktop.dialog(true); await action('#new-local'); await desktop.wait("document.querySelector('#local-setup') && !document.querySelector('#local-setup').hidden");
        assert.ok(store.read().some((room) => room.id === unfinished.roomId && room.status === 'InMatch'));
      }
    }
    console.log(JSON.stringify({ result: 'PASS', contracts: 'ST-206 / B-16 / R-08 / AC-16, AC-23, AC-33–38', browser: browser.product,
      fixtures: 'Temporary file-store saved checkpoints, production HTTP/UI; not uninterrupted naturally played matches', evidence,
      familyGate: 'OPEN: no real participant observations, physical-device or B-09 approvals' }, null, 2));
  } else if (st204Only) {

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
    await desktop.click('#retry-command'); await handoff(desktop); await desktop.wait(enabled('EndTurn'));
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
  } else if (st205Only) {
    await handoff(desktop);
    await seed((turn) => {
      turn.phase = 'AwaitDebt'; turn.seats[0].cash = 0; turn.ownership = { 'VN-S01': ids[0] };
      turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 20, ledgerType: 'RentPaid', sourceId: 'VN-S39' };
      turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }];
    });
    await desktop.wait("document.querySelector('#local-context').textContent.includes('20 xu')");
    await desktop.click('#asset-details summary'); await desktop.click(control('Mortgage'));
    await desktop.wait("document.querySelector('#local-context').textContent.includes('20 xu')");
    await desktop.wait(enabled('SettleDebt')); await desktop.click(control('SettleDebt')); await desktop.wait(enabled('EndTurn'));
    assert.equal((await snapshot(desktop)).turn.seats[0].cash, 20);
    const paymentsBeforeRetry = store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'RentPaid').length;

    // A lost settlement response is retried exactly once after refresh.
    await seed((turn) => {
      turn.phase = 'AwaitDebt'; turn.seats[0].cash = 80; turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 40, ledgerType: 'RentPaid', sourceId: 'VN-S39' };
      turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }];
    });
    await desktop.run(`(() => { const original = window.fetch; let lost = false; window.fetch = async (path, options) => { const response = await original(path, options); if (!lost && path === '/api/local/command' && JSON.parse(options.body).type === 'SettleDebt') { lost = true; throw new TypeError('lost response'); } return response; }; })()`);
    await desktop.click(control('SettleDebt')); await desktop.wait("!document.querySelector('#local-retry').hidden && !document.querySelector('#retry-command').disabled");
    const paidSnapshot = await snapshot(desktop); assert.equal(paidSnapshot.turn.seats[0].cash, 40);
    const paidEvents = store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'RentPaid');
    assert.equal(paidEvents.length, paymentsBeforeRetry + 1);
    await desktop.call('Page.reload'); await desktop.wait("!document.querySelector('#local-retry').hidden");
    assert.equal((await snapshot(desktop)).turn.seats[0].cash, 40);
    await desktop.click('#retry-command'); await desktop.wait("!document.querySelector('#local-handoff').hidden"); await handoff(desktop); await desktop.wait(enabled('EndTurn'));
    assert.equal(store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'RentPaid').length, paymentsBeforeRetry + 1);

    // Reject a stale settlement without hiding the pending debt; the player can issue a fresh intent.
    await seed((turn) => {
      turn.phase = 'AwaitDebt'; turn.seats[0].cash = 80; turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 40, ledgerType: 'RentPaid', sourceId: 'VN-S39' };
      turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }];
    });
    const staleRoom = store.read().find((entry) => entry.id === roomId); staleRoom.revision += 1; staleRoom.history.push({ revision: staleRoom.revision, events: [] });
    store.write(store.read().map((entry) => entry.id === roomId ? staleRoom : entry));
    await desktop.click(control('SettleDebt'));
    await desktop.wait("document.querySelector('#local-error').textContent.includes('Ván chơi vừa thay đổi')");
    await desktop.wait("document.querySelector('#local-context').textContent.includes('40 xu')");
    assert.equal((await snapshot(desktop)).turn.seats[0].cash, 80);
    await handoff(desktop);
    await desktop.click(control('SettleDebt')); await desktop.wait(enabled('EndTurn'));
    assert.equal((await snapshot(desktop)).turn.seats[0].cash, 40);

    assert.equal(await desktop.run("document.querySelector('#local-purchase-actions > legend')?.textContent"), 'Mua khu đất hoặc mở đấu giá');

    // A retry rejected at the same revision must reopen handoff before any fresh intent.
    await seed((turn) => {
      turn.phase = 'AwaitDebt'; turn.seats[0].cash = 80;
      turn.pendingDebt = { kind: 'payment', from: ids[0], to: ids[1], amount: 40, ledgerType: 'RentPaid', sourceId: 'VN-S39' };
      turn.queue = [{ kind: 'finishRoll', seatId: ids[0] }];
    });
    await desktop.wait(enabled('SettleDebt'));
    const beforeRejectedRetry = await snapshot(desktop);
    await desktop.run(`(() => {
      const original = window.fetch;
      let firstBody;
      window.fetch = async (path, options) => {
        if (path !== '/api/local/command' || JSON.parse(options.body).type !== 'SettleDebt') return original(path, options);
        if (!firstBody) {
          firstBody = options.body;
          throw new TypeError('No response before settlement reached the server');
        }
        window.fetch = original;
        if (options.body !== firstBody) throw new Error('Retry changed the original intent');
        return new Response(JSON.stringify({ error: 'ActionRejected' }), { status: 400 });
      };
    })()`);
    await desktop.click(control('SettleDebt'));
    await desktop.wait("!document.querySelector('#local-retry').hidden && !document.querySelector('#retry-command').disabled");
    assert.equal(await desktop.run("document.querySelector('#local-handoff').hidden"), true);
    await desktop.click('#retry-command');
    await desktop.wait("document.querySelector('#local-retry').hidden && !document.querySelector('#local-handoff').hidden && !document.querySelector('#confirm-handoff').disabled");
    assert.match(await desktop.run("document.querySelector('#local-error').textContent"), /Thao tác không hợp lệ/);
    assert.equal(await desktop.run("document.activeElement.id === 'handoff-heading' && !document.querySelector('[data-command=SettleDebt]:enabled')"), true);
    assert.deepEqual(await snapshot(desktop), beforeRejectedRetry);
    await handoff(desktop);
    await desktop.wait(enabled('SettleDebt'));

    // Review a mortgaged trade, navigate back to edit, then let only the target accept.
    await seed((turn) => {
      turn.phase = 'AwaitEnd'; turn.pendingDebt = undefined; turn.trade = undefined; turn.seats[0].cash = 100; turn.seats[1].cash = 100;
      turn.ownership = { 'VN-S01': ids[0], 'VN-S39': ids[1] }; turn.mortgages = { 'VN-S01': true };
      turn.buildings = {}; turn.queue = [];
    });
    await desktop.click('#trade-details summary');
    await desktop.run(`(() => { document.querySelector('#trade-properties-${ids[0]}').options[0].selected = true; document.querySelector('#trade-cash-${ids[1]}').value = 20; })()`);
    await desktop.click(control('OfferTrade'));
    await desktop.wait("!document.querySelector('.trade-review').hidden");
    const review = await desktop.run("document.querySelector('.trade-review').textContent");
    assert.match(review, /VN-S01|phố|đang thế chấp/); assert.match(review, /Bình chọn giữ/); assert.match(review, /4 xu/);
    await desktop.click(".trade-review button.secondary"); assert.equal(await desktop.run("document.querySelector('.trade-review').hidden"), true);
    await desktop.run(`document.querySelector('#trade-cash-${ids[1]}').value = 22`);
    await desktop.click(control('OfferTrade')); await desktop.wait("!document.querySelector('.trade-review').hidden");
    const revisedReview = await desktop.run("document.querySelector('.trade-review').textContent");
    assert.match(revisedReview, /22 xu/); assert.equal(await desktop.run(`document.querySelector('#trade-cash-${ids[1]}').disabled`), true);
    await desktop.run(`document.querySelector('#trade-cash-${ids[1]}').value = 99`);
    await desktop.click(control('ConfirmOfferTrade')); await desktop.wait(enabled('TradeHandoff'));
    const proposerTerms = await desktop.run("document.querySelector('#local-actions').textContent");
    assert.match(proposerTerms, /Bình đưa: Tiền: 22 xu/); assert.doesNotMatch(proposerTerms, /99 xu/);
    await desktop.click(control('TradeHandoff')); await handoff(desktop);
    await desktop.wait(enabled('AcceptTrade'));
    const targetTerms = await desktop.run("document.querySelector('#local-actions').textContent");
    assert.match(targetTerms, /thế chấp/); assert.match(targetTerms, /giải chấp/);
    await desktop.click(control('AcceptTrade')); await desktop.wait(enabled('ChooseMortgage'));
    const acquisition = await desktop.run("document.querySelector('#local-actions').textContent");
    assert.match(acquisition, /trả ngay/); assert.match(acquisition, /giải chấp ngay/);
    await desktop.click(control('ChooseMortgage')); await desktop.wait("!document.querySelector('#local-handoff').hidden"); await handoff(desktop); await desktop.wait(enabled('EndTurn'));
    const traded = await snapshot(desktop); assert.equal(traded.turn.ownership['VN-S01'], ids[1]);
    assert.equal(traded.turn.seats[1].cash, 74);

    // The recipient can cancel before any cash or property is committed.
    await seed((turn) => {
      turn.phase = 'AwaitEnd'; turn.trade = undefined; turn.pendingDebt = undefined; turn.seats[0].cash = 100; turn.seats[1].cash = 100;
      turn.ownership = { 'VN-S01': ids[0], 'VN-S39': ids[1] }; turn.mortgages = { 'VN-S01': true }; turn.buildings = {}; turn.queue = [];
    });
    await desktop.click('#trade-details summary');
    await desktop.run(`(() => { document.querySelector('#trade-cash-${ids[0]}').value = 10; document.querySelector('#trade-cash-${ids[1]}').value = 5; })()`);
    await desktop.click(control('OfferTrade')); await desktop.wait("!document.querySelector('.trade-review').hidden"); await desktop.click(control('ConfirmOfferTrade'));
    await desktop.wait(enabled('TradeHandoff')); await desktop.click(control('TradeHandoff')); await handoff(desktop);
    await desktop.wait(enabled('CancelTrade')); await desktop.click(control('CancelTrade'));
    await desktop.wait("document.querySelector('#local-history').textContent.includes('hủy đề nghị')");
    const canceled = await snapshot(desktop); assert.equal(canceled.turn.seats[0].cash, 100); assert.equal(canceled.turn.seats[1].cash, 100);

    const mobileBundle = await desktop.run("sessionStorage.getItem('local-game')");
    await phone.run(`sessionStorage.setItem('local-game', ${JSON.stringify(mobileBundle)})`); await phone.call('Page.reload');
    await phone.wait("document.querySelector('#local-match')?.dataset.revision === '" + canceled.revision + "'");
    await handoff(phone, true); await phone.tap('#trade-details summary');
    assert.equal(await phone.run("document.querySelector('#trade-details').open"), true);
    assert.equal(await phone.run(`(() => { const target = document.querySelector('#trade-properties-${ids[0]}'); if (!target?.options.length) throw Error('Expected an available mobile trade property'); target.options[0].selected = true; return target.options[0].selected; })()`), true);
    await phone.tap(control('OfferTrade')); await phone.wait("!document.querySelector('.trade-review').hidden");
    assert.ok(await phone.run("document.querySelector('[data-command=ConfirmOfferTrade]').getBoundingClientRect().height >= 44"));
    await phone.tap(control('ConfirmOfferTrade')); await phone.wait(enabled('TradeHandoff'));
    await phone.tap(control('TradeHandoff')); await handoff(phone, true); await phone.wait(enabled('AcceptTrade'));
    await phone.tap(control('AcceptTrade')); await phone.wait(enabled('ChooseMortgage'));
    await phone.tap(control('ChooseMortgage')); await phone.wait("!document.querySelector('#local-handoff').hidden"); await handoff(phone, true);
    await phone.wait("document.documentElement.scrollWidth === 360");
    assert.ok(await phone.run("document.querySelector('[data-command=EndTurn]').getBoundingClientRect().height >= 44"));
    console.log(JSON.stringify({ result: 'PASS', contracts: 'ST-205 / AC-11, AC-19–21, AC-24–32, AC-36–38', browser: 'Chrome desktop keyboard and 360px touch viewport, reduced motion', flows: ['debt identity and lawful mortgage liquidation', 'lost settlement response, refresh and exact retry', 'stale rejection retains debt context for fresh intent', 'same-revision rejected retry reopens handoff', 'two-sided mortgaged trade review with frozen confirmed terms', 'edit after review', 'recipient cancellation without settlement', 'target-only acceptance and acquisition charges', 'keyboard and touch handoffs', '360px trade review controls'] }, null, 2));
  } else {
  await desktop.run("document.querySelector('#confirm-handoff').focus()"); await desktop.key('Enter', 'Enter', 13);
  await desktop.wait(enabled('Roll'));
  if (st502Evidence) await assertTableLayouts(desktop, 'Roll', 'turn');
  await desktop.click(control('Roll'));
  if (st203Only) {
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'true' && !document.querySelector('#skip-local-motion').hidden");
    await desktop.click('#skip-local-motion');
    await desktop.wait("document.querySelector('#local-board').dataset.animating === 'false' && document.querySelector('#skip-local-motion').hidden");
  }
  await desktop.wait(enabled('Buy')); await assertCommittedRoll(desktop);
  const purchase = await snapshot(desktop); assert.equal(purchase.turn.phase, 'AwaitPurchase');
  if (st502Evidence) {
    assert.match(await desktop.run("document.querySelector('.local-deed').textContent"), /Sân nhỏ Hà Nội.*Giá mua.*Tiền đang có.*Còn lại nếu mua.*Tiền thuê cơ bản/);
    await assertTableLayouts(desktop, 'Buy', 'purchase');
    await desktop.click('.local-deed > button');
    assert.equal(await desktop.run("document.activeElement.id"), 'local-space-heading');
    await desktop.key('Escape', 'Escape', 27);
    await desktop.wait("document.activeElement.matches('.local-deed > button')");
    await desktop.click('#open-local-history');
    assert.equal(await desktop.run("document.activeElement.id"), 'local-history-heading');
    await desktop.key('Escape', 'Escape', 27);
    await desktop.wait("document.activeElement.id === 'open-local-history'");
    await assertCanvasFallback(new URL('/local', server.url).href);
    await captureApprovedMock();
  }

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
  const savedIntent = await desktop.run("sessionStorage.getItem('local-command')");
  const retryOrigin = await desktop.run('performance.timeOrigin');
  await desktop.call('Page.reload');
  await desktop.wait(`performance.timeOrigin !== ${retryOrigin} && !document.querySelector('#local-retry').hidden && !document.querySelector('#retry-command').disabled`);
  assert.equal(await desktop.run("sessionStorage.getItem('local-command')"), savedIntent);
  assert.equal(await desktop.run("document.querySelector('#local-controls').disabled && document.querySelector('#local-board').dataset.animating === 'false'"), true);
  await desktop.click('#retry-command'); await handoff(desktop); await desktop.wait(enabled('EndTurn'));
  assert.equal((await snapshot(desktop)).turn.seats[0].cash, 1100);
  assert.equal(store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'PropertyBought').length, 1);
  assert.match(await desktop.run("document.querySelector('#local-outcome').textContent"), /An mua Sân nhỏ Hà Nội với 100 xu.*An: 1\.100 xu/);
  assert.match(await desktop.run("document.querySelector('#local-players .seat-1').textContent"), /1\.100 xu.*1 tài sản/);
  await desktop.click(control('EndTurn'));
  await desktop.wait("!document.querySelector('#local-handoff').hidden && document.querySelector('#handoff-heading').textContent.includes('Bình')");
  assert.equal(await desktop.run("document.querySelector('#local-controls').disabled"), true);
  await handoff(desktop); await desktop.click(control('Roll')); await desktop.wait(enabled('Decline'));
  await desktop.click(control('Decline')); await desktop.wait(enabled('Bid'));
  await choose(desktop, ids[2]); await desktop.click(control('Bid'));
  await desktop.wait("document.querySelector('#local-context').textContent.includes('Đấu giá') && document.querySelector('#local-history').textContent.includes('10 xu')");
  for (const id of [ids[0], ids[1], ids[3]]) { await choose(desktop, id); await desktop.click(control('Pass')); await desktop.wait("!document.querySelector('#local-controls').disabled || !document.querySelector('#local-handoff').hidden"); }
  await handoff(desktop); await desktop.wait(enabled('EndTurn'));
  const auction = await snapshot(desktop); assert.equal(auction.turn.activeSeatId, ids[1]); assert.equal(auction.turn.ownership['VN-S05'], ids[2]); assert.equal(auction.turn.seats[2].cash, 1190);
  await desktop.click(control('EndTurn')); await handoff(desktop); await desktop.click(control('Roll')); await desktop.wait(enabled('EndTurn'));
  assert.equal((await snapshot(desktop)).turn.seats[2].cash, 1184);
  const rent = store.read().find((entry) => entry.id === roomId).history.at(-1).events.find((event) => event.type === 'RentPaid');
  const current = await snapshot(desktop);
  const payer = current.seats.find(({ id }) => id === rent.from).name;
  const recipient = current.seats.find(({ id }) => id === rent.to).name;
  assert.ok((await desktop.run("document.querySelector('#local-outcome').textContent")).includes(`${payer} trả ${rent.amount} xu tiền thuê cho ${recipient}`));
  await shot(desktop, 'family-monopoly-local-desktop.png');
  // Submit a stale Roll against an advanced revision. It must generate no event or motion.
  baseTurn = initialTurn;
  await seed(() => {});
  await desktop.wait(enabled('Roll'));
  const staleRoll = store.read().find((entry) => entry.id === roomId);
  const existingRolls = staleRoll.history.flatMap(({ events }) => events).filter(({ type }) => type === 'Rolled').length;
  const untouchedDice = dice.length;
  staleRoll.revision += 1;
  staleRoll.history.push({ revision: staleRoll.revision, events: [] });
  store.write(store.read().map((entry) => entry.id === roomId ? staleRoll : entry));
  await desktop.click(control('Roll'));
  await desktop.wait("!document.querySelector('#local-error').hidden && document.querySelector('#local-error').textContent.includes('Ván chơi vừa thay đổi')");
  await desktop.wait("!document.querySelector('#local-handoff').hidden && document.querySelector('#local-controls').disabled");
  assert.equal(await desktop.run("document.querySelector('#local-board').dataset.animating"), 'false');
  assert.equal(store.read().find((entry) => entry.id === roomId).history.flatMap(({ events }) => events).filter(({ type }) => type === 'Rolled').length, existingRolls);
  assert.equal(dice.length, untouchedDice);
  await handoff(desktop);

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
  await desktop.click(control('OfferTrade')); await desktop.wait(enabled('ConfirmOfferTrade')); await desktop.click(control('ConfirmOfferTrade'));
  await desktop.wait(enabled('TradeHandoff')); await desktop.click(control('TradeHandoff')); await handoff(desktop);
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
  await assertInspection(phone, true);
  await shot(phone, 'family-monopoly-st502-phone-purchase.png');
  await phone.tap(control('Buy')); await phone.wait(enabled('EndTurn'));
  await phone.run("window.originalFetch = window.fetch; window.fetch = (path, options) => path.startsWith('/api/local/sync') ? Promise.reject(new TypeError('Injected disconnect')) : window.originalFetch(path, options)");
  await phone.wait("!document.querySelector('#local-connection').hidden && document.querySelector('#local-controls').disabled");
  await phone.run('window.fetch = window.originalFetch'); await phone.wait(enabled('EndTurn'));
  assert.equal(await phone.run("document.querySelector('#local-error').hidden"), true);
  assert.equal(await phone.run('document.documentElement.scrollWidth'), 360);
  assert.ok(await phone.run("document.querySelector('[data-command=EndTurn]').getBoundingClientRect().height >= 44"));
  await phone.run("document.querySelector('#local-sheet-content').scrollTop = 0; window.scrollTo(0, 0)");
  await shot(phone, 'family-monopoly-local-phone.png');
  // The next seat lands on the same bought property in an uninterrupted two-turn flow.
  dice.unshift([1, 2]);
  const home = await snapshot(phone);
  const ownerId = home.turn.ownership['VN-S03'];
  const activeIndex = home.turn.seats.findIndex(({ id }) => id === ownerId);
  const nextId = home.turn.seats[(activeIndex + 1) % home.turn.seats.length].id;
  const ownerName = home.seats.find(({ id }) => id === ownerId).name;
  const nextName = home.seats.find(({ id }) => id === nextId).name;
  await phone.tap(control('EndTurn'));
  await phone.wait(`!document.querySelector('#local-handoff').hidden && document.querySelector('#handoff-heading').textContent.includes(${JSON.stringify(nextName)})`);
  await handoff(phone, true);
  await phone.tap(control('Roll'));
  await phone.wait(enabled('EndTurn'));
  assert.ok((await phone.run("document.querySelector('#local-outcome').textContent")).includes(`${nextName} trả 6 xu tiền thuê cho ${ownerName}. Sân nhỏ Hà Nội`));
  const paidRent = await snapshot(phone);
  assert.equal(paidRent.turn.seats.find(({ id }) => id === nextId).cash, 1194);
  assert.equal(paidRent.turn.seats.find(({ id }) => id === ownerId).cash, 1106);
  assert.equal(dice.length, 0);
  console.log(JSON.stringify({ result: 'PASS', contracts: 'ST-502 / AC-04, AC-06, AC-10, AC-33–38', browser: (await send('Browser.getVersion')).product, seats: [3, 4], layouts: ['1440×900', '1280×720', '1024×768', '768×1024', '360×800'], presentation: ['desktop keyboard and narrow touch', '200% browser reflow approximation', 'reduced motion', 'forced Canvas fallback', '40-space and history dialog focus return', 'accepted state and approved mock captures'], flows: ['setup', 'handoff', 'purchase refresh', 'lost-response retry', 'explicit auction actors', 'rent', 'jail fee and release card', 'debt liquidation and settlement', 'mortgage acquisition', 'trade confirmation', 'building and sale', 'building demand auction', 'hotel shortage liquidation', 'winner', 'offline recovery'], screenshots: ['/tmp/family-monopoly-local-desktop.png', '/tmp/family-monopoly-local-phone.png'] }, null, 2));
  }
  }
} finally {
  clearTimeout(deadline); socket?.close(); server?.stop(true);
  if (chrome) { chrome.kill(); await chrome.exited; }
  rmSync(directory, { recursive: true, force: true });
}
