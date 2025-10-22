'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRustleContext } from './RustleContext';
import { applyRustle } from '../hooks/applyRustle';
import { cleanTranslationWithContext, cleanHTMLTranslation, sanitizeHTML } from '../utils/translationCleaner';
import {
  isTranslatableText,
  normalizeText,
  generateTranslationId
} from '../utils/fingerprint';

export interface TranslatedHTMLProps {
  html: string;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
  cache?: boolean;
  fallback?: string;
  [key: string]: any; // Allow additional props
}

/**
 * TranslatedHTML Component
 * Handles translation of HTML content for dangerouslySetInnerHTML
 * Extracts text nodes from HTML, translates them, and reconstructs the HTML
 */
export function TranslatedHTML({
  html,
  tag: Tag = 'div',
  className,
  style,
  cache = true,
  fallback,
  ...props
}: TranslatedHTMLProps) {
  const context = useRustleContext();
  const { translateBatch } = applyRustle();
  const [translatedHTML, setTranslatedHTML] = useState<string>(html);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const translationCacheRef = useRef<Map<string, string>>(new Map());

  const { config, currentLocale } = context;

  useEffect(() => {
    if (config.deactivate) {
      setTranslatedHTML(html);
      return;
    }

    // If current locale is source language, no translation needed
    if (currentLocale === config.sourceLanguage) {
      setTranslatedHTML(html);
      return;
    }

    const translateHTML = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Extract text nodes from HTML
        const textNodes = extractTextFromHTML(html);
        
        if (textNodes.length === 0) {
          setTranslatedHTML(html);
          return;
        }

        // Check cache for existing translations
        const uncachedNodes: Array<{ id: string; text: string; context?: any }> = [];
        const cachedTranslations: Record<string, string> = {};

        textNodes.forEach((node, index) => {
          const cacheKey = `${node}_${currentLocale}`;
          if (cache && translationCacheRef.current.has(cacheKey)) {
            cachedTranslations[`node_${index}`] = translationCacheRef.current.get(cacheKey)!;
          } else {
            uncachedNodes.push({
              id: `node_${index}`,
              text: node,
              context: { tags: ['html'], file: 'dynamic' }
            });
          }
        });

        // Translate uncached nodes
        let newTranslations: Record<string, string> = {};
        if (uncachedNodes.length > 0) {
          if (!translateBatch) {
            throw new Error('translateBatch function is not available');
          }
          const rawTranslations = await translateBatch(uncachedNodes, currentLocale, { cache });

          // Clean all translations to remove quotes and artifacts
          newTranslations = {};
          for (const [id, translation] of Object.entries(rawTranslations)) {
            const originalNode = uncachedNodes.find(node => node.id === id);
            const cleaned = cleanTranslationWithContext(translation, {
              originalText: originalNode?.text,
              targetLanguage: currentLocale,
              sourceLanguage: config.sourceLanguage,
              isHTML: false
            });
            newTranslations[id] = cleaned;
          }

          // Cache cleaned translations
          if (cache) {
            uncachedNodes.forEach((node, index) => {
              const translation = newTranslations[node.id];
              if (translation) {
                const cacheKey = `${node.text}_${currentLocale}`;
                translationCacheRef.current.set(cacheKey, translation);
              }
            });
          }
        }

        // Combine cached and new translations
        const allTranslations = { ...cachedTranslations, ...newTranslations };

        // Replace text nodes in HTML with translations
        let translatedHTMLContent = html;
        textNodes.forEach((originalText, index) => {
          const translation = allTranslations[`node_${index}`];
          if (translation && translation !== originalText) {
            // Use a more precise replacement to avoid replacing partial matches
            translatedHTMLContent = replaceTextInHTML(translatedHTMLContent, originalText, translation);
          }
        });

        // Sanitize the final HTML to prevent XSS
        const sanitizedHTML = sanitizeHTML(translatedHTMLContent);
        setTranslatedHTML(sanitizedHTML);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'HTML translation failed';
        setError(errorMessage);

        if (config.debug) {
          console.error('TranslatedHTML: Translation error:', err);
        }

        // Use fallback or original content
        if (config.fallback) {
          setTranslatedHTML(fallback || html);
        }
      } finally {
        setIsLoading(false);
      }
    };

    translateHTML();
  }, [html, currentLocale, config, cache, fallback]);

  /**
   * Extract translatable text from HTML string
   */
  const extractTextFromHTML = (htmlString: string): string[] => {
    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    const textNodes: string[] = [];
    
    // Recursively extract text nodes
    const extractText = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && isTranslatableText(normalizeText(text))) {
          textNodes.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element;
        
        // Skip elements with data-i18n="false"
        if (element.getAttribute('data-i18n') === 'false') {
          return;
        }
        
        // Process child nodes
        Array.from(node.childNodes).forEach(extractText);
      }
    };

    Array.from(tempDiv.childNodes).forEach(extractText);
    return textNodes;
  };

  /**
   * Replace text in HTML while preserving structure
   */
  const replaceTextInHTML = (htmlString: string, originalText: string, translatedText: string): string => {
    // Escape special regex characters in the original text
    const escapedOriginal = originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Create regex to match the text node (not inside tags)
    const regex = new RegExp(`(?<=>)([^<]*?)${escapedOriginal}([^<]*?)(?=<|$)`, 'g');
    
    return htmlString.replace(regex, (match, before, after) => {
      return `${before}${translatedText}${after}`;
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <Tag 
        className={className}
        style={style}
        data-translated-html="loading"
        {...props}
        dangerouslySetInnerHTML={{ __html: fallback || html }}
      />
    );
  }

  // Show error state
  if (error && !config.fallback) {
    return (
      <Tag 
        className={className}
        style={style}
        data-translated-html="error"
        data-translation-error={error}
        {...props}
        dangerouslySetInnerHTML={{ __html: fallback || html }}
      />
    );
  }

  return (
    <Tag 
      className={className}
      style={style}
      data-translated-html="translated"
      data-translation-locale={currentLocale}
      data-translation-id={generateTranslationId()}
      {...props}
      dangerouslySetInnerHTML={{ __html: translatedHTML }}
    />
  );
}
