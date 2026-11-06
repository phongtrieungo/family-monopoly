import { expect, test } from 'bun:test';
import { createVnOriginalMatch, reduceVnOriginalTurn as reduce } from '../src/domain/vn-original-turn.js';
import { vnOriginalDecks } from '../src/domain/vn-original-content.js';

export function match(ids = ['a', 'b', 'c']) {
  return createVnOriginalMatch(ids, {
    setupRolls: [ids.map((seatId, i) => ({ seatId, dice: i === 0 ? [6, 6] : [1, 1] }))],
    deckOrders: Object.fromEntries(Object.entries(vnOriginalDecks).map(([id, cards]) => [id, cards.map((card) => card.id)])),
  });
}
const act = (state, type, actorId = 'a', payload = {}, inputs = {}) => reduce(state, { type, actorId, ...payload }, inputs);
function draw(state, cardId) {
  const deck = cardId.startsWith('VN-C') ? 'chance' : 'community';
  state.decks[deck] = [cardId, ...state.decks[deck].filter((id) => id !== cardId)];
  state.seats[0].position = deck === 'chance' ? 4 : 39;
  return act(state, 'Roll', 'a', {}, { dice: [1, 2] });
}

test('AC-11: rent debt can be mortgaged and settled once through the reducer', () => {
  const state = match(); state.seats[0].cash = 1; state.seats[0].position = 36;
  state.ownership = { 'VN-S39': 'b', 'VN-S01': 'a' };
  const landing = act(state, 'Roll', 'a', {}, { dice: [1, 2] });
  expect(landing.state.phase).toBe('AwaitDebt'); expect(landing.state.pendingDebt.sourceId).toBe('VN-S39');
  const raised = act(landing.state, 'Mortgage', 'a', { spaceId: 'VN-S01' });
  const paid = act(raised.state, 'SettleDebt');
  expect(paid.events.filter((event) => event.type === 'RentPaid')).toHaveLength(1);
  expect(paid.state.seats[0].cash).toBe(1); expect(paid.state.phase).toBe('AwaitEnd');
  expect(() => act(paid.state, 'SettleDebt')).toThrow(); expect(state.seats[0].cash).toBe(1);
});

test('AC-12 and AC-13: opening bid and auction spending restrictions are enforced by reducer', () => {
  let state = match(); state.seats[0].position = 36;
  state = act(state, 'Roll', 'a', {}, { dice: [1, 2] }).state;
  state = act(state, 'Decline').state;
  const before = structuredClone(state);
  expect(() => act(state, 'Bid', 'b', { amount: 9 })).toThrow();
  expect(() => act(state, 'Mortgage', 'a', { spaceId: 'VN-S01' })).toThrow('Only auction');
  expect(() => act(state, 'OfferTrade', 'a', {})).toThrow('Only auction');
  expect(state).toEqual(before);
  expect(act(state, 'Bid', 'b', { amount: 10 }).state.auction.highBid).toEqual({ seatId: 'b', amount: 10 });
});

test('AC-14: multi-seat collection keeps its card out of deck across debt and continues in order', () => {
  const state = match(); state.seats[1].cash = 0; state.ownership['VN-S01'] = 'b';
  const collection = draw(state, 'VN-M05');
  expect(collection.state.phase).toBe('AwaitDebt'); expect(collection.state.pendingDebt.from).toBe('b');
  expect(collection.state.decks.community).not.toContain('VN-M05');
  const restored = structuredClone(collection.state);
  const raised = act(restored, 'Mortgage', 'b', { spaceId: 'VN-S01' });
  const result = act(raised.state, 'SettleDebt', 'b');
  expect(result.state.seats.map(({ cash }) => cash)).toEqual([1380, 30, 1190]);
  expect(result.events.filter(({ type }) => type === 'PaymentSettled').map(({ from }) => from)).toEqual(['b', 'c']);
  expect(result.state.decks.community.at(-1)).toBe('VN-M05');
});

