import { decisionControls, node } from './local-controls.js';
import { money, cardCopy, phases, errors } from './local-vi.js';
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
const credential = (id) => game?.sessions.find((entry) => entry.seatId === id)?.session;
const person = (id) => state?.seats.find((entry) => entry.id === id)?.name ?? 'Ngân hàng';
const spaceName = (id) => board?.copy[board.spaces.find((space) => space.id === id)?.labelKey] ?? id ?? '';
function save() {
  if (game) sessionStorage.setItem('local-game', JSON.stringify({ ...game, board, snapshot: state, history }));
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
function candidates() {
  const { turn } = state; const live = turn.seats.filter((seat) => !seat.eliminated).map((seat) => seat.id);
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
function locks() {
  $('local-connection').hidden = online || !game;
  $('local-controls').disabled = busy || !online || !!pending || acknowledgedSeatId !== actorId;
  $('local-actor').disabled = busy || !online || !!pending;
  $('confirm-handoff').disabled = busy || !online || !!pending;
  $('retry-command').disabled = busy || !online;
  $('new-local').disabled = busy;
  $('start-local').disabled = busy;
}
function describe(event) {
  const name = person(event.seatId ?? event.from);
  switch (event.type) {
    case 'MatchStarted': return 'Đã bắt đầu ván chơi chung. Mỗi người có 1.200 xu.';
    case 'Rolled': return `${name} gieo ${event.dice.join(' + ')}.`;
    case 'StartAwarded': return `${name} nhận ${money(event.amount)} khi qua quảng trường.`;
    case 'PropertyBought': return `${name} mua ${spaceName(event.spaceId)} với ${money(event.amount)}.`;
    case 'RentPaid': return `${name} trả ${money(event.amount)} tiền thuê cho ${person(event.to)}.`;
    case 'PaymentSettled': return `${name} trả ${money(event.amount)} cho ${person(event.to)}.`;
    case 'CardDrawn': return `${name}: ${cardCopy[event.cardId] ?? 'Rút một thẻ.'}`;
    case 'BankPaid': return `${name} nhận ${money(event.amount)} từ ngân hàng.`;
    case 'Jailed': return `${name} đến nhà chờ và kết thúc lượt.`;
    case 'JailFeePaid': return `${name} trả phí ra nhà chờ ${money(event.amount)}.`;
    case 'ServiceRolled': return `Xúc xắc tính tiền dịch vụ: ${event.dice.join(' + ')}.`;
    case 'AuctionStarted': return event.kind === 'building' ? 'Mở đấu giá công trình cuối.' : `Mở đấu giá ${spaceName(event.spaceId)}.`;
    case 'AuctionBidAccepted': return `${name} đặt giá ${money(event.amount)}.`;
    case 'AuctionPassed': return `${name} bỏ lượt đấu giá.`;
    case 'AuctionSettled': return `${name} thắng đấu giá với ${money(event.amount)}.`;
    case 'AuctionEndedWithoutBid': return 'Không có giá đặt; tài sản vẫn ở ngân hàng.';
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
function render() {
  if (!state || !board) return;
  const oldActor = $('local-actor').value;
  const wasHandoff = !$('local-handoff').hidden;
  const { turn } = state;
  const required = preferred(); const key = `${turn.phase}:${required}`;
  const allowed = candidates();
  if (requiredKey !== key && !['Auction', 'BuildingDemand'].includes(turn.phase)) actorId = required;
  requiredKey = key;
  if (!allowed.includes(actorId)) actorId = allowed[0];
  $('local-match').dataset.revision = state.revision;
  $('local-setup').hidden = true; $('local-match').hidden = false; $('new-local').hidden = false;
  $('local-turn-heading').textContent = phases[turn.phase] ?? 'Đang chờ quyết định';
  $('local-bank').textContent = `Ngân hàng còn ${turn.stock.houses} nhà và ${turn.stock.hotels} khách sạn.`;
  const active = turn.seats.find((seat) => seat.id === turn.activeSeatId);
  let context = `Lượt của ${person(turn.activeSeatId)} · ${spaceName(board.spaces[active.position].id)}.`;
  if (turn.pendingDebt) context = `${person(turn.pendingDebt.from)} cần trả ${money(turn.pendingDebt.amount)} cho ${person(turn.pendingDebt.to)}. ${cardCopy[turn.pendingDebt.sourceId] ?? (turn.pendingDebt.sourceId === 'jail' ? 'Phí ra nhà chờ' : spaceName(turn.pendingDebt.sourceId))}`;
  if (turn.phase === 'Auction') context = turn.auction.kind === 'building' ? 'Công trình cuối đang được giữ cho cuộc đấu giá. Chọn rõ người đặt giá.' : `Đấu giá ${spaceName(turn.auction.spaceId)}. Chọn rõ người đặt giá hoặc bỏ lượt.`;
  if (turn.phase === 'BuildingDemand') context = 'Công trình cuối được giữ lại. Mọi người được mời cần đăng ký ô hợp lệ hoặc từ chối.';
  $('local-context').textContent = context;
  const chooser = $('local-actor'); chooser.replaceChildren(...allowed.map((id) => { const option = node('option', person(id)); option.value = id; return option; })); chooser.value = actorId;
  $('local-actor-label').hidden = turn.phase === 'Finished';
  const gate = acknowledgedSeatId !== actorId && turn.phase !== 'Finished';
  $('local-handoff').hidden = !gate;
  $('handoff-heading').textContent = `Chuyền máy cho ${person(actorId)}`;
  $('confirm-handoff').textContent = `Tôi là ${person(actorId)} · tiếp tục`;
  $('local-retry').hidden = !pending;
  $('retry-context').textContent = pending ? `Chưa xác nhận được thao tác của ${person(pending.actorId)}. Gửi lại dùng đúng yêu cầu đã lưu, không tạo thêm lần thanh toán.` : '';
  $('local-actions').replaceChildren(decisionControls({ state, board, actorId, submit, selectActor }));
  if (turn.phase !== 'Finished' && actorId !== required && allowed.includes(required) && !['Auction', 'BuildingDemand'].includes(turn.phase)) {
    const back = node('button', `Chuyền về ${person(required)} để tiếp tục lượt`); back.type = 'button'; back.addEventListener('click', () => selectActor(required)); $('local-actions').prepend(back);
  }
  $('local-winner').hidden = turn.phase !== 'Finished';
  $('local-winner').replaceChildren(node('h3', turn.winnerSeatId ? `${person(turn.winnerSeatId)} thắng ván chơi!` : ''), node('p', 'Cả nhà có thể bắt đầu ván mới từ nút phía trên.'));
  $('local-players').replaceChildren(...turn.seats.map((seat, index) => {
    const item = node('li', '', `panel player-card${seat.id === actorId ? ' selected' : ''}`);
    const held = (turn.retainedCards[seat.id] ?? []).map((id) => cardCopy[id]).join(' · ');
    item.append(node('strong', `${index + 1}. ${person(seat.id)}${seat.id === turn.activeSeatId ? ' · đang đến lượt' : ''}`), node('span', money(seat.cash)), node('small', seat.eliminated ? 'Đã phá sản' : seat.jailed ? `Nhà chờ · ${seat.jailAttempts}/3 lần thử` : spaceName(board.spaces[seat.position].id)));
    if (held) item.append(node('small', `Giấy ra: ${held}`)); return item;
  }));
  if (!boardView) boardView = createBoardView($('local-board'));
  boardView.render({ board, state, activeSeatId: turn.activeSeatId, person });
  $('local-spaces').replaceChildren(...board.spaces.map((space) => {
    const owner = turn.ownership[space.id]; const level = turn.buildings[space.id] ?? 0;
    const occupants = turn.seats.filter((seat) => !seat.eliminated && seat.position === space.position).map((seat) => person(seat.id));
    let detail = '';
    if (space.economy) detail = ` Giá ${money(space.economy.price)}; thuê cơ bản ${money(space.economy.rents[0])}, đủ nhóm ${money(space.economy.rents[1])}; thuê với 1–4 nhà và khách sạn: ${space.economy.rents.slice(2).map(money).join(', ')}. Xây mỗi công trình ${money(space.economy.buildingCost)}.`;
    if (space.type === 'transit') detail = ` Giá ${money(space.price)}; thuê theo 1–4 bến: ${board.transit.rents.map(money).join(', ')}.`;
    if (space.type === 'service') detail = ` Giá ${money(space.price)}; thuê bằng 4 hoặc 10 lần tổng một lần gieo riêng.`;
    if (space.type === 'tax') detail = ` Nộp ${money(space.amount)}.`;
    const item = node('li', `Ô ${space.position + 1} · ${board.copy[space.labelKey]}${space.groupId ? ' · ' + space.groupId : ''}.${occupants.length ? ` Đang ở đây: ${occupants.join(', ')}.` : ''}${space.position === active.position ? ' Vị trí của người đang đến lượt.' : ''}${detail}${owner ? ` Chủ: ${person(owner)}. ${turn.mortgages[space.id] ? 'Đang thế chấp.' : 'Chưa thế chấp.'}` : ''}${level ? ` ${level === 5 ? '1 khách sạn' : level + ' nhà'}.` : ''}`); return item;
  }));
  $('local-history').replaceChildren(...history.flatMap(({ events }) => events.map(describe)).filter(Boolean).slice(-12).reverse().map((message) => node('li', message)));
  locks();
  if (gate && (!wasHandoff || oldActor !== actorId)) $('handoff-heading').focus();
  save();
}
async function syncNow() {
  if (!game) return;
  try {
    board ??= await api('/api/local/board');
    const session = game.sessions[0].session;
    let result;
    try { result = await api(`/api/local/sync?since=${state?.revision ?? 0}`, undefined, session); }
    catch (failure) { if (failure.message !== 'ResyncRequired') throw failure; result = await api('/api/local/sync?since=0', undefined, session); history = []; }
    online = true;
    if (errorCode === 'Network' && !pending) error();
    if (!state || state.revision !== result.snapshot.revision || $('local-match').hidden) {
      const before = state; state = result.snapshot;
      history = [...history, ...result.history].slice(-60); render();
      const announcement = result.history.flatMap(({ events }) => events.map(describe)).filter(Boolean).join(' ');
      $('local-announcement').textContent = announcement || (before?.turn.phase !== state.turn.phase ? `${phases[state.turn.phase]} · ${person(preferred())}` : '');
    }
    locks();
  } catch (failure) { online = false; if (failure.message !== 'Network' || pending) error(failure.message); else error(); locks(); }
}
function sync() { syncing ??= syncNow().finally(() => { syncing = undefined; }); return syncing; }
async function sendPending() {
  if (!pending || busy || !online) return;
  busy = true; locks(); error();
  try {
    await api('/api/local/command', pending.command, credential(pending.actorId));
    pending = null; save();
  } catch (failure) {
    if (failure.message !== 'Network') { pending = null; save(); }
    else online = false;
    error(failure.message);
  } finally {
    await sync(); busy = false; render(); locks();
    if (!$('local-handoff').hidden) $('handoff-heading').focus(); else $('local-turn-heading').focus();
  }
}
async function submit(type, payload = {}) {
  if (pending || busy || !online || acknowledgedSeatId !== actorId) return;
  pending = { actorId, command: { id: crypto.randomUUID(), expectedRevision: state.revision, type, payload } }; save();
  await sendPending();
}
$('local-actor').addEventListener('change', (event) => selectActor(event.target.value));
$('confirm-handoff').addEventListener('click', () => { if (!online || busy || pending) return; acknowledgedSeatId = actorId; render(); $('local-turn-heading').focus(); });
$('retry-command').addEventListener('click', sendPending);
$('local-setup-form').addEventListener('submit', async (event) => {
  event.preventDefault(); if (busy) return; busy = true; locks(); error();
  const names = [...new FormData(event.currentTarget).values()].map((name) => name.trim()).filter(Boolean);
  const saved = read('local-creation'); const creation = saved && JSON.stringify(saved.names) === JSON.stringify(names) ? saved : { names, requestId: crypto.randomUUID() };
  sessionStorage.setItem('local-creation', JSON.stringify(creation));
  try {
    const result = await api('/api/local/create', creation);
    game = { sessions: result.sessions }; state = result.snapshot; history = []; pending = null; acknowledgedSeatId = undefined; requiredKey = undefined;
    save(); sessionStorage.removeItem('local-creation');
    board ??= await api('/api/local/board'); online = true; render(); await sync();
  } catch (failure) { error(failure.message); }
  finally { busy = false; locks(); }
});
$('new-local').addEventListener('click', () => {
  if (busy || (state?.status !== 'Finished' && !confirm('Bắt đầu ván mới? Ván hiện tại sẽ không còn được mở từ trang này.'))) return;
  sessionStorage.removeItem('local-game'); sessionStorage.removeItem('local-command'); sessionStorage.removeItem('local-creation'); location.reload();
});
const creation = read('local-creation');
if (creation && !game) creation.names.forEach((name, index) => { $('local-setup-form').elements[`player${index + 1}`].value = name; });
if (state && board) render();
await sync();
setInterval(() => { if (!busy && game) sync(); }, 1000);
