# Rustle.dev - AI-Powered Translation SDK

[![npm version](https://badge.fury.io/js/rustle.dev.svg)](https://badge.fury.io/js/rustle.dev)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

**Rustle.dev** is a production-ready AI-powered translation SDK for React & Next.js applications. It provides automatic translation without requiring manual `t()` function calls, using advanced fingerprinting and intelligent content detection.

## 🚀 Features

- **🤖 AI-Powered Translation**: Supports OpenAI GPT-4, GPT-3.5-turbo, Google Gemini Pro/Flash models
- **⚡ Zero Configuration**: Works out of the box with minimal setup - just wrap your app with `<RustleBox>`
- **🔄 Automatic Detection**: Automatically detects and translates new content using React Virtual DOM
- **📱 Framework Support**: React 18+, Next.js 14+ (App Router & Pages Router)
- **🎯 Smart Fingerprinting**: Stable content identification using SHA-1 hashing with `data-i18n-fingerprint` attributes
- **💾 Static File Optimization**: Cache-first strategy with static locale files (`.json`) for optimal performance
- **🔒 Production Security**: Built-in XSS protection, input validation, rate limiting, and API key validation
- **🎨 Loading States**: Word-by-word skeleton loaders that match original text dimensions
- **🌐 SSR/CSR/SSG Support**: Works with all rendering strategies via cookie-based locale detection
- **🔄 Dynamic Content**: Real-time translation of dynamic content with `RustleGo` component
- **📊 Batch Optimization**: Intelligent batching of API calls to reduce costs and improve performance

## 📦 Installation

```bash
npm install rustle.dev
# or
yarn add rustle.dev
# or
pnpm add rustle.dev
```

## 🌐 Path-Based Locale Support

Rustle.dev now supports **path-based locale routing** (e.g., `/en/about`, `/fr/about`, `/de/about`) in addition to cookie and header-based locale detection. This feature provides SEO-friendly URLs and better user experience.

### Features:
- ✅ **Automatic path locale detection** (`/en/about` → locale: `en`)
- ✅ **Locale-aware URL generation** (`/about` + `fr` → `/fr/about`)
- ✅ **Next.js middleware integration** for automatic redirects
- ✅ **SEO optimization** with hreflang links generation
- ✅ **Backward compatibility** with existing cookie/header detection
- ✅ **Configurable default locale handling** (include/exclude from path)
- ✅ **React hooks** for client-side locale management

### Quick Setup

#### 1. Next.js Middleware (Recommended)

Create `middleware.ts` in your project root:

```typescript
import { createPathBasedMiddleware } from 'rustle.dev/next';

export const middleware = createPathBasedMiddleware({
  supportedLocales: ['en', 'fr', 'es', 'de'],
  defaultLocale: 'en',
  includeDefaultLocaleInPath: false, // /about vs /en/about for default locale
  excludePaths: ['/api', '/static', '/_next'],
  redirectToDefaultLocale: true,
  debug: process.env.NODE_ENV === 'development'
});

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

#### 2. React Hook for Client-Side Management

```tsx
import { usePathBasedLocale } from 'rustle.dev';

function LanguageSwitcher() {
  const {
    currentLocale,
    setLocale,
    navigateToLocalizedPath,
    getLocalizedPath,
    generateAlternateLinks,
    supportedLocales
  } = usePathBasedLocale({
    enablePathRouting: true,
    supportedLocales: ['en', 'fr', 'es', 'de'],
    defaultLocale: 'en',
    includeDefaultLocaleInPath: false
  });

  return (
    <div>
      <p>Current locale: {currentLocale}</p>

      {/* Language switcher */}
      {supportedLocales.map(locale => (
        <button
          key={locale}
          onClick={() => setLocale(locale)}
          className={currentLocale === locale ? 'active' : ''}
        >
          {locale.toUpperCase()}
        </button>
      ))}

      {/* Localized navigation */}
      <nav>
        <a href={getLocalizedPath('/about')}>About</a>
        <a href={getLocalizedPath('/contact')}>Contact</a>
        <a href={getLocalizedPath('/blog')}>Blog</a>
      </nav>

      {/* SEO: Generate hreflang links */}
      {generateAlternateLinks('https://example.com').map(({ locale, href, hreflang }) => (
        <link key={locale} rel="alternate" hrefLang={hreflang} href={href} />
      ))}
    </div>
  );
}
```

#### 3. URL Patterns Supported

| URL Pattern | Locale | Path Without Locale |
|-------------|--------|-------------------|
| `/about` | `en` (default) | `/about` |
| `/en/about` | `en` | `/about` |
| `/fr/about` | `fr` | `/about` |
| `/es/contact` | `es` | `/contact` |
| `/de/blog/post-1` | `de` | `/blog/post-1` |

## 🏃‍♂️ Quick Start

### React Setup

```tsx
import { RustleBox } from 'rustle.dev';

function App() {
  return (
    <RustleBox
      apiKey="your-api-key"
      sourceLanguage="en"
      targetLanguages={['es', 'fr', 'de']}
      model="gpt-3.5-turbo"
      debug={true}
      auto={true}
      fallback={true}
    >
      <div>
        <h1>Welcome to our app!</h1>
        <p>This content will be automatically translated.</p>
      </div>
    </RustleBox>
  );
}
```

### Next.js Setup (App Router)

```tsx
// app/layout.tsx
'use client';
import { RustleBox } from 'rustle.dev';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <RustleBox
          apiKey={process.env.NEXT_PUBLIC_RUSTLE_API_KEY}
          sourceLanguage="en"
          targetLanguages={['es', 'fr', 'de']}
          model="gpt-3.5-turbo"
          debug={process.env.NODE_ENV === 'development'}
          auto={true}
          fallback={true}
          useVirtualDOM={true}
          localeBasePath="/rustle/locales"
        >
          {children}
        </RustleBox>
      </body>
    </html>
  );
}
```

## 🔧 Configuration

### RustleBox Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiKey` | `string` | **Required** | Your Rustle.dev API key |
| `sourceLanguage` | `string` | `'en'` | Source language code (ISO 639-1) |
| `targetLanguages` | `string[]` | `['es', 'fr', 'de']` | Array of target language codes |
| `model` | `AIModel` | `'gpt-3.5-turbo'` | AI model to use for translation |
| `debug` | `boolean` | `false` | Enable debug logging |
| `auto` | `boolean` | `true` | Enable automatic content detection |
| `fallback` | `boolean` | `true` | Show original text if translation fails |
| `useVirtualDOM` | `boolean` | `true` | Use React Virtual DOM approach |
| `localeBasePath` | `string` | `'/rustle/locales'` | Base path for static locale files |
| `loadingConfig` | `LoadingConfig` | `defaultLoadingConfig` | Loading state configuration |

