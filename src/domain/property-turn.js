import { validateBoard } from './board.js';

export function createPropertyTurnReducer(board, rules) {
  validateBoard(board, rules);
  const { spaces, economy } = structuredClone(board);

  // The caller supplies committed turn state and the authoritative roll.
  return function reduceTurn(state, command, { dice } = {}) {
    const activeIndex = state.seats.findIndex((seat) => seat.id === state.activeSeatId);
    const activeSeat = state.seats[activeIndex];
    if (!activeSeat || command.actorId !== activeSeat.id) {
      throw new Error('Only the active seat can act');
    }

    const events = [];
    let next = { ...state, phase: 'AwaitEnd' };

    switch (command.type) {
      case 'Roll': {
        if (state.phase !== 'AwaitRoll') throw new Error('Roll is not allowed in this phase');
        if (!Array.isArray(dice) || dice.length !== 2 ||
            ![dice[0], dice[1]].every((die) => Number.isInteger(die) && die >= 1 && die <= 6)) {
          throw new Error('Roll requires two authoritative dice');
        }

        const position = (activeSeat.position + dice[0] + dice[1]) % spaces.length;
        const space = spaces[position];
        const seats = state.seats.slice();
        seats[activeIndex] = { ...activeSeat, position };
        next.seats = seats;
        events.push({ type: 'Rolled', seatId: activeSeat.id, dice: [...dice], spaceId: space.id });

        if (space.type !== 'property') break;
        if (!Object.hasOwn(state.ownership, space.id)) {
          next.phase = 'AwaitPurchase';
          break;
        }

        const ownerId = state.ownership[space.id];
        if (ownerId === activeSeat.id) break;
        const ownerIndex = seats.findIndex((seat) => seat.id === ownerId);
        const owner = seats[ownerIndex];
        const { rent } = economy[space.economyId];
        if (!owner) throw new Error('Property owner is missing from the turn');
        if (activeSeat.cash < rent) throw new Error('Rent exceeds the synthetic profile balance');
        if (!Number.isSafeInteger(owner.cash + rent)) throw new Error('Rent exceeds the balance limit');
        seats[activeIndex].cash -= rent;
        seats[ownerIndex] = { ...owner, cash: owner.cash + rent };
        events.push({ type: 'RentPaid', spaceId: space.id, from: activeSeat.id, to: ownerId, amount: rent });
        break;
      }

      case 'Buy': {
        if (state.phase !== 'AwaitPurchase') throw new Error('Buy is not allowed in this phase');
        const space = spaces[activeSeat.position];
        if (space?.type !== 'property' || Object.hasOwn(state.ownership, space.id)) {
          throw new Error('Space is unavailable for purchase');
        }
        const { price } = economy[space.economyId];
        if (activeSeat.cash < price) throw new Error('Insufficient cash to buy property');

        next.seats = state.seats.slice();
        next.seats[activeIndex] = { ...activeSeat, cash: activeSeat.cash - price };
        next.ownership = { ...state.ownership, [space.id]: activeSeat.id };
        events.push({ type: 'PropertyBought', spaceId: space.id, from: activeSeat.id, amount: price });
        break;
      }

      case 'EndTurn': {
        if (state.phase !== 'AwaitEnd') throw new Error('EndTurn is not allowed in this phase');
        const nextSeat = state.seats[(activeIndex + 1) % state.seats.length];
        next = { ...state, phase: 'AwaitRoll', activeSeatId: nextSeat.id };
        events.push({ type: 'TurnEnded', seatId: activeSeat.id, nextSeatId: nextSeat.id });
        break;
      }

      default:
        throw new Error('Unsupported turn command');
    }

    return { state: next, events };
  };
}
