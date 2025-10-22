'use client';

import React from 'react';
import { RustleProvider } from './RustleContext';
import { AutoTranslate } from './AutoTranslate';
import { getLocaleFromCookie, setLocaleToCookie } from '../utils/cookies';
import type { RustleBoxProps, Locale, LocaleData } from '../types';
import type { LoadingConfig } from './LoadingStates';
import { defaultLoadingConfig } from './LoadingStates';

/**
 * RustleBox - SIMPLE APPROACH (Back to Basics)
 *
 * Based on requirements from AI-startup.md and react-dom.md:
 * - Only use cookie-based locale detection (rustle-locale cookie)
 * - Simple React Virtual DOM approach with AutoTranslate
 * - No complex client-side hooks (useEffect, useState)
 * - Works with SSR, CSR, SSG, ISR
 * - Static translations first, API calls as fallback
 */
export function RustleBox({
  children,
  sourceLanguage = 'en',
  targetLanguages = ['es', 'fr', 'de', 'it', 'pt'],
  apiKey, // Required, no default value
  model = 'gpt-3.5-turbo',
  debug = false,
  auto = true,
  fallback = true,
  initialLocale,
  serverLocale,
  useVirtualDOM = true,
  localeBasePath = '/rustle/locales',
  loadingConfig = defaultLoadingConfig,
}: RustleBoxProps) {
  // Validate required apiKey
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('RustleBox: apiKey is required. Please provide a valid API key to use Rustle.dev services.');
  }

  // SIMPLE: Only use cookie-based locale detection (no useState)
  const currentLocale: Locale = (() => {
    // Priority 1: Check cookie (works on both server and client)
    const cookieLocale = getLocaleFromCookie();
    if (cookieLocale && targetLanguages.includes(cookieLocale)) {
      if (debug) {
        console.log(`🍪 RustleBox: Using locale from cookie: ${cookieLocale}`);
      }
      return cookieLocale;
    }

    // Priority 2: Use provided locale or fallback to source language
    const fallbackLocale = serverLocale || initialLocale || sourceLanguage;
    if (debug) {
      console.log(`🔄 RustleBox: Using fallback locale: ${fallbackLocale}`);
    }
    return fallbackLocale;
  })();

  // SIMPLE: No complex state management - just empty locale data for now
  // The applyRustle hook will handle loading locale files when needed
  const localeData: Record<Locale, LocaleData> = {};

  // SIMPLE: Global locale switching function (works on both server and client)
  const switchLocale = (newLocale: Locale) => {
    if (targetLanguages.includes(newLocale)) {
      if (debug) {
        console.log(`🌐 RustleBox: Switching locale to: ${newLocale}`);
      }

      // Set cookie (works on both server and client)
      setLocaleToCookie(newLocale);

      if (debug) {
        console.log(`🍪 RustleBox: Saved locale ${newLocale} to cookie`);
      }

      // Trigger page reload to apply new locale
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      console.warn(`⚠️ RustleBox: Invalid locale: ${newLocale}. Valid locales: [${targetLanguages.join(', ')}]`);
    }
  };

  // SIMPLE: Expose global locale switcher (as per requirements)
  if (typeof window !== 'undefined') {
    (window as any).rustleSwitchLocale = switchLocale;
    if (debug) {
      console.log('🌍 RustleBox: Global locale switcher available: window.rustleSwitchLocale(locale)');
    }
  }

  // SIMPLE: Create config object for RustleProvider
  const config = {
    deactivate: false,
    sourceLanguage,
    targetLanguages,
    currentLocale,
    apiKey,
    model,
    debug,
    auto,
    fallback,
    localeBasePath,
    useVirtualDOM,
    loadingConfig,
    switchLocale, // Add switchLocale to config for useRustle hook
  };

  // SIMPLE: Debug logging
  if (debug) {
    console.log('🔍 RustleBox: Rendering with config:', {
      currentLocale,
      useVirtualDOM,
      localeDataKeys: Object.keys(localeData),
      isSSR: typeof window === 'undefined'
    });
  }

  // SIMPLE: Render using React Virtual DOM approach (as per react-dom.md)
  return (
    <RustleProvider config={config} initialLocaleData={localeData}>
      {useVirtualDOM ? (
        <AutoTranslate>{children}</AutoTranslate>
      ) : (
        children
      )}
    </RustleProvider>
  );
}

export default RustleBox;
