import { errors, labels, money, phases } from './vi.js';

const $ = (id) => document.getElementById(id);
const entry = $('entry-form');
const inviteFromUrl = new URL(location.href).searchParams.get('invite');
entry.elements.invite.value = inviteFromUrl ?? '';
let session = sessionStorage.getItem('seat');
let invite = sessionStorage.getItem('invite');
let board;
let state;
let history = [];
let syncRequest;
let busy = false;
let online = true;

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function notice(code) {
  $('error').hidden = !code;
  $('error').textContent = code ? (errors[code] ?? errors.Unknown) : '';
}

async function api(path, body) {
  let response;
  try {
    response = await fetch(path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        ...(session && { Authorization: `Bearer ${session}` }),
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error('Network');
  }
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

function setOnline(value) {
  if (online === value) return;
  online = value;
  $('connection').hidden = value;
  $('connection').textContent = value ? '' : errors.Network;
  updateControls();
}

function updateControls() {
  for (const control of document.querySelectorAll('[data-command]')) {
    control.disabled = busy || !online || control.dataset.allowed === 'false';
  }
}

function person(id) {
  return state.seats.find((seat) => seat.id === id)?.name ?? 'Ngân hàng';
}

function action(type, label, payload, allowed = true) {
  const button = element('button', label, ['Close', 'Decline', 'Pass'].includes(type) ? 'secondary' : '');
  button.type = 'button';
  button.dataset.command = type;
  button.dataset.allowed = String(allowed);
  button.addEventListener('click', () => submit(type, payload));
  return button;
}

function renderLobby() {
  $('invite-panel').hidden = !invite;
  if (invite) {
    const link = new URL(location.pathname, location.origin);
    link.searchParams.set('invite', invite);
    $('invite-link').value = link.href;
  }
  $('roster').replaceChildren(...state.seats.map((seat) => element('li',
    `${seat.name}${seat.id === state.selfSeatId ? ' (bạn)' : ''} · ${seat.connected
      ? (seat.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng') : 'Mất kết nối'}`)));
  const self = state.seats.find((seat) => seat.id === state.selfSeatId);
  const buttons = [action('Ready', self.ready ? 'Hủy sẵn sàng' : 'Sẵn sàng', { ready: !self.ready })];
  if (state.hostSeatId === self.id) {
    buttons.push(action('Start', 'Bắt đầu', {}, state.seats.length >= 2 &&
      state.seats.every((seat) => seat.ready && seat.connected)), action('Close', 'Đóng phòng'));
  }
  $('lobby-actions').replaceChildren(...buttons);
}

function describeEvent(event) {
  const space = labels[board.spaces.find(({ id }) => id === event.spaceId)?.labelKey];
  switch (event.type) {
    case 'Rolled': return `${person(event.seatId)} gieo ${event.dice.join(' + ')} và đến ${space}.`;
    case 'PropertyBought': return `${person(event.from)} mua ${space} với ${money(event.amount)}.`;
    case 'RentPaid': return `${person(event.from)} trả ${money(event.amount)} tiền thuê cho ${person(event.to)}.`;
    case 'AuctionStarted': return `Mở đấu giá ${space}.`;
    case 'AuctionBidAccepted': return `${person(event.seatId)} trả giá ${money(event.amount)}.`;
    case 'AuctionSettled': return `${person(event.from)} thắng đấu giá ${space} với ${money(event.amount)}.`;
    case 'AuctionEndedWithoutBid': return `${space} vẫn thuộc ngân hàng.`;
    case 'TurnEnded': return `Đến lượt ${person(event.nextSeatId)}.`;
    default: return '';
  }
}

function renderMatch() {
  const { turn, selfSeatId } = state;
  const active = turn.seats.find(({ id }) => id === turn.activeSeatId);
  const self = turn.seats.find(({ id }) => id === selfSeatId);
  const destination = board.spaces[active.position];
  const mine = active.id === selfSeatId;
  const here = `Ô ${destination.position + 1} · ${labels[destination.labelKey]}`;
  $('turn-heading').textContent = phases[turn.phase];
  $('board').replaceChildren(...board.spaces.map((space) => {
    const tile = element('div', '', space.id === destination.id ? 'tile current' : 'tile');
    const occupants = turn.seats.filter(({ position }) => position === space.position);
    tile.append(element('small', `Ô ${space.position + 1}`),
      element('strong', labels[space.labelKey]),
      element('span', occupants.map(({ id }) => person(id)).join(', ') || '—'));
    return tile;
  }));
  $('spaces').replaceChildren(...board.spaces.map((space) => {
    const owner = turn.ownership[space.id];
    const detail = owner ? ` · Chủ sở hữu: ${person(owner)}` : '';
    return element('li', `Ô ${space.position + 1} · ${labels[space.labelKey]}${detail}${space.id === destination.id ? ' · Vị trí hiện tại' : ''}`);
  }));
  $('players').replaceChildren(...turn.seats.map(({ id, cash }) => element('li',
    `${person(id)}${id === selfSeatId ? ' (bạn)' : ''} · ${money(cash)}`)));
  const controls = [];
  let detail = '';
  if (turn.phase === 'AwaitRoll' && mine) controls.push(action('Roll', 'Gieo xúc xắc'));
  if (turn.phase === 'AwaitEnd' && mine) controls.push(action('EndTurn', 'Kết thúc lượt'));
  if (turn.phase === 'AwaitPurchase') {
    const { price, rent } = board.economy[destination.economyId];
    detail = ` Giá mua ${money(price)}, tiền thuê ${money(rent)}. Từ chối sẽ mở đấu giá.`;
    if (mine) controls.push(action('Buy', `Mua với ${money(price)}`, {}, self.cash >= price),
      action('Decline', 'Từ chối và đấu giá'));
  }
  if (turn.phase === 'Auction') {
    const { eligibleSeatIds, highBid } = turn.auction;
    const minimum = (highBid?.amount ?? 0) + 1;
    detail = highBid ? ` ${person(highBid.seatId)} đang dẫn đầu với ${money(highBid.amount)}.` : ' Chưa có giá đặt.';
    if (eligibleSeatIds.includes(selfSeatId)) {
      if (self.cash >= minimum) {
        const form = element('form');
        const label = element('label', `Giá đặt · tối thiểu ${money(minimum)}`);
        const input = element('input');
        input.id = 'bid-amount';
        input.type = 'number';
        input.min = minimum;
        input.max = self.cash;
        input.required = true;
        input.inputMode = 'numeric';
        input.value = minimum;
        input.dataset.command = 'BidAmount';
        label.append(input);
        const button = element('button', 'Đặt giá');
        button.dataset.command = 'Bid';
        form.append(label, button);
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          submit('Bid', { amount: input.valueAsNumber });
        });
        controls.push(form);
      }
      if (highBid?.seatId !== selfSeatId) controls.push(action('Pass', 'Bỏ lượt đấu giá'));
    }
  }
  $('turn-context').textContent = `${mine ? 'Lượt của bạn' : `Lượt của ${person(active.id)}`} · ${here}.${detail}`;
  $('turn-actions').replaceChildren(...controls);
  const events = history.flatMap(({ events }) => events.map(describeEvent)).filter(Boolean);
  $('history').replaceChildren(...events.slice(-8).reverse().map((message) => element('li', message)));
}

