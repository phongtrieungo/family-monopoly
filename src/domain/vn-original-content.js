// Project-authored internal content for vn-original-v1. See the research content profile.
// Keep copy separate from the authoritative board, deed and card effect data.
const streetRows = [
  [1, 'G1', 80, 40, [4, 8, 20, 60, 180, 280, 400]],
  [3, 'G1', 100, 40, [6, 12, 30, 90, 220, 340, 480]],
  [6, 'G2', 120, 60, [8, 16, 40, 120, 300, 420, 560]],
  [8, 'G2', 120, 60, [8, 16, 40, 120, 300, 420, 560]],
  [9, 'G2', 140, 60, [10, 20, 50, 150, 340, 460, 620]],
  [11, 'G3', 160, 80, [12, 24, 60, 180, 400, 540, 700]],
  [13, 'G3', 160, 80, [12, 24, 60, 180, 400, 540, 700]],
  [14, 'G3', 180, 80, [14, 28, 70, 210, 440, 580, 760]],
  [16, 'G4', 200, 100, [16, 32, 80, 240, 500, 660, 840]],
  [18, 'G4', 200, 100, [16, 32, 80, 240, 500, 660, 840]],
  [19, 'G4', 220, 100, [18, 36, 90, 270, 540, 700, 900]],
  [21, 'G5', 240, 120, [20, 40, 100, 300, 600, 780, 980]],
  [23, 'G5', 240, 120, [20, 40, 100, 300, 600, 780, 980]],
  [24, 'G5', 260, 120, [22, 44, 110, 330, 640, 820, 1040]],
  [26, 'G6', 280, 140, [24, 48, 120, 360, 700, 900, 1120]],
  [27, 'G6', 280, 140, [24, 48, 120, 360, 700, 900, 1120]],
  [29, 'G6', 300, 140, [26, 52, 130, 390, 740, 940, 1180]],
  [31, 'G7', 320, 160, [28, 56, 140, 420, 800, 1020, 1260]],
  [32, 'G7', 320, 160, [28, 56, 140, 420, 800, 1020, 1260]],
  [34, 'G7', 340, 160, [30, 60, 150, 450, 840, 1060, 1320]],
  [37, 'G8', 360, 180, [34, 68, 170, 510, 920, 1160, 1440]],
  [39, 'G8', 400, 180, [40, 80, 200, 600, 1040, 1300, 1600]],
];

const labels = [
  'Quảng trường sum vầy', 'Ngõ hoa Hà Nội', 'Chuyện xóm mình', 'Sân nhỏ Hà Nội', 'Quỹ hạ tầng',
  'Bến xe Bắc', 'Phố đèn Hải Phòng', 'Bước ngoặt', 'Chợ sớm Hải Phòng', 'Hiên nhà Hải Phòng',
  'Nhà chờ', 'Vườn nhà Huế', 'Trạm điện khu phố', 'Ngõ tím Huế', 'Sân vườn Huế', 'Bến xe Trung',
  'Hiên nắng Đà Nẵng', 'Chuyện xóm mình', 'Chợ chiều Đà Nẵng', 'Phố gió Đà Nẵng', 'Vườn nghỉ',
  'Đồi hoa Đà Lạt', 'Bước ngoặt', 'Ngõ thông Đà Lạt', 'Sân mây Đà Lạt', 'Bến xe Cao Nguyên',
  'Chợ nổi Cần Thơ', 'Ngõ nước Cần Thơ', 'Trạm nước khu phố', 'Hiên sông Cần Thơ', 'Đến nhà chờ',
  'Phố sáng Sài Gòn', 'Ngõ vui Sài Gòn', 'Chuyện xóm mình', 'Sân chung Sài Gòn', 'Bến xe Nam',
  'Bước ngoặt', 'Vườn biển Phú Quốc', 'Phí cảnh quan', 'Hiên biển Phú Quốc',
];
const streets = new Map(streetRows.map(([position, groupId, price, buildingCost, rents]) =>
  [position, { groupId, economy: { price, buildingCost, rents } }]));
