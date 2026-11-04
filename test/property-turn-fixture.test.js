import { expect, test } from 'bun:test';

import { createPropertyTurnFixture } from './fixtures/property-turn.js';

test('property-turn fixtures start from the same state without sharing mutable inputs', () => {
  const first = createPropertyTurnFixture();
  const second = createPropertyTurnFixture();

  expect(first).toEqual(second);

  first.turn.seats[0].cash = 0;
  first.board.spaces[0].labelKey = 'changed';
  first.diceByScenario['AC-04'][0] = 6;

  expect(second).toEqual(createPropertyTurnFixture());
  expect(first).not.toEqual(second);
});

test('scripted dice reach the intended affordable purchase and rival rent spaces', () => {
  const { board, turn, diceByScenario } = createPropertyTurnFixture();
  const activeSeat = turn.seats.find((seat) => seat.id === turn.activeSeatId);

  const landingSpace = (dice) => {
    expect(dice).toHaveLength(2);
    for (const die of dice) {
      expect(Number.isInteger(die) && die >= 1 && die <= 6).toBe(true);
    }
    const position = activeSeat.position + dice[0] + dice[1];
    return board.spaces[position];
  };

  const purchase = landingSpace(diceByScenario['AC-04']);
  expect(purchase.type).toBe('property');
  expect(turn.ownership[purchase.id]).toBeUndefined();
  expect(activeSeat.cash).toBeGreaterThanOrEqual(board.economy[purchase.economyId].price);

  const rental = landingSpace(diceByScenario['AC-06']);
  expect(rental.type).toBe('property');
  expect(turn.ownership[rental.id]).toBe('guest');
  expect(activeSeat.cash).toBeGreaterThanOrEqual(board.economy[rental.economyId].rent);
});
