# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-10-20

### 🎉 Initial Release

This is the first stable release of Rustle.dev - an AI-powered translation SDK for React & Next.js applications.

### ✨ Features

#### Core Components
- **RustleBox** - Main wrapper component with mandatory API key validation
- **RustleGo** - Dynamic content wrapper with batching and caching
- **TranslatedHTML** - Component for dangerouslySetInnerHTML support
- **applyRustle()** - Universal hook for SSR/CSR translation functionality
- **useRustle()** - Legacy alias for applyRustle

#### Framework Support
- **React 18+** - Full Virtual DOM integration
- **Next.js 14+** - SSR/SSG/CSR/ISR support
- **Vanilla JS** - Framework-agnostic RustleEngine class

#### AI Translation
- **OpenAI Integration** - GPT-3.5, GPT-4, GPT-4o support
- **Google Gemini** - Gemini Pro and Flash models
- **Batch Processing** - Cost-optimized API calls with 50ms timeout
- **Retry Mechanism** - Exponential backoff (1s, 2s, 4s) with 3 retries

#### Performance Optimizations
- **Cache-First Strategy** - Memory → Static → API fallback chain
- **Smart Batching** - Automatic request deduplication
- **Offline Support** - Cache-based offline functionality
- **Lazy Loading** - Code splitting and dynamic imports
- **SSR Optimization** - Memoization and server-side detection

#### Developer Experience
- **TypeScript** - Full type safety with strict checking
- **Zero Configuration** - No `t()` functions required
- **Debug Mode** - Detailed logging for development
- **Multiple Entry Points** - Optimized builds for different use cases
- **Environment Variables** - Optional configuration overrides

#### Content Handling
- **Fingerprinting System** - SHA1-based content identification
- **Semi-Dynamic Text** - Template interpolation support
- **Static Translations** - JSON-based locale files
- **Master Metadata** - Comprehensive translation metadata store

#### Security & Production
- **Minification** - Terser-based code obfuscation
- **Source Map Removal** - Production security
- **API Key Validation** - Mandatory authentication
- **Smart Defaults** - Production API URL configuration

### 📦 Package Structure

#### Entry Points
- **Main SDK** (77.76 kB) - Full feature set
- **Lite Version** (0.21 kB) - Essential components only
- **Server Utilities** (0.94 kB) - SSR helpers
- **Next.js Specific** (12.37 kB) - Next.js optimizations
- **CLI Tools** (12.22 kB) - Development utilities

#### Build Targets
- **ES2020** - Modern JavaScript support
- **CommonJS** - Node.js compatibility
- **ES Modules** - Tree-shaking support
- **TypeScript Declarations** - Full type definitions

### 🏗️ Architecture

#### Cache Strategy
1. **Memory Cache** - Fastest lookup (in-memory storage)
2. **Static Translations** - Locale files (JSON-based)
3. **API Calls** - Last resort with retry mechanism

#### Fingerprinting
- **Content-based** - SHA1 of normalized text
- **Stable IDs** - Consistent across builds
- **Change Detection** - Efficient updates

#### Plugin System
- **Extensible Architecture** - Custom plugin support
- **Lifecycle Hooks** - Pre/post translation events
- **Framework Agnostic** - Works with any framework

### 🔧 Configuration

#### Environment Variables
- `RUSTLE_API_URL` - Optional API endpoint override
- `RUSTLE_API_KEY` - Required for API authentication
- `NODE_ENV` - Automatic development/production detection

#### Smart Defaults
- **Production API** - `https://api.rustle.dev/v1`
- **Development API** - `http://localhost:3001/api`
- **Automatic Detection** - Based on hostname and NODE_ENV

### 📚 Examples

#### Included Applications
- **Next.js Example** - Full SSR/SSG/CSR demonstration
- **React Example** - Client-side rendering showcase
- **Mock Backend** - AI translation service with OpenAI/Gemini

### 🧪 Testing

#### Test Coverage
- **Unit Tests** - Jest with React Testing Library
- **Integration Tests** - End-to-end scenarios
- **Type Tests** - TypeScript compilation validation

### 📄 License

- **Apache-2.0** - Open core friendly license
- **Commercial Use** - Permitted with attribution
- **Modification** - Allowed with license preservation

### 🔗 Links

- **NPM Package** - `npm install rustle.dev`
- **GitHub Repository** - https://github.com/rustledotdev/rustle.dev
- **Documentation** - https://rustle.dev/docs
- **Website** - https://rustle.dev

---

### Migration Guide

This is the initial release, so no migration is required. For future versions, migration guides will be provided here.

### Breaking Changes

None - this is the initial stable release.

### Deprecations

None - this is the initial stable release.

### Known Issues

None currently identified. Please report issues on GitHub.

---

**Full Changelog**: https://github.com/rustledotdev/rustle.dev/commits/v1.0.0
