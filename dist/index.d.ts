import { default as default_2 } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { z } from 'zod';

/**
 * Advanced path-based locale manager with routing integration
 */
export declare class AdvancedPathLocaleManager {
    private static config;
    /**
     * Configure path-based routing
     */
    static configure(config: Partial<PathBasedRoutingConfig>): void;
    /**
     * Check if path should be excluded from locale handling
     */
    static shouldExcludePath(pathname: string): boolean;
    /**
     * Get locale from request with advanced path handling
     */
    static getLocaleFromRequest(request: {
        pathname: string;
        headers?: Record<string, string>;
        cookies?: Record<string, string>;
    }): {
        locale: Locale;
        shouldRedirect: boolean;
        redirectPath?: string;
    };
    /**
     * Generate alternate language links for SEO
     */
    static generateAlternateLinks(currentPath: string, baseUrl?: string): Array<{
        locale: Locale;
        href: string;
        hreflang: string;
    }>;
    /**
     * Get configuration
     */
    static getConfig(): PathBasedRoutingConfig;
}

export declare type AIModel = z.infer<typeof AIModelSchema>;

declare const AIModelSchema: z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>;

declare class APIClient {
    private config;
    private activeRequests;
    private notificationSystem;
    constructor(config: APIClientConfig);
    /**
     * Cancel an active request by key
     */
    cancelRequest(requestKey: string): boolean;
    /**
     * Cancel all active requests
     */
    cancelAllRequests(): void;
    private request;
    /**
     * Translate a batch of text entries
     */
    translateBatch(request: TranslationRequest, requestKey?: string): Promise<TranslationResponse>;
    /**
     * Translate a single text entry
     */
    translateSingle(text: string, sourceLanguage: Locale, targetLanguage: Locale, model?: AIModel, context?: {
        tags?: string[];
        file?: string;
    }): Promise<string>;
    /**
     * Health check endpoint
     */
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
    }>;
    /**
     * Get supported models and languages
     */
    getSupportedModels(): Promise<{
        models: AIModel[];
        languages: Locale[];
    }>;
}

declare interface APIClientConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
}

/**
 * Universal hook for both SSR and CSR translation functionality
 * Optimized for cost-effectiveness and performance
 * Replaces useRustle with enhanced caching and batch optimization
 */
export declare function applyRustle(): UseRustleReturn;

/**
 * AutoTranslate component that uses React Virtual DOM for efficient translation updates
 * This component automatically translates children elements that have data-i18n-fingerprint attributes
 */
export declare function AutoTranslate({ children }: AutoTranslateProps): JSX_2.Element;

declare interface AutoTranslateProps {
    children: default_2.ReactNode;
}

/**
 * Load module only in browser environment
 */
export declare function browserOnlyImport<T>(importFn: () => Promise<T>, fallback?: T): Promise<T | undefined>;

/**
 * Bundle size optimization utilities
 */
export declare const bundleOptimization: {
    /**
     * Tree-shake unused exports by importing only what's needed
     */
    selectiveImport: <T extends Record<string, any>>(module: T, keys: (keyof T)[]) => Partial<T>;
    /**
     * Defer non-critical imports
     */
    deferImport: <T>(importFn: () => Promise<T>, timeout?: number) => Promise<T>;
    /**
     * Load modules in chunks to avoid blocking
     */
    chunkLoad: <T>(imports: (() => Promise<T>)[], chunkSize?: number) => Promise<T[]>;
};

/**
 * Cancel idle callback
 */
declare function cancelIdleCallback_2(id: number): void;
export { cancelIdleCallback_2 as cancelIdleCallback }

/**
 * Common patterns for extracting templates
 */
export declare const commonPatterns: {
    regex: RegExp;
    placeholder: string;
}[];

/**
 * Conditionally load a module based on environment
 */
export declare function conditionalImport<T>(condition: boolean | (() => boolean), importFn: () => Promise<T>, fallback?: T): Promise<T | undefined>;

/**
 * Helper functions for common configuration tasks
 */