### Supported AI Models

- **OpenAI**: `gpt-4`, `gpt-4-turbo`, `gpt-3.5-turbo`, `gpt-3.5-turbo-16k`
- **Google Gemini**: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-pro`
- **Legacy**: `openai`, `gemini`, `azure` (for backward compatibility)

## 🎯 Components

### RustleBox
Main wrapper component that provides translation context to your entire app.

### RustleGo
For dynamic content that changes frequently:

```tsx
import { RustleGo } from 'rustle.dev';

function DynamicContent() {
  const [content, setContent] = useState("Dynamic text that changes");
  
  return (
    <RustleGo cache={true} fallback={<div>Loading...</div>}>
      <p>{content}</p>
    </RustleGo>
  );
}
```

### TranslatedHTML
For HTML content with `dangerouslySetInnerHTML`:

```tsx
import { TranslatedHTML } from 'rustle.dev';

function HTMLContent() {
  const htmlContent = `<div><h4>Welcome!</h4><p>Rich <strong>HTML</strong> content.</p></div>`;

  return (
    <TranslatedHTML
      html={htmlContent}
      tag="div"
      cache={true}
      fallback="Loading translation..."
    />
  );
}
```

### AutoTranslate
Virtual DOM-based translation component for efficient updates:

```tsx
import { AutoTranslate } from 'rustle.dev';