function render(next) {
  const previous = state?.status;
  const focused = document.activeElement;
  const command = focused?.dataset.command;
  const amount = $('bid-amount')?.value;
  state = next;
  $('entry').hidden = next.status !== 'Closed';
  $('lobby').hidden = next.status !== 'Lobby';
  $('match').hidden = next.status !== 'InMatch';
  if (next.status === 'Lobby') renderLobby();
  if (next.status === 'InMatch') renderMatch();
  if (next.status === 'Closed') {
    sessionStorage.removeItem('seat');
    sessionStorage.removeItem('invite');
    session = invite = undefined;
    notice('RoomClosed');
    entry.elements.name.focus();
  }
  if (amount && $('bid-amount') && Number(amount) >= Number($('bid-amount').min)) $('bid-amount').value = amount;
  updateControls();
  if (next.status === 'Lobby' && previous !== next.status) $('lobby-heading').focus();
  if (next.status === 'InMatch' && previous !== next.status) $('turn-heading').focus();
  if (command) {
    const replacement = Array.from(document.querySelectorAll('[data-command]'))
      .find((node) => node.dataset.command === command && !node.disabled && !node.closest('[hidden]'));
    if (replacement) replacement.focus();
    else if (next.status === 'InMatch') $('turn-heading').focus();
    else if (next.status === 'Lobby') $('lobby-heading').focus();
  }
}

