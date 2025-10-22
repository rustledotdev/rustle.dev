'use client';

import React from 'react';

/**
 * Lazy loading utilities for optimizing bundle size
 */

/**
 * Lazy load a module only when needed
 */
export function lazyImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): () => Promise<T> {
  let cached: T | null = null;
  let loading: Promise<T> | null = null;

  return async (): Promise<T> => {
    if (cached) {
      return cached;
    }

    if (loading) {
      return loading;
    }

    loading = importFn().then(module => {
      cached = module;
      loading = null;
      return module;
    }).catch(error => {
      loading = null;
      console.warn('Failed to lazy load module:', error);
      if (fallback) {
        cached = fallback;
        return fallback;
      }
      throw error;
    });

    return loading;
  };
}

/**
 * Lazy load a React component
 */
export function lazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T } | T>,
  fallback?: React.ComponentType<any>
): React.LazyExoticComponent<T> {
  if (typeof React === 'undefined') {
    // Server-side or non-React environment
    throw new Error('lazyComponent can only be used in React environment');
  }

  return React.lazy(async () => {
    try {
      const module = await importFn();
      
      // Handle both default and named exports
      if ('default' in module) {
        return { default: module.default };
      } else {
        return { default: module as T };
      }
    } catch (error) {
      console.warn('Failed to lazy load component:', error);
      if (fallback) {
        return { default: fallback as T };
      }
      throw error;
    }
  });
}

/**
 * Conditionally load a module based on environment
 */
export function conditionalImport<T>(
  condition: boolean | (() => boolean),
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  const shouldLoad = typeof condition === 'function' ? condition() : condition;
  
  if (!shouldLoad) {
    return Promise.resolve(fallback);
  }

  return importFn().catch(error => {
    console.warn('Failed to conditionally load module:', error);
    return fallback;
  });
}

/**
 * Load module only in browser environment
 */
export function browserOnlyImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return conditionalImport(
    typeof window !== 'undefined',
    importFn,
    fallback
  );
}

/**
 * Load module only in Node.js environment
 */
export function nodeOnlyImport<T>(
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  return conditionalImport(
    typeof window === 'undefined' && typeof process !== 'undefined',
    importFn,
    fallback
  );
}

/**
 * Preload a module for better performance
 */
export function preloadModule<T>(
  importFn: () => Promise<T>,
  delay: number = 0
): void {
  if (delay > 0) {
    setTimeout(() => {
      importFn().catch(() => {
        // Ignore preload errors
      });
    }, delay);
  } else {
    importFn().catch(() => {
      // Ignore preload errors
    });
  }
}

/**
 * Create a module cache for frequently used imports
 */
export class ModuleCache {
  private cache = new Map<string, any>();
  private loading = new Map<string, Promise<any>>();

  async get<T>(
    key: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    if (this.loading.has(key)) {
      return this.loading.get(key);
    }

    const promise = importFn().then(module => {
      this.cache.set(key, module);
      this.loading.delete(key);
      return module;
    }).catch(error => {
      this.loading.delete(key);
      throw error;
    });

    this.loading.set(key, promise);
    return promise;
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
    this.loading.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Global module cache instance
 */
export const moduleCache = new ModuleCache();

/**
 * Utility to check if a feature is supported before loading
 */
export function featureSupported(feature: string): boolean {
  switch (feature) {
    case 'intersectionObserver':
      return typeof IntersectionObserver !== 'undefined';
    case 'mutationObserver':
      return typeof MutationObserver !== 'undefined';
    case 'localStorage':
      try {
        return typeof localStorage !== 'undefined' && localStorage !== null;
      } catch {
        return false;
      }
    case 'webWorkers':
      return typeof Worker !== 'undefined';
    case 'serviceWorker':
      return 'serviceWorker' in navigator;
    case 'indexedDB':
      return 'indexedDB' in window;
    default:
      return false;
  }
}

/**
 * Load polyfills only when needed
 */
export async function loadPolyfillIfNeeded(
  feature: string,
  polyfillImport: () => Promise<any>
): Promise<void> {
  if (!featureSupported(feature)) {
    try {
      await polyfillImport();
      console.log(`Loaded polyfill for ${feature}`);
    } catch (error) {
      console.warn(`Failed to load polyfill for ${feature}:`, error);
    }
  }
}

/**
 * Bundle size optimization utilities
 */
export const bundleOptimization = {
  /**
   * Tree-shake unused exports by importing only what's needed
   */
  selectiveImport: <T extends Record<string, any>>(
    module: T,
    keys: (keyof T)[]
  ): Partial<T> => {
    const result: Partial<T> = {};
    keys.forEach(key => {
      if (key in module) {
        result[key] = module[key];
      }
    });
    return result;
  },

  /**
   * Defer non-critical imports
   */
  deferImport: <T>(
    importFn: () => Promise<T>,
    timeout: number = 100
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        importFn().then(resolve).catch(reject);
      }, timeout);
    });
  },

  /**
   * Load modules in chunks to avoid blocking
   */
  chunkLoad: async <T>(
    imports: (() => Promise<T>)[],
    chunkSize: number = 3
  ): Promise<T[]> => {
    const results: T[] = [];
    
    for (let i = 0; i < imports.length; i += chunkSize) {
      const chunk = imports.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(importFn => importFn())
      );
      results.push(...chunkResults);
      
      // Small delay between chunks to avoid blocking
      if (i + chunkSize < imports.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
};
