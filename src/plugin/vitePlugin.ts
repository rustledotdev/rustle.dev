import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';
import MagicString from 'magic-string';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
import { fingerprintFor, normalizeText } from '../utils/hash';
import { readMaster, computeDelta, upsertItemsFromExtract, mergeTranslations } from '../engine/master';
import { ExtractRecord } from '../types/engine';
import { translateOptimized } from '../engine/api';
import { extractProject } from '../engine/extract';
import { extractProjectSwc } from '../engine/extract_swc';
import { DEFAULT_API_URL, DEFAULT_CONFIG_FILE_NAME, DEFAULT_LOCALE_BASE_PATH } from '../constants';
import { resolveConfig } from '../config';
import { loadPersistentCache, savePersistentCache } from '../engine/cache';

export type RustleVitePluginOptions = {
  enabled?: boolean;
  mode?: 'runtime' | 'static';
  buildLocale?: string;
  sourceLanguage?: string;
  targetLanguages?: string[];
  projectId?: string;
  apiUrl?: string;
  apiKey?: string;
  model?: string;
  translate?: boolean;
  include?: string[]; // globs if we add project-wide scan later
  exclude?: string[];
  writeLocales?: boolean;
};

const TRANS_ATTRS = new Set(['title', 'alt', 'placeholder', 'aria-label', 'aria-title', 'label']);
function isTranslatableAttr(name: string): boolean { return TRANS_ATTRS.has(name) || name.startsWith('aria-'); }

function tplToText(node: t.TemplateLiteral): { text: string; count: number } {
  const parts: string[] = [];
  node.quasis.forEach((q, i) => {
    parts.push(q.value.cooked ?? q.value.raw ?? '');
    if (i < node.expressions.length) parts.push(`{{${i}}}`);
  });
  return { text: normalizeText(parts.join('')), count: node.expressions.length };
}

