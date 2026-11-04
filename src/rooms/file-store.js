import { randomUUID } from 'node:crypto';
import { readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';

// Single-process prototype store. Each replacement commits the room, receipts
// and event records together. Keep the file in a private server directory.
export function createRoomFileStore(path) {
  return {
    read() {
      try {
        return JSON.parse(readFileSync(path, 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
      }
    },
    write(rooms) {
      const temporaryPath = `${path}.${randomUUID()}.tmp`;
      try {
        writeFileSync(temporaryPath, JSON.stringify(rooms), { mode: 0o600, flag: 'wx', flush: true });
        renameSync(temporaryPath, path);
      } finally {
        rmSync(temporaryPath, { force: true });
      }
    },
  };
}
