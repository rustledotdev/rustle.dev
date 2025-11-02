import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateOptimized } from '../engine/api';

const cfg = { apiUrl: 'http://example.test', apiKey: 'k', projectId: 'p' } as const;

const items = [
  { fingerprint: 'fp1', file: 'x', loc: { start: 1, end: 2 }, content: 'Hello', contentHash: 'h1' },
];

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls v2 and returns byLocale on success', async () => {
    (globalThis.fetch as any).mockImplementation(async (url: string, init: any) => {
      if (String(url).includes('/translate') && !String(url).includes('/batch')) {
        return new Response(JSON.stringify({ success: true, items: [{ fingerprint: 'fp1', translations: { fr: 'Bonjour', de: 'Hallo' } }] }), { status: 200 });
      }
      return new Response('not called', { status: 404 });
    });

    const res = await translateOptimized(cfg as any, 'en', ['fr', 'de'], items as any);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.byLocale.fr.fp1).toBe('Bonjour');
      expect(res.byLocale.de.fp1).toBe('Hallo');
    }
  });

  it('falls back to v1 batch per-locale when v2 fails', async () => {
    (globalThis.fetch as any).mockImplementation(async (url: string, init: any) => {
      if (String(url).includes('/translate') && !String(url).includes('/batch')) {
        return new Response('boom', { status: 500 });
      }
      if (String(url).includes('/translate/batch')) {
        return new Response(JSON.stringify({ success: true, translations: { fp1: 'Bonjour' } }), { status: 200 });
      }
      return new Response('not called', { status: 404 });
    });

    const res = await translateOptimized(cfg as any, 'en', ['fr'], items as any);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.byLocale.fr.fp1).toBe('Bonjour');
    }
  });
});

