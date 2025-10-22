'use client';

import { useEffect, useState } from 'react';
import { setLocaleToCookie, getLocaleFromCookie } from '../utils/cookies';
import type { Locale, LocaleData } from '../types';

interface ClientOnlyLocaleLoaderProps {
  targetLanguages: Locale[];
  sourceLanguage: Locale;
  localeBasePath: string;
  debug?: boolean;
  onLocaleDataLoaded: (locale: Locale, data: LocaleData) => void;
  onLocaleChange: (locale: Locale) => void;
}

/**
 * Client-only component that handles locale loading and switching
 * This component is guaranteed to run only on the client-side
 */
export function ClientOnlyLocaleLoader({
  targetLanguages,
  sourceLanguage,
  localeBasePath,
  debug = false,
  onLocaleDataLoaded,
  onLocaleChange,
}: ClientOnlyLocaleLoaderProps) {
  const [mounted, setMounted] = useState(false);

  // Force client-side only execution
  useEffect(() => {
    setMounted(true);
    console.log('🔥 ClientOnlyLocaleLoader: Client-side component mounted!');
    
    // Load all locale files immediately
    const loadAllLocaleFiles = async () => {
      console.log(`🚀 ClientOnlyLocaleLoader: Loading ALL locale files for: [${targetLanguages.join(', ')}]`);
      
      for (const targetLocale of targetLanguages) {
        if (targetLocale !== sourceLanguage) {
          try {
            const response = await fetch(`${localeBasePath}/${targetLocale}.json`);
            if (response.ok) {
              const data = await response.json();
              onLocaleDataLoaded(targetLocale, data);
              console.log(`✅ ClientOnlyLocaleLoader: Loaded ${targetLocale} with ${Object.keys(data).length} entries`);
            } else {
              console.warn(`⚠️ ClientOnlyLocaleLoader: Failed to load ${targetLocale} (${response.status})`);
            }
          } catch (error) {
            console.warn(`⚠️ ClientOnlyLocaleLoader: Error loading ${targetLocale}:`, error);
          }
        }
      }
    };

    loadAllLocaleFiles();

    // Set up global locale switcher
    const switchLocale = (newLocale: Locale) => {
      if (targetLanguages.includes(newLocale)) {
        console.log(`🌐 ClientOnlyLocaleLoader: Switching locale to: ${newLocale}`);
        setLocaleToCookie(newLocale);
        onLocaleChange(newLocale);
        console.log(`🍪 ClientOnlyLocaleLoader: Saved locale ${newLocale} to cookie`);
      } else {
        console.warn(`⚠️ ClientOnlyLocaleLoader: Invalid locale: ${newLocale}`);
      }
    };

    (window as any).rustleSwitchLocale = switchLocale;
    console.log('🌍 ClientOnlyLocaleLoader: Global locale switcher available: window.rustleSwitchLocale(locale)');

    // Check for cookie changes periodically
    const checkCookieChanges = () => {
      const cookieLocale = getLocaleFromCookie();
      if (cookieLocale && targetLanguages.includes(cookieLocale)) {
        onLocaleChange(cookieLocale);
      }
    };

    const interval = setInterval(checkCookieChanges, 1000);
    return () => clearInterval(interval);
  }, [targetLanguages, sourceLanguage, localeBasePath, onLocaleDataLoaded, onLocaleChange]);

  // Don't render anything on server-side
  if (!mounted) {
    return null;
  }

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden component that only exists to run client-side effects */}
      <span data-testid="client-only-locale-loader">Client-side locale loader active</span>
    </div>
  );
}