async function refreshSnapshot() {
  try {
    board ??= await api('/api/board');
    const result = await api(`/api/sync?since=${state?.revision ?? 0}`);
    setOnline(true);
    if (!state || state.revision !== result.snapshot.revision) {
      history = [...history, ...result.history].slice(-60);
      render(result.snapshot);
      const messages = result.history.flatMap(({ events }) => events.map(describeEvent)).filter(Boolean);
      if (messages.length) $('announcement').textContent = messages.join(' ');
    }
  } catch (error) {
    if (error.message === 'Unauthorized') {
      sessionStorage.removeItem('seat');
      sessionStorage.removeItem('invite');
      state = session = invite = undefined;
      $('entry').hidden = false;
      $('lobby').hidden = $('match').hidden = true;
      notice(error.message);
      setOnline(true);
    } else {
      if (error.message === 'ResyncRequired') { state = undefined; history = []; }
      setOnline(false);
    }
  }
}

function sync() {
  if (!session) return;
  syncRequest ??= refreshSnapshot().finally(() => { syncRequest = undefined; });
  return syncRequest;
}

async function submit(type, payload) {
  if (busy || !online) return;
  const focused = document.activeElement?.dataset.command;
  const expectedRevision = state.revision;
  busy = true;
  updateControls();
  notice();
  try {
    await syncRequest;
    if (!session || !online || !state) return;
    await api('/api/command', { id: crypto.randomUUID(), expectedRevision, type, payload });
  } catch (error) {
    notice(error.message);
    if (error.message === 'Network') setOnline(false);
  } finally {
    await sync();
    busy = false;
    updateControls();
    if (focused && document.activeElement === document.body) {
      const replacement = Array.from(document.querySelectorAll('[data-command]'))
        .find((node) => node.dataset.command === focused && !node.disabled && !node.closest('[hidden]'));
      if (replacement) replacement.focus();
      else if (state?.status === 'InMatch') $('turn-heading').focus();
      else if (state?.status === 'Lobby') $('lobby-heading').focus();
    }
  }
}

entry.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  notice();
  try {
    const mode = event.submitter?.value ?? (inviteFromUrl ? 'join' : 'create');
    const result = await api(`/api/${mode}`, {
      name: entry.elements.name.value, invite: entry.elements.invite.value.trim(),
    });
    session = result.session;
    invite = result.invite;
    sessionStorage.setItem('seat', session);
    if (invite) sessionStorage.setItem('invite', invite);
    else sessionStorage.removeItem('invite');
    history = [];
    render(result.snapshot);
  } catch (error) {
    notice(error.message);
  } finally {
    busy = false;
    updateControls();
  }
});

$('copy-invite').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('invite-link').value);
    $('announcement').textContent = 'Đã sao chép liên kết mời.';
  } catch {
    $('invite-link').select();
  }
});
await sync();
setInterval(() => { if (!busy) sync(); }, 1000);
