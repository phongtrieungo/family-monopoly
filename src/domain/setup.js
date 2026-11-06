// Deterministic DP-06 setup order, using only recorded authoritative rolls.
export function chooseFirstSeat(seatIds, rollRounds) {
  if (!Array.isArray(seatIds) || seatIds.length < 2 || new Set(seatIds).size !== seatIds.length || seatIds.some((id) => typeof id !== 'string' || !id.trim()) ||
      !Array.isArray(rollRounds) || rollRounds.length === 0) throw new Error('Invalid setup rolls');
  let contenders = [...seatIds];
  for (const [roundIndex, round] of rollRounds.entries()) {
    if (!Array.isArray(round) || round.length !== contenders.length ||
        new Set(round.map(({ seatId }) => seatId)).size !== contenders.length ||
        round.some(({ seatId, dice }) => !contenders.includes(seatId) || !Array.isArray(dice) || dice.length !== 2 ||
          !dice.every((die) => Number.isInteger(die) && die >= 1 && die <= 6))) {
      throw new Error('Setup round must contain one valid roll per tied seat');
    }
    const scores = round.map(({ dice }) => dice[0] + dice[1]);
    const high = Math.max(...scores);
    contenders = round.filter((_, index) => scores[index] === high).map(({ seatId }) => seatId);
    if (contenders.length === 1) {
      if (roundIndex !== rollRounds.length - 1) throw new Error('Setup history continues after a winner');
      return { firstSeatId: contenders[0], rolls: structuredClone(rollRounds) };
    }
  }
  throw new Error('Setup roll history ends with a tie');
}
