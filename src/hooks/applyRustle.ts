import { useCallback, useState, useMemo } from 'react';
import { useRustleContext } from '../components/RustleContext';
import { createAPIClient } from '../utils/api';
import { defaultStorageManager } from '../utils/storage';
import { cleanTranslationWithContext, cleanBatchTranslations } from '../utils/translationCleaner';
import type { UseRustleReturn, Locale } from '../types';

// SSR detection utility
const isServer = typeof window === 'undefined';

/**
 * Universal hook for both SSR and CSR translation functionality
 * Optimized for cost-effectiveness and performance
 * Replaces useRustle with enhanced caching and batch optimization
 */
export function applyRustle(): UseRustleReturn {
  const context = useRustleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingTranslations] = useState<Map<string, Promise<string>>>(new Map());

  const { config, currentLocale, setLocale, localeData } = context;

  // SSR optimization: Memoize static translations for server-side rendering
  const staticTranslations = useMemo(() => {
    if (isServer) {
      // On server, prioritize static translations for faster SSR
      return localeData[currentLocale] || {};
    }
    return localeData[currentLocale] || {};
  }, [currentLocale, localeData]);

  // SSR optimization: Disable dynamic translations on server by default
  const shouldUseDynamicTranslation = useMemo(() => {
    if (isServer) {
      // On server, only use dynamic translations if explicitly enabled
      return (config as any).enableSSRDynamicTranslation === true;
    }
    return true; // Always enabled on client
  }, [config]);

  /**
   * Optimized translate function with deduplication and caching
   */
  const translate = useCallback(async (
    text: string, 
    targetLocale?: Locale,
    options?: {
      cache?: boolean;
      context?: { tags?: string[]; file?: string };
    }
  ): Promise<string> => {
    if (config.deactivate) {
      return text;
    }

    const target = targetLocale || currentLocale;
    const cacheEnabled = options?.cache !== false; // Default to true
    
    // If target is same as source, return original text
    if (target === config.sourceLanguage) {
      return text;
    }

    // PRIORITY 1: Check if we have static translation data first (SSR optimized)
    const staticTranslation = staticTranslations[text];
    if (staticTranslation) {
      if (config.debug) {
        console.log(`📁 applyRustle: Using static translation for "${text}" -> "${staticTranslation}"`);
      }
      return staticTranslation;
    }

    // PRIORITY 2: Check locale data from files (fingerprint-based or text-based)
    const localeTranslations = localeData[target];
    if (localeTranslations) {
      // Try direct lookup first (fingerprint-based)
      if (localeTranslations[text]) {
        if (config.debug) {
          console.log(`📁 applyRustle: Using locale file translation for "${text}" -> "${localeTranslations[text]}"`);
        }
        return localeTranslations[text];
      }

      // Try to find by text content (for non-fingerprinted content)
      for (const [key, value] of Object.entries(localeTranslations)) {
        if (typeof value === 'string' && (value === text || key === text)) {
          if (config.debug) {
            console.log(`📁 applyRustle: Using locale file text match for "${text}" -> "${value}"`);
          }
          return value;
        }
      }
    }

    // SSR optimization: Return original text if dynamic translation is disabled on server
    if (isServer && !shouldUseDynamicTranslation) {
      if (config.debug) {
        console.log(`⚡ applyRustle: SSR mode - returning original text for "${text}"`);
      }
      return text;
    }

    // Create cache key for deduplication
    const cacheKey = `${text}_${config.sourceLanguage}_${target}`;
    
    // Check if translation is already in progress (deduplication)
    if (pendingTranslations.has(cacheKey)) {
      return pendingTranslations.get(cacheKey)!;
    }

    // Check cache for dynamic translations if caching is enabled
    if (cacheEnabled) {
      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        text,
        config.sourceLanguage,
        target
      );
      if (cachedTranslation) {
        return cachedTranslation;
      }
    }

    // Create translation promise and store it to prevent duplicate calls
    const translationPromise = performTranslation(text, target, options);
    pendingTranslations.set(cacheKey, translationPromise);

    try {
      const result = await translationPromise;
      return result;
    } finally {
      // Remove from pending after completion
      pendingTranslations.delete(cacheKey);
    }
  }, [config, currentLocale, localeData, pendingTranslations]);

  /**
   * Internal function to perform actual translation
   */
  const performTranslation = async (
    text: string,
    target: Locale,
    options?: {
      cache?: boolean;
      context?: { tags?: string[]; file?: string };
      retryCount?: number;
    }
  ): Promise<string> => {
    setIsLoading(true);
    setError(null);

    const maxRetries = 3;
    const retryCount = options?.retryCount || 0;

    // STEP 1: Check memory cache first (fastest)
    if (options?.cache !== false) {
      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        text,
        config.sourceLanguage,
        target
      );
      if (cachedTranslation) {
        if (config.debug) {
          console.log(`💾 applyRustle: Using cached translation for "${text}" -> "${cachedTranslation}"`);
        }
        setIsLoading(false);
        return cachedTranslation;
      }
    }

    // STEP 2: Check static translations (locale files) second
    const staticFallback = staticTranslations[text];
    if (staticFallback) {
      if (config.debug) {
        console.log(`📁 applyRustle: Using static translation for "${text}" -> "${staticFallback}"`);
      }
      // Cache the static translation for future use
      if (options?.cache !== false) {
        defaultStorageManager.cacheTranslation(
          text,
          config.sourceLanguage,
          target,
          staticFallback
        );
      }
      setIsLoading(false);
      return staticFallback;
    }

    // STEP 3: Only make API call if no cache/static translation exists
    try {
      // Validate API key is provided
      if (!config.apiKey) {
        throw new Error('API key is required. Please provide apiKey in RustleBox configuration.');
      }

      const apiClient = createAPIClient({
        apiKey: config.apiKey,
      });

      const rawTranslation = await apiClient.translateSingle(
        text,
        config.sourceLanguage,
        target,
        config.model,
        options?.context
      );

      // Clean the translation to remove quotes and artifacts
      const translation = cleanTranslationWithContext(rawTranslation, {
        originalText: text,
        targetLanguage: target,
        sourceLanguage: config.sourceLanguage,
        isHTML: false
      });

      // Cache the cleaned translation if caching is enabled
      if (options?.cache !== false) {
        defaultStorageManager.cacheTranslation(
          text,
          config.sourceLanguage,
          target,
          translation
        );
      }

      if (config.debug) {
        console.log(`🌐 applyRustle: API translated "${text}" to "${translation}" (${target})`);
      }

      setIsLoading(false);
      return translation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';

      if (config.debug) {
        console.error(`❌ applyRustle: Translation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      }

      // Retry mechanism with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        if (config.debug) {
          console.log(`🔄 applyRustle: Retrying in ${delay}ms...`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return performTranslation(text, target, { ...options, retryCount: retryCount + 1 });
      }

      // After all retries failed, check for static translation as fallback
      const staticFallback = staticTranslations[text];
      if (staticFallback) {
        if (config.debug) {
          console.log(`🔄 applyRustle: Using static translation fallback for "${text}"`);
        }
        setIsLoading(false);
        return staticFallback;
      }

      setError(errorMessage);
      setIsLoading(false);

      // Return original text as final fallback
      if (config.fallback) {
        if (config.debug) {
          console.log(`🔄 applyRustle: Using original text fallback for "${text}"`);
        }
        return text;
      }

      throw new Error(errorMessage);
    }
  };

  /**
   * Batch translate multiple texts for cost optimization with retry and static fallback
   */
  const translateBatch = useCallback(async (
    texts: Array<{ id: string; text: string; context?: { tags?: string[]; file?: string } }>,
    targetLocale?: Locale,
    options?: { cache?: boolean; retryCount?: number; requestKey?: string }
  ): Promise<Record<string, string>> => {
    if (config.deactivate) {
      return texts.reduce((acc, { id, text }) => ({ ...acc, [id]: text }), {});
    }

    const target = targetLocale || currentLocale;
    const cacheEnabled = options?.cache !== false;
    const maxRetries = 3;
    const retryCount = options?.retryCount || 0;

    if (target === config.sourceLanguage) {
      return texts.reduce((acc, { id, text }) => ({ ...acc, [id]: text }), {});
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate API key is provided
      if (!config.apiKey) {
        throw new Error('API key is required. Please provide apiKey in RustleBox configuration.');
      }

      const apiClient = createAPIClient({
        apiKey: config.apiKey,
      });

      const response = await apiClient.translateBatch({
        entries: texts.map(t => ({
          id: t.id,
          text: t.text,
          context: t.context ? {
            tags: t.context.tags || [],
            file: t.context.file || '',
          } : undefined,
        })),
        sourceLanguage: config.sourceLanguage,
        targetLanguage: target,
        model: config.model,
      }, options?.requestKey);

      if (!response.success) {
        throw new Error(response.error || 'Batch translation failed');
      }

      // Clean all batch translations to remove quotes and artifacts
      const cleanedTranslations = cleanBatchTranslations(response.translations);

      // Cache cleaned translations if enabled
      if (cacheEnabled) {
        Object.entries(cleanedTranslations).forEach(([id, translation]) => {
          const originalText = texts.find(t => t.id === id)?.text;
          if (originalText) {
            defaultStorageManager.cacheTranslation(
              originalText,
              config.sourceLanguage,
              target,
              translation
            );
          }
        });
      }

      if (config.debug) {
        console.log(`🔄 applyRustle: Batch translated ${Object.keys(cleanedTranslations).length} texts to ${target} (cleaned)`);
      }

      setIsLoading(false);
      return cleanedTranslations;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Batch translation failed';

      if (config.debug) {
        console.error(`❌ applyRustle: Batch translation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      }

      // Retry mechanism with exponential backoff
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        if (config.debug) {
          console.log(`🔄 applyRustle: Retrying batch translation in ${delay}ms...`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return translateBatch(texts, targetLocale, { ...options, retryCount: retryCount + 1 });
      }

      // After all retries failed, try to use static translations as fallback
      const fallbackTranslations: Record<string, string> = {};
      let hasStaticFallbacks = false;

      texts.forEach(({ id, text }) => {
        const staticFallback = staticTranslations[text];
        if (staticFallback) {
          fallbackTranslations[id] = staticFallback;
          hasStaticFallbacks = true;
          if (config.debug) {
            console.log(`🔄 applyRustle: Using static translation fallback for "${text}"`);
          }
        } else if (config.fallback) {
          fallbackTranslations[id] = text; // Use original text as final fallback
        }
      });

      if (hasStaticFallbacks || config.fallback) {
        setIsLoading(false);
        if (config.debug) {
          console.log(`🔄 applyRustle: Returning ${Object.keys(fallbackTranslations).length} fallback translations`);
        }
        return fallbackTranslations;
      }

      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [config, currentLocale, staticTranslations]);

  /**
   * Clear translation cache
   */
  const clearCache = useCallback(() => {
    defaultStorageManager.clearCache();
    if (config.debug) {
      console.log('🧹 applyRustle: Translation cache cleared');
    }
  }, [config.debug]);

  return {
    currentLocale,
    setLocale,
    translate,
    translateBatch,
    clearCache,
    isLoading: isLoading || context.isLoading,
    error: error || context.error,
  };
}

/**
 * Legacy alias for backward compatibility
 */
export const useRustle = applyRustle;
