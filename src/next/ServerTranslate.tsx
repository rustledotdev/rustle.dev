import { ReactNode } from 'react';
import { loadServerLocaleData, getServerLocale } from '../server';
import type { Locale } from '../types';

interface ServerTranslateProps {
  children: ReactNode;
  text?: string;
  locale?: Locale;
  localeBasePath?: string;
  fallback?: boolean;
  tag?: keyof JSX.IntrinsicElements;
  className?: string;
  [key: string]: any;
}

/**
 * Server-side translation component for Next.js
 * Renders translated content directly in the HTML for SEO
 */
export async function ServerTranslate({
  children,
  text,
  locale,
  localeBasePath = '/rustle/locales',
  fallback = true,
  tag: Tag = 'span',
  className,
  ...props
}: ServerTranslateProps) {
  const currentLocale = locale || getServerLocale(undefined, undefined);

  // Extract text to translate
  const textToTranslate = text || (typeof children === 'string' ? children : '');

  if (!textToTranslate) {
    return <Tag className={className} {...props}>{children}</Tag>;
  }

  try {
    // Load locale data for server-side translation
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });

    // Get translation
    const translation = localeData?.[textToTranslate];
    const finalText = translation || (fallback ? textToTranslate : '');

    return (
      <Tag 
        className={className}
        data-i18n="true"
        data-i18n-source={textToTranslate}
        data-i18n-translated="true"
        data-i18n-locale={currentLocale}
        {...props}
      >
        {finalText}
      </Tag>
    );
  } catch (error) {
    console.error('ServerTranslate error:', error);
    
    // Fallback to original text
    return (
      <Tag 
        className={className}
        data-i18n="true"
        data-i18n-source={textToTranslate}
        data-i18n-error="true"
        {...props}
      >
        {fallback ? textToTranslate : children}
      </Tag>
    );
  }
}

/**
 * Server-side translation for metadata and structured content
 */
export async function translateServerText(
  text: string,
  locale?: Locale,
  localeBasePath: string = '/rustle/locales',
  fallback: boolean = true
): Promise<string> {
  if (!text) return text;

  const currentLocale = locale || getServerLocale(undefined, undefined);

  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });
    const translation = localeData?.[text];

    return translation || (fallback ? text : '');
  } catch (error) {
    console.error('translateServerText error:', error);
    return fallback ? text : '';
  }
}

/**
 * Batch server-side translation for multiple texts
 */
export async function translateServerTexts(
  texts: string[],
  locale?: Locale,
  localeBasePath: string = '/rustle/locales',
  fallback: boolean = true
): Promise<Record<string, string>> {
  if (!texts.length) return {};

  const currentLocale = locale || getServerLocale(undefined, undefined);
  const result: Record<string, string> = {};

  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });

    texts.forEach(text => {
      const translation = localeData?.[text];
      result[text] = translation || (fallback ? text : '');
    });

    return result;
  } catch (error) {
    console.error('translateServerTexts error:', error);

    // Fallback to original texts
    texts.forEach(text => {
      result[text] = fallback ? text : '';
    });

    return result;
  }
}

/**
 * Server component wrapper that injects translations into HTML
 */
export async function ServerTranslateWrapper({
  children,
  locale,
  localeBasePath = '/rustle/locales',
}: {
  children: ReactNode;
  locale?: Locale;
  localeBasePath?: string;
}) {
  const currentLocale = locale || getServerLocale(undefined, undefined);

  try {
    // Pre-load locale data to ensure it's available
    await loadServerLocaleData(currentLocale, { localeBasePath });

    return (
      <div
        data-rustle-server="true"
        data-rustle-locale={currentLocale}
        data-rustle-locale-path={localeBasePath}
      >
        {children}
      </div>
    );
  } catch (error) {
    console.error('ServerTranslateWrapper error:', error);
    return <div>{children}</div>;
  }
}

/**
 * Generate server-side translation script for hydration
 */
export function generateTranslationScript(
  locale: Locale,
  localeData: Record<string, string>
): string {
  return `
    <script>
      window.__RUSTLE_LOCALE__ = ${JSON.stringify(locale)};
      window.__RUSTLE_TRANSLATIONS__ = ${JSON.stringify(localeData)};
      
      // Apply server translations to DOM elements
      document.addEventListener('DOMContentLoaded', function() {
        const elements = document.querySelectorAll('[data-i18n-translated="true"]');
        elements.forEach(function(element) {
          const source = element.getAttribute('data-i18n-source');
          const translation = window.__RUSTLE_TRANSLATIONS__[source];
          if (translation && element.textContent !== translation) {
            element.textContent = translation;
          }
        });
      });
    </script>
  `;
}

/**
 * Next.js page wrapper with server-side translation support
 */
export async function TranslatedPage({
  children,
  locale,
  localeBasePath = '/rustle/locales',
  injectScript = true,
}: {
  children: ReactNode;
  locale?: Locale;
  localeBasePath?: string;
  injectScript?: boolean;
}) {
  const currentLocale = locale || getServerLocale(undefined, undefined);

  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });

    return (
      <>
        <ServerTranslateWrapper locale={currentLocale} localeBasePath={localeBasePath}>
          {children}
        </ServerTranslateWrapper>
        {injectScript && localeData && (
          <div
            dangerouslySetInnerHTML={{
              __html: generateTranslationScript(currentLocale, localeData)
            }}
          />
        )}
      </>
    );
  } catch (error) {
    console.error('TranslatedPage error:', error);
    return <div>{children}</div>;
  }
}
