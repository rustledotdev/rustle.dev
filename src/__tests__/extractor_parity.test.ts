import fs from 'fs';
import path from 'path';
import os from 'os';
import { describe, it, expect } from 'vitest';
import type { ExtractRecord } from '../types/engine';
import { extractProject as extractBabel } from '../engine/extract';
import { extractProjectSwc as extractSwc } from '../engine/extract_swc';

function mkTempDir(prefix = 'rustle-parity-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function write(p: string, content: string) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, 'utf8');
}

function norm(records: ExtractRecord[]) {
  return records
    .map(r => ({ original: r.original, tag: r.tag ?? null, placeholders: (r.placeholders ?? []).join(',') }))
    .sort((a, b) => {
      if (a.original !== b.original) return a.original < b.original ? -1 : 1;
      if ((a.tag ?? '') !== (b.tag ?? '')) return (a.tag ?? '') < (b.tag ?? '') ? -1 : 1;
      return a.placeholders < b.placeholders ? -1 : a.placeholders > b.placeholders ? 1 : 0;
    });
}

describe('Extractor parity (SWC vs Babel)', () => {
  it('extracts identical texts and placeholders across typical JSX patterns', async () => {
    const root = mkTempDir();

    const file1 = path.join(root, 'src', 'A.tsx');
    write(file1, `
      import React from 'react';
      export function A() {
        const name = 'Alice';
        return (
          <>
            <div title="Greeting">Hello   world</div>
            <p aria-label={"Search input"}>This paragraph has ARIA attributes translated too.</p>
            <input placeholder={` + "`Type ${name}`" + `} />
          </>
        );
      }
    `);

    const file2 = path.join(root, 'src', 'B.tsx');
    write(file2, `
      import React from 'react';
      export const B: React.FC<{ items: number[] }> = ({ items }) => (
        <>
          <ul>
            {items.map((_, i) => <li key={i} title={` + "`Row ${i}`" + `}>List item</li>)}
          </ul>
          <>
            <>Nested fragment text</>
          </>
        </>
      );
    `);

    const include = ['**/*.tsx'];
    const exclude = ['**/node_modules/**'];

    const babel = await extractBabel({ rootDir: root, include, exclude, sourceLanguage: 'en' });
    const swc = await extractSwc({ rootDir: root, include, exclude, sourceLanguage: 'en' });

    // Compare normalized views (ignore file, loc, fingerprint)
    const nb = norm(babel.records);
    const ns = norm(swc.records);

    expect(ns).toEqual(nb);

    // sanity: presence of key strings
    const texts = nb.map(x => x.original);
    expect(texts).toContain('Hello world');
    expect(texts).toContain('This paragraph has ARIA attributes translated too.');
    expect(texts).toContain('Search input');
    expect(texts).toContain('Greeting');
    expect(texts).toContain('Type {{0}}'); // placeholder present for template literal
    expect(texts).toContain('Row {{0}}');
    expect(texts).toContain('Nested fragment text');
  });
});

