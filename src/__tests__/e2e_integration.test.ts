import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { extractProject } from '../engine/extract';
import { readMaster, writeMaster, upsertItemsFromExtract, mergeTranslations } from '../engine/master';

function writeFileSyncRecursive(filePath: string, content: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function writeLocaleFiles(master: ReturnType<typeof readMaster>, outDir: string, locales: string[], sourceLang: string) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const locale of locales) {
    const dict: Record<string, string> = {};
    for (const fp of Object.keys(master.items)) {
      const item = master.items[fp];
      if (locale === sourceLang) {
        dict[fp] = item.source;
      } else {
        const tr = item.translations[locale];
        dict[fp] = tr && tr !== item.source ? tr : '';
      }
    }
    fs.writeFileSync(path.join(outDir, `${locale}.json`), JSON.stringify(dict, null, 2));
  }
}

function normalize(s: string) { return s.replace(/\s+/g, ' ').trim(); }

describe('E2E: extract → translate → write master/locales', () => {
  it('builds master.json and locale JSONs for multiple targets', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rustle-e2e-'));

    // 1) Create small React sources
    writeFileSyncRecursive(path.join(tmp, 'src', 'App.tsx'), `import React from 'react';\nexport default function App(){\n  return (\n    <div>\n      <p>Hello, world!</p>\n      <p title=\"Tooltip\">Welcome to our application</p>\n      <input placeholder=\"Search...\" aria-label=\"Search input\" />\n    </div>\n  );\n}`);

    writeFileSyncRecursive(path.join(tmp, 'src', 'Comp.tsx'), `import React from 'react';\nexport function Comp(){\n  return <button title=\"Click me\">Submit</button>\n}`);

    // 2) Extract
    const res = await extractProject({ rootDir: tmp, include: ['src/**/*.tsx'], exclude: undefined, sourceLanguage: 'en' });

    // 3) Master upsert + write
    const before = readMaster(tmp);
    const updated = upsertItemsFromExtract(before, res.records);
    writeMaster(updated, tmp);

    // 4) Fake translate for targets
    const targets = ['es','fr','de','it','pt'];
    const translatedEntries: Array<{ fingerprint: string; locale: string; text: string }> = [];
    for (const [fp, item] of Object.entries(updated.items)) {
      for (const loc of targets) {
        translatedEntries.push({ fingerprint: fp, locale: loc, text: `(${loc}) ${item.source}` });
      }
    }
    mergeTranslations(updated, translatedEntries);
    writeMaster(updated, tmp);

    // 5) Write locales
    const localesDir = path.join(tmp, 'public', 'rustle', 'locales');
    writeLocaleFiles(updated, localesDir, ['en', ...targets], 'en');

    // 6) Assert a few outputs exist and look right
    const masterFile = path.join(tmp, 'rustle', 'master.json');
    expect(fs.existsSync(masterFile)).toBe(true);
    const masterJson = JSON.parse(fs.readFileSync(masterFile, 'utf8'));
    expect(masterJson && masterJson.items && Object.keys(masterJson.items).length).toBeGreaterThanOrEqual(3);

    for (const loc of ['en', ...targets]) {
      const file = path.join(localesDir, `${loc}.json`);
      expect(fs.existsSync(file)).toBe(true);
      const dict = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
      const values = Object.values(dict);
      expect(values.length).toBeGreaterThanOrEqual(3);
      // spot-check first entry formatting
      const first = values[0];
      if (loc === 'en') expect(first.length).toBeGreaterThan(0);
      else expect(first.startsWith(`(${loc})`)).toBe(true);
    }
  });
});

