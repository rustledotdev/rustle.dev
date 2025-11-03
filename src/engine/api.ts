import { RustleConfig } from '../types/config';
import type { TranslationCache } from './cache';

export type BatchItem = {
  id: string; // fingerprint
  text: string; // content with placeholders
  context?: { tags?: string[]; file?: string; loc?: { start: number; end: number } };
  placeholders?: string[];
  contentHash?: string;
};

export type BatchResponse = {
  translations: Record<string, string>; // id -> translated text
  success: boolean;
  error?: string;
};

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/?$/, '')}/${path.replace(/^\//, '')}`;
}

// Simple client-side robustness: concurrency limiter, inflight dedupe, and retry with backoff
const MAX_CONCURRENCY = 4;
let active = 0;
const waitQueue: Array<() => void> = [];
const inflight = new Map<string, Promise<any>>();

function acquire(): Promise<void> {
  if (active < MAX_CONCURRENCY) {
    active++;
    return Promise.resolve();
  }
  return new Promise((resolve) => waitQueue.push(() => { active++; resolve(); }));
}

function release() {
  active = Math.max(0, active - 1);
  const next = waitQueue.shift();
  if (next) next();
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
function backoff(attempt: number) {
  const base = Math.min(1000 * 2 ** attempt, 8000);
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

async function postJson<T>(url: string, body: any, headers: Record<string, string>, retries = 2): Promise<{ ok: boolean; status: number; data?: T; text?: string; }> {
  const key = `${url}|${JSON.stringify(body)}`;
  if (inflight.has(key)) return inflight.get(key)!;
  const p = (async () => {
    let lastText = '';
    for (let attempt = 0; attempt <= retries; attempt++) {
      await acquire();
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
        if (res.ok) {
          try {
            const data = (await res.json()) as T;
            return { ok: true, status: res.status, data };
          } catch (e) {
            lastText = await res.text().catch(() => '');
            return { ok: false, status: res.status, text: lastText };
          }
        } else {
          lastText = await res.text().catch(() => '');
          // retry on 5xx
          if (res.status >= 500 && attempt < retries) {
            await sleep(backoff(attempt));
            continue;
          }
          return { ok: false, status: res.status, text: lastText };
        }
      } catch (e) {
        if (attempt < retries) {
          await sleep(backoff(attempt));
          continue;
        }
        return { ok: false, status: 0, text: String((e as any)?.message ?? e) };
      } finally { release(); }
    }
    return { ok: false, status: 0, text: lastText };
  })();
  inflight.set(key, p);
  try { return await p; } finally { inflight.delete(key); }
}
function isProd() { return process.env.NODE_ENV === 'production'; }
function isLocalUrl(u: string) { try { const x = new URL(u); return ['localhost','127.0.0.1','::1'].includes(x.hostname); } catch { return false; } }
function requireAuthInProd(cfg: Pick<RustleConfig, 'apiUrl' | 'apiKey'>) {
  if (isProd() && !isLocalUrl(cfg.apiUrl)) {
    if (!cfg.apiKey) {
      throw new Error('[rustle] apiKey is required in production for translation requests');
    }
  }
}



// v2 optimized API - single request for multiple locales with enriched items
export type OptimizedItem = {
  fingerprint: string;
  file: string;
  loc: { start: number; end: number };
  content: string;
  placeholders?: string[];
  context?: string;
  contentHash?: string;
};

export type OptimizedResponse = {
  success: boolean;
  items?: Array<{
    fingerprint: string;
    translations: Record<string, string>; // locale -> text
  }>;
  error?: string;
};

export async function translateOptimized(
  cfg: Pick<RustleConfig, 'apiUrl' | 'apiKey' | 'projectId'>,
  sourceLocale: string,
  targetLocales: string[],
  items: OptimizedItem[],
  model?: string,
  cache?: TranslationCache,
): Promise<{ success: true; byLocale: Record<string, Record<string, string>> } | { success: false; error: string }> {
  // Ephemeral contentHash cache within this process to avoid re-translation of unchanged content
  // Key: `${locale}|${fingerprint}|${contentHash}` -> translated text
  const CACHE = (translateOptimized as any)._cache || ((translateOptimized as any)._cache = new Map<string, string>());

  // Filter items that still need translation for at least one target locale
  const itemsToSend = items.filter((it) => {
    return targetLocales.some((loc) => {
      const hash = it.contentHash ?? '';
      const inProcess = CACHE.has(`${loc}|${it.fingerprint}|${hash}`);
      const persisted = cache?.has(loc, hash) ?? false;
      return !(inProcess || persisted);
    });
  });

  requireAuthInProd(cfg);
  const url = joinUrl(cfg.apiUrl, '/translate');
  const body = {
    projectId: cfg.projectId,
    apiKey: cfg.apiKey,
    sourceLocale,
    targetLocales,
    items: itemsToSend,
    model,
    client: { compiler: 'rustle-engine-v1' },
  } as const;

  const byLocaleFromCache: Record<string, Record<string, string>> = {};
  // Seed with cached translations we already have (in-process and persisted)
  for (const loc of targetLocales) {
    for (const it of items) {
      const hash = it.contentHash ?? '';
      const k = `${loc}|${it.fingerprint}|${hash}`;
      const cachedInProcess = CACHE.get(k);
      const cachedPersisted = cache?.get(loc, hash);
      const cached = cachedInProcess || cachedPersisted;
      if (cached) {
        (byLocaleFromCache[loc] || (byLocaleFromCache[loc] = {}))[it.fingerprint] = cached;
      }
    }
  }

  // If everything is cached, return early
  if (itemsToSend.length === 0) {
    return { success: true, byLocale: byLocaleFromCache };
  }

  // Call v2 with robustness helpers
  const headers = { ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}) } as Record<string, string>;
  const res = await postJson<OptimizedResponse>(url, body, headers, 2);
  if (res.ok && res.data && Array.isArray(res.data.items)) {
    const byLocale: Record<string, Record<string, string>> = { ...byLocaleFromCache };
    for (const it of res.data.items) {
      for (const [loc, text] of Object.entries(it.translations || {})) {
        (byLocale[loc] || (byLocale[loc] = {}))[it.fingerprint] = text;
        const original = items.find((x) => x.fingerprint === it.fingerprint);
        const hash = original?.contentHash ?? '';
        CACHE.set(`${loc}|${it.fingerprint}|${hash}`, text);
        if (hash) cache?.set(loc, hash, text);
      }
    }
    return { success: true, byLocale };
  }

  // No fallback: return error if optimized endpoint fails
  if (!res.ok || !res.data) {
    const msg = `HTTP ${res.status}: ${res.text ?? 'unknown error'}`;
    // eslint-disable-next-line no-console
    console.warn(`[rustle] translate failed: ${msg}`);
    return { success: false, error: msg } as const;
  }
}

