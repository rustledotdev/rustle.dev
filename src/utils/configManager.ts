'use client';

import type { Locale, AIModel } from '../types';

/**
 * Runtime configuration for Rustle.dev SDK
 */
export interface RuntimeConfig {
  // API Configuration
  apiUrl?: string;
  apiKey?: string;
  
  // Translation Configuration
  sourceLanguage?: Locale;
  targetLanguages?: Locale[];
  defaultModel?: AIModel;
  
  // Path Configuration
  localeBasePath?: string;
  
  // Feature Flags
  useVirtualDOM?: boolean;
  enableBatching?: boolean;
  enableCaching?: boolean;
  enableOffline?: boolean;
  
  // Performance Configuration
  batchTimeout?: number;
  maxRetries?: number;
  cacheTimeout?: number;
  
  // Security Configuration
  obfuscateRequests?: boolean;
  enableCSP?: boolean;
  
  // Debug Configuration
  debug?: boolean;
  enableMetrics?: boolean;
}

/**
 * Configuration manager for Rustle.dev SDK
 */
export class ConfigManager {
  private static instance: ConfigManager;
  private config: RuntimeConfig = {};

  private constructor() {
    this.loadConfiguration();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Load configuration from multiple sources
   */
  private loadConfiguration(): void {
    // 1. Load from environment variables (Node.js/SSR)
    if (typeof process !== 'undefined' && process.env) {
      this.config = {
        ...this.config,
        apiUrl: process.env.RUSTLE_API_URL || process.env.NEXT_PUBLIC_RUSTLE_API_URL,
        apiKey: process.env.RUSTLE_API_KEY,
        sourceLanguage: (process.env.RUSTLE_SOURCE_LANGUAGE as Locale) || 'en',
        localeBasePath: process.env.RUSTLE_LOCALE_PATH || '/rustle/locales',
        debug: process.env.RUSTLE_DEBUG === 'true',
        useVirtualDOM: process.env.RUSTLE_USE_VIRTUAL_DOM !== 'false',
        enableBatching: process.env.RUSTLE_ENABLE_BATCHING !== 'false',
        enableCaching: process.env.RUSTLE_ENABLE_CACHING !== 'false',
        enableOffline: process.env.RUSTLE_ENABLE_OFFLINE === 'true',
        batchTimeout: parseInt(process.env.RUSTLE_BATCH_TIMEOUT || '50'),
        maxRetries: parseInt(process.env.RUSTLE_MAX_RETRIES || '3'),
        cacheTimeout: parseInt(process.env.RUSTLE_CACHE_TIMEOUT || '86400000'), // 24 hours
      };
    }

    // 2. Load from window global config (client-side)
    if (typeof window !== 'undefined') {
      const globalConfig = (window as any).__RUSTLE_CONFIG__;
      if (globalConfig) {
        this.config = { ...this.config, ...globalConfig };
      }
    }

    // 3. Apply defaults
    this.config = {
      apiUrl: 'https://api.rustle.dev/api',
      sourceLanguage: 'en',
      targetLanguages: ['es', 'fr', 'de', 'it', 'pt'],
      defaultModel: 'gpt-3.5-turbo',
      localeBasePath: '/rustle/locales',
      useVirtualDOM: true,
      enableBatching: true,
      enableCaching: true,
      enableOffline: false,
      batchTimeout: 50,
      maxRetries: 3,
      cacheTimeout: 86400000, // 24 hours
      obfuscateRequests: false,
      enableCSP: true,
      debug: false,
      enableMetrics: false,
      ...this.config,
    };
  }

  /**
   * Get configuration value
   */
  get<K extends keyof RuntimeConfig>(key: K): RuntimeConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  set<K extends keyof RuntimeConfig>(key: K, value: RuntimeConfig[K]): void {
    this.config[key] = value;
  }

  /**
   * Update multiple configuration values
   */
  update(updates: Partial<RuntimeConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get all configuration
   */
  getAll(): RuntimeConfig {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.config = {};
    this.loadConfiguration();
  }

  /**
   * Validate configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate API key
    if (!this.config.apiKey) {
      errors.push('API key is required');
    }

    // Validate API URL
    if (!this.config.apiUrl) {
      errors.push('API URL is required');
    } else {
      try {
        new URL(this.config.apiUrl);
      } catch {
        errors.push('Invalid API URL format');
      }
    }

    // Validate source language
    if (!this.config.sourceLanguage) {
      errors.push('Source language is required');
    }

    // Validate target languages
    if (!this.config.targetLanguages || this.config.targetLanguages.length === 0) {
      errors.push('At least one target language is required');
    }

    // Validate locale base path
    if (!this.config.localeBasePath) {
      errors.push('Locale base path is required');
    }

    // Validate numeric values
    if (this.config.batchTimeout && this.config.batchTimeout < 0) {
      errors.push('Batch timeout must be non-negative');
    }

    if (this.config.maxRetries && this.config.maxRetries < 0) {
      errors.push('Max retries must be non-negative');
    }

    if (this.config.cacheTimeout && this.config.cacheTimeout < 0) {
      errors.push('Cache timeout must be non-negative');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Global configuration instance
 */
export const globalConfig = ConfigManager.getInstance();

/**
 * Helper functions for common configuration tasks
 */
export const configHelpers = {
  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return globalConfig.get('debug') === true || 
           (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
  },

  /**
   * Check if we're in production mode
   */
  isProduction(): boolean {
    return !this.isDevelopment();
  },

  /**
   * Get the best available AI model
   */
  getBestModel(): AIModel {
    const model = globalConfig.get('defaultModel');
    return model || 'gpt-3.5-turbo';
  },

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof RuntimeConfig): boolean {
    return globalConfig.get(feature) === true;
  },

  /**
   * Get locale file path
   */
  getLocalePath(locale: Locale): string {
    const basePath = globalConfig.get('localeBasePath') || '/rustle/locales';
    return `${basePath}/${locale}.json`;
  },

  /**
   * Get master file path
   */
  getMasterPath(): string {
    const basePath = globalConfig.get('localeBasePath') || '/rustle/locales';
    return `${basePath}/master.json`;
  },

  /**
   * Setup configuration for different environments
   */
  setupEnvironment(env: 'development' | 'staging' | 'production'): void {
    switch (env) {
      case 'development':
        globalConfig.update({
          debug: true,
          enableMetrics: true,
          obfuscateRequests: false,
        });
        break;
      case 'staging':
        globalConfig.update({
          debug: false,
          enableMetrics: true,
          obfuscateRequests: true,
        });
        break;
      case 'production':
        globalConfig.update({
          debug: false,
          enableMetrics: false,
          obfuscateRequests: true,
        });
        break;
    }
  },
};
