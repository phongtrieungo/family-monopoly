import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { createRequestHandler } from '../src/web/server.js';
import { vnNeighborhoodBoard, vnOriginalRules } from '../src/domain/vn-original-content.js';
import { board, rules } from '../src/domain/synthetic-board.js';

const dirs = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), 'family-monopoly-local-')); dirs.push(dir);
  const store = createRoomFileStore(join(dir, 'rooms.json')); let diceCalls = 0;
  const settings = { board: vnNeighborhoodBoard, rules: vnOriginalRules, startingCash: 1200, rollDice: () => [[6, 6], [5, 5], [4, 4], [3, 3]][diceCalls++ % 4], shuffleDeck: (ids) => ids };
  const open = (selectedStore = store) => createRoomService({ ...settings, store: selectedStore });
  const local = open(); const online = createRoomService({ store, board, rules, startingCash: 100 });
  const handler = createRequestHandler(online, { localRooms: local });
  const request = async (path, body, session, extra = {}) => {
    const response = await handler(new Request(`http://127.0.0.1${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session}` } : {}), ...extra }, body: body === undefined ? undefined : JSON.stringify(body) }));
    return { status: response.status, body: await response.json() };
  };
  return { store, open, local, online, request, calls: () => diceCalls };
}

test.each([2, 3, 4])('AC-33: %i people start atomically with distinct sessions and retry setup without new dice', (count) => {
  const { local, store, calls } = fixture(); const names = Array.from({ length: count }, (_, i) => `Người ${i + 1}`); const requestId = crypto.randomUUID();
  const first = local.createLocal(names, requestId); const diceCalls = calls();
  expect(first.sessions).toHaveLength(count); expect(new Set(first.sessions.map(({ session }) => session)).size).toBe(count);
  expect(first.snapshot.mode).toBe('Local'); expect(first.snapshot.status).toBe('InMatch'); expect(first.snapshot.profile.rules.id).toBe('vn-original-v1');
  expect(first.snapshot.turn.seats.every(({ cash }) => cash === 1200)).toBe(true);
  expect(local.createLocal(names, requestId)).toEqual(first); expect(calls()).toBe(diceCalls); expect(store.read()).toHaveLength(1);
  expect(() => local.createLocal(names.map((name) => `${name}x`), requestId)).toThrow('CommandIdConflict');
  expect(() => local.join(null, 'Guest')).toThrow('InvalidInvite');
});

test('AC-33: invalid setup and failed commits leave no partial match or issued seats', () => {
  const { local, store, open } = fixture();
  for (const names of [[], ['A'], ['A', 'B', 'C', 'D', 'E'], ['A', ' a '], ['A', ''], ['A', 'x'.repeat(33)]]) {
    expect(() => local.createLocal(names, crypto.randomUUID())).toThrow('InvalidLocalSetup');
  }
  const failing = open({ read: store.read, write: () => { throw new Error('Injected storage failure'); } });
  expect(() => failing.createLocal(['A', 'B'], crypto.randomUUID())).toThrow('Injected storage failure'); expect(store.read()).toEqual([]);
});

test('AC-34: local routes authenticate the acting seat, reject nonlocal sessions and enforce revisions', async () => {
  const { request, store, online } = fixture();
  const result = await request('/api/local/create', { names: ['A', 'B', 'C', 'D'], requestId: crypto.randomUUID() }); expect(result.status).toBe(201);
  const { sessions, snapshot } = result.body; const before = store.read();
  const bad = await request('/api/local/command', { id: 'wrong-seat', expectedRevision: snapshot.revision, type: 'Roll', payload: {}, actorId: sessions[0].seatId }, sessions[1].session);
  expect(bad.status).toBe(400); expect(store.read()).toEqual(before);
  expect((await request('/api/local/sync', undefined, 'invalid')).status).toBe(401);
  const remote = online.create('Guest'); expect((await request('/api/local/sync', undefined, remote.session)).status).toBe(401);
  expect((await request('/api/local/create', { names: ['A', 'B'], requestId: crypto.randomUUID() }, undefined, { Origin: 'https://unrelated.example' })).status).toBe(403);
  const stale = await request('/api/local/command', { id: 'stale', expectedRevision: 0, type: 'Roll' }, sessions[0].session); expect(stale.status).toBe(409);
});

test('AC-36: public snapshots and history hide the seat bundle and deck work; exact command retries survive reopening', async () => {
  const { request, open, local, store } = fixture();
  const { sessions, snapshot } = local.createLocal(['A', 'B'], crypto.randomUUID()); const primary = sessions[0].session;
  const command = { id: 'lost-roll', expectedRevision: snapshot.revision, type: 'Roll', payload: {} };
  const accepted = await request('/api/local/command', command, primary); expect(accepted.status).toBe(200);
  expect(open().submit(primary, command)).toEqual(accepted.body);
  const synced = await request('/api/local/sync?since=0', undefined, primary);
  const publicText = JSON.stringify(synced.body);
  for (const { session } of sessions) expect(publicText).not.toContain(session);
  for (const secret of ['decks', 'initialDecks', 'content', 'queue', 'localCreationId']) expect(synced.body.snapshot.turn).not.toHaveProperty(secret);
  expect(store.read()[0].receipts.filter(({ id }) => id === 'lost-roll')).toHaveLength(1);
});

test('AC-36: one shared-device disconnect and reconnect changes all local seats together', () => {
  const { local, open } = fixture(); const { sessions } = local.createLocal(['A', 'B', 'C', 'D'], crypto.randomUUID());
  const before = local.reconnect(sessions[0].session); const disconnected = local.disconnect(sessions[1].session);
  expect(disconnected.seats.every(({ connected }) => !connected)).toBe(true); expect(disconnected.revision).toBe(before.revision + 1);
  const resumed = open().reconnect(sessions[3].session);
  expect(resumed.seats.every(({ connected }) => connected)).toBe(true); expect(resumed.turn).toEqual(before.turn);
});

test('AC-37: full-match public asset controls distinguish lawful construction, sale and mortgages', async () => {
  const { propertyOptions } = await import('../src/web/local-controls.js');
  const turn = { ownership: { 'VN-S01': 'a', 'VN-S03': 'a' }, mortgages: {}, buildings: { 'VN-S01': 1 }, stock: { houses: 31, hotels: 12 } };
  let choices = propertyOptions(turn, vnNeighborhoodBoard, 'a');
  expect(choices.find(({ space }) => space.id === 'VN-S01').canBuild).toBe(false);
  expect(choices.find(({ space }) => space.id === 'VN-S03').canBuild).toBe(true);
  expect(choices.every(({ canMortgage }) => !canMortgage)).toBe(true);
  expect(choices.find(({ space }) => space.id === 'VN-S01').canSell).toBe(true);
  turn.mortgages['VN-S03'] = true;
  choices = propertyOptions(turn, vnNeighborhoodBoard, 'a');
  expect(choices.every(({ canBuild }) => !canBuild)).toBe(true);
});