export declare const configHelpers: {
    /**
     * Check if we're in development mode
     */
    isDevelopment(): boolean;
    /**
     * Check if we're in production mode
     */
    isProduction(): boolean;
    /**
     * Get the best available AI model
     */
    getBestModel(): AIModel;
    /**
     * Check if feature is enabled
     */
    isFeatureEnabled(feature: keyof RuntimeConfig): boolean;
    /**
     * Get locale file path
     */
    getLocalePath(locale: Locale): string;
    /**
     * Get master file path
     */
    getMasterPath(): string;
    /**
     * Setup configuration for different environments
     */
    setupEnvironment(env: "development" | "staging" | "production"): void;
};

/**
 * Configuration manager for Rustle.dev SDK
 */
export declare class ConfigManager {
    private static instance;
    private config;
    private constructor();
    static getInstance(): ConfigManager;
    /**
     * Load configuration from multiple sources
     */
    private loadConfiguration;
    /**
     * Get configuration value
     */
    get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K];
    /**
     * Set configuration value
     */
    set<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]): void;
    /**
     * Update multiple configuration values
     */
    update(updates: Partial<RuntimeConfig>): void;
    /**
     * Get all configuration
     */
    getAll(): RuntimeConfig;
    /**
     * Reset to defaults
     */
    reset(): void;
    /**
     * Validate configuration
     */
    validate(): {
        valid: boolean;
        errors: string[];
    };
}

/**
 * Create a configured API client instance
 */
export declare function createAPIClient(config: APIClientConfig): APIClient;

/**
 * Hook for setting locale in both server and client components
 */
export declare function createLocaleManager(initialLocale?: Locale): {
    getCurrentLocale: () => string;
    setLocale: (locale: Locale, updatePath?: boolean) => void;
    subscribe: (listener: (locale: Locale) => void) => () => void;
    navigateToLocalizedPath: (path: string, locale?: Locale) => void;
    configurePathBasedRouting: (enabled: boolean, supportedLocales?: Locale[]) => void;
};

/**
 * Advanced debounce function with leading/trailing edge options
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number, options?: DebounceOptions): (...args: Parameters<T>) => void;

/**
 * Performance optimization utilities for Rustle SDK
 */
declare interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

/**
 * Debug plugin for logging translation activities
 */
export declare const debugPlugin: RustlePlugin;

export declare const defaultStorageManager: StorageManager_2;

/**
 * Batch DOM operations for better performance
 */
export declare class DOMBatcher {
    private operations;
    private scheduled;
    add(operation: () => void): void;
    private schedule;
    private flush;
    clear(): void;
}

/**
 * Extract template from semi-dynamic text for translation
 * e.g., "You have 5 unread messages" -> "You have {count} unread messages"
 */
export declare function extractTemplate(text: string, patterns: Array<{
    regex: RegExp;
    placeholder: string;
}>): string;

/**
 * Utility to check if a feature is supported before loading
 */
export declare function featureSupported(feature: string): boolean;

/**
 * Get locale from cookie (works in both browser and server environments)
 */
export declare function getLocaleFromCookie(cookieString?: string): Locale | null;

/**
 * Global configuration instance
 */
export declare const globalConfig: ConfigManager;

/**
 * Handle semi-dynamic texts with placeholders
 * e.g., "You have {count} unread messages" where count is dynamic
 */
export declare function interpolateText(template: string, variables: Record<string, string | number>): string;

/**
 * Lazy load a React component
 */
export declare function lazyComponent<T extends default_2.ComponentType<any>>(importFn: () => Promise<{
    default: T;
} | T>, fallback?: default_2.ComponentType<any>): default_2.LazyExoticComponent<T>;

/**
 * Lazy loading utilities for optimizing bundle size
 */
/**
 * Lazy load a module only when needed
 */
export declare function lazyImport<T>(importFn: () => Promise<T>, fallback?: T): () => Promise<T>;

/**
 * Intersection Observer for lazy loading
 */
export declare class LazyObserver {
    private observer;
    private callbacks;
    constructor(options?: IntersectionObserverInit);
    observe(element: Element, callback: () => void): void;
    unobserve(element: Element): void;
    disconnect(): void;
}

