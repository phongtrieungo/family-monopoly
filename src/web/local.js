import { decisionControls, node } from './local-controls.js';
import { money, cardCopy, phases, errors, pieces } from './local-vi.js';
import { createBoardView } from './local-board.bundle.js';
const $ = (id) => document.getElementById(id);
const read = (key) => { try { return JSON.parse(sessionStorage.getItem(key)); } catch { return null; } };
let game = read('local-game');
let board = game?.board;
let state = game?.snapshot;
let history = game?.history ?? [];
let pending = read('local-command');
let actorId;
let acknowledgedSeatId;
let requiredKey;
let busy = false;
let online = false;
let syncing;
let errorCode;
let boardView;
let previewView;
let inspectedSpaceId;
const inspectionOpen = () => Boolean(document.querySelector('.local-page dialog[open]'));
let renderedFinished = false;
let lastRoll = game?.lastRoll ?? null;
const credential = (id) => game?.sessions.find((entry) => entry.seatId === id)?.session;
const person = (id) => state?.seats.find((entry) => entry.id === id)?.name ?? 'Ngân hàng';
const spaceName = (id) => board?.copy[board.spaces.find((space) => space.id === id)?.labelKey] ?? id ?? '';
function save() {
  if (game) sessionStorage.setItem('local-game', JSON.stringify({ ...game, board, snapshot: state, history, lastRoll }));
  if (pending) sessionStorage.setItem('local-command', JSON.stringify(pending)); else sessionStorage.removeItem('local-command');
}
function error(code) { errorCode = code; $('local-error').hidden = !code; $('local-error').textContent = code ? errors[code] ?? errors.Unknown : ''; }
async function api(path, body, session) {
  let response;
  try {
    response = await fetch(path, { method: body === undefined ? 'GET' : 'POST',
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(session ? { Authorization: `Bearer ${session}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(5000) });
  } catch { throw new Error('Network'); }
  let result;
  try { result = await response.json(); } catch { throw new Error('Network'); }
  if (!response.ok) throw new Error(result.error ?? 'Unknown'); return result;
}
let boardRequest;
function getBoard() {
  boardRequest ??= api('/api/local/board').catch((failure) => { boardRequest = undefined; throw failure; });
  return boardRequest;
}
function candidates() {
  const { turn } = state; const live = turn.seats.filter((seat) => !seat.eliminated).map((seat) => seat.id);
  if (turn.phase === 'Finished') return [];
  if (turn.phase === 'Auction') return turn.auction.eligibleSeatIds;
  if (turn.phase === 'BuildingDemand') return turn.buildingDemand.eligibleSeatIds.filter((id) => !Object.hasOwn(turn.buildingDemand.responses, id));
  if (turn.phase === 'BuildingOffer') return [turn.buildingDemand.offeredSeatId];
  if (turn.phase === 'AwaitAcquisition') return [turn.acquisition.seatId];
  if (turn.phase === 'AwaitDebt') return [...new Set([turn.pendingDebt.from, ...(turn.trade ? [turn.trade.targetSeatId] : [])])].filter((id) => live.includes(id));
  return live;
}
function preferred() {
  const { turn } = state;
  return turn.pendingDebt?.from ?? turn.acquisition?.seatId ?? turn.buildingDemand?.offeredSeatId ?? turn.activeSeatId;
}
function selectActor(id) {
  if (busy || pending || !online || !candidates().includes(id)) return;
  actorId = id; render();
}
function setRetryContext() {
  $('local-retry').hidden = !pending;
  $('retry-context').textContent = pending ? `Chưa xác nhận được thao tác của ${person(pending.actorId)}. Gửi lại dùng đúng yêu cầu đã lưu, không tạo thêm lần thanh toán.` : '';
}
function locks() {
  setRetryContext();
  $('local-connection').hidden = online || !game;
  $('local-controls').hidden = state?.turn.phase === 'Finished';
  $('local-controls').disabled = state?.turn.phase === 'Finished' || busy || !online || !!pending || acknowledgedSeatId !== actorId;
  $('local-purchase-actions').disabled = $('local-controls').disabled;
  $('local-actor').disabled = busy || !online || !!pending;
  $('confirm-handoff').disabled = busy || !online || !!pending;
  $('retry-command').disabled = busy || !online;
  $('new-local').disabled = busy;
  $('start-local').disabled = busy;
}
function cause(sourceId) {
  if (cardCopy[sourceId]) return cardCopy[sourceId].replace(/\.$/, '');
  if (sourceId === 'jail') return 'Phí ra nhà chờ';
  if (board?.spaces.some(({ id }) => id === sourceId)) return spaceName(sourceId);
  return 'Khoản thanh toán đã xác nhận';
}
function balances(ids) {
  return [...new Set(ids)].flatMap((id) => {
    const seat = state.turn.seats.find((entry) => entry.id === id);
    return seat ? [`${person(id)}: ${money(seat.cash)}`] : [];
  }).join(' · ');
}
function auctionSubject(event) {
  if (event.spaceId) return spaceName(event.spaceId);
  // Building auctions do not carry a property ID in their settlement event.
  return 'công trình cuối';
}
const outcomeTypes = new Set(['PropertyBought', 'StartAwarded', 'CardDrawn', 'RentPaid', 'PaymentSettled', 'BankPaid', 'AuctionStarted', 'AuctionBidAccepted', 'AuctionPassed', 'AuctionSettled', 'AuctionEndedWithoutBid']);
function renderOutcome() {
  const row = [...history].reverse().find(({ events }) => events.some(({ type }) => outcomeTypes.has(type)));
  const events = row?.events.filter(({ type }) => outcomeTypes.has(type)) ?? [];
  const lastCard = events.findLast(({ type }) => type === 'CardDrawn');
  const lines = events.map((event) => {
    const building = event.type === 'AuctionSettled' && row.events.find((entry) => entry.type === 'BuildingBought' && (entry.seatId ?? entry.from) === event.from);
    let text = describe(building ? { ...event, spaceId: building.spaceId } : event);
    if (event.type === 'CardDrawn') {
      const seat = state.turn.seats.find(({ id }) => id === event.seatId);
      if (seat && event === lastCard) text += ` Hiện tại: ${spaceName(board.spaces[seat.position]?.id)}.`;
      if (state.turn.retainedCards[event.seatId]?.includes(event.cardId)) text += ' Đang giữ giấy ra nhà chờ.';
      const debt = state.turn.pendingDebt;
      if (debt?.sourceId === event.cardId) text += ` Đang chờ ${person(debt.from)} trả ${money(debt.amount)} cho ${person(debt.to)}.`;
    }

    if (['RentPaid', 'PaymentSettled'].includes(event.type)) text += ` Số dư hiện tại · ${balances([event.from, event.to])}.`;
    if (event.type === 'BankPaid') text += ` Số dư hiện tại · ${balances([event.seatId])}.`;
    if (event.type === 'PropertyBought') text += ` Số dư hiện tại · ${balances([event.from])}.`;
    if (event.type === 'AuctionSettled') text += ` Số dư hiện tại · ${balances([event.from])}.`;
    return node('li', text);
  });
  const auction = state.turn.auction;
  if (state.turn.phase === 'Auction' && auction) {
    const subject = auction.kind === 'building' ? 'công trình cuối' : spaceName(auction.spaceId);
    const leader = auction.highBid ? `${person(auction.highBid.seatId)} dẫn đầu với ${money(auction.highBid.amount)}.` : 'Chưa có người đặt giá.';
    lines.push(node('li', `Đấu giá ${subject}. ${leader} Giá đặt tối thiểu ${money((auction.highBid?.amount ?? 9) + 1)}. Chọn người đủ điều kiện và xác nhận chuyền máy. Bỏ lượt là quyết định cuối trong cuộc đấu giá này.`));
  }
  $('local-outcome').hidden = !lines.length;
  $('local-outcome-items').replaceChildren(...lines);
}
function describe(event) {
  const name = person(event.seatId ?? event.from);
  switch (event.type) {
    case 'MatchStarted': return 'Đã bắt đầu ván chơi chung. Mỗi người có 1.200 xu.';
    case 'Rolled': return `${name} gieo ${event.dice.join(' + ')}.`;
    case 'StartAwarded': return `${name} nhận ${money(event.amount)} khi qua quảng trường.`;
    case 'PropertyBought': return `${name} mua ${spaceName(event.spaceId)} với ${money(event.amount)}.`;
    case 'RentPaid': return `${name} trả ${money(event.amount)} tiền thuê cho ${person(event.to)}. ${cause(event.sourceId)}.`;
    case 'PaymentSettled': return `${name} trả ${money(event.amount)} cho ${person(event.to)}. ${cause(event.sourceId)}.`;
    case 'CardDrawn': return `${name}: ${cardCopy[event.cardId] ?? 'Rút một thẻ.'}`;
    case 'BankPaid': return `${name} nhận ${money(event.amount)} từ Ngân hàng. ${cause(event.cardId)}.`;
    case 'Jailed': return `${name} đến nhà chờ và kết thúc lượt.`;
    case 'JailFeePaid': return `${name} trả phí ra nhà chờ ${money(event.amount)}.`;
    case 'ServiceRolled': return `Xúc xắc tính tiền dịch vụ: ${event.dice.join(' + ')}.`;
    case 'AuctionStarted': return event.kind === 'building' ? 'Mở đấu giá công trình cuối.' : `Mở đấu giá ${spaceName(event.spaceId)}.`;
    case 'AuctionBidAccepted': return `${name} đặt giá ${money(event.amount)}.`;
    case 'AuctionPassed': return `${name} bỏ lượt đấu giá.`;
    case 'AuctionSettled': return `${name} thắng đấu giá ${auctionSubject(event)} với ${money(event.amount)}.`;
    case 'AuctionEndedWithoutBid': return `Không có giá đặt; ${auctionSubject(event)} vẫn ở ngân hàng.`;
    case 'PropertyMortgaged': return `${name} thế chấp ${spaceName(event.spaceId)}, nhận ${money(event.amount)}.`;
    case 'MortgageReleased': return `${name} giải chấp ${spaceName(event.spaceId)}, trả ${money(event.amount)}.`;
    case 'BuildingBought': return `${name} xây tại ${spaceName(event.spaceId)}, trả ${money(event.amount)}.`;
    case 'BuildingSold': return `${name} bán công trình tại ${spaceName(event.spaceId)}, nhận ${money(event.amount)}.`;
    case 'HotelsLiquidated': return `${name} bán khách sạn nhóm ${event.groupId}, nhận ${money(event.amount)}.`;
    case 'TradeOffered': return `${name} gửi đề nghị giao dịch cho ${person(event.to)}.`;
    case 'TradeSettled': return `${name} và ${person(event.to)} hoàn tất giao dịch.`;
    case 'TradeCanceled': return `${name} hủy đề nghị giao dịch.`;
    case 'SeatBankrupted': return `${name} phá sản và rời ván chơi.`;
    case 'MatchFinished': return `${person(event.winnerSeatId)} thắng ván chơi!`;
    default: return '';
  }
}
function rollText(roll) {
  if (!roll) return '';
  const name = person(roll.seatId);
  if (roll.forcedJail) return `${name} gieo ${roll.dice.join(' + ')}; máy chủ đưa người chơi đến Nhà chờ.`;
  const destination = board.spaces[roll.toPosition];
  return `${name} gieo ${roll.dice.join(' + ')}; đến ô ${roll.toPosition + 1} · ${board.copy[destination.labelKey]}.${roll.startAward ? ` Nhận ${money(roll.startAward)} khi qua quảng trường.` : ''}`;
}
function render({ motion } = {}) {
  if (!state || !board) return;
  const oldActor = $('local-actor').value;
  const wasHandoff = !$('local-handoff').hidden;
  const { turn } = state;
  const finished = state.status === 'Finished' && turn.phase === 'Finished';
  const enteringFinish = finished && !renderedFinished;
  renderedFinished = finished;
  $('local-phase-label').textContent = finished ? 'ĐÃ HOÀN THÀNH' : `Lượt của ${person(turn.activeSeatId)}`;
  const required = preferred(); const key = `${turn.phase}:${required}`;
  const allowed = candidates();
  if (requiredKey !== key && !['Auction', 'BuildingDemand'].includes(turn.phase)) actorId = required;
  requiredKey = key;
  if (!allowed.includes(actorId)) actorId = allowed[0];
  $('local-match').dataset.revision = state.revision;
  previewView?.destroy(); previewView = undefined;
  $('local-setup').hidden = true; $('local-match').hidden = false; $('new-local').hidden = false;
  $('local-turn-heading').textContent = phases[turn.phase] ?? 'Đang chờ quyết định';
  $('local-bank').textContent = `Ngân hàng còn ${turn.stock.houses} nhà và ${turn.stock.hotels} khách sạn.`;
  const active = turn.seats.find((seat) => seat.id === turn.activeSeatId);
  if (lastRoll && lastRoll.seatId !== turn.activeSeatId) lastRoll = null;
  let context = `Vị trí của ${person(turn.activeSeatId)} · ${spaceName(board.spaces[active.position].id)}.`;
  if (turn.pendingDebt) context = `${person(turn.pendingDebt.from)} cần trả ${money(turn.pendingDebt.amount)} cho ${person(turn.pendingDebt.to)}. ${cardCopy[turn.pendingDebt.sourceId] ?? (turn.pendingDebt.sourceId === 'jail' ? 'Phí ra nhà chờ' : spaceName(turn.pendingDebt.sourceId))}`;
  if (turn.phase === 'Auction') context = turn.auction.kind === 'building' ? 'Công trình cuối đang được giữ cho cuộc đấu giá. Chọn rõ người đặt giá.' : `Đấu giá ${spaceName(turn.auction.spaceId)}. Chọn rõ người đặt giá hoặc bỏ lượt.`;
  if (turn.phase === 'BuildingDemand') context = 'Công trình cuối được giữ lại. Mọi người được mời cần đăng ký ô hợp lệ hoặc từ chối.';
  $('local-context').textContent = finished ? 'Ván chơi đã kết thúc. Không còn lượt hoặc quyết định cần thực hiện.' : context;
  $('local-roll-result').textContent = finished ? '' : rollText(lastRoll);
  const chooser = $('local-actor'); chooser.replaceChildren(...allowed.map((id) => { const option = node('option', person(id)); option.value = id; return option; })); chooser.value = actorId;
  const actorLabel = $('local-actor-label');
  actorLabel.hidden = allowed.length <= 1;
  const core = ['AwaitRoll', 'AwaitPurchase', 'AwaitEnd'].includes(turn.phase) && actorId === turn.activeSeatId;
  if (core) $('local-controls').after(actorLabel);
  else $('local-handoff').before(actorLabel);
  $('local-holder').textContent = finished ? 'Ván đã kết thúc' : acknowledgedSeatId === actorId
    ? `Người cầm máy · ${person(actorId)}`
    : `Chờ ${person(actorId)} nhận máy`;
  const gate = acknowledgedSeatId !== actorId && turn.phase !== 'Finished';
  $('local-handoff').hidden = !gate;
  $('handoff-heading').textContent = `Chuyền máy cho ${person(actorId)}`;
  $('confirm-handoff').textContent = `Tôi là ${person(actorId)} · tiếp tục`;
  const purchaseActions = $('local-purchase-actions');
  purchaseActions.querySelectorAll('button').forEach((button) => button.remove());
  $('local-actions').replaceChildren(decisionControls({ state, board, actorId, submit, selectActor, inspectSpace, purchaseActions }));
  purchaseActions.hidden = !purchaseActions.querySelector('button');
  if (turn.phase !== 'Finished' && actorId !== required && allowed.includes(required) && !['Auction', 'BuildingDemand'].includes(turn.phase)) {
    const back = node('button', `Chuyền về ${person(required)} để tiếp tục lượt`); back.type = 'button'; back.addEventListener('click', () => selectActor(required)); $('local-actions').prepend(back);
  }
  $('local-winner').hidden = !finished;
  if (finished && !$('local-announcement').textContent) $('local-announcement').textContent = `${person(turn.winnerSeatId)} thắng ván chơi! Cảm ơn cả nhà đã cùng chơi.`;
  $('local-finish-heading').textContent = finished && turn.winnerSeatId ? `${person(turn.winnerSeatId)} thắng ván chơi!` : '';
  $('local-final-seats').replaceChildren(...turn.seats.map((seat) => {
    const properties = board.spaces.filter((space) => turn.ownership[space.id] === seat.id).map((space) => {
      const level = turn.buildings[space.id] ?? 0;
      return `${spaceName(space.id)}${turn.mortgages[space.id] ? ' (thế chấp)' : ''}${level ? ` · ${level === 5 ? '1 khách sạn' : level + ' nhà'}` : ''}`;
    });
    return node('li', `${person(seat.id)} · ${money(seat.cash)} · ${seat.eliminated ? 'Đã phá sản' : 'Không phá sản'}. Tài sản: ${properties.length ? properties.join('; ') : 'Không có'}.`);
  }));
  $('local-players').replaceChildren(...turn.seats.map((seat, index) => {
    const current = !finished && seat.id === turn.activeSeatId;
    const item = node('li', '', `player-card seat-${index + 1}${current ? ' selected' : ''}`);
    const piece = node('span', pieces[index].icon, 'local-piece');
    piece.setAttribute('aria-hidden', 'true');
    const name = node('strong', person(seat.id));
    const held = (turn.retainedCards[seat.id] ?? []).map((id) => cardCopy[id]).join(' · ');
    const count = Object.values(turn.ownership).filter((owner) => owner === seat.id).length;
    const summary = node('div', '', 'seat-summary');
    summary.append(name, node('small', pieces[index].name, 'seat-piece-name'), node('span', money(seat.cash), 'seat-cash'),
      node('small', `${count} tài sản`));
    item.append(piece, summary);
    if (current) item.append(node('small', 'đang đến lượt', 'seat-status'));
    if (seat.eliminated || seat.jailed) item.append(node('small', seat.eliminated ? 'Đã phá sản' : `Nhà chờ · ${seat.jailAttempts}/3 lần thử`, 'seat-status'));
    if (held) item.append(node('small', `Giấy ra: ${held}`, 'seat-status'));
    return item;
  }));
  if (!boardView) boardView = createBoardView($('local-board'));
  boardView.render({ board, state, activeSeatId: turn.activeSeatId, person, roll: lastRoll, motion,
    onMotionChange: (playing) => { $('skip-local-motion').hidden = !playing; } });
  if (!$('local-spaces').childElementCount) {
    $('local-spaces').replaceChildren(...board.spaces.map((space) => {
      const item = node('li');
      const trigger = node('button', `${space.position + 1}. ${spaceName(space.id)}`, 'secondary');
      trigger.type = 'button'; trigger.dataset.spaceId = space.id;
      trigger.addEventListener('click', () => inspectSpace(space.id, trigger));
      item.append(trigger);
      return item;
    }));
  }
  if (inspectedSpaceId) renderSpaceDetail();
  $('local-history').replaceChildren(...history.flatMap(({ events }) => events.map(describe)).filter(Boolean).slice(-12).reverse().map((message) => node('li', message)));
  renderOutcome();
  if (finished) $('local-outcome').hidden = true;
  locks();
  if (enteringFinish && !inspectionOpen()) $('local-finish-heading').focus();
  if (!inspectionOpen() && gate && (!wasHandoff || oldActor !== actorId)) $('handoff-heading').focus();
  save();
}
function renderSpaceDetail() {
  const space = board.spaces.find(({ id }) => id === inspectedSpaceId);
  const { turn } = state;
  const owner = turn.ownership[space.id];
  const level = turn.buildings[space.id] ?? 0;
  const occupants = turn.seats.filter((seat) => !seat.eliminated && seat.position === space.position).map((seat) => person(seat.id));
  const title = `Ô ${space.position + 1} · ${spaceName(space.id)}`;
  $('local-space-heading').textContent = title;
  const lines = [`${space.id}${space.groupId ? ` · Nhóm ${space.groupId}` : ''}`];
  if (occupants.length) lines.push(`Đang ở đây: ${occupants.join(', ')}.`);
  if (space.position === turn.seats.find(({ id }) => id === turn.activeSeatId)?.position && state.status !== 'Finished') lines.push('Vị trí của người đang đến lượt.');
  if (space.economy) {
    lines.push(`Giá ${money(space.economy.price)} · Xây mỗi công trình ${money(space.economy.buildingCost)}.`);
    const stages = ['Thuê cơ bản', 'Đủ nhóm', '1 nhà', '2 nhà', '3 nhà', '4 nhà', 'Khách sạn'];
    lines.push(...space.economy.rents.map((rent, index) => `${stages[index]} · ${money(rent)}`));
  }
  if (space.type === 'transit') lines.push(`Giá ${money(space.price)} · Thuê theo 1–4 bến: ${board.transit.rents.map(money).join(', ')}.`);
  if (space.type === 'service') lines.push(`Giá ${money(space.price)} · Thuê bằng ${board.service.multipliers.join(' hoặc ')} lần tổng một lần gieo riêng.`);
  if (space.type === 'tax') lines.push(`Nộp ${money(space.amount)}.`);
  const special = { start: 'Nhận xu khi đến hoặc đi qua quảng trường theo kết quả lượt.', rest: 'Dừng chân, không mất phí.',
    jail: 'Ghé thăm hoặc ở nhà chờ, tùy theo tình trạng người chơi.', 'go-to-jail': 'Đến nhà chờ.',
    deck: space.deckId === 'chance' ? 'Rút thẻ Bước ngoặt.' : 'Rút thẻ Chuyện xóm mình.' };
  if (special[space.type]) lines.push(special[space.type]);
  if (owner || space.economy || space.price) lines.push(owner ? `Chủ: ${person(owner)}. ${turn.mortgages[space.id] ? 'Đang thế chấp.' : 'Chưa thế chấp.'}` : 'Chưa có chủ.');
  if (level) lines.push(level === 5 ? '1 khách sạn.' : `${level} nhà.`);
  $('local-space-copy').replaceChildren(...lines.map((line) => node('p', line)));
}
function showSpaceList() {
  const previous = inspectedSpaceId;
  inspectedSpaceId = undefined;
  $('local-spaces').hidden = false;
  $('local-space-detail').hidden = true;
  $('local-space-heading').textContent = '40 ô trong khu phố';
  const trigger = Array.from($('local-spaces').querySelectorAll('button')).find(({ dataset }) => dataset.spaceId === previous);
  (trigger ?? $('local-space-heading')).focus();
}
function inspectSpace(id, trigger) {
  const dialog = $('local-space-details');
  inspectedSpaceId = id;
  $('local-spaces').hidden = true;
  $('local-space-detail').hidden = false;
  $('back-local-spaces').hidden = !dialog.open;
  renderSpaceDetail();
  if (!dialog.open) openInspection(dialog, $('local-space-heading'), trigger);
  else $('local-space-heading').focus();
}
function openInspection(dialog, heading, trigger) {
  dialog.showModal();
  heading.focus();
  dialog.addEventListener('close', () => {
    if (dialog.id === 'local-space-details') inspectedSpaceId = undefined;
    if (trigger.isConnected && !trigger.matches(':disabled')) trigger.focus();
    else if (!$('local-handoff').hidden) $('handoff-heading').focus();
    else $('local-turn-heading').focus();
  }, { once: true });
}
$('open-local-spaces').addEventListener('click', (event) => {
  openInspection($('local-space-details'), $('local-space-heading'), event.currentTarget);
  showSpaceList();
});
$('back-local-spaces').addEventListener('click', showSpaceList);
$('open-local-history').addEventListener('click', (event) => {
  openInspection($('local-history-dialog'), $('local-history-heading'), event.currentTarget);
});
async function syncNow({ animate = true } = {}) {
  if (!game) return;
  let resynced = false;
  try {
    board ??= await getBoard();
    const session = game.sessions[0].session;
    let result;
    try { result = await api(`/api/local/sync?since=${state?.revision ?? 0}`, undefined, session); }
    catch (failure) { if (failure.message !== 'ResyncRequired') throw failure; result = await api('/api/local/sync?since=0', undefined, session); history = []; resynced = true; }
    online = true;
    if (errorCode === 'Network' && !pending) error();
    if (resynced || !state || state.revision !== result.snapshot.revision || $('local-match').hidden) {
      const before = state; state = result.snapshot;
      const knownRevisions = new Set(history.map(({ revision }) => revision));
      const accepted = result.history.filter(({ revision }) => {
        if (knownRevisions.has(revision)) return false;
        knownRevisions.add(revision); return true;
      });
      history = [...history, ...accepted].slice(-60);
      let motion;
      if (!resynced && before && result.history.length === 1) {
        const row = result.history[0]; const rolled = row.events.find((event) => event.type === 'Rolled');
        if (rolled) {
          const previous = before.turn.seats.find(({ id }) => id === rolled.seatId);
          const current = state.turn.seats.find(({ id }) => id === rolled.seatId);
          if (previous && current) {
            const forcedJail = row.events.some((event) => event.type === 'Jailed' && event.seatId === rolled.seatId);
            const expected = (previous.position + rolled.dice.reduce((sum, die) => sum + die, 0)) % board.spaces.length;
            lastRoll = { seatId: rolled.seatId, dice: rolled.dice, fromPosition: previous.position,
              toPosition: current.position, forcedJail,
              startAward: row.events.find((event) => event.type === 'StartAwarded' && event.seatId === rolled.seatId)?.amount };
            if (animate && !pending && (previous.position === current.position || forcedJail || expected === current.position) &&
                !matchMedia('(prefers-reduced-motion: reduce)').matches) motion = lastRoll;
          }
        } else if (lastRoll && state.turn.activeSeatId !== lastRoll.seatId) lastRoll = null;
      } else if (lastRoll && state.turn.activeSeatId !== lastRoll.seatId) lastRoll = null;
      render({ motion });
      const announcement = (resynced || !before ? [] : accepted).flatMap(({ events }) => events.map(describe)).filter(Boolean).join(' ');
      const finishedAnnouncement = state.status === 'Finished' ? `${person(state.turn.winnerSeatId)} thắng ván chơi! Cảm ơn cả nhà đã cùng chơi.` : '';
      $('local-announcement').textContent = announcement || finishedAnnouncement || (before?.turn.phase !== state.turn.phase ? `${phases[state.turn.phase]} · ${person(preferred())}` : '');
    }
    locks();
  } catch (failure) { online = false; if (failure.message !== 'Network' || pending) error(failure.message); else error(); locks(); }
}
function sync(options) { syncing ??= syncNow(options).finally(() => { syncing = undefined; }); return syncing; }
async function sendPending({ retry = false } = {}) {
  if (!pending || busy || !online) return;
  if (retry) acknowledgedSeatId = undefined;
  busy = true; locks(); error();
  let accepted = false;
  try {
    await api('/api/local/command', pending.command, credential(pending.actorId));
    accepted = true; pending = null; save();
  } catch (failure) {
    if (failure.message !== 'Network') {
      if (failure.message === 'ResyncRequired') acknowledgedSeatId = undefined;
      pending = null; save();
    }
    else online = false;
    error(failure.message);
  } finally {
    const before = state;
    await sync({ animate: accepted }); busy = false;
    if (retry || accepted || before !== state || errorCode === 'ResyncRequired') render();
    locks();
    if (inspectionOpen()) return;
    if (!$('local-handoff').hidden) $('handoff-heading').focus(); else if (state.turn.phase === 'Finished') $('local-finish-heading').focus(); else $('local-turn-heading').focus();
  }
}
async function submit(type, payload = {}) {
  if (state?.turn.phase === 'Finished' || pending || busy || !online || acknowledgedSeatId !== actorId) return;
  pending = { actorId, command: { id: crypto.randomUUID(), expectedRevision: state.revision, type, payload } }; save();
  await sendPending();
}
$('local-actor').addEventListener('change', (event) => selectActor(event.target.value));
$('confirm-handoff').addEventListener('click', () => { if (!online || busy || pending) return; acknowledgedSeatId = actorId; render(); $('local-turn-heading').focus(); });
$('skip-local-motion').addEventListener('click', () => boardView?.skipMotion());
$('celebrate-local').addEventListener('click', () => {
  $('local-winner').classList.add('celebrating');
  $('local-celebration-message').hidden = false;
  $('celebrate-local').hidden = true;
  $('stop-local-celebration').textContent = 'Dừng chúc mừng';
  $('stop-local-celebration').focus();
});
$('stop-local-celebration').addEventListener('click', () => {
  $('local-winner').classList.remove('celebrating');
  $('local-celebration-message').hidden = true;
  $('celebrate-local').hidden = true;
  $('stop-local-celebration').hidden = true;
  $('local-finish-heading').focus();
});
$('retry-command').addEventListener('click', () => { void sendPending({ retry: true }); });
$('local-setup-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (busy) return; busy = true; locks(); error();
  const names = [...new FormData(event.currentTarget).values()].map((name) => name.trim()).filter(Boolean);
  const saved = read('local-creation'); const creation = saved && JSON.stringify(saved.names) === JSON.stringify(names) ? saved : { names, requestId: crypto.randomUUID() };
  sessionStorage.setItem('local-creation', JSON.stringify(creation));
  try {
    const result = await api('/api/local/create', creation);
    game = { sessions: result.sessions }; state = result.snapshot; history = []; lastRoll = null; pending = null; acknowledgedSeatId = undefined; requiredKey = undefined;
    save(); sessionStorage.removeItem('local-creation');
    board ??= await getBoard(); online = true; render(); await sync();
  } catch (failure) { error(failure.message); }
  finally { busy = false; locks(); }
});
$('new-local').addEventListener('click', () => {
  if (busy || !confirm('Bắt đầu ván mới? Ván hiện tại sẽ không còn được mở từ trang này.')) return;
  sessionStorage.removeItem('local-game'); sessionStorage.removeItem('local-command'); sessionStorage.removeItem('local-creation'); location.reload();
});
const creation = read('local-creation');
if (creation && !game) creation.names.forEach((name, index) => { $('local-setup-form').elements[`player${index + 1}`].value = name; });
if (state && board) render();
if (!game) {
  previewView = createBoardView($('local-preview'));
  void getBoard().then((previewBoard) => previewView?.render({ board: previewBoard })).catch(() => {});
}
await sync();
setInterval(() => { if (!busy && game) sync(); }, 1000);
