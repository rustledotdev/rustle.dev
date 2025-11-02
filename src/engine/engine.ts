import path from 'path';
import fs from 'fs';
import { resolveConfig, loadRustleConfig } from '../types/config';
import type { RustleConfig } from '../types/config';
import type { ExtractRecord, MasterJson } from '../types/engine';
import { readMaster, computeDelta, upsertItemsFromExtract } from './master';
import { extractFiles } from './extract';
import { translateOptimized } from './api';
import type { TranslationCache } from './cache';

export class RustleEngine {
  readonly cwd: string;
  readonly config: RustleConfig;

  constructor(opts?: { cwd?: string; config?: Partial<RustleConfig> }) {
    this.cwd = opts?.cwd || process.cwd();
    const base = opts?.config || loadRustleConfig(this.cwd);
    this.config = resolveConfig(base, this.cwd);
  }

  getConfig() { return this.config; }

  getOutputBaseDir(): string {
    const base = (this.config.localeBasePath || '/rustle').replace(/^\//, '');
    return path.join(this.cwd, 'public', base);
  }

  readMaster(): MasterJson { return readMaster(this.cwd); }

  async scanFiles(files: string[]): Promise<ExtractRecord[]> {
    const res = await extractFiles({ rootDir: this.cwd, files, sourceLanguage: this.config.sourceLanguage });
    return res.records;
  }

  computeDelta(records: ExtractRecord[]) {
    const master = this.readMaster();
    return computeDelta(records, master);
  }

  mergeAndWrite(masterBefore: MasterJson, records: ExtractRecord[]): MasterJson {
    const updated = upsertItemsFromExtract(masterBefore, records);
    this.writeMasterPublic(updated);
    return updated;
  }

  buildLocaleDicts(master: MasterJson, locales: string[], allowSameAsSource = false): Record<string, Record<string, string>> {
    const out: Record<string, Record<string, string>> = {};
    for (const locale of locales) {
      const dict: Record<string, string> = {};
      const seen = new Set<string>();
      for (const fp of Object.keys(master.items)) {
        const item = master.items[fp];
        const ch = item.contentHash || '';
        if (seen.has(ch)) continue;
        seen.add(ch);
        if (locale === (this.config.sourceLanguage ?? 'en')) {
          dict[fp] = item.source;
        } else {
          const tr = item.translations[locale];
          const same = tr === item.source;
          dict[fp] = tr && (allowSameAsSource || !same) ? tr : (allowSameAsSource && same ? tr : '');
        }
      }
      out[locale] = dict;
    }
    return out;
  }

  async translateAndMerge(master: MasterJson, records: ExtractRecord[], cache?: TranslationCache): Promise<MasterJson> {
    const targets = this.config.targetLanguages || [];
    if (!targets.length) return master;
    const items = records.map((r) => ({
      fingerprint: r.fingerprint,
      file: r.file,
      loc: r.loc,
      content: r.original,
      placeholders: (r as any).placeholders,
      contentHash: r.contentHash,
    }));
    // De-dupe by contentHash for API efficiency
    const uniqueByHash = new Map<string, typeof items[number]>();
    for (const it of items) {
      const h = it.contentHash || '';
      if (!uniqueByHash.has(h)) uniqueByHash.set(h, it);
    }
    const uniqueItems = Array.from(uniqueByHash.values());
    if (!uniqueItems.length) return master;

    const cfg = this.config;
    const res = await translateOptimized(
      { apiUrl: cfg.apiUrl, apiKey: cfg.apiKey, projectId: cfg.projectId },
      cfg.sourceLanguage,
      targets,
      uniqueItems,
      cfg.model,
      cache,
    );

    if (res.success) {
      // Apply translations into master.items
      for (const [locale, byFp] of Object.entries(res.byLocale)) {
        for (const [fp, text] of Object.entries(byFp)) {
          const item = master.items[fp];
          if (!item) continue;
          item.translations[locale] = text;
          item.status = 'translated';
        }
      }
    }
    return master;
  }

  writeMasterPublic(master: MasterJson) {
    const baseDir = this.getOutputBaseDir();
    const file = path.join(baseDir, 'master.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    master.generatedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(master, null, 2));
  }

  writeMasterAt(master: MasterJson, baseDir: string) {
    const file = path.join(baseDir, 'master.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    master.generatedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(master, null, 2));
  }

  writeLocales(master: MasterJson, locales: string[], allowSameAsSource = false) {
    const baseDir = this.getOutputBaseDir();
    this.writeLocalesAt(master, baseDir, locales, allowSameAsSource);
  }

  writeLocalesAt(master: MasterJson, baseDir: string, locales: string[], allowSameAsSource = false) {
    const outDir = path.join(baseDir, 'locales');
    fs.mkdirSync(outDir, { recursive: true });
    const dicts = this.buildLocaleDicts(master, locales, allowSameAsSource);
    for (const locale of locales) {
      const file = path.join(outDir, `${locale}.json`);
      fs.writeFileSync(file, JSON.stringify(dicts[locale] ?? {}, null, 2));
    }
  }
}


