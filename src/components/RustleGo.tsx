'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { useRustleContext } from './RustleContext';
import { applyRustle } from '../hooks/applyRustle';
import {
  isTranslatableText,
  normalizeText,
  extractTags,
  generateTranslationId
} from '../utils/fingerprint';
import { BatchCollector } from '../utils/batchCollector';
import type { RustleGoProps } from '../types';

/**
 * Dynamic content wrapper for runtime translations
 * Handles API-driven or dynamically generated content
 * Optimized for cost-effectiveness with caching support
 */
export function RustleGo({
  children,
  fallback,
  className,
  cache = true // Default to true for cost optimization
}: RustleGoProps) {
  const context = useRustleContext();
  const { translate, translateBatch, isLoading } = applyRustle();
  const [translatedContent, setTranslatedContent] = useState<ReactNode>(children);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const batchQueueRef = useRef<Array<{ text: string; resolve: (value: string) => void; reject: (error: any) => void }>>([]);
  const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestKeyRef = useRef<string | null>(null);

  const { config, currentLocale, localeData } = context;
  const lastLocaleRef = useRef<string>(currentLocale);
  const forceRetranslateRef = useRef<boolean>(false);

  // Get static translations for current locale
  const staticTranslations = localeData[currentLocale] || {};

  // Listen for global locale changes to force re-translation of dynamic content
  useEffect(() => {
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail?.locale;
      if (newLocale && newLocale !== lastLocaleRef.current) {
        console.log('🔄 RustleGo: Detected global locale change, forcing re-translation');
        forceRetranslateRef.current = true;
        lastLocaleRef.current = newLocale;
      }
    };

    // Listen for custom locale change events
    window.addEventListener('rustleLocaleChanged', handleLocaleChange as EventListener);

    return () => {
      window.removeEventListener('rustleLocaleChanged', handleLocaleChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (config.deactivate) {
      setTranslatedContent(children);
      return;
    }

    // If current locale is source language, no translation needed
    if (currentLocale === config.sourceLanguage) {
      setTranslatedContent(children);
      return;
    }

    // Check if locale changed or force retranslate is needed
    const localeChanged = currentLocale !== lastLocaleRef.current;
    const shouldForceRetranslate = forceRetranslateRef.current;

    // Update refs
    lastLocaleRef.current = currentLocale;
    if (shouldForceRetranslate) {
      forceRetranslateRef.current = false;
    }

    const translateContent = async () => {
      try {
        setError(null);

        if (config.debug && (localeChanged || shouldForceRetranslate)) {
          console.log(`🔄 RustleGo: Re-translating dynamic content to ${currentLocale}`);
        }

        // Cancel any ongoing batch requests before starting new translation
        if (currentRequestKeyRef.current) {
          if (config.debug) {
            console.log(`🚫 RustleGo: Cancelling ongoing batch request: ${currentRequestKeyRef.current}`);
          }
          currentRequestKeyRef.current = null;
        }

        // Cancel any pending batch timeout
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
          batchTimeoutRef.current = null;
        }

        // Reject all pending batch items to prevent content fluctuation
        if (batchQueueRef.current.length > 0) {
          const cancelledBatch = [...batchQueueRef.current];
          batchQueueRef.current = [];

          cancelledBatch.forEach(item => {
            item.reject(new Error('Translation cancelled due to locale change'));
          });

          if (config.debug) {
            console.log(`🚫 RustleGo: Cancelled ${cancelledBatch.length} pending batch items`);
          }
        }

        // Clear cache if locale changed to force fresh translations
        if (localeChanged || shouldForceRetranslate) {
          translationCacheRef.current.clear();
        }

        // Translate the content directly without cloning
        const translatedNode = await translateReactNode(children);
        setTranslatedContent(translatedNode);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Translation failed';
        setError(errorMessage);

        if (config.debug) {
          console.error('RustleGo: Translation error:', err);
        }

        // Use fallback or original content
        if (config.fallback) {
          setTranslatedContent(fallback || children);
        }
      }
    };

    translateContent();
  }, [children, currentLocale, config, fallback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel any pending batch timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Clear batch queue
      batchQueueRef.current = [];

      // Clear current request key
      currentRequestKeyRef.current = null;
    };
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Batched translation function to optimize API calls
   */
  const translateTextBatched = async (text: string): Promise<string> => {
    const normalizedText = normalizeText(text);

    if (!isTranslatableText(normalizedText)) {
      return text;
    }

    // STEP 1: Check memory cache first (fastest)
    const cacheKey = `${normalizedText}_${currentLocale}`;
    if (cache && translationCacheRef.current.has(cacheKey)) {
      if (config.debug) {
        console.log(`💾 RustleGo: Using cached translation for "${normalizedText}"`);
      }
      return translationCacheRef.current.get(cacheKey)!;
    }

    // STEP 2: Check static translations (locale files) second
    const staticTranslation = staticTranslations[normalizedText];
    if (staticTranslation) {
      if (config.debug) {
        console.log(`📁 RustleGo: Using static translation for "${normalizedText}" -> "${staticTranslation}"`);
      }
      // Cache the static translation for future use
      if (cache) {
        translationCacheRef.current.set(cacheKey, staticTranslation);
      }
      return staticTranslation;
    }

    // STEP 3: Only make API call if no cache/static translation exists
    return new Promise((resolve, reject) => {
      // Wrap reject to handle cancellation gracefully
      const wrappedReject = (error: Error) => {
        if (error.message.includes('cancelled')) {
          // For cancelled requests, return original text instead of throwing
          if (config.fallback) {
            resolve(text);
          } else {
            reject(error);
          }
        } else {
          reject(error);
        }
      };

      // Add to batch queue
      batchQueueRef.current.push({ text: normalizedText, resolve, reject: wrappedReject });

      // Clear existing timeout
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }

      // Set new timeout to process batch
      batchTimeoutRef.current = setTimeout(async () => {
        const batch = [...batchQueueRef.current];
        batchQueueRef.current = []; // Clear queue

        if (batch.length === 0) return;

        // Generate unique request key for this batch to enable cancellation
        const requestKey = `rustlego_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        currentRequestKeyRef.current = requestKey;

        try {

          // Prepare batch data
          const batchEntries = batch.map((item, index) => ({
            id: `batch_${index}`,
            text: item.text,
            context: { tags: [], file: 'dynamic' }
          }));

          // Call batch translation API with request key for cancellation
          if (!translateBatch) {
            throw new Error('translateBatch function is not available');
          }
          const translations = await translateBatch(batchEntries, currentLocale, { cache, requestKey });

          // Check if this request is still valid (not cancelled)
          if (currentRequestKeyRef.current !== requestKey) {
            if (config.debug) {
              console.log(`🚫 RustleGo: Batch request ${requestKey} was cancelled, ignoring results`);
            }
            // Reject all promises since the request was cancelled
            batch.forEach(item => {
              item.reject(new Error('Translation request was cancelled'));
            });
            return;
          }

          // Clear current request key on successful completion
          currentRequestKeyRef.current = null;

          // Resolve all promises with their translations
          batch.forEach((item, index) => {
            const translation = translations[`batch_${index}`] || item.text;

            // Cache the result
            if (cache) {
              const cacheKey = `${item.text}_${currentLocale}`;
              translationCacheRef.current.set(cacheKey, translation);
            }

            item.resolve(translation);
          });

          if (config.debug) {
            console.log(`🌐 RustleGo: Batch translated ${batch.length} items with key ${requestKey}`);
          }
        } catch (error) {
          // Check if this request is still valid (not cancelled)
          if (currentRequestKeyRef.current !== requestKey) {
            if (config.debug) {
              console.log(`🚫 RustleGo: Batch request ${requestKey} was cancelled, ignoring error fallback`);
            }
            // Reject all promises since the request was cancelled
            batch.forEach(item => {
              item.reject(new Error('Translation request was cancelled'));
            });
            return;
          }

          if (config.debug) {
            console.error(`❌ RustleGo: Batch translation failed with key ${requestKey}:`, error);
          }

          // Try to fallback to individual translations or static content
          batch.forEach(async (item, index) => {
            try {
              // Try individual translation as fallback
              const fallbackTranslation = await translate(item.text, currentLocale, { cache });

              // Cache the result
              if (cache) {
                const cacheKey = `${item.text}_${currentLocale}`;
                translationCacheRef.current.set(cacheKey, fallbackTranslation);
              }

              item.resolve(fallbackTranslation);
            } catch (fallbackError) {
              // Final fallback: return original text
              if (context.config.fallback) {
                item.resolve(item.text);
              } else {
                item.reject(fallbackError);
              }
            }
          });
        }
      }, 100); // 100ms delay to batch multiple requests (optimized for faster response)
    });
  };

  /**
   * Recursively translate React nodes
   */
  const translateReactNode = async (node: ReactNode): Promise<ReactNode> => {
    if (typeof node === 'string') {
      try {
        const translation = await translateTextBatched(node);
        return translation;
      } catch (error) {
        if (config.debug) {
          console.warn(`RustleGo: Failed to translate "${node}":`, error);
        }
        return node; // Return original on error
      }
    }

    if (typeof node === 'number' || typeof node === 'boolean' || node == null) {
      return node;
    }

    if (Array.isArray(node)) {
      const translatedArray = await Promise.all(
        node.map(child => translateReactNode(child))
      );
      return translatedArray;
    }

    if (React.isValidElement(node)) {
      const element = node as React.ReactElement;
      
      // Skip translation for certain elements
      if (typeof element.type === 'string') {
        const tagName = element.type.toLowerCase();
        
        // Skip excluded tags
        if (config.autoConfig?.exclude?.includes(tagName)) {
          return node;
        }
        
        // Only process included tags (if specified)
        if (config.autoConfig?.include && !config.autoConfig.include.includes(tagName)) {
          return node;
        }
      }

      // Skip if element has data-i18n="false"
      if (element.props?.['data-i18n'] === 'false') {
        return node;
      }

      // Skip if element has data-i18n-pause="true"
      if (element.props?.['data-i18n-pause'] === 'true') {
        return node;
      }

      // Translate children
      let translatedChildren = element.props.children;
      if (translatedChildren) {
        translatedChildren = await translateReactNode(translatedChildren);
      }

      // Clone element with translated children
      try {
        return React.cloneElement(element, {
          ...element.props,
          'data-i18n': 'true',
          'data-i18n-dynamic': 'true',
          'data-i18n-id': generateTranslationId(),
        }, translatedChildren);
      } catch (cloneError) {
        if (config.debug) {
          console.warn('RustleGo: Failed to clone element, returning original:', cloneError);
        }
        return node;
      }
    }

    return node;
  };

  // Show loading state if needed
  if (isLoading && !translatedContent) {
    return (
      <div 
        ref={containerRef}
        className={className}
        data-rustle-go="loading"
      >
        {fallback || children}
      </div>
    );
  }

  // Show error state if needed
  if (error && !config.fallback) {
    return (
      <div 
        ref={containerRef}
        className={className}
        data-rustle-go="error"
        data-rustle-error={error}
      >
        {fallback || children}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={className}
      data-rustle-go="translated"
      data-rustle-locale={currentLocale}
    >
      {translatedContent}
    </div>
  );
}
