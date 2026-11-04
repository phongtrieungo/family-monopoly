import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { createRoomFileStore } from '../src/rooms/file-store.js';
import { createRoomService } from '../src/rooms/service.js';
import { createPropertyTurnFixture } from './fixtures/property-turn.js';

const directories = [];

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function fixture({ rollDice = () => [1, 1] } = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'family-monopoly-'));
  directories.push(directory);
  const path = join(directory, 'rooms.json');
  const store = createRoomFileStore(path);
  const { board, rules } = createPropertyTurnFixture();
  const open = (roomStore = createRoomFileStore(path)) =>
    createRoomService({ store: roomStore, board, rules, startingCash: 100, rollDice });
  const rooms = open();
  const host = rooms.create('Host');
  const guest = rooms.join(host.invite, 'Guest');
  return { rooms, open, store, host, guest };
}

function command(type, expectedRevision, payload, id = type) {
  return { id, expectedRevision, type, payload };
}

function ready({ rooms, host, guest }) {
  rooms.submit(host.session, command('Ready', 1, { ready: true }));
  return rooms.submit(guest.session, command('Ready', 2, { ready: true })).revision;
}

function start(context) {
  const revision = ready(context);
  return context.rooms.submit(context.host.session, command('Start', revision)).revision;
}

test('AC-01: a ready host and guest start and freeze a private roster', () => {
  const context = fixture();
  const { rooms, host, guest } = context;
  const revision = ready(context);
  expect(() => rooms.submit(guest.session, command('Start', revision))).toThrow('HostRequired');
  rooms.submit(host.session, command('Start', revision));
  const state = rooms.reconnect(guest.session);
  expect(state.status).toBe('InMatch');
  expect(state.profile).toEqual({
    board: { id: 'synthetic-property-turn', version: 1 },
    rules: { id: 'synthetic-prototype', version: 1 },
  });
  expect(state.seats).toHaveLength(2);
  expect(state.turn.activeSeatId).toBe(host.snapshot.selfSeatId);
  expect(() => rooms.join(host.invite, 'Late')).toThrow('RoomStarted');
});

test('AC-02: start rejects an unready or disconnected seat', () => {
  const { rooms, host, guest } = fixture();
  rooms.submit(host.session, command('Ready', 1, { ready: true }));
  expect(() => rooms.submit(host.session, command('Start', 2))).toThrow('SeatsNotReady');
  const lobby = rooms.reconnect(host.session);
  expect(lobby.status).toBe('Lobby');
  expect(lobby.seats.find(({ id }) => id === guest.snapshot.selfSeatId).ready).toBe(false);
  rooms.submit(guest.session, command('Ready', 2, { ready: true }));
  const disconnected = rooms.disconnect(guest.session);
  expect(() => rooms.submit(host.session, command('Start', disconnected.revision))).toThrow('SeatsNotReady');
});

test('AC-03: an invalid invite exposes no state and invite and seat credentials are separate', () => {
  const { rooms, host, guest } = fixture();
  expect(() => rooms.join('invalid', 'Visitor')).toThrow('InvalidInvite');
  expect(() => rooms.reconnect(host.invite)).toThrow('Unauthorized');
  expect(() => rooms.eventsSince('invalid', 0)).toThrow('Unauthorized');
  const state = rooms.reconnect(guest.session);
  for (const secret of [host.invite, host.session, guest.session]) {
    expect(JSON.stringify(state)).not.toContain(secret);
    expect(JSON.stringify(rooms.eventsSince(guest.session, 0))).not.toContain(secret);
  }
});

test('full and closed lobbies reject joins without a snapshot', () => {
  const { rooms, host } = fixture();
  rooms.join(host.invite, 'Third');
  const fourth = rooms.join(host.invite, 'Fourth');
  expect(() => rooms.join(host.invite, 'Fifth')).toThrow('RoomFull');
  rooms.submit(host.session, command('Close', fourth.snapshot.revision));
  expect(() => rooms.join(host.invite, 'Fifth')).toThrow('RoomClosed');
});

test('a join committed before start invalidates the host’s earlier revision', () => {
  const context = fixture();
  const { rooms, host } = context;
  const revision = ready(context);
  const third = context.open().join(host.invite, 'Third');
  expect(() => rooms.submit(host.session, command('Start', revision))).toThrow('ResyncRequired');
  expect(() => rooms.submit(host.session, command('Start', third.snapshot.revision))).toThrow('SeatsNotReady');
  expect(rooms.reconnect(host.session).seats).toHaveLength(3);
});

