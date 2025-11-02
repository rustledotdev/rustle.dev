import crypto from 'crypto';

export function sha1Hex(input: string): string {
  return crypto.createHash('sha1').update(input).digest('hex');
}

export function normalizeText(input: string): string {
  // Trim, collapse whitespace, and normalize unicode (NFKD)
  return input
    .normalize('NFKD')
    .trim()
    .replace(/\s+/g, ' ');
}

export function fingerprintFor(file: string, start: number, end: number): string {
  return sha1Hex(`${file}:${start}:${end}`);
}

export function contentHashFor(originalText: string): string {
  return sha1Hex(normalizeText(originalText));
}