test('AC-15: retained release card is returned on use before rolling', () => {
  const drawn = draw(match(), 'VN-C09').state;
  expect(drawn.retainedCards.a).toEqual(['VN-C09']); expect(drawn.decks.chance).not.toContain('VN-C09');
  drawn.phase = 'AwaitRoll'; drawn.seats[0].jailed = true;
  const used = act(drawn, 'UseReleaseCard', 'a', { cardId: 'VN-C09' }).state;
  expect(used.seats[0].jailed).toBe(false); expect(used.decks.chance.at(-1)).toBe('VN-C09');
  expect(used.retainedCards.a).toEqual([]);
});

test('AC-16: pinned setup, deck order and accepted commands replay identically', () => {
  const first = match(); const second = structuredClone(first);
  const result = draw(first, 'VN-C10'); const replay = draw(second, 'VN-C10');
  expect(replay).toEqual(result); expect(result.state.profile.rules.id).toBe('vn-original-v1');
  expect(result.state.seats[0].cash).toBe(1270);
  const changed = match(); changed.content.board.version = 2;
  expect(first.content.board.version).toBe(1);
});

test('AC-17 and AC-18: jail movement has no start award and repair cards assess physical buildings', () => {
  const jailed = draw(match(), 'VN-C08');
  expect(jailed.state.seats[0]).toMatchObject({ cash: 1200, position: 10, jailed: true });
  expect(jailed.state.phase).toBe('AwaitEnd');
  const state = match(); state.ownership = { 'VN-S01': 'a', 'VN-S03': 'a' }; state.buildings = { 'VN-S01': 5, 'VN-S03': 2 };
  const repairs = draw(state, 'VN-C15');
  expect(repairs.events.find(({ sourceId }) => sourceId === 'VN-C15').amount).toBe(110);
});

function insolvent(cardId, creditor = 'b') {
  const state = match(); state.seats[0].cash = 0; state.phase = 'AwaitDebt';
  state.pendingDebt = { kind: 'payment', from: 'a', to: creditor, amount: 2000, sourceId: 'test' };
  state.retainedCards.a = [cardId];
  state.decks[cardId.startsWith('VN-C') ? 'chance' : 'community'] = state.decks[cardId.startsWith('VN-C') ? 'chance' : 'community'].filter((id) => id !== cardId);
  return state;
}

test('AC-19 and AC-20: creditor-specific bankruptcy disposition returns cards to the correct deck', () => {
  const creditor = act(insolvent('VN-C09'), 'Bankrupt').state;
  expect(creditor.retainedCards.b).toEqual(['VN-C09']); expect(creditor.decks.chance).not.toContain('VN-C09');
  const bank = act(insolvent('VN-M10', null), 'Bankrupt').state;
  expect(bank.decks.community.at(-1)).toBe('VN-M10'); expect(bank.retainedCards.a).toBeUndefined();
});

test('AC-21: acquired mortgage choice pays distinct interest and later release costs principal plus interest', () => {
  const state = match(); state.phase = 'AwaitAcquisition'; state.ownership['VN-S14'] = 'a'; state.mortgages['VN-S14'] = true;
  state.acquisition = { kind: 'acquisition', seatId: 'a', spaceId: 'VN-S14' };
  const kept = act(state, 'ChooseMortgage', 'a', { choice: 'keep' });
  expect(kept.state.seats[0].cash).toBe(1191);
  expect(() => act(kept.state, 'ChooseMortgage', 'a', { choice: 'keep' })).toThrow();
  const released = act(kept.state, 'ReleaseMortgage', 'a', { spaceId: 'VN-S14' });
  expect(released.state.seats[0].cash).toBe(1092); expect(released.state.mortgages['VN-S14']).toBeUndefined();
});

