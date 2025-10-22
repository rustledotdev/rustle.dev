import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Locale, LocaleData } from '../types';
import { PathLocaleManager } from '../utils/localeUtils';

export interface SSRTranslationData {
  locale: Locale;
  translations: LocaleData;
  sourceLanguage: Locale;
}

export interface SSRConfig {
  sourceLanguage: Locale;
  targetLanguages: Locale[];
  localeBasePath?: string;
  fallback?: boolean;
}

/**
 * Server-side locale detection from Next.js request
 */
export function detectServerLocale(
  url: string,
  headers: Record<string, string | string[] | undefined>,
  config: SSRConfig
): Locale {
  const supportedLocales = [...config.targetLanguages, config.sourceLanguage];

  // 1. Check URL path for locale (e.g., /en/about, /fr/contact)
  const urlObj = new URL(url, 'http://localhost');
  const { locale: pathLocale } = PathLocaleManager.extractLocaleFromPath(
    urlObj.pathname,
    supportedLocales
  );
  if (pathLocale) {
    return pathLocale;
  }

  // 2. Check URL parameters (e.g., ?locale=fr)
  const urlLocale = urlObj.searchParams.get('locale');
  if (urlLocale && supportedLocales.includes(urlLocale as Locale)) {
    return urlLocale as Locale;
  }

  // 3. Check Accept-Language header
  const acceptLanguage = headers['accept-language'];
  if (typeof acceptLanguage === 'string') {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const parts = lang.split(';');
        return parts[0] ? parts[0].trim().toLowerCase() : '';
      })
      .map(lang => {
        const parts = lang.split('-');
        return parts[0] || '';
      }) // Convert en-US to en
      .filter(lang => lang.length > 0);

    for (const lang of languages) {
      if (supportedLocales.includes(lang as Locale)) {
        return lang as Locale;
      }
    }
  }

  // 4. Default to source language
  return config.sourceLanguage;
}

/**
 * Load translations from file system on server
 */
export function loadServerTranslations(
  locale: Locale,
  config: SSRConfig,
  publicDir: string = 'public'
): LocaleData | null {
  try {
    const localeBasePath = config.localeBasePath || '/rustle/locales';
    const filePath = join(process.cwd(), publicDir, localeBasePath, `${locale}.json`);
    
    if (!existsSync(filePath)) {
      return null;
    }

    const fileContent = readFileSync(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    return translations;
  } catch (error) {
    console.warn(`⚠️ Failed to load server translations for ${locale}:`, error);
    return null;
  }
}

/**
 * Generate server-side translation data for Next.js
 */
export function generateSSRTranslationData(
  url: string,
  headers: Record<string, string | string[] | undefined>,
  config: SSRConfig,
  publicDir?: string
): SSRTranslationData {
  const locale = detectServerLocale(url, headers, config);
  const translations = loadServerTranslations(locale, config, publicDir) || {};

  return {
    locale,
    translations,
    sourceLanguage: config.sourceLanguage
  };
}

/**
 * Generate script tag for injecting SSR data into HTML
 */
export function generateSSRScript(data: SSRTranslationData): string {
  const safeData = {
    locale: data.locale,
    translations: data.translations,
    sourceLanguage: data.sourceLanguage
  };

  return `
    <script>
      window.__RUSTLE_SSR_LOCALE__ = ${JSON.stringify(data.locale)};
      window.__RUSTLE_SSR_TRANSLATIONS__ = ${JSON.stringify(data.translations)};
      window.__RUSTLE_SSR_SOURCE_LANGUAGE__ = ${JSON.stringify(data.sourceLanguage)};
    </script>
  `;
}

/**
 * Server-side text translation using loaded translations
 */
export function translateServerSide(
  text: string,
  translations: LocaleData,
  sourceLanguage: Locale,
  targetLocale: Locale
): string {
  // If target is source language, return original text
  if (targetLocale === sourceLanguage) {
    return text;
  }

  // Try to find translation by text content (for non-fingerprinted content)
  for (const [fingerprint, translation] of Object.entries(translations)) {
    if (typeof translation === 'string' && translation.toLowerCase().includes(text.toLowerCase())) {
      return translation;
    }
  }

  // Try exact text match
  const exactMatch = Object.values(translations).find(
    translation => typeof translation === 'string' && translation === text
  );
  
  if (exactMatch) {
    return exactMatch;
  }

  // Fallback to original text
  return text;
}

/**
 * Next.js middleware helper for SSR translations
 */
export function createNextSSRMiddleware(config: SSRConfig) {
  return function middleware(request: any) {
    const url = request.url;
    const headers = Object.fromEntries(request.headers.entries());
    
    const ssrData = generateSSRTranslationData(url, headers, config);
    
    // Add SSR data to request for use in pages/components
    request.rustleSSR = ssrData;
    
    return ssrData;
  };
}
