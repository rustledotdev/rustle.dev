'use client';

import type { Locale } from '../types';
import { setLocaleToCookie, getLocaleFromCookie } from './cookies';

/**
 * Handle semi-dynamic texts with placeholders
 * e.g., "You have {count} unread messages" where count is dynamic
 */
export function interpolateText(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Extract template from semi-dynamic text for translation
 * e.g., "You have 5 unread messages" -> "You have {count} unread messages"
 */
export function extractTemplate(
  text: string,
  patterns: Array<{ regex: RegExp; placeholder: string }>
): string {
  let template = text;
  
  patterns.forEach(({ regex, placeholder }) => {
    template = template.replace(regex, placeholder);
  });
  
  return template;
}

/**
 * Common patterns for extracting templates
 */
export const commonPatterns = [
  { regex: /\b\d+\b/g, placeholder: '{count}' },
  { regex: /\b\d+\.\d+\b/g, placeholder: '{amount}' },
  { regex: /\b[A-Z][a-z]+ \d{1,2}, \d{4}\b/g, placeholder: '{date}' },
  { regex: /\b\d{1,2}:\d{2}(:\d{2})?\b/g, placeholder: '{time}' },
];

/**
 * Path-based locale detection and management
 */
export class PathLocaleManager {
  /**
   * Extract locale from URL path (e.g., /en/about, /fr/contact)
   */
  static extractLocaleFromPath(
    pathname: string,
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt']
  ): { locale: Locale | null; pathWithoutLocale: string } {
    // Remove leading slash and split path
    const pathSegments = pathname.replace(/^\/+/, '').split('/');
    const firstSegment = pathSegments[0];

    // Check if first segment is a supported locale
    if (firstSegment && supportedLocales.includes(firstSegment as Locale)) {
      const locale = firstSegment as Locale;
      const pathWithoutLocale = '/' + pathSegments.slice(1).join('/');
      return { locale, pathWithoutLocale };
    }

    return { locale: null, pathWithoutLocale: pathname };
  }

  /**
   * Add locale to path (e.g., /about -> /fr/about)
   */
  static addLocaleToPath(pathname: string, locale: Locale): string {
    // Remove any existing locale from path first
    const { pathWithoutLocale } = this.extractLocaleFromPath(pathname);

    // Add new locale
    const cleanPath = pathWithoutLocale.replace(/^\/+/, '');
    return `/${locale}${cleanPath ? '/' + cleanPath : ''}`;
  }

  /**
   * Remove locale from path (e.g., /fr/about -> /about)
   */
  static removeLocaleFromPath(
    pathname: string,
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt']
  ): string {
    const { pathWithoutLocale } = this.extractLocaleFromPath(pathname, supportedLocales);
    return pathWithoutLocale || '/';
  }

  /**
   * Check if path contains a locale
   */
  static hasLocaleInPath(
    pathname: string,
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt']
  ): boolean {
    const { locale } = this.extractLocaleFromPath(pathname, supportedLocales);
    return locale !== null;
  }

  /**
   * Generate localized paths for all supported locales
   */
  static generateLocalizedPaths(
    basePath: string,
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt']
  ): Record<Locale, string> {
    const { pathWithoutLocale } = this.extractLocaleFromPath(basePath, supportedLocales);
    const paths: Record<string, string> = {};

    supportedLocales.forEach(locale => {
      paths[locale] = this.addLocaleToPath(pathWithoutLocale, locale);
    });

    return paths as Record<Locale, string>;
  }
}

/**
 * Server-side locale detection and management
 */
export class ServerLocaleManager {
  /**
   * Get locale from server-side sources (path, headers, cookies)
   */
  static getServerLocale(
    request?: {
      url?: string;
      pathname?: string;
      headers?: Record<string, string>;
      cookies?: Record<string, string>;
    },
    supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt']
  ): Locale {
    if (!request) return 'en';

    // 1. Check URL path first (highest priority for path-based routing)
    const pathname = request.pathname || request.url;
    if (pathname) {
      const { locale } = PathLocaleManager.extractLocaleFromPath(pathname, supportedLocales);
      if (locale) {
        return locale;
      }
    }

    // 2. Check cookie (second priority)
    const cookieLocale = request.cookies?.['rustle-locale'] as Locale;
    if (cookieLocale && supportedLocales.includes(cookieLocale)) {
      return cookieLocale;
    }

    // 3. Check Accept-Language header
    const acceptLanguage = request.headers?.['accept-language'];
    if (acceptLanguage) {
      const languages = acceptLanguage
        .split(',')
        .map(lang => lang?.split(';')?.[0]?.trim()?.split('-')?.[0])
        .filter(lang => lang && supportedLocales.includes(lang as Locale));

      if (languages.length > 0) {
        return languages[0] as Locale;
      }
    }

    // 4. Default to English
    return 'en';
  }

  /**
   * Set locale on server-side (for SSR)
   */
  static setServerLocale(
    locale: Locale,
    response?: {
      setHeader?: (name: string, value: string) => void;
      headers?: Record<string, string>;
    }
  ): void {
    if (!response) return;

    // Set cookie header
    const cookieValue = `rustle-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    
    if (response.setHeader) {
      response.setHeader('Set-Cookie', cookieValue);
    } else if (response.headers) {
      response.headers['Set-Cookie'] = cookieValue;
    }
  }
}

/**
 * Universal locale manager for both client and server
 */
export class UniversalLocaleManager {
  private static currentLocale: Locale = 'en';
  private static listeners: Array<(locale: Locale) => void> = [];
  private static pathBasedRouting: boolean = false;
  private static supportedLocales: Locale[] = ['en', 'es', 'fr', 'de', 'it', 'pt'];

  /**
   * Configure path-based routing
   */
  static configurePathBasedRouting(
    enabled: boolean,
    supportedLocales?: Locale[]
  ): void {
    this.pathBasedRouting = enabled;
    if (supportedLocales) {
      this.supportedLocales = supportedLocales;
    }
  }

  /**
   * Get current locale (works on both client and server)
   */
  static getCurrentLocale(): Locale {
    // On client, check path first if path-based routing is enabled
    if (typeof window !== 'undefined' && this.pathBasedRouting) {
      const { locale } = PathLocaleManager.extractLocaleFromPath(
        window.location.pathname,
        this.supportedLocales
      );
      if (locale) {
        this.currentLocale = locale;
        return locale;
      }
    }

    // On client, check cookie
    if (typeof window !== 'undefined') {
      const cookieLocale = getLocaleFromCookie();
      if (cookieLocale) {
        this.currentLocale = cookieLocale;
      }
    }

    return this.currentLocale;
  }

  /**
   * Set current locale (works on both client and server)
   */
  static setCurrentLocale(locale: Locale, updatePath: boolean = true): void {
    this.currentLocale = locale;

    // On client, handle path-based routing
    if (typeof window !== 'undefined') {
      // Set cookie
      setLocaleToCookie(locale);

      // Update URL path if path-based routing is enabled
      if (this.pathBasedRouting && updatePath) {
        const newPath = PathLocaleManager.addLocaleToPath(window.location.pathname, locale);
        const newUrl = newPath + window.location.search + window.location.hash;

        // Use pushState to update URL without page reload
        window.history.pushState(null, '', newUrl);
      }
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(locale));
  }

  /**
   * Navigate to a path with locale
   */
  static navigateToLocalizedPath(path: string, locale?: Locale): void {
    if (typeof window === 'undefined') return;

    const targetLocale = locale || this.currentLocale;

    if (this.pathBasedRouting) {
      const localizedPath = PathLocaleManager.addLocaleToPath(path, targetLocale);
      window.location.href = localizedPath;
    } else {
      // Set locale and navigate normally
      this.setCurrentLocale(targetLocale, false);
      window.location.href = path;
    }
  }

  /**
   * Subscribe to locale changes
   */
  static subscribe(listener: (locale: Locale) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Initialize locale from server-side data
   */
  static initializeFromServer(serverLocale: Locale): void {
    this.currentLocale = serverLocale;
  }
}

/**
 * Hook for setting locale in both server and client components
 */
export function createLocaleManager(initialLocale?: Locale) {
  if (initialLocale) {
    UniversalLocaleManager.initializeFromServer(initialLocale);
  }

  return {
    getCurrentLocale: () => UniversalLocaleManager.getCurrentLocale(),
    setLocale: (locale: Locale, updatePath?: boolean) => UniversalLocaleManager.setCurrentLocale(locale, updatePath),
    subscribe: (listener: (locale: Locale) => void) => UniversalLocaleManager.subscribe(listener),
    navigateToLocalizedPath: (path: string, locale?: Locale) => UniversalLocaleManager.navigateToLocalizedPath(path, locale),
    configurePathBasedRouting: (enabled: boolean, supportedLocales?: Locale[]) =>
      UniversalLocaleManager.configurePathBasedRouting(enabled, supportedLocales),
  };
}

/**
 * Path-based routing configuration options
 */
export interface PathBasedRoutingConfig {
  enabled: boolean;
  supportedLocales?: Locale[];
  defaultLocale?: Locale;
  excludePaths?: string[];
  includeDefaultLocaleInPath?: boolean;
  redirectToDefaultLocale?: boolean;
}

/**
 * Advanced path-based locale manager with routing integration
 */
export class AdvancedPathLocaleManager {
  private static config: PathBasedRoutingConfig = {
    enabled: false,
    supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt'],
    defaultLocale: 'en',
    excludePaths: ['/api', '/static', '/_next', '/favicon.ico'],
    includeDefaultLocaleInPath: false,
    redirectToDefaultLocale: true,
  };

  /**
   * Configure path-based routing
   */
  static configure(config: Partial<PathBasedRoutingConfig>): void {
    this.config = { ...this.config, ...config };
    UniversalLocaleManager.configurePathBasedRouting(
      this.config.enabled,
      this.config.supportedLocales
    );
  }

  /**
   * Check if path should be excluded from locale handling
   */
  static shouldExcludePath(pathname: string): boolean {
    return this.config.excludePaths?.some(excludePath =>
      pathname.startsWith(excludePath)
    ) || false;
  }

  /**
   * Get locale from request with advanced path handling
   */
  static getLocaleFromRequest(request: {
    pathname: string;
    headers?: Record<string, string>;
    cookies?: Record<string, string>;
  }): { locale: Locale; shouldRedirect: boolean; redirectPath?: string } {
    const { pathname } = request;

    // Skip excluded paths
    if (this.shouldExcludePath(pathname)) {
      return { locale: this.config.defaultLocale!, shouldRedirect: false };
    }

    // Extract locale from path
    const { locale: pathLocale, pathWithoutLocale } = PathLocaleManager.extractLocaleFromPath(
      pathname,
      this.config.supportedLocales
    );

    // If locale found in path, use it
    if (pathLocale) {
      return { locale: pathLocale, shouldRedirect: false };
    }

    // No locale in path, determine what to do
    const fallbackLocale = ServerLocaleManager.getServerLocale(
      { ...request, pathname: undefined }, // Don't use pathname for fallback detection
      this.config.supportedLocales
    );

    // If default locale and we don't include it in path, no redirect needed
    if (fallbackLocale === this.config.defaultLocale && !this.config.includeDefaultLocaleInPath) {
      return { locale: fallbackLocale, shouldRedirect: false };
    }

    // Need to redirect to localized path
    if (this.config.redirectToDefaultLocale) {
      const redirectPath = PathLocaleManager.addLocaleToPath(pathname, fallbackLocale);
      return {
        locale: fallbackLocale,
        shouldRedirect: true,
        redirectPath
      };
    }

    return { locale: fallbackLocale, shouldRedirect: false };
  }

  /**
   * Generate alternate language links for SEO
   */
  static generateAlternateLinks(
    currentPath: string,
    baseUrl: string = ''
  ): Array<{ locale: Locale; href: string; hreflang: string }> {
    const { pathWithoutLocale } = PathLocaleManager.extractLocaleFromPath(
      currentPath,
      this.config.supportedLocales
    );

    return this.config.supportedLocales!.map(locale => {
      let href: string;

      if (locale === this.config.defaultLocale && !this.config.includeDefaultLocaleInPath) {
        href = pathWithoutLocale;
      } else {
        href = PathLocaleManager.addLocaleToPath(pathWithoutLocale, locale);
      }

      return {
        locale,
        href: baseUrl + href,
        hreflang: locale === this.config.defaultLocale ? 'x-default' : locale,
      };
    });
  }

  /**
   * Get configuration
   */
  static getConfig(): PathBasedRoutingConfig {
    return { ...this.config };
  }
}

/**
 * Configurable metadata folder path
 */
export class MetadataPathManager {
  private static basePath: string = '/rustle/locales';

  static setBasePath(path: string): void {
    this.basePath = path.endsWith('/') ? path.slice(0, -1) : path;
  }

  static getBasePath(): string {
    return this.basePath;
  }

  static getLocalePath(locale: Locale): string {
    return `${this.basePath}/${locale}.json`;
  }

  static getMasterPath(): string {
    return `${this.basePath}/master.json`;
  }
}