/**
 * Load polyfills only when needed
 */
export declare function loadPolyfillIfNeeded(feature: string, polyfillImport: () => Promise<any>): Promise<void>;

export declare type Locale = z.infer<typeof LocaleSchema>;

export declare type LocaleData = z.infer<typeof LocaleDataSchema>;

declare const LocaleDataSchema: z.ZodRecord<z.ZodString, z.ZodString>;

declare const LocaleSchema: z.ZodString;

export declare type MasterMetadata = z.infer<typeof MasterMetadataSchema>;

declare const MasterMetadataSchema: z.ZodObject<{
    version: z.ZodString;
    sourceLanguage: z.ZodString;
    targetLanguages: z.ZodArray<z.ZodString, "many">;
    entries: z.ZodArray<z.ZodObject<{
        fingerprint: z.ZodString;
        source: z.ZodString;
        file: z.ZodString;
        loc: z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>;
        contentHash: z.ZodString;
        version: z.ZodNumber;
        translations: z.ZodRecord<z.ZodString, z.ZodString>;
        lastTranslatedAt: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString, "many">;
        status: z.ZodEnum<["translated", "missing", "updated"]>;
    }, "strip", z.ZodTypeAny, {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }, {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }[];
    sourceLanguage: string;
    targetLanguages: string[];
    version: string;
    lastUpdated: string;
}, {
    entries: {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }[];
    sourceLanguage: string;
    targetLanguages: string[];
    version: string;
    lastUpdated: string;
}>;

/**
 * Memoization utility for expensive computations
 */
export declare function memoize<T extends (...args: any[]) => any>(func: T, maxSize?: number): T;

/**
 * Memory usage monitor
 */
export declare class MemoryMonitor {
    private maxMemoryUsage;
    private checkInterval;
    start(intervalMs?: number): void;
    stop(): void;
    private checkMemory;
    getStats(): {
        current: number;
        max: number;
        limit: number;
    } | null;
}

/**
 * Configurable metadata folder path
 */
export declare class MetadataPathManager {
    private static basePath;
    static setBasePath(path: string): void;
    static getBasePath(): string;
    static getLocalePath(locale: Locale): string;
    static getMasterPath(): string;
}

/**
 * Create a module cache for frequently used imports
 */
export declare class ModuleCache {
    private cache;
    private loading;
    get<T>(key: string, importFn: () => Promise<T>): Promise<T>;
    has(key: string): boolean;
    clear(): void;
    size(): number;
}

/**
 * Global module cache instance
 */
export declare const moduleCache: ModuleCache;

/**
 * Load module only in Node.js environment
 */
export declare function nodeOnlyImport<T>(importFn: () => Promise<T>, fallback?: T): Promise<T | undefined>;

/**
 * Offline manager for handling offline translation scenarios
 */
export declare class OfflineManager {
    private isOnline;
    private onlineCallbacks;
    private offlineCallbacks;
    private pendingTranslations;
    constructor();
    /**
     * Setup online/offline event listeners
     */
    private setupEventListeners;
    /**
     * Handle online event
     */
    private handleOnline;
    /**
     * Handle offline event
     */
    private handleOffline;
    /**
     * Check if currently online
     */
    getOnlineStatus(): boolean;
    /**
     * Add callback for when going online
     */
    onOnline(callback: () => void): () => void;
    /**
     * Add callback for when going offline
     */
    onOffline(callback: () => void): () => void;
    /**
     * Get cached translation or add to pending queue
     */
    getTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, fallbackToOriginal?: boolean): Promise<string | null>;
    /**
     * Cache a translation for offline use
     */
    cacheTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, translation: string): void;
    /**
     * Preload translations for offline use
     */
    preloadTranslations(localeData: Record<Locale, LocaleData>): Promise<void>;
    /**
     * Get pending translations count
     */
    getPendingTranslationsCount(): number;
    /**
     * Get pending translations
     */
    getPendingTranslations(): Array<{
        key: string;
        text: string;
        locale: Locale;
        timestamp: number;
    }>;
    /**
     * Sync pending translations when back online
     */
    private syncPendingTranslations;
    /**
     * Clear pending translations
     */
    clearPendingTranslations(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalCached: number;
        cacheSize: string;
        oldestEntry: Date | null;
        newestEntry: Date | null;
    };
    /**
     * Clear all cached translations
     */
    clearCache(): void;
    /**
     * Export cached translations for backup
     */
    exportCache(): string;
    /**
     * Import cached translations from backup
     */
    importCache(cacheData: string): void;
    /**
     * Cleanup old cache entries
     */
    cleanupOldCache(maxAgeMs?: number): void;
    /**
     * Destroy the offline manager
     */
    destroy(): void;
}

