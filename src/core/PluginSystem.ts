'use client';

import type { RustleConfig, Locale } from '../types';

/**
 * Plugin interface for extending Rustle functionality
 */
export interface RustlePlugin {
  name: string;
  version?: string;
  
  // Lifecycle hooks
  onInit?(config: RustleConfig): void | Promise<void>;
  onDestroy?(): void | Promise<void>;
  
  // Translation hooks
  beforeTranslate?(text: string, targetLocale: Locale, context?: any): string | Promise<string>;
  afterTranslate?(originalText: string, translatedText: string, targetLocale: Locale, context?: any): string | Promise<string>;
  
  // Locale hooks
  onLocaleChange?(newLocale: Locale, oldLocale: Locale): void | Promise<void>;
  
  // Error hooks
  onError?(error: Error, context?: any): void | Promise<void>;
  
  // Cache hooks
  onCacheHit?(key: string, value: string): void;
  onCacheMiss?(key: string): void;
  onCacheSet?(key: string, value: string): void;
  
  // DOM hooks (for client-side plugins)
  onDOMProcess?(element: Element): void | Promise<void>;
  
  // API hooks
  beforeAPICall?(endpoint: string, data: any): any | Promise<any>;
  afterAPICall?(endpoint: string, data: any, response: any): any | Promise<any>;
}

/**
 * Plugin manager for handling plugin registration and execution
 */
export class PluginManager {
  private plugins: Map<string, RustlePlugin> = new Map();
  private config: RustleConfig | null = null;

  /**
   * Register a plugin
   */
  use(plugin: RustlePlugin): this {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered. Overwriting...`);
    }
    
    this.plugins.set(plugin.name, plugin);
    
    // If already initialized, call plugin's onInit
    if (this.config && plugin.onInit) {
      try {
        const result = plugin.onInit(this.config);
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Plugin "${plugin.name}" initialization failed:`, error);
          });
        }
      } catch (error) {
        console.error(`Plugin "${plugin.name}" initialization failed:`, error);
      }
    }
    
    return this;
  }

  /**
   * Unregister a plugin
   */
  unuse(pluginName: string): boolean {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }

    // Call plugin's onDestroy if it exists
    if (plugin.onDestroy) {
      try {
        const result = plugin.onDestroy();
        if (result instanceof Promise) {
          result.catch(error => {
            console.error(`Plugin "${pluginName}" cleanup failed:`, error);
          });
        }
      } catch (error) {
        console.error(`Plugin "${pluginName}" cleanup failed:`, error);
      }
    }

    return this.plugins.delete(pluginName);
  }

  /**
   * Get a registered plugin
   */
  getPlugin(name: string): RustlePlugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): RustlePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Initialize all plugins
   */
  async init(config: RustleConfig): Promise<void> {
    this.config = config;
    
    const initPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.onInit) {
        try {
          await plugin.onInit(config);
        } catch (error) {
          console.error(`Plugin "${plugin.name}" initialization failed:`, error);
        }
      }
    });

    await Promise.all(initPromises);
  }

  /**
   * Destroy all plugins
   */
  async destroy(): Promise<void> {
    const destroyPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.onDestroy) {
        try {
          await plugin.onDestroy();
        } catch (error) {
          console.error(`Plugin "${plugin.name}" cleanup failed:`, error);
        }
      }
    });

    await Promise.all(destroyPromises);
    this.plugins.clear();
    this.config = null;
  }

  /**
   * Execute hook for all plugins
   */
  async executeHook(
    hookName: keyof RustlePlugin,
    ...args: any[]
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await (hook as any).apply(plugin, args);
          results.push(result);
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          // Execute error hook if available
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Execute hook and return the first non-undefined result
   */
  async executeHookFirst(
    hookName: keyof RustlePlugin,
    ...args: any[]
  ): Promise<any> {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await (hook as any).apply(plugin, args);
          if (result !== undefined) {
            return result;
          }
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    
    return undefined;
  }

  /**
   * Execute hook and chain the results (useful for text transformations)
   */
  async executeHookChain(
    hookName: keyof RustlePlugin,
    initialValue: any,
    ...args: any[]
  ): Promise<any> {
    let currentValue = initialValue;
    
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        try {
          const result = await (hook as any).apply(plugin, [currentValue, ...args.slice(1)]);
          if (result !== undefined) {
            currentValue = result;
          }
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args: [currentValue, ...args.slice(1)] });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    
    return currentValue;
  }
}

/**
 * Built-in plugins
 */

/**
 * Debug plugin for logging translation activities
 */
export const debugPlugin: RustlePlugin = {
  name: 'debug',
  version: '1.0.0',
  
  onInit(config) {
    if (config.debug) {
      console.log('🔧 Debug plugin initialized');
    }
  },
  
  beforeTranslate(text, targetLocale) {
    console.log(`🔄 Translating "${text}" to ${targetLocale}`);
    return text;
  },
  
  afterTranslate(originalText, translatedText, targetLocale) {
    console.log(`✅ Translated "${originalText}" → "${translatedText}" (${targetLocale})`);
    return translatedText;
  },
  
  onLocaleChange(newLocale, oldLocale) {
    console.log(`🌐 Locale changed: ${oldLocale} → ${newLocale}`);
  },
  
  onError(error, context) {
    console.error('❌ Translation error:', error, context);
  },
  
  onCacheHit(key, value) {
    console.log(`💾 Cache hit: ${key} → ${value}`);
  },
  
  onCacheMiss(key) {
    console.log(`💾 Cache miss: ${key}`);
  }
};

/**
 * Performance monitoring plugin
 */
export const performancePlugin: RustlePlugin & {
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
} = {
  name: 'performance',
  version: '1.0.0',

  private: {
    startTimes: new Map<string, number>(),
    stats: {
      translations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalTime: 0
    }
  },
  
  onInit() {
    console.log('📊 Performance monitoring enabled');
  },
  
  beforeTranslate(text) {
    const key = `translate_${Date.now()}_${Math.random()}`;
    (this as any).private.startTimes.set(text, performance.now());
    return text;
  },
  
  afterTranslate(originalText, translatedText) {
    const startTime = (this as any).private.startTimes.get(originalText);
    if (startTime) {
      const duration = performance.now() - startTime;
      (this as any).private.stats.totalTime += duration;
      (this as any).private.stats.translations++;
      (this as any).private.startTimes.delete(originalText);
    }
    return translatedText;
  },
  
  onCacheHit() {
    (this as any).private.stats.cacheHits++;
  },
  
  onCacheMiss() {
    (this as any).private.stats.cacheMisses++;
  },
  
  onError() {
    (this as any).private.stats.errors++;
  },
  
  onDestroy() {
    const stats = (this as any).private.stats;
    console.log('📊 Performance Stats:', {
      translations: stats.translations,
      averageTime: stats.translations > 0 ? (stats.totalTime / stats.translations).toFixed(2) + 'ms' : '0ms',
      cacheHitRate: stats.cacheHits + stats.cacheMisses > 0 ? 
        ((stats.cacheHits / (stats.cacheHits + stats.cacheMisses)) * 100).toFixed(1) + '%' : '0%',
      errors: stats.errors
    });
  }
};
