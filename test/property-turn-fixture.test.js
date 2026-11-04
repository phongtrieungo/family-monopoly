import assert from 'node:assert/strict';
import test from 'node:test';

import { createPropertyTurnFixture } from './fixtures/property-turn.js';

test('property-turn fixtures start from the same state without sharing mutable inputs', () => {
  const first = createPropertyTurnFixture();
  const second = createPropertyTurnFixture();

  assert.deepEqual(first, second);

  first.turn.seats[0].cash = 0;
  first.board.spaces[0].labelKey = 'changed';
  first.diceByScenario['AC-04'][0] = 6;

  assert.deepEqual(second, createPropertyTurnFixture());
  assert.notDeepEqual(first, second);
});

test('scripted dice reach the intended affordable purchase and rival rent spaces', () => {
  const { board, turn, diceByScenario } = createPropertyTurnFixture();
  const activeSeat = turn.seats.find((seat) => seat.id === turn.activeSeatId);

  const landingSpace = (dice) => {
    assert.equal(dice.length, 2);
    for (const die of dice) {
      assert.ok(Number.isInteger(die) && die >= 1 && die <= 6);
    }
    const position = activeSeat.position + dice[0] + dice[1];
    return board.spaces[position];
  };

  const purchase = landingSpace(diceByScenario['AC-04']);
  assert.equal(purchase.type, 'property');
  assert.equal(turn.ownership[purchase.id], undefined);
  assert.ok(activeSeat.cash >= board.economy[purchase.economyId].price);

  const rental = landingSpace(diceByScenario['AC-06']);
  assert.equal(rental.type, 'property');
  assert.equal(turn.ownership[rental.id], 'guest');
  assert.ok(activeSeat.cash >= board.economy[rental.economyId].rent);
});
