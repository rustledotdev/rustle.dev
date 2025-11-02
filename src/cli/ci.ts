#!/usr/bin/env node
import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { RustleEngine } from '../engine/engine';
import { readMaster, computeDelta, upsertItemsFromExtract } from '../engine/master';
import { extractProject } from '../engine/extract';
import { loadPersistentCache, savePersistentCache } from '../engine/cache';

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const nxt = argv[i + 1];
      if (nxt && !nxt.startsWith('--')) { out[key] = nxt; i++; }
      else { out[key] = true; }
    }
  }
  return out;
}

function execGit(args: string[], cwd: string): { ok: boolean; stdout: string; stderr?: string } {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (res.status === 0) return { ok: true, stdout: (res.stdout || '').trim() };
  return { ok: false, stdout: (res.stdout || '').trim(), stderr: (res.stderr || '').trim() };
}

function getLastAuthor(file: string, cwd: string): string {
  const r = execGit(['log', '-1', '--pretty=%an', '--', file], cwd);
  if (r.ok && r.stdout) return r.stdout.split('\n')[0];
  return '';
}

function defaultBaseRef(cwd: string): string {
  const hasOrigin = execGit(['rev-parse', '--verify', 'origin/main'], cwd).ok;
  return hasOrigin ? 'origin/main' : 'HEAD~1';
}

function usage() {
  console.log(`rustle-engine - Git-aware and Git-optional i18n scanner and reporter\n\nCommands:\n  check [options]\n\nOptions:\n  --base <ref>                 Git base ref (default: origin/main or HEAD~1)\n  --head <ref>                 Git head ref (default: HEAD)\n  --changed-only               Prefer changed files (default); fallback to scan if none\n  --src <globs>                Comma-separated include globs (e.g., src/**/*.{ts,tsx},app/**/*)\n  --include <globs>            Alias of --src\n  --exclude <globs>            Comma-separated exclude globs\n  --output <dir>               Output directory for master.json and locales (default from config.localeBasePath under public)\n  --report <fmt>               markdown|json (default: markdown)\n  --report-file <path>         Write the report to a file (stdout always prints too)\n  --top-n <N>                  List top N missing examples per locale (default: 10)\n  --allow-same-as-source       Treat target text equal to source as filled during reporting/writing\n  --fail-on-new                Exit 1 if there are new/changed strings (delta > 0)\n  --fail-on-any                Exit 1 if any missing translations remain\n  --warn-only                  Never fail the job (overrides fail flags)\n  --translate                  Call translation API for missing entries (optional)\n  --write                      Write master.json and locale files\n  --grace-days <N>             Report items unseen for N days (requires lastSeenAt in master)\n  --cleanup <archive|delete>   With --write and --force-cleanup, move/delete unseen (dangerous)\n  --force-cleanup              Required with --cleanup to actually modify files\n  --blame                      Include last author per file in report (git required)\n\nExamples:\n  rustle-engine check --changed-only --report markdown\n  rustle-engine check --src \"src/**/*.{ts,tsx},app/**/*\" --output ./public/rustle --write\n  rustle-engine check --base origin/main --head HEAD --fail-on-any --report-file ci-report.md\n`);
}

function computeMissing(master: ReturnType<typeof readMaster>, targetLocales: string[], allowSameAsSource = false) {
  const missingByLocale: Record<string, number> = {};
  for (const loc of targetLocales) missingByLocale[loc] = 0;
  const examplesByLocale: Record<string, Array<{ fingerprint: string; file: string; source: string; tags?: string[] }>> = {};
  for (const [fp, item] of Object.entries(master.items)) {
    for (const loc of targetLocales) {
      const tr = item.translations[loc];
      const same = tr === item.source;
      const isMissing = !tr || tr === '' || (!allowSameAsSource && same);
      if (isMissing) {
        missingByLocale[loc]++;
        (examplesByLocale[loc] || (examplesByLocale[loc] = [])).push({ fingerprint: fp, file: item.file, source: item.source, tags: item.tags });
      }
    }
  }
  return { missingByLocale, examplesByLocale };
}

function toMarkdownSummary(
  delta: ReturnType<typeof computeDelta>,
  master: ReturnType<typeof readMaster>,
  targetLocales: string[],
  allowSameAsSource = false,
  topN = 10,
  unseen: Array<{ fingerprint: string; days: number }> = [],
  authorsByFile?: Record<string, string>,
) {
  const changed = delta.toSend.length;
  const unchanged = delta.unchanged.length;
  const { missingByLocale, examplesByLocale } = computeMissing(master, targetLocales, allowSameAsSource);
  const lines = [
    `## Rustle Engine Report`,
    `- Changed strings needing evaluation: ${changed}`,
    `- Unchanged strings scanned: ${unchanged}`,
    `- Missing translations by locale:`,
  ];
  for (const loc of targetLocales) lines.push(`  - ${loc}: ${missingByLocale[loc]}`);
  for (const loc of targetLocales) {
    const ex = (examplesByLocale[loc] || []).slice(0, topN);
    if (ex.length) {
      lines.push(`\n### Top ${ex.length} missing in ${loc}`);
      for (const e of ex) {
        const tagStr = e.tags && e.tags.length ? ` [${e.tags.slice(0,2).join(', ')}]` : '';
        const authorStr = authorsByFile && authorsByFile[e.file] ? ` (author: ${authorsByFile[e.file]})` : '';
        lines.push(`- ${e.file}${tagStr}${authorStr}: “${e.source.slice(0, 80)}${e.source.length>80?'…':''}”`);
      }
    }
  }
  if (unseen.length) {
    lines.push(`\n### Candidates for cleanup (not seen in current scan)`);
    for (const u of unseen.slice(0, 20)) lines.push(`- ${u.fingerprint} (${u.days} days unseen)`);
  }
  return lines.join('\n');
}

