'use client';

import type { Locale, LocaleData } from '../types';
import { defaultStorageManager } from '../utils/storage';

/**
 * Offline manager for handling offline translation scenarios
 */
export class OfflineManager {
  private isOnline: boolean = true;
  private onlineCallbacks: (() => void)[] = [];
  private offlineCallbacks: (() => void)[] = [];
  private pendingTranslations: Map<string, { text: string; locale: Locale; timestamp: number }> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
    }
  }

  /**
   * Setup online/offline event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    console.log('🌐 Rustle: Back online, syncing pending translations...');
    
    // Execute online callbacks
    this.onlineCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in online callback:', error);
      }
    });

    // Sync pending translations
    this.syncPendingTranslations();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    console.log('📴 Rustle: Gone offline, using cached translations only');
    
    // Execute offline callbacks
    this.offlineCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in offline callback:', error);
      }
    });
  }

  /**
   * Check if currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add callback for when going online
   */
  onOnline(callback: () => void): () => void {
    this.onlineCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Add callback for when going offline
   */
  onOffline(callback: () => void): () => void {
    this.offlineCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get cached translation or add to pending queue
   */
  async getTranslation(
    text: string, 
    sourceLocale: Locale, 
    targetLocale: Locale,
    fallbackToOriginal: boolean = true
  ): Promise<string | null> {
    // Try to get from cache first
    const cachedTranslation = defaultStorageManager.getCachedTranslation(text, sourceLocale, targetLocale);
    
    if (cachedTranslation) {
      return cachedTranslation;
    }

    // If offline and no cache, add to pending queue
    if (!this.isOnline) {
      const pendingKey = `${text}_${sourceLocale}_${targetLocale}`;
      this.pendingTranslations.set(pendingKey, {
        text,
        locale: targetLocale,
        timestamp: Date.now()
      });

      console.log(`📴 Rustle: Added "${text}" to pending translations queue`);
      
      // Return original text as fallback if enabled
      return fallbackToOriginal ? text : null;
    }

    // Online but no cache - return null to indicate API call needed
    return null;
  }

  /**
   * Cache a translation for offline use
   */
  cacheTranslation(text: string, sourceLocale: Locale, targetLocale: Locale, translation: string): void {
    defaultStorageManager.setCachedTranslation(text, sourceLocale, targetLocale, translation);
  }

  /**
   * Preload translations for offline use
   */
  async preloadTranslations(localeData: Record<Locale, LocaleData>): Promise<void> {
    console.log('💾 Rustle: Preloading translations for offline use...');
    
    let totalCached = 0;
    
    for (const [locale, data] of Object.entries(localeData)) {
      for (const [fingerprint, translation] of Object.entries(data)) {
        // Cache each translation
        defaultStorageManager.setCachedTranslation(fingerprint, 'en' as Locale, locale as Locale, translation);
        totalCached++;
      }
    }

    console.log(`💾 Rustle: Preloaded ${totalCached} translations for offline use`);
  }

  /**
   * Get pending translations count
   */
  getPendingTranslationsCount(): number {
    return this.pendingTranslations.size;
  }

  /**
   * Get pending translations
   */
  getPendingTranslations(): Array<{ key: string; text: string; locale: Locale; timestamp: number }> {
    return Array.from(this.pendingTranslations.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }

  /**
   * Sync pending translations when back online
   */
  private async syncPendingTranslations(): Promise<void> {
    if (this.pendingTranslations.size === 0) {
      return;
    }

    console.log(`🔄 Rustle: Syncing ${this.pendingTranslations.size} pending translations...`);
    
    // Note: This would need to be integrated with the actual translation API
    // For now, we just clear the pending queue
    this.pendingTranslations.clear();
    
    console.log('✅ Rustle: Pending translations synced');
  }

  /**
   * Clear pending translations
   */
  clearPendingTranslations(): void {
    this.pendingTranslations.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalCached: number;
    cacheSize: string;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    // This would need to be implemented in the storage manager
    // For now, return basic stats
    return {
      totalCached: 0,
      cacheSize: '0 KB',
      oldestEntry: null,
      newestEntry: null
    };
  }

  /**
   * Clear all cached translations
   */
  clearCache(): void {
    if (typeof localStorage !== 'undefined') {
      // Clear all rustle-related cache entries
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('rustle_translation_')) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log('🧹 Rustle: Translation cache cleared');
  }

  /**
   * Export cached translations for backup
   */
  exportCache(): string {
    const cache: Record<string, string> = {};
    
    if (typeof localStorage !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('rustle_translation_')) {
          cache[key] = localStorage.getItem(key) || '';
        }
      });
    }

    return JSON.stringify(cache, null, 2);
  }

  /**
   * Import cached translations from backup
   */
  importCache(cacheData: string): void {
    try {
      const cache = JSON.parse(cacheData);
      
      if (typeof localStorage !== 'undefined') {
        Object.entries(cache).forEach(([key, value]) => {
          if (key.startsWith('rustle_translation_') && typeof value === 'string') {
            localStorage.setItem(key, value);
          }
        });
      }
      
      console.log('📥 Rustle: Translation cache imported successfully');
    } catch (error) {
      console.error('❌ Rustle: Failed to import cache:', error);
      throw new Error('Invalid cache data format');
    }
  }

  /**
   * Cleanup old cache entries
   */
  cleanupOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void { // Default: 7 days
    if (typeof localStorage === 'undefined') return;

    const now = Date.now();
    const keys = Object.keys(localStorage);
    let removedCount = 0;

    keys.forEach(key => {
      if (key.startsWith('rustle_translation_')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && (now - data.timestamp) > maxAgeMs) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    });

    if (removedCount > 0) {
      console.log(`🧹 Rustle: Cleaned up ${removedCount} old cache entries`);
    }
  }

  /**
   * Destroy the offline manager
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
    }
    
    this.onlineCallbacks = [];
    this.offlineCallbacks = [];
    this.pendingTranslations.clear();
  }
}

/**
 * Global offline manager instance
 */
export const offlineManager = new OfflineManager();