test('AC-07: reconnect after reopening storage restores the original seat and pending purchase', () => {
  const context = fixture();
  const { rooms, host } = context;
  rooms.submit(host.session, command('Roll', start(context)));
  const disconnected = rooms.disconnect(host.session);
  const restarted = context.open();
  const state = restarted.reconnect(host.session);
  expect(state.selfSeatId).toBe(host.snapshot.selfSeatId);
  expect(state.turn.phase).toBe('AwaitPurchase');
  expect(state.turn.seats[0].position).toBe(2);
  expect(state.revision).toBe(disconnected.revision + 1);
  expect(restarted.reconnect(host.session).revision).toBe(state.revision);
});

test('AC-08: lost purchase response can be retried after reopening storage', () => {
  const context = fixture();
  const { rooms, host, guest } = context;
  const roll = rooms.submit(host.session, command('Roll', start(context)));
  const buy = command('Buy', roll.revision);
  const committed = rooms.submit(host.session, buy);
  const restarted = context.open();
  expect(restarted.submit(host.session, buy)).toEqual(committed);
  expect(() => restarted.submit(host.session, { ...buy, type: 'Decline' })).toThrow('CommandIdConflict');
  expect(() => restarted.submit(host.session, command('EndTurn', roll.revision))).toThrow('ResyncRequired');
  const state = restarted.reconnect(host.session);
  expect(state.revision).toBe(committed.revision);
  expect(state.turn.seats[0].cash).toBe(50);
  expect(state.turn.ownership).toEqual({ purchase: host.snapshot.selfSeatId });
  expect(restarted.eventsSince(guest.session, roll.revision)).toEqual([committed]);
  expect(() => restarted.eventsSince(guest.session, committed.revision + 1)).toThrow('ResyncRequired');
});

test('AC-09: unauthorized rolls do not consume dice or advance the revision', () => {
  let rolls = 0;
  const context = fixture({ rollDice: () => { rolls += 1; return [1, 1]; } });
  const { rooms, host, guest } = context;
  const revision = start(context);
  expect(() => rooms.submit(guest.session, command('Roll', revision))).toThrow('active seat');
  expect(() => rooms.submit(guest.session,
    command('Roll', revision, { actorId: host.snapshot.selfSeatId }))).toThrow('InvalidCommand');
  expect(rooms.eventsSince(guest.session, revision)).toEqual([]);
  expect(rooms.reconnect(host.session).revision).toBe(revision);
  expect(rolls).toBe(0);
});

test('a failed store write exposes neither state, receipt nor events', () => {
  const context = fixture();
  const { rooms, host, store } = context;
  const roll = rooms.submit(host.session, command('Roll', start(context)));
  const failing = context.open({ read: store.read, write() { throw new Error('Write failed'); } });
  const buy = command('Buy', roll.revision);
  expect(() => failing.submit(host.session, buy)).toThrow('Write failed');
  expect(rooms.reconnect(host.session).turn.phase).toBe('AwaitPurchase');
  expect(rooms.eventsSince(host.session, roll.revision)).toEqual([]);
  expect(rooms.submit(host.session, buy).revision).toBe(roll.revision + 1);
});

test('competing auction bids at the same revision settle in commit order', () => {
  const context = fixture();
  const { rooms, host, guest } = context;
  const roll = rooms.submit(host.session, command('Roll', start(context)));
  const auction = rooms.submit(host.session, command('Decline', roll.revision));
  const hostBid = command('Bid', auction.revision, { amount: 30 });
  const guestBid = command('Bid', auction.revision, { amount: 40 });
  const accepted = rooms.submit(host.session, hostBid);
  const otherClient = context.open();
  expect(() => otherClient.submit(guest.session, guestBid)).toThrow('ResyncRequired');
  expect(otherClient.eventsSince(guest.session, auction.revision)).toEqual([accepted]);

  const raised = otherClient.submit(guest.session, { ...guestBid, expectedRevision: accepted.revision });
  expect(() => otherClient.submit(guest.session, { ...guestBid, payload: { amount: 45 } }))
    .toThrow('CommandIdConflict');
  const settled = rooms.submit(host.session, command('Pass', raised.revision));
  expect(settled.events.filter(({ type }) => type === 'AuctionSettled')).toHaveLength(1);
  expect(rooms.reconnect(guest.session).turn.ownership).toEqual({ purchase: guest.snapshot.selfSeatId });
});
