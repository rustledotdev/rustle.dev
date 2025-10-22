import type { Metadata } from 'next';
import { loadServerLocaleData, getServerLocale } from '../server';
import type { Locale } from '../types';

/**
 * Generate translated metadata for Next.js pages
 * Optimized for SEO with server-side translation
 */
export async function generateTranslatedMetadata(
  baseMetadata: {
    title?: string;
    description?: string;
    keywords?: string[];
    openGraph?: {
      title?: string;
      description?: string;
      siteName?: string;
    };
    twitter?: {
      title?: string;
      description?: string;
    };
  },
  options?: {
    locale?: Locale;
    localeBasePath?: string;
    fallback?: boolean;
  }
): Promise<Metadata> {
  const locale = options?.locale || getServerLocale(undefined, undefined);
  const localeBasePath = options?.localeBasePath || '/rustle/locales';
  const fallback = options?.fallback !== false;

  try {
    // Load locale data for server-side translation
    const localeData = await loadServerLocaleData(locale, { localeBasePath });

    // Helper function to translate text
    const translateText = (text: string): string => {
      if (!text) return text;

      // Check if translation exists in locale data
      const translation = localeData?.[text];
      if (translation) {
        return translation;
      }

      // Fallback to original text if translation not found
      return fallback ? text : '';
    };

    // Build translated metadata
    const metadata: Metadata = {};

    // Basic metadata
    if (baseMetadata.title) {
      metadata.title = translateText(baseMetadata.title);
    }

    if (baseMetadata.description) {
      metadata.description = translateText(baseMetadata.description);
    }

    if (baseMetadata.keywords) {
      metadata.keywords = baseMetadata.keywords.map(translateText);
    }

    // Open Graph metadata
    if (baseMetadata.openGraph) {
      metadata.openGraph = {};
      
      if (baseMetadata.openGraph.title) {
        metadata.openGraph.title = translateText(baseMetadata.openGraph.title);
      }
      
      if (baseMetadata.openGraph.description) {
        metadata.openGraph.description = translateText(baseMetadata.openGraph.description);
      }
      
      if (baseMetadata.openGraph.siteName) {
        metadata.openGraph.siteName = translateText(baseMetadata.openGraph.siteName);
      }

      // Add locale information
      metadata.openGraph.locale = locale;
    }

    // Twitter metadata
    if (baseMetadata.twitter) {
      metadata.twitter = {};
      
      if (baseMetadata.twitter.title) {
        metadata.twitter.title = translateText(baseMetadata.twitter.title);
      }
      
      if (baseMetadata.twitter.description) {
        metadata.twitter.description = translateText(baseMetadata.twitter.description);
      }
    }

    return metadata;
  } catch (error) {
    console.error('Failed to generate translated metadata:', error);
    
    // Return original metadata as fallback
    return {
      title: baseMetadata.title,
      description: baseMetadata.description,
      keywords: baseMetadata.keywords,
      openGraph: baseMetadata.openGraph,
      twitter: baseMetadata.twitter,
    };
  }
}

/**
 * Generate alternate language links for SEO
 */
export function generateAlternateLanguages(
  baseUrl: string,
  supportedLocales: Locale[],
  currentPath: string = ''
): Record<string, string> {
  const alternates: Record<string, string> = {};

  supportedLocales.forEach(locale => {
    const url = `${baseUrl}/${locale}${currentPath}`;
    alternates[locale] = url;
  });

  return alternates;
}

/**
 * Generate hreflang links for international SEO
 */
export function generateHreflangLinks(
  baseUrl: string,
  supportedLocales: Locale[],
  currentPath: string = '',
  defaultLocale: Locale = 'en'
): Array<{ rel: string; hrefLang: string; href: string }> {
  const links: Array<{ rel: string; hrefLang: string; href: string }> = [];

  // Add links for each supported locale
  supportedLocales.forEach(locale => {
    const href = locale === defaultLocale 
      ? `${baseUrl}${currentPath}`
      : `${baseUrl}/${locale}${currentPath}`;
    
    links.push({
      rel: 'alternate',
      hrefLang: locale,
      href,
    });
  });

  // Add x-default link
  links.push({
    rel: 'alternate',
    hrefLang: 'x-default',
    href: `${baseUrl}${currentPath}`,
  });

  return links;
}

/**
 * Complete metadata generator with SEO optimization
 */
export async function generateSEOMetadata(
  config: {
    title: string;
    description: string;
    keywords?: string[];
    baseUrl: string;
    currentPath?: string;
    supportedLocales: Locale[];
    defaultLocale?: Locale;
    siteName?: string;
    locale?: Locale;
    localeBasePath?: string;
    fallback?: boolean;
  }
): Promise<Metadata> {
  const {
    title,
    description,
    keywords = [],
    baseUrl,
    currentPath = '',
    supportedLocales,
    defaultLocale = 'en',
    siteName,
    locale,
    localeBasePath,
    fallback,
  } = config;

  // Generate translated metadata
  const translatedMetadata = await generateTranslatedMetadata(
    {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        siteName,
      },
      twitter: {
        title,
        description,
      },
    },
    { locale, localeBasePath, fallback }
  );

  // Generate alternate languages
  const alternates = generateAlternateLanguages(baseUrl, supportedLocales, currentPath);

  // Combine all metadata
  const metadata: Metadata = {
    ...translatedMetadata,
    alternates: {
      languages: alternates,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  return metadata;
}

/**
 * Hook for dynamic metadata generation in Next.js pages
 */
export async function generatePageMetadata(
  params: { locale?: string },
  config: {
    title: string;
    description: string;
    keywords?: string[];
    baseUrl: string;
    supportedLocales: Locale[];
    defaultLocale?: Locale;
    siteName?: string;
    localeBasePath?: string;
  }
): Promise<Metadata> {
  const locale = (params.locale as Locale) || config.defaultLocale || 'en';
  
  return generateSEOMetadata({
    ...config,
    locale,
    currentPath: params.locale ? `/${params.locale}` : '',
  });
}
