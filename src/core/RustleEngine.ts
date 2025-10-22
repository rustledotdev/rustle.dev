import { createAPIClient } from '../utils/api';
import { defaultStorageManager } from '../utils/storage';
import {
  isTranslatableText,
  normalizeText,
  generateFingerprint,
  generateContentHash
} from '../utils/fingerprint';
import type { RustleConfig, Locale, LocaleData, AIModel } from '../types';
import { PluginManager, type RustlePlugin } from './PluginSystem';
import { offlineManager } from './OfflineManager';

/**
 * Framework-agnostic RustleEngine for vanilla JS and any framework
 * Optimized for SaaS product with cost-effective translation management
 */
export class RustleEngine {
  private config: RustleConfig;
  private localeData: Record<Locale, LocaleData> = {};
  private observer: MutationObserver | null = null;
  private processedElements = new Set<Element>();
  private pendingTranslations = new Map<string, Promise<string>>();
  private pluginManager = new PluginManager();

  constructor(config: Partial<RustleConfig>) {
    this.config = {
      deactivate: false,
      sourceLanguage: 'en' as Locale,
      targetLanguages: ['es', 'fr', 'de', 'it', 'pt'] as Locale[],
      currentLocale: 'en' as Locale,
      apiKey: '',
      model: 'gpt-3.5-turbo' as AIModel,
      debug: false,
      auto: true,
      fallback: true,
      ...config,
    } as RustleConfig;

    if (this.config.debug) {
      console.log('🚀 RustleEngine: Initialized with config:', this.config);
    }
  }

  /**
   * Use a plugin
   */
  use(plugin: RustlePlugin): this {
    this.pluginManager.use(plugin);
    return this;
  }

  /**
   * Remove a plugin
   */
  unuse(pluginName: string): boolean {
    return this.pluginManager.unuse(pluginName);
  }

  /**
   * Get a plugin
   */
  getPlugin(name: string): RustlePlugin | undefined {
    return this.pluginManager.getPlugin(name);
  }

  /**
   * Get offline status
   */
  isOffline(): boolean {
    return !offlineManager.getOnlineStatus();
  }

  /**
   * Get pending translations count
   */
  getPendingTranslationsCount(): number {
    return offlineManager.getPendingTranslationsCount();
  }

  /**
   * Export cache for backup
   */
  exportCache(): string {
    return offlineManager.exportCache();
  }

  /**
   * Import cache from backup
   */
  importCache(cacheData: string): void {
    offlineManager.importCache(cacheData);
  }

  /**
   * Clear translation cache
   */
  clearCache(): void {
    offlineManager.clearCache();
    defaultStorageManager.clearCache();
    if (this.config.debug) {
      console.log('🧹 RustleEngine: Cache cleared');
    }
  }

  /**
   * Initialize the engine and start processing
   */
  async init(): Promise<void> {
    if (this.config.deactivate) {
      if (this.config.debug) {
        console.log('⏸️ RustleEngine: Deactivated, skipping initialization');
      }
      return;
    }

    // Initialize plugins
    await this.pluginManager.init(this.config);

    // Load initial locale data
    await this.loadLocaleData(this.config.currentLocale as Locale);

    // Preload translations for offline use
    if (this.localeData && Object.keys(this.localeData).length > 0) {
      await offlineManager.preloadTranslations(this.localeData);
    }

    // Start auto-processing if enabled
    if (this.config.auto && typeof document !== 'undefined') {
      this.startAutoProcessing();
    }
  }

  /**
   * Load locale data from files or API
   */
  async loadLocaleData(locale: Locale): Promise<void> {
    if (this.localeData[locale]) {
      return; // Already loaded
    }

    try {
      // Try to load from static files first
      const response = await fetch(`/rustle/locales/${locale}.json`);
      if (response.ok) {
        const data = await response.json();
        this.localeData[locale] = data;
        
        if (this.config.debug) {
          console.log(`✅ RustleEngine: Loaded locale ${locale} with ${Object.keys(data).length} entries`);
        }
        return;
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn(`⚠️ RustleEngine: Failed to load static locale ${locale}:`, error);
      }
    }

    // Initialize empty locale data if loading failed
    this.localeData[locale] = {};
  }

