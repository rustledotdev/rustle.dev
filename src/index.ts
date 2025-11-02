/**
 * Rustle.dev SDK - Main Entry Point
 *
 * AI-powered translation runtime + types. Build-time engine exported from here too.
 */

// Runtime
export { RustleBox } from './sdk/RustleBox';
export { useRustle, useT } from './sdk/context';
export { T } from './sdk/T';

// Tools (manual patch helpers)
export { buildMasterItem, buildLocalePatch } from './tools/manual';

// Types
export type { RustleBoxProps } from './types';
export type { RustleConfig } from './types/config';
export type { ExtractRecord, MasterJson, MasterItem } from './types/engine';

// Engine is intentionally not exported from the browser entry to avoid bundling Node APIs.
// Use: import { RustleEngine } from 'rustle.dev/engine'