export function rustlePlugin(options: RustleVitePluginOptions = {}): Plugin {
  const enabled = options.enabled ?? true;
  const mode = options.mode ?? 'runtime';
  const buildLocale = options.buildLocale;
  const translate = options.translate ?? true;
  const writeLocales = options.writeLocales ?? true;

  let projectRoot = process.cwd();
  const collected: ExtractRecord[] = [];

  function parseAndCollect(code: string, rel: string, s: MagicString | null, forStaticInjection: boolean, translationFor: (fp: string) => string | undefined, forRuntimeInjection: boolean, ensureImport: () => void) {
    const ast = parse(code, { sourceType: 'module', sourceFilename: rel, plugins: ['jsx', 'typescript', 'importMeta', 'classProperties', 'topLevelAwait'] });

    traverse(ast, {
      JSXText(p: NodePath<t.JSXText>) {
        const raw = p.node.value;
        const text = normalizeText(raw);
        if (!text || /^\s*$/.test(text)) return;
        const parent = p.parentPath?.node;
        const tag = t.isJSXElement(parent) && t.isJSXIdentifier(parent.openingElement.name) ? parent.openingElement.name.name : null;
        const start = (p.node.start ?? 0), end = (p.node.end ?? 0);
        const fp = fingerprintFor(rel, start, end);
        collected.push({ fingerprint: fp, file: rel, loc: { start, end }, tag, original: text });
        if (s) {
          if (forStaticInjection) {
            const tr = translationFor(fp);
            if (tr && !tr.includes('{') && !tr.includes('}')) {
              s.overwrite(start, end, tr);
            }
          } else if (forRuntimeInjection) {
            ensureImport();
            s.overwrite(start, end, `{__RUSTLE__.t(${JSON.stringify(fp)}, undefined, ${JSON.stringify(text)})}`);
          }
        }
      },
      JSXAttribute(p: NodePath<t.JSXAttribute>) {
        if (!t.isJSXIdentifier(p.node.name)) return;
        const attrName = p.node.name.name;
        const parent = p.parentPath?.parent;
        const tag = t.isJSXElement(parent) && t.isJSXIdentifier(parent.openingElement.name) ? parent.openingElement.name.name : null;
        const isTComponent = tag === 'T';
        const eligible = isTranslatableAttr(attrName) || (isTComponent && (attrName === 'id' || attrName === 'text'));
        if (!eligible) return;
        const val = p.node.value;
        if (!val) return;
        if (t.isStringLiteral(val)) {
          const text = normalizeText(val.value);
          if (!text) return;
          const start = (val.start ?? 0), end = (val.end ?? 0);
          const fp = fingerprintFor(rel, start, end);
          collected.push({ fingerprint: fp, file: rel, loc: { start, end }, tag, original: text });
          if (s && !isTComponent) {
            if (forStaticInjection) {
              const tr = translationFor(fp);
              if (tr) s.overwrite(start, end, JSON.stringify(tr));
            } else if (forRuntimeInjection) {
              ensureImport();
              s.overwrite(start, end, `{__RUSTLE__.t(${JSON.stringify(fp)}, undefined, ${JSON.stringify(text)})}`);
            }
          }
        } else if (t.isJSXExpressionContainer(val)) {
          const expr = val.expression;
          if (t.isStringLiteral(expr)) {
            const text = normalizeText(expr.value);
            if (!text) return;
            const start = (expr.start ?? 0), end = (expr.end ?? 0);
            const fp = fingerprintFor(rel, start, end);
            collected.push({ fingerprint: fp, file: rel, loc: { start, end }, tag, original: text });
            if (s && !isTComponent) {
              if (forStaticInjection) {
                const tr = translationFor(fp);
                if (tr) s.overwrite(start, end, JSON.stringify(tr));
              } else if (forRuntimeInjection) {
                ensureImport();
                s.overwrite(start, end, `__RUSTLE__.t(${JSON.stringify(fp)}, undefined, ${JSON.stringify(text)})`);
              }
            }
          } else if (t.isTemplateLiteral(expr)) {
            const tinfo = tplToText(expr);
            if (!tinfo.text) return;
            const start = (expr.start ?? 0), end = (expr.end ?? 0);
            const fp = fingerprintFor(rel, start, end);
            collected.push({ fingerprint: fp, file: rel, loc: { start, end }, tag, original: tinfo.text });
            if (s && forRuntimeInjection && !isTComponent) {
              ensureImport();
              const args: string[] = [];
              expr.expressions.forEach((e, i) => {
                const aStart = (e.start ?? 0), aEnd = (e.end ?? 0);
                const codeSlice = (s as any).slice(aStart, aEnd) as string;
                args.push(`p${i}: ${codeSlice}`);
              });
              s.overwrite(start, end, `__RUSTLE__.t(${JSON.stringify(fp)}, { ${args.join(', ')} }, ${JSON.stringify(tinfo.text)})`);
            }
          }
        }
      },
    });
  }

  function writeLocaleFiles(master: ReturnType<typeof readMaster>, outDir: string, locales: string[]) {
    fs.mkdirSync(outDir, { recursive: true });
    // Cleanup: remove stale locale files that are no longer in config
    try {
      const have = new Set(locales.map((l) => `${l}.json`));
      if (fs.existsSync(outDir)) {
        for (const name of fs.readdirSync(outDir)) {
          if (name.endsWith('.json') && !have.has(name)) {
            try { fs.unlinkSync(path.join(outDir, name)); } catch (e) { void e; }
          }
        }
      }
    } catch (e) { void e; }

    for (const locale of locales) {
      const dict: Record<string, string> = {};
      const seen = new Set<string>(); // contentHash-based de-dupe
      for (const fp of Object.keys(master.items)) {
        const item = master.items[fp];
        const ch = item.contentHash || '';
        if (seen.has(ch)) continue; // skip duplicate content
        seen.add(ch);
        if (locale === (options.sourceLanguage ?? 'en')) {
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

  function writeMasterPublic(master: ReturnType<typeof readMaster>, cwd: string) {
    const file = path.join(cwd, 'public', 'rustle', 'master.json');
    fs.mkdirSync(path.dirname(file), { recursive: true });
    master.generatedAt = new Date().toISOString();
    fs.writeFileSync(file, JSON.stringify(master, null, 2));
  }






  const VIRTUAL_ID = 'virtual:rustle/translations';
  const RESOLVED_VIRTUAL_ID = '\0rustle/translations';

  return {
    name: 'rustle-engine',
    enforce: 'pre',
    apply(_config, _env) {
      // Run in both serve (dev) and build
      return true;
    },
    configResolved(cfg) {
      projectRoot = cfg.root;
      try {
        // Ensure a default rustle.config.json exists for the app if missing
        const cfgPath = path.join(projectRoot, DEFAULT_CONFIG_FILE_NAME);
        if (!fs.existsSync(cfgPath)) {
          const defaultCfg = {
            sourceLanguage: 'en',
            targetLanguages: ['es'],
            apiUrl: DEFAULT_API_URL,
            localeBasePath: DEFAULT_LOCALE_BASE_PATH,
          };
          fs.writeFileSync(cfgPath, JSON.stringify(defaultCfg, null, 2), 'utf8');
        }
        // Resolve config with priority: options (plugin) -> env -> file -> defaults
        const resolved = resolveConfig({
          sourceLanguage: options.sourceLanguage,
          targetLanguages: options.targetLanguages,
          projectId: options.projectId,
          apiUrl: options.apiUrl,
          apiKey: options.apiKey,
          model: options.model,
          buildLocale: options.buildLocale,
        }, projectRoot);
        options.sourceLanguage = resolved.sourceLanguage;
        options.targetLanguages = resolved.targetLanguages;
        options.projectId = resolved.projectId;
        options.apiUrl = resolved.apiUrl;
        options.apiKey = resolved.apiKey;
        options.model = resolved.model;
        // buildLocale stays as provided via plugin option or env
        try { console.info('[rustle] loaded config', { sourceLanguage: options.sourceLanguage, targetLanguages: options.targetLanguages, apiUrl: options.apiUrl }); } catch (e) { void e; }
      } catch (e) { void e; }
        // Compile-time warning if apiKey is missing in production (non-local API)
        try {
          if (process.env.NODE_ENV === 'production') {
            const urlStr = options.apiUrl || '';
            try {
              const u = new URL(urlStr);
              const isLocal = ['localhost','127.0.0.1','::1'].includes(u.hostname);
              if (!isLocal && !options.apiKey) {
                try { console.warn('[rustle] Production build: apiKey is not set; translation requests may fail.'); } catch (e) { void e; }
              }
            } catch (e) { void e; }
          }
        } catch (e) { void e; }

    },
    configureServer(server) {
      // Serve /rustle assets from project root or /public/rustle in dev (so fetch('/rustle/...') always works)
      server.middlewares.use((req, res, next) => {
        try {
          const url = req.url || '';
          if (!url.startsWith(DEFAULT_LOCALE_BASE_PATH)) return next();
          const rel = url.slice(DEFAULT_LOCALE_BASE_PATH.length);
          const tryPaths = [
            path.join(projectRoot, 'public', 'rustle', rel),
            path.join(projectRoot, 'rustle', rel),
          ];
          for (const p of tryPaths) {
            if (fs.existsSync(p) && fs.statSync(p).isFile()) {
              if (p.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
              fs.createReadStream(p).pipe(res);
              return;
            }
          }
          return next();
        } catch (e) { void e; return next(); }
      });

      // Perform an initial project-wide extract in dev to ensure master/locales exist
      try {
        server.watcher.on('ready', async () => {
          try {
            const include = options.include ?? [
              'src/**/*.{tsx,jsx,ts,js}',
              'app/**/*.{tsx,jsx,ts,js}',
              'pages/**/*.{tsx,jsx,ts,js}',
              'components/**/*.{tsx,jsx,ts,js}',
            ];
            const exclude = options.exclude ?? ['**/node_modules/**', '**/.next/**', '**/dist/**'];
            const sourceLanguage = options.sourceLanguage ?? 'en';
            const preferSwc = process.env.NODE_ENV !== 'production';
            const res = preferSwc
              ? await extractProjectSwc({ rootDir: projectRoot, include, exclude, sourceLanguage })
              : await extractProject({ rootDir: projectRoot, include, exclude, sourceLanguage });
            const masterBefore = readMaster(projectRoot);
            computeDelta(res.records, masterBefore);
            const updated = upsertItemsFromExtract(masterBefore, res.records);
            writeMasterPublic(updated, projectRoot);

            // Translate on dev startup so locale files are immediately useful
            if (translate && options.targetLanguages && options.sourceLanguage && options.apiUrl) {
              try {
                const targets = (options.targetLanguages || []).filter(l => l !== options.sourceLanguage);
                const items = Object.values(updated.items)
                  .filter(item => targets.some(loc => {
                    const t = item.translations[loc];
                    return !t || t === '' || t === item.source;
                  }))
                  .map(item => ({ fingerprint: item.fingerprint, file: item.file, loc: item.loc, content: item.source, contentHash: item.contentHash }));
                const uniqueByHash = new Map<string, any>();
                for (const it of items) { const h = it.contentHash ?? ''; if (!uniqueByHash.has(h)) uniqueByHash.set(h, it); }
                const uniqueItems = Array.from(uniqueByHash.values());
                if (uniqueItems.length) {
                  try { server.config.logger.info(`[rustle] translating ${uniqueItems.length} items -> [${targets.join(',')}] via ${options.apiUrl}`); } catch (e) { void e; }
                  const cache = loadPersistentCache(projectRoot);
                  const res = await translateOptimized(
                    { apiUrl: options.apiUrl!, apiKey: options.apiKey, projectId: options.projectId },
                    options.sourceLanguage!,
                    targets,
                    uniqueItems,
                    options.model,
                    cache,
                  );
                  if (res.success) {
                    for (const [locale, map] of Object.entries(res.byLocale)) {
                      const merged = Object.entries(map).map(([fp, text]) => ({ fingerprint: fp, locale, text: String(text) }));
                      mergeTranslations(updated, merged);
                    }
                    writeMasterPublic(updated, projectRoot);
                    try { if (cache.isDirty()) savePersistentCache(cache); } catch (e) { void e; }
                  } else {
                    try { server.config.logger.warn(`[rustle] translate failed: ${res.error ?? 'unknown'}`); } catch (e) { void e; }
                  }
                }
              } catch (e: any) {
                try { server.config.logger.warn(`[rustle] translate error: ${String(e?.message ?? e)}`); } catch (e2) { void e2; }
              }
            }

            if (writeLocales) {
              const locales = [options.sourceLanguage ?? 'en', ...(options.targetLanguages ?? [])];
              const outDir = path.join(projectRoot, 'public', 'rustle', 'locales');
              writeLocaleFiles(updated, outDir, Array.from(new Set(locales)));
            }
            try { server.config.logger.info('[rustle] initial extract completed'); } catch (e) { void e; }
          } catch (e: any) {
            try { server.config.logger.warn(`[rustle] initial extract failed: ${String(e?.message ?? e)}`); } catch (e2) { void e2; }
          }
        });
      } catch (e) { void e; }

    },

    generateBundle() {
      // Emit master and locale assets into the build output so they are served at /rustle/* in production
      try {
        const masterCandidates = [
          path.join(projectRoot, 'public', 'rustle', 'master.json'),
          path.join(projectRoot, 'rustle', 'master.json'),
        ];
        for (const masterFile of masterCandidates) {
          if (fs.existsSync(masterFile)) {
            const src = fs.readFileSync(masterFile, 'utf8');
            // @ts-ignore
            this.emitFile({ type: 'asset', fileName: 'rustle/master.json', source: src });
            break;
          }
        }

        const localeDirs = [
          path.join(projectRoot, 'public', 'rustle', 'locales'),
          path.join(projectRoot, 'rustle', 'locales'),
        ];
        for (const localesDir of localeDirs) {
          if (fs.existsSync(localesDir)) {
            for (const name of fs.readdirSync(localesDir)) {
              if (name.endsWith('.json')) {
                const p = path.join(localesDir, name);
                const src = fs.readFileSync(p, 'utf8');
                // @ts-ignore
                this.emitFile({ type: 'asset', fileName: `rustle/locales/${name}`, source: src });
              }
            }
            break;
          }
        }
      } catch (e) { void e; }
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_ID) {
        // A minimal runtime that reads from window.__RUSTLE_DICT__ populated by RustleBox and falls back to master map. If neither is ready, use provided fallback.
        const code = `const fmt = (s, v) => s.replace(/\\{\\{(\\d+)\\}\\}/g, (_m, i) => { const k = 'p'+i; return v && (k in v) ? String(v[k]) : '{'+i+'}'; });\nconst api = {\n  t: (id, values, fallback) => {\n    try {\n      if (typeof window !== 'undefined') {\n        const d = window.__RUSTLE_DICT__ || null;\n        const m = window.__RUSTLE_MASTER_MAP__ || null;\n        let base = (d && id in d) ? d[id] : (m && id in m ? m[id] : (fallback ?? id));\n        return values ? fmt(base, values) : base;\n      }\n    } catch(e){void e}\n    return fallback ?? id;\n  }\n};\nexport default api;`;
        return code;
      }
      return null;
    },
    async transform(code, id) {
      if (!enabled) return null;
      const cleanId = id.split('?')[0];
      if (!/\.([jt]sx?)$/.test(cleanId)) return null;
      const rel = path.relative(projectRoot, cleanId).split(path.sep).join('/');

      const forStatic = mode === 'static' && !!buildLocale;
      const forRuntime = mode === 'runtime';
      const s = (forStatic || forRuntime) ? new MagicString(code) : null;

      // Prepare translation lookup for static injection
      const translationFor = (fp: string): string | undefined => {
        if (!buildLocale) return undefined;
        try {
          const master = readMaster(projectRoot);
          const item = master.items[fp];
          return item?.translations?.[buildLocale];
        } catch (e) { void e; return undefined; }
      };

      let imported = false;
      const ensureImport = () => {
        if (imported || !s) return;

        imported = true;
        // Insert import after any shebang or use directives
        let insertionPoint = 0;
        const match = code.match(/^(?:\s*['\"]use (?:client|strict)['\"];\s*)+/);
        if (match) insertionPoint = match[0].length;
        s.prependLeft(insertionPoint, `import __RUSTLE__ from '${VIRTUAL_ID}';\n`);
      };

      parseAndCollect(code, rel, s, forStatic, translationFor, forRuntime, ensureImport);

      if (s) {
        const out = s.toString();
        if (out !== code) {
          return { code: out, map: s.generateMap({ hires: true, source: id }) };
        }
      }
      return null;
    },
    async buildEnd() {
      if (!enabled) return;
      // debug: report collected count
      try { this.warn(`[rustle] buildEnd collected=${collected.length}`); } catch (e) { void e; }
      if (!collected.length) {
        // Fallback: project-wide scan to ensure we never miss extraction (e.g., if transform didn't run for some files)
        try {
          const include = options.include ?? [
            'src/**/*.{tsx,jsx,ts,js}',
            'app/**/*.{tsx,jsx,ts,js}',
            'pages/**/*.{tsx,jsx,ts,js}',
            'components/**/*.{tsx,jsx,ts,js}',
          ];
          const exclude = options.exclude ?? ['**/node_modules/**', '**/.next/**', '**/dist/**'];
          const sourceLanguage = options.sourceLanguage ?? 'en';
          const preferSwc = process.env.NODE_ENV !== 'production';
          let records: ExtractRecord[] = [];
          try {
            const res = preferSwc
              ? await extractProjectSwc({ rootDir: projectRoot, include, exclude, sourceLanguage })
              : await extractProject({ rootDir: projectRoot, include, exclude, sourceLanguage });
            records = res.records;
          } catch (e) { void e;
            const res = await extractProject({ rootDir: projectRoot, include, exclude, sourceLanguage });
            records = res.records;
          }
          if (records.length) {
            collected.push(...records);
            try { this.warn(`[rustle] fallback extract collected=${records.length}`); } catch (e) { void e; }
          }
        } catch (e: any) {
          try { this.warn(`[rustle] fallback extract failed: ${String(e?.message ?? e)}`); } catch (e2) { void e2; }
        }
      }
      if (!collected.length) return;

      const masterBefore = readMaster(projectRoot);
      // Compute delta before mutating master
      computeDelta(collected, masterBefore);

      // Merge extract into master and write
      const updated = upsertItemsFromExtract(masterBefore, collected);
      writeMasterPublic(updated, projectRoot);




      if (translate && options.targetLanguages && options.sourceLanguage && options.apiUrl) {
        try {
          const targets = (options.targetLanguages || []).filter(l => l !== options.sourceLanguage);

          if (targets.length) {
            // Determine items that still need translations for any target locale
            const items = Object.values(updated.items)
              .filter(item => targets.some(loc => {
                const t = item.translations[loc];
                // treat as missing if empty OR equal to source (fallback previously written)
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
              try { this.warn(`[rustle] translating ${uniqueItems.length} unique items -> [${targets.join(',')}] via ${options.apiUrl}`); } catch (e) { void e; }
              const cache = loadPersistentCache(projectRoot);
              const res = await translateOptimized(
                { apiUrl: options.apiUrl!, apiKey: options.apiKey, projectId: options.projectId },
                options.sourceLanguage!,
                targets,
                uniqueItems,
                options.model,
                cache,
              );
              if (res.success) {
                for (const [locale, map] of Object.entries(res.byLocale)) {
                  const merged = Object.entries(map).map(([fp, text]) => ({ fingerprint: fp, locale, text: String(text) }));
                  mergeTranslations(updated, merged);
                }
                writeMasterPublic(updated, projectRoot);
                try { if (cache.isDirty()) savePersistentCache(cache); } catch (e) { void e; }
              } else {

                this.warn(`[rustle] translate failed: ${res.error ?? 'unknown'}`);
              }
            } else {
              try { this.warn('[rustle] nothing to translate (all targets already filled)'); } catch (e) { void e; }
            }
          } else {
            try { this.warn('[rustle] no target locales to translate'); } catch (e) { void e; }
          }
        } catch (e: any) {
          this.warn(`[rustle] translate error: ${String(e?.message ?? e)}`);
        }
      } else {
        try { this.warn(`[rustle] skipping translate: translate=${String(translate)} targetLanguages=${String(options.targetLanguages)} sourceLanguage=${String(options.sourceLanguage)} apiUrl=${String(options.apiUrl)}`); } catch (e) { void e; }
      }

      if (writeLocales) {
        const locales = [options.sourceLanguage ?? 'en', ...(options.targetLanguages ?? [])];
        const outDir = path.join(projectRoot, 'public', 'rustle', 'locales');
        writeLocaleFiles(updated, outDir, Array.from(new Set(locales)));
      }

      // Reset for next build
      collected.length = 0;
    },
    async handleHotUpdate(ctx) {
      if (!enabled) return;
      const rawId = ctx.file;
      const id = rawId.split('?')[0];

      // If a locale JSON changed, broadcast dict update for hot-merge in the client
      const localesDir = path.join(projectRoot, 'public', 'rustle', 'locales');
      if (id.startsWith(localesDir) && id.endsWith('.json')) {
        try {
          const locale = path.basename(id, '.json');
          const raw = fs.readFileSync(id, 'utf8');
          const dict = JSON.parse(raw);
          ctx.server.ws.send({ type: 'custom', event: 'rustle:dict-updated', data: { locale, dict } });
        } catch (e) { ctx.server.config.logger.warn(`[rustle] failed to emit HMR for ${id}: ${String((e as any)?.message ?? e)}`); }
        return [];
      }

      if (!/\.([jt]sx?)$/.test(id)) return;
      const rel = path.relative(projectRoot, id).split(path.sep).join('/');
      const code = await ctx.read();
      const s = new MagicString(code);
      let imported = false;
      const ensureImport = () => {
        if (imported) return; imported = true; s.prepend(`import __RUSTLE__ from '${VIRTUAL_ID}';\n`);
      };
      const translationFor = (_fp: string) => undefined;
      parseAndCollect(code, rel, s, false, translationFor, mode === 'runtime', ensureImport);
      const masterBefore = readMaster(projectRoot);
      computeDelta(collected, masterBefore);
      const updated = upsertItemsFromExtract(masterBefore, collected);
      writeMasterPublic(updated, projectRoot);
      // Translate on hot update so dev sees translations without rebuild
      if (translate && options.targetLanguages && options.sourceLanguage && options.apiUrl) {
        try {
          const targets = (options.targetLanguages || []).filter(l => l !== options.sourceLanguage);
          const items = Object.values(updated.items)
            .filter(item => targets.some(loc => {
              const t = item.translations[loc];
              return !t || t === '' || t === item.source;
            }))
            .map(item => ({ fingerprint: item.fingerprint, file: item.file, loc: item.loc, content: item.source, contentHash: item.contentHash }));
          const uniqueByHash = new Map<string, any>();
          for (const it of items) { const h = it.contentHash ?? ''; if (!uniqueByHash.has(h)) uniqueByHash.set(h, it); }
          const uniqueItems = Array.from(uniqueByHash.values());
          if (uniqueItems.length) {
            const cache = loadPersistentCache(projectRoot);
            const res = await translateOptimized(
              { apiUrl: options.apiUrl!, apiKey: options.apiKey, projectId: options.projectId },
              options.sourceLanguage!,
              targets,
              uniqueItems,
              options.model,
              cache,
            );
            if (res.success) {
              for (const [locale, map] of Object.entries(res.byLocale)) {
                const merged = Object.entries(map).map(([fp, text]) => ({ fingerprint: fp, locale, text: String(text) }));
                mergeTranslations(updated, merged);
              }
              writeMasterPublic(updated, projectRoot);
              try { if (cache.isDirty()) savePersistentCache(cache); } catch (e) { void e; }
            }
          }
        } catch (e) { void e; }
      }




      if (writeLocales) {
        const locales = [options.sourceLanguage ?? 'en', ...(options.targetLanguages ?? [])];
        const outDir = path.join(projectRoot, 'public', 'rustle', 'locales');
        // debug print once per update
        try { ctx.server.config.logger.info(`[rustle] writing locales for: ${JSON.stringify(locales)}`); } catch (e) { void e; }
        writeLocaleFiles(updated, outDir, Array.from(new Set(locales)));
        // Broadcast current locale dict if available
        const current = path.join(outDir, `${options.sourceLanguage ?? 'en'}.json`);
        try {
          const raw = fs.readFileSync(current, 'utf8');
          const dict = JSON.parse(raw);
          ctx.server.ws.send({ type: 'custom', event: 'rustle:dict-updated', data: { locale: options.sourceLanguage ?? 'en', dict } });
        } catch (e) { void e; }
      }
      // Trigger HMR by returning modules (changed file will be updated), and also invalidate virtual module to allow consumers to re-import if needed
      const mod = ctx.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
      if (mod) ctx.server.moduleGraph.invalidateModule(mod);
      return [];
    },
  };
}

