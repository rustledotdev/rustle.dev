import type { Locale, LocaleData } from '../types';

const STORAGE_PREFIX = 'rustle_';
const CACHE_VERSION = '1.0';

export interface CacheEntry {
  data: string;
  timestamp: number;
  version: string;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Memory storage adapter (fallback when localStorage is not available)
 */
class MemoryStorageAdapter implements StorageAdapter {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * Storage manager for caching translations
 */
export class StorageManager {
  private adapter: StorageAdapter;

  constructor(adapter?: StorageAdapter) {
    this.adapter = adapter || this.getDefaultAdapter();
  }

  private getDefaultAdapter(): StorageAdapter {
    try {
      // Test if localStorage is available
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        return localStorage;
      }
    } catch (error) {
      console.warn('localStorage not available, falling back to memory storage');
    }
    
    return new MemoryStorageAdapter();
  }

  private getKey(type: string, identifier: string): string {
    return `${STORAGE_PREFIX}${type}_${identifier}`;
  }

  /**
   * Cache locale data
   */
  cacheLocaleData(locale: Locale, data: LocaleData): void {
    try {
      const cacheEntry: CacheEntry = {
        data: JSON.stringify(data),
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      
      const key = this.getKey('locale', locale);
      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache locale data:', error);
    }
  }

  /**
   * Get cached locale data
   */
  getCachedLocaleData(locale: Locale, maxAge: number = 24 * 60 * 60 * 1000): LocaleData | null {
    try {
      const key = this.getKey('locale', locale);
      const cached = this.adapter.getItem(key);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheEntry.version !== CACHE_VERSION) {
        this.adapter.removeItem(key);
        return null;
      }
      
      // Check if cache is still valid
      if (Date.now() - cacheEntry.timestamp > maxAge) {
        this.adapter.removeItem(key);
        return null;
      }
      
      return JSON.parse(cacheEntry.data);
    } catch (error) {
      console.warn('Failed to get cached locale data:', error);
      return null;
    }
  }

  /**
   * Cache a single translation
   */
  cacheTranslation(
    text: string, 
    sourceLocale: Locale, 
    targetLocale: Locale, 
    translation: string
  ): void {
    try {
      const cacheEntry: CacheEntry = {
        data: translation,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };
      
      const key = this.getKey('translation', `${sourceLocale}_${targetLocale}_${text}`);
      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache translation:', error);
    }
  }

  /**
   * Get cached translation
   */
  getCachedTranslation(
    text: string, 
    sourceLocale: Locale, 
    targetLocale: Locale,
    maxAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): string | null {
    try {
      const key = this.getKey('translation', `${sourceLocale}_${targetLocale}_${text}`);
      const cached = this.adapter.getItem(key);
      
      if (!cached) return null;
      
      const cacheEntry: CacheEntry = JSON.parse(cached);
      
      // Check version compatibility
      if (cacheEntry.version !== CACHE_VERSION) {
        this.adapter.removeItem(key);
        return null;
      }
      
      // Check if cache is still valid
      if (Date.now() - cacheEntry.timestamp > maxAge) {
        this.adapter.removeItem(key);
        return null;
      }
      
      return cacheEntry.data;
    } catch (error) {
      console.warn('Failed to get cached translation:', error);
      return null;
    }
  }

  /**
   * Set cached translation
   */
  setCachedTranslation(
    text: string,
    sourceLocale: Locale,
    targetLocale: Locale,
    translation: string
  ): void {
    try {
      const key = this.getKey('translation', `${sourceLocale}_${targetLocale}_${text}`);
      const cacheEntry: CacheEntry = {
        data: translation,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };

      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn('Failed to cache translation:', error);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    try {
      if (this.adapter instanceof MemoryStorageAdapter) {
        this.adapter.clear();
      } else {
        // For localStorage, we need to remove only our keys
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key);
          }
        }
        keys.forEach(key => this.adapter.removeItem(key));
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { totalItems: number; totalSize: number } {
    let totalItems = 0;
    let totalSize = 0;

    try {
      if (this.adapter instanceof MemoryStorageAdapter) {
        // For memory storage, we can't easily calculate size
        return { totalItems: 0, totalSize: 0 };
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          totalItems++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error);
    }

    return { totalItems, totalSize };
  }
}

// Default storage manager instance
export const defaultStorageManager = new StorageManager();