/**
 * Global offline manager instance
 */
export declare const offlineManager: OfflineManager;

/**
 * Path-based routing configuration options
 */
export declare interface PathBasedRoutingConfig {
    enabled: boolean;
    supportedLocales?: Locale[];
    defaultLocale?: Locale;
    excludePaths?: string[];
    includeDefaultLocaleInPath?: boolean;
    redirectToDefaultLocale?: boolean;
}

/**
 * Path-based locale detection and management
 */
export declare class PathLocaleManager {
    /**
     * Extract locale from URL path (e.g., /en/about, /fr/contact)
     */
    static extractLocaleFromPath(pathname: string, supportedLocales?: Locale[]): {
        locale: Locale | null;
        pathWithoutLocale: string;
    };
    /**
     * Add locale to path (e.g., /about -> /fr/about)
     */
    static addLocaleToPath(pathname: string, locale: Locale): string;
    /**
     * Remove locale from path (e.g., /fr/about -> /about)
     */
    static removeLocaleFromPath(pathname: string, supportedLocales?: Locale[]): string;
    /**
     * Check if path contains a locale
     */
    static hasLocaleInPath(pathname: string, supportedLocales?: Locale[]): boolean;
    /**
     * Generate localized paths for all supported locales
     */
    static generateLocalizedPaths(basePath: string, supportedLocales?: Locale[]): Record<Locale, string>;
}

/**
 * Performance metrics collector
 */
export declare class PerformanceCollector {
    private metrics;
    mark(name: string): void;
    measure(name: string, startMark: string, endMark?: string): number;
    private addMetric;
    getMetrics(name: string): {
        avg: number;
        min: number;
        max: number;
        count: number;
    } | null;
    getAllMetrics(): Record<string, {
        avg: number;
        min: number;
        max: number;
        count: number;
    }>;
    clear(): void;
}

/**
 * Performance monitoring plugin
 */
export declare const performancePlugin: RustlePlugin & {
    private: {
        startTimes: Map<string, number>;
        stats: {
            translations: number;
            cacheHits: number;
            cacheMisses: number;
            errors: number;
            totalTime: number;
        };
    };
};

/**
 * Global performance utilities
 */
export declare const performanceUtils: {
    lazyObserver: LazyObserver;
    domBatcher: DOMBatcher;
    memoryMonitor: MemoryMonitor;
    performanceCollector: PerformanceCollector;
    /**
     * Initialize performance monitoring
     */
    init(options?: {
        enableMemoryMonitoring?: boolean;
        memoryCheckInterval?: number;
    }): void;
    /**
     * Cleanup all performance utilities
     */
    cleanup(): void;
};

/**
 * Plugin manager for handling plugin registration and execution
 */
export declare class PluginManager {
    private plugins;
    private config;
    /**
     * Register a plugin
     */
    use(plugin: RustlePlugin): this;
    /**
     * Unregister a plugin
     */
    unuse(pluginName: string): boolean;
    /**
     * Get a registered plugin
     */
    getPlugin(name: string): RustlePlugin | undefined;
    /**
     * Get all registered plugins
     */
    getPlugins(): RustlePlugin[];
    /**
     * Initialize all plugins
     */
    init(config: RustleConfig): Promise<void>;
    /**
     * Destroy all plugins
     */
    destroy(): Promise<void>;
    /**
     * Execute hook for all plugins
     */
    executeHook(hookName: keyof RustlePlugin, ...args: any[]): Promise<any[]>;
    /**
     * Execute hook and return the first non-undefined result
     */
    executeHookFirst(hookName: keyof RustlePlugin, ...args: any[]): Promise<any>;
    /**
     * Execute hook and chain the results (useful for text transformations)
     */
    executeHookChain(hookName: keyof RustlePlugin, initialValue: any, ...args: any[]): Promise<any>;
}