  /**
   * Start automatic processing of DOM elements
   */
  private startAutoProcessing(): void {
    // Process existing elements
    this.processExistingElements();

    // Set up mutation observer for dynamic content
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processElement(node as Element);
            }
          });
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    if (this.config.debug) {
      console.log('👀 RustleEngine: Started auto-processing with MutationObserver');
    }
  }

  /**
   * Process existing elements in the DOM
   */
  private processExistingElements(): void {
    if (typeof document === 'undefined') return;

    const elements = document.querySelectorAll('body *');
    elements.forEach((element) => this.processElement(element));
  }

  /**
   * Process a single element for translation
   */
  private processElement(element: Element): void {
    if (this.processedElements.has(element)) {
      return; // Already processed
    }

    // Skip excluded elements
    if (element.getAttribute('data-i18n') === 'false') {
      return;
    }

    // Skip paused elements
    if (element.getAttribute('data-i18n-pause') === 'true') {
      return;
    }

    const tagName = element.tagName.toLowerCase();

    // Skip excluded tags
    if (this.config.autoConfig?.exclude?.includes(tagName)) {
      return;
    }

    // Only process included tags (if specified)
    if (this.config.autoConfig?.include && !this.config.autoConfig.include.includes(tagName)) {
      return;
    }

    // Process text content
    const textContent = element.textContent?.trim();
    if (!textContent || !isTranslatableText(textContent)) {
      return;
    }

    const normalizedText = normalizeText(textContent);
    if (!normalizedText) {
      return;
    }

    // Generate fingerprint and add attributes
    const fingerprint = generateFingerprint(window.location.pathname, 0);
    const contentHash = generateContentHash(normalizedText);

    element.setAttribute('data-i18n', 'true');
    element.setAttribute('data-i18n-fingerprint', fingerprint);
    element.setAttribute('data-i18n-content-hash', contentHash);
    element.setAttribute('data-i18n-source', normalizedText);

    // Mark as processed
    this.processedElements.add(element);

    // Translate if needed
    if (this.config.currentLocale !== this.config.sourceLanguage) {
      this.translateElement(element, normalizedText);
    }

    if (this.config.debug) {
      console.log(`🔍 RustleEngine: Processed element with fingerprint: ${fingerprint}`);
    }
  }

  /**
   * Translate a specific element
   */
  private async translateElement(element: Element, sourceText: string): Promise<void> {
    try {
      const translation = await this.translate(sourceText, this.config.currentLocale);
      element.textContent = translation;
    } catch (error) {
      if (this.config.debug) {
        console.error('❌ RustleEngine: Translation error:', error);
      }
      
      if (this.config.fallback) {
        element.textContent = sourceText;
      }
    }
  }

  /**
   * Translate text with deduplication and caching
   */
  async translate(text: string, targetLocale?: Locale, options?: { cache?: boolean }): Promise<string> {
    const target = targetLocale || this.config.currentLocale;
    const cacheEnabled = options?.cache !== false;

    if (target === this.config.sourceLanguage) {
      return text;
    }

    // Execute beforeTranslate plugin hooks
    const processedText = await this.pluginManager.executeHookChain('beforeTranslate', text, target as Locale, options);

    // Check static locale data first
    const staticTranslation = this.localeData[target as Locale]?.[processedText];
    if (staticTranslation) {
      // Execute cache hit hook
      await this.pluginManager.executeHook('onCacheHit', `static_${processedText}_${target}`, staticTranslation);
      return staticTranslation;
    }

    // Create cache key for deduplication
    const cacheKey = `${processedText}_${this.config.sourceLanguage}_${target}`;

    // Check if translation is already in progress
    if (this.pendingTranslations.has(cacheKey)) {
      return this.pendingTranslations.get(cacheKey)!;
    }

    // Check cache (including offline support)
    if (cacheEnabled) {
      const offlineTranslation = await offlineManager.getTranslation(
        processedText,
        this.config.sourceLanguage,
        target as Locale,
        true // fallback to original text if offline
      );

      if (offlineTranslation && offlineTranslation !== processedText) {
        // Execute cache hit hook
        await this.pluginManager.executeHook('onCacheHit', cacheKey, offlineTranslation);
        return offlineTranslation;
      } else if (!offlineManager.getOnlineStatus()) {
        // Offline and no cache - return original text
        console.log(`📴 Rustle: Offline, returning original text for "${processedText}"`);
        return processedText;
      } else {
        // Execute cache miss hook
        await this.pluginManager.executeHook('onCacheMiss', cacheKey);
      }
    }

    // Create translation promise
    const translationPromise = this.performTranslation(processedText, target as Locale, cacheEnabled);
    this.pendingTranslations.set(cacheKey, translationPromise);

    try {
      const result = await translationPromise;

      // Execute afterTranslate plugin hooks
      const finalResult = await this.pluginManager.executeHookChain('afterTranslate', result, processedText, target as Locale, options);

      return finalResult;
    } catch (error) {
      // Execute error hook
      await this.pluginManager.executeHook('onError', error instanceof Error ? error : new Error(String(error)), { text: processedText, target, options });
      throw error;
    } finally {
      this.pendingTranslations.delete(cacheKey);
    }
  }

  /**
   * Perform actual translation via API
   */
  private async performTranslation(text: string, target: Locale, cache: boolean): Promise<string> {
    try {
      const apiClient = createAPIClient({
        apiKey: this.config.apiKey,
      });

      const translation = await apiClient.translateSingle(
        text,
        this.config.sourceLanguage,
        target,
        this.config.model
      );

      // Cache the translation
      if (cache) {
        defaultStorageManager.cacheTranslation(
          text,
          this.config.sourceLanguage,
          target,
          translation
        );
      }

      if (this.config.debug) {
        console.log(`🔄 RustleEngine: Translated "${text}" to "${translation}" (${target})`);
      }

      return translation;
    } catch (error) {
      if (this.config.debug) {
        console.error('❌ RustleEngine: Translation error:', error);
      }

      if (this.config.fallback) {
        return text;
      }

      throw error;
    }
  }

  /**
   * Change current locale and re-translate content
   */
  async setLocale(locale: Locale): Promise<void> {
    if (locale === this.config.currentLocale) {
      return;
    }

    const oldLocale = this.config.currentLocale;
    this.config.currentLocale = locale;

    // Execute locale change hook
    await this.pluginManager.executeHook('onLocaleChange', locale, oldLocale as Locale);

    // Load locale data if needed
    await this.loadLocaleData(locale);

    // Re-translate all processed elements
    if (typeof document !== 'undefined') {
      const elements = document.querySelectorAll('[data-i18n="true"]');
      for (const element of elements) {
        const sourceText = element.getAttribute('data-i18n-source');
        if (sourceText) {
          await this.translateElement(element, sourceText);
        }
      }
    }

    if (this.config.debug) {
      console.log(`🌐 RustleEngine: Changed locale to ${locale}`);
    }
  }

  /**
   * Get current locale
   */
  getCurrentLocale(): Locale {
    return this.config.currentLocale as Locale;
  }



  /**
   * Destroy the engine and cleanup
   */
  async destroy(): Promise<void> {
    // Destroy plugins first
    await this.pluginManager.destroy();

    // Cleanup offline manager
    offlineManager.destroy();

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.processedElements.clear();
    this.pendingTranslations.clear();

    if (this.config.debug) {
      console.log('🗑️ RustleEngine: Destroyed and cleaned up');
    }
  }
}
