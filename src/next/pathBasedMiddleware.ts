import { NextRequest, NextResponse } from 'next/server';
import type { Locale } from '../types';
import { 
  PathLocaleManager, 
  AdvancedPathLocaleManager,
  type PathBasedRoutingConfig 
} from '../utils/localeUtils';

export interface NextPathBasedMiddlewareConfig extends Omit<PathBasedRoutingConfig, 'enabled'> {
  supportedLocales: Locale[];
  defaultLocale: Locale;
  excludePaths?: string[];
  includeDefaultLocaleInPath?: boolean;
  redirectToDefaultLocale?: boolean;
  cookieName?: string;
  debug?: boolean;
}

/**
 * Create Next.js middleware for path-based locale routing
 * 
 * @example
 * ```typescript
 * // middleware.ts
 * import { createPathBasedMiddleware } from 'rustle.dev/next';
 * 
 * export const middleware = createPathBasedMiddleware({
 *   supportedLocales: ['en', 'fr', 'es', 'de'],
 *   defaultLocale: 'en',
 *   includeDefaultLocaleInPath: false,
 *   excludePaths: ['/api', '/static', '/_next'],
 *   redirectToDefaultLocale: true,
 *   debug: process.env.NODE_ENV === 'development'
 * });
 * 
 * export const config = {
 *   matcher: [
 *     '/((?!api|_next/static|_next/image|favicon.ico).*)',
 *   ],
 * };
 * ```
 */
export function createPathBasedMiddleware(config: NextPathBasedMiddlewareConfig) {
  const {
    supportedLocales,
    defaultLocale,
    excludePaths = ['/api', '/static', '/_next', '/favicon.ico'],
    includeDefaultLocaleInPath = false,
    redirectToDefaultLocale = true,
    cookieName = 'rustle-locale',
    debug = false
  } = config;

  // Configure the advanced path locale manager
  AdvancedPathLocaleManager.configure({
    enabled: true,
    supportedLocales,
    defaultLocale,
    excludePaths,
    includeDefaultLocaleInPath,
    redirectToDefaultLocale
  });

  return function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;
    
    if (debug) {
      console.log(`🌐 [PathBasedMiddleware] Processing: ${pathname}`);
    }

    // Skip excluded paths
    if (AdvancedPathLocaleManager.shouldExcludePath(pathname)) {
      if (debug) {
        console.log(`⏭️ [PathBasedMiddleware] Skipping excluded path: ${pathname}`);
      }
      return NextResponse.next();
    }

    // Get locale information from request
    const requestData = {
      pathname,
      headers: Object.fromEntries(request.headers.entries()),
      cookies: Object.fromEntries(
        request.cookies.getAll().map(cookie => [cookie.name, cookie.value])
      )
    };

    const { locale, shouldRedirect, redirectPath } = AdvancedPathLocaleManager.getLocaleFromRequest(requestData);

    if (debug) {
      console.log(`🔍 [PathBasedMiddleware] Detected locale: ${locale}, shouldRedirect: ${shouldRedirect}`);
    }

    // Handle redirects
    if (shouldRedirect && redirectPath) {
      if (debug) {
        console.log(`↩️ [PathBasedMiddleware] Redirecting to: ${redirectPath}`);
      }
      
      const response = NextResponse.redirect(new URL(redirectPath, request.url));
      
      // Set locale cookie
      response.cookies.set(cookieName, locale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax'
      });
      
      return response;
    }

    // Continue with the request but set locale cookie if needed
    const response = NextResponse.next();
    
    // Always set/update the locale cookie
    const currentCookieLocale = request.cookies.get(cookieName)?.value;
    if (currentCookieLocale !== locale) {
      response.cookies.set(cookieName, locale, {
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax'
      });
      
      if (debug) {
        console.log(`🍪 [PathBasedMiddleware] Setting locale cookie: ${locale}`);
      }
    }

    // Add locale information to headers for use in pages/components
    response.headers.set('x-rustle-locale', locale);
    response.headers.set('x-rustle-path-without-locale', 
      PathLocaleManager.removeLocaleFromPath(pathname, supportedLocales)
    );

    if (debug) {
      console.log(`✅ [PathBasedMiddleware] Processed successfully: ${pathname} -> ${locale}`);
    }

    return response;
  };
}

