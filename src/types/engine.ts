import { z } from 'zod';

export type Loc = { start: number; end: number };

export type ExtractRecord = {
  fingerprint: string;
  file: string;
  loc: Loc;
  tag: string | null;
  original: string;
  placeholders?: string[];
  context?: string;
  severity?: 'important' | 'normal';
  contentHash?: string; // convenience to carry along
};

export type MasterItem = {
  fingerprint: string;
  file: string;
  loc: Loc;
  source: string;
  contentHash: string;
  translations: Record<string, string>;
  status: 'translated' | 'missing';
  tags?: string[];
  version: number;
  lastTranslatedAt?: string;
  lastSeenAt?: string;
};

export type MasterJson = {
  version: number; // schema version
  generatedAt: string;
  items: Record<string, MasterItem>;
};

// Zod schemas for runtime validation where needed
export const LocSchema = z.object({ start: z.number().nonnegative(), end: z.number().nonnegative() });

export const ExtractRecordSchema = z.object({
  fingerprint: z.string(),
  file: z.string(),
  loc: LocSchema,
  tag: z.string().nullable(),
  original: z.string(),
  placeholders: z.array(z.string()).optional(),
  context: z.string().optional(),
  severity: z.enum(['important', 'normal']).optional(),
  contentHash: z.string().optional(),
});

export const MasterItemSchema = z.object({
  fingerprint: z.string(),
  file: z.string(),
  loc: LocSchema,
  source: z.string(),
  contentHash: z.string(),
  translations: z.record(z.string()),
  status: z.enum(['translated', 'missing']),
  tags: z.array(z.string()).optional(),
  version: z.number().int().nonnegative(),
  lastTranslatedAt: z.string().optional(),
  lastSeenAt: z.string().optional(),
});

export const MasterJsonSchema = z.object({
  version: z.number().int().nonnegative(),
  generatedAt: z.string(),
  items: z.record(MasterItemSchema),
});

