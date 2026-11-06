import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { vnNeighborhoodBoard as board, vnOriginalRules as rules } from '../src/domain/vn-original-content.js';

const directories = [];
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })));
function fixture() {
  const directory = mkdtempSync(join(tmpdir(), 'family-monopoly-full-')); directories.push(directory);
  const path = join(directory, 'rooms.json'); const store = createRoomFileStore(path);
  const dice = [[6, 6], [1, 1], [1, 2]];
  const open = () => createRoomService({ store: createRoomFileStore(path), board, rules, startingCash: 1200, rollDice: () => dice.shift() ?? [1, 2], shuffleDeck: (ids) => ids[0].startsWith('VN-M') ? ['VN-M05', ...ids.filter((id) => id !== 'VN-M05')] : ids });
  let rooms = open(); const host = rooms.create('Host'); const guest = rooms.join(host.invite, 'Guest');
  const submit = (person, type, payload = {}, id = crypto.randomUUID()) => rooms.submit(person.session, { id, type, payload, expectedRevision: rooms.reconnect(person.session).revision });
  submit(host, 'Ready', { ready: true }); submit(guest, 'Ready', { ready: true }); submit(host, 'Start');
  const edit = (change) => { const records = store.read(); change(records[0].turn); store.write(records); };
  return { host, guest, submit, edit, store, reopen: () => { rooms = open(); return rooms; }, get rooms() { return rooms; } };
}

test('AC-14 and AC-15: durable debt recovery preserves card work and redacts unrevealed order', () => {
  const context = fixture(); const { host, guest, submit, edit } = context;
  const hostId = host.snapshot.selfSeatId; const guestId = guest.snapshot.selfSeatId;
  edit((turn) => { turn.seats[0].position = 39; turn.seats[1].cash = 0; turn.ownership['VN-S01'] = guestId; });
  submit(host, 'Roll');
  const pending = context.rooms.reconnect(guest.session);
  expect(pending.turn.phase).toBe('AwaitDebt'); expect(pending.turn.pendingDebt.from).toBe(guestId);
  expect(pending.turn).not.toHaveProperty('decks'); expect(pending.turn).not.toHaveProperty('queue');
  expect(pending.turn).not.toHaveProperty('content'); expect(pending.turn).not.toHaveProperty('initialDecks');
  context.rooms.disconnect(guest.session); context.reopen();
  expect(context.rooms.reconnect(guest.session).turn.pendingDebt).toEqual(pending.turn.pendingDebt);
  submit(guest, 'Mortgage', { spaceId: 'VN-S01' });
  const command = { id: 'settle-collection', type: 'SettleDebt', payload: {}, expectedRevision: context.rooms.reconnect(guest.session).revision };
  const receipt = context.rooms.submit(guest.session, command);
  const after = context.rooms.reconnect(host.session);
  expect(after.turn.seats.find(({ id }) => id === hostId).cash).toBe(1370);
  expect(context.store.read()[0].turn.decks.community.at(-1)).toBe('VN-M05');
  context.reopen(); expect(context.rooms.submit(guest.session, command)).toEqual(receipt);
  expect(context.rooms.reconnect(host.session)).toEqual(after);
  expect(context.rooms.eventsSince(host.session, 0).flatMap(({ events }) => events).filter(({ type, sourceId }) => type === 'PaymentSettled' && sourceId === 'VN-M05')).toHaveLength(1);
});

test('AC-21: acquisition retry after reopening storage charges interest once', () => {
  const context = fixture(); const { host, edit } = context; const hostId = host.snapshot.selfSeatId;
  edit((turn) => { turn.phase = 'AwaitAcquisition'; turn.ownership['VN-S14'] = hostId; turn.mortgages['VN-S14'] = true; turn.acquisition = { kind: 'acquisition', seatId: hostId, spaceId: 'VN-S14' }; });
  const command = { id: 'keep-mortgage', expectedRevision: context.rooms.reconnect(host.session).revision, type: 'ChooseMortgage', payload: { choice: 'keep' } };
  const receipt = context.rooms.submit(host.session, command); context.reopen();
  expect(context.rooms.submit(host.session, command)).toEqual(receipt);
  expect(context.rooms.reconnect(host.session).turn.seats[0].cash).toBe(1191);
  expect(() => context.rooms.submit(host.session, { ...command, payload: { choice: 'release' } })).toThrow('CommandIdConflict');
});

test('AC-27: disconnect and server reopen preserve reserved last-building demand at current revision', () => {
  const context = fixture(); const { host, guest, edit, submit } = context;
  const hostId = host.snapshot.selfSeatId; const guestId = guest.snapshot.selfSeatId;
  edit((turn) => { turn.stock.houses = 1; turn.ownership = { 'VN-S01': hostId, 'VN-S03': hostId, 'VN-S06': guestId, 'VN-S08': guestId, 'VN-S09': guestId }; });
  submit(host, 'Build', { spaceId: 'VN-S01' });
  const pending = context.rooms.reconnect(host.session); expect(pending.turn.phase).toBe('BuildingDemand');
  context.rooms.disconnect(guest.session); context.reopen();
  const restored = context.rooms.reconnect(guest.session);
  expect(restored.turn.buildingDemand).toEqual(pending.turn.buildingDemand);
  expect(restored.turn.stock.houses).toBe(1); expect(restored.turn.seats[0].cash).toBe(1200);
  expect(() => context.rooms.submit(host.session, { id: 'bad-bid', expectedRevision: restored.revision, type: 'Bid', payload: { amount: 10 } })).toThrow('demand');
  expect(() => context.rooms.submit(guest.session, { id: 'stale-demand', expectedRevision: pending.revision, type: 'BuildingDemand', payload: { spaceId: 'VN-S06' } })).toThrow('ResyncRequired');
  submit(guest, 'BuildingDemand', { spaceId: 'VN-S06' }); submit(host, 'Bid', { amount: 10 }); submit(guest, 'Pass');
  const result = context.rooms.reconnect(host.session);
  expect(result.turn.stock.houses).toBe(0); expect(result.turn.buildings['VN-S01']).toBe(1); expect(result.turn.seats[0].cash).toBe(1190);
});

test('final bankruptcy publishes Finished and its committed receipt remains retryable', () => {
  const context = fixture(); const { host, guest, edit } = context;
  edit((turn) => { turn.phase = 'AwaitDebt'; turn.seats[1].cash = 0; turn.pendingDebt = { kind: 'payment', from: guest.snapshot.selfSeatId, to: host.snapshot.selfSeatId, amount: 10 }; });
  const command = { id: 'final-bankruptcy', type: 'Bankrupt', payload: {}, expectedRevision: context.rooms.reconnect(guest.session).revision };
  const receipt = context.rooms.submit(guest.session, command);
  expect(context.rooms.reconnect(host.session).status).toBe('Finished');
  expect(context.rooms.reconnect(host.session).turn.winnerSeatId).toBe(host.snapshot.selfSeatId);
  context.reopen(); expect(context.rooms.submit(guest.session, command)).toEqual(receipt);
  expect(() => context.submit(host, 'Roll')).toThrow('MatchRequired');
});