/**
 * Preload a module for better performance
 */
export declare function preloadModule<T>(importFn: () => Promise<T>, delay?: number): void;

/**
 * Remove locale cookie (browser only)
 */
export declare function removeLocaleFromCookie(): void;

/**
 * Request idle callback polyfill
 */
declare function requestIdleCallback_2(callback: () => void, options?: {
    timeout?: number;
}): number;
export { requestIdleCallback_2 as requestIdleCallback }

/**
 * Runtime configuration for Rustle.dev SDK
 */
export declare interface RuntimeConfig {
    apiUrl?: string;
    apiKey?: string;
    sourceLanguage?: Locale;
    targetLanguages?: Locale[];
    defaultModel?: AIModel;
    localeBasePath?: string;
    useVirtualDOM?: boolean;
    enableBatching?: boolean;
    enableCaching?: boolean;
    enableOffline?: boolean;
    batchTimeout?: number;
    maxRetries?: number;
    cacheTimeout?: number;
    obfuscateRequests?: boolean;
    enableCSP?: boolean;
    debug?: boolean;
    enableMetrics?: boolean;
}

export declare class RustleAPIError extends Error {
    status?: number | undefined;
    code?: string | undefined;
    isQuotaExceeded?: boolean | undefined;
    quotaDetails?: {
        limit?: number;
        used?: number;
        resetDate?: string;
    } | undefined;
    constructor(message: string, status?: number | undefined, code?: string | undefined, isQuotaExceeded?: boolean | undefined, quotaDetails?: {
        limit?: number;
        used?: number;
        resetDate?: string;
    } | undefined);
}

/**
 * RustleBox - SIMPLE APPROACH (Back to Basics)
 *
 * Based on requirements from AI-startup.md and react-dom.md:
 * - Only use cookie-based locale detection (rustle-locale cookie)
 * - Simple React Virtual DOM approach with AutoTranslate
 * - No complex client-side hooks (useEffect, useState)
 * - Works with SSR, CSR, SSG, ISR
 * - Static translations first, API calls as fallback
 */
export declare function RustleBox({ children, sourceLanguage, targetLanguages, apiKey, // Required, no default value
    model, debug, auto, fallback, initialLocale, serverLocale, useVirtualDOM, localeBasePath, loadingConfig, }: RustleBoxProps): JSX_2.Element;

export declare interface RustleBoxProps extends Partial<Omit<RustleConfig, 'apiKey'>> {
    children: React.ReactNode;
    apiKey: string;
    initialLocale?: Locale;
    serverLocale?: Locale;
    useVirtualDOM?: boolean;
    localeBasePath?: string;
    loadingConfig?: any;
}

export declare type RustleConfig = z.infer<typeof RustleConfigSchema>;

declare const RustleConfigSchema: z.ZodObject<{
    deactivate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    targetLanguages: z.ZodArray<z.ZodString, "many">;
    currentLocale: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodString;
    model: z.ZodDefault<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>>;
    modelConfig: z.ZodOptional<z.ZodRecord<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>, z.ZodRecord<z.ZodString, z.ZodString>>>;
    debug: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    auto: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    autoConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    fallback: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    fallbackConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    localeBasePath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    useVirtualDOM: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    deactivate: boolean;
    sourceLanguage: string;
    targetLanguages: string[];
    apiKey: string;
    model: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure";
    debug: boolean;
    auto: boolean;
    fallback: boolean;
    localeBasePath: string;
    useVirtualDOM: boolean;
    currentLocale?: string | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
}, {
    targetLanguages: string[];
    apiKey: string;
    deactivate?: boolean | undefined;
    sourceLanguage?: string | undefined;
    currentLocale?: string | undefined;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    debug?: boolean | undefined;
    auto?: boolean | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallback?: boolean | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    localeBasePath?: string | undefined;
    useVirtualDOM?: boolean | undefined;
}>;

