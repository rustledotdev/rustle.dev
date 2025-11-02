import { z } from 'zod';
import { DEFAULT_API_URL, DEFAULT_LOCALE_BASE_PATH, DEFAULT_CONFIG_FILE_NAME } from '../constants';
import fs from 'fs';
import path from 'path';

export const RustleConfigSchema = z.object({
  sourceLanguage: z.string().min(2).max(5).default('en'),
  targetLanguages: z.array(z.string().min(2).max(5)).default(['es']),
  projectId: z.string().optional(),
  apiKey: z.string().optional(),
  model: z.string().optional(),
  apiUrl: z.string().url().default(DEFAULT_API_URL),
  localeBasePath: z.string().default(DEFAULT_LOCALE_BASE_PATH),
  buildLocale: z.string().min(2).max(5).optional(),
});

export type RustleConfig = z.infer<typeof RustleConfigSchema>;

function tryReadJson(filePath: string): unknown | undefined {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function loadRustleConfig(cwd: string = process.cwd()): RustleConfig {
  const jsonPath = path.join(cwd, DEFAULT_CONFIG_FILE_NAME);
  const fromFile = tryReadJson(jsonPath) ?? {};

  // Env overrides
  const envOverrides: Partial<RustleConfig> = {};
  if (process.env.RUSTLE_API_URL) envOverrides.apiUrl = process.env.RUSTLE_API_URL;
  if (process.env.RUSTLE_API_KEY) envOverrides.apiKey = process.env.RUSTLE_API_KEY;
  if (process.env.RUSTLE_SOURCE_LANG) envOverrides.sourceLanguage = process.env.RUSTLE_SOURCE_LANG;
  if (process.env.RUSTLE_TARGET_LANGS) envOverrides.targetLanguages = process.env.RUSTLE_TARGET_LANGS.split(',').map(s => s.trim()).filter(Boolean);
  if (process.env.RUSTLE_LOCALE_BASE_PATH) envOverrides.localeBasePath = process.env.RUSTLE_LOCALE_BASE_PATH;
  if (process.env.RUSTLE_BUILD_LOCALE) envOverrides.buildLocale = process.env.RUSTLE_BUILD_LOCALE;

  const parsed = RustleConfigSchema.parse({
    ...fromFile as object,
    ...envOverrides,
  });

  return parsed;
}

export function resolveConfig(base: Partial<RustleConfig> = {}, cwd: string = process.cwd()): RustleConfig {
  const fileCfg = loadRustleConfig(cwd);
  // Only apply defined overrides; ignore undefined so we don't clobber file values with defaults
  const overlay: Partial<RustleConfig> = Object.fromEntries(
    Object.entries(base).filter(([, v]) => v !== undefined)
  ) as Partial<RustleConfig>;
  const merged = RustleConfigSchema.parse({ ...fileCfg, ...overlay });
  // HTTPS guardrail in production: warn or fail if apiUrl is non-HTTPS (except localhost)
  try {
    if (process.env.NODE_ENV === 'production') {
      const u = new URL(merged.apiUrl);
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(u.hostname);
      if (u.protocol === 'http:' && !isLocal) {
        const msg = `[rustle] Production build using non-HTTPS apiUrl (${merged.apiUrl}).`;
        if (process.env.RUSTLE_STRICT_HTTPS === '1') {
          throw new Error(`${msg} Set an https URL or set RUSTLE_STRICT_HTTPS=0 to bypass.`);
        } else {
          try { console.warn(`${msg} Consider using HTTPS or set RUSTLE_STRICT_HTTPS=1 to enforce.`); } catch (e) { void e; }
        }
      }
    }
  } catch (e) { void e; }
  return merged;
}

