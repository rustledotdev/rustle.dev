import type { Locale } from '../types';

const LOCALE_COOKIE_NAME = 'rustle-locale';

/**
 * Get locale from cookie (works in both browser and server environments)
 */
export function getLocaleFromCookie(cookieString?: string): Locale | null {
  const cookies = cookieString || (typeof document !== 'undefined' ? document.cookie : '');
  
  if (!cookies) return null;
  
  const match = cookies.match(new RegExp(`(^| )${LOCALE_COOKIE_NAME}=([^;]+)`));
  return match ? (match[2] as Locale) : null;
}

/**
 * Set locale in cookie (browser only)
 */
export function setLocaleToCookie(locale: Locale, options: {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): void {
  if (typeof document === 'undefined') {
    console.warn('setLocaleToCookie: document is not available (server-side)');
    return;
  }

  const {
    maxAge = 365 * 24 * 60 * 60, // 1 year in seconds
    path = '/',
    domain,
    secure = false,
    sameSite = 'lax'
  } = options;

  let cookieString = `${LOCALE_COOKIE_NAME}=${locale}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}`;
  
  if (domain) {
    cookieString += `; Domain=${domain}`;
  }
  
  if (secure) {
    cookieString += '; Secure';
  }

  document.cookie = cookieString;
}

/**
 * Remove locale cookie (browser only)
 */
export function removeLocaleFromCookie(): void {
  if (typeof document === 'undefined') {
    console.warn('removeLocaleFromCookie: document is not available (server-side)');
    return;
  }

  document.cookie = `${LOCALE_COOKIE_NAME}=; Max-Age=0; Path=/`;
}

/**
 * Parse all cookies from cookie string
 */
export function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieString) return cookies;

  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=');
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });

  return cookies;
}

/**
 * Create server-side cookie header for setting locale
 */
export function createServerLocaleCookie(locale: Locale, options: {
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
} = {}): string {
  const {
    maxAge = 365 * 24 * 60 * 60, // 1 year in seconds
    path = '/',
    domain,
    secure = false,
    httpOnly = false,
    sameSite = 'lax'
  } = options;

  let cookie = `${LOCALE_COOKIE_NAME}=${locale}`;

  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  if (path) cookie += `; Path=${path}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (secure) cookie += `; Secure`;
  if (httpOnly) cookie += `; HttpOnly`;
  if (sameSite) cookie += `; SameSite=${sameSite}`;

  return cookie;
}