const transitPositions = new Set([5, 15, 25, 35]);
const servicePositions = new Set([12, 28]);
const communityPositions = new Set([2, 17, 33]);
const chancePositions = new Set([7, 22, 36]);

const spaces = labels.map((label, position) => {
  const id = `VN-S${String(position).padStart(2, '0')}`;
  const base = { id, position, labelKey: `vn.space.${String(position).padStart(2, '0')}` };
  if (position === 0) return { ...base, type: 'start' };
  if (streets.has(position)) return { ...base, type: 'street', ...streets.get(position) };
  if (transitPositions.has(position)) return { ...base, type: 'transit', groupId: 'T', price: 180 };
  if (servicePositions.has(position)) return { ...base, type: 'service', groupId: 'U', price: 140 };
  if (communityPositions.has(position)) return { ...base, type: 'deck', deckId: 'community' };
  if (chancePositions.has(position)) return { ...base, type: 'deck', deckId: 'chance' };
  if (position === 4) return { ...base, type: 'tax', amount: 120 };
  if (position === 38) return { ...base, type: 'tax', amount: 80 };
  if (position === 10) return { ...base, type: 'jail' };
  if (position === 30) return { ...base, type: 'go-to-jail' };
  return { ...base, type: 'rest' };
});

const cards = {
  chance: [
    ['VN-C01', 'move', { destination: 0, direction: 'forward' }],
    ['VN-C02', 'move', { destination: 11, direction: 'forward' }],
    ['VN-C03', 'move', { destination: 24, direction: 'forward' }],
    ['VN-C04', 'move', { destination: 39, direction: 'forward' }],
    ['VN-C05', 'next-type', { type: 'transit' }], ['VN-C06', 'next-type', { type: 'service' }],
    ['VN-C07', 'move-back', { spaces: 3 }], ['VN-C08', 'go-to-jail', {}],
    ['VN-C09', 'retain-release', {}], ['VN-C10', 'bank-credit', { amount: 70 }],
    ['VN-C11', 'bank-credit', { amount: 40 }], ['VN-C12', 'bank-credit', { amount: 30 }],
    ['VN-C13', 'bank-debit', { amount: 45 }], ['VN-C14', 'bank-debit', { amount: 25 }],
    ['VN-C15', 'repairs', { house: 20, hotel: 70 }], ['VN-C16', 'pay-each-seat', { amount: 15 }],
  ],
  community: [
    ['VN-M01', 'bank-credit', { amount: 90 }], ['VN-M02', 'bank-credit', { amount: 60 }],
    ['VN-M03', 'bank-credit', { amount: 35 }], ['VN-M04', 'bank-credit', { amount: 25 }],
    ['VN-M05', 'collect-each-seat', { amount: 10 }],
    ['VN-M06', 'move', { destination: 0, direction: 'forward' }],
    ['VN-M07', 'move', { destination: 1, direction: 'forward' }],
    ['VN-M08', 'move', { destination: 26, direction: 'forward' }], ['VN-M09', 'go-to-jail', {}],
    ['VN-M10', 'retain-release', {}], ['VN-M11', 'bank-debit', { amount: 20 }],
    ['VN-M12', 'bank-debit', { amount: 30 }], ['VN-M13', 'bank-debit', { amount: 55 }],
    ['VN-M14', 'repairs', { house: 35, hotel: 90 }], ['VN-M15', 'bank-credit', { amount: 45 }],
    ['VN-M16', 'bank-credit', { amount: 15 }],
  ],
};

function freezeContent(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freezeContent); Object.freeze(value); }
  return value;
}

export const vnOriginalCopy = freezeContent(Object.fromEntries(labels.map((label, position) => [`vn.space.${String(position).padStart(2, '0')}`, label])));

