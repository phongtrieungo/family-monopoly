import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { board, rules } from '../domain/synthetic-board.js';
import { createRoomFileStore } from '../rooms/file-store.js';
import { createRoomService, RoomError } from '../rooms/service.js';

const assets = {
  '/': new URL('index.html', import.meta.url),
  '/app.js': new URL('app.js', import.meta.url),
  '/style.css': new URL('style.css', import.meta.url),
  '/vi.js': new URL('vi.js', import.meta.url),
};

const headers = {
  'Cache-Control': 'no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'; base-uri 'none'",
};

export function createRequestHandler(rooms) {
  const leases = new Map();
  return async (request) => {
    const url = new URL(request.url);
    const { pathname } = url;
    const json = (body, status = 200) => Response.json(body, { status, headers });

    if (request.method === 'GET' && Object.hasOwn(assets, pathname)) {
      const file = Bun.file(assets[pathname]);
      return new Response(file, { headers: { ...headers, 'Content-Type': file.type } });
    }
    if (request.method === 'GET' && pathname === '/api/board') return json(board);

    const session = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
    const renew = (credential) => {
      clearTimeout(leases.get(credential));
      const timeout = setTimeout(() => {
        leases.delete(credential);
        try {
          rooms.disconnect(credential);
        } catch (error) {
          console.error('Unable to expire a room connection', error.name);
        }
      }, 15_000);
      timeout.unref();
      leases.set(credential, timeout);
    };

    try {
      if (request.method === 'GET' && pathname === '/api/sync') {
        const snapshot = rooms.reconnect(session);
        renew(session);
        const revision = Number(url.searchParams.get('since') ?? snapshot.revision);
        return json({ snapshot, history: rooms.eventsSince(session, revision) });
      }
      if (request.method === 'POST' && ['/api/create', '/api/join', '/api/command'].includes(pathname)) {
        const origin = request.headers.get('Origin');
        if (origin && origin !== url.origin) return json({ error: 'Unauthorized' }, 403);
        if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
          return json({ error: 'InvalidCommand' }, 415);
        }
        const body = await request.json();
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return json({ error: 'InvalidCommand' }, 400);
        }
        if (pathname === '/api/command') return json(rooms.submit(session, body));
        if (typeof body.name !== 'string' || body.name.trim().length > 32) {
          return json({ error: 'InvalidName' }, 400);
        }
        const result = pathname === '/api/create' ? rooms.create(body.name) : rooms.join(body.invite, body.name);
        renew(result.session);
        return json(result, 201);
      }
      return json({ error: 'NotFound' }, 404);
    } catch (error) {
      if (error instanceof RoomError) {
        const status = error.code === 'Unauthorized' ? 401 : error.code === 'ResyncRequired' ? 409 : 400;
        return json({ error: error.code }, status);
      }
      if (error instanceof SyntaxError) return json({ error: 'InvalidCommand' }, 400);
      // The reducer uses ordinary errors for rejected moves.
      if (pathname === '/api/command' && !error.code) return json({ error: 'ActionRejected' }, 400);
      console.error('Room request failed', error.name);
      return json({ error: 'ServerUnavailable' }, 503);
    }
  };
}

if (import.meta.main) {
  const storePath = process.env.ROOM_STORE ?? join(mkdtempSync(join(tmpdir(), 'family-monopoly-')), 'rooms.json');
  const rooms = createRoomService({ store: createRoomFileStore(storePath), board, rules, startingCash: 100 });
  const server = Bun.serve({
    hostname: '127.0.0.1', port: Number(process.env.PORT ?? 3000),
    maxRequestBodySize: 4096, fetch: createRequestHandler(rooms),
  });
  console.log(`Local: ${server.url}`);
}
