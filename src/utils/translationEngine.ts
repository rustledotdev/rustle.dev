import type { Locale, LocaleData, RustleConfig } from '../types';
import { createAPIClient } from './api';
import { generateContentFingerprint, isTranslatableText } from './fingerprinting';

/**
 * Translation Engine - Core DOM manipulation and translation logic
 * Implements fingerprinting, DOM scanning, and translation updates
 */
export class TranslationEngine {
  private config: RustleConfig;
  private currentLocale: Locale;
  private localeData: Record<Locale, LocaleData>;
  private mutationObserver?: MutationObserver;
  private intersectionObserver?: IntersectionObserver;
  private apiClient: ReturnType<typeof createAPIClient>;
  private fingerprintCounter = 0;
  private processedElements = new WeakSet<Element>();
  private pendingTranslations = new Map<string, Element[]>();
  private batchTimeout?: NodeJS.Timeout;

  constructor(config: RustleConfig, currentLocale: Locale, localeData: Record<Locale, LocaleData>) {
    this.config = config;
    this.currentLocale = currentLocale;
    this.localeData = localeData;
    this.apiClient = createAPIClient({ apiKey: config.apiKey });
  }

  /**
   * Initialize the translation engine
   */
  public initialize(): void {
    if (this.config.deactivate) return;

    if (this.config.debug) {
      console.log('🚀 Rustle Translation Engine initializing...', {
        currentLocale: this.currentLocale,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguages: this.config.targetLanguages,
        localeDataKeys: Object.keys(this.localeData)
      });
    }

    // Scan and process existing DOM
    this.scanAndProcessDOM();

    // Set up observers for dynamic content
    this.setupMutationObserver();
    this.setupIntersectionObserver();

    // In development mode, do a more aggressive scan for missing content
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        this.scanForMissingContent();
      }, 1000); // Give React time to render
    }

    if (this.config.debug) {
      console.log('✅ Rustle Translation Engine initialized successfully');
    }
  }

  /**
   * Update locale and re-translate all elements
   */
  public updateLocale(newLocale: Locale, newLocaleData: Record<Locale, LocaleData>): void {
    this.currentLocale = newLocale;
    this.localeData = newLocaleData;
    
    // Re-translate all elements with fingerprints
    this.translateAllElements();
  }

  /**
   * Scan DOM and add fingerprints to translatable elements
   */
  private scanAndProcessDOM(): void {
    const elements = this.getTranslatableElements();

    if (this.config.debug) {
      console.log(`🔍 Rustle: Found ${elements.length} translatable elements`);
    }

    elements.forEach((element, index) => {
      if (!this.processedElements.has(element)) {
        if (this.config.debug && index < 5) { // Log first 5 elements
          console.log(`🔧 Processing element ${index + 1}:`, {
            tag: element.tagName,
            text: this.getElementTextContent(element).substring(0, 50) + '...',
            hasFingerprint: element.hasAttribute('data-i18n-fingerprint')
          });
        }
        this.processElement(element);
        this.processedElements.add(element);
      }
    });
  }

  /**
   * Aggressively scan for missing content that doesn't have fingerprints yet
   * This is used in development mode to catch content that was missed
   */
  private scanForMissingContent(): void {
    if (this.config.debug) {
      console.log('🔍 Rustle: Scanning for missing content...');
    }

    // Get all text-containing elements, not just the configured ones
    const allElements = document.querySelectorAll('*');
    let missingCount = 0;

    allElements.forEach(element => {
      // Skip if element already has fingerprint
      if (element.getAttribute('data-i18n-fingerprint')) return;

      // Skip if element is not translatable
      if (!this.isTranslatableElement(element)) return;

      // Check if element has meaningful text content
      const textContent = this.getElementTextContent(element);
      if (!textContent.trim() || textContent.length < 2) return;

      // Skip if text is just numbers or symbols
      if (!/[a-zA-Z]/.test(textContent)) return;

      // Skip if element is inside a script or style tag
      if (element.closest('script, style, noscript')) return;

      // This element has text but no fingerprint - process it
      if (this.config.debug) {
        console.log(`🆕 Rustle: Found missing content: "${textContent.substring(0, 50)}..."`);
      }

      this.processElement(element);
      this.processedElements.add(element);
      missingCount++;
    });

    if (this.config.debug) {
      console.log(`🔍 Rustle: Scan complete. Found ${missingCount} missing content items`);
    }

    // Process any new pending translations
    if (this.pendingTranslations.size > 0) {
      this.processPendingTranslations();
    }
  }

  /**
   * Get all translatable elements based on config
   */
  private getTranslatableElements(): Element[] {
    const selector = this.buildElementSelector();
    return Array.from(document.querySelectorAll(selector));
  }

  /**
   * Build CSS selector for translatable elements
   */
  private buildElementSelector(): string {
    const { autoConfig } = this.config;
    
    // Default translatable elements
    const defaultElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'button', 'a', 'li'];
    
    let includeElements = defaultElements;
    if (autoConfig?.include && autoConfig.include.length > 0) {
      includeElements = autoConfig.include;
    }

    // Build selector, excluding elements that should not be translated
    const excludeElements = autoConfig?.exclude || ['script', 'style', 'code', 'pre'];
    const excludeSelector = excludeElements.map(tag => `:not(${tag})`).join('');
    
    // Also exclude elements that already have data-i18n="false"
    const selector = includeElements
      .map(tag => `${tag}${excludeSelector}:not([data-i18n="false"])`)
      .join(', ');

    return selector;
  }

  /**
   * Process a single element - add fingerprint and translate
   */
  private processElement(element: Element): void {
    // Skip if element has no text content or is already processed
    const textContent = this.getElementTextContent(element);
    if (!textContent.trim()) return;

    // Skip if element already has fingerprint
    if (element.hasAttribute('data-i18n-fingerprint')) {
      this.translateElement(element);
      return;
    }

    // Generate fingerprint for the element
    const fingerprint = generateContentFingerprint(textContent);
    
    // Add attributes
    element.setAttribute('data-i18n-fingerprint', fingerprint);
    element.setAttribute('data-i18n', 'true');

    // Store original text as data attribute for fallback
    element.setAttribute('data-i18n-original', textContent);

    // Translate the element
    this.translateElement(element);

    if (this.config.debug) {
      console.log(`Rustle: Processed element with fingerprint ${fingerprint}:`, textContent);
    }
  }



  /**
   * Simple hash function (replace with proper sha1 in production)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Get text content from element (excluding child elements)
   */
  private getElementTextContent(element: Element): string {
    // Get only direct text nodes, not from child elements
    const textNodes = Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .map(node => node.textContent || '')
      .join(' ');
    
    return textNodes.trim();
  }

  /**
   * Translate a single element based on its fingerprint
   */
  private translateElement(element: Element): void {
    const fingerprint = element.getAttribute('data-i18n-fingerprint');
    if (!fingerprint) return;

    if (this.config.debug) {
      console.log(`🔍 Translating element with fingerprint: ${fingerprint}`);
      console.log(`📊 Current locale: ${this.currentLocale}`);
      console.log(`📚 Available locales:`, Object.keys(this.localeData));
    }

    // Skip if current locale is source language
    if (this.currentLocale === this.config.sourceLanguage) {
      const originalText = element.getAttribute('data-i18n-original');
      if (originalText) {
        this.updateElementText(element, originalText);
        if (this.config.debug) {
          console.log(`✅ Restored original text for ${fingerprint}: ${originalText}`);
        }
      }
      return;
    }

    // Get translation from locale data
    const currentLocaleData = this.localeData[this.currentLocale];
    if (currentLocaleData && currentLocaleData[fingerprint]) {
      const translatedText = currentLocaleData[fingerprint];
      this.updateElementText(element, translatedText);

      if (this.config.debug) {
        console.log(`✅ Applied translation for ${fingerprint}: ${translatedText}`);
      }
    } else {
      if (this.config.debug) {
        console.log(`❌ No translation found for ${fingerprint} in locale ${this.currentLocale}`);
        console.log(`📋 Available translations for this locale:`, Object.keys(currentLocaleData || {}));
      }

      // Add to pending translations for batch processing
      this.addToPendingTranslations(element, fingerprint);
    }
  }

  /**
   * Add element to pending translations for batch processing
   */
  private addToPendingTranslations(element: Element, fingerprint: string): void {
    const locale = this.currentLocale;
    const key = `${locale}:${fingerprint}`;

    if (!this.pendingTranslations.has(key)) {
      this.pendingTranslations.set(key, []);
    }

    const elements = this.pendingTranslations.get(key);
    if (elements && !elements.includes(element)) {
      elements.push(element);
    }

    // Debounce batch processing
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processPendingTranslations();
    }, 100); // 100ms debounce
  }

  /**
   * Process all pending translations in batches
   */
  private async processPendingTranslations(): Promise<void> {
    if (this.pendingTranslations.size === 0) return;

    const locale = this.currentLocale;
    const entries: Array<{ id: string; text: string }> = [];
    const elementMap = new Map<string, Element[]>();

    // Collect all pending translations for current locale
    for (const [key, elements] of this.pendingTranslations.entries()) {
      const [keyLocale, fingerprint] = key.split(':');
      if (keyLocale === locale && elements.length > 0 && fingerprint) {
        const firstElement = elements[0];
        if (firstElement) {
          const originalText = firstElement.getAttribute('data-i18n-original');
          if (originalText) {
            entries.push({ id: fingerprint, text: originalText });
            elementMap.set(fingerprint, elements);
          }
        }
      }
    }

    if (entries.length === 0) return;

    try {
      if (this.config.debug) {
        console.log(`Rustle: Batch translating ${entries.length} entries to ${locale}`);
      }

      // Make batch API call
      const response = await this.apiClient.translateBatch({
        entries,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: locale,
        model: this.config.model,
      });

      // Update elements with translations
      for (const [fingerprint, translatedText] of Object.entries(response.translations)) {
        const elements = elementMap.get(fingerprint);
        if (elements) {
          elements.forEach(element => {
            this.updateElementText(element, translatedText);
          });

          if (this.config.debug) {
            console.log(`Rustle: Batch translated ${fingerprint}: ${translatedText}`);
          }
        }

        // Update locale data cache
        if (!this.localeData[locale]) {
          this.localeData[locale] = {};
        }
        this.localeData[locale][fingerprint] = translatedText;
      }

      // Clear processed translations
      for (const [key] of this.pendingTranslations.entries()) {
        const [keyLocale] = key.split(':');
        if (keyLocale === locale) {
          this.pendingTranslations.delete(key);
        }
      }

    } catch (error) {
      console.error('Rustle: Batch translation failed:', error);

      // Fallback to original text for all pending elements
      if (this.config.fallback) {
        for (const elements of elementMap.values()) {
          elements.forEach(element => {
            const originalText = element.getAttribute('data-i18n-original');
            if (originalText) {
              this.updateElementText(element, originalText);
            }
          });
        }
      }

      // Clear failed translations
      for (const [key] of this.pendingTranslations.entries()) {
        const [keyLocale] = key.split(':');
        if (keyLocale === locale) {
          this.pendingTranslations.delete(key);
        }
      }
    }
  }

  /**
   * Update element text content
   */
  private updateElementText(element: Element, text: string): void {
    const originalText = element.textContent;

    if (this.config.debug) {
      console.log(`🔄 Updating element text:`, {
        tag: element.tagName,
        fingerprint: element.getAttribute('data-i18n-fingerprint'),
        from: originalText?.substring(0, 30) + '...',
        to: text.substring(0, 30) + '...'
      });
    }

    // Simple approach: update textContent directly
    // This will replace all text content but preserve the element structure
    element.textContent = text;

    if (this.config.debug) {
      console.log(`✅ Element updated. New content:`, element.textContent?.substring(0, 50) + '...');
    }
  }

  /**
   * Translate all elements with fingerprints
   */
  private translateAllElements(): void {
    const elements = document.querySelectorAll('[data-i18n-fingerprint]');
    elements.forEach(element => this.translateElement(element));
  }

  /**
   * Setup MutationObserver to watch for DOM changes
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Process added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Process the element itself
            if (this.isTranslatableElement(element)) {
              this.processElement(element);
            }
            
            // Process child elements
            const children = this.getTranslatableElementsInSubtree(element);
            children.forEach(child => this.processElement(child));
          }
        });
      });
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Setup IntersectionObserver for performance optimization
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (!this.processedElements.has(element)) {
            this.processElement(element);
            this.processedElements.add(element);
          }
        }
      });
    });

    // Observe all translatable elements
    const elements = this.getTranslatableElements();
    elements.forEach(element => {
      this.intersectionObserver?.observe(element);
    });
  }

  /**
   * Check if element is translatable based on config
   */
  private isTranslatableElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    const { autoConfig } = this.config;
    
    // Check exclude list
    if (autoConfig?.exclude?.includes(tagName)) {
      return false;
    }
    
    // Check data-i18n attribute
    if (element.getAttribute('data-i18n') === 'false') {
      return false;
    }
    
    // Check include list
    const defaultElements = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div', 'button', 'a', 'li'];
    const includeElements = autoConfig?.include || defaultElements;
    
    return includeElements.includes(tagName);
  }

  /**
   * Get translatable elements in a subtree
   */
  private getTranslatableElementsInSubtree(root: Element): Element[] {
    const selector = this.buildElementSelector();
    return Array.from(root.querySelectorAll(selector));
  }

  /**
   * Cleanup observers and pending operations
   */
  public destroy(): void {
    this.mutationObserver?.disconnect();
    this.intersectionObserver?.disconnect();

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.pendingTranslations.clear();
  }
}
