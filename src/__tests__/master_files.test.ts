import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { readMaster, writeMaster, upsertItemsFromExtract } from '../engine/master';
import type { MasterJson, ExtractRecord } from '../types/engine';
import { contentHashFor } from '../utils/hash';

function mkTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rustle-master-'));
}

describe('master.json read/write and upsert', () => {
  it('writes and reads master.json; upserts items from extract', () => {
    const cwd = mkTmp();
    let master: MasterJson = { version: 2, generatedAt: new Date().toISOString(), items: {} };

    const rec: ExtractRecord = {
      fingerprint: 'fp1',
      file: 'src/App.tsx',
      loc: { start: 10, end: 20 },
      original: 'Hello',
      contentHash: contentHashFor('Hello'),
      tag: null,
    } as any;

    master = upsertItemsFromExtract(master, [rec]);
    writeMaster(master, cwd);

    const read = readMaster(cwd);
    expect(read.items['fp1']).toBeTruthy();
    expect(read.items['fp1'].source).toBe('Hello');
  });
});

