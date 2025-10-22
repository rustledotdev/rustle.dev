'use client';

import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import type {
  RustleConfig,
  RustleContextType,
  Locale,
  LocaleData
} from '../types';
import { getLocaleFromCookie, setLocaleToCookie } from '../utils/cookies';
import { defaultStorageManager } from '../utils/storage';
import { createAPIClient } from '../utils/api';
import { TranslationEngine } from '../utils/translationEngine';
import { initDevModeWatcher, stopDevModeWatcher } from '../utils/devModeWatcher';
import { validateSecurityConfig } from '../utils/security';

// Context
const RustleContext = createContext<RustleContextType | null>(null);

// Action types
type RustleAction = 
  | { type: 'SET_LOCALE'; payload: Locale }
  | { type: 'SET_LOCALE_DATA'; payload: { locale: Locale; data: LocaleData } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

// State type
interface RustleState {
  currentLocale: Locale;
  localeData: Record<Locale, LocaleData>;
  isLoading: boolean;
  error: string | null;
}

// Reducer
function rustleReducer(state: RustleState, action: RustleAction): RustleState {
  switch (action.type) {
    case 'SET_LOCALE':
      return {
        ...state,
        currentLocale: action.payload,
        error: null,
      };
    
    case 'SET_LOCALE_DATA':
      return {
        ...state,
        localeData: {
          ...state.localeData,
          [action.payload.locale]: action.payload.data,
        },
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
}

// Provider props
interface RustleProviderProps {
  config: RustleConfig;
  children: ReactNode;
  initialLocaleData?: Record<Locale, LocaleData>;
  cookieString?: string; // For SSR
}

// Provider component
export function RustleProvider({
  config,
  children,
  initialLocaleData = {},
  cookieString
}: RustleProviderProps) {
  const translationEngineRef = useRef<TranslationEngine | null>(null);

  // Determine initial locale
  const getInitialLocale = (): Locale => {
    // 1. Check if explicitly set in config
    if (config.currentLocale) {
      if (config.debug) {
        console.log(`🔧 RustleContext: Using config locale: ${config.currentLocale}`);
      }
      return config.currentLocale;
    }

    // 2. Check cookie (works in both SSR and CSR)
    const cookieLocale = getLocaleFromCookie(cookieString);
    if (cookieLocale && config.targetLanguages.includes(cookieLocale)) {
      if (config.debug) {
        console.log(`🍪 RustleContext: Using cookie locale: ${cookieLocale}`);
      }
      return cookieLocale;
    }

    // 3. Fall back to source language
    if (config.debug) {
      console.log(`🔄 RustleContext: Using fallback locale: ${config.sourceLanguage}`);
    }
    return config.sourceLanguage;
  };

  const [state, dispatch] = useReducer(rustleReducer, {
    currentLocale: getInitialLocale(),
    localeData: initialLocaleData,
    isLoading: false,
    error: null,
  });

  // Load locale data when locale changes
  useEffect(() => {
    if (config.deactivate) return;

    const loadLocaleData = async () => {
      const { currentLocale } = state;
      
      // Skip if data already loaded
      if (state.localeData[currentLocale]) {
        return;
      }

      // Skip if current locale is source language (no translation needed)
      if (currentLocale === config.sourceLanguage) {
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        // PRIORITY 1: Try to load from static files FIRST (most important for cost optimization)
        const localeBasePath = config.localeBasePath || '/rustle/locales';
        const staticUrl = `${localeBasePath}/${currentLocale}.json`;

        if (config.debug) {
          console.log(`📁 RustleContext: Attempting to load static file: ${staticUrl}`);
        }

        try {
          const response = await fetch(staticUrl);
          if (response.ok) {
            const data: LocaleData = await response.json();

            if (data && Object.keys(data).length > 0) {
              dispatch({
                type: 'SET_LOCALE_DATA',
                payload: { locale: currentLocale, data }
              });

              // Cache the data for future use
              defaultStorageManager.cacheLocaleData(currentLocale, data);
              dispatch({ type: 'SET_LOADING', payload: false });

              if (config.debug) {
                console.log(`✅ RustleContext: Successfully loaded static locale ${currentLocale} with ${Object.keys(data).length} entries`);
                console.log(`📊 RustleContext: Sample entries:`, Object.keys(data).slice(0, 3));
              }
              return;
            } else {
              if (config.debug) {
                console.warn(`⚠️ RustleContext: Static locale file ${staticUrl} is empty or invalid`);
              }
            }
          } else {
            if (config.debug) {
              console.warn(`⚠️ RustleContext: Static locale file not found: ${staticUrl} (${response.status})`);
            }
          }
        } catch (staticError) {
          if (config.debug) {
            console.warn(`⚠️ RustleContext: Failed to load static locale ${currentLocale}:`, staticError);
          }
        }

        // PRIORITY 2: Try cache as fallback
        const cachedData = defaultStorageManager.getCachedLocaleData(currentLocale);
        if (cachedData && Object.keys(cachedData).length > 0) {
          dispatch({
            type: 'SET_LOCALE_DATA',
            payload: { locale: currentLocale, data: cachedData }
          });
          dispatch({ type: 'SET_LOADING', payload: false });

          if (config.debug) {
            console.log(`💾 RustleContext: Using cached locale ${currentLocale} with ${Object.keys(cachedData).length} entries`);
          }
          return;
        }

        // If no static file, we'll rely on runtime translation
        dispatch({ type: 'SET_LOADING', payload: false });
        
      } catch (error) {
        console.error('Failed to load locale data:', error);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: error instanceof Error ? error.message : 'Failed to load translations' 
        });
      }
    };

    loadLocaleData();
  }, [state.currentLocale, config.deactivate, config.sourceLanguage]);

  // PRELOAD ALL LOCALE FILES for better performance and cost optimization
  useEffect(() => {
    if (config.deactivate || typeof window === 'undefined') return;

    const preloadAllLocales = async () => {
      if (config.debug) {
        console.log(`🚀 RustleContext: Preloading ALL locale files for cost optimization...`);
      }

      const localeBasePath = config.localeBasePath || '/rustle/locales';
      const loadPromises = config.targetLanguages.map(async (locale) => {
        // Skip if already loaded or is source language
        if (state.localeData[locale] || locale === config.sourceLanguage) {
          return;
        }

        try {
          const response = await fetch(`${localeBasePath}/${locale}.json`);
          if (response.ok) {
            const data: LocaleData = await response.json();
            if (data && Object.keys(data).length > 0) {
              dispatch({
                type: 'SET_LOCALE_DATA',
                payload: { locale, data }
              });

              // Cache the data
              defaultStorageManager.cacheLocaleData(locale, data);

              if (config.debug) {
                console.log(`✅ RustleContext: Preloaded ${locale}.json with ${Object.keys(data).length} entries`);
              }
            }
          }
        } catch (error) {
          if (config.debug) {
            console.warn(`⚠️ RustleContext: Failed to preload ${locale}:`, error);
          }
        }
      });

      await Promise.all(loadPromises);

      if (config.debug) {
        const totalLoaded = Object.keys(state.localeData).length;
        console.log(`🎯 RustleContext: Preloading completed. Total locales loaded: ${totalLoaded}`);
      }
    };

    // Preload all locales for better performance
    preloadAllLocales();
  }, [config.targetLanguages, config.localeBasePath, config.debug, config.deactivate, config.sourceLanguage]);

  // Initialize translation engine when component mounts
  useEffect(() => {
    if (config.deactivate) return;

    // Security validation
    const securityWarnings = validateSecurityConfig(config);
    if (securityWarnings.length > 0) {
      securityWarnings.forEach(warning => {
        console.warn(`⚠️ Rustle Security Warning: ${warning}`);
      });
    }

    // Initialize translation engine on client side only
    if (typeof window !== 'undefined') {
      translationEngineRef.current = new TranslationEngine(config, state.currentLocale, state.localeData);

      // Auto-run rustleEngine extraction in development mode
      if (process.env.NODE_ENV === 'development' && config.auto) {
        // Initialize development mode watcher for automatic fingerprint generation
        initDevModeWatcher({
          enabled: true,
          debug: config.debug,
          autoExtract: true,
          watchInterval: 3000, // Check every 3 seconds
          apiKey: config.apiKey,
          sourceLanguage: config.sourceLanguage,
          targetLanguages: config.targetLanguages,
          localeBasePath: config.localeBasePath || '/rustle/locales'
        });

        if (config.debug) {
          console.log('🔧 Rustle: Auto-extraction and dev mode watcher enabled');
        }
      }

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          translationEngineRef.current?.initialize();
        });
      } else {
        // DOM is already ready
        setTimeout(() => {
          translationEngineRef.current?.initialize();
        }, 100); // Small delay to ensure React has rendered
      }
    }

    // Cleanup on unmount
    return () => {
      translationEngineRef.current?.destroy();
      if (process.env.NODE_ENV === 'development') {
        stopDevModeWatcher();
      }
    };
  }, [config]);

  // Update translation engine when locale or locale data changes
  useEffect(() => {
    if (translationEngineRef.current) {
      translationEngineRef.current.updateLocale(state.currentLocale, state.localeData);
    }
  }, [state.currentLocale, state.localeData]);

  // Set locale function
  const setLocale = (locale: Locale) => {
    if (config.deactivate) return;

    if (!config.targetLanguages.includes(locale) && locale !== config.sourceLanguage) {
      console.warn(`Locale ${locale} is not in target languages`);
      return;
    }

    const previousLocale = state.currentLocale;
    dispatch({ type: 'SET_LOCALE', payload: locale });

    // Update cookie
    setLocaleToCookie(locale);

    // Emit locale change event for dynamic content components
    if (typeof window !== 'undefined' && locale !== previousLocale) {
      const event = new CustomEvent('rustleLocaleChanged', {
        detail: {
          locale,
          previousLocale,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);

      if (config.debug) {
        console.log(`📡 RustleContext: Emitted rustleLocaleChanged event for ${locale}`);
      }
    }

    if (config.debug) {
      console.log(`Rustle: Locale changed to ${locale}`);
    }
  };

  const contextValue: RustleContextType = {
    config,
    currentLocale: state.currentLocale,
    setLocale,
    localeData: state.localeData,
    isLoading: state.isLoading,
    error: state.error,
  };

  return (
    <RustleContext.Provider value={contextValue}>
      {children}
    </RustleContext.Provider>
  );
}

// Hook to use the context
export function useRustleContext(): RustleContextType {
  const context = useContext(RustleContext);
  if (!context) {
    throw new Error('useRustleContext must be used within a RustleProvider');
  }
  return context;
}
