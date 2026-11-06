import { money, cardCopy } from './local-vi.js';

export function node(tag, text, className) {
  const result = document.createElement(tag);
  if (text != null) result.textContent = text;
  if (className) result.className = className;
  return result;
}
export function button(type, text, callback, allowed = true) {
  const result = node('button', text); result.type = 'button'; result.dataset.command = type;
  result.dataset.allowed = String(allowed); result.disabled = !allowed; result.addEventListener('click', callback);
  return result;
}
const wrap = (text, input) => { const label = node('label', text); label.append(input); return label; };
const options = (entries, id, multiple = false) => {
  const select = node('select'); select.id = id; select.multiple = multiple;
  if (multiple) select.size = Math.min(4, Math.max(2, entries.length));
  for (const [value, label] of entries) { const option = node('option', label); option.value = value; select.append(option); }
  return select;
};
const numeric = (id, max, value = 0, min = 0) => {
  const input = node('input'); Object.assign(input, { id, type: 'number', min, max, step: 1, required: true, value, inputMode: 'numeric' }); return input;
};
const selected = (select) => [...select.selectedOptions].map(({ value }) => value);

// Availability is presentation only; the server validates every selected intent.
export function propertyOptions(turn, board, actorId) {
  const level = (id) => turn.buildings[id] ?? 0;
  const members = (space) => board.spaces.filter((entry) => entry.type === 'street' && entry.groupId === space.groupId);
  return board.spaces.filter((space) => turn.ownership[space.id] === actorId).map((space) => {
    const group = space.type === 'street' ? members(space) : [];
    const levels = group.map((entry) => level(entry.id));
    const developed = levels.some((value) => value > 0);
    const full = group.length > 0 && group.every((entry) => turn.ownership[entry.id] === actorId && !turn.mortgages[entry.id]);
    return {
      space, level: level(space.id), group, developed,
      canMortgage: !developed && !turn.mortgages[space.id],
      canBuild: full && level(space.id) < 5 && level(space.id) === Math.min(...levels) && turn.stock[level(space.id) === 4 ? 'hotels' : 'houses'] > 0,
      canSell: space.type === 'street' && level(space.id) > 0 && level(space.id) === Math.max(...levels) && (level(space.id) !== 5 || turn.stock.houses >= 4),
    };
  });
}