/**
 * Get locale information from Next.js request in pages/components
 */
export function getLocaleFromNextRequest(request: NextRequest): {
  locale: Locale;
  pathWithoutLocale: string;
  alternateLinks: Array<{ locale: Locale; href: string; hreflang: string }>;
} {
  const locale = request.headers.get('x-rustle-locale') as Locale || 'en';
  const pathWithoutLocale = request.headers.get('x-rustle-path-without-locale') || '/';
  
  const alternateLinks = AdvancedPathLocaleManager.generateAlternateLinks(
    request.nextUrl.pathname,
    request.nextUrl.origin
  );

  return {
    locale,
    pathWithoutLocale,
    alternateLinks
  };
}

/**
 * Generate static paths for all locales (for getStaticPaths)
 * 
 * @example
 * ```typescript
 * // pages/[...slug].tsx
 * export async function getStaticPaths() {
 *   const paths = generateStaticPathsForLocales([
 *     { slug: ['about'] },
 *     { slug: ['contact'] },
 *     { slug: ['blog', 'post-1'] }
 *   ], {
 *     supportedLocales: ['en', 'fr', 'es'],
 *     defaultLocale: 'en',
 *     includeDefaultLocaleInPath: false
 *   });
 * 
 *   return {
 *     paths,
 *     fallback: false
 *   };
 * }
 * ```
 */
export function generateStaticPathsForLocales(
  basePaths: Array<{ slug: string[] }>,
  config: {
    supportedLocales: Locale[];
    defaultLocale: Locale;
    includeDefaultLocaleInPath?: boolean;
  }
): Array<{ params: { slug: string[] }; locale: Locale }> {
  const { supportedLocales, defaultLocale, includeDefaultLocaleInPath = false } = config;
  const paths: Array<{ params: { slug: string[] }; locale: Locale }> = [];

  basePaths.forEach(({ slug }) => {
    supportedLocales.forEach(locale => {
      // For default locale, include path without locale prefix if configured
      if (locale === defaultLocale && !includeDefaultLocaleInPath) {
        paths.push({
          params: { slug },
          locale
        });
      } else {
        // Include locale in the slug
        paths.push({
          params: { slug: [locale, ...slug] },
          locale
        });
      }
    });
  });

  return paths;
}

/**
 * Extract locale and clean slug from Next.js params
 */
export function extractLocaleFromParams(
  params: { slug?: string[] },
  config: {
    supportedLocales: Locale[];
    defaultLocale: Locale;
  }
): { locale: Locale; cleanSlug: string[] } {
  const { supportedLocales, defaultLocale } = config;
  const slug = params.slug || [];

  if (slug.length === 0) {
    return { locale: defaultLocale, cleanSlug: [] };
  }

  const firstSegment = slug[0];
  
  if (supportedLocales.includes(firstSegment as Locale)) {
    return {
      locale: firstSegment as Locale,
      cleanSlug: slug.slice(1)
    };
  }

  return { locale: defaultLocale, cleanSlug: slug };
}

/**
 * Create locale-aware getStaticProps helper
 */
export function createLocaleAwareGetStaticProps<T = any>(
  getProps: (context: {
    locale: Locale;
    cleanSlug: string[];
    params: any;
  }) => Promise<{ props: T }> | { props: T }
) {
  return async function getStaticProps(context: any) {
    const { locale: contextLocale, params } = context;
    
    const { locale, cleanSlug } = extractLocaleFromParams(params, {
      supportedLocales: ['en', 'es', 'fr', 'de', 'it', 'pt'], // Default, should be configurable
      defaultLocale: 'en'
    });

    // Use context locale if available, otherwise use extracted locale
    const finalLocale = contextLocale || locale;

    const result = await getProps({
      locale: finalLocale,
      cleanSlug,
      params
    });

    return {
      ...result,
      props: {
        ...result.props,
        locale: finalLocale,
        pathWithoutLocale: '/' + cleanSlug.join('/')
      }
    };
  };
}
