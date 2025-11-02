import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parse } from '@swc/core';
import { ExtractRecord, Loc } from '../types/engine';
import { fingerprintFor, contentHashFor, normalizeText } from '../utils/hash';

export type ExtractOptions = {
  rootDir: string;
  include: string[]; // globs
  exclude?: string[]; // globs
  sourceLanguage: string;
};

export type ExtractResult = {
  records: ExtractRecord[];
  errors: Array<{ file: string; message: string }>; // keep going on errors
};

const TRANS_ATTRS = new Set(['title', 'alt', 'placeholder', 'aria-label', 'aria-title', 'label']);
function isTranslatableAttr(name: string): boolean {
  return TRANS_ATTRS.has(name) || name.startsWith('aria-');
}

function createExtractRecord(file: string, loc: Loc, tag: string | null, original: string, placeholders?: string[]): ExtractRecord {
  const fp = fingerprintFor(file, loc.start, loc.end);
  const normalized = normalizeText(original);
  const ch = contentHashFor(normalized);
  return { fingerprint: fp, file, loc, tag, original: normalized, contentHash: ch, ...(placeholders?.length ? { placeholders } : {}) };
}

function tplToText(node: any): { text: string; placeholders: string[] } {
  const parts: string[] = [];
  const placeholders: string[] = [];
  const quasis: any[] = node.quasis || [];
  const exprs: any[] = node.expressions || node.exprs || [];
  for (let i = 0; i < quasis.length; i++) {
    const q = quasis[i];
    const cooked = q?.cooked ?? q?.raw ?? '';
    parts.push(cooked);
    if (i < exprs.length) {
      const e = exprs[i];
      const name = e && typeof e === 'object' && e.type === 'Identifier' ? (e.name ?? e.value) : undefined;
      placeholders.push(name ? String(name) : String(i));
      parts.push(`{{${i}}}`);
    }
  }
  return { text: normalizeText(parts.join('')), placeholders };
}

function getIdentName(n: any): string | null {
  if (!n) return null;
  if (n.type === 'JSXIdentifier') return n.name || null;
  if (n.type === 'Identifier') return (n.name ?? n.value) || null;
  return null;
}

function spanToLoc(span: any): Loc {
  const start = Number(span?.start ?? 0);
  const end = Number(span?.end ?? 0);
  return { start, end };
}

function handleAttribute(attr: any, file: string, currentTag: string | null, out: ExtractRecord[]) {
  const name = getIdentName(attr?.name);
  const isTComponent = currentTag === 'T';
  const eligible = !!name && (isTranslatableAttr(name) || (isTComponent && (name === 'id' || name === 'text')));
  if (!eligible) return;
  const val = attr?.value;
  if (!val) return;
  if (val.type === 'StringLiteral') {
    const text = normalizeText(val.value || '');
    if (!text) return;
    const loc = spanToLoc(val.span || val);
    out.push(createExtractRecord(file, loc, currentTag, text));
  } else if (val.type === 'JSXExpressionContainer') {
    const expr = val.expression;
    if (!expr) return;
    if (expr.type === 'StringLiteral') {
      const text = normalizeText(expr.value || '');
      if (!text) return;
      const loc = spanToLoc(expr.span || expr);
      out.push(createExtractRecord(file, loc, currentTag, text));
    } else if (expr.type === 'TemplateLiteral') {
      const { text, placeholders } = tplToText(expr);
      if (!text) return;
      const loc = spanToLoc(expr.span || expr);
      out.push(createExtractRecord(file, loc, currentTag, text, placeholders));
    } else if (expr.type === 'ConditionalExpression') {
      const pushNode = (node: any) => {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'StringLiteral') {
          const text = normalizeText(node.value || '');
          if (!text) return;
          const loc = spanToLoc(node.span || node);
          out.push(createExtractRecord(file, loc, currentTag, text));
        } else if (node.type === 'TemplateLiteral') {
          const { text, placeholders } = tplToText(node);
          if (!text) return;
          const loc = spanToLoc(node.span || node);
          out.push(createExtractRecord(file, loc, currentTag, text, placeholders));
        }
      };
      pushNode(expr.consequent);
      pushNode(expr.alternate);
    }
  }
}

function walk(node: any, file: string, currentTag: string | null, out: ExtractRecord[]) {
  if (!node || typeof node !== 'object') return;
  switch (node.type) {
    case 'JSXElement': {
      const name = getIdentName(node.opening?.name || node.openingElement?.name || node.opening?.name);
      const attrs: any[] = node.opening?.attributes || node.openingElement?.attributes || [];
      for (const a of attrs) handleAttribute(a, file, name ?? currentTag, out);
      const kids: any[] = node.children || [];
      for (const k of kids) walk(k, file, name ?? currentTag, out);
      return;
    }
    case 'JSXFragment': {
      const kids: any[] = node.children || [];
      for (const k of kids) walk(k, file, currentTag, out);
      return;
    }
    case 'JSXText': {
      const raw = String(node.value ?? '').replace(/\s+/g, ' ').trim();
      const text = normalizeText(raw);
      if (!text) return;
      const loc = spanToLoc(node.span || node);
      out.push(createExtractRecord(file, loc, currentTag, text));
      return;
    }
    case 'JSXAttribute': {
      handleAttribute(node, file, currentTag, out);
      return;
    }
  }
  // generic walk
  for (const key of Object.keys(node)) {
    const val: any = (node as any)[key];
    if (Array.isArray(val)) {
      for (const child of val) walk(child, file, currentTag, out);
    } else if (val && typeof val === 'object' && 'type' in val) {
      walk(val, file, currentTag, out);
    }
  }
}

async function extractFromFile(abs: string, cwd: string, records: ExtractRecord[], errors: Array<{ file: string; message: string }>) {
  const rel = path.relative(cwd, abs).split(path.sep).join('/');
  try {
    const code = fs.readFileSync(abs, 'utf8');
    const ast = await parse(code, {
      syntax: abs.endsWith('.ts') || abs.endsWith('.tsx') ? 'typescript' : 'ecmascript',
      tsx: abs.endsWith('.tsx'),
      jsx: abs.endsWith('.jsx') || abs.endsWith('.tsx'),
      dynamicImport: true,
      decorators: false,
    } as any);
    walk(ast, rel, null, records);
  } catch (e: any) {
    errors.push({ file: rel, message: String(e?.message ?? e) });
  }
}

export async function extractProjectSwc(opts: ExtractOptions): Promise<ExtractResult> {
  const cwd = opts.rootDir;
  const patterns = opts.include;
  const ignore = opts.exclude ?? ['**/node_modules/**', '**/.next/**', '**/dist/**'];
  const files = await fg(patterns, { cwd, ignore, absolute: true });

  const records: ExtractRecord[] = [];
  const errors: Array<{ file: string; message: string }> = [];

  for (const abs of files) {
    await extractFromFile(abs, cwd, records, errors);
  }

  return { records, errors };
}

export async function extractFilesSwc(opts: { rootDir: string; files: string[]; sourceLanguage: string; }): Promise<ExtractResult> {
  const cwd = opts.rootDir;
  const records: ExtractRecord[] = [];
  const errors: Array<{ file: string; message: string }>= [];
  for (const f of opts.files) {
    const abs = path.isAbsolute(f) ? f : path.join(cwd, f);
    if (!fs.existsSync(abs)) continue;
    const ext = path.extname(abs).toLowerCase();
    if (!['.tsx', '.jsx', '.ts', '.js'].includes(ext)) continue;
    await extractFromFile(abs, cwd, records, errors);
  }
  return { records, errors };
}