async function listChangedFilesOrScan(args: Record<string, string | boolean>, cwd: string): Promise<string[]> {
  const includeCsv = String((args.src || args.include) || '');
  const excludeCsv = String(args.exclude || '');
  const includes = includeCsv ? includeCsv.split(',').map(s => s.trim()).filter(Boolean) : [];
  const excludes = excludeCsv ? excludeCsv.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!includes.length) {
    // Try changed-only first
    const base = String(args.base || defaultBaseRef(cwd));
    const head = String(args.head || 'HEAD');
    const diff = execGit(['diff', '--name-only', `${base}...${head}`], cwd);
    if (diff.ok) {
      const files = diff.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
        .filter(f => ['.tsx', '.jsx', '.ts', '.js'].includes(path.extname(f).toLowerCase()));
      if (files.length) return files;
    }
    // Fallback to project scan with common defaults
    return ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}', 'pages/**/*.{ts,tsx,js,jsx}', 'components/**/*.{ts,tsx,js,jsx}'];
  }
  // If includes provided, return special marker to indicate project scan
  return ['__GLOB__', includes.join(','), excludes.join(',')];
}

async function cmdCheck(args: Record<string, string | boolean>) {
  const cwd = process.cwd();
  const eng = new RustleEngine({ cwd, config: {
    // Allow CLI overrides without a config file
    sourceLanguage: args['source-lang'] ? String(args['source-lang']) : undefined as any,
    targetLanguages: args['target-langs'] ? String(args['target-langs']).split(',').map(s => s.trim()).filter(Boolean) : undefined as any,
    localeBasePath: undefined as any, // keep file/default
  }} as any);
  const cfg = eng.getConfig();

  const reportFmt = String(args.report || 'markdown');
  const reportFile = args['report-file'] ? String(args['report-file']) : '';
  const write = Boolean(args.write);
  const outputOverride = args.output ? path.resolve(cwd, String(args.output)) : '';
  const translate = Boolean(args.translate);
  const allowSameAsSource = Boolean(args['allow-same-as-source']);
  const topN = args['top-n'] ? Number(args['top-n']) : 10;

  const filesOrGlobs = await listChangedFilesOrScan(args, cwd);
  let records;
  if (filesOrGlobs[0] === '__GLOB__') {
    const includes = filesOrGlobs[1] ? filesOrGlobs[1].split(',').filter(Boolean) : [];
    const excludes = filesOrGlobs[2] ? filesOrGlobs[2].split(',').filter(Boolean) : [];
    const { records: recs } = await extractProject({ rootDir: cwd, include: includes, exclude: excludes, sourceLanguage: cfg.sourceLanguage });
    records = recs;
  } else {
    records = await eng.scanFiles(filesOrGlobs);
  }

  const masterBefore = readMaster(cwd);
  const delta = computeDelta(records, masterBefore);
  const masterUpdated = upsertItemsFromExtract(masterBefore, records);

  if (translate && cfg.targetLanguages.length) {
    const cache = loadPersistentCache(cwd);
    await eng.translateAndMerge(masterUpdated, delta.toSend, cache);
    if (cache.isDirty()) {
      try { savePersistentCache(cache); } catch {}
    }
  }

  // Grace period report
  let unseen: Array<{ fingerprint: string; days: number }> = [];
  const graceDays = args['grace-days'] ? Number(args['grace-days']) : 0;
  if (graceDays > 0) {
    const seenSet = new Set(records.map((r: any) => r.fingerprint));
    const now = Date.now();
    for (const [fp, item] of Object.entries(masterUpdated.items)) {
      if (seenSet.has(fp)) continue;
      const last = item.lastSeenAt ? Date.parse(item.lastSeenAt) : 0;
      const days = last ? Math.floor((now - last) / (1000*60*60*24)) : Infinity;
      if (last && days >= graceDays) unseen.push({ fingerprint: fp, days });
    }
    unseen.sort((a,b)=>b.days-a.days);
  }

  // Optional cleanup before writing
  const cleanupAction = args['cleanup'] ? String(args['cleanup']) : '';
  const forceCleanup = Boolean(args['force-cleanup']);
  let cleaned = 0;
  if (cleanupAction && write) {
    if (!forceCleanup) {
      console.warn(`[rustle-engine] --cleanup requested but --force-cleanup not set; skipping cleanup`);
    } else if (graceDays <= 0) {
      console.warn(`[rustle-engine] --cleanup requires --grace-days > 0; skipping cleanup`);
    } else if (unseen.length) {
      const baseDir = outputOverride || eng.getOutputBaseDir();
      if (cleanupAction === 'archive') {
        const archiveFile = path.join(baseDir, 'archive.json');
        const archive: any = { archivedAt: new Date().toISOString(), items: {} };
        for (const u of unseen) {
          const it = (masterUpdated as any).items[u.fingerprint];
          if (it) { archive.items[u.fingerprint] = it; delete (masterUpdated as any).items[u.fingerprint]; cleaned++; }
        }
        fs.mkdirSync(path.dirname(archiveFile), { recursive: true });
        fs.writeFileSync(archiveFile, JSON.stringify(archive, null, 2));
      } else if (cleanupAction === 'delete') {
        for (const u of unseen) {
          if ((masterUpdated as any).items[u.fingerprint]) { delete (masterUpdated as any).items[u.fingerprint]; cleaned++; }
        }
      } else {
        console.warn(`[rustle-engine] unknown --cleanup action: ${cleanupAction}`);
      }
    }
  }

  // Write outputs (after optional cleanup)
  if (write) {
    const locales = Array.from(new Set([cfg.sourceLanguage, ...cfg.targetLanguages]));
    if (outputOverride) {
      eng.writeMasterAt(masterUpdated, outputOverride);
      eng.writeLocalesAt(masterUpdated, outputOverride, locales, allowSameAsSource);
    } else {
      eng.writeMasterPublic(masterUpdated);
      eng.writeLocales(masterUpdated, locales, allowSameAsSource);
    }
  }

  // Optional blame map for report
  const blame = Boolean(args['blame']);
  let authorsByFile: Record<string, string> | undefined = undefined;
  if (blame) {
    const { examplesByLocale } = computeMissing(masterUpdated, cfg.targetLanguages, allowSameAsSource);
    const files = new Set<string>();
    for (const loc of cfg.targetLanguages) {
      for (const e of (examplesByLocale[loc] || [])) files.add(e.file);
    }
    authorsByFile = {};
    for (const f of files) authorsByFile[f] = getLastAuthor(f, cwd);
  }

  const summary = toMarkdownSummary(delta, masterUpdated, cfg.targetLanguages, allowSameAsSource, topN, unseen, authorsByFile);
  if (reportFmt === 'json') {
    const payload: any = {
      changed: delta.toSend.length,
      unchanged: delta.unchanged.length,
      targetLocales: cfg.targetLanguages,
      cleaned,
      summaryMarkdown: summary,
    };
    if (blame && authorsByFile) payload.authorsByFile = authorsByFile;
    const json = JSON.stringify(payload, null, 2);
    console.log(json);
    if (reportFile) {
      fs.mkdirSync(path.dirname(reportFile), { recursive: true });
      fs.writeFileSync(reportFile, json);
    }
  } else {
    console.log(summary);
    if (reportFile) {
      fs.mkdirSync(path.dirname(reportFile), { recursive: true });
      fs.writeFileSync(reportFile, summary);
    }
  }

  // Exit criteria
  const warnOnly = Boolean(args['warn-only']);
  const failOnAny = Boolean(args['fail-on-any']) || Boolean(args['fail-on-missing']); // compat
  const failOnNew = Boolean(args['fail-on-new']);
  if (!warnOnly) {
    if (failOnNew && delta.toSend.length > 0) {
      console.error(`[rustle-engine] failing due to ${delta.toSend.length} new/changed strings`);
      process.exit(1);
    }
    if (failOnAny) {
      const { missingByLocale } = computeMissing(masterUpdated, cfg.targetLanguages, allowSameAsSource);
      const totalMissing = Object.values(missingByLocale).reduce((a,b)=>a+b,0);
      if (totalMissing > 0) {
        console.error(`[rustle-engine] failing due to ${totalMissing} missing translations`);
        process.exit(1);
      }
    }
  }
}

async function main() {
  // Print deprecation notice if invoked via legacy alias
  const invoker = String(process.env._ || process.env.npm_lifecycle_script || '');
  if (invoker.includes('rustle-ci')) {
    console.warn('[DEPRECATION] rustle-ci has been renamed to rustle-engine.');
    console.warn("[DEPRECATION] Please update your scripts to use 'rustle-engine'.");
    console.warn('[DEPRECATION] The rustle-ci alias will be removed in a future version.');
  }

  const argv = process.argv.slice(2);
  let cmd = argv[0];
  let args: Record<string, string | boolean> = {};
  if (!cmd || cmd.startsWith('--')) { cmd = 'check'; args = parseArgs(argv); }
  else { args = parseArgs(argv.slice(1)); }
  if (cmd === '--help' || cmd === '-h') { usage(); process.exit(0); }
  if (cmd === 'check') return cmdCheck(args);
  usage();
  process.exit(1);
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

