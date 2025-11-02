import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { DEFAULT_LOCALE_COOKIE_NAME } from '../constants';

export type PathMiddlewareOptions = {
  supportedLocales: string[];
  defaultLocale: string;
  excludePaths?: string[];
  includeDefaultLocaleInPath?: boolean; // default false
  debug?: boolean;
};

function isExcluded(pathname: string, exclude?: string[]): boolean {
  if (!exclude?.length) return false;
  for (const p of exclude) {
    if (pathname === p || pathname.startsWith(p + '/')) return true;
  }
  return false;
}

/**
 * Create a Next.js middleware that handles path-based locales.
 * - Accepts /en/... /fr/... prefixes for configured locales
 * - Optionally redirects to include default locale in path
 * - Persists locale in a cookie
 */
export function createPathBasedMiddleware(options: PathMiddlewareOptions) {
  const {
    supportedLocales,
    defaultLocale,
    excludePaths = ['/api', '/_next', '/rustle'],
    includeDefaultLocaleInPath = false,
    debug = false,
  } = options;

  return function middleware(req: NextRequest) {
    const url = req.nextUrl.clone();
    const { pathname } = url;

    if (isExcluded(pathname, excludePaths)) {
      return NextResponse.next();
    }

    const segments = pathname.split('/').filter(Boolean);
    const maybeLocale = segments[0] || '';
    const isSupported = supportedLocales.includes(maybeLocale);

    const res = NextResponse.next();

    // Helper: set cookie when locale detected
    const setLocaleCookie = (loc: string) => {
      try {
        res.cookies.set(DEFAULT_LOCALE_COOKIE_NAME, loc, { path: '/', httpOnly: false });
      } catch (e) { void e; /* no-op */ }
    };

    if (isSupported) {
      if (debug) console.log(`[rustle][mw] matched locale: ${maybeLocale} for ${pathname}`);
      // Rewrite to strip the locale prefix while preserving the visible URL
      const newUrl = req.nextUrl.clone();
      newUrl.pathname = '/' + segments.slice(1).join('/');
      if (newUrl.pathname === '') newUrl.pathname = '/';
      const r = NextResponse.rewrite(newUrl);
      try { r.cookies.set(DEFAULT_LOCALE_COOKIE_NAME, maybeLocale, { path: '/', httpOnly: false }); } catch (e) { void e; }
      return r;
    }

    // No locale segment in path
    // If we require default locale segment, redirect
    if (includeDefaultLocaleInPath) {
      const newPath = ['/', defaultLocale, ...segments].join('/').replace(/\/+/, '/');
      if (debug) console.log(`[rustle][mw] redirecting to ${newPath}`);
      const redirectURL = req.nextUrl.clone();
      redirectURL.pathname = newPath;
      const r = NextResponse.redirect(redirectURL);
      try { r.cookies.set(DEFAULT_LOCALE_COOKIE_NAME, defaultLocale, { path: '/', httpOnly: false }); } catch (e) { void e; /* no-op */ }
      return r;
    }

    // Otherwise, treat as default locale, set cookie if missing
    const cookieLocale = req.cookies.get(DEFAULT_LOCALE_COOKIE_NAME)?.value;
    if (!cookieLocale) {
      setLocaleCookie(defaultLocale);
    }
    return res;
  };
}

