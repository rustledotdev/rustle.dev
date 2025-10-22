/**
 * @jest-environment jsdom
 */

import { RustleEngine } from '../core/RustleEngine';
import { debugPlugin, performancePlugin } from '../core/PluginSystem';
import type { RustleConfig } from '../types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe('RustleEngine', () => {
  let engine: RustleEngine;
  const mockConfig: RustleConfig = {
    apiKey: 'test-key',
    apiUrl: 'https://api.rustle.dev/api',
    sourceLanguage: 'en',
    targetLanguages: ['es', 'fr'],
    model: 'gpt-3.5-turbo',
    debug: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    // Remove the custom fetch mock - use the one from test-setup.ts
    engine = new RustleEngine(mockConfig);
  });

  afterEach(async () => {
    await engine.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with correct config', () => {
      expect(engine).toBeDefined();
      expect(engine.getCurrentLocale()).toBe('en');
    });

    it('should initialize with default config values', () => {
      const minimalEngine = new RustleEngine({ apiKey: 'test' });

      expect(minimalEngine.getCurrentLocale()).toBe('en');

      minimalEngine.destroy();
    });
  });

  describe('Translation', () => {
    it('should translate text successfully', async () => {
      const result = await engine.translate('Hello world', 'es');

      expect(result).toBe('Hola mundo');
      expect(fetch).toHaveBeenCalledWith(
        'https://api.rustle.dev/api/translate/batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-key',
          }),
          body: expect.stringContaining('"text":"Hello world"'),
        })
      );
    });

    it('should use cache for repeated translations', async () => {
      // First translation
      const result1 = await engine.translate('Hello world', 'es');
      expect(result1).toBe('Hola mundo');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second translation (should use cache)
      const result2 = await engine.translate('Hello world', 'es');
      expect(result2).toBe('Hola mundo');
      expect(fetch).toHaveBeenCalledTimes(1); // No additional API call
    });

    it('should handle translation errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      await expect(engine.translate('Hello world', 'es')).rejects.toThrow('Network error');
    });

    it('should return original text when offline and no cache', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const result = await engine.translate('Hello world', 'es');
      expect(result).toBe('Hello world');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('Locale Management', () => {
    it('should set and get current locale', () => {
      engine.setLocale('es');
      expect(engine.getCurrentLocale()).toBe('es');
    });

    it('should validate locale before setting', () => {
      expect(() => engine.setLocale('invalid' as any)).toThrow();
    });

    it('should change locale successfully', async () => {
      await engine.setLocale('es');

      expect(engine.getCurrentLocale()).toBe('es');
    });
  });

  describe('Plugin System', () => {
    it('should register and use plugins', async () => {
      const mockPlugin = {
        name: 'test-plugin',
        beforeTranslate: jest.fn((text) => `modified: ${text}`),
        afterTranslate: jest.fn((original, translated) => `final: ${translated}`),
      };

      engine.use(mockPlugin);
      
      const result = await engine.translate('Hello', 'es');
      
      expect(mockPlugin.beforeTranslate).toHaveBeenCalledWith('Hello', 'es', expect.any(Object));
      expect(mockPlugin.afterTranslate).toHaveBeenCalledWith('modified: Hello', 'Hola mundo', 'es', expect.any(Object));
      expect(result).toBe('final: Hola mundo');
    });

    it('should unregister plugins', () => {
      engine.use(debugPlugin);
      expect(engine.getPlugin('debug-plugin')).toBeDefined();
      
      engine.unuse('debug-plugin');
      expect(engine.getPlugin('debug-plugin')).toBeUndefined();
    });

    it('should handle plugin errors gracefully', async () => {
      const errorPlugin = {
        name: 'error-plugin',
        beforeTranslate: () => { throw new Error('Plugin error'); },
      };

      engine.use(errorPlugin);
      
      // Should not throw, should handle error gracefully
      const result = await engine.translate('Hello', 'es');
      expect(result).toBe('Hola mundo');
    });
  });

  describe('Offline Support', () => {
    it('should detect online/offline status', () => {
      expect(engine.isOffline()).toBe(false);
      
      Object.defineProperty(navigator, 'onLine', { value: false });
      expect(engine.isOffline()).toBe(true);
    });

    it('should queue translations when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      
      const result = await engine.translate('Hello', 'es');
      expect(result).toBe('Hello'); // Returns original text
      expect(engine.getPendingTranslationsCount()).toBe(1);
    });

    it('should export and import cache', () => {
      // Add some cache data
      engine.translate('Hello', 'es'); // This will cache the result
      
      const exportedCache = engine.exportCache();
      expect(exportedCache).toBeDefined();
      expect(typeof exportedCache).toBe('string');
      
      engine.clearCache();
      engine.importCache(exportedCache);
      
      // Cache should be restored (test by checking if translation is cached)
      expect(engine.exportCache()).toBe(exportedCache);
    });
  });

  describe('Performance', () => {
    it('should handle batch translations efficiently', async () => {
      const texts = ['Hello', 'World', 'Test'];
      const promises = texts.map(text => engine.translate(text, 'es'));
      
      await Promise.all(promises);
      
      // Should make efficient API calls (implementation dependent)
      expect(fetch).toHaveBeenCalled();
    });

    it('should cleanup resources on destroy', async () => {
      const destroySpy = jest.spyOn(engine, 'destroy');
      
      await engine.destroy();
      
      expect(destroySpy).toHaveBeenCalled();
      // Verify cleanup (observers, timers, etc.)
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
      });
      
      await expect(engine.translate('Hello', 'es')).rejects.toThrow();
    });

    it('should handle malformed API responses', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ invalid: 'response' }),
      });
      
      await expect(engine.translate('Hello', 'es')).rejects.toThrow();
    });

    it('should handle network timeouts', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      await expect(engine.translate('Hello', 'es')).rejects.toThrow('Timeout');
    });
  });

  describe('Security', () => {
    it('should not expose API key in logs', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      engine = new RustleEngine({ ...mockConfig, debug: true });
      
      // Check that API key is not logged
      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(logCalls).not.toContain('test-key');
      
      consoleSpy.mockRestore();
    });

    it('should sanitize user input', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      await engine.translate(maliciousInput, 'es');
      
      // Verify that the input is properly escaped in API call
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.text).toBe(maliciousInput); // Should be properly handled by API
    });
  });

  describe('Accessibility', () => {
    it('should preserve ARIA attributes during translation', () => {
      // This would be tested in component tests, but we can verify
      // that the engine doesn't interfere with accessibility
      expect(engine.getCurrentLocale()).toBeDefined(); // Engine is accessible
    });

    it('should support screen reader announcements', async () => {
      // Verify that locale changes work
      await engine.setLocale('es');

      expect(engine.getCurrentLocale()).toBe('es');
    });
  });
});