test('AC-22: bankrupt gift drawer preserves earlier gifts and cancels remaining recipients', () => {
  const state = match(['a', 'b', 'c', 'd']); state.seats[0].cash = 20;
  const gift = draw(state, 'VN-C16'); expect(gift.state.seats[1].cash).toBe(1215);
  expect(gift.state.pendingDebt.to).toBe('c');
  const bankrupt = act(gift.state, 'Bankrupt');
  expect(bankrupt.state.seats[1].cash).toBe(1215); expect(bankrupt.state.seats[2].cash).toBe(1205); expect(bankrupt.state.seats[3].cash).toBe(1200);
  expect(bankrupt.state.decks.chance.at(-1)).toBe('VN-C16'); expect(bankrupt.state.phase).toBe('AwaitRoll');
});

test('AC-23: final bankruptcy waits for mortgage acquisition obligations before victory', () => {
  const state = match(['a', 'b']); state.seats[1].cash = 0; state.ownership['VN-S14'] = 'b'; state.mortgages['VN-S14'] = true;
  const debt = draw(state, 'VN-M05'); const bankrupt = act(debt.state, 'Bankrupt', 'b');
  expect(bankrupt.state.phase).toBe('AwaitAcquisition'); expect(bankrupt.state.winnerSeatId).toBeUndefined();
  const finished = act(bankrupt.state, 'ChooseMortgage', 'a', { choice: 'keep' });
  expect(finished.state.phase).toBe('Finished'); expect(finished.state.winnerSeatId).toBe('a');
  expect(finished.events.find(({ type }) => type === 'PaymentSettled').amount).toBe(9);
  expect(() => act(finished.state, 'Roll', 'a', {}, { dice: [1, 2] })).toThrow('finished');
});

export function demandFixture() {
  const state = match(['a', 'b']); state.stock.houses = 1;
  state.ownership = { 'VN-S01': 'a', 'VN-S03': 'a', 'VN-S06': 'b', 'VN-S08': 'b', 'VN-S09': 'b' };
  return state;
}
test('AC-24: demand reserves the final building and settles a competing auction once', () => {
  const state = demandFixture();
  const demand = act(state, 'Build', 'a', { spaceId: 'VN-S01' }).state;
  expect(demand.phase).toBe('BuildingDemand'); expect(demand.stock.houses).toBe(1); expect(demand.seats[0].cash).toBe(1200);
  let auction = act(demand, 'BuildingDemand', 'b', { spaceId: 'VN-S06' }).state;
  expect(auction.phase).toBe('Auction');
  auction = act(auction, 'Bid', 'a', { amount: 10 }).state;
  const settled = act(auction, 'Pass', 'b');
  expect(settled.state.buildings['VN-S01']).toBe(1); expect(settled.state.stock.houses).toBe(0); expect(settled.state.seats[0].cash).toBe(1190);
  expect(() => act(settled.state, 'Pass', 'b')).toThrow();
});

for (const [id, stock, finalCounts] of [['AC-25', 0, [0, 0, 0]], ['AC-26', 2, [1, 1, 0]]]) {
  test(`${id}: shortage group liquidation commits original-economy refund and physical stock`, () => {
    const state = match(); state.stock = { houses: stock, hotels: 9 };
    state.ownership = { 'VN-S11': 'a', 'VN-S13': 'a', 'VN-S14': 'a' }; state.buildings = { 'VN-S11': 5, 'VN-S13': 5, 'VN-S14': 5 };
    const result = act(state, 'LiquidateHotels', 'a', { groupId: 'G3', finalCounts });
    expect(result.state.stock).toEqual({ houses: 0, hotels: 12 }); expect(result.state.seats[0].cash).toBe(1320);
    expect(Object.values(result.state.buildings)).toEqual(finalCounts);
  });
}

