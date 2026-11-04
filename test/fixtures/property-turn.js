// Synthetic inputs for AC-04 and AC-06. No values are taken from a retail edition.
export function createPropertyTurnFixture() {
  return {
    board: {
      id: 'synthetic-property-turn',
      version: 1,
      spaces: [
        { id: 'start', position: 0, type: 'start', labelKey: 'space.start' },
        { id: 'rest', position: 1, type: 'inert', labelKey: 'space.rest' },
        {
          id: 'purchase',
          position: 2,
          type: 'property',
          labelKey: 'space.purchase',
          groupId: 'fixture-group',
          economyId: 'purchase-economy',
        },
        {
          id: 'rent',
          position: 3,
          type: 'property',
          labelKey: 'space.rent',
          groupId: 'fixture-group',
          economyId: 'rent-economy',
        },
      ],
      groups: [{ id: 'fixture-group' }],
      economy: {
        'purchase-economy': { price: 50, rent: 5 },
        'rent-economy': { price: 80, rent: 8 },
      },
    },
    rules: { id: 'synthetic-prototype', version: 1 },
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
