'use client';

import React, { useMemo, useCallback } from 'react';
import { useRustleContext } from './RustleContext';
import { generateContentFingerprint } from '../utils/fingerprinting';

interface AutoTranslateProps {
  children: React.ReactNode;
}

/**
 * AutoTranslate component that uses React Virtual DOM for efficient translation updates
 * This component automatically translates children elements that have data-i18n-fingerprint attributes
 */
export function AutoTranslate({ children }: AutoTranslateProps) {
  const { currentLocale, localeData, config } = useRustleContext();

  // Memoize translations for current locale to avoid unnecessary re-computations
  const translations = useMemo(() => {
    if (!localeData[currentLocale]) {
      if (config.debug) {
        console.log(`🔍 AutoTranslate: No translations found for locale ${currentLocale}`);
      }
      return {};
    }

    if (config.debug) {
      console.log(`✅ AutoTranslate: Using translations for locale ${currentLocale} with ${Object.keys(localeData[currentLocale]).length} entries`);
    }

    return localeData[currentLocale];
  }, [currentLocale, localeData, config.debug]);

  // Helper function to get translation by text content (for non-fingerprinted content)
  const getTranslationByText = useCallback((text: string): string | null => {
    if (!text || typeof text !== 'string') return null;

    // First try direct lookup (for fingerprint-based translations)
    if (translations[text]) {
      return translations[text];
    }

    // Then try to find by text content (for text-based translations)
    for (const [key, value] of Object.entries(translations)) {
      if (value === text || key === text) {
        return value;
      }
    }

    // Try to find by normalized text
    const normalizedText = text.trim().toLowerCase();
    for (const [, value] of Object.entries(translations)) {
      if (typeof value === 'string' && value.trim().toLowerCase() === normalizedText) {
        return value;
      }
    }

    return null;
  }, [translations]);

  // Recursively process React children to apply translations
  const processChildren = useCallback((children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      // Handle React elements
      if (React.isValidElement(child)) {
        const props = child.props as any;

        // Check if translation is paused for this element
        const isPaused = props['data-i18n-pause'] === 'true' || props['data-i18n-pause'] === true;

        if (isPaused) {
          if (config.debug) {
            console.log(`⏸️ AutoTranslate: Translation paused for element with fingerprint ${props['data-i18n-fingerprint']}`);
          }
          // Return element as-is without processing children
          return child;
        }

        // Check if element has translation fingerprint
        const fingerprint = props['data-i18n-fingerprint'];
        let translatedText: string | null = null;

        if (fingerprint && translations[fingerprint]) {
          translatedText = translations[fingerprint];

          if (config.debug) {
            console.log(`🔄 AutoTranslate: Translating ${fingerprint}: "${props.children}" → "${translatedText}"`);
          }
        } else if (typeof props.children === 'string' && props.children.trim()) {
          // Try to translate by text content for non-fingerprinted content
          translatedText = getTranslationByText(props.children);

          if (translatedText && config.debug) {
            console.log(`🔄 AutoTranslate: Translating text: "${props.children}" → "${translatedText}"`);
          }

          // If no translation found and in development mode, generate fingerprint for missing content
          if (!translatedText && process.env.NODE_ENV === 'development' && config.auto) {
            const generatedFingerprint = generateContentFingerprint(props.children);
            if (config.debug) {
              console.log(`🔧 AutoTranslate: Generated fingerprint for missing content: "${props.children}" → ${generatedFingerprint}`);
            }
            // TODO: In future, trigger file update to add this fingerprint to master.json and locale files
          }
        }

        if (translatedText) {
          // Clone element with translated content
          return React.cloneElement(child, {
            ...props,
            'data-i18n-original': props.children,
            'data-i18n': 'true',
          }, translatedText);
        }

        // Recursively process children if element has nested content
        if (props.children) {
          const processedChildren = processChildren(props.children);
          return React.cloneElement(child, props, processedChildren);
        }
      }

      return child;
    });
  }, [translations, config.debug]);

  // Process and return translated children
  return <>{processChildren(children)}</>;
}

export default AutoTranslate;
