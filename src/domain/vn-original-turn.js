import { chooseFirstSeat } from './setup.js';
import { vnNeighborhoodBoard, vnOriginalDecks, vnOriginalRules, validateVnOriginalContent } from './vn-original-content.js';
import { liquidateHotelGroup, mortgageCharges, validateVnAuctionCommand } from './vn-original-policies.js';

const fail = (message) => { throw new Error(message); };
const amount = (value) => Number.isSafeInteger(value) && value >= 0;
const diceSum = (dice) => {
  if (!Array.isArray(dice) || dice.length !== 2 || !dice.every((die) => Number.isInteger(die) && die >= 1 && die <= 6)) fail('Invalid authoritative dice');
  return dice[0] + dice[1];
};

export function createVnOriginalMatch(seatIds, { setupRolls, deckOrders }) {
  validateVnOriginalContent();
  const { firstSeatId } = chooseFirstSeat(seatIds, setupRolls);
  for (const id of ['chance', 'community']) {
    const expected = vnOriginalDecks[id].map((card) => card.id).sort();
    if (!Array.isArray(deckOrders[id]) || JSON.stringify([...deckOrders[id]].sort()) !== JSON.stringify(expected)) fail('Invalid deck permutation');
  }
  return {
    phase: 'AwaitRoll', activeSeatId: firstSeatId,
    profile: { rules: { id: vnOriginalRules.id, version: 1 }, board: { id: vnNeighborhoodBoard.id, version: 1 } },
    content: structuredClone({ board: vnNeighborhoodBoard, cards: vnOriginalDecks }),
    initialDecks: structuredClone(deckOrders), setupRolls: structuredClone(setupRolls), decks: structuredClone(deckOrders),
    seats: seatIds.map((id) => ({ id, cash: 1200, position: 0, jailed: false, jailAttempts: 0, doubles: 0 })),
    ownership: {}, mortgages: {}, buildings: {}, retainedCards: {}, stock: { houses: 32, hotels: 12 }, queue: [],
  };
}

