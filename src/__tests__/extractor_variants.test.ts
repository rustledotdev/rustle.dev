import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { extractProject } from '../engine/extract';
import { extractProjectSwc } from '../engine/extract_swc';

function mkTmp(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rustle-variants-'));
  return dir;
}

describe('Extractor attribute variants and member JSX tags', () => {
  it('extracts from conditional attributes and template literals; ignores boolean; works with member tags', async () => {
    const tmp = mkTmp();
    const file = path.join(tmp, 'variants.tsx');
    const code = `
      import React from 'react';
      const cond = true, name = 'Ada';
      const Svg: any = {};
      Svg.Icon = (props: any) => <svg {...props}/>;
      export function Comp(){
        return (
          <Svg.Icon title={cond ? "Yes" : "No"} placeholder={` + "`Hello ${name}`" + `} aria-label={true} />
        );
      }
    `;
    fs.writeFileSync(file, code, 'utf8');

    const opts = { rootDir: tmp, include: ['**/*.tsx'], sourceLanguage: 'en' as const };
    const b = await extractProject(opts);
    const s = await extractProjectSwc(opts);

    // Both should extract three items: "Yes", "No", and "Hello {{0}}" (boolean aria-label ignored)
    const bTexts = b.records.map(r => r.original).sort();
    const sTexts = s.records.map(r => r.original).sort();

    expect(bTexts).toContain('Yes');
    expect(bTexts).toContain('No');
    expect(bTexts.some(t => t.includes('Hello'))).toBe(true);

    expect(sTexts).toContain('Yes');
    expect(sTexts).toContain('No');
    expect(sTexts.some(t => t.includes('Hello'))).toBe(true);

    // Tags for member JSX (Svg.Icon) should be null for parity
    expect(b.records.every(r => r.tag === null)).toBe(true);
    expect(s.records.every(r => r.tag === null)).toBe(true);
  });
});