/**
 * Framework-agnostic RustleEngine for vanilla JS and any framework
 * Optimized for SaaS product with cost-effective translation management
 */
export declare class RustleEngine {
    private config;
    private localeData;
    private observer;
    private processedElements;
    private pendingTranslations;
    private pluginManager;
    constructor(config: Partial<RustleConfig>);
    /**
     * Use a plugin
     */
    use(plugin: RustlePlugin): this;
    /**
     * Remove a plugin
     */
    unuse(pluginName: string): boolean;
    /**
     * Get a plugin
     */
    getPlugin(name: string): RustlePlugin | undefined;
    /**
     * Get offline status
     */
    isOffline(): boolean;
    /**
     * Get pending translations count
     */
    getPendingTranslationsCount(): number;
    /**
     * Export cache for backup
     */
    exportCache(): string;
    /**
     * Import cache from backup
     */
    importCache(cacheData: string): void;
    /**
     * Clear translation cache
     */
    clearCache(): void;
    /**
     * Initialize the engine and start processing
     */
    init(): Promise<void>;
    /**
     * Load locale data from files or API
     */
    loadLocaleData(locale: Locale): Promise<void>;
    /**
     * Start automatic processing of DOM elements
     */
    private startAutoProcessing;
    /**
     * Process existing elements in the DOM
     */
    private processExistingElements;
    /**
     * Process a single element for translation
     */
    private processElement;
    /**
     * Translate a specific element
     */
    private translateElement;
    /**
     * Translate text with deduplication and caching
     */
    translate(text: string, targetLocale?: Locale, options?: {
        cache?: boolean;
    }): Promise<string>;
    /**
     * Perform actual translation via API
     */
    private performTranslation;
    /**
     * Change current locale and re-translate content
     */
    setLocale(locale: Locale): Promise<void>;
    /**
     * Get current locale
     */
    getCurrentLocale(): Locale;
    /**
     * Destroy the engine and cleanup
     */
    destroy(): Promise<void>;
}

/**
 * Main rustleEngine function for programmatic usage
 */
export declare function rustleEngine(config: Partial<RustleConfig>): void;

/**
 * Dynamic content wrapper for runtime translations
 * Handles API-driven or dynamically generated content
 * Optimized for cost-effectiveness with caching support
 */
export declare function RustleGo({ children, fallback, className, cache }: RustleGoProps): JSX_2.Element;

export declare interface RustleGoProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
    cache?: boolean;
}

/**
 * Plugin interface for extending Rustle functionality
 */
export declare interface RustlePlugin {
    name: string;
    version?: string;
    onInit?(config: RustleConfig): void | Promise<void>;
    onDestroy?(): void | Promise<void>;
    beforeTranslate?(text: string, targetLocale: Locale, context?: any): string | Promise<string>;
    afterTranslate?(originalText: string, translatedText: string, targetLocale: Locale, context?: any): string | Promise<string>;
    onLocaleChange?(newLocale: Locale, oldLocale: Locale): void | Promise<void>;
    onError?(error: Error, context?: any): void | Promise<void>;
    onCacheHit?(key: string, value: string): void;
    onCacheMiss?(key: string): void;
    onCacheSet?(key: string, value: string): void;
    onDOMProcess?(element: Element): void | Promise<void>;
    beforeAPICall?(endpoint: string, data: any): any | Promise<any>;
    afterAPICall?(endpoint: string, data: any, response: any): any | Promise<any>;
}

/**
 * Server-side locale detection and management
 */
export declare class ServerLocaleManager {
    /**
     * Get locale from server-side sources (path, headers, cookies)
     */
    static getServerLocale(request?: {
        url?: string;
        pathname?: string;
        headers?: Record<string, string>;
        cookies?: Record<string, string>;
    }, supportedLocales?: Locale[]): Locale;
    /**
     * Set locale on server-side (for SSR)
     */
    static setServerLocale(locale: Locale, response?: {
        setHeader?: (name: string, value: string) => void;
        headers?: Record<string, string>;
    }): void;
}