test('jail attempts, doubles, even construction and trade confirmation enforce legal boundaries', () => {
  let state = match(); state.seats[0].jailed = true; state.seats[0].position = 10;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    state.phase = 'AwaitRoll'; state = act(state, 'Roll', 'a', {}, { dice: [1, 2] }).state;
    expect(state.seats[0].position).toBe(10);
  }
  state.phase = 'AwaitRoll'; state = act(state, 'Roll', 'a', {}, { dice: [1, 2] }).state;
  expect(state.seats[0].cash).toBe(1150); expect(state.seats[0].jailed).toBe(false); expect(state.seats[0].position).toBe(13);
  const trade = match(); trade.ownership['VN-S01'] = 'a';
  const offered = act(trade, 'OfferTrade', 'a', { targetSeatId: 'b', give: { cash: 0, properties: ['VN-S01'], cards: [] }, receive: { cash: 20, properties: [], cards: [] } }).state;
  expect(offered.ownership['VN-S01']).toBe('a');
  const accepted = act(offered, 'AcceptTrade', 'b').state;
  expect(accepted.ownership['VN-S01']).toBe('b'); expect(accepted.seats[0].cash).toBe(1220);
});

test('AC-28: jail fee, release cards, double escape and third failure use distinct continuations', () => {
  let state = match(); state.seats[0].jailed = true; state.seats[0].position = 10;
  const paid = act(state, 'PayJail').state;
  expect(paid.seats[0].cash).toBe(1150); expect(paid.phase).toBe('AwaitRoll');
  state = act(state, 'Roll', 'a', {}, { dice: [2, 2] }).state;
  expect(state.seats[0].position).toBe(14); expect(state.seats[0].jailed).toBe(false);
  state = act(state, 'Buy').state; expect(state.phase).toBe('AwaitEnd');
  let third = match(); third.seats[0].jailed = true; third.seats[0].jailAttempts = 2; third.seats[0].position = 10; third.seats[0].cash = 0; third.ownership['VN-S01'] = 'a'; third.ownership['VN-S03'] = 'a';
  third = act(third, 'Roll', 'a', {}, { dice: [1, 2] }).state;
  expect(third.phase).toBe('AwaitDebt'); expect(third.seats[0].position).toBe(10);
  third = act(third, 'Mortgage', 'a', { spaceId: 'VN-S01' }).state;
  third = act(third, 'Mortgage', 'a', { spaceId: 'VN-S03' }).state;
  third = act(third, 'SettleDebt').state;
  expect(third.seats[0].position).toBe(13); expect(third.seats[0].cash).toBe(40); expect(third.seats[0].jailed).toBe(false);
});

test('AC-29: ordinary doubles grant another roll and the third consecutive double sends the seat to jail', () => {
  let state = match(); state.seats[0].doubles = 2;
  const third = act(state, 'Roll', 'a', {}, { dice: [2, 2] });
  expect(third.state.seats[0].position).toBe(10); expect(third.state.seats[0].jailed).toBe(true); expect(third.state.phase).toBe('AwaitEnd');
  state = match(); state.seats[0].position = 36;
  const first = act(state, 'Roll', 'a', {}, { dice: [2, 2] });
  expect(first.state.phase).toBe('AwaitRoll'); expect(first.state.seats[0].cash).toBe(1360);
});

test('AC-30: mortgaged property trade pauses for acquisition and developed streets cannot be offered', () => {
  let state = match(); state.ownership['VN-S14'] = 'a'; state.mortgages['VN-S14'] = true;
  state = act(state, 'OfferTrade', 'a', { targetSeatId: 'b', give: { cash: 0, properties: ['VN-S14'], cards: [] }, receive: { cash: 0, properties: [], cards: [] } }).state;
  state = act(state, 'AcceptTrade', 'b').state; expect(state.phase).toBe('AwaitAcquisition');
  expect(() => act(state, 'ChooseMortgage', 'a', { choice: 'keep' })).toThrow();
  state = act(state, 'ChooseMortgage', 'b', { choice: 'keep' }).state;
  expect(state.seats[1].cash).toBe(1191); expect(state.phase).toBe('AwaitRoll');
  const developed = match(); developed.ownership = { 'VN-S01': 'a', 'VN-S03': 'a' }; developed.buildings['VN-S03'] = 1;
  expect(() => act(developed, 'OfferTrade', 'a', { targetSeatId: 'b', give: { cash: 0, properties: ['VN-S01'], cards: [] }, receive: { cash: 1, properties: [], cards: [] } })).toThrow('Developed');
});

