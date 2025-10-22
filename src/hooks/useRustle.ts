import { useCallback, useState } from 'react';
import { useRustleContext } from '../components/RustleContext';
import { createAPIClient } from '../utils/api';
import { defaultStorageManager } from '../utils/storage';
import type { UseRustleReturn, Locale } from '../types';

/**
 * Main hook for accessing Rustle functionality
 */
export function useRustle(): UseRustleReturn {
  const context = useRustleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { config, currentLocale, setLocale, localeData } = context;

  /**
   * Translate text to target locale
   */
  const translate = useCallback(async (
    text: string, 
    targetLocale?: Locale
  ): Promise<string> => {
    if (config.deactivate) {
      return text;
    }

    const target = targetLocale || currentLocale;
    
    // If target is same as source, return original text
    if (target === config.sourceLanguage) {
      return text;
    }

    // Check if we have static translation data
    const staticTranslation = localeData[target]?.[text];
    if (staticTranslation) {
      return staticTranslation;
    }

    // Check cache for dynamic translations
    const cachedTranslation = defaultStorageManager.getCachedTranslation(
      text,
      config.sourceLanguage,
      target
    );
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // If no cached translation, make API call
    setIsLoading(true);
    setError(null);

    try {
      const apiClient = createAPIClient({
        apiKey: config.apiKey,
      });

      const translation = await apiClient.translateSingle(
        text,
        config.sourceLanguage,
        target,
        config.model
      );

      // Cache the translation
      defaultStorageManager.cacheTranslation(
        text,
        config.sourceLanguage,
        target,
        translation
      );

      if (config.debug) {
        console.log(`Rustle: Translated "${text}" to "${translation}" (${target})`);
      }

      setIsLoading(false);
      return translation;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Translation failed';
      setError(errorMessage);
      setIsLoading(false);

      if (config.debug) {
        console.error('Rustle: Translation error:', err);
      }

      // Return original text as fallback
      if (config.fallback) {
        return text;
      }

      throw new Error(errorMessage);
    }
  }, [config, currentLocale, localeData]);

  return {
    currentLocale,
    setLocale,
    translate,
    isLoading: isLoading || context.isLoading,
    error: error || context.error,
  };
}
