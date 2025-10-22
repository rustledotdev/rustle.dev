// Lite version - Only essential components for minimal bundle size
'use client';

// Core components only
export { RustleBox } from './components/RustleBox';
export { useRustle } from './hooks/useRustle';

// Essential types
export type {
  RustleConfig,
  RustleBoxProps,
  UseRustleReturn,
  Locale,
} from './types';

// Essential utilities
export {
  getLocaleFromCookie,
  setLocaleToCookie,
} from './utils/cookies';

// Note: This lite version excludes:
// - RustleGo (dynamic translation)
// - TranslatedHTML (dangerouslySetInnerHTML support)
// - Plugin system
// - Offline manager
// - Advanced utilities
// - Server-side utilities
// - CLI tools
//
// Use the full version if you need these features
