import { randomInt, randomUUID } from 'node:crypto';

import { createPropertyTurnReducer } from '../domain/property-turn.js';
import { createVnOriginalMatch, reduceVnOriginalTurn } from '../domain/vn-original-turn.js';
import { vnOriginalDecks } from '../domain/vn-original-content.js';

export class RoomError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function createSeat(name) {
  if (typeof name !== 'string' || !name.trim()) throw new RoomError('InvalidName');
  return { id: randomUUID(), session: randomUUID(), name: name.trim(), ready: false, connected: true };
}

function authenticate(rooms, session) {
  for (const room of rooms) {
    const seat = room.seats.find((seat) => seat.session === session);
    if (seat) return { room, seat };
  }
  throw new RoomError('Unauthorized');
}

function snapshot(room, seat) {
  const turn = room.turn && {
    phase: room.turn.phase,
    activeSeatId: room.turn.activeSeatId,
    seats: room.turn.seats.map(({ id, position, cash, jailed, jailAttempts, eliminated }) => ({ id, position, cash, ...(jailed !== undefined ? { jailed, jailAttempts, eliminated: !!eliminated } : {}) })),
    ownership: room.turn.ownership,
    auction: room.turn.auction,
    ...(room.turn.content ? {
      mortgages: room.turn.mortgages, buildings: room.turn.buildings, stock: room.turn.stock,
      retainedCards: room.turn.retainedCards, pendingDebt: room.turn.pendingDebt,
      acquisition: room.turn.acquisition, buildingDemand: room.turn.buildingDemand,
      trade: room.turn.trade, winnerSeatId: room.turn.winnerSeatId,
    } : {}),
  };
  return structuredClone({
    roomId: room.id,
    selfSeatId: seat.id,
    hostSeatId: room.hostSeatId,
    status: room.status,
    revision: room.revision,
    seats: room.seats.map(({ id, name, ready, connected }) => ({ id, name, ready, connected })),
    profile: room.profile,
    turn,
  });
}

function record(room, events) {
  room.revision += 1;
  const entry = { revision: room.revision, events };
  room.history.push(entry);
  return entry;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}

function commandPayload(type, payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new RoomError('InvalidCommand');
  }
  const keys = Object.keys(payload);
  if (type === 'Ready' && keys.length === 1 && typeof payload.ready === 'boolean') return payload.ready;
  if (type === 'Bid' && keys.length === 1 && Number.isSafeInteger(payload.amount)) return payload.amount;
  if (['Start', 'Close', 'Roll', 'Buy', 'Decline', 'Pass', 'EndTurn'].includes(type) && keys.length === 0) {
    return null;
  }
  const schemas = {
    SettleDebt: [], Bankrupt: [], PayJail: [], AcceptTrade: [], CancelTrade: [],
    UseReleaseCard: ['cardId'], Mortgage: ['spaceId'], ReleaseMortgage: ['spaceId'],
    SellBuilding: ['spaceId'], Build: ['spaceId'], ChooseMortgage: ['choice'],
    LiquidateHotels: ['groupId', 'finalCounts'], BuildingDemand: ['spaceId'], BuildingOffer: ['accept'],
    OfferTrade: ['targetSeatId', 'give', 'receive'],
  };
  const schema = Object.hasOwn(schemas, type) ? schemas[type] : null;
  if (schema && keys.length === schema.length && schema.every((key) => Object.hasOwn(payload, key))) {
    return JSON.stringify(canonical(payload));
  }
  throw new RoomError('InvalidCommand');
}

