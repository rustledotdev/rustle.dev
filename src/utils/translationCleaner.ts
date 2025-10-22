'use client';

/**
 * Translation cleaning utilities to remove AI artifacts and normalize text
 */

/**
 * Clean translation text by removing quotes, artifacts, and normalizing whitespace
 */
export function cleanTranslation(translation: string): string {
  if (!translation || typeof translation !== 'string') {
    return translation;
  }

  let cleaned = translation.trim();
  
  // AGGRESSIVE QUOTE REMOVAL - Multiple passes to handle all quote patterns

  // Pass 1: Remove surrounding quotes (single or double) - multiple layers
  while ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
         (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Pass 2: Remove quotes at beginning and end (even if not matching)
  cleaned = cleaned.replace(/^["'`„""''«»‹›]+|["'`„""''«»‹›]+$/g, '');

  // Pass 3: Remove quotes with spaces
  cleaned = cleaned.replace(/^\s*["']+\s*|\s*["']+\s*$/g, '');

  // Pass 4: Remove translation artifacts and prefixes
  cleaned = cleaned.replace(/^(Translation|Traducción|Traduction|Übersetzung|Traduzione|Tradução|翻译|翻譯|번역|翻訳|Перевод|ترجمة):\s*/i, '');

  // Pass 5: Remove common AI response patterns
  cleaned = cleaned.replace(/^(Here is the translation|The translation is|Translated text):\s*/i, '');
  cleaned = cleaned.replace(/^(Voici la traduction|La traduction est|Texte traduit):\s*/i, '');
  cleaned = cleaned.replace(/^(Hier ist die Übersetzung|Die Übersetzung ist|Übersetzter Text):\s*/i, '');
  cleaned = cleaned.replace(/^(Ecco la traduzione|La traduzione è|Testo tradotto):\s*/i, '');
  cleaned = cleaned.replace(/^(Aquí está la traducción|La traducción es|Texto traducido):\s*/i, '');

  // Pass 6: Remove markdown formatting that might be added by AI
  cleaned = cleaned.replace(/^\*\*(.*)\*\*$/, '$1'); // Bold
  cleaned = cleaned.replace(/^\*(.*)\*$/, '$1'); // Italic
  cleaned = cleaned.replace(/^`(.*)`$/, '$1'); // Code
  cleaned = cleaned.replace(/^_(.*?)_$/, '$1'); // Underscore italic

  // Pass 7: Remove JSON-like formatting
  cleaned = cleaned.replace(/^\{["']?text["']?\s*:\s*["'](.*)["']\}$/i, '$1');
  cleaned = cleaned.replace(/^\{["']?translation["']?\s*:\s*["'](.*)["']\}$/i, '$1');

  // Pass 8: Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Pass 9: Final aggressive quote removal for artifacts
  if (cleaned.length > 2) {
    // Remove quotes that are clearly artifacts (multiple patterns)
    const quotePatterns = [
      /^"([^"]*)"$/,  // Double quotes
      /^'([^']*)'$/,  // Single quotes
      /^`([^`]*)`$/,  // Backticks
      /^„([^"]*)"$/,  // German quotes
      /^«([^»]*)»$/,  // French quotes
      /^‹([^›]*)›$/,  // Single French quotes
      /^"([^"]*)"$/,  // Smart quotes
      /^'([^']*)'$/,  // Smart single quotes
    ];

    for (const pattern of quotePatterns) {
      const match = cleaned.match(pattern);
      if (match && match[1]) {
        // Only remove if the content inside doesn't have the same quote type
        const inner = match[1];
        const quoteChar = cleaned[0];
        if (quoteChar && !inner.includes(quoteChar)) {
          cleaned = inner.trim();
          break;
        }
      }
    }
  }

  // Pass 10: Remove any remaining leading/trailing quotes after all processing
  cleaned = cleaned.replace(/^["'`„""''«»‹›]+|["'`„""''«»‹›]+$/g, '').trim();
  
  return cleaned;
}

/**
 * Clean HTML content by removing quotes from text nodes
 */
export function cleanHTMLTranslation(htmlString: string): string {
  if (!htmlString || typeof htmlString !== 'string') {
    return htmlString;
  }

  // Use a simple regex approach to clean text content within HTML
  // This preserves HTML structure while cleaning text nodes
  return htmlString.replace(/>([^<]+)</g, (match, textContent) => {
    const cleaned = cleanTranslation(textContent);
    return `>${cleaned}<`;
  });
}

/**
 * Clean batch translation results
 */
export function cleanBatchTranslations(translations: Record<string, string>): Record<string, string> {
  const cleaned: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(translations)) {
    cleaned[key] = cleanTranslation(value);
  }
  
  return cleaned;
}

/**
 * Validate if a translation looks clean and valid
 */
export function isValidTranslation(translation: string, originalText: string): boolean {
  if (!translation || typeof translation !== 'string') {
    return false;
  }

  const cleaned = cleanTranslation(translation);
  
  // Check if translation is too similar to original (might indicate translation failure)
  if (cleaned.toLowerCase() === originalText.toLowerCase()) {
    return false;
  }
  
  // Check if translation is suspiciously short or long compared to original
  const lengthRatio = cleaned.length / originalText.length;
  if (lengthRatio < 0.3 || lengthRatio > 3) {
    return false;
  }
  
  // Check for common AI error patterns
  const errorPatterns = [
    /^(I cannot|I can't|Unable to|Error|Failed)/i,
    /^(Sorry|Apologies|I apologize)/i,
    /^(Please|Could you|Can you)/i,
    /\[.*\]/,  // Brackets often indicate placeholders or errors
    /\{.*\}/,  // Curly braces often indicate placeholders
  ];
  
  for (const pattern of errorPatterns) {
    if (pattern.test(cleaned)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHTML(html: string): string {
  // Basic XSS prevention - remove dangerous tags and attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gis, '') // Remove object tags
    .replace(/<embed[^>]*>/gis, '') // Remove embed tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gis, '') // Remove event handlers
    .replace(/javascript:/gis, '') // Remove javascript: URLs
    .replace(/data:(?!image\/)/gis, '') // Remove non-image data URLs
    .replace(/<link[^>]*>/gis, '') // Remove link tags
    .replace(/<meta[^>]*>/gis, ''); // Remove meta tags
}

/**
 * Extract and clean text from various input formats with security validation
 */
export function extractAndCleanText(input: any): string {
  // Input validation - reject non-string, non-object inputs
  if (input === null || input === undefined) {
    return '';
  }

  if (typeof input === 'string') {
    // Validate string length to prevent DoS
    if (input.length > 10000) {
      throw new Error('Input text too long (max 10000 characters)');
    }
    return cleanTranslation(input);
  }

  if (typeof input === 'object') {
    // Handle objects that might have a text property
    if ('text' in input && typeof input.text === 'string') {
      if (input.text.length > 10000) {
        throw new Error('Input text too long (max 10000 characters)');
      }
      return cleanTranslation(input.text);
    }

    // Handle objects that might have a translation property
    if ('translation' in input && typeof input.translation === 'string') {
      if (input.translation.length > 10000) {
        throw new Error('Input text too long (max 10000 characters)');
      }
      return cleanTranslation(input.translation);
    }

    // Handle objects that might have a value property
    if ('value' in input && typeof input.value === 'string') {
      if (input.value.length > 10000) {
        throw new Error('Input text too long (max 10000 characters)');
      }
      return cleanTranslation(input.value);
    }
  }
  
  // Fallback: convert to string and clean
  return cleanTranslation(String(input));
}

/**
 * Normalize text for consistent processing
 */
export function normalizeForTranslation(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  return text
    .trim()
    .replace(/\s+/g, ' ')  // Normalize whitespace
    .replace(/\u00A0/g, ' ')  // Replace non-breaking spaces
    .replace(/[\u2000-\u200B]/g, ' ')  // Replace various Unicode spaces
    .replace(/[\u2028\u2029]/g, '\n');  // Normalize line separators
}

/**
 * Check if text needs cleaning
 */
export function needsCleaning(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for surrounding quotes
  const hasQuotes = (text.startsWith('"') && text.endsWith('"')) ||
                   (text.startsWith("'") && text.endsWith("'"));
  
  // Check for translation artifacts
  const hasArtifacts = /^(Translation|Traducción|Traduction|Übersetzung|Here is|The translation):/i.test(text);
  
  // Check for markdown formatting
  const hasMarkdown = /^\*\*.*\*\*$|^\*.*\*$|^`.*`$/.test(text);
  
  // Check for excessive whitespace
  const hasExcessiveWhitespace = /\s{2,}/.test(text) || text !== text.trim();
  
  return hasQuotes || hasArtifacts || hasMarkdown || hasExcessiveWhitespace;
}

/**
 * Batch clean multiple translations efficiently
 */
export function batchCleanTranslations(translations: string[]): string[] {
  return translations.map(translation => cleanTranslation(translation));
}

/**
 * Clean translation with context awareness
 */
export function cleanTranslationWithContext(
  translation: string,
  context: {
    originalText?: string;
    targetLanguage?: string;
    sourceLanguage?: string;
    isHTML?: boolean;
  } = {}
): string {
  if (!translation) return translation;

  let cleaned = context.isHTML 
    ? cleanHTMLTranslation(translation)
    : cleanTranslation(translation);

  // Additional context-aware cleaning
  if (context.originalText && context.targetLanguage) {
    // If translation is identical to original and languages are different,
    // it might be a translation failure
    if (cleaned === context.originalText && 
        context.targetLanguage !== context.sourceLanguage) {
      // Return original but mark it as potentially untranslated
      return cleaned;
    }
  }

  return cleaned;
}
