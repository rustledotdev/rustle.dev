import fs from 'fs';
import path from 'path';
import fg from 'fast-glob';
import { parse } from '@babel/parser';
import traverse, { NodePath } from '@babel/traverse';
import * as t from '@babel/types';
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

function tplToTextWithPlaceholders(node: t.TemplateLiteral): { text: string; placeholders: string[] } {
  const parts: string[] = [];
  const placeholders: string[] = [];
  node.quasis.forEach((q, i) => {
    parts.push(q.value.cooked ?? q.value.raw ?? '');
    if (i < node.expressions.length) {
      placeholders.push(t.isIdentifier(node.expressions[i]) ? node.expressions[i].name : `${i}`);
      parts.push(`{{${i}}}`);
    }
  });
  const text = normalizeText(parts.join(''));
  return { text, placeholders };
}

function createExtractRecord(file: string, loc: Loc, tag: string | null, original: string, placeholders?: string[]): ExtractRecord {
  const fp = fingerprintFor(file, loc.start, loc.end);
  const normalized = normalizeText(original);
  const ch = contentHashFor(normalized);
  return { fingerprint: fp, file, loc, tag, original: normalized, contentHash: ch, ...(placeholders?.length ? { placeholders } : {}) };
}

async function extractFromFile(abs: string, cwd: string, records: ExtractRecord[], errors: Array<{ file: string; message: string }>) {
  const rel = path.relative(cwd, abs).split(path.sep).join('/');
  try {
    const code = fs.readFileSync(abs, 'utf8');
    const ast = parse(code, {
      sourceType: 'module',
      sourceFilename: rel,
      plugins: ['jsx', 'typescript', 'importMeta', 'classProperties', 'topLevelAwait', 'optionalChaining', 'nullishCoalescingOperator'],
    });

    traverse(ast, {
      JSXText(p: NodePath<t.JSXText>) {
        const raw = p.node.value;
        const text = normalizeText(raw);
        if (!text || /^\s*$/.test(text)) return;
        const parent = p.parentPath?.node;
        const tag = t.isJSXElement(parent) && t.isJSXIdentifier(parent.openingElement.name) ? parent.openingElement.name.name : null;
        const start = (p.node.start ?? 0);
        const end = (p.node.end ?? 0);
        records.push(createExtractRecord(rel, { start, end }, tag, text));
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
          records.push(createExtractRecord(rel, { start: (val.start ?? 0), end: (val.end ?? 0) }, tag, text));
        } else if (t.isJSXExpressionContainer(val)) {
          const expr = val.expression;
          if (t.isStringLiteral(expr)) {
            const text = normalizeText(expr.value);
            if (!text) return;
            records.push(createExtractRecord(rel, { start: (expr.start ?? 0), end: (expr.end ?? 0) }, tag, text));
          } else if (t.isTemplateLiteral(expr)) {
            const { text, placeholders } = tplToTextWithPlaceholders(expr);
            if (!text) return;
            records.push(createExtractRecord(rel, { start: (expr.start ?? 0), end: (expr.end ?? 0) }, tag, text, placeholders));
          } else if (t.isConditionalExpression(expr)) {
            const pushNode = (node: t.Expression | t.PrivateName | null | undefined) => {
              if (!node) return;
              if (t.isStringLiteral(node)) {
                const text = normalizeText(node.value);
                if (text) records.push(createExtractRecord(rel, { start: (node.start ?? 0), end: (node.end ?? 0) }, tag, text));
              } else if (t.isTemplateLiteral(node)) {
                const { text, placeholders } = tplToTextWithPlaceholders(node);
                if (text) records.push(createExtractRecord(rel, { start: (node.start ?? 0), end: (node.end ?? 0) }, tag, text, placeholders));
              }
            };
            pushNode(expr.consequent as any);
            pushNode(expr.alternate as any);
          }
        }
      },
    });
  } catch (e: any) {
    errors.push({ file: rel, message: String(e?.message ?? e) });
  }
}

export async function extractProject(opts: ExtractOptions): Promise<ExtractResult> {
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

export async function extractFiles(opts: { rootDir: string; files: string[]; sourceLanguage: string; }): Promise<ExtractResult> {
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
