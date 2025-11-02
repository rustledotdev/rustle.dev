import fs from 'fs';
import path from 'path';
// Avoid importing webpack types to keep zero-deps for users
// type-only references to webpack cause TS to require @types/webpack; use any instead
import { extractProject, extractFiles } from '../engine/extract';
import { extractProjectSwc, extractFilesSwc } from '../engine/extract_swc';
import { readMaster, writeMaster, computeDelta, upsertItemsFromExtract, mergeTranslations } from '../engine/master';
import { translateOptimized } from '../engine/api';
import { loadRustleConfig, resolveConfig } from '../types/config';

import { loadPersistentCache, savePersistentCache } from '../engine/cache';

function writeLocaleFiles(master: ReturnType<typeof readMaster>, outDir: string, locales: string[], sourceLang: string) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const locale of locales) {
    const dict: Record<string, string> = {};
    const seen = new Set<string>(); // contentHash-based de-dupe
    for (const fp of Object.keys(master.items)) {
      const item = master.items[fp];
      const ch = item.contentHash || '';
      if (seen.has(ch)) continue;
      seen.add(ch);
      if (locale === sourceLang) {
        dict[fp] = item.source;
      } else {
        const tr = item.translations[locale];
        dict[fp] = tr && tr !== item.source ? tr : '';
      }
    }
    const file = path.join(outDir, `${locale}.json`);
    fs.writeFileSync(file, JSON.stringify(dict, null, 2));
  }
}

