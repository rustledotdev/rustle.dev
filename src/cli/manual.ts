#!/usr/bin/env node
import { buildMasterItem, buildLocalePatch, formatJson } from '../tools/manual';

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

function usage() {
  console.log(`rustle-manual - generate JSON patches for manual updates\n\n` +
`Master item JSON (paste into rustle/master.json -> items[fingerprint]):\n` +
`  rustle-manual master --source "Hello" --fingerprint abc123 [--file src/App.tsx --start 10 --end 20 --tag Home] [--translations '{"fr":"Bonjour"}']\n\n` +
`Locale patch JSON (paste into public/rustle/locales/<locale>.json):\n` +
`  rustle-manual locale --fingerprint abc123 --text "Bonjour"\n`);
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const args = parseArgs(argv.slice(1));
  if (!cmd || cmd === '--help' || cmd === '-h') { usage(); process.exit(0); }

  if (cmd === 'master') {
    const source = String(args.source || '');
    const fingerprint = (args.fingerprint ? String(args.fingerprint) : undefined);
    const file = (args.file ? String(args.file) : undefined);
    const loc = (args.start && args.end) ? { start: Number(args.start), end: Number(args.end) } : undefined;
    const tags = (args.tag ? String(args.tag).split(',').map(s => s.trim()).filter(Boolean) : undefined);
    const translations = args.translations ? (JSON.parse(String(args.translations))) : undefined;
    const item = buildMasterItem({ source, fingerprint, file, loc, tags, translations });
    const patch = { [item.fingerprint]: item };
    console.log(formatJson(patch));
    return;
  }

  if (cmd === 'locale') {
    const fp = String(args.fingerprint || '');
    const text = String(args.text || '');
    if (!fp) { console.error('missing --fingerprint'); process.exit(1); }
    const patch = buildLocalePatch(fp, text);
    console.log(formatJson(patch));
    return;
  }

  usage();
  process.exit(1);
}

// Execute only when called from the command line
if (typeof process !== 'undefined' && process.argv && process.argv[1]) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

