'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { Locale } from '../types';
import { 
  PathLocaleManager, 
  UniversalLocaleManager, 
  AdvancedPathLocaleManager,
  type PathBasedRoutingConfig 
} from '../utils/localeUtils';

export interface UsePathBasedLocaleOptions {
  supportedLocales?: Locale[];
  defaultLocale?: Locale;
  enablePathRouting?: boolean;
  excludePaths?: string[];
  includeDefaultLocaleInPath?: boolean;
  onLocaleChange?: (locale: Locale) => void;
}

export interface UsePathBasedLocaleReturn {
  currentLocale: Locale;
  setLocale: (locale: Locale, updatePath?: boolean) => void;
  navigateToLocalizedPath: (path: string, locale?: Locale) => void;
  getLocalizedPath: (path: string, locale?: Locale) => string;
  removeLocaleFromPath: (path: string) => string;
  generateAlternateLinks: (baseUrl?: string) => Array<{ locale: Locale; href: string; hreflang: string }>;
  isPathBasedRoutingEnabled: boolean;
  supportedLocales: Locale[];
  pathWithoutLocale: string;
}

/**
 * React hook for path-based locale management
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     currentLocale,
 *     setLocale,
 *     navigateToLocalizedPath,
 *     getLocalizedPath,
 *     generateAlternateLinks
 *   } = usePathBasedLocale({
 *     enablePathRouting: true,
 *     supportedLocales: ['en', 'fr', 'es', 'de'],
 *     defaultLocale: 'en',
 *     includeDefaultLocaleInPath: false
 *   });
 * 
 *   return (
 *     <div>
 *       <p>Current locale: {currentLocale}</p>
 *       <button onClick={() => setLocale('fr')}>
 *         Switch to French
 *       </button>
 *       <a href={getLocalizedPath('/about', 'es')}>
 *         About (Spanish)
 *       </a>
 *     </div>
 *   );
 * }
 * ```
 */
