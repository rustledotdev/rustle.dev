import { z } from 'zod';

// Supported AI models
export const OpenAIModelSchema = z.enum([
  'gpt-4', 'gpt-4-turbo', 'gpt-4-turbo-preview',
  'gpt-3.5-turbo', 'gpt-3.5-turbo-16k',
]);

export const GeminiModelSchema = z.enum([
  'gemini-1.5-pro', 'gemini-1.5-flash',
  'gemini-pro', 'gemini-pro-vision',
]);

export const LegacyModelSchema = z.enum(['openai', 'gemini', 'azure']);

export const AIModelSchema = z.union([
  OpenAIModelSchema,
  GeminiModelSchema,
  LegacyModelSchema
]);

export type AIModel = z.infer<typeof AIModelSchema>;

// Locale configuration
export const LocaleSchema = z.string().min(2).max(5);
export type Locale = z.infer<typeof LocaleSchema>;

// Model configuration for different providers
export const ModelConfigSchema = z.record(
  AIModelSchema,
  z.record(LocaleSchema, z.string())
);
export type ModelConfig = z.infer<typeof ModelConfigSchema>;

// Auto translation configuration
export const AutoConfigSchema = z.object({
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});
export type AutoConfig = z.infer<typeof AutoConfigSchema>;

// Fallback configuration
export const FallbackConfigSchema = z.object({
  exclude: z.array(z.string()).optional(),
  include: z.array(z.string()).optional(),
});
export type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

// Main Rustle configuration
export const RustleConfigSchema = z.object({
  deactivate: z.boolean().optional().default(false),
  sourceLanguage: LocaleSchema.default('en'),
  targetLanguages: z.array(LocaleSchema),
  currentLocale: LocaleSchema.optional(),
  apiKey: z.string(),
  model: AIModelSchema.default('gpt-3.5-turbo'),
  modelConfig: ModelConfigSchema.optional(),
  debug: z.boolean().optional().default(false),
  auto: z.boolean().optional().default(true),
  autoConfig: AutoConfigSchema.optional(),
  fallback: z.boolean().optional().default(true),
  fallbackConfig: FallbackConfigSchema.optional(),
  localeBasePath: z.string().optional().default('/rustle/locales'),
  useVirtualDOM: z.boolean().optional().default(true),
});
export type RustleConfig = z.infer<typeof RustleConfigSchema>;

// Translation metadata entry
export const TranslationEntrySchema = z.object({
  fingerprint: z.string(),
  source: z.string(),
  file: z.string(),
  loc: z.object({
    start: z.number(),
    end: z.number(),
  }),
  contentHash: z.string(),
  version: z.number(),
  translations: z.record(LocaleSchema, z.string()),
  lastTranslatedAt: z.string().optional(),
  tags: z.array(z.string()),
  status: z.enum(['translated', 'missing', 'updated']),
});
export type TranslationEntry = z.infer<typeof TranslationEntrySchema>;

// Master metadata structure
export const MasterMetadataSchema = z.object({
  version: z.string(),
  sourceLanguage: LocaleSchema,
  targetLanguages: z.array(LocaleSchema),
  entries: z.array(TranslationEntrySchema),
  lastUpdated: z.string(),
});
export type MasterMetadata = z.infer<typeof MasterMetadataSchema>;

// Locale data structure (runtime optimized)
export const LocaleDataSchema = z.record(z.string(), z.string());
export type LocaleData = z.infer<typeof LocaleDataSchema>;

// Translation request for backend API
export const TranslationRequestSchema = z.object({
  entries: z.array(z.object({
    id: z.string(),
    text: z.string(),
    context: z.object({
      tags: z.array(z.string()),
      file: z.string(),
    }).optional(),
  })),
  sourceLanguage: LocaleSchema,
  targetLanguage: LocaleSchema,
  model: AIModelSchema.optional(),
});
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

// Translation response from backend API
export const TranslationResponseSchema = z.object({
  translations: z.record(z.string(), z.string()),
  success: z.boolean(),
  error: z.string().optional(),
});
export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;

// Hook return type - Enhanced for SaaS optimization
export interface UseRustleReturn {
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
  translate: (text: string, targetLocale?: Locale, options?: {
    cache?: boolean;
    context?: { tags?: string[]; file?: string };
  }) => Promise<string>;
  translateBatch?: (
    texts: Array<{ id: string; text: string; context?: { tags?: string[]; file?: string } }>,
    targetLocale?: Locale,
    options?: { cache?: boolean; retryCount?: number; requestKey?: string }
  ) => Promise<Record<string, string>>;
  clearCache?: () => void;
  isLoading: boolean;
  error: string | null;
}

// Component props
export interface RustleBoxProps extends Partial<Omit<RustleConfig, 'apiKey'>> {
  children: React.ReactNode;
  apiKey: string; // Required API key
  initialLocale?: Locale; // Initial locale override
  serverLocale?: Locale; // For server-side locale detection
  useVirtualDOM?: boolean; // Enable React Virtual DOM approach (default: true)
  localeBasePath?: string; // Base path for locale files
  loadingConfig?: any; // Loading configuration for translation states
}

export interface RustleGoProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  cache?: boolean; // Enable/disable caching (default: true)
}

export interface TranslatedHTMLProps {
  html: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  cache?: boolean;
  fallback?: string;
  [key: string]: any; // Allow additional props
}

// Context type
export interface RustleContextType {
  config: RustleConfig;
  currentLocale: Locale;
  setLocale: (locale: Locale) => void;
  localeData: Record<Locale, LocaleData>;
  isLoading: boolean;
  error: string | null;
}
