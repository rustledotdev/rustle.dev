import { ReactNode } from 'react';

/**
 * Basic RustleBox Props
 * Runtime provider that exposes t() and locale switching.
 */
export interface RustleBoxProps {
  /** App tree */
  children: ReactNode;
  /** Initial locale (default: 'en') */
  initialLocale?: string;
  /** Source language for fallback (default: 'en') */
  sourceLanguage?: string;
  /** Target languages (used for switchers/debug exposure) */
  targetLanguages?: string[];
  /** Base path where locale JSON files live (default: '/rustle/locales') */
  localeBasePath?: string;
  /** Preloaded translations for current locale */
  translations?: Record<string, string>;
  /** Callback when locale changes */
  onLocaleChange?: (locale: string) => void;
  /** Enable debug logs in browser runtime (default: false) */
  debug?: boolean;
}