export const vnOriginalRules = freezeContent({ id: 'vn-original-v1', version: 1, startCash: 1200, startAward: 160 });
export const vnNeighborhoodBoard = freezeContent({
  id: 'vn-neighborhood-v1', version: 1, spaces,
  groups: [...Array.from({ length: 8 }, (_, index) => ({ id: `G${index + 1}` })), { id: 'T' }, { id: 'U' }],
  economy: Object.fromEntries(streetRows.map(([position, groupId, price, buildingCost, rents]) =>
    [`VN-S${String(position).padStart(2, '0')}`, { groupId, price, buildingCost, rents }])),
  transit: { price: 180, rents: [20, 45, 90, 180] },
  service: { price: 140, multipliers: [4, 10] },
  taxes: [120, 80],
  stock: { houses: 32, hotels: 12 },
});
export const vnOriginalDecks = freezeContent(Object.fromEntries(Object.entries(cards).map(([id, entries]) =>
  [id, entries.map(([cardId, effect, data]) => ({ id: cardId, effect, ...data }))])));

export function validateVnOriginalContent(board = vnNeighborhoodBoard, decks = vnOriginalDecks) {
  if (board.id !== 'vn-neighborhood-v1' || board.version !== 1 || board.spaces.length !== 40) {
    throw new Error('Invalid vn-neighborhood-v1 board identity or length');
  }
  const ids = new Set();
  const validAmount = (value) => Number.isSafeInteger(value) && value >= 0;
  const types = new Set(['start', 'street', 'transit', 'service', 'deck', 'tax', 'jail', 'go-to-jail', 'rest']);
  const groups = new Set(board.groups.map(({ id }) => id));
  if (groups.size !== 10 || board.groups.length !== 10) throw new Error('Invalid VN street groups');
  for (const [position, space] of board.spaces.entries()) {
    if (space.position !== position || space.id !== `VN-S${String(position).padStart(2, '0')}` || ids.has(space.id)) {
      throw new Error('Invalid or duplicate VN board space');
    }
    ids.add(space.id);
    if (!types.has(space.type) || typeof space.labelKey !== 'string') throw new Error('Unsupported VN board space');
    if (space.type === 'street' && (!groups.has(space.groupId) || !space.economy ||
        !validAmount(space.economy.price) || !validAmount(space.economy.buildingCost) ||
        !Array.isArray(space.economy.rents) || space.economy.rents.length !== 7 || !space.economy.rents.every(validAmount) ||
        JSON.stringify(space.economy) !== JSON.stringify(Object.fromEntries(Object.entries(board.economy[space.id] ?? {}).filter(([key]) => key !== 'groupId'))))) {
      throw new Error('Invalid VN street economy or group reference');
    }
    if (['transit', 'service'].includes(space.type) && !validAmount(space.price)) throw new Error('Invalid VN property price');
    if (space.type === 'tax' && !validAmount(space.amount)) throw new Error('Invalid VN tax');
    if (space.type === 'deck' && !['chance', 'community'].includes(space.deckId)) throw new Error('Invalid VN deck reference');
  }
  for (const [deckId, expectedPrefix] of [['chance', 'VN-C'], ['community', 'VN-M']]) {
    if (decks[deckId]?.length !== 16 || new Set(decks[deckId].map((card) => card.id)).size !== 16 ||
        decks[deckId].some((card, index) => card.id !== `${expectedPrefix}${String(index + 1).padStart(2, '0')}`)) {
      throw new Error(`Invalid ${deckId} deck`);
    }
  }
  const effects = new Set(['move', 'next-type', 'move-back', 'go-to-jail', 'retain-release', 'bank-credit', 'bank-debit', 'repairs', 'pay-each-seat', 'collect-each-seat']);
  for (const card of Object.values(decks).flat()) {
    if (!effects.has(card.effect)) throw new Error('Unsupported VN card effect');
    if (['bank-credit', 'bank-debit', 'pay-each-seat', 'collect-each-seat'].includes(card.effect) && !validAmount(card.amount)) throw new Error('Invalid VN card amount');
    if (card.effect === 'move' && (!validAmount(card.destination) || card.destination >= 40)) throw new Error('Invalid VN card destination');
    if (card.effect === 'next-type' && !['transit', 'service'].includes(card.type)) throw new Error('Invalid VN card target type');
    if (card.effect === 'move-back' && (!validAmount(card.spaces) || card.spaces === 0)) throw new Error('Invalid VN relative move');
    if (card.effect === 'repairs' && (!validAmount(card.house) || !validAmount(card.hotel))) throw new Error('Invalid VN repair rates');
  }
  return true;
}
