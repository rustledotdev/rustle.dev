import { readFileSync } from 'fs';
import { join } from 'path';
import type { Locale, LocaleData } from '../types';
import { getLocaleFromCookie, createServerLocaleCookie } from '../utils/cookies';

/**
 * Server-side translation utilities for Next.js and other SSR frameworks
 */

interface ServerTranslationOptions {
  localeBasePath?: string;
  sourceLanguage?: Locale;
  targetLanguages?: Locale[];
  fallback?: boolean;
  debug?: boolean;
}

/**
 * Load locale data on the server
 */
export async function loadServerLocaleData(
  locale: Locale,
  options: ServerTranslationOptions = {}
): Promise<LocaleData | null> {
  const {
    localeBasePath = './public/rustle/locales',
    fallback = true,
    sourceLanguage = 'en',
    debug = false
  } = options;

  try {
    const localePath = join(process.cwd(), localeBasePath, `${locale}.json`);
    const data = readFileSync(localePath, 'utf-8');
    const localeData = JSON.parse(data) as LocaleData;
    
    if (debug) {
      console.log(`✅ Server: Loaded locale ${locale} with ${Object.keys(localeData).length} entries`);
    }
    
    return localeData;
  } catch (error) {
    if (debug) {
      console.warn(`⚠️ Server: Failed to load locale ${locale}:`, error);
    }
    
    if (fallback && locale !== sourceLanguage) {
      if (debug) {
        console.log(`🔄 Server: Falling back to source language ${sourceLanguage}`);
      }
      return loadServerLocaleData(sourceLanguage, options);
    }
    
    return null;
  }
}

/**
 * Get locale from server request
 */
export function getServerLocale(
  cookieHeader: string | undefined,
  acceptLanguageHeader: string | undefined,
  options: ServerTranslationOptions = {}
): Locale {
  const {
    sourceLanguage = 'en',
    targetLanguages = ['es', 'fr', 'de', 'it', 'pt']
  } = options;

  // 1. Check cookie first
  const cookieLocale = getLocaleFromCookie(cookieHeader);
  if (cookieLocale && targetLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }

  // 2. Check Accept-Language header
  if (acceptLanguageHeader) {
    const preferredLanguages = acceptLanguageHeader
      .split(',')
      .map(lang => {
        const langCode = lang.split(';')[0]?.trim().split('-')[0];
        return langCode as Locale;
      })
      .filter(lang => lang && targetLanguages.includes(lang));

    if (preferredLanguages.length > 0) {
      return preferredLanguages[0]!;
    }
  }

  // 3. Fallback to source language
  return sourceLanguage;
}

/**
 * Create server-side locale cookie header
 */
export function createServerLocaleHeader(locale: Locale): string {
  return createServerLocaleCookie(locale);
}

/**
 * Server-side translation function
 */
export function translateServer(
  fingerprint: string,
  originalText: string,
  localeData: LocaleData | null,
  fallback: boolean = true
): string {
  if (!localeData || !localeData[fingerprint]) {
    return fallback ? originalText : '';
  }
  
  return localeData[fingerprint];
}

/**
 * Inject translations into HTML string (for SSR)
 */
export function injectServerTranslations(
  html: string,
  localeData: LocaleData | null,
  options: { debug?: boolean } = {}
): string {
  if (!localeData) {
    return html;
  }

  const { debug = false } = options;
  let translatedHtml = html;
  let translationCount = 0;

  // Pattern to match elements with data-i18n-fingerprint
  const fingerprintPattern = /(<[^>]*data-i18n-fingerprint=["']([^"']+)["'][^>]*>)([^<]+)(<\/[^>]+>)/g;
  
  translatedHtml = translatedHtml.replace(fingerprintPattern, (match, openTag, fingerprint, content, closeTag) => {
    const translation = localeData[fingerprint];
    
    if (translation) {
      translationCount++;
      if (debug) {
        console.log(`🔄 Server: Translating ${fingerprint}: "${content}" → "${translation}"`);
      }
      
      // Add data-i18n-original attribute and replace content
      const enhancedOpenTag = openTag.replace('>', ` data-i18n-original="${content}" data-i18n="true">`);
      return `${enhancedOpenTag}${translation}${closeTag}`;
    }
    
    return match;
  });

  if (debug && translationCount > 0) {
    console.log(`✅ Server: Applied ${translationCount} translations`);
  }

  return translatedHtml;
}

/**
 * Next.js middleware helper for locale detection and redirection
 */
export function createLocaleMiddleware(options: ServerTranslationOptions = {}) {
  const {
    sourceLanguage = 'en',
    targetLanguages = ['es', 'fr', 'de', 'it', 'pt'],
    debug = false
  } = options;

  return function localeMiddleware(request: any) {
    const cookieHeader = request.headers.get('cookie');
    const acceptLanguageHeader = request.headers.get('accept-language');
    
    const detectedLocale = getServerLocale(cookieHeader, acceptLanguageHeader, {
      sourceLanguage,
      targetLanguages
    });

    if (debug) {
      console.log(`🌐 Middleware: Detected locale ${detectedLocale} for ${request.url}`);
    }

    // Return locale information for use in pages/components
    return {
      locale: detectedLocale,
      cookieHeader: createServerLocaleHeader(detectedLocale)
    };
  };
}

export * from '../utils/cookies';
export * from '../types';
