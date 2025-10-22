import type { NextConfig } from 'next';
import type { RustleConfig } from './types';
import { RustleConfigSchema } from './types';
import React from 'react';

/**
 * Next.js plugin configuration
 */
export interface RustleNextConfig extends Partial<RustleConfig> {
  // Additional Next.js specific options
  extractOnBuild?: boolean;
  translateOnBuild?: boolean;
  outputDir?: string;
}

/**
 * Create a Next.js plugin for Rustle
 */
export function rustleEngine(rustleConfig: RustleNextConfig) {
  return function withRustle(nextConfig: NextConfig = {}): NextConfig {
    // Validate Rustle config
    const validatedConfig = RustleConfigSchema.partial().parse(rustleConfig);

    if (validatedConfig.debug) {
      console.log('Rustle Next.js Plugin: Initialized with config:', validatedConfig);
    }

    return {
      ...nextConfig,
      
      // Extend webpack configuration
      webpack: (config: any, context: any) => {
        // Add Rustle webpack plugin if needed
        if (!validatedConfig.deactivate) {
          // In a full implementation, we would add custom webpack plugins here
          // For now, we'll just log that the plugin is active
          if (validatedConfig.debug && !context.dev) {
            console.log('Rustle Next.js Plugin: Webpack configuration extended');
          }
        }

        // Call the original webpack function if it exists
        if (typeof nextConfig.webpack === 'function') {
          return nextConfig.webpack(config, context);
        }

        return config;
      },

      // Extend environment variables
      env: {
        ...nextConfig.env,
        RUSTLE_CONFIG: JSON.stringify(validatedConfig),
      },

      // Add experimental features if needed
      experimental: {
        ...nextConfig.experimental,
        // Add any experimental features needed for Rustle
      },
    };
  };
}

/**
 * Server-side helper to get locale from request
 */
export function getServerSideLocale(req: any): string | null {
  // Try to get locale from cookie
  const cookies = req.headers.cookie || '';
  const match = cookies.match(/rustle-locale=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Server-side helper to load locale data
 */
export async function loadServerSideLocaleData(locale: string): Promise<Record<string, string> | null> {
  try {
    // In a real implementation, this would load from the file system
    // For now, we'll return null to indicate no static data available
    return null;
  } catch (error) {
    console.warn(`Failed to load server-side locale data for ${locale}:`, error);
    return null;
  }
}

/**
 * App Router helper component for server-side rendering
 */
export function RustleServerProvider({
  children,
  locale,
  localeData
}: {
  children: React.ReactNode;
  locale?: string;
  localeData?: Record<string, string>;
}) {
  // This would be used in Next.js App Router layouts
  // to provide server-side rendered translations
  return React.createElement(React.Fragment, null, children);
}

/**
 * Pages Router helper for getServerSideProps
 */
export async function getRustleServerSideProps(context: any) {
  const locale = getServerSideLocale(context.req);
  const localeData = locale ? await loadServerSideLocaleData(locale) : null;

  return {
    props: {
      rustleLocale: locale,
      rustleLocaleData: localeData,
    },
  };
}

/**
 * Pages Router helper for getStaticProps
 */
export async function getRustleStaticProps(locale: string) {
  const localeData = await loadServerSideLocaleData(locale);

  return {
    props: {
      rustleLocale: locale,
      rustleLocaleData: localeData,
    },
  };
}

// Re-export server utilities
export * from './server';

// SEO and metadata helpers
export {
  generateTranslatedMetadata,
  generateAlternateLanguages,
  generateHreflangLinks,
  generateSEOMetadata,
  generatePageMetadata,
} from './next/metadata';

// Server-side translation components
export {
  ServerTranslate,
  translateServerText,
  translateServerTexts,
  ServerTranslateWrapper,
  TranslatedPage,
  generateTranslationScript,
} from './next/ServerTranslate';

// Path-based locale routing
export {
  createPathBasedMiddleware,
  getLocaleFromNextRequest,
  generateStaticPathsForLocales,
  extractLocaleFromParams,
  createLocaleAwareGetStaticProps,
  type NextPathBasedMiddlewareConfig
} from './next/pathBasedMiddleware';
