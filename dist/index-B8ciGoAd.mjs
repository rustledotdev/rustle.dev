"use client";
import { z } from "zod";
const OpenAIModelSchema = z.enum([
  "gpt-4",
  "gpt-4-turbo",
  "gpt-4-turbo-preview",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k"
]);
const GeminiModelSchema = z.enum([
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-pro",
  "gemini-pro-vision"
]);
const LegacyModelSchema = z.enum(["openai", "gemini", "azure"]);
const AIModelSchema = z.union([
  OpenAIModelSchema,
  GeminiModelSchema,
  LegacyModelSchema
]);
const LocaleSchema = z.string().min(2).max(5);
const ModelConfigSchema = z.record(
  AIModelSchema,
  z.record(LocaleSchema, z.string())
);
const AutoConfigSchema = z.object({
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional()
});
const FallbackConfigSchema = z.object({
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional()
});
const RustleConfigSchema = z.object({
  deactivate: z.boolean().optional().default(false),
  sourceLanguage: LocaleSchema.default("en"),
  targetLanguages: z.array(LocaleSchema),
  currentLocale: LocaleSchema.optional(),
  apiKey: z.string(),
  model: AIModelSchema.default("gpt-3.5-turbo"),
  modelConfig: ModelConfigSchema.optional(),
  debug: z.boolean().optional().default(false),
  auto: z.boolean().optional().default(true),
  autoConfig: AutoConfigSchema.optional(),
  fallback: z.boolean().optional().default(true),
  fallbackConfig: FallbackConfigSchema.optional(),
  localeBasePath: z.string().optional().default("/rustle/locales"),
  useVirtualDOM: z.boolean().optional().default(true)
});
const TranslationEntrySchema = z.object({
  fingerprint: z.string(),
  source: z.string(),
  file: z.string(),
  loc: z.object({
    start: z.number(),
    end: z.number()
  }),
  contentHash: z.string(),
  version: z.number(),
  translations: z.record(LocaleSchema, z.string()),
  lastTranslatedAt: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(["translated", "missing", "updated"])
});
const MasterMetadataSchema = z.object({
  version: z.string(),
  sourceLanguage: LocaleSchema,
  targetLanguages: z.array(LocaleSchema),
  entries: z.array(TranslationEntrySchema),
  lastUpdated: z.string()
});
const LocaleDataSchema = z.record(z.string(), z.string());
const TranslationRequestSchema = z.object({
  entries: z.array(z.object({
    id: z.string(),
    text: z.string(),
    context: z.object({
      tags: z.array(z.string()),
      file: z.string()
    }).optional()
  })),
  sourceLanguage: LocaleSchema,
  targetLanguage: LocaleSchema,
  model: AIModelSchema.optional()
});
const TranslationResponseSchema = z.object({
  translations: z.record(z.string(), z.string()),
  success: z.boolean(),
  error: z.string().optional()
});
export {
  AIModelSchema as A,
  FallbackConfigSchema as F,
  GeminiModelSchema as G,
  LegacyModelSchema as L,
  ModelConfigSchema as M,
  OpenAIModelSchema as O,
  RustleConfigSchema as R,
  TranslationEntrySchema as T,
  LocaleSchema as a,
  AutoConfigSchema as b,
  MasterMetadataSchema as c,
  LocaleDataSchema as d,
  TranslationRequestSchema as e,
  TranslationResponseSchema as f
};
