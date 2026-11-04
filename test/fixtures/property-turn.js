import { board, rules } from '../../src/domain/synthetic-board.js';

// Synthetic inputs for AC-04 and AC-06. No values are taken from a retail edition.
export function createPropertyTurnFixture() {
  return {
    board: structuredClone(board),
    rules: { ...rules },
    turn: {
      phase: 'AwaitRoll',
      activeSeatId: 'host',
      seats: [
        { id: 'host', position: 0, cash: 100 },
        { id: 'guest', position: 0, cash: 100 },
      ],
      ownership: { rent: 'guest' },
    },
    // Each scenario starts with a fresh copy of the same turn.
    diceByScenario: {
      'AC-04': [1, 1],
      'AC-06': [1, 2],
    },
  };
}
