/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RustleBox } from '../components/RustleBox';
import { RustleGo } from '../components/RustleGo';
import { TranslatedHTML } from '../components/TranslatedHTML';
import { AutoTranslate } from '../components/AutoTranslate';

// Mock fetch
global.fetch = jest.fn();

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

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('Rustle Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        translations: {
          'test_1': 'Hola mundo',
          'test_2': 'Adiós mundo',
        }
      }),
    });
  });

  describe('RustleBox', () => {
    it('should render children correctly', () => {
      render(
        <RustleBox apiKey="test-key">
          <div>Hello World</div>
        </RustleBox>
      );
      
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should provide translation context to children', async () => {
      render(
        <RustleBox
          apiKey="test-key"
          sourceLanguage="en"
          targetLanguages={['es']}
          initialLocale="es"
          debug={true}
        >
          <div data-i18n-fingerprint="test_1">Hello World</div>
        </RustleBox>
      );

      // Wait for translation to be applied
      await waitFor(() => {
        console.log('Current DOM:', document.body.innerHTML);
        console.log('Fetch calls:', (fetch as jest.Mock).mock.calls);
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle locale switching', async () => {
      const TestComponent = () => {
        const [locale, setLocale] = React.useState<'en' | 'es'>('en');
        
        return (
          <RustleBox 
            apiKey="test-key" 
            sourceLanguage="en" 
            targetLanguages={['es']}
            initialLocale={locale}
          >
            <button onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}>
              Switch Language
            </button>
            <div data-i18n-fingerprint="test_1">Hello World</div>
          </RustleBox>
        );
      };

      render(<TestComponent />);
      
      const button = screen.getByText('Switch Language');
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      });
    });

    it('should respect data-i18n="false" attribute', () => {
      render(
        <RustleBox apiKey="test-key" initialLocale="es">
          <button data-i18n="false">Do not translate</button>
          <div data-i18n-fingerprint="test_1">Hello World</div>
        </RustleBox>
      );
      
      expect(screen.getByText('Do not translate')).toBeInTheDocument();
    });

    it('should handle SSR mode correctly', () => {
      render(
        <RustleBox 
          apiKey="test-key" 
          serverLocale="es"
          useVirtualDOM={false}
        >
          <div>Hello World</div>
        </RustleBox>
      );
      
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });

  describe('RustleGo', () => {
    const RustleGoWrapper = ({ children, ...props }: any) => (
      <RustleBox apiKey="test-key" sourceLanguage="en" targetLanguages={['es']}>
        <RustleGo {...props}>{children}</RustleGo>
      </RustleBox>
    );

    it('should translate dynamic content', async () => {
      render(
        <RustleGoWrapper>
          Hello World
        </RustleGoWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      });
    });

    it('should handle cache prop correctly', async () => {
      render(
        <RustleGoWrapper cache={true}>
          Hello World
        </RustleGoWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      });
      
      // Second render should use cache
      render(
        <RustleGoWrapper cache={true}>
          Hello World
        </RustleGoWrapper>
      );
      
      expect(fetch).toHaveBeenCalledTimes(1); // Only one API call due to caching
    });

    it('should handle catch prop for error boundaries', () => {
      const ErrorComponent = () => {
        throw new Error('Test error');
      };

      render(
        <RustleGoWrapper catch={true}>
          <ErrorComponent />
        </RustleGoWrapper>
      );
      
      // Should not crash the app
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should batch multiple translations', async () => {
      render(
        <RustleGoWrapper>
          <div>Hello</div>
          <div>World</div>
          <div>Test</div>
        </RustleGoWrapper>
      );
      
      // Wait for batching timeout
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      }, { timeout: 100 });
    });
  });

  describe('TranslatedHTML', () => {
    const TranslatedHTMLWrapper = ({ children, ...props }: any) => (
      <RustleBox apiKey="test-key" sourceLanguage="en" targetLanguages={['es']}>
        <TranslatedHTML {...props}>{children}</TranslatedHTML>
      </RustleBox>
    );

    it('should translate HTML content', async () => {
      const htmlContent = '<p>Hello World</p><span>Goodbye World</span>';
      
      render(
        <TranslatedHTMLWrapper 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
        expect(screen.getByText('Adiós mundo')).toBeInTheDocument();
      });
    });

    it('should preserve HTML structure', async () => {
      const htmlContent = '<div class="test"><p>Hello World</p></div>';
      
      render(
        <TranslatedHTMLWrapper 
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
      
      await waitFor(() => {
        const div = screen.getByText('Hola mundo').closest('div');
        expect(div).toHaveClass('test');
      });
    });

    it('should handle malformed HTML gracefully', async () => {
      const malformedHTML = '<p>Hello <span>World</p>';
      
      render(
        <TranslatedHTMLWrapper 
          dangerouslySetInnerHTML={{ __html: malformedHTML }}
        />
      );
      
      // Should not crash
      await waitFor(() => {
        expect(screen.getByText(/Hello/)).toBeInTheDocument();
      });
    });

    it('should cache translated HTML', async () => {
      const htmlContent = '<p>Hello World</p>';
      
      // First render
      const { rerender } = render(
        <TranslatedHTMLWrapper 
          cache={true}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      });
      
      // Second render should use cache
      rerender(
        <TranslatedHTMLWrapper 
          cache={true}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      );
      
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('AutoTranslate', () => {
    const AutoTranslateWrapper = ({ children, ...props }: any) => (
      <RustleBox apiKey="test-key" sourceLanguage="en" targetLanguages={['es']}>
        <AutoTranslate {...props}>{children}</AutoTranslate>
      </RustleBox>
    );

    it('should translate text content using Virtual DOM', async () => {
      render(
        <AutoTranslateWrapper>
          <div data-i18n-fingerprint="test_1">Hello World</div>
        </AutoTranslateWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
      });
    });

    it('should preserve React component structure', async () => {
      const TestComponent = ({ children }: { children: React.ReactNode }) => (
        <div className="test-component">{children}</div>
      );

      render(
        <AutoTranslateWrapper>
          <TestComponent>
            <span data-i18n-fingerprint="test_1">Hello World</span>
          </TestComponent>
        </AutoTranslateWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
        expect(screen.getByText('Hola mundo').closest('.test-component')).toBeInTheDocument();
      });
    });

    it('should handle nested components correctly', async () => {
      render(
        <AutoTranslateWrapper>
          <div>
            <p data-i18n-fingerprint="test_1">Hello World</p>
            <div>
              <span data-i18n-fingerprint="test_2">Goodbye World</span>
            </div>
          </div>
        </AutoTranslateWrapper>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
        expect(screen.getByText('Adiós mundo')).toBeInTheDocument();
      });
    });

    it('should skip translation for excluded elements', () => {
      render(
        <AutoTranslateWrapper>
          <div data-i18n="false">Do not translate</div>
          <div data-i18n-fingerprint="test_1">Hello World</div>
        </AutoTranslateWrapper>
      );
      
      expect(screen.getByText('Do not translate')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
      
      render(
        <RustleBox apiKey="test-key">
          <RustleGo>Hello World</RustleGo>
        </RustleBox>
      );
      
      // Should fallback to original text
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });

    it('should handle network timeouts', async () => {
      (fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );
      
      render(
        <RustleBox apiKey="test-key">
          <RustleGo>Hello World</RustleGo>
        </RustleBox>
      );
      
      await waitFor(() => {
        expect(screen.getByText('Hello World')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should not cause memory leaks', async () => {
      const { unmount } = render(
        <RustleBox apiKey="test-key">
          <RustleGo>Hello World</RustleGo>
        </RustleBox>
      );
      
      await waitFor(() => {
        expect(screen.getByText(/Hello/)).toBeInTheDocument();
      });
      
      // Unmount should clean up properly
      unmount();
      
      // Verify no lingering timers or observers
      expect(setTimeout).not.toHaveBeenCalled();
    });

    it('should handle rapid locale changes efficiently', async () => {
      const TestComponent = () => {
        const [locale, setLocale] = React.useState<'en' | 'es'>('en');
        
        React.useEffect(() => {
          const interval = setInterval(() => {
            setLocale(prev => prev === 'en' ? 'es' : 'en');
          }, 50);
          
          setTimeout(() => clearInterval(interval), 200);
          
          return () => clearInterval(interval);
        }, []);
        
        return (
          <RustleBox apiKey="test-key" initialLocale={locale}>
            <div data-i18n-fingerprint="test_1">Hello World</div>
          </RustleBox>
        );
      };

      render(<TestComponent />);
      
      // Should handle rapid changes without crashing
      await waitFor(() => {
        expect(screen.getByText(/Hello|Hola/)).toBeInTheDocument();
      }, { timeout: 300 });
    });
  });
});
