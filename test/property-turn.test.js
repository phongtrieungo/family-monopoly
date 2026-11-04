import { expect, test } from 'bun:test';

import { createPropertyTurnReducer } from '../src/domain/property-turn.js';
import { createPropertyTurnFixture } from './fixtures/property-turn.js';

test('AC-04: buying the landed property transfers cash and title together', () => {
  const { board, rules, turn, diceByScenario } = createPropertyTurnFixture();
  const reduce = createPropertyTurnReducer(board, rules);
  const roll = { type: 'Roll', actorId: 'host' };
  const buy = { type: 'Buy', actorId: 'host' };
  const input = { dice: diceByScenario['AC-04'] };

  const landing = reduce(turn, roll, input);
  expect(landing.state.phase).toBe('AwaitPurchase');
  expect(landing.state.seats[0].position).toBe(2);
  expect(landing.events).toEqual([
    { type: 'Rolled', seatId: 'host', dice: [1, 1], spaceId: 'purchase' },
  ]);
  const purchase = reduce(landing.state, buy);
  expect(purchase.state.phase).toBe('AwaitEnd');
  expect(purchase.state.seats[0].cash).toBe(50);
  expect(purchase.state.ownership).toEqual({ rent: 'guest', purchase: 'host' });
  expect(purchase.events).toEqual([
    { type: 'PropertyBought', spaceId: 'purchase', from: 'host', amount: 50 },
  ]);
  expect(landing.state.seats[0].cash).toBe(100);
  expect(landing.state.ownership).toEqual({ rent: 'guest' });
  expect(reduce(reduce(turn, roll, input).state, buy)).toEqual(purchase);
  expect(() => reduce(purchase.state, buy)).toThrow('Buy is not allowed');
});

test('AC-06: affordable rent settles once before the next seat can roll', () => {
  const { board, rules, turn, diceByScenario } = createPropertyTurnFixture();
  const reduce = createPropertyTurnReducer(board, rules);
  const roll = { type: 'Roll', actorId: 'host' };
  const input = { dice: diceByScenario['AC-06'] };

  const landing = reduce(turn, roll, input);
  expect(landing.state.phase).toBe('AwaitEnd');
  expect(landing.state.seats.map((seat) => seat.cash)).toEqual([92, 108]);
  expect(landing.events).toEqual([
    { type: 'Rolled', seatId: 'host', dice: [1, 2], spaceId: 'rent' },
    { type: 'RentPaid', spaceId: 'rent', from: 'host', to: 'guest', amount: 8 },
  ]);
  expect(() => reduce(landing.state, roll, input)).toThrow('Roll is not allowed');
  const ended = reduce(landing.state, { type: 'EndTurn', actorId: 'host' });
  expect(ended.state.activeSeatId).toBe('guest');
  expect(ended.state.phase).toBe('AwaitRoll');
  expect(ended.state.seats.map((seat) => seat.cash)).toEqual([92, 108]);
  expect(reduce(ended.state, { type: 'Roll', actorId: 'guest' }, input).state.phase).toBe('AwaitEnd');
});

test.each([
  ['duplicate space ID', (board) => { board.spaces[1].id = 'start'; }],
  ['out-of-order position', (board) => { board.spaces[1].position = 2; }],
  ['missing group', (board) => { board.groups = []; }],
  ['missing economy entry', (board) => { delete board.economy['purchase-economy']; }],
  ['negative rent', (board) => { board.economy['purchase-economy'].rent = -1; }],
  ['unsupported space type', (board) => { board.spaces[1].type = 'deck'; }],
  ['duplicate start', (board) => { board.spaces[1].type = 'start'; }],
  ['unsupported rules version', (_, rules) => { rules.version += 1; }],
])('rejects a board configuration with %s', (_, invalidate) => {
  const { board, rules } = createPropertyTurnFixture();
  invalidate(board, rules);
  expect(() => createPropertyTurnReducer(board, rules)).toThrow();
});

test('wraps around the board using the configuration captured at startup', () => {
  const { board, rules, turn } = createPropertyTurnFixture();
  const reduce = createPropertyTurnReducer(board, rules);
  board.spaces[0].id = 'changed';
  turn.seats[0].position = 2;
  const landing = reduce(turn, { type: 'Roll', actorId: 'host' }, { dice: [1, 1] });
  expect(landing.events[0].spaceId).toBe('start');
  expect(landing.state.phase).toBe('AwaitEnd');
  expect(landing.state.seats[0].position).toBe(0);
});

test('rejects illegal commands and unaffordable transfers without changing the input', () => {
  const { board, rules, turn } = createPropertyTurnFixture();
  const reduce = createPropertyTurnReducer(board, rules);
  turn.seats[0].cash = 1;
  const before = structuredClone(turn);
  const roll = { type: 'Roll', actorId: 'host' };

  expect(() => reduce(turn, { ...roll, actorId: 'guest' }, { dice: [1, 1] })).toThrow('active seat');
  expect(() => reduce(turn, roll, { dice: [1, 7] })).toThrow('authoritative dice');
  expect(() => reduce(turn, { type: 'EndTurn', actorId: 'host' })).toThrow('EndTurn is not allowed');
  expect(() => reduce(turn, roll, { dice: [1, 2] })).toThrow('Rent exceeds');
  expect(turn).toEqual(before);

  const landing = reduce(turn, roll, { dice: [1, 1] });
  const beforeBuy = structuredClone(landing.state);
  expect(() => reduce(landing.state, { type: 'Buy', actorId: 'host' })).toThrow('Insufficient cash');
  expect(landing.state).toEqual(beforeBuy);
});