function VirtualDOMContent() {
  return (
    <AutoTranslate>
      <div>
        <h1>This content uses Virtual DOM</h1>
        <p>Efficient translation updates without re-rendering</p>
        <span>Multiple elements translated together</span>
      </div>
    </AutoTranslate>
  );
}
```

**AutoTranslate Features:**
- Uses React Virtual DOM for efficient translation updates
- Automatically detects elements with `data-i18n-fingerprint` attributes
- Memoized translations to avoid unnecessary re-computations
- Supports both fingerprint-based and text-based translation lookups
- Ideal for content that doesn't change frequently

## 🪝 Hooks

### useRustle
Access translation functionality and locale state:

```tsx
import { useRustle } from 'rustle.dev';

function LanguageSwitcher() {
  const { currentLocale, setLocale, translate, isLoading, error } = useRustle();

  const handleTranslate = async () => {
    const result = await translate("Hello world", "es");
    console.log(result); // "Hola mundo"
  };

  return (
    <div>
      <p>Current: {currentLocale}</p>
      <button onClick={() => setLocale('es')}>Switch to Spanish</button>
      <button onClick={handleTranslate}>Translate Text</button>
    </div>
  );
}
```

### applyRustle
Universal hook for both client and server-side usage:

```tsx
import { applyRustle } from 'rustle.dev';

function MyComponent() {
  const { translate, translateBatch, isLoading } = applyRustle();
  
  // Batch translation for better performance
  const translateMultiple = async () => {
    const entries = [
      { id: '1', text: 'Hello' },
      { id: '2', text: 'World' }
    ];
    const results = await translateBatch(entries, 'es');
  };
}
```

## 🏷️ HTML Attributes

Rustle.dev uses special data attributes to control translation behavior:

### `data-i18n-fingerprint`
Unique identifier for content (automatically generated):
```html
<p data-i18n-fingerprint="abc123">Hello world</p>
```

### `data-i18n-pause`
Pause translation for specific elements:
```html
<div data-i18n-pause="true">
  This content won't be translated
</div>
```

### `data-i18n`
Indicates translated content (automatically added):
```html
<p data-i18n="true" data-i18n-original="Hello">Hola</p>
```

## 🌐 Locale Management

### Cookie-Based Detection
Rustle.dev automatically reads and writes to the `rustle-locale` cookie for locale persistence. Users can set this cookie with their custom solutions:

```tsx
import { getLocaleFromCookie, setLocaleToCookie } from 'rustle.dev';

// Get current locale from cookie
const currentLocale = getLocaleFromCookie(); // 'es'

// Set new locale to cookie
setLocaleToCookie('fr');

// Custom cookie management (alternative approach)
document.cookie = 'rustle-locale=de; path=/; max-age=31536000';
```

**Custom Cookie Integration**: If you have an existing locale management system, simply set the `rustle-locale` cookie and Rustle.dev will automatically detect and use it:

```javascript
// Your existing locale switcher
function switchLanguage(locale) {
  // Your custom logic here
  updateUserPreferences(locale);

  // Set the rustle-locale cookie for Rustle.dev
  document.cookie = `rustle-locale=${locale}; path=/; max-age=31536000`;

  // Rustle.dev will automatically detect the change
  window.location.reload(); // or use window.rustleSwitchLocale(locale)
}
```

### Global Locale Switching
Use the global function for programmatic locale changes:

```tsx
// Available globally after RustleBox initialization
window.rustleSwitchLocale('de');
```

## 🛠️ CLI Tools

### RustleEngine - AST-Based Content Extraction

The **RustleEngine** is a powerful CLI tool that uses Abstract Syntax Tree (AST) parsing to automatically extract translatable content from your React/Next.js codebase and generate static locale files.

#### Key Features:
- **AST Parsing**: Analyzes TypeScript/JavaScript files using AST for accurate content extraction
- **Fingerprint Generation**: Creates stable SHA-1 fingerprints for content identification
- **Automatic Translation**: Generates translations using AI models
- **Static File Generation**: Creates optimized JSON locale files for production

#### Basic Usage

```bash
# Generate locale files for your project
npx rustle-engine --src ./src --output ./public/rustle/locales --target-langs es,fr,de

# With debug output
npx rustle-engine --debug --src ./app --output ./public/translations

