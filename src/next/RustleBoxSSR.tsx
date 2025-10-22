'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Locale, LocaleData, RustleConfig } from '../types';
import { getLocaleFromCookie } from '../utils/cookies';
import { RustleProvider } from '../components/RustleContext';
import { AutoTranslate } from '../components/AutoTranslate';

export interface RustleBoxSSRProps {
  children: ReactNode;
  sourceLanguage: Locale;
  targetLanguages: Locale[];
  apiKey?: string;
  model?: string;
  debug?: boolean;
  auto?: boolean;
  fallback?: boolean;
  useVirtualDOM?: boolean;
  localeBasePath?: string;
  // SSR-specific props
  ssrLocale?: Locale;
  ssrTranslations?: LocaleData;
}

export function RustleBoxSSR({
  children,
  sourceLanguage = 'en',
  targetLanguages = ['es', 'fr', 'de'],
  apiKey,
  model = 'gpt-3.5-turbo',
  debug = false,
  auto = true,
  fallback = true,
  useVirtualDOM = true,
  localeBasePath = '/rustle/locales',
  ssrLocale,
  ssrTranslations,
}: RustleBoxSSRProps) {

  // Client-side locale detection function
  const getInitialLocale = (): Locale => {
    // Check for SSR data first
    if (typeof window !== 'undefined') {
      const ssrClientLocale = (window as any).__RUSTLE_SSR_LOCALE__;
      if (ssrClientLocale && [...targetLanguages, sourceLanguage].includes(ssrClientLocale)) {
        return ssrClientLocale;
      }

      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlLocale = urlParams.get('locale');
      if (urlLocale && [...targetLanguages, sourceLanguage].includes(urlLocale as Locale)) {
        return urlLocale as Locale;
      }

      // Check cookie
      const cookieLocale = getLocaleFromCookie();
      if (cookieLocale && [...targetLanguages, sourceLanguage].includes(cookieLocale)) {
        return cookieLocale;
      }

      // Check browser language
      const browserLang = navigator.language.split('-')[0] as Locale;
      if ([...targetLanguages, sourceLanguage].includes(browserLang)) {
        return browserLang;
      }
    }

    return sourceLanguage;
  };
  // Create config object for RustleProvider
  const config: RustleConfig = {
    deactivate: false,
    sourceLanguage,
    targetLanguages,
    apiKey: apiKey || '',
    model: model as any,
    debug,
    auto,
    fallback,
    useVirtualDOM,
    localeBasePath,
    currentLocale: ssrLocale || sourceLanguage, // Use SSR locale if available
  };

  // Initialize locale data with SSR translations if available
  const initialLocaleData: Record<Locale, LocaleData> = {};
  if (ssrTranslations && ssrLocale) {
    initialLocaleData[ssrLocale] = ssrTranslations;
  }

  // Inject SSR data into window for client-side hydration
  useEffect(() => {
    if (typeof window !== 'undefined' && ssrLocale && ssrTranslations) {
      (window as any).__RUSTLE_SSR_LOCALE__ = ssrLocale;
      (window as any).__RUSTLE_SSR_TRANSLATIONS__ = ssrTranslations;
      (window as any).__RUSTLE_SSR_SOURCE_LANGUAGE__ = sourceLanguage;
    }
  }, [ssrLocale, ssrTranslations, sourceLanguage]);

  if (debug) {
    console.log(`🔍 RustleBoxSSR: Rendering with SSR data:`, {
      ssrLocale,
      hasSSRTranslations: !!ssrTranslations,
      translationCount: ssrTranslations ? Object.keys(ssrTranslations).length : 0,
      useVirtualDOM
    });
  }

  return (
    <RustleProvider config={config} initialLocaleData={initialLocaleData}>
      {useVirtualDOM ? (
        <AutoTranslate>{children}</AutoTranslate>
      ) : (
        children
      )}
    </RustleProvider>
  );
}

// Re-export useRustle for consistency
export { useRustle as useRustleSSR } from '../hooks/useRustle';
