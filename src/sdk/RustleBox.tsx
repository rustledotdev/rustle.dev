'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { RustleBoxProps } from '../types';
import { RustleContext } from './context';
import { format } from '../utils/placeholders';
import { DEFAULT_LOCALES_JSON_PATH, DEFAULT_LOCALE_COOKIE_NAME } from '../constants';

/**
 * RustleBox - Provider for runtime translations
 * Loads per-locale JSON dictionary from `/rustle/locales/<locale>.json` by default.
 */
export function RustleBox({ children, initialLocale = 'en', sourceLanguage = 'en', targetLanguages = [], localeBasePath = DEFAULT_LOCALES_JSON_PATH, translations: initialDict, onLocaleChange, debug = false }: RustleBoxProps) {
  const [locale, setLocale] = useState(initialLocale);
  const [dict, setDict] = useState<Record<string, string>>(initialDict || {});
  const [ready, setReady] = useState<boolean>(!!initialDict);
  const [sourceMap, setSourceMap] = useState<Record<string, string> | null>(null);
  const [reverseMap, setReverseMap] = useState<Record<string, string> | null>(null);


  const configuration = useMemo(() => ({
    sourceLanguage,
    targetLanguages: Array.from(new Set(targetLanguages ?? [])),
    localeBasePath,
  }), [sourceLanguage, targetLanguages, localeBasePath]);

  useEffect(() => {
    try { (window as any).__RUSTLE_CONFIGURATION__ = configuration; } catch (e) { void e; }
  }, [configuration]);

  // On mount, prefer persisted cookie locale if available (higher priority than URL defaults)
  useEffect(() => {
    try {
      if (typeof document !== 'undefined') {
        const m = document.cookie.match(new RegExp(`(?:^|; )${DEFAULT_LOCALE_COOKIE_NAME}=([^;]*)`));
        const cookieLocale = m ? decodeURIComponent(m[1]) : null;
        if (cookieLocale && cookieLocale !== locale) {
          setLocale(cookieLocale);
          onLocaleChange?.(cookieLocale);
        }
      }
    } catch (e) { void e; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose dictionary, locale, and source map on window for runtime-only consumers
  useEffect(() => {
    try {
      (window as any).__RUSTLE_LOCALE__ = locale;
      (window as any).__RUSTLE_DICT__ = dict;
      if (sourceMap) (window as any).__RUSTLE_MASTER_MAP__ = sourceMap;
      if (reverseMap) (window as any).__RUSTLE_SOURCE_TO_FP__ = reverseMap;
    } catch (e) { void e; /* no-op for non-DOM envs */ }
  }, [locale, dict, sourceMap]);

  // Load master map (fingerprint -> source) and reverse map (source -> fingerprint)
  useEffect(() => {
    let cancelled = false;
    async function loadMaster() {
      try {
        const prefix = localeBasePath.replace(/\/locales\/?$/, '');
        const masterUrl = `${prefix.replace(/\/$/, '')}/master.json`;
        const res = await fetch(masterUrl, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data && data.items && typeof data.items === 'object') {
          const map: Record<string, string> = {};
          const rev: Record<string, string> = {};
          for (const fp of Object.keys(data.items)) {
            const item = data.items[fp];
            if (item && typeof item.source === 'string') {
              map[fp] = item.source;
              // Only set the reverse mapping if not already set to keep first-seen fingerprint
              if (!Object.prototype.hasOwnProperty.call(rev, item.source)) rev[item.source] = fp;
            }
          }
          setSourceMap(map);
          setReverseMap(rev);
        }
      } catch (e) { if (debug) { try { console.debug('[rustle] master load failed:', e); } catch (e2) { void e2; } } }
    }
    loadMaster();
    return () => { cancelled = true; };
  }, [localeBasePath]);


  useEffect(() => {
    let aborted = false;
    async function load() {
      try {
        setReady(false);
        const res = await fetch(`${localeBasePath.replace(/\/$/, '')}/${locale}.json`, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to load locale ${locale}`);
        const data = (await res.json()) as Record<string, string>;
        if (!aborted) {
          setDict(data);
          setReady(true);
        }
      } catch (e) {
        if (debug) { try { console.warn('[rustle] locale load failed:', e); } catch (e2) { void e2; }
        }
        if (!aborted) {
          try {
            const res2 = await fetch(`${localeBasePath.replace(/\/$/, '')}/${sourceLanguage}.json`, { cache: 'no-store' });
            if (res2.ok) {
              const data2 = (await res2.json()) as Record<string, string>;
              setDict(data2);
              setReady(true);
              return;
            }
          } catch (e2) { if (debug) { try { console.debug('[rustle] fallback locale load failed:', e2); } catch (e3) { void e3; } } }
          setDict({});
          setReady(true);
        }
      }
    }
    // Only fetch if no preloaded translations provided or locale changed
    if (!initialDict || locale !== initialLocale) {
      load();
    }

    // Dev HMR (Vite) listener removed from runtime to avoid import.meta in Next.js bundles.
    // Vite users can rely on polling fallback below or future plugin-provided hooks.

    // Dev polling fallback for Next.js/Turbopack HMR: periodically fetch and hot-merge
    if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`${localeBasePath.replace(/\/$/, '')}/${locale}.json`, { cache: 'no-store' });
          if (!res.ok) return;
          const data = (await res.json()) as Record<string, string>;
          setDict(prev => {
            let changed = false;
            const keys = Object.keys(data);
            if (keys.length !== Object.keys(prev).length) changed = true;
            else {
              for (const k of keys) { if (prev[k] !== data[k]) { changed = true; break; } }
            }
            if (changed) {
              setReady(true);
              return { ...prev, ...data };
            }
            return prev;
          });
        } catch (e3) { if (debug) { try { console.debug('[rustle] polling merge failed:', e3); } catch (e4) { void e4; } } }
      }, 1500);
      return () => { aborted = true; clearInterval(interval); };
    }

    return () => { aborted = true; };
  }, [locale, localeBasePath, initialDict, initialLocale]);

  const changeLocale = useCallback((l: string) => {
    setLocale(l);
    try { if (typeof document !== 'undefined') { document.cookie = `${DEFAULT_LOCALE_COOKIE_NAME}=${encodeURIComponent(l)}; path=/; max-age=31536000`; } } catch (e) { void e; }
    onLocaleChange?.(l);
  }, [onLocaleChange]);

  const t = useCallback((id: string, values?: Record<string, any>) => {
    // Try direct key, otherwise map source text -> fingerprint via reverseMap
    const key = Object.prototype.hasOwnProperty.call(dict, id)
      ? id
      : (reverseMap && Object.prototype.hasOwnProperty.call(reverseMap, id) ? (reverseMap as any)[id] : id);
    const hasKey = Object.prototype.hasOwnProperty.call(dict, key);
    const val = hasKey ? dict[key] : undefined;
    // Only log missing keys in the browser during development, never during SSR/build
    if (debug && typeof window !== 'undefined' && typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production' && !hasKey) {
      try { console.warn(`[rustle] missing key in locale ${locale}:`, id); } catch (e) { void e; }
    }
    // Fallback to provided id (assumed source text) or master source if id is a fingerprint
    let base = '';
    if (val && val.length > 0) base = val;
    else if (sourceMap && Object.prototype.hasOwnProperty.call(sourceMap, id)) base = (sourceMap as any)[id];
    else base = id;
    return values ? format(base, values) : base;
  }, [dict, reverseMap, sourceMap, debug, locale]);

  const value = useMemo(() => ({ locale, setLocale: changeLocale, t, ready, configuration }), [locale, changeLocale, t, ready, configuration]);

  return (
    <RustleContext.Provider value={value}>

      {children}
    </RustleContext.Provider>
  );
}

export default RustleBox;