# Specify AI model and API key
npx rustle-engine --src ./src --output ./locales --api-key your-key --model gpt-4
```

#### CLI Options
| Option | Description | Default |
|--------|-------------|---------|
| `--src <dir>` | Source directory to scan for content | `./src` |
| `--output <dir>` | Output directory for locale files | `./public/rustle` |
| `--source-lang <lang>` | Source language code | `en` |
| `--target-langs <langs>` | Comma-separated target languages | `es,fr,de,it,pt` |
| `--api-key <key>` | Your Rustle.dev API key | From env |
| `--model <model>` | AI model for translation | `gpt-3.5-turbo` |
| `--debug` | Enable debug output | `false` |

#### Use Cases

**1. Build-Time Optimization**
```bash
# Add to your build process
npm run build:locales && npm run build
```

**2. Path-Based Routing Advanced Configuration**

For advanced path-based routing scenarios, use the `AdvancedPathLocaleManager`:

```typescript
import { AdvancedPathLocaleManager } from 'rustle.dev';

// Configure advanced path-based routing
AdvancedPathLocaleManager.configure({
  enabled: true,
  supportedLocales: ['en', 'fr', 'es', 'de', 'it', 'pt'],
  defaultLocale: 'en',
  excludePaths: ['/api', '/admin', '/static', '/_next', '/favicon.ico'],
  includeDefaultLocaleInPath: false, // /about vs /en/about
  redirectToDefaultLocale: true
});

// Get locale from request with redirect handling
const { locale, shouldRedirect, redirectPath } = AdvancedPathLocaleManager.getLocaleFromRequest({
  pathname: '/fr/about',
  headers: request.headers,
  cookies: request.cookies
});

// Generate SEO alternate links
const alternateLinks = AdvancedPathLocaleManager.generateAlternateLinks(
  '/about',
  'https://example.com'
);
// Returns: [
//   { locale: 'en', href: 'https://example.com/about', hreflang: 'x-default' },
//   { locale: 'fr', href: 'https://example.com/fr/about', hreflang: 'fr' },
//   { locale: 'es', href: 'https://example.com/es/about', hreflang: 'es' }
// ]
```

**3. Next.js Static Generation with Path-Based Locales**

For static sites with path-based locales:

```typescript
// pages/[...slug].tsx
import { generateStaticPathsForLocales, extractLocaleFromParams } from 'rustle.dev/next';

export async function getStaticPaths() {
  const basePaths = [
    { slug: ['about'] },
    { slug: ['contact'] },
    { slug: ['blog', 'post-1'] },
    { slug: ['blog', 'post-2'] }
  ];

  const paths = generateStaticPathsForLocales(basePaths, {
    supportedLocales: ['en', 'fr', 'es', 'de'],
    defaultLocale: 'en',
    includeDefaultLocaleInPath: false
  });

  return { paths, fallback: false };
}

export async function getStaticProps({ params }: any) {
  const { locale, cleanSlug } = extractLocaleFromParams(params, {
    supportedLocales: ['en', 'fr', 'es', 'de'],
    defaultLocale: 'en'
  });

  // Load content based on cleanSlug and locale
  const content = await loadContent(cleanSlug.join('/'), locale);

  return {
    props: {
      content,
      locale,
      pathWithoutLocale: '/' + cleanSlug.join('/')
    }
  };
}
```

**4. CI/CD Integration**

Rustle.dev provides comprehensive CI/CD support for automated translation workflows:

```yaml
# GitHub Actions - Complete Example
name: Build with Translations
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Generate Translation Files
        run: npx rustle-engine --src ./src --output ./public/rustle
        env:
          RUSTLE_API_KEY: ${{ secrets.RUSTLE_API_KEY }}

      - name: Build Application
        run: npm run build

      - name: Deploy
        run: npm run deploy
```

```yaml
# GitLab CI - Example
stages:
  - build
  - deploy

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npx rustle-engine --src ./src --output ./public/rustle
    - npm run build
  variables:
    RUSTLE_API_KEY: $RUSTLE_API_KEY
  artifacts:
    paths:
      - dist/
      - public/rustle/
```

```yaml
# Azure DevOps - Example
trigger:
- main

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'

- script: npm ci
  displayName: 'Install dependencies'

- script: npx rustle-engine --src ./src --output ./public/rustle
  displayName: 'Generate translations'
  env:
    RUSTLE_API_KEY: $(RUSTLE_API_KEY)

- script: npm run build
  displayName: 'Build application'
