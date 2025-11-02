import fs from 'fs';
import path from 'path';
import { MasterJson, MasterItem, ExtractRecord } from '../types/engine';
import { contentHashFor } from '../utils/hash';

function resolveRootMaster(cwd = process.cwd()): string {
  return path.join(cwd, 'rustle', 'master.json');
}

export function readMaster(cwd = process.cwd()): MasterJson {
  const rootFile = resolveRootMaster(cwd);
  const publicFile = path.join(cwd, 'public', 'rustle', 'master.json');
  const tryFiles = [publicFile, rootFile];
  for (const file of tryFiles) {
    if (fs.existsSync(file)) {
      try {
        const raw = fs.readFileSync(file, 'utf8');
        const parsed = JSON.parse(raw) as MasterJson;
        if (parsed && typeof parsed === 'object' && parsed.items) return parsed;
      } catch (_e) {
        /* ignore and try next */
      }
    }
  }
  return { version: 2, generatedAt: new Date().toISOString(), items: {} };
}

export function writeMaster(master: MasterJson, cwd = process.cwd()): void {
  const file = resolveRootMaster(cwd);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  master.generatedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(master, null, 2));
}

export type Delta = {
  toSend: ExtractRecord[];
  unchanged: ExtractRecord[];
};

export function computeDelta(records: ExtractRecord[], master: MasterJson): Delta {
  const toSend: ExtractRecord[] = [];
  const unchanged: ExtractRecord[] = [];

  for (const rec of records) {
    const existing = master.items[rec.fingerprint];
    const ch = rec.contentHash ?? contentHashFor(rec.original);
    if (!existing) {
      toSend.push({ ...rec, contentHash: ch });
    } else if (existing.contentHash !== ch) {
      toSend.push({ ...rec, contentHash: ch });
    } else {
      unchanged.push({ ...rec, contentHash: ch });
    }
  }

  return { toSend, unchanged };
}

export function mergeTranslations(master: MasterJson, translated: Array<{ fingerprint: string; locale: string; text: string }>): MasterJson {
  for (const t of translated) {
    const item: MasterItem = master.items[t.fingerprint] ?? {
      fingerprint: t.fingerprint,
      file: '',
      loc: { start: 0, end: 0 },
      source: '',
      contentHash: '',
      translations: {},
      status: 'missing',
      version: 0,
    };
    item.translations[t.locale] = t.text;
    item.status = 'translated';
    item.version = (item.version ?? 0) + 1;
    item.lastTranslatedAt = new Date().toISOString();
    master.items[t.fingerprint] = item;

    // Propagate this translation to any duplicate items with the same contentHash
    const ch = item.contentHash;
    if (ch) {
      for (const [fp2, other] of Object.entries(master.items)) {
        if (fp2 === t.fingerprint) continue;
        if (other.contentHash === ch) {
          other.translations[t.locale] = t.text;
          other.status = 'translated';
        }
      }
    }
  }
  return master;
}

export function upsertItemsFromExtract(master: MasterJson, records: ExtractRecord[]): MasterJson {
  const nowIso = new Date().toISOString();
  for (const rec of records) {
    const existing = master.items[rec.fingerprint];
    const contentHash = rec.contentHash ?? contentHashFor(rec.original);
    if (!existing) {
      master.items[rec.fingerprint] = {
        fingerprint: rec.fingerprint,
        file: rec.file,
        loc: rec.loc,
        source: rec.original,
        contentHash,
        translations: {},
        status: 'missing',
        tags: rec.tag ? [rec.tag] : undefined,
        version: 1,
        lastSeenAt: nowIso,
      };
    } else {
      existing.file = rec.file;
      existing.loc = rec.loc;
      existing.source = rec.original;
      existing.contentHash = contentHash;
      existing.lastSeenAt = nowIso;
      if (rec.tag && (!existing.tags || !existing.tags.includes(rec.tag))) {
        existing.tags = [...(existing.tags ?? []), rec.tag];
      }
    }
  }
  return master;
}