test('AC-31: service rent uses a fresh recorded server roll and counts mortgaged holdings', () => {
  const state = match(); state.seats[0].position = 9; state.ownership = { 'VN-S12': 'b', 'VN-S28': 'b' }; state.mortgages['VN-S28'] = true;
  const result = act(state, 'Roll', 'a', {}, { dice: [1, 2], serviceDice: [3, 4] });
  expect(result.events.find(({ type }) => type === 'RentPaid').amount).toBe(70);
  expect(result.events.find(({ type }) => type === 'ServiceRolled').dice).toEqual([3, 4]);
  state.mortgages['VN-S12'] = true;
  expect(act(state, 'Roll', 'a', {}, { dice: [1, 2] }).events.some(({ type }) => type === 'RentPaid')).toBe(false);
});

test('AC-32: development is even, cannot cross mortgages and conserves physical stock on hotel upgrade', () => {
  let state = match(); state.ownership = { 'VN-S01': 'a', 'VN-S03': 'a' };
  state = act(state, 'Build', 'a', { spaceId: 'VN-S01' }).state;
  expect(() => act(state, 'Build', 'a', { spaceId: 'VN-S01' })).toThrow();
  expect(() => act(state, 'Mortgage', 'a', { spaceId: 'VN-S03' })).toThrow('Sell group');
  state.buildings = { 'VN-S01': 4, 'VN-S03': 4 }; state.stock = { houses: 24, hotels: 12 };
  const hotel = act(state, 'Build', 'a', { spaceId: 'VN-S01' }).state;
  expect(hotel.buildings['VN-S01']).toBe(5); expect(hotel.stock).toEqual({ houses: 28, hotels: 11 });
  const downgraded = act(hotel, 'SellBuilding', 'a', { spaceId: 'VN-S01' }).state;
  expect(downgraded.buildings['VN-S01']).toBe(4); expect(downgraded.stock).toEqual({ houses: 24, hotels: 12 });
});

test('trade acceptance preserves the current phase and either participant can cancel an offer', () => {
  let state = match();
  state = act(state, 'OfferTrade', 'a', { targetSeatId: 'b', give: { cash: 0, properties: [], cards: [] }, receive: { cash: 0, properties: [], cards: [] } }).state;
  state.phase = 'AwaitEnd';
  const accepted = act(state, 'AcceptTrade', 'b'); expect(accepted.state.phase).toBe('AwaitEnd');
  expect(act(state, 'CancelTrade', 'b').state.trade).toBeUndefined();
  expect(() => act(state, 'AcceptTrade', 'c')).toThrow();
});

test('DP-06 tied leaders reroll without changing cyclic lobby order', () => {
  const deckOrders = Object.fromEntries(Object.entries(vnOriginalDecks).map(([id, cards]) => [id, cards.map((card) => card.id)]));
  const setupRolls = [
    [{ seatId: 'a', dice: [1, 1] }, { seatId: 'b', dice: [4, 4] }, { seatId: 'c', dice: [3, 5] }],
    [{ seatId: 'b', dice: [6, 6] }, { seatId: 'c', dice: [1, 1] }],
  ];
  const state = createVnOriginalMatch(['a', 'b', 'c'], { setupRolls, deckOrders });
  expect(state.activeSeatId).toBe('b'); expect(state.setupRolls).toEqual(setupRolls);
  state.phase = 'AwaitEnd'; expect(act(state, 'EndTurn', 'b').state.activeSeatId).toBe('c');
  expect(() => createVnOriginalMatch(['a', 'b', 'c'], { setupRolls: setupRolls.slice(0, 1), deckOrders })).toThrow('tie');
});