/**
 * Set locale in cookie (browser only)
 */
export declare function setLocaleToCookie(locale: Locale, options?: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}): void;

declare interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
    clear(): void;
}

/**
 * Storage manager for caching translations
 */
declare class StorageManager_2 {
    private adapter;
    constructor(adapter?: StorageAdapter);
    private getDefaultAdapter;
    private getKey;
    /**
     * Cache locale data
     */
    cacheLocaleData(locale: Locale, data: LocaleData): void;
    /**
     * Get cached locale data
     */
    getCachedLocaleData(locale: Locale, maxAge?: number): LocaleData | null;
    /**
     * Cache a single translation
     */
    cacheTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, translation: string): void;
    /**
     * Get cached translation
     */
    getCachedTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, maxAge?: number): string | null;
    /**
     * Set cached translation
     */
    setCachedTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, translation: string): void;
    /**
     * Clear all cached data
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        totalItems: number;
        totalSize: number;
    };
}
export { StorageManager_2 as StorageManager }

/**
 * Advanced throttle function with leading/trailing edge options
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number, options?: ThrottleOptions): (...args: Parameters<T>) => void;

declare interface ThrottleOptions {
    leading?: boolean;
    trailing?: boolean;
}

/**
 * TranslatedHTML Component
 * Handles translation of HTML content for dangerouslySetInnerHTML
 * Extracts text nodes from HTML, translates them, and reconstructs the HTML
 */
export declare function TranslatedHTML({ html, tag: Tag, className, style, cache, fallback, ...props }: TranslatedHTMLProps_2): JSX_2.Element;

export declare interface TranslatedHTMLProps {
    html: string;
    tag?: keyof JSX.IntrinsicElements;
    className?: string;
    style?: React.CSSProperties;
    cache?: boolean;
    fallback?: string;
    [key: string]: any;
}

declare interface TranslatedHTMLProps_2 {
    html: string;
    tag?: keyof JSX.IntrinsicElements;
    className?: string;
    style?: default_2.CSSProperties;
    cache?: boolean;
    fallback?: string;
    [key: string]: any;
}

export declare type TranslationEntry = z.infer<typeof TranslationEntrySchema>;

declare const TranslationEntrySchema: z.ZodObject<{
    fingerprint: z.ZodString;
    source: z.ZodString;
    file: z.ZodString;
    loc: z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>;
    contentHash: z.ZodString;
    version: z.ZodNumber;
    translations: z.ZodRecord<z.ZodString, z.ZodString>;
    lastTranslatedAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    status: z.ZodEnum<["translated", "missing", "updated"]>;
}, "strip", z.ZodTypeAny, {
    status: "translated" | "missing" | "updated";
    fingerprint: string;
    source: string;
    file: string;
    loc: {
        start: number;
        end: number;
    };
    contentHash: string;
    version: number;
    translations: Record<string, string>;
    tags: string[];
    lastTranslatedAt?: string | undefined;
}, {
    status: "translated" | "missing" | "updated";
    fingerprint: string;
    source: string;
    file: string;
    loc: {
        start: number;
        end: number;
    };
    contentHash: string;
    version: number;
    translations: Record<string, string>;
    tags: string[];
    lastTranslatedAt?: string | undefined;
}>;

declare type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

declare const TranslationRequestSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        context: z.ZodOptional<z.ZodObject<{
            tags: z.ZodArray<z.ZodString, "many">;
            file: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            file: string;
            tags: string[];
        }, {
            file: string;
            tags: string[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }, {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }>, "many">;
    sourceLanguage: z.ZodString;
    targetLanguage: z.ZodString;
    model: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>>;
}, "strip", z.ZodTypeAny, {
    entries: {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }[];
    sourceLanguage: string;
    targetLanguage: string;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
}, {
    entries: {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }[];
    sourceLanguage: string;
    targetLanguage: string;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
}>;

declare type TranslationResponse = z.infer<typeof TranslationResponseSchema>;

declare const TranslationResponseSchema: z.ZodObject<{
    translations: z.ZodRecord<z.ZodString, z.ZodString>;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    translations: Record<string, string>;
    success: boolean;
    error?: string | undefined;
}, {
    translations: Record<string, string>;
    success: boolean;
    error?: string | undefined;
}>;