export function decisionControls({ state, board, actorId, submit, selectActor }) {
  const { turn } = state; const phase = turn.phase; const actor = turn.seats.find(({ id }) => id === actorId);
  const title = (id) => { const space = board.spaces.find((entry) => entry.id === id); return board.copy[space?.labelKey] ?? id; };
  const person = (id) => state.seats.find((entry) => entry.id === id)?.name ?? 'Ngân hàng';
  const act = (type, label, payload = {}, allowed = true) => button(type, label, () => submit(type, payload), allowed);
  const root = node('div'); root.className = 'local-decisions';
  if (!actor || actor.eliminated || phase === 'Finished') return root;
  const assets = propertyOptions(turn, board, actorId);
  const normal = ['AwaitRoll', 'AwaitEnd', 'AwaitPurchase'].includes(phase);
  const debtor = phase === 'AwaitDebt' && turn.pendingDebt.from === actorId;
  const acquiring = phase === 'AwaitAcquisition' && turn.acquisition.seatId === actorId;
  if (phase === 'AwaitRoll' && actorId === turn.activeSeatId) {
    if (actor.jailed) {
      root.append(node('p', `Đang ở nhà chờ. Đã thử ${actor.jailAttempts}/3 lần. Có thể trả phí, dùng giấy ra hoặc thử gieo đôi.`));
      root.append(act('PayJail', `Trả ${money(50)} để ra trước khi gieo`, {}, actor.cash >= 50));
      for (const cardId of turn.retainedCards[actorId] ?? []) root.append(act('UseReleaseCard', `Dùng giấy ra · ${cardCopy[cardId]}`, { cardId }));
    }
    root.append(act('Roll', actor.jailed ? 'Thử gieo đôi' : 'Gieo xúc xắc'));
  }
  if (phase === 'AwaitEnd' && actorId === turn.activeSeatId) root.append(act('EndTurn', 'Kết thúc lượt'));
  if (phase === 'AwaitPurchase' && actorId === turn.activeSeatId) {
    const space = board.spaces[actor.position]; const cost = space.economy?.price ?? space.price;
    root.append(node('p', `${title(space.id)} · Giá ${money(cost)}. Từ chối sẽ mở đấu giá cho mọi người.`));
    root.append(act('Buy', `Mua với ${money(cost)}`, {}, actor.cash >= cost), act('Decline', 'Từ chối và mở đấu giá'));
  }
  if (debtor) {
    const debt = turn.pendingDebt;
    const potential = actor.cash + assets.filter(({ canMortgage }) => canMortgage).reduce((sum, { space }) => sum + (space.economy?.price ?? space.price) / 2, 0);
    root.append(node('p', `Cần trả ${money(debt.amount)} cho ${person(debt.to)}. Có thể bán công trình, thế chấp hoặc thương lượng giao dịch để đủ tiền.`));
    root.append(act('SettleDebt', `Thanh toán ${money(debt.amount)}`, {}, actor.cash >= debt.amount));
    const noBuildings = assets.every(({ level }) => level === 0);
    const bankrupt = noBuildings && potential < debt.amount;
    root.append(act('Bankrupt', 'Xác nhận phá sản và chuyển tài sản', {}, bankrupt));
    if (!bankrupt) root.append(node('p', 'Chỉ có thể phá sản sau khi bán hết công trình và không còn đủ khả năng trả nợ bằng thế chấp.', 'local-note'));
  }
  if (acquiring) {
    const id = turn.acquisition.spaceId; const space = board.spaces.find((entry) => entry.id === id);
    const principal = (space.economy?.price ?? space.price) / 2; const interest = Math.ceil(principal / 10);
    root.append(node('p', `${title(id)} đang thế chấp. Giữ thế chấp trả ngay ${money(interest)}; giải chấp ngay trả ${money(principal + interest)}. Nếu thiếu tiền, khoản phải trả sẽ chờ giải quyết nợ.`));
    root.append(act('ChooseMortgage', `Giữ thế chấp · trả ${money(interest)}`, { choice: 'keep' }), act('ChooseMortgage', `Giải chấp · trả ${money(principal + interest)}`, { choice: 'release' }));
  }
  if (phase === 'Auction' && turn.auction.eligibleSeatIds.includes(actorId)) {
    const { highBid } = turn.auction; const min = (highBid?.amount ?? 9) + 1;
    root.append(node('p', highBid ? `${person(highBid.seatId)} dẫn đầu với ${money(highBid.amount)}.` : 'Giá mở đầu 10 xu. Bỏ lượt là quyết định cuối cho cuộc đấu giá này.'));
    if (actor.cash >= min) {
      const form = node('form'); const input = numeric('local-bid', actor.cash, min, min);
      const send = node('button', 'Đặt giá'); send.dataset.command = 'Bid';
      form.append(wrap('Giá đặt (xu)', input), send);
      form.addEventListener('submit', (event) => { event.preventDefault(); submit('Bid', { amount: input.valueAsNumber }); }); root.append(form);
    }
    root.append(act('Pass', 'Bỏ lượt đấu giá', {}, highBid?.seatId !== actorId));
  }
  if (phase === 'BuildingDemand' && turn.buildingDemand.eligibleSeatIds.includes(actorId) && !Object.hasOwn(turn.buildingDemand.responses, actorId)) {
    const targets = assets.filter(({ canBuild, level }) => canBuild && turn.buildingDemand.token === (level === 4 ? 'hotels' : 'houses'));
    const select = options(targets.map(({ space }) => [space.id, title(space.id)]), 'demand-target');
    root.append(wrap('Muốn xây công trình cuối ở đâu?', select), button('BuildingDemand', 'Đăng ký xây tại ô đã chọn', () => submit('BuildingDemand', { spaceId: select.value }), targets.length > 0), act('BuildingDemand', 'Không đăng ký công trình cuối', { spaceId: null }));
  }
  if (phase === 'BuildingOffer' && turn.buildingDemand.offeredSeatId === actorId) {
    const id = turn.buildingDemand.responses[actorId]; const cost = board.spaces.find((entry) => entry.id === id).economy.buildingCost;
    root.append(node('p', `Bạn là người đăng ký còn lại. Xây tại ${title(id)} với ${money(cost)}?`), act('BuildingOffer', `Đồng ý xây · ${money(cost)}`, { accept: true }, actor.cash >= cost), act('BuildingOffer', 'Không xây, trả công trình về ngân hàng', { accept: false }));
  }
  if (normal || debtor || acquiring) {
    if (assets.length) root.append(assetControls());
    const groups = [...new Set(assets.filter(({ level }) => level === 5).map(({ space }) => space.groupId))];
    for (const id of groups) if (turn.stock.houses < 4) root.append(liquidationControls(id));
  }
  if (normal || debtor || (phase === 'AwaitDebt' && turn.trade?.targetSeatId === actorId)) {
    if (turn.trade) {
      const trade = turn.trade; const box = node('section');
      box.append(node('h3', 'Giao dịch đang chờ'), node('p', `${person(trade.proposerSeatId)} đề nghị với ${person(trade.targetSeatId)}.`));
      const terms = (side) => [money(side.cash), ...side.properties.map(title), ...side.cards.map((id) => cardCopy[id])].join(' · ');
      box.append(node('p', `${person(trade.proposerSeatId)} đưa: ${terms(trade.give)}`), node('p', `${person(trade.targetSeatId)} đưa: ${terms(trade.receive)}`));
      if (actorId === trade.targetSeatId) box.append(act('AcceptTrade', 'Đồng ý chuyển tiền và tài sản'));
      else box.append(button('TradeHandoff', `Chuyền máy cho ${person(trade.targetSeatId)} xem đề nghị`, () => selectActor(trade.targetSeatId)));
      if ([trade.proposerSeatId, trade.targetSeatId].includes(actorId)) box.append(act('CancelTrade', 'Hủy đề nghị giao dịch'));
      root.append(box);
    } else root.append(tradeControls());
  }
  return root;

  function assetControls() {
    const details = node('details'); details.id = 'asset-details'; details.append(node('summary', 'Quản lý tài sản của người đang cầm máy'));
    const select = options(assets.map(({ space }) => [space.id, title(space.id)]), 'asset-space');
    const info = node('p'); const actions = node('div'); actions.className = 'buttons';
    const update = () => {
      const item = assets.find(({ space }) => space.id === select.value); const { space, level } = item;
      const p = (space.economy?.price ?? space.price) / 2; const release = p + Math.ceil(p / 10); const buildCost = space.economy?.buildingCost;
      info.textContent = `Thế chấp nhận ${money(p)}; giải chấp trả ${money(release)}.${space.type === 'street' ? ` Mỗi lần xây ${money(buildCost)}; bán mỗi công trình nhận ${money(buildCost / 2)}. Hiện có ${level === 5 ? '1 khách sạn' : level + ' nhà'}.` : ''}`;
      actions.replaceChildren(act('Mortgage', `Thế chấp · nhận ${money(p)}`, { spaceId: space.id }, item.canMortgage));
      if (turn.mortgages[space.id]) actions.append(act('ReleaseMortgage', `Giải chấp · trả ${money(release)}`, { spaceId: space.id }, normal && actor.cash >= release));
      if (space.type === 'street') {
        actions.append(act('Build', `Xây ${level === 4 ? 'khách sạn' : 'nhà'} · ${money(buildCost)}`, { spaceId: space.id }, normal && item.canBuild && actor.cash >= (turn.stock[level === 4 ? 'hotels' : 'houses'] === 1 ? 10 : buildCost)), act('SellBuilding', `Bán một công trình · nhận ${money(buildCost / 2)}`, { spaceId: space.id }, item.canSell));
      }
    };
    select.addEventListener('change', update); update(); details.append(wrap('Tài sản', select), info, actions); return details;
  }
  function liquidationControls(groupId) {
    const details = node('details'); details.append(node('summary', `Bán khách sạn nhóm ${groupId} khi thiếu nhà`));
    const members = board.spaces.filter((space) => space.type === 'street' && space.groupId === groupId);
    if (members.some((space) => turn.ownership[space.id] !== actorId)) return details;
    const houses = members.reduce((sum, space) => sum + ((turn.buildings[space.id] ?? 0) === 5 ? 0 : (turn.buildings[space.id] ?? 0)), 0);
    const total = Math.min(houses + turn.stock.houses, 4 * members.length); const low = Math.floor(total / members.length); const highCount = total % members.length;
    const form = node('form'); const inputs = members.map((space, index) => numeric(`liquidate-${space.id}`, 4, low + (index < highCount ? 1 : 0)));
    form.append(node('p', `Phải giữ tổng cộng ${total} nhà, chia đều (chênh lệch tối đa 1). Tất cả khách sạn trong nhóm sẽ trả về ngân hàng.`));
    members.forEach((space, index) => form.append(wrap(`${title(space.id)} · số nhà giữ lại`, inputs[index])));
    const send = node('button', 'Xác nhận bán khách sạn cả nhóm'); send.dataset.command = 'LiquidateHotels'; form.append(send);
    form.addEventListener('submit', (event) => { event.preventDefault(); submit('LiquidateHotels', { groupId, finalCounts: inputs.map((input) => input.valueAsNumber) }); }); details.append(form); return details;
  }
  function tradeControls() {
    const details = node('details'); details.id = 'trade-details'; details.append(node('summary', 'Đề nghị giao dịch tiền, tài sản hoặc giấy ra'));
    const others = turn.seats.filter((entry) => !entry.eliminated && entry.id !== actorId);
    const target = options(others.map(({ id }) => [id, person(id)]), 'trade-target'); const sides = node('div'); const form = node('form'); let readSides;
    const update = () => {
      sides.replaceChildren(); const targetPlayer = turn.seats.find(({ id }) => id === target.value);
      const side = (id, name, cash) => {
        const field = node('fieldset'); field.append(node('legend', name));
        const input = numeric(`trade-cash-${id}`, cash);
        const properties = options(propertyOptions(turn, board, id).filter(({ developed }) => !developed).map(({ space }) => [space.id, `${title(space.id)}${turn.mortgages[space.id] ? ' · đang thế chấp' : ''}`]), `trade-properties-${id}`, true);
        const cards = options((turn.retainedCards[id] ?? []).map((id) => [id, cardCopy[id]]), `trade-cards-${id}`, true);
        field.append(wrap('Tiền (xu)', input), wrap('Tài sản đưa đi · có thể chọn nhiều', properties), wrap('Giấy ra đưa đi', cards)); sides.append(field);
        return () => ({ cash: input.valueAsNumber, properties: selected(properties), cards: selected(cards) });
      };
      const give = side(actorId, `${person(actorId)} đưa`, actor.cash); const receive = side(target.value, `${person(target.value)} đưa`, targetPlayer.cash);
      readSides = () => ({ give: give(), receive: receive() });
    };
    target.addEventListener('change', update); update(); const send = node('button', 'Gửi đề nghị để người kia xác nhận'); send.dataset.command = 'OfferTrade';
    form.append(wrap('Giao dịch với', target), sides, node('p', 'Người nhận phải xác nhận. Tài sản thế chấp tạo thêm khoản lãi phải trả cho chủ mới.', 'local-note'), send);
    form.addEventListener('submit', (event) => { event.preventDefault(); submit('OfferTrade', { targetSeatId: target.value, ...readSides() }); }); details.append(form); return details;
  }
}
