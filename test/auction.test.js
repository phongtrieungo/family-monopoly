import { expect, test } from 'bun:test';

import { createPropertyTurnReducer } from '../src/domain/property-turn.js';
import { createPropertyTurnFixture } from './fixtures/property-turn.js';

function createAuction() {
  const { board, rules, turn } = createPropertyTurnFixture();
  const reduce = createPropertyTurnReducer(board, rules);
  const landing = reduce(turn, { type: 'Roll', actorId: 'host' }, { dice: [1, 1] }).state;
  const decline = { type: 'Decline', actorId: 'host' };
  return { reduce, landing, decline, opened: reduce(landing, decline) };
}

test('AC-05: decline starts an auction and the winning bid settles exactly once', () => {
  const { reduce, landing, decline, opened } = createAuction();
  expect(() => reduce(landing, { ...decline, actorId: 'guest' })).toThrow('active seat');
  expect(opened.state.auction).toEqual({
    spaceId: 'purchase', eligibleSeatIds: ['host', 'guest'], highBid: null,
  });

  const bid = { type: 'Bid', actorId: 'guest', amount: 30 };
  const leading = reduce(opened.state, bid).state;
  expect(leading.seats).toEqual(landing.seats);
  expect(leading.ownership).toEqual(landing.ownership);

  const pass = { type: 'Pass', actorId: 'host' };
  const settled = reduce(leading, pass);
  expect(settled.state.phase).toBe('AwaitEnd');
  expect(settled.state.activeSeatId).toBe('host');
  expect(settled.state.auction).toBeUndefined();
  expect(settled.state.ownership).toEqual({ rent: 'guest', purchase: 'guest' });
  expect(settled.state.seats.map((seat) => seat.cash)).toEqual([100, 70]);
  expect(settled.events).toEqual([
    { type: 'AuctionPassed', spaceId: 'purchase', seatId: 'host' },
    { type: 'AuctionSettled', spaceId: 'purchase', from: 'guest', amount: 30 },
  ]);
  expect(reduce(reduce(opened.state, bid).state, pass)).toEqual(settled);
  expect(() => reduce(settled.state, pass)).toThrow('Pass is not allowed');
  expect(reduce(settled.state, { type: 'EndTurn', actorId: 'host' }).state.activeSeatId).toBe('guest');
});

test('rejects invalid bids and passes without changing the pending auction', () => {
  const { reduce, opened } = createAuction();
  const state = reduce(opened.state, { type: 'Bid', actorId: 'host', amount: 30 }).state;
  const before = structuredClone(state);
  for (const amount of [30, 29, 31.5, NaN]) {
    expect(() => reduce(state, { type: 'Bid', actorId: 'guest', amount })).toThrow('exceed');
  }
  expect(() => reduce(state, { type: 'Bid', actorId: 'guest', amount: 101 })).toThrow('Insufficient cash');
  expect(() => reduce(state, { type: 'Pass', actorId: 'outsider' })).toThrow('not eligible');
  expect(() => reduce(state, { type: 'Pass', actorId: 'host' })).toThrow('leading bidder');
  expect(() => reduce(state, { type: 'Buy', actorId: 'host' })).toThrow('Buy is not allowed');
  expect(state).toEqual(before);

  const outbid = reduce(state, { type: 'Bid', actorId: 'guest', amount: 100 }).state;
  expect(outbid.auction.highBid).toEqual({ seatId: 'guest', amount: 100 });
  expect(reduce(outbid, { type: 'Pass', actorId: 'host' }).state.seats[1].cash).toBe(0);
});

test('passes are final and an all-pass auction leaves the deed with the bank', () => {
  const { reduce, opened } = createAuction();
  const pass = { type: 'Pass', actorId: 'host' };
  const pending = reduce(opened.state, pass).state;
  expect(pending.phase).toBe('Auction');
  expect(() => reduce(pending, pass)).toThrow('not eligible');
  expect(() => reduce(pending, { type: 'Bid', actorId: 'host', amount: 1 })).toThrow('not eligible');

  const ended = reduce(pending, { type: 'Pass', actorId: 'guest' });
  expect(ended.state.phase).toBe('AwaitEnd');
  expect(ended.state.auction).toBeUndefined();
  expect(ended.state.ownership).toEqual(opened.state.ownership);
  expect(ended.state.seats).toEqual(opened.state.seats);
  expect(ended.events).toEqual([
    { type: 'AuctionPassed', spaceId: 'purchase', seatId: 'guest' },
    { type: 'AuctionEndedWithoutBid', spaceId: 'purchase' },
  ]);
});
