import type { RustleConfig } from './types';
import { RustleConfigSchema } from './types';
import { getLocaleFromCookie, setLocaleToCookie } from './utils/cookies';
import { defaultStorageManager } from './utils/storage';
import { createAPIClient } from './utils/api';
import { 
  extractTags, 
  isTranslatableText, 
  normalizeText,
  generateFingerprint,
  generateContentHash 
} from './utils/fingerprint';

/**
 * Global Rustle engine instance
 */
class RustleEngineInstance {
  private config: RustleConfig | null = null;
  private observer: MutationObserver | null = null;
  private processedNodes = new Set<Element>();
  private apiClient: any = null;

  /**
   * Initialize the Rustle engine
   */
  initialize(config: Partial<RustleConfig>): void {
    // Validate and parse config
    this.config = RustleConfigSchema.parse({
      sourceLanguage: 'en',
      targetLanguages: [],
      apiKey: '',
      ...config,
      currentLocale: config.currentLocale || getLocaleFromCookie() || config.sourceLanguage || 'en',
    });

    if (this.config.deactivate) {
      if (this.config.debug) {
        console.log('Rustle: Engine deactivated');
      }
      return;
    }

    // Initialize API client
    this.apiClient = createAPIClient({
      apiKey: this.config.apiKey,
    });

    if (this.config.debug) {
      console.log('Rustle: Engine initialized with config:', this.config);
    }

    // Start processing if in browser
    if (typeof window !== 'undefined') {
      this.startProcessing();
    }
  }

  /**
   * Start processing DOM elements
   */
  private startProcessing(): void {
    if (!this.config || this.config.deactivate) return;

    // Process existing elements
    this.processExistingElements();

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();

    // Set up locale change handling
    this.setupLocaleHandling();
  }

  /**
   * Process existing DOM elements
   */
  private processExistingElements(): void {
    if (!this.config?.auto) return;

    const elements = document.querySelectorAll('body *');
    elements.forEach(element => this.processElement(element));
  }

  /**
   * Process a single element
   */
  private processElement(element: Element): void {
    if (!this.config) return;

    // Skip if already processed
    if (this.processedNodes.has(element)) return;

    // Skip excluded tags
    const tagName = element.tagName.toLowerCase();
    if (this.config.autoConfig?.exclude?.includes(tagName)) return;

    // Only process included tags (if specified)
    if (this.config.autoConfig?.include && !this.config.autoConfig.include.includes(tagName)) {
      return;
    }

    // Skip elements with data-i18n="false"
    if (element.getAttribute('data-i18n') === 'false') return;

    // Skip elements with data-i18n-pause="true"
    if (element.getAttribute('data-i18n-pause') === 'true') return;

    // Process text content
    const textContent = element.textContent?.trim();
    if (!textContent || !isTranslatableText(textContent)) return;

    // Generate fingerprint and add attributes
    const tags = extractTags(element);
    const fingerprint = generateFingerprint(window.location.pathname, 0);
    const contentHash = generateContentHash(textContent);

    // Add data attributes
    element.setAttribute('data-i18n', 'true');
    element.setAttribute('data-i18n-fingerprint', fingerprint);
    element.setAttribute('data-i18n-content-hash', contentHash);
    element.setAttribute('data-i18n-tags', tags.join(','));
    element.setAttribute('data-i18n-source', textContent);

    // Mark as processed
    this.processedNodes.add(element);

    if (this.config.debug) {
      console.log(`Rustle: Processed element: "${textContent}" with fingerprint: ${fingerprint}`);
    }
  }

  /**
   * Set up mutation observer
   */
  private setupMutationObserver(): void {
    if (!this.config?.auto) return;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              this.processElement(element);
              
              // Process child elements
              const childElements = element.querySelectorAll('*');
              childElements.forEach(child => this.processElement(child));
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Set up locale change handling
   */
  private setupLocaleHandling(): void {
    // Listen for locale changes via custom events
    window.addEventListener('rustleLocaleChange', ((event: CustomEvent) => {
      const newLocale = event.detail.locale;
      this.setLocale(newLocale);
    }) as EventListener);
  }

  /**
   * Change current locale
   */
  setLocale(locale: string): void {
    if (!this.config) return;

    if (!this.config.targetLanguages.includes(locale) && locale !== this.config.sourceLanguage) {
      console.warn(`Rustle: Locale ${locale} is not in target languages`);
      return;
    }

    this.config = { ...this.config, currentLocale: locale };
    setLocaleToCookie(locale);

    if (this.config.debug) {
      console.log(`Rustle: Locale changed to ${locale}`);
    }

    // Trigger re-translation
    this.translateElements();

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('rustleLocaleChanged', {
      detail: { locale }
    }));
  }

  /**
   * Translate all marked elements
   */
  private async translateElements(): Promise<void> {
    if (!this.config) return;

    const elements = document.querySelectorAll('[data-i18n="true"]');
    
    for (const element of elements) {
      await this.translateElement(element);
    }
  }

  /**
   * Translate a single element
   */
  private async translateElement(element: Element): Promise<void> {
    if (!this.config) return;

    const sourceText = element.getAttribute('data-i18n-source');
    const fingerprint = element.getAttribute('data-i18n-fingerprint');
    
    if (!sourceText || !fingerprint) return;

    // Skip if current locale is source language
    if (this.config.currentLocale === this.config.sourceLanguage) {
      element.textContent = sourceText;
      return;
    }

    try {
      // Check cache first
      if (!this.config.currentLocale) return;

      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        sourceText,
        this.config.sourceLanguage,
        this.config.currentLocale
      );

      if (cachedTranslation) {
        element.textContent = cachedTranslation;
        return;
      }

      // Make API call for translation
      if (this.apiClient && this.config.currentLocale) {
        const translation = await this.apiClient.translateSingle(
          sourceText,
          this.config.sourceLanguage,
          this.config.currentLocale,
          this.config.model
        );

        element.textContent = translation;

        // Cache the translation
        if (this.config.currentLocale) {
          defaultStorageManager.cacheTranslation(
            sourceText,
            this.config.sourceLanguage,
            this.config.currentLocale,
            translation
          );
        }

        if (this.config.debug) {
          console.log(`Rustle: Translated "${sourceText}" to "${translation}"`);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('Rustle: Translation error:', error);
      }
      
      if (this.config.fallback) {
        element.textContent = sourceText;
      }
    }
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): string | null {
    return this.config?.currentLocale || null;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.processedNodes.clear();
    this.config = null;
    this.apiClient = null;
  }
}

// Global instance
const rustleEngineInstance = new RustleEngineInstance();

/**
 * Main rustleEngine function for programmatic usage
 */
export function rustleEngine(config: Partial<RustleConfig>): void {
  rustleEngineInstance.initialize(config);
}

// Attach to window for global access
if (typeof window !== 'undefined') {
  (window as any).rustleEngine = rustleEngine;
  (window as any).rustleSetLocale = (locale: string) => rustleEngineInstance.setLocale(locale);
  (window as any).rustleGetLocale = () => rustleEngineInstance.getCurrentLocale();
}
