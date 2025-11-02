import fs from 'fs';
import path from 'path';

export interface TranslationCache {
  get(locale: string, contentHash: string): string | undefined;
  set(locale: string, contentHash: string, text: string): void;
  has(locale: string, contentHash: string): boolean;
  toJSON(): Record<string, Record<string, string>>;
  isDirty(): boolean;
}

export function loadPersistentCache(cwd: string, filePath?: string): TranslationCache {
  const file = filePath || path.join(cwd, 'rustle', 'cache.json');
  let store: Record<string, Record<string, string>> = {};
  let dirty = false;
  try {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        store = parsed as Record<string, Record<string, string>>;
      }
    }
  } catch {
    // ignore malformed cache
    store = {};
  }

  const api: TranslationCache = {
    get(locale, contentHash) {
      return store[locale]?.[contentHash];
    },
    set(locale, contentHash, text) {
      if (!store[locale]) store[locale] = {};
      if (store[locale][contentHash] !== text) {
        store[locale][contentHash] = text;
        dirty = true;
      }
    },
    has(locale, contentHash) {
      return !!store[locale]?.[contentHash];
    },
    toJSON() { return store; },
    isDirty() { return dirty; },
  };

  // expose file path for save
  (api as any)._file = file;

  return api;
}

export function savePersistentCache(cache: TranslationCache) {
  const file = (cache as any)._file as string | undefined;
  if (!file) return;
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(cache.toJSON(), null, 2));
}

