import type { MasterItem, Loc } from '../types/engine';
import { contentHashFor, fingerprintFor, normalizeText } from '../utils/hash';

export type BuildMasterItemParams = {
  source: string;
  fingerprint?: string;
  file?: string; // repo-relative path using '/'
  loc?: Loc;     // start/end char offsets
  tags?: string[];
  translations?: Record<string, string>;
};

export function buildMasterItem(params: BuildMasterItemParams): MasterItem {
  const source = normalizeText(params.source || '');
  if (!source) throw new Error('source text is required');
  const fp = params.fingerprint || (params.file && params.loc ? fingerprintFor(params.file, params.loc.start, params.loc.end) : undefined);
  if (!fp) throw new Error('fingerprint or (file + loc) is required');
  const contentHash = contentHashFor(source);
  const item: MasterItem = {
    fingerprint: fp,
    file: params.file || '',
    loc: params.loc || { start: 0, end: 0 },
    source,
    contentHash,
    translations: { ...(params.translations || {}) },
    status: 'missing',
    tags: params.tags && params.tags.length ? [...params.tags] : undefined,
    version: 1,
    lastTranslatedAt: new Date().toISOString(),
  };
  return item;
}

export function buildLocalePatch(fingerprint: string, text: string): Record<string, string> {
  const t = normalizeText(text || '');
  return { [fingerprint]: t };
}

export function formatJson(obj: any): string {
  return JSON.stringify(obj, null, 2);
}

export function explainPasteTargets(): string {
  return [
    'Paste MasterItem under rustle/master.json -> items[fingerprint]',
    'Paste locale patch under public/rustle/locales/<locale>.json',
  ].join('\n');
}

