import { createPropertyTurnReducer } from '../../src/domain/property-turn.js';
import { board, rules } from '../../src/domain/synthetic-board.js';

// A separate in-memory synthetic room. This server never reads the main room store.
const reduce = createPropertyTurnReducer(board, rules);
let turn;
let revision;
let receipts;
let lastEvents;
const fresh = () => ({ phase: 'AwaitRoll', activeSeatId: 'host', seats: [
  { id: 'host', position: 0, cash: 100 }, { id: 'guest', position: 0, cash: 100 },
], ownership: { rent: 'guest' } });
function reset() { turn = fresh(); revision = 0; receipts = new Map(); lastEvents = []; }
reset();
const view = () => ({ revision, turn, events: lastEvents });
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/style.css': ['style.css', 'text/css; charset=utf-8'],
  '/build/index.js': ['build/index.js', 'text/javascript; charset=utf-8'],
};
export function createSpikeServer(port = Number(process.env.SPIKE_PORT ?? 3001)) {
  reset();
  return Bun.serve({
  hostname: '127.0.0.1', port,
  async fetch(request) {
    const url = new URL(request.url);
    const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (request.method === 'GET' && files[url.pathname]) {
      const [path, type] = files[url.pathname];
      return new Response(Bun.file(new URL(`./public/${path}`, import.meta.url)), { headers: { ...headers, 'Content-Type': type } });
    }
    if (request.method === 'GET' && url.pathname === '/api/state') return Response.json(view(), { headers });
    if (request.method === 'POST' && url.pathname === '/api/reset') { reset(); return Response.json(view(), { headers }); }
    if (request.method === 'POST' && url.pathname === '/api/roll') {
      try {
        const { id, expectedRevision } = await request.json();
        if (typeof id !== 'string' || !id || !Number.isSafeInteger(expectedRevision)) throw Error('Invalid command');
        if (receipts.has(id)) {
          const receipt = receipts.get(id);
          if (receipt.expectedRevision !== expectedRevision) return Response.json({ error: 'conflict' }, { status: 409, headers });
          return Response.json(receipt.result, { headers });
        }
        if (expectedRevision !== revision) return Response.json({ error: 'stale' }, { status: 409, headers });
        const result = reduce(turn, { type: 'Roll', actorId: 'host' }, { dice: [1, 1] });
        turn = result.state; revision += 1; lastEvents = result.events;
        const accepted = view(); receipts.set(id, { expectedRevision, result: accepted });
        return Response.json(accepted, { headers });
      } catch { return Response.json({ error: 'invalid' }, { status: 400, headers }); }
    }
    return new Response('Not found', { status: 404, headers });
  },
  });
}
if (import.meta.main) {
  const server = createSpikeServer();
  console.log(`ST-201 synthetic renderer comparison: ${server.url}`);
}
