import { describe, it, expect } from 'vitest';
import { fingerprintFor, contentHashFor, normalizeText } from '../utils/hash';

describe('hash utils', () => {
  it('normalizes text with whitespace collapse and NFKD', () => {
    expect(normalizeText('  Hello\n  World  ')).toBe('Hello World');
  });

  it('generates stable fingerprint', () => {
    const fp1 = fingerprintFor('src/App.tsx', 10, 20);
    const fp2 = fingerprintFor('src/App.tsx', 10, 20);
    expect(fp1).toBe(fp2);
  });

  it('generates contentHash based on normalized text only', () => {
    const ch1 = contentHashFor('Hello   World');
    const ch2 = contentHashFor('Hello World');
    expect(ch1).toBe(ch2);
  });
});

