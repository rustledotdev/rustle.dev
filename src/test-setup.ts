import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.sessionStorage = sessionStorageMock as any;

// Mock fetch with comprehensive responses
global.fetch = jest.fn((url: string, options?: any) => {
  const body = options?.body ? JSON.parse(options.body) : {};

  if (url.includes('/api/translate/batch')) {
    console.log('Mock: Batch API called with URL:', url);
    console.log('Mock: Request body:', body);

    // Parse the request body to get the entries
    const entries = body.entries || [];
    const translations: Record<string, string> = {};

    // Map of text to translations
    const textTranslations: Record<string, string> = {
      'Hello world': 'Hola mundo',
      'Hello': 'Hola',
      'World': 'Mundo',
      'Test': 'Prueba',
      'Goodbye World': 'Adiós mundo',
      '<p>Hello world</p><p>Goodbye world</p>': '<p>Hola mundo</p><p>Adiós mundo</p>',
      '<div class="test">Hello world</div>': '<div class="test">Hola mundo</div>',
      '<p>Hello <strong>world</strong>': '<p>Hola <strong>mundo</strong>',
      '<script>alert("xss")</script>': '<script>alert("xss")</script>'
    };

    // Generate translations for each entry
    entries.forEach((entry: any) => {
      const translatedText = textTranslations[entry.text] || entry.text;
      translations[entry.id] = translatedText;
      console.log(`Mock: Translating "${entry.text}" -> "${translatedText}" (id: ${entry.id})`);
    });

    // Add some default translations for fingerprint-based keys
    translations['test_1'] = 'Hola mundo';
    translations['test_2'] = 'Adiós mundo';
    translations['6aefe2c4'] = 'Hola mundo';
    translations['05e918d2'] = 'Hola';
    translations['06c11b92'] = 'Mundo';
    translations['00364492'] = 'Prueba';

    const response = {
      success: true,
      translations
    };
    console.log('Mock: Returning response:', response);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    });
  }

  if (url.includes('/api/translate/single')) {
    const text = body.text || 'Hello world';
    const translations: Record<string, string> = {
      'Hello world': 'Hola mundo',
      'Hello': 'Hola',
      'World': 'Mundo',
      'Test': 'Prueba',
      'Goodbye World': 'Adiós mundo',
      '<p>Hello world</p><p>Goodbye world</p>': '<p>Hola mundo</p><p>Adiós mundo</p>',
      '<div class="test">Hello world</div>': '<div class="test">Hola mundo</div>',
      '<p>Hello <strong>world</strong>': '<p>Hola <strong>mundo</strong>',
      '<script>alert("xss")</script>': '<script>alert("xss")</script>'
    };

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        translatedText: translations[text] || text
      }),
    });
  }

  if (url.includes('/rustle/locales/')) {
    console.log('Mock: Returning locale data for', url);
    const localeData = {
      'test_1': 'Hola mundo',
      'test_2': 'Adiós mundo',
      '6aefe2c4': 'Hola mundo',
      '05e918d2': 'Hola',
      '06c11b92': 'Mundo',
      '00364492': 'Prueba'
    };
    console.log('Mock: Locale data structure:', localeData);
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(localeData),
    });
  }

  if (url.includes('/rustle/master.json')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        'test_1': {
          originalText: 'Hello World',
          fingerprint: 'test_1',
          filePath: 'test.tsx',
          position: { line: 1, column: 1 }
        },
        'test_2': {
          originalText: 'Goodbye World',
          fingerprint: 'test_2',
          filePath: 'test.tsx',
          position: { line: 2, column: 1 }
        }
      }),
    });
  }

  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  });
}) as jest.Mock;

// Mock MutationObserver
global.MutationObserver = class MutationObserver {
  constructor(callback: MutationCallback) {}
  disconnect() {}
  observe(element: Element, initObject?: MutationObserverInit): void {}
  takeRecords(): MutationRecord[] {
    return [];
  }
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock requestIdleCallback
global.requestIdleCallback = jest.fn((callback: IdleRequestCallback) => {
  return setTimeout(() => callback({
    didTimeout: false,
    timeRemaining: () => 50
  } as IdleDeadline), 0);
});

global.cancelIdleCallback = jest.fn((id: number) => {
  clearTimeout(id);
});

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

// Mock navigator.onLine (ensure we're online by default)
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Test cleanup
beforeEach(() => {
  jest.clearAllMocks();

  // Re-implement fetch mock after clearing
  global.fetch = jest.fn((url: string, options?: any) => {
    const body = options?.body ? JSON.parse(options.body) : {};

    if (url.includes('/api/translate/batch')) {
      const response = {
        success: true,
        translations: {
          'single': 'Hola mundo',
          'test_1': 'Hola mundo',
          'test_2': 'Adiós mundo',
          '6aefe2c4': 'Hola mundo',
          '05e918d2': 'Hola',
          '06c11b92': 'Mundo',
          '00364492': 'Prueba'
        }
      };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
      });
    }

    if (url.includes('/api/translate/single')) {
      const text = body.text || 'Hello world';
      const translations: Record<string, string> = {
        'Hello world': 'Hola mundo',
        'Hello': 'Hola',
        'World': 'Mundo',
        'Test': 'Prueba',
        'Goodbye World': 'Adiós mundo',
        '<p>Hello world</p><p>Goodbye world</p>': '<p>Hola mundo</p><p>Adiós mundo</p>',
        '<div class="test">Hello world</div>': '<div class="test">Hola mundo</div>',
        '<p>Hello <strong>world</strong>': '<p>Hola <strong>mundo</strong>',
        '<script>alert("xss")</script>': '<script>alert("xss")</script>'
      };

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          translatedText: translations[text] || text
        }),
      });
    }

    if (url.includes('/rustle/locales/')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          'test_1': 'Hola mundo',
          'test_2': 'Adiós mundo',
          '6aefe2c4': 'Hola mundo',
          '05e918d2': 'Hola',
          '06c11b92': 'Mundo',
          '00364492': 'Prueba'
        }),
      });
    }

    if (url.includes('/rustle/master.json')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          'test_1': {
            originalText: 'Hello World',
            fingerprint: 'test_1',
            filePath: 'test.tsx',
            position: { line: 1, column: 1 }
          },
          'test_2': {
            originalText: 'Goodbye World',
            fingerprint: 'test_2',
            filePath: 'test.tsx',
            position: { line: 2, column: 1 }
          }
        }),
      });
    }

    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
    });
  }) as jest.Mock;
});

// Suppress React act() warnings in tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: An update to')
  ) {
    return;
  }
  originalConsoleError(...args);
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  sessionStorageMock.getItem.mockClear();
  sessionStorageMock.setItem.mockClear();
  sessionStorageMock.removeItem.mockClear();
  sessionStorageMock.clear.mockClear();
  (global.fetch as jest.Mock).mockClear();
});
