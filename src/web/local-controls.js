import { money, cardCopy, recoveryCopy } from './local-vi.js';

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
export const auctionMinimum = ({ highBid }) => (highBid?.amount ?? 9) + 1;

function facts(entries) {
  const list = node('dl', '', 'local-decision-facts');
  for (const [label, value] of entries) {
    const row = node('div');
    row.append(node('dt', label), node('dd', value));
    list.append(row);
  }
  return list;
}

function mortgageAmounts(space) {
  const principal = (space.economy?.price ?? space.price) / 2;
  const interest = Math.ceil(principal / 10);
  return { principal, interest, release: principal + interest };
}

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

export function decisionControls({ state, board, actorId, submit, selectActor, inspectSpace, purchaseActions, portfolioSelection }) {
  const { turn } = state; const phase = turn.phase; const actor = turn.seats.find(({ id }) => id === actorId);
  const title = (id) => { const space = board.spaces.find((entry) => entry.id === id); return board.copy[space?.labelKey] ?? id; };
  const person = (id) => state.seats.find((entry) => entry.id === id)?.name ?? 'Ngân hàng';
  const property = (id) => board.spaces.find((entry) => entry.id === id);
  const stock = () => `${turn.stock.houses} nhà · ${turn.stock.hotels} khách sạn`;
  const buildings = (id) => {
    const level = turn.buildings[id] ?? 0;
    return level === 5 ? '1 khách sạn' : `${level} nhà`;
  };
  const mortgageState = (id) => turn.mortgages[id] ? 'Đang thế chấp · không thu tiền thuê' : 'Chưa thế chấp';
  const balance = (delta) => money(actor.cash + delta);
  const act = (type, label, payload = {}, allowed = true) => button(type, label, () => submit(type, payload), allowed);
  const root = node('div'); root.className = 'local-decisions';
  if (!actor || actor.eliminated || phase === 'Finished') return root;
  const assets = propertyOptions(turn, board, actorId);
  const normal = ['AwaitRoll', 'AwaitEnd', 'AwaitPurchase'].includes(phase);
  const debtor = phase === 'AwaitDebt' && turn.pendingDebt.from === actorId;
  const acquiring = phase === 'AwaitAcquisition' && turn.acquisition.seatId === actorId;
  const recovery = (heading, kind = '') => {
    const panel = node('section', '', `local-decision-step ${kind}`.trim());
    panel.append(node('h3', heading));
    return panel;
  };
  let bankruptcy;
  if (phase === 'AwaitRoll' && actorId === turn.activeSeatId) {
    if (actor.jailed) {
      const jail = recovery(`${person(actorId)} đang bị giữ ở nhà chờ`);
      const cards = turn.retainedCards[actorId] ?? [];
      jail.append(facts([
        ['Lần thử còn lại', `${3 - actor.jailAttempts}/3`],
        [recoveryCopy.cash, money(actor.cash)], ['Giấy ra đang giữ', String(cards.length)],
        ['Sau khi trả phí', actor.cash >= 50 ? balance(-50) : 'Không đủ tiền trả phí'],
      ]));
      jail.append(act('PayJail', `Trả ${money(50)} để ra trước khi gieo`, {}, actor.cash >= 50));
      if (cards.length) jail.append(node('p', 'Dùng một giấy ra để ra trước khi gieo. Giấy đã dùng trở về bộ thẻ.'));
      for (const cardId of cards) jail.append(act('UseReleaseCard', `Dùng giấy ra · ${cardCopy[cardId]}`, { cardId }));
      jail.append(node('p', actor.jailAttempts === 2
        ? `Gieo đôi để ra và đi theo số vừa gieo. Nếu lần cuối không ra đôi, phải trả ${money(50)} trước khi đi theo số đó. Nếu thiếu, cần giải quyết khoản nợ trước.`
        : 'Gieo đôi để ra và đi theo số vừa gieo. Nếu không ra đôi, vẫn ở nhà chờ và lượt kết thúc.'));
      jail.append(act('Roll', 'Thử gieo đôi'));
      root.append(jail);
    } else root.append(act('Roll', 'Gieo xúc xắc'));
  }
  if (phase === 'AwaitEnd' && actorId === turn.activeSeatId) root.append(act('EndTurn', 'Kết thúc lượt'));
  if (phase === 'AwaitPurchase' && actorId === turn.activeSeatId) {
    const space = board.spaces[actor.position];
    const price = space.economy?.price ?? space.price;
    const affordable = actor.cash >= price;
    const deed = node('div', '', 'local-deed');
    const art = node('div', '', 'local-deed-art');
    art.setAttribute('aria-hidden', 'true');
    art.append(node('span'), node('span'), node('span'));
    const terms = node('dl');
    const rent = space.economy ? money(space.economy.rents[0])
      : space.type === 'transit' ? money(board.transit.rents[0])
      : `${board.service.multipliers[0]} lần tổng một lần gieo riêng`;
    const facts = [
      ['Giá mua', money(price)], ['Tiền đang có', money(actor.cash)],
      ['Còn lại nếu mua', affordable ? money(actor.cash - price) : 'Không đủ tiền'],
      ['Tiền thuê cơ bản', rent],
    ];
    for (const [label, value] of facts) {
      const row = node('div'); row.append(node('dt', label), node('dd', value)); terms.append(row);
    }
    const decline = act('Decline', 'Từ chối và mở đấu giá');
    decline.className = 'secondary';
    purchaseActions.append(act('Buy', `Mua với ${money(price)}`, {}, affordable), decline);
    const inspect = node('button', 'Xem đầy đủ khu đất', 'secondary');
    inspect.type = 'button';
    inspect.addEventListener('click', () => inspectSpace(space.id, inspect));
    const group = space.type === 'street' ? `Nhóm ${space.groupId}` : space.type === 'transit' ? 'Bến xe' : 'Dịch vụ';
    deed.append(art, node('h3', title(space.id)), node('p', group, 'local-note'), terms, inspect);
    root.append(deed);
  }
  if (debtor) {
    const debt = turn.pendingDebt;
    const potential = actor.cash + assets.filter(({ canMortgage }) => canMortgage).reduce((sum, { space }) => sum + mortgageAmounts(space).principal, 0);
    const settlement = recovery('Thanh toán khoản nợ', 'local-debt-step');
    const shortfall = Math.max(0, debt.amount - actor.cash);
    settlement.append(facts([
      ['Người trả', person(actorId)], ['Người nhận', person(debt.to)],
      ['Phải trả', money(debt.amount)], [recoveryCopy.cash, money(actor.cash)], ['Còn thiếu', money(shortfall)],
      ...(!shortfall ? [['Sau khi trả', balance(-debt.amount)]] : []),
    ]));
    if (shortfall) settlement.append(node('p', 'Có thể bán công trình, thế chấp tài sản đủ điều kiện hoặc đề nghị giao dịch để có thêm tiền.', 'local-note'));
    settlement.append(act('SettleDebt', `Thanh toán ${money(debt.amount)} cho ${person(debt.to)}`, {}, !shortfall));
    root.append(settlement);
    const noBuildings = assets.every(({ level }) => level === 0);
    const bankrupt = noBuildings && potential < debt.amount;
    bankruptcy = recovery('Phá sản', 'local-debt-step');
    const held = turn.retainedCards[actorId]?.length ?? 0;
    const mortgaged = assets.filter(({ space }) => turn.mortgages[space.id]);
    bankruptcy.append(node('p', `${person(actorId)} rời ván. ${person(debt.to)} nhận ${money(actor.cash)}.`));
    if (assets.length) {
      const names = assets.map(({ space }) => title(space.id)).join(', ');
      bankruptcy.append(node('p', debt.to ? `Tài sản chuyển cho ${person(debt.to)}: ${names}.`
        : `Tài sản trả về ngân hàng: ${names}.${turn.seats.filter((seat) => !seat.eliminated).length > 2 ? ' Nếu ván tiếp tục, các tài sản sẽ được đấu giá.' : ''}`));
    }
    if (held) bankruptcy.append(node('p', debt.to ? `${person(debt.to)} nhận ${held} giấy ra.` : `${held} giấy ra trở về bộ thẻ.`));
    if (debt.to && mortgaged.length) bankruptcy.append(node('p', `${person(debt.to)} phải chọn cách nhận từng tài sản đang thế chấp: ${mortgaged.map(({ space }) => title(space.id)).join(', ')}.`));
    if (!bankrupt) bankruptcy.append(node('p', 'Chỉ có thể phá sản sau khi bán hết công trình và không còn đủ khả năng trả nợ bằng thế chấp.', 'local-note'));
    bankruptcy.append(act('Bankrupt', 'Xác nhận phá sản và chuyển tài sản', {}, bankrupt));
  }
  if (acquiring) {
    const id = turn.acquisition.spaceId;
    const { principal, interest, release } = mortgageAmounts(property(id));
    const acquisition = recovery(title(id));
    const afterPayment = (cost) => actor.cash >= cost ? `Còn ${balance(-cost)}` : `Thiếu ${money(cost - actor.cash)}; cần giải quyết khoản nợ`;
    acquisition.append(facts([
      ['Người nhận và quyết định', person(actorId)], [recoveryCopy.cash, money(actor.cash)],
      ['Trạng thái', mortgageState(id)], ['Tiền gốc thế chấp', money(principal)],
    ]));
    acquisition.append(
      node('p', `Giữ thế chấp trả ngay ${money(interest)}. ${afterPayment(interest)}. Ô này vẫn không thu tiền thuê.`),
      act('ChooseMortgage', `Giữ thế chấp · trả ${money(interest)}`, { choice: 'keep' }),
      node('p', `Giải chấp ngay trả ${money(release)}. ${afterPayment(release)}. Sau khi trả, ô này có thể thu tiền thuê.`),
      act('ChooseMortgage', `Giải chấp · trả ${money(release)}`, { choice: 'release' }),
      node('p', 'Mỗi tài sản đang chờ được xử lý riêng. Nếu còn tài sản cần quyết định, máy sẽ hiện ô tiếp theo khi đến lượt.', 'local-note'),
    );
    root.append(acquisition);
  }
  if (phase === 'Auction' && turn.auction.eligibleSeatIds.includes(actorId)) {
    const { highBid } = turn.auction;
    const min = auctionMinimum(turn.auction);
    const actions = node('div', '', 'local-auction-actions');
    if (actor.cash >= min) {
      const form = node('form', '', 'local-bid-form'); const input = numeric('local-bid', actor.cash, min, min);
      const send = node('button', 'Đặt giá'); send.dataset.command = 'Bid';
      form.append(wrap('Giá đặt (xu)', input), send);
      const target = turn.auction.targets?.[actorId];
      if (target) {
        const consequence = node('p', '', 'local-note local-building-bid-preview');
        const level = turn.buildings[target] ?? 0;
        const change = level === 4 ? 'Đổi 4 nhà thành 1 khách sạn, trả 4 nhà về ngân hàng.' : `Thêm 1 nhà, thành ${level + 1} nhà.`;
        const preview = () => {
          consequence.textContent = input.validity.valid
            ? `Nếu thắng tại ${title(target)}: trả ${money(input.valueAsNumber)}, còn ${balance(-input.valueAsNumber)}. ${change}`
            : `Nhập giá từ ${money(min)} đến ${money(actor.cash)} để xem số dư nếu thắng.`;
        };
        input.addEventListener('input', preview);
        preview();
        form.append(consequence);
      }
      form.addEventListener('submit', (event) => { event.preventDefault(); submit('Bid', { amount: input.valueAsNumber }); });
      actions.append(form);
    } else {
      actions.append(node('p', 'Không đủ tiền để đặt giá tối thiểu.', 'local-note'));
    }
    const leading = highBid?.seatId === actorId;
    const pass = act('Pass', 'Bỏ lượt đấu giá', {}, !leading);
    pass.className = 'secondary';
    actions.append(pass, node('p', leading ? 'Người dẫn đầu không thể bỏ lượt.' : 'Bỏ lượt là quyết định cuối cho cuộc đấu giá này.', 'local-note'));
    root.append(actions);
  }
  if (phase === 'BuildingDemand' && turn.buildingDemand.eligibleSeatIds.includes(actorId) && !Object.hasOwn(turn.buildingDemand.responses, actorId)) {
    const { token } = turn.buildingDemand;
    const targets = assets.filter(({ canBuild, level }) => canBuild && token === (level === 4 ? 'hotels' : 'houses'));
    const demand = buildingStep(token === 'hotels' ? 'Đăng ký khách sạn cuối' : 'Đăng ký nhà cuối');
    const select = options(targets.map(({ space }) => [space.id, title(space.id)]), 'demand-target');
    const terms = node('p');
    const preview = () => {
      const target = property(select.value);
      terms.textContent = target
        ? `${title(target.id)} · Giá xây nếu chỉ có một người đăng ký: ${money(target.economy.buildingCost)}. Nếu có nhiều người đăng ký, đấu giá từ ${money(auctionMinimum({}))}.`
        : 'Hiện không có ô hợp lệ để đăng ký.';
    };
    select.addEventListener('change', preview);
    select.disabled = targets.length === 0;
    preview();
    demand.append(wrap('Muốn xây công trình cuối ở đâu?', select), terms,
      node('p', 'Đăng ký giữ chỗ cho quyết định tiếp theo. Chưa trừ tiền. Nếu từ chối, bạn không tham gia lượt phân bổ này.', 'local-note'),
      button('BuildingDemand', 'Đăng ký xây tại ô đã chọn', () => submit('BuildingDemand', { spaceId: select.value }), targets.length > 0),
      act('BuildingDemand', 'Không đăng ký công trình cuối', { spaceId: null }));
    root.append(demand);
  }
  if (phase === 'BuildingOffer' && turn.buildingDemand.offeredSeatId === actorId) {
    const id = turn.buildingDemand.responses[actorId];
    const cost = property(id).economy.buildingCost;
    const offer = buildingStep(`Xây tại ${title(id)}`);
    const hotel = turn.buildingDemand.token === 'hotels';
    offer.append(node('p', 'Chỉ còn một người đăng ký. Nếu từ chối, ngân hàng giữ công trình và lượt chơi tiếp tục.'),
      facts([
        ['Giá xây', money(cost)],
        ['Sau khi xây', actor.cash >= cost ? balance(-cost) : 'Không đủ tiền để xây'],
        ['Thay đổi công trình', hotel ? '4 nhà thành 1 khách sạn · trả 4 nhà về ngân hàng' : `${buildings(id)} → ${(turn.buildings[id] ?? 0) + 1} nhà`],
      ]),
      act('BuildingOffer', `Đồng ý xây · ${money(cost)}`, { accept: true }, actor.cash >= cost),
      act('BuildingOffer', 'Không xây, trả công trình về ngân hàng', { accept: false }));
    root.append(offer);
  }
  if (normal || debtor || acquiring) {
    const groups = [...new Set(assets.filter(({ level }) => level === 5).map(({ space }) => space.groupId))];
    if (assets.length) root.append(assetControls());
    else if (debtor || acquiring || actorId !== turn.activeSeatId) root.append(node('p', `${person(actorId)} chưa có tài sản để quản lý.`, 'local-note'));
    if (turn.stock.houses < 4) for (const id of groups) root.append(liquidationControls(id));
  }
  if (normal || debtor || (phase === 'AwaitDebt' && [turn.trade?.proposerSeatId, turn.trade?.targetSeatId].includes(actorId))) {
    if (turn.trade) {
      const trade = turn.trade;
      const box = recovery('Giao dịch đang chờ');
      box.append(node('p', `${person(trade.targetSeatId)} là người quyết định có nhận đề nghị của ${person(trade.proposerSeatId)} hay không.`),
        tradeTerms(trade.proposerSeatId, trade.targetSeatId, trade));
      if (actorId === trade.targetSeatId) box.append(act('AcceptTrade', 'Đồng ý chuyển tiền và tài sản'));
      else box.append(button('TradeHandoff', `Chuyền máy cho ${person(trade.targetSeatId)} xem đề nghị`, () => selectActor(trade.targetSeatId)));
      if ([trade.proposerSeatId, trade.targetSeatId].includes(actorId)) box.append(act('CancelTrade', 'Hủy đề nghị giao dịch'));
      root.append(box);
    } else root.append(tradeControls());
  }
  if (bankruptcy) root.append(bankruptcy);
  return root;

  function buildingStep(heading) {
    const panel = recovery(heading);
    const { eligibleSeatIds, responses } = turn.buildingDemand;
    const responseList = node('ul');
    for (const id of eligibleSeatIds) {
      const response = Object.hasOwn(responses, id) ? (responses[id] ? `Đăng ký ${title(responses[id])}` : 'Đã từ chối') : 'Chưa trả lời';
      responseList.append(node('li', `${person(id)} · ${response}`));
    }
    panel.append(facts([
      ['Người quyết định', person(actorId)], [recoveryCopy.cash, money(actor.cash)], [recoveryCopy.stock, stock()],
    ]), responseList);
    return panel;
  }

  function tradeTerms(from, to, trade) {
    const sides = node('div', '', 'local-trade-terms');
    for (const [sender, receiver, side] of [[from, to, trade.give], [to, from, trade.receive]]) {
      const terms = node('div');
      terms.append(node('h4', `${person(sender)} → ${person(receiver)}`));
      const items = node('ul');
      items.append(node('li', `${person(sender)} đưa: Tiền: ${money(side.cash)}`));
      for (const id of side.properties) {
        const space = property(id);
        const { interest, release } = mortgageAmounts(space);
        const owner = turn.ownership[id];
        const item = node('li');
        item.append(node('strong', title(id)), node('p', `Chủ hiện tại: ${person(owner)} · ${mortgageState(id)}${space.type === 'street' ? ` · ${buildings(id)}` : ''}.`));
        if (turn.mortgages[id]) item.append(node('p', `${person(receiver)} chọn giữ và trả ${money(interest)}, hoặc giải chấp và trả ${money(release)}.`));
        items.append(item);
      }
      for (const id of side.cards) items.append(node('li', `Giấy ra · ${cardCopy[id] ?? id}`));
      terms.append(items);
      sides.append(terms);
    }
    return sides;
  }

  function assetControls() {
    const details = node('details', '', 'local-decision-step');
    details.id = 'asset-details';
    details.append(node('summary', debtor ? `Huy động tiền từ tài sản của ${person(actorId)}` : `Tài sản của ${person(actorId)}`));
    details.append(facts([[recoveryCopy.cash, money(actor.cash)], [recoveryCopy.stock, stock()]]));
    const select = options(assets.map(({ space }) => [space.id, title(space.id)]), 'asset-space');
    const remembered = portfolioSelection?.get(actorId);
    if (assets.some(({ space }) => space.id === remembered)) select.value = remembered;
    const info = node('div');
    const actions = node('ul', '', 'local-asset-actions');
    actions.setAttribute('aria-label', 'Các lựa chọn cho tài sản');
    const update = () => {
      const item = assets.find(({ space }) => space.id === select.value);
      const { space, level, group } = item;
      const id = space.id;
      const { principal, release } = mortgageAmounts(space);
      const groupName = space.type === 'street' ? `Nhóm ${space.groupId}` : space.type === 'transit' ? 'Bến xe' : 'Dịch vụ';
      const inspect = node('button', 'Xem đầy đủ khu đất', 'secondary');
      inspect.type = 'button';
      inspect.addEventListener('click', () => inspectSpace(id, inspect));
      info.replaceChildren(node('h4', title(id)), facts([
        ['Loại tài sản', groupName], ['Chủ sở hữu', person(actorId)], ['Thế chấp', mortgageState(id)],
        ...(space.type === 'street' ? [['Công trình hiện có', buildings(id)]] : []),
      ]), inspect);
      actions.replaceChildren();
      const choice = (command, label, preview, reason) => {
        const row = node('li');
        row.append(node('p', preview), act(command, label, { spaceId: id }, !reason));
        if (reason) row.append(node('p', reason, 'local-note'));
        actions.append(row);
      };
      if (turn.mortgages[id]) {
        const reason = !normal ? 'Cần hoàn tất quyết định đang chờ trước khi giải chấp.'
          : actor.cash < release ? `Cần thêm ${money(release - actor.cash)} để giải chấp.` : '';
        choice('ReleaseMortgage', `Giải chấp · trả ${money(release)}`, `Có thể thu tiền thuê sau khi giải chấp.${actor.cash >= release ? ` Còn ${balance(-release)}.` : ''}`, reason);
      } else {
        choice('Mortgage', `Thế chấp · nhận ${money(principal)}`,
          `Số dư sau khi thế chấp: ${balance(principal)}. Dừng thu tiền thuê; giải chấp sau đó tốn ${money(release)}.`,
          item.canMortgage ? '' : 'Phải bán hết công trình trong nhóm trước khi thế chấp.');
      }
      if (space.type !== 'street') return;
      const buildCost = space.economy.buildingCost;
      const hotel = level === 4;
      const remaining = turn.stock[hotel ? 'hotels' : 'houses'];
      let buildReason = '';
      if (!normal) buildReason = 'Chờ hoàn tất quyết định hiện tại trước khi xây.';
      else if (group.some((entry) => turn.ownership[entry.id] !== actorId)) buildReason = `Cần sở hữu cả nhóm: ${group.map((entry) => title(entry.id)).join(', ')}.`;
      else if (group.some((entry) => turn.mortgages[entry.id])) buildReason = 'Cần giải chấp tất cả ô trong nhóm trước khi xây.';
      else if (level >= 5) buildReason = 'Ô này đã có khách sạn.';
      else if (level > Math.min(...group.map((entry) => turn.buildings[entry.id] ?? 0))) buildReason = 'Cần xây đều: hãy xây các ô còn ít công trình trong nhóm trước.';
      else if (!remaining) buildReason = 'Ngân hàng đã hết công trình loại này.';
      else if (actor.cash < (remaining === 1 ? auctionMinimum({}) : buildCost)) buildReason = 'Không đủ tiền để xây hoặc tham gia quyết định công trình cuối.';
      if (level < 5) {
        const change = hotel ? 'Đổi 4 nhà thành 1 khách sạn và trả 4 nhà về ngân hàng.' : `Thêm 1 nhà, thành ${level + 1} nhà.`;
        choice('Build', remaining === 1 ? 'Yêu cầu công trình cuối' : `Xây ${hotel ? 'khách sạn' : 'nhà'} · ${money(buildCost)}`,
          remaining === 1
            ? `Chưa trả tiền khi đăng ký. Giá xây nếu chỉ một người đăng ký là ${money(buildCost)}; nếu có tranh mua, đấu giá từ ${money(auctionMinimum({}))}. ${change}`
            : `${change}${actor.cash >= buildCost ? ` Còn ${balance(-buildCost)}.` : ''}`, buildReason);
      }
      const refund = buildCost / 2;
      const sellReason = !level ? 'Ô này chưa có công trình để bán.'
        : level < Math.max(...group.map((entry) => turn.buildings[entry.id] ?? 0)) ? 'Cần bán đều: hãy bán ở ô có nhiều công trình nhất trong nhóm trước.'
        : level === 5 && turn.stock.houses < 4 ? 'Ngân hàng có ít hơn 4 nhà. Hãy dùng lựa chọn bán khách sạn cả nhóm bên dưới.' : '';
      choice('SellBuilding', `Bán một công trình · nhận ${money(refund)}`,
        level === 5 ? `Trả 1 khách sạn, nhận lại 4 nhà tại ô này. Còn ${balance(refund)}.`
          : level ? `Trả 1 nhà về ngân hàng, còn ${level - 1} nhà trên ô. Còn ${balance(refund)}.` : `Giá bán một nhà: ${money(refund)}.`, sellReason);
    };
    select.addEventListener('change', () => { portfolioSelection?.set(actorId, select.value); update(); });
    update();
    details.append(wrap('Chọn tài sản', select), info, actions);
    return details;
  }

  function liquidationControls(groupId) {
    const details = node('details', '', 'local-decision-step');
    details.append(node('summary', `Bán khách sạn nhóm ${groupId} khi thiếu nhà`));
    const members = board.spaces.filter((space) => space.type === 'street' && space.groupId === groupId);
    if (members.some((space) => turn.ownership[space.id] !== actorId)) {
      details.append(node('p', 'Cần sở hữu toàn bộ nhóm để bán khách sạn theo cách này.', 'local-note'));
      return details;
    }
    const hotels = members.filter((space) => turn.buildings[space.id] === 5);
    const houses = members.reduce((sum, space) => sum + (turn.buildings[space.id] === 5 ? 0 : (turn.buildings[space.id] ?? 0)), 0);
    const total = Math.min(houses + turn.stock.houses, 4 * members.length);
    const low = Math.floor(total / members.length);
    const highCount = total % members.length;
    const refund = hotels.reduce((sum, space) => sum + Math.floor(space.economy.buildingCost / 2), 0)
      + Math.max(0, houses - total) * Math.floor(members[0].economy.buildingCost / 2);
    const form = node('form');
    const inputs = members.map((space, index) => numeric(`liquidate-${space.id}`, 4, low + (index < highCount ? 1 : 0)));
    form.append(facts([
      [recoveryCopy.stock, stock()], ['Tiền nhận', money(refund)], ['Số dư sau khi bán', balance(refund)],
      ['Kho sau khi bán', `${turn.stock.houses + houses - total} nhà · ${turn.stock.hotels + hotels.length} khách sạn`],
    ]), node('p', `Trả ${hotels.length} khách sạn về ngân hàng. Phải giữ tổng cộng ${total} nhà, chia đều (chênh lệch tối đa 1).`));
    members.forEach((space, index) => form.append(wrap(`${title(space.id)} · hiện có ${buildings(space.id)} · số nhà giữ lại`, inputs[index])));
    const send = node('button', `Xác nhận bán khách sạn cả nhóm · nhận ${money(refund)}`);
    send.dataset.command = 'LiquidateHotels';
    const validation = node('p', '', 'local-note');
    validation.setAttribute('aria-live', 'polite');
    const readCounts = () => inputs.map((input) => input.valueAsNumber);
    const validate = (counts) => {
      const valid = counts.every((count) => Number.isInteger(count) && count >= 0 && count <= 4)
        && counts.reduce((sum, count) => sum + count, 0) === total && Math.max(...counts) - Math.min(...counts) <= 1;
      send.disabled = !valid;
      validation.textContent = valid ? '' : `Chọn đúng ${total} nhà, từ 0 đến 4 nhà mỗi ô và chia đều.`;
      return valid;
    };
    form.append(validation, send);
    form.addEventListener('input', () => { validate(readCounts()); });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const finalCounts = readCounts();
      if (validate(finalCounts)) submit('LiquidateHotels', { groupId, finalCounts });
    });
    details.append(form);
    return details;
  }
  function tradeControls() {
    const details = node('details', '', 'local-decision-step');
    details.id = 'trade-details';
    details.append(node('summary', 'Đề nghị giao dịch tiền, tài sản hoặc giấy ra'));
    const others = turn.seats.filter((entry) => !entry.eliminated && entry.id !== actorId);
    const target = options(others.map(({ id }) => [id, person(id)]), 'trade-target'); const sides = node('div'); const form = node('form'); let readSides; let reviewedOffer;
    const update = () => {
      sides.replaceChildren(); const targetPlayer = turn.seats.find(({ id }) => id === target.value);
      const side = (id, name, cash) => {
        const field = node('fieldset');
        field.append(node('legend', name), node('p', `${recoveryCopy.cash} · ${money(cash)}`, 'local-note'));
        const input = numeric(`trade-cash-${id}`, cash);
        const properties = options(propertyOptions(turn, board, id).filter(({ developed }) => !developed).map(({ space }) => [space.id, `${title(space.id)}${turn.mortgages[space.id] ? ' · đang thế chấp' : ''}`]), `trade-properties-${id}`, true);
        const cards = options((turn.retainedCards[id] ?? []).map((id) => [id, cardCopy[id]]), `trade-cards-${id}`, true);
        field.append(wrap('Tiền (xu)', input), wrap('Tài sản đưa đi · có thể chọn nhiều', properties), wrap('Giấy ra đưa đi', cards)); sides.append(field);
        return () => ({ cash: input.valueAsNumber, properties: selected(properties), cards: selected(cards) });
      };
      const give = side(actorId, `${person(actorId)} đưa`, actor.cash); const receive = side(target.value, `${person(target.value)} đưa`, targetPlayer.cash);
      readSides = () => ({ give: give(), receive: receive() });
    };
    target.addEventListener('change', update); update();
    const review = node('section'); review.className = 'trade-review'; review.hidden = true;
    const reviewText = node('div');
    const confirm = node('button', 'Gửi đề nghị giao dịch'); confirm.type = 'button'; confirm.dataset.command = 'ConfirmOfferTrade';
    const back = node('button', 'Quay lại sửa'); back.type = 'button'; back.className = 'secondary';
    const lockEditor = (locked) => form.querySelectorAll('input, select').forEach((input) => { input.disabled = locked; });
    const revise = () => { reviewedOffer = undefined; lockEditor(false); review.hidden = true; form.querySelector('[data-command="OfferTrade"]').hidden = false; form.querySelector('#trade-target').focus(); };
    back.addEventListener('click', revise);
    confirm.addEventListener('click', () => { if (reviewedOffer) submit('OfferTrade', reviewedOffer); });
    const reviewActions = node('div', '', 'local-decision-actions');
    reviewActions.append(confirm, back);
    review.append(node('h4', 'Xem lại hai bên trước khi gửi'), reviewText, reviewActions);
    const send = node('button', 'Xem lại đề nghị trước khi gửi'); send.type = 'submit'; send.dataset.command = 'OfferTrade';
    form.append(wrap('Giao dịch với', target), sides, node('p', 'Người nhận phải xác nhận. Nếu nhận tài sản đang thế chấp, người nhận sẽ được hỏi giữ thế chấp hay giải chấp và thấy khoản phải trả.', 'local-note'), review, send);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const offer = { targetSeatId: target.value, ...readSides() };
      reviewedOffer = {
        targetSeatId: offer.targetSeatId,
        give: { ...offer.give, properties: [...offer.give.properties], cards: [...offer.give.cards] },
        receive: { ...offer.receive, properties: [...offer.receive.properties], cards: [...offer.receive.cards] },
      };
      reviewText.replaceChildren(tradeTerms(actorId, reviewedOffer.targetSeatId, reviewedOffer),
        node('p', `${person(reviewedOffer.targetSeatId)} sẽ nhận và quyết định có chấp nhận không.`));
      lockEditor(true); review.hidden = false; send.hidden = true; confirm.focus();
    });
    details.append(form); return details;
  }
}
