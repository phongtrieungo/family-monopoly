const supportedTypes = new Set(['start', 'inert', 'property']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isId(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isAmount(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function validateBoard(board, rules) {
  if (rules?.id !== 'synthetic-prototype' || rules.version !== 1) {
    throw new Error('Unsupported rules profile');
  }

  if (!isId(board?.id) || !Number.isSafeInteger(board.version) || board.version < 1 ||
      !Array.isArray(board.spaces) || board.spaces.length === 0 ||
      !Array.isArray(board.groups) || !isRecord(board.economy)) {
    throw new Error('Invalid board definition');
  }

  const groups = new Set();
  for (const group of board.groups) {
    if (!isId(group?.id) || groups.has(group.id)) {
      throw new Error('Invalid or duplicate property group');
    }
    groups.add(group.id);
  }

  for (const [id, terms] of Object.entries(board.economy)) {
    if (!isId(id) || !isAmount(terms?.price) || !isAmount(terms?.rent)) {
      throw new Error('Invalid economy entry');
    }
  }

  const spaceIds = new Set();
  let startCount = 0;
  for (const [position, space] of board.spaces.entries()) {
    if (!isId(space?.id) || spaceIds.has(space.id) || space.position !== position ||
        !isId(space.labelKey) || !supportedTypes.has(space.type)) {
      throw new Error('Invalid or duplicate board space');
    }
    spaceIds.add(space.id);
    if (space.type === 'start') startCount += 1;
    if (space.type === 'property' &&
        (!groups.has(space.groupId) || !isId(space.economyId) || !Object.hasOwn(board.economy, space.economyId))) {
      throw new Error('Property references an unknown group or economy entry');
    }
  }

  if (startCount !== 1 || board.spaces[0].type !== 'start') {
    throw new Error('Board must have exactly one start space at position zero');
  }
}