export function reduceVnOriginalTurn(committed, command, inputs = {}) {
  if (committed.profile?.rules?.id !== 'vn-original-v1' || committed.profile.rules.version !== 1 || committed.profile.board?.id !== 'vn-neighborhood-v1' || committed.profile.board.version !== 1 || committed.content?.board?.version !== 1 || committed.content.board.id !== 'vn-neighborhood-v1') fail('Unsupported pinned profile');
  const s = structuredClone(committed);
  const events = [];
  const physicalStock = (state) => ({
    houses: state.stock.houses + Object.values(state.buildings).reduce((sum, level) => sum + (level === 5 ? 0 : level), 0),
    hotels: state.stock.hotels + Object.values(state.buildings).filter((level) => level === 5).length,
  });
  const beforeStock = physicalStock(s);
  if (s.phase === 'Finished') fail('Match is finished');
  const actor = s.seats.find((seat) => seat.id === command.actorId);
  if (!actor || actor.eliminated) fail('Seat cannot act');
  const spaces = s.content.board.spaces;
  const cardMap = new Map(Object.values(s.content.cards).flat().map((card) => [card.id, card]));
  const seat = (id) => s.seats.find((entry) => entry.id === id && !entry.eliminated);
  const live = () => s.seats.filter((entry) => !entry.eliminated);
  const space = (id) => spaces.find((entry) => entry.id === id) ?? fail('Unknown space');
  const group = (property) => spaces.filter((entry) => entry.type === 'street' && entry.groupId === property.groupId);
  const level = (id) => s.buildings[id] ?? 0;
  const price = (property) => property.economy?.price ?? property.price;
  const principal = (id) => price(space(id)) / 2;
  const ownable = (property) => ['street', 'transit', 'service'].includes(property.type);
  const owned = (id, owner = actor.id) => { const property = space(id); if (!ownable(property) || s.ownership[id] !== owner) fail('Property is not owned by this seat'); return property; };
  const credit = (id, value) => {
    if (!amount(value) || !Number.isSafeInteger(seat(id).cash + value)) fail('Invalid balance');
    seat(id).cash += value;
  };
  const pay = (task) => {
    if (!amount(task.amount)) fail('Invalid payment');
    if (!seat(task.from) || (task.to && !seat(task.to))) return true;
    if (seat(task.from).cash < task.amount) {
      s.phase = 'AwaitDebt'; s.pendingDebt = task; return false;
    }
    seat(task.from).cash -= task.amount;
    if (task.to) credit(task.to, task.amount);
    events.push({ type: task.ledgerType ?? 'PaymentSettled', from: task.from, to: task.to ?? 'bank', amount: task.amount, sourceId: task.sourceId });
    return true;
  };
  const returnCard = (task) => { s.decks[task.deckId].push(task.cardId); events.push({ type: 'CardReturned', cardId: task.cardId, deckId: task.deckId }); };
  const move = (id, steps, award = true) => {
    const player = seat(id);
    const raw = player.position + steps;
    if (award && steps > 0 && raw >= 40) {
      const value = Math.floor(raw / 40) * 160; credit(id, value);
      events.push({ type: 'StartAwarded', seatId: id, amount: value });
    }
    player.position = ((raw % 40) + 40) % 40;
  };
  const jail = (id) => {
    Object.assign(seat(id), { position: 10, jailed: true, jailAttempts: 0, doubles: 0 });
    s.extraRoll = false;
    events.push({ type: 'Jailed', seatId: id });
  };
  const startAuction = (data) => {
    s.auction = { eligibleSeatIds: live().map((entry) => entry.id), highBid: null, ...data };
    s.phase = 'Auction'; events.push({ type: 'AuctionStarted', spaceId: data.spaceId, kind: data.kind });
  };
  const buildTarget = (owner, id, token) => {
    const property = space(id);
    if (property.type !== 'street' || s.ownership[id] !== owner || level(id) >= 5) return false;
    const members = group(property);
    if (members.some((entry) => s.ownership[entry.id] !== owner || s.mortgages[entry.id])) return false;
    const current = level(id);
    if (current > Math.min(...members.map((entry) => level(entry.id)))) return false;
    return token === (current === 4 ? 'hotels' : 'houses');
  };
  const commitBuilding = (owner, id, value) => {
    const token = level(id) === 4 ? 'hotels' : 'houses';
    if (!buildTarget(owner, id, token) || s.stock[token] < 1 || seat(owner).cash < value) fail('Illegal construction');
    seat(owner).cash -= value; s.stock[token] -= 1;
    if (token === 'hotels') s.stock.houses += 4;
    s.buildings[id] = level(id) + 1;
    events.push({ type: 'BuildingBought', seatId: owner, spaceId: id, amount: value });
  };
  const pump = () => {
    s.phase = 'Resolving';
    while (s.queue.length) {
      const task = s.queue.shift();
      if (task.kind === 'returnCard') { returnCard(task); continue; }
      if (task.kind === 'acquisition' && seat(task.seatId)) {
        s.acquisition = task; s.phase = 'AwaitAcquisition'; return;
      }
      if (task.kind === 'bankAuction' && !s.ownership[task.spaceId] && live().length > 1) { startAuction({ kind: 'property', spaceId: task.spaceId }); return; }
      if (live().length === 1 && !(task.kind === 'payment' && task.mandatory) && !['releaseMortgage', 'restoreDebt'].includes(task.kind)) {
        // Mandatory acquisition decisions precede victory; cancel later card work.
        const remaining = s.queue.filter((entry) => entry.kind === 'returnCard');
        for (const entry of remaining) returnCard(entry);
        s.queue = []; s.phase = 'Finished'; s.winnerSeatId = live()[0].id;
        events.push({ type: 'MatchFinished', winnerSeatId: s.winnerSeatId }); return;
      }
      if (task.seatId && !seat(task.seatId)) continue;
      if (task.kind === 'restorePhase') { s.phase = task.phase; return; }
      else if (task.kind === 'restoreDebt') { if (!seat(task.debt.from)) continue; s.pendingDebt = task.debt; s.phase = 'AwaitDebt'; return; }
      else if (task.kind === 'nextTurn') { s.phase = 'AwaitRoll'; return; }
      else if (task.kind === 'payment') { if (!pay(task)) return; }
      else if (task.kind === 'releaseMortgage') delete s.mortgages[task.spaceId];
      else if (task.kind === 'jailRelease') { seat(task.seatId).jailed = false; seat(task.seatId).jailAttempts = 0; }
      else if (task.kind === 'move') { move(task.seatId, task.steps, task.award !== false); s.queue.unshift({ kind: 'landing', seatId: task.seatId }); }
      else if (task.kind === 'finishRoll') { s.phase = s.extraRoll && !seat(task.seatId).jailed ? 'AwaitRoll' : 'AwaitEnd'; return; }
      else if (task.kind === 'landing') {
        const player = seat(task.seatId); const property = spaces[player.position]; const owner = s.ownership[property.id];
        if (ownable(property)) {
          if (!owner) { s.phase = 'AwaitPurchase'; s.purchase = { spaceId: property.id, seatId: player.id }; return; }
          if (owner === player.id || s.mortgages[property.id]) continue;
          let rent;
          if (property.type === 'street') {
            const complete = group(property).every((entry) => s.ownership[entry.id] === owner);
            rent = property.economy.rents[level(property.id) ? level(property.id) + 1 : complete ? 1 : 0];
          } else {
            const count = spaces.filter((entry) => entry.type === property.type && s.ownership[entry.id] === owner).length;
            if (property.type === 'transit') rent = s.content.board.transit.rents[count - 1];
            else { const dice = inputs.rollDice?.() ?? inputs.serviceDice; rent = diceSum(dice) * s.content.board.service.multipliers[count - 1]; events.push({ type: 'ServiceRolled', dice: [...dice], spaceId: property.id }); }
          }
          s.queue.unshift({ kind: 'payment', from: player.id, to: owner, amount: rent, sourceId: property.id, ledgerType: 'RentPaid' });
        } else if (property.type === 'tax') s.queue.unshift({ kind: 'payment', from: player.id, to: null, amount: property.amount, sourceId: property.id });
        else if (property.type === 'go-to-jail') jail(player.id);
        else if (property.type === 'deck') {
          const cardId = s.decks[property.deckId].shift(); if (!cardId) fail('Deck is empty');
          const card = cardMap.get(cardId); events.push({ type: 'CardDrawn', seatId: player.id, cardId });
          const tasks = [];
          if (card.effect === 'retain-release') (s.retainedCards[player.id] ??= []).push(cardId);
          else {
            if (card.effect === 'go-to-jail') jail(player.id);
            else if (card.effect === 'bank-credit') { credit(player.id, card.amount); events.push({ type: 'BankPaid', seatId: player.id, amount: card.amount, cardId }); }
            else if (card.effect === 'bank-debit' || card.effect === 'repairs') {
              const value = card.effect === 'bank-debit' ? card.amount : Object.entries(s.ownership).filter(([, id]) => id === player.id).reduce((sum, [id]) => sum + (level(id) === 5 ? card.hotel : level(id) * card.house), 0);
              tasks.push({ kind: 'payment', from: player.id, to: null, amount: value, sourceId: cardId });
            } else if (['move', 'move-back', 'next-type'].includes(card.effect)) {
              let steps;
              if (card.effect === 'move-back') steps = -card.spaces;
              else if (card.effect === 'move') steps = (card.destination - player.position + 40) % 40 || 40;
              else { steps = 1; while (spaces[(player.position + steps) % 40].type !== card.type) steps += 1; }
              tasks.push({ kind: 'move', seatId: player.id, steps, award: card.effect !== 'move-back' });
            } else if (['pay-each-seat', 'collect-each-seat'].includes(card.effect)) {
              const index = s.seats.indexOf(player);
              const ordered = [...s.seats.slice(index + 1), ...s.seats.slice(0, index)].filter((entry) => !entry.eliminated);
              for (const other of ordered) tasks.push({ kind: 'payment', from: card.effect === 'pay-each-seat' ? player.id : other.id, to: card.effect === 'pay-each-seat' ? other.id : player.id, amount: card.amount, sourceId: cardId });
            } else fail('Unsupported card effect');
            tasks.push({ kind: 'returnCard', cardId, deckId: property.deckId });
            s.queue.unshift(...tasks);
          }
        }
      }
    }
    if (live().length === 1) { s.phase = 'Finished'; s.winnerSeatId = live()[0].id; events.push({ type: 'MatchFinished', winnerSeatId: s.winnerSeatId }); }
    else s.phase = 'AwaitEnd';
  };
  const resume = () => { pump(); };
  const active = () => { if (actor.id !== s.activeSeatId) fail('Only the active seat can act'); };
  const phase = (...allowed) => { if (!allowed.includes(s.phase)) fail('Command is not allowed in this phase'); };
  const economic = () => {
    phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd', 'AwaitDebt', 'AwaitAcquisition');
    if (s.phase === 'AwaitDebt' && s.pendingDebt.from !== actor.id && command.type !== 'AcceptTrade') fail('Only the debtor can liquidate');
    if (s.phase === 'AwaitAcquisition' && s.acquisition.seatId !== actor.id) fail('Only the acquiring seat can act');
  };
  if (s.phase === 'Auction' && !['Bid', 'Pass'].includes(command.type)) fail('Only auction commands are allowed');
  if (s.phase === 'BuildingDemand' && command.type !== 'BuildingDemand') fail('Building demand responses are pending');
  if (s.phase === 'BuildingOffer' && command.type !== 'BuildingOffer') fail('Building offer response is pending');

  switch (command.type) {
    case 'Roll': {
      active(); phase('AwaitRoll'); const dice = inputs.dice ?? inputs.rollDice?.(); const steps = diceSum(dice);
      const doubles = dice[0] === dice[1]; events.push({ type: 'Rolled', seatId: actor.id, dice: [...dice] });
      s.extraRoll = false;
      if (actor.jailed) {
        actor.jailAttempts += 1;
        if (doubles) { actor.jailed = false; actor.jailAttempts = 0; }
        else if (actor.jailAttempts < 3) { s.phase = 'AwaitEnd'; break; }
        else { s.queue.push({ kind: 'payment', from: actor.id, to: null, amount: 50, sourceId: 'jail' }, { kind: 'jailRelease', seatId: actor.id }, { kind: 'move', seatId: actor.id, steps }, { kind: 'finishRoll', seatId: actor.id }); resume(); break; }
      } else {
        actor.doubles = doubles ? actor.doubles + 1 : 0;
        if (actor.doubles === 3) { jail(actor.id); s.phase = 'AwaitEnd'; break; }
        s.extraRoll = doubles;
      }
      move(actor.id, steps); s.queue.push({ kind: 'landing', seatId: actor.id }, { kind: 'finishRoll', seatId: actor.id }); resume(); break;
    }
    case 'PayJail': active(); phase('AwaitRoll'); if (!actor.jailed) fail('Seat is not jailed'); if (actor.cash < 50) fail('Insufficient cash'); actor.cash -= 50; actor.jailed = false; actor.jailAttempts = 0; events.push({ type: 'JailFeePaid', seatId: actor.id, amount: 50 }); break;
    case 'UseReleaseCard': {
      active(); phase('AwaitRoll'); if (!actor.jailed || !['VN-C09', 'VN-M10'].includes(command.cardId) || !s.retainedCards[actor.id]?.includes(command.cardId)) fail('Release card cannot be used');
      s.retainedCards[actor.id] = s.retainedCards[actor.id].filter((id) => id !== command.cardId);
      returnCard({ cardId: command.cardId, deckId: command.cardId === 'VN-C09' ? 'chance' : 'community' }); actor.jailed = false; actor.jailAttempts = 0; break;
    }
    case 'Buy': case 'Decline': {
      active(); phase('AwaitPurchase'); const property = space(s.purchase.spaceId);
      if (command.type === 'Buy') { if (actor.cash < price(property)) fail('Insufficient cash'); actor.cash -= price(property); s.ownership[property.id] = actor.id; delete s.purchase; events.push({ type: 'PropertyBought', from: actor.id, spaceId: property.id, amount: price(property) }); resume(); }
      else { delete s.purchase; startAuction({ kind: 'property', spaceId: property.id }); }
      break;
    }
    case 'Bid': case 'Pass': {
      validateVnAuctionCommand(s, command);
      if (command.type === 'Bid') s.auction.highBid = { seatId: actor.id, amount: command.amount };
      else s.auction.eligibleSeatIds = s.auction.eligibleSeatIds.filter((id) => id !== actor.id);
      events.push({ type: command.type === 'Bid' ? 'AuctionBidAccepted' : 'AuctionPassed', seatId: actor.id, amount: command.amount });
      const auction = s.auction;
      if (auction.eligibleSeatIds.length === 0 || (auction.highBid && auction.eligibleSeatIds.length === 1)) {
        if (auction.highBid) {
          const winner = auction.highBid;
          if (auction.kind === 'building') commitBuilding(winner.seatId, auction.targets[winner.seatId], winner.amount);
          else { seat(winner.seatId).cash -= winner.amount; s.ownership[auction.spaceId] = winner.seatId; }
          events.push({ type: 'AuctionSettled', from: winner.seatId, spaceId: auction.spaceId, amount: winner.amount });
        } else events.push({ type: 'AuctionEndedWithoutBid', spaceId: auction.spaceId });
        delete s.auction;
        if (auction.resumePhase) s.phase = auction.resumePhase; else resume();
      }
      break;
    }
    case 'EndTurn': {
      active(); phase('AwaitEnd'); actor.doubles = 0;
      const index = s.seats.indexOf(actor); const ordered = [...s.seats.slice(index + 1), ...s.seats.slice(0, index + 1)];
      s.activeSeatId = ordered.find((entry) => !entry.eliminated).id; s.phase = 'AwaitRoll'; break;
    }
    case 'SettleDebt': {
      phase('AwaitDebt'); if (s.pendingDebt.from !== actor.id) fail('Only the debtor can settle');
      if (!pay(s.pendingDebt)) fail('Debt is not affordable'); delete s.pendingDebt; resume(); break;
    }
    case 'Mortgage': case 'ReleaseMortgage': {
      economic();
      if (command.type === 'ReleaseMortgage') phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd');
      const property = owned(command.spaceId);
      if (property.type === 'street' && group(property).some((entry) => level(entry.id) > 0)) fail('Sell group buildings before mortgaging');
      if (command.type === 'Mortgage') {
        if (s.mortgages[property.id]) fail('Property is already mortgaged'); s.mortgages[property.id] = true; credit(actor.id, principal(property.id));
        events.push({ type: 'PropertyMortgaged', seatId: actor.id, spaceId: property.id, amount: principal(property.id) });
      } else {
        if (!s.mortgages[property.id]) fail('Property is not mortgaged'); const cost = mortgageCharges(principal(property.id)).releaseTotal;
        if (actor.cash < cost) fail('Insufficient cash'); actor.cash -= cost; delete s.mortgages[property.id]; events.push({ type: 'MortgageReleased', seatId: actor.id, spaceId: property.id, amount: cost });
      } break;
    }
    case 'ChooseMortgage': {
      phase('AwaitAcquisition'); if (s.acquisition.seatId !== actor.id || !['keep', 'release'].includes(command.choice)) fail('Invalid acquisition choice');
      const id = s.acquisition.spaceId; const charges = mortgageCharges(principal(id));
      s.queue.unshift(...(command.choice === 'release' ? [{ kind: 'releaseMortgage', spaceId: id }] : []));
      s.queue.unshift({ kind: 'payment', from: actor.id, to: null, amount: command.choice === 'keep' ? charges.immediateInterest : charges.releaseTotal, sourceId: id, mandatory: true });
      delete s.acquisition; resume(); break;
    }
    case 'SellBuilding': {
      economic(); const property = owned(command.spaceId); if (property.type !== 'street' || !level(property.id)) fail('No building to sell');
      if (level(property.id) < Math.max(...group(property).map((entry) => level(entry.id)))) fail('Buildings must be sold evenly');
      if (level(property.id) === 5) { if (s.stock.houses < 4) fail('Use group hotel liquidation during a shortage'); s.stock.hotels += 1; s.stock.houses -= 4; }
      else s.stock.houses += 1;
      s.buildings[property.id] = level(property.id) - 1; credit(actor.id, property.economy.buildingCost / 2);
      events.push({ type: 'BuildingSold', seatId: actor.id, spaceId: property.id, amount: property.economy.buildingCost / 2 }); break;
    }
    case 'LiquidateHotels': {
      economic(); const members = spaces.filter((entry) => entry.type === 'street' && entry.groupId === command.groupId);
      if (members.length < 2 || members.some((entry) => s.ownership[entry.id] !== actor.id) || s.stock.houses >= 4) fail('Group shortage liquidation is unavailable');
      const result = liquidateHotelGroup({ streets: members.map((entry) => ({ id: entry.id, houses: level(entry.id) === 5 ? 0 : level(entry.id), hotels: level(entry.id) === 5 ? 1 : 0 })), bankHouses: s.stock.houses, bankHotels: s.stock.hotels, constructionCosts: new Map(members.map((entry) => [entry.id, entry.economy.buildingCost])), proposedFinalCounts: command.finalCounts });
      for (const entry of result.streets) s.buildings[entry.id] = entry.houses;
      s.stock.houses = result.bankHouses; s.stock.hotels = result.bankHotels; credit(actor.id, result.refund);
      events.push({ type: 'HotelsLiquidated', seatId: actor.id, groupId: command.groupId, amount: result.refund }); break;
    }
    case 'Build': {
      economic(); phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd'); const property = owned(command.spaceId); const token = level(property.id) === 4 ? 'hotels' : 'houses';
      if (!buildTarget(actor.id, property.id, token) || s.stock[token] < 1) fail('Illegal construction');
      if (s.stock[token] > 1) commitBuilding(actor.id, property.id, property.economy.buildingCost);
      else {
        const eligible = live().filter((entry) => entry.cash >= 10 && spaces.some((target) => buildTarget(entry.id, target.id, token))).map((entry) => entry.id);
        if (!eligible.includes(actor.id)) fail('Insufficient cash for building demand');
        s.buildingDemand = { token, eligibleSeatIds: eligible, responses: { [actor.id]: property.id }, resumePhase: s.phase };
        s.phase = 'BuildingDemand'; resolveDemand();
      } break;
    }
    case 'BuildingDemand': {
      phase('BuildingDemand'); const demand = s.buildingDemand;
      if (!demand.eligibleSeatIds.includes(actor.id) || Object.hasOwn(demand.responses, actor.id)) fail('Demand response is unavailable');
      if (command.spaceId !== null && !buildTarget(actor.id, command.spaceId, demand.token)) fail('Illegal demand target');
      demand.responses[actor.id] = command.spaceId; resolveDemand(); break;
    }
    case 'BuildingOffer': {
      phase('BuildingOffer'); const demand = s.buildingDemand; if (demand.offeredSeatId !== actor.id || typeof command.accept !== 'boolean') fail('Invalid building offer response');
      const id = demand.responses[actor.id]; const cost = space(id).economy.buildingCost;
      if (command.accept && actor.cash >= cost) commitBuilding(actor.id, id, cost);
      s.phase = demand.resumePhase; delete s.buildingDemand; break;
    }
    case 'OfferTrade': {
      if (s.trade) fail('Resolve or cancel the existing trade offer first');
      economic(); phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd', 'AwaitDebt');
      if (!seat(command.targetSeatId) || command.targetSeatId === actor.id) fail('Invalid trade target');
      const validateSide = (side, owner) => {
        if (!side || !amount(side.cash) || !Array.isArray(side.properties) || !Array.isArray(side.cards) || new Set(side.properties).size !== side.properties.length || new Set(side.cards).size !== side.cards.length) fail('Invalid trade terms');
        if (seat(owner).cash < side.cash) fail('Trade cash is unavailable');
        for (const id of side.properties) { const property = owned(id, owner); if (property.type === 'street' && group(property).some((entry) => level(entry.id))) fail('Developed groups cannot be traded'); }
        if (side.cards.some((id) => !s.retainedCards[owner]?.includes(id))) fail('Trade card is unavailable');
      };
      validateSide(command.give, actor.id); validateSide(command.receive, command.targetSeatId);
      s.trade = { proposerSeatId: actor.id, targetSeatId: command.targetSeatId, give: command.give, receive: command.receive, resumePhase: s.phase };
      events.push({ type: 'TradeOffered', from: actor.id, to: command.targetSeatId }); break;
    }
    case 'CancelTrade': {
      phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd', 'AwaitDebt');
      if (!s.trade || ![s.trade.proposerSeatId, s.trade.targetSeatId].includes(actor.id)) fail('Trade cannot be canceled by this seat');
      delete s.trade; events.push({ type: 'TradeCanceled', seatId: actor.id }); break;
    }
    case 'AcceptTrade': {
      economic(); phase('AwaitRoll', 'AwaitPurchase', 'AwaitEnd', 'AwaitDebt');
      const resumePhase = s.phase; const trade = s.trade; if (!trade || trade.targetSeatId !== actor.id) fail('No trade offered to this seat');
      const acquisitions = [];
      for (const [from, to, side] of [[trade.proposerSeatId, trade.targetSeatId, trade.give], [trade.targetSeatId, trade.proposerSeatId, trade.receive]]) {
        if (!seat(from) || seat(from).cash < side.cash) fail('Trade terms are no longer available');
        for (const id of side.properties) { const property = owned(id, from); if (property.type === 'street' && group(property).some((entry) => level(entry.id))) fail('Trade terms are no longer available'); }
        for (const id of side.cards) if (!s.retainedCards[from]?.includes(id)) fail('Trade card is no longer available');
        seat(from).cash -= side.cash; credit(to, side.cash);
        for (const id of side.properties) { s.ownership[id] = to; if (s.mortgages[id]) acquisitions.push({ kind: 'acquisition', seatId: to, spaceId: id }); }
        for (const id of side.cards) { s.retainedCards[from] = s.retainedCards[from].filter((cardId) => cardId !== id); (s.retainedCards[to] ??= []).push(id); }
      }
      delete s.trade;
      const debt = s.pendingDebt; delete s.pendingDebt;
      s.queue.unshift(...acquisitions, debt ? { kind: 'restoreDebt', debt } : { kind: 'restorePhase', phase: resumePhase });
      resume(); events.push({ type: 'TradeSettled', from: trade.proposerSeatId, to: trade.targetSeatId }); break;
    }
    case 'Bankrupt': {
      phase('AwaitDebt'); const debt = s.pendingDebt; if (debt.from !== actor.id || actor.cash >= debt.amount) fail('Bankruptcy is unavailable');
      const holdings = Object.keys(s.ownership).filter((id) => s.ownership[id] === actor.id);
      if (holdings.some((id) => level(id))) fail('Sell buildings before bankruptcy');
      const potential = actor.cash + holdings.filter((id) => !s.mortgages[id]).reduce((sum, id) => sum + principal(id), 0);
      if (potential >= debt.amount) fail('Lawful liquidation can still cover the debt');
      const creditor = debt.to ? seat(debt.to) : null;
      if (creditor) credit(creditor.id, actor.cash);
      events.push({ type: 'BankruptcyCashTransferred', from: actor.id, to: creditor?.id ?? 'bank', amount: actor.cash });
      actor.cash = 0; actor.eliminated = true;
      const acquisitions = [];
      for (const id of holdings) {
        if (creditor) { s.ownership[id] = creditor.id; if (s.mortgages[id]) acquisitions.push({ kind: 'acquisition', seatId: creditor.id, spaceId: id }); }
        else { delete s.ownership[id]; delete s.mortgages[id]; acquisitions.push({ kind: 'bankAuction', spaceId: id }); }
      }
      for (const id of s.retainedCards[actor.id] ?? []) {
        if (creditor) (s.retainedCards[creditor.id] ??= []).push(id);
        else returnCard({ cardId: id, deckId: id === 'VN-C09' ? 'chance' : 'community' });
      }
      delete s.retainedCards[actor.id]; delete s.pendingDebt; delete s.trade;
      s.queue = s.queue.filter((task) => task.from !== actor.id && task.to !== actor.id && task.seatId !== actor.id);
      s.queue.unshift(...acquisitions);
      if (s.activeSeatId === actor.id) { const index = s.seats.indexOf(actor); s.activeSeatId = [...s.seats.slice(index + 1), ...s.seats.slice(0, index)].find((entry) => !entry.eliminated).id; s.queue.push({ kind: 'nextTurn' }); }
      events.push({ type: 'SeatBankrupted', seatId: actor.id, creditorSeatId: debt.to }); resume(); break;
    }
    default: fail('Unsupported full-match command');
  }
  if (JSON.stringify(beforeStock) !== JSON.stringify(physicalStock(s))) fail('Building token conservation violated');
  if (s.seats.some((entry) => !amount(entry.cash)) || !amount(s.stock.houses) || !amount(s.stock.hotels) || s.stock.houses > 32 || s.stock.hotels > 12) fail('State violates cash or building stock limits');
  if (Object.entries(s.buildings).some(([id, value]) => !Number.isInteger(value) || value < 0 || value > 5 || space(id).type !== 'street' || !s.ownership[id])) fail('Invalid street development');
  if (Object.entries(s.ownership).some(([id, owner]) => !ownable(space(id)) || !seat(owner))) fail('Invalid property ownership');
  return { state: s, events };

  function resolveDemand() {
    const demand = s.buildingDemand;
    if (demand.eligibleSeatIds.some((id) => !Object.hasOwn(demand.responses, id))) return;
    const targets = Object.fromEntries(Object.entries(demand.responses).filter(([, id]) => id !== null));
    if (Object.keys(targets).length > 1) {
      delete s.buildingDemand; startAuction({ kind: 'building', targets, eligibleSeatIds: Object.keys(targets), resumePhase: demand.resumePhase });
    } else if (Object.keys(targets).length === 1) { demand.offeredSeatId = Object.keys(targets)[0]; s.phase = 'BuildingOffer'; }
    else { s.phase = demand.resumePhase; delete s.buildingDemand; }
  }
}