```

**CI/CD Environment Variables:**
- `RUSTLE_API_KEY` - Your API key (store as secret)
- `RUSTLE_API_URL` - Custom API endpoint (optional)
- `CI=true` - Automatically detected, enables CI-optimized error reporting

**Error Handling in CI:**
Rustle.dev automatically detects CI environments and provides enhanced error reporting:
- GitHub Actions: Uses `::error` annotations
- Standard CI: Structured error output with exit codes
- Quota exceeded: Fails build with clear instructions
- Network issues: Retry logic with exponential backoff

**3. Development Workflow**
```bash
# Watch mode for development (if supported)
npx rustle-engine --watch --src ./src --output ./public/rustle
```

#### Generated Files Structure
```
public/rustle/
├── master.json          # Master fingerprint mapping
└── locales/
    ├── en.json          # Source language
    ├── es.json          # Spanish translations
    ├── fr.json          # French translations
    └── de.json          # German translations
```

#### Integration with Static Files
The RustleEngine generates static locale files that are automatically used by RustleBox for optimal performance:

```tsx
<RustleBox
  localeBasePath="/rustle/locales"  // Points to generated files
  // ... other props
>
  {/* Your app content */}
</RustleBox>
```

## 📊 Performance Optimization

### Static File Strategy
1. **Static files first**: Check `/rustle/locales/{locale}.json`
2. **Memory cache**: In-memory translation cache
3. **API fallback**: Only call API for missing translations

### Batch Processing
- Automatic batching of translation requests
- 100ms debounce for optimal performance
- Maximum 100 entries per batch
- Request deduplication

### Loading States
Configure skeleton loaders for better UX:

```tsx
const loadingConfig = {
  enabled: true,
  type: 'skeleton', // 'skeleton' | 'spinner' | 'fade' | 'custom'
  duration: 0, // No artificial delay
  skeletonProps: {
    height: '1em',
    backgroundColor: '#e2e8f0',
    animationDuration: '1.2s'
  }
};

<RustleBox loadingConfig={loadingConfig}>
  {/* Your app */}
</RustleBox>
```

## 🔧 Advanced Features

### Plugin System
Extend Rustle.dev functionality with plugins:

```tsx
import { PluginManager, debugPlugin, performancePlugin } from 'rustle.dev';

// Initialize plugin manager
const pluginManager = new PluginManager();

// Add built-in plugins
pluginManager.use(debugPlugin);
pluginManager.use(performancePlugin);

// Custom plugin example
const customPlugin = {
  name: 'custom-logger',
  beforeTranslate: (text) => console.log('Translating:', text),
  afterTranslate: (result) => console.log('Result:', result)
};

pluginManager.use(customPlugin);
```

### Offline Support
Built-in offline translation capabilities:

```tsx
import { OfflineManager, offlineManager } from 'rustle.dev';

// Enable offline mode
offlineManager.enable();

// Check offline status
if (offlineManager.isOffline()) {
  console.log('Using cached translations');
}

// Sync when back online
offlineManager.sync();
```

### Performance Utilities
Advanced performance optimization tools:

```tsx
import {
  debounce,
  throttle,
  memoize,
  LazyObserver,
  PerformanceCollector
} from 'rustle.dev';

// Debounced translation function
const debouncedTranslate = debounce(translateFunction, 300);

// Performance monitoring
const collector = new PerformanceCollector();
collector.startMeasurement('translation-time');
// ... translation logic
collector.endMeasurement('translation-time');
```

### Storage Management
Customize translation storage:

```tsx
import { StorageManager, defaultStorageManager } from 'rustle.dev';

// Custom storage implementation
const customStorage = new StorageManager({
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear()
});

// Use with RustleBox
<RustleBox storageManager={customStorage}>
  {/* Your app */}
</RustleBox>
```

## 🔒 Security Features

- **XSS Protection**: Automatic HTML sanitization
- **Input Validation**: Text length limits and character filtering
- **Rate Limiting**: Built-in API rate limiting
- **API Key Validation**: Comprehensive security checks
- **HTTPS Enforcement**: Secure connections in production
- **Request Deduplication**: Prevents duplicate API calls

## 📝 License

Apache-2.0 License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/rustledotdev/rustle.dev/issues)
- 📖 Documentation: [https://rustle.dev](https://rustle.dev)

---

Made with ❤️ by the Rustle.dev team