export function usePathBasedLocale(
  options: UsePathBasedLocaleOptions = {}
): UsePathBasedLocaleReturn {
  const {
    supportedLocales = ['en', 'es', 'fr', 'de', 'it', 'pt'],
    defaultLocale = 'en',
    enablePathRouting = false,
    excludePaths = ['/api', '/static', '/_next', '/favicon.ico'],
    includeDefaultLocaleInPath = false,
    onLocaleChange
  } = options;

  const [currentLocale, setCurrentLocaleState] = useState<Locale>(defaultLocale);
  const [pathWithoutLocale, setPathWithoutLocale] = useState<string>('/');

  // Initialize path-based routing configuration
  useEffect(() => {
    if (enablePathRouting) {
      AdvancedPathLocaleManager.configure({
        enabled: true,
        supportedLocales,
        defaultLocale,
        excludePaths,
        includeDefaultLocaleInPath,
        redirectToDefaultLocale: false // Handle redirects manually in React
      });
    }
  }, [enablePathRouting, supportedLocales, defaultLocale, excludePaths, includeDefaultLocaleInPath]);

  // Initialize locale from current path
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { locale, pathWithoutLocale: cleanPath } = PathLocaleManager.extractLocaleFromPath(
      window.location.pathname,
      supportedLocales
    );

    const detectedLocale = locale || UniversalLocaleManager.getCurrentLocale();
    setCurrentLocaleState(detectedLocale);
    setPathWithoutLocale(cleanPath);

    // Initialize UniversalLocaleManager
    UniversalLocaleManager.configurePathBasedRouting(enablePathRouting, supportedLocales);
    UniversalLocaleManager.setCurrentLocale(detectedLocale, false);
  }, [enablePathRouting, supportedLocales]);

  // Listen for browser navigation changes
  useEffect(() => {
    if (typeof window === 'undefined' || !enablePathRouting) return;

    const handlePopState = () => {
      const { locale, pathWithoutLocale: cleanPath } = PathLocaleManager.extractLocaleFromPath(
        window.location.pathname,
        supportedLocales
      );

      const newLocale = locale || defaultLocale;
      setCurrentLocaleState(newLocale);
      setPathWithoutLocale(cleanPath);
      UniversalLocaleManager.setCurrentLocale(newLocale, false);
      
      if (onLocaleChange) {
        onLocaleChange(newLocale);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [enablePathRouting, supportedLocales, defaultLocale, onLocaleChange]);

  // Set locale with optional path update
  const setLocale = useCallback((locale: Locale, updatePath: boolean = true) => {
    setCurrentLocaleState(locale);
    UniversalLocaleManager.setCurrentLocale(locale, enablePathRouting && updatePath);

    if (enablePathRouting && updatePath && typeof window !== 'undefined') {
      const newPath = getLocalizedPath(pathWithoutLocale, locale);
      const newUrl = newPath + window.location.search + window.location.hash;
      window.history.pushState(null, '', newUrl);
      setPathWithoutLocale(PathLocaleManager.removeLocaleFromPath(newPath, supportedLocales));
    }

    if (onLocaleChange) {
      onLocaleChange(locale);
    }
  }, [enablePathRouting, pathWithoutLocale, supportedLocales, onLocaleChange]);

  // Navigate to a localized path
  const navigateToLocalizedPath = useCallback((path: string, locale?: Locale) => {
    const targetLocale = locale || currentLocale;
    
    if (enablePathRouting) {
      const localizedPath = getLocalizedPath(path, targetLocale);
      window.location.href = localizedPath;
    } else {
      setLocale(targetLocale, false);
      window.location.href = path;
    }
  }, [currentLocale, enablePathRouting, setLocale]);

  // Get localized path for a given path and locale
  const getLocalizedPath = useCallback((path: string, locale?: Locale) => {
    const targetLocale = locale || currentLocale;
    
    if (!enablePathRouting) {
      return path;
    }

    // If it's the default locale and we don't include it in path
    if (targetLocale === defaultLocale && !includeDefaultLocaleInPath) {
      return PathLocaleManager.removeLocaleFromPath(path, supportedLocales);
    }

    return PathLocaleManager.addLocaleToPath(path, targetLocale);
  }, [currentLocale, enablePathRouting, defaultLocale, includeDefaultLocaleInPath, supportedLocales]);

  // Remove locale from path
  const removeLocaleFromPath = useCallback((path: string) => {
    return PathLocaleManager.removeLocaleFromPath(path, supportedLocales);
  }, [supportedLocales]);

  // Generate alternate language links for SEO
  const generateAlternateLinks = useCallback((baseUrl: string = '') => {
    if (!enablePathRouting) {
      return supportedLocales.map(locale => ({
        locale,
        href: `${baseUrl}${pathWithoutLocale}?locale=${locale}`,
        hreflang: locale === defaultLocale ? 'x-default' : locale,
      }));
    }

    return AdvancedPathLocaleManager.generateAlternateLinks(
      window?.location?.pathname || pathWithoutLocale,
      baseUrl
    );
  }, [enablePathRouting, supportedLocales, pathWithoutLocale, defaultLocale]);

  return {
    currentLocale,
    setLocale,
    navigateToLocalizedPath,
    getLocalizedPath,
    removeLocaleFromPath,
    generateAlternateLinks,
    isPathBasedRoutingEnabled: enablePathRouting,
    supportedLocales,
    pathWithoutLocale,
  };
}

/**
 * Higher-order component for path-based locale management
 */
export function withPathBasedLocale<P extends object>(
  Component: React.ComponentType<P & UsePathBasedLocaleReturn>,
  options?: UsePathBasedLocaleOptions
) {
  const PathBasedLocaleWrapper = (props: P) => {
    const localeProps = usePathBasedLocale(options);

    return React.createElement(Component, { ...props, ...localeProps });
  };

  PathBasedLocaleWrapper.displayName = `withPathBasedLocale(${Component.displayName || Component.name})`;

  return PathBasedLocaleWrapper;
}