function writeMasterPublic(master: ReturnType<typeof readMaster>, projectRoot: string) {
  const file = path.join(projectRoot, 'public', 'rustle', 'master.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  master.generatedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(master, null, 2));
}



function copyDirSync(fromDir: string, toDir: string) {
  if (!fs.existsSync(fromDir)) return;
  fs.mkdirSync(toDir, { recursive: true });
  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const src = path.join(fromDir, entry.name);
    const dst = path.join(toDir, entry.name);
    if (entry.isDirectory()) copyDirSync(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

class RustleNextPlugin {
  private projectRoot: string;
  private include: string[];
  private exclude: string[] | undefined;
  private writeLocales: boolean;
  private translate: boolean | undefined;

  constructor(projectRoot: string, opts?: { include?: string[]; exclude?: string[]; writeLocales?: boolean; translate?: boolean }) {
    this.projectRoot = projectRoot;
    this.include = opts?.include ?? [
      'app/**/*.{tsx,jsx,ts,js}',
      'pages/**/*.{tsx,jsx,ts,js}',
      'components/**/*.{tsx,jsx,ts,js}',
      'src/**/*.{tsx,jsx,ts,js}',
    ];
    this.exclude = opts?.exclude;
    this.writeLocales = opts?.writeLocales ?? true;
    this.translate = opts?.translate;
  }

  apply(compiler: any) {
    // Compile-time warning if apiKey is missing in production (non-local API)
    try {
      const cfg0 = resolveConfig({}, this.projectRoot);
      if (process.env.NODE_ENV === 'production') {
        try {
          const u = new URL(cfg0.apiUrl);
          const isLocal = ['localhost','127.0.0.1','::1'].includes(u.hostname);
          if (!isLocal && !cfg0.apiKey) {
            compiler.getInfrastructureLogger('rustle').warn('[rustle] Production build: apiKey is not set; translation requests may fail.');
          }
        } catch (e) { void e; }
      }
    } catch (e) { void e; }

    const run = async (modified?: Set<string>) => {
      const cfg = resolveConfig({}, this.projectRoot);
      const sourceLanguage = cfg.sourceLanguage;
      const targetLanguages = cfg.targetLanguages ?? [];
      const apiUrl = cfg.apiUrl;
      const apiKey = cfg.apiKey;
      const model = cfg.model;



      // Prefer SWC in dev, fallback to Babel extractor on error
      const preferSwc = process.env.NODE_ENV !== 'production';
      let records: any[] = [];
      try {
        if (modified && modified.size > 0 && modified.size <= 50) {
          const files = Array.from(modified).filter(f => /\.(t|j)sx?$/.test(f));
          const res = preferSwc
            ? await extractFilesSwc({ rootDir: this.projectRoot, files, sourceLanguage })
            : await extractFiles({ rootDir: this.projectRoot, files, sourceLanguage });
          records = res.records;
        } else {
          const res = preferSwc
            ? await extractProjectSwc({ rootDir: this.projectRoot, include: this.include, exclude: this.exclude, sourceLanguage })
            : await extractProject({ rootDir: this.projectRoot, include: this.include, exclude: this.exclude, sourceLanguage });
          records = res.records;
        }
      } catch (e) { void e;
        // Fallback to Babel extractor if SWC path failed
        if (modified && modified.size > 0 && modified.size <= 50) {
          const files = Array.from(modified).filter(f => /\.(t|j)sx?$/.test(f));
          const res = await extractFiles({ rootDir: this.projectRoot, files, sourceLanguage });
          records = res.records;
        } else {
          const res = await extractProject({ rootDir: this.projectRoot, include: this.include, exclude: this.exclude, sourceLanguage });
          records = res.records;
        }
      }

      const masterBefore = readMaster(this.projectRoot);
      const updated = upsertItemsFromExtract(masterBefore, records);
      writeMasterPublic(updated, this.projectRoot);

      const shouldTranslate = (this.translate ?? true) && !!apiUrl;
      if (shouldTranslate) {
        const targets = targetLanguages.filter(l => l !== sourceLanguage);
        if (targets.length) {
          // Determine items that still need translations for any target locale
          const items = Object.values(updated.items)
            .filter(item => targets.some(loc => {
              const t = item.translations[loc];
              return !t || t === '' || t === item.source;
            }))
            .map(item => ({
              fingerprint: item.fingerprint,
              file: item.file,
              loc: item.loc,
              content: item.source,
              contentHash: item.contentHash,
            }));
            const uniqueByHash = new Map<string, { fingerprint: string; file: string; loc: { start: number; end: number }; content: string; contentHash?: string }>();
            for (const it of items) { const h = it.contentHash ?? ''; if (!uniqueByHash.has(h)) uniqueByHash.set(h, it); }
            const uniqueItems = Array.from(uniqueByHash.values());

          if (uniqueItems.length) {
            try {
              const cache = loadPersistentCache(this.projectRoot);
              const res = await translateOptimized({ apiUrl, apiKey, projectId: cfg.projectId }, sourceLanguage, targets, uniqueItems, model, cache);
              if (res.success) {
                for (const [locale, map] of Object.entries(res.byLocale)) {
                  const merged = Object.entries(map).map(([fp, text]) => ({ fingerprint: fp, locale, text: String(text) }));
                  mergeTranslations(updated, merged);
                }
                writeMasterPublic(updated, this.projectRoot);
                try { if (cache.isDirty()) savePersistentCache(cache); } catch (e) { void e; }
              }
            } catch (e) {
              compiler.getInfrastructureLogger('rustle').warn(`translate error: ${String((e as any)?.message ?? e)}`);
            }
          }
        }
      }

      if (this.writeLocales) {
        const locales = Array.from(new Set([sourceLanguage, ...targetLanguages]));
        const publicLocalesDir = path.join(this.projectRoot, 'public', 'rustle', 'locales');
        // Cleanup: remove stale locale files not present in current config
        try {
          const have = new Set(locales.map(l => `${l}.json`));
          const outDir = publicLocalesDir;
          if (fs.existsSync(outDir)) {
            for (const name of fs.readdirSync(outDir)) {
              if (name.endsWith('.json') && !have.has(name)) {
                try { fs.unlinkSync(path.join(outDir, name)); } catch (e) { void e; }
              }
            }
          }
        } catch (e) { void e; }
        writeLocaleFiles(updated, publicLocalesDir, locales, sourceLanguage);
      }
    };

    // Run before compilation so assets are ready
    compiler.hooks.beforeCompile.tapPromise('RustleNextPlugin', async () => {
      try { await run(); } catch (e) { compiler.getInfrastructureLogger('rustle').error(String((e as any)?.message ?? e)); }
    });

    // Also run on watch invalidation in dev with modified files
    compiler.hooks.watchRun.tapPromise('RustleNextPlugin', async (comp: any) => {
      try { await run((compiler as any).modifiedFiles || (comp && comp.modifiedFiles)); } catch (e) { compiler.getInfrastructureLogger('rustle').debug?.(`watchRun error: ${String((e as any)?.message ?? e)}`); }
    });
  }
}

export function withRustle(nextConfig: any = {}, opts?: { include?: string[]; exclude?: string[]; writeLocales?: boolean; translate?: boolean }) {
  return Object.assign({}, nextConfig, {
    webpack: (config: any, ctx: any) => {
      const cfg = typeof nextConfig.webpack === 'function' ? nextConfig.webpack : null;
      (config.plugins || (config.plugins = [])).push(new RustleNextPlugin(ctx.dir || process.cwd(), opts));
      return cfg ? cfg(config, ctx) : config;
    },
  });
}