export function createRoomService({
  store, board, rules, startingCash,
  rollDice = () => [randomInt(1, 7), randomInt(1, 7)],
  shuffleDeck = (ids) => {
    const result = [...ids];
    for (let i = result.length - 1; i > 0; i -= 1) { const j = randomInt(0, i + 1); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  },
}) {
  const fullMatch = rules.id === 'vn-original-v1';
  if (fullMatch && (rules.version !== 1 || board.id !== 'vn-neighborhood-v1' || board.version !== 1)) throw new RoomError('ProfileUnavailable');
  const reduce = fullMatch ? reduceVnOriginalTurn : createPropertyTurnReducer(board, rules);
  const profile = {
    board: { id: board.id, version: board.version },
    rules: { id: rules.id, version: rules.version },
  };
  if (!Number.isSafeInteger(startingCash) || startingCash < 0) throw new RoomError('InvalidStartingCash');

  function setConnection(session, connected) {
    const rooms = store.read();
    const { room, seat } = authenticate(rooms, session);
    if (seat.connected !== connected) {
      seat.connected = connected;
      record(room, [{ type: 'ConnectionChanged', seatId: seat.id, connected }]);
      store.write(rooms);
    }
    return snapshot(room, seat);
  }

  return {
    create(name) {
      const rooms = store.read();
      const seat = createSeat(name);
      const room = {
        id: randomUUID(), invite: randomUUID(), hostSeatId: seat.id, status: 'Lobby',
        seats: [seat], revision: 0, receipts: [], history: [], profile: null, turn: null,
      };
      rooms.push(room);
      store.write(rooms);
      return { invite: room.invite, session: seat.session, snapshot: snapshot(room, seat) };
    },

    join(invite, name) {
      const rooms = store.read();
      const room = rooms.find((room) => room.invite === invite);
      if (!room) throw new RoomError('InvalidInvite');
      if (room.status === 'Closed') throw new RoomError('RoomClosed');
      if (room.status !== 'Lobby') throw new RoomError('RoomStarted');
      if (room.seats.length >= 4) throw new RoomError('RoomFull');
      const seat = createSeat(name);
      room.seats.push(seat);
      record(room, [{ type: 'SeatJoined', seatId: seat.id, name: seat.name }]);
      store.write(rooms);
      return { session: seat.session, snapshot: snapshot(room, seat) };
    },

    reconnect(session) {
      return setConnection(session, true);
    },

    disconnect(session) {
      return setConnection(session, false);
    },

    eventsSince(session, revision) {
      const { room } = authenticate(store.read(), session);
      if (!Number.isSafeInteger(revision) || revision < 0 || revision > room.revision) {
        throw new RoomError('ResyncRequired');
      }
      return structuredClone(room.history.filter((entry) => entry.revision > revision));
    },

    submit(session, command) {
      const rooms = store.read();
      const { room, seat } = authenticate(rooms, session);
      const { id, expectedRevision, type, payload = {} } = command ?? {};
      if (typeof id !== 'string' || !id.trim() || !Number.isSafeInteger(expectedRevision) ||
          expectedRevision < 0) throw new RoomError('InvalidCommand');
      const value = commandPayload(type, payload);
      const receipt = room.receipts.find((receipt) => receipt.seatId === seat.id && receipt.id === id);
      if (receipt) {
        if (receipt.type !== type || receipt.value !== value) throw new RoomError('CommandIdConflict');
        return receipt.result;
      }
      if (expectedRevision !== room.revision) throw new RoomError('ResyncRequired');
      if (!seat.connected) throw new RoomError('SeatDisconnected');

      let events;
      if (type === 'Ready' || type === 'Start' || type === 'Close') {
        if (room.status !== 'Lobby') throw new RoomError('LobbyRequired');
        if (type === 'Ready') {
          seat.ready = value;
          events = [{ type: 'ReadinessChanged', seatId: seat.id, ready: value }];
        } else {
          if (room.hostSeatId !== seat.id) throw new RoomError('HostRequired');
          if (type === 'Close') {
            room.status = 'Closed';
            events = [{ type: 'LobbyClosed' }];
          } else {
            if (room.seats.length < 2 || room.seats.some((seat) => !seat.ready || !seat.connected)) {
              throw new RoomError('SeatsNotReady');
            }
            room.status = 'InMatch';
            room.profile = profile;
            room.turn = {
              phase: 'AwaitRoll',
              activeSeatId: room.hostSeatId,
              seats: room.seats.map(({ id }) => ({ id, position: 0, cash: startingCash })),
              ownership: {},
            };
            if (fullMatch) {
              let contenders = room.seats.map(({ id }) => id);
              const setupRolls = [];
              do {
                const round = contenders.map((seatId) => ({ seatId, dice: rollDice() }));
                if (round.some(({ dice }) => !Array.isArray(dice) || dice.length !== 2 || !dice.every((die) => Number.isInteger(die) && die >= 1 && die <= 6))) throw new RoomError('InvalidDice');
                setupRolls.push(round);
                const high = Math.max(...round.map(({ dice }) => dice[0] + dice[1]));
                contenders = round.filter(({ dice }) => dice[0] + dice[1] === high).map(({ seatId }) => seatId);
                if (setupRolls.length > 1000) throw new RoomError('SetupRollLimit');
              } while (contenders.length > 1);
              const deckOrders = Object.fromEntries(Object.entries(vnOriginalDecks).map(([id, cards]) => [id, shuffleDeck(cards.map((card) => card.id))]));
              room.turn = createVnOriginalMatch(room.seats.map(({ id }) => id), { setupRolls, deckOrders });
            }
            events = [{ type: 'MatchStarted', ...(fullMatch ? { setupRolls: room.turn.setupRolls } : {}) }];
          }
        }
      } else {
        if (room.status !== 'InMatch') throw new RoomError('MatchRequired');
        if (JSON.stringify(room.profile) !== JSON.stringify(profile)) throw new RoomError('ProfileUnavailable');
        const shouldRoll = type === 'Roll' && room.turn.activeSeatId === seat.id && room.turn.phase === 'AwaitRoll';
        const fields = typeof value === 'string' ? JSON.parse(value) : {};
        const result = reduce(room.turn, { ...fields, type, actorId: seat.id, amount: value },
          fullMatch ? { ...(shouldRoll ? { dice: rollDice() } : {}), rollDice } : shouldRoll ? { dice: rollDice() } : undefined);
        room.turn = result.state;
        events = result.events;
        if (room.turn.phase === 'Finished') room.status = 'Finished';
      }
      const result = record(room, events);
      room.receipts.push({ seatId: seat.id, id, type, value, result });
      store.write(rooms);
      return result;
    },
  };
}
