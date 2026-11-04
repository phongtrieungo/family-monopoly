// Original fixture data for the internal prototype.
export const board = {
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
};

export const rules = { id: 'synthetic-prototype', version: 1 };
