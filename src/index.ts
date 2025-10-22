// Main exports - Optimized for SaaS product
export { RustleBox } from './components/RustleBox'; // Renamed from RustleBoxV2
export { AutoTranslate } from './components/AutoTranslate';
export { RustleGo } from './components/RustleGo';
export { TranslatedHTML } from './components/TranslatedHTML'; // For dangerouslySetInnerHTML support
export { useRustle } from './hooks/useRustle';
export { applyRustle } from './hooks/applyRustle'; // New universal hook for SSR/CSR
export {
  usePathBasedLocale,
  withPathBasedLocale,
  type UsePathBasedLocaleOptions,
  type UsePathBasedLocaleReturn
} from './hooks/usePathBasedLocale';

// Types
export type {
  RustleConfig,
  RustleBoxProps,
  RustleGoProps,
  TranslatedHTMLProps,
  UseRustleReturn,
  Locale,
  AIModel,
  LocaleData,
  TranslationEntry,
  MasterMetadata,
} from './types';

// Utilities (for advanced usage)
export {
  getLocaleFromCookie,
  setLocaleToCookie,
  removeLocaleFromCookie,
} from './utils/cookies';

export {
  createAPIClient,
  RustleAPIError,
} from './utils/api';

export {
  StorageManager,
  defaultStorageManager,
} from './utils/storage';

// Core classes for programmatic usage
export { RustleEngine } from './core/RustleEngine'; // Framework-agnostic engine
export { rustleEngine } from './rustleEngine'; // Legacy browser-side DOM manipulation

// Plugin system
export {
  PluginManager,
  debugPlugin,
  performancePlugin,
  type RustlePlugin
} from './core/PluginSystem';

// Offline support
export {
  OfflineManager,
  offlineManager
} from './core/OfflineManager';

// Performance utilities
export {
  debounce,
  throttle,
  memoize,
  LazyObserver,
  requestIdleCallback,
  cancelIdleCallback,
  DOMBatcher,
  MemoryMonitor,
  PerformanceCollector,
  performanceUtils
} from './utils/performance';

// Lazy loading utilities
export {
  lazyImport,
  lazyComponent,
  conditionalImport,
  browserOnlyImport,
  nodeOnlyImport,
  preloadModule,
  ModuleCache,
  moduleCache,
  featureSupported,
  loadPolyfillIfNeeded,
  bundleOptimization
} from './utils/lazyLoader';

// Locale management utilities
export {
  interpolateText,
  extractTemplate,
  commonPatterns,
  PathLocaleManager,
  ServerLocaleManager,
  UniversalLocaleManager,
  createLocaleManager,
  MetadataPathManager,
  AdvancedPathLocaleManager,
  type PathBasedRoutingConfig
} from './utils/localeUtils';

// Configuration management
export {
  ConfigManager,
  globalConfig,
  configHelpers,
  type RuntimeConfig
} from './utils/configManager';