/**
 * Universal locale manager for both client and server
 */
export declare class UniversalLocaleManager {
    private static currentLocale;
    private static listeners;
    private static pathBasedRouting;
    private static supportedLocales;
    /**
     * Configure path-based routing
     */
    static configurePathBasedRouting(enabled: boolean, supportedLocales?: Locale[]): void;
    /**
     * Get current locale (works on both client and server)
     */
    static getCurrentLocale(): Locale;
    /**
     * Set current locale (works on both client and server)
     */
    static setCurrentLocale(locale: Locale, updatePath?: boolean): void;
    /**
     * Navigate to a path with locale
     */
    static navigateToLocalizedPath(path: string, locale?: Locale): void;
    /**
     * Subscribe to locale changes
     */
    static subscribe(listener: (locale: Locale) => void): () => void;
    /**
     * Initialize locale from server-side data
     */
    static initializeFromServer(serverLocale: Locale): void;
}

/**
 * React hook for path-based locale management
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     currentLocale,
 *     setLocale,
 *     navigateToLocalizedPath,
 *     getLocalizedPath,
 *     generateAlternateLinks
 *   } = usePathBasedLocale({
 *     enablePathRouting: true,
 *     supportedLocales: ['en', 'fr', 'es', 'de'],
 *     defaultLocale: 'en',
 *     includeDefaultLocaleInPath: false
 *   });
 *
 *   return (
 *     <div>
 *       <p>Current locale: {currentLocale}</p>
 *       <button onClick={() => setLocale('fr')}>
 *         Switch to French
 *       </button>
 *       <a href={getLocalizedPath('/about', 'es')}>
 *         About (Spanish)
 *       </a>
 *     </div>
 *   );
 * }
 * ```
 */
export declare function usePathBasedLocale(options?: UsePathBasedLocaleOptions): UsePathBasedLocaleReturn;

export declare interface UsePathBasedLocaleOptions {
    supportedLocales?: Locale[];
    defaultLocale?: Locale;
    enablePathRouting?: boolean;
    excludePaths?: string[];
    includeDefaultLocaleInPath?: boolean;
    onLocaleChange?: (locale: Locale) => void;
}

export declare interface UsePathBasedLocaleReturn {
    currentLocale: Locale;
    setLocale: (locale: Locale, updatePath?: boolean) => void;
    navigateToLocalizedPath: (path: string, locale?: Locale) => void;
    getLocalizedPath: (path: string, locale?: Locale) => string;
    removeLocaleFromPath: (path: string) => string;
    generateAlternateLinks: (baseUrl?: string) => Array<{
        locale: Locale;
        href: string;
        hreflang: string;
    }>;
    isPathBasedRoutingEnabled: boolean;
    supportedLocales: Locale[];
    pathWithoutLocale: string;
}

/**
 * Main hook for accessing Rustle functionality
 */
export declare function useRustle(): UseRustleReturn;

export declare interface UseRustleReturn {
    currentLocale: Locale;
    setLocale: (locale: Locale) => void;
    translate: (text: string, targetLocale?: Locale, options?: {
        cache?: boolean;
        context?: {
            tags?: string[];
            file?: string;
        };
    }) => Promise<string>;
    translateBatch?: (texts: Array<{
        id: string;
        text: string;
        context?: {
            tags?: string[];
            file?: string;
        };
    }>, targetLocale?: Locale, options?: {
        cache?: boolean;
        retryCount?: number;
        requestKey?: string;
    }) => Promise<Record<string, string>>;
    clearCache?: () => void;
    isLoading: boolean;
    error: string | null;
}

/**
 * Higher-order component for path-based locale management
 */
export declare function withPathBasedLocale<P extends object>(Component: default_2.ComponentType<P & UsePathBasedLocaleReturn>, options?: UsePathBasedLocaleOptions): {
    (props: P): default_2.ReactElement<P & UsePathBasedLocaleReturn, string | default_2.JSXElementConstructor<any>>;
    displayName: string;
};

export { }
