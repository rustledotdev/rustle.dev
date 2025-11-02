import type { PluginObj, types as BabelTypes } from '@babel/core';
import * as t from '@babel/types';
import { normalizeText } from '../utils/hash';
import fs from 'fs';
import path from 'path';
import { DEFAULT_LOCALES_JSON_PATH, DEFAULT_MASTER_FILE_NAME } from '../constants';

export type RustleBabelPluginOptions = {
  outFile?: string; // defaults to `${DEFAULT_LOCALES_JSON_PATH}/${DEFAULT_MASTER_FILE_NAME}` under cwd
  includeAttributes?: string[]; // additional JSX attributes to extract
  debug?: boolean;
};

const DEFAULT_ATTRS = new Set(['title', 'alt', 'placeholder', 'aria-label', 'aria-title', 'label']);

function isTranslatableAttr(name: string, extra?: string[]): boolean {
  return DEFAULT_ATTRS.has(name) || name.startsWith('aria-') || !!extra?.includes(name);
}

function tplToText(node: t.TemplateLiteral): { text: string } {
  const parts: string[] = [];
  node.quasis.forEach((q, i) => {
    parts.push(q.value.cooked ?? q.value.raw ?? '');
    if (i < node.expressions.length) {
      parts.push(`{{${i}}}`);
    }
  });
  const text = normalizeText(parts.join(''));
  return { text };
}

function ensureDir(filePath: string) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function defaultOutFile(): string {
  const base = DEFAULT_LOCALES_JSON_PATH.replace(/^\//, ''); // remove leading slash for fs path
  return path.join(process.cwd(), base, DEFAULT_MASTER_FILE_NAME);
}

function writeMaster(outFile: string, texts: Set<string>, debug?: boolean) {
  ensureDir(outFile);
  let current: Record<string, string> = {};
  try {
    const raw = fs.readFileSync(outFile, 'utf8');
    current = JSON.parse(raw);
  } catch (e) { void e; /* first time */ }

  let updated = false;
  for (const txt of texts) {
    if (txt && !current[txt]) {
      current[txt] = txt;
      updated = true;
    }
  }
  if (updated) {
    fs.writeFileSync(outFile, JSON.stringify(current, null, 2), 'utf8');
    if (debug) console.log(`[rustle-babel] wrote ${Object.keys(current).length} entries to ${outFile}`);
  }
}

export default function rustleBabelPlugin({ types: bt }: { types: typeof BabelTypes }, opts: RustleBabelPluginOptions = {}): PluginObj {
  const fileTexts = new Set<string>();
  const outFile = opts.outFile || defaultOutFile();
  const extraAttrs = opts.includeAttributes || [];
  const debug = !!opts.debug;

  return {
    name: 'rustle-dev-extract',
    visitor: {
      JSXText(path) {
        const raw = path.node.value;
        const text = normalizeText(raw);
        if (!text || /^\s*$/.test(text)) return;
        fileTexts.add(text);
      },
      JSXAttribute(path) {
        if (!bt.isJSXIdentifier(path.node.name)) return;
        const attrName = path.node.name.name;
        if (!isTranslatableAttr(attrName, extraAttrs)) return;
        const val = path.node.value;
        if (!val) return;
        if (bt.isStringLiteral(val)) {
          const text = normalizeText(val.value);
          if (!text) return;
          fileTexts.add(text);
        } else if (bt.isJSXExpressionContainer(val)) {
          const expr = val.expression;
          if (bt.isStringLiteral(expr)) {
            const text = normalizeText(expr.value);
            if (!text) return;
            fileTexts.add(text);
          } else if (bt.isTemplateLiteral(expr)) {
            const { text } = tplToText(expr);
            if (!text) return;
            fileTexts.add(text);
          }
        }
      },
    },
    post() {
      if (fileTexts.size) writeMaster(outFile, fileTexts, debug);
    },
  };
}

