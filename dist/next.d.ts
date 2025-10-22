import { default as default_2 } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';
import { Metadata } from 'next';
import { NextConfig } from 'next';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ReactNode } from 'react';
import { z } from 'zod';

export declare type AIModel = z.infer<typeof AIModelSchema>;

export declare const AIModelSchema: z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>;

export declare type AutoConfig = z.infer<typeof AutoConfigSchema>;

export declare const AutoConfigSchema: z.ZodObject<{
    exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    exclude?: string[] | undefined;
    include?: string[] | undefined;
}, {
    exclude?: string[] | undefined;
    include?: string[] | undefined;
}>;

/**
 * Create locale-aware getStaticProps helper
 */
export declare function createLocaleAwareGetStaticProps<T = any>(getProps: (context: {
    locale: Locale_2;
    cleanSlug: string[];
    params: any;
}) => Promise<{
    props: T;
}> | {
    props: T;
}): (context: any) => Promise<{
    props: T & {
        locale: any;
        pathWithoutLocale: string;
    };
} | {
    props: T & {
        locale: any;
        pathWithoutLocale: string;
    };
}>;

/**
 * Next.js middleware helper for locale detection and redirection
 */
export declare function createLocaleMiddleware(options?: ServerTranslationOptions): (request: any) => {
    locale: string;
    cookieHeader: string;
};

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
export declare function createPathBasedMiddleware(config: NextPathBasedMiddlewareConfig): (request: NextRequest) => NextResponse<unknown>;

/**
 * Create server-side cookie header for setting locale
 */
export declare function createServerLocaleCookie(locale: Locale, options?: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}): string;

/**
 * Create server-side locale cookie header
 */
export declare function createServerLocaleHeader(locale: Locale): string;

/**
 * Extract locale and clean slug from Next.js params
 */
export declare function extractLocaleFromParams(params: {
    slug?: string[];
}, config: {
    supportedLocales: Locale_2[];
    defaultLocale: Locale_2;
}): {
    locale: Locale_2;
    cleanSlug: string[];
};

export declare type FallbackConfig = z.infer<typeof FallbackConfigSchema>;

export declare const FallbackConfigSchema: z.ZodObject<{
    exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    exclude?: string[] | undefined;
    include?: string[] | undefined;
}, {
    exclude?: string[] | undefined;
    include?: string[] | undefined;
}>;

export declare const GeminiModelSchema: z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>;

/**
 * Generate alternate language links for SEO
 */
export declare function generateAlternateLanguages(baseUrl: string, supportedLocales: Locale_2[], currentPath?: string): Record<string, string>;

/**
 * Generate hreflang links for international SEO
 */
export declare function generateHreflangLinks(baseUrl: string, supportedLocales: Locale_2[], currentPath?: string, defaultLocale?: Locale_2): Array<{
    rel: string;
    hrefLang: string;
    href: string;
}>;

/**
 * Hook for dynamic metadata generation in Next.js pages
 */
export declare function generatePageMetadata(params: {
    locale?: string;
}, config: {
    title: string;
    description: string;
    keywords?: string[];
    baseUrl: string;
    supportedLocales: Locale_2[];
    defaultLocale?: Locale_2;
    siteName?: string;
    localeBasePath?: string;
}): Promise<Metadata>;

/**
 * Complete metadata generator with SEO optimization
 */
export declare function generateSEOMetadata(config: {
    title: string;
    description: string;
    keywords?: string[];
    baseUrl: string;
    currentPath?: string;
    supportedLocales: Locale_2[];
    defaultLocale?: Locale_2;
    siteName?: string;
    locale?: Locale_2;
    localeBasePath?: string;
    fallback?: boolean;
}): Promise<Metadata>;

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
export declare function generateStaticPathsForLocales(basePaths: Array<{
    slug: string[];
}>, config: {
    supportedLocales: Locale_2[];
    defaultLocale: Locale_2;
    includeDefaultLocaleInPath?: boolean;
}): Array<{
    params: {
        slug: string[];
    };
    locale: Locale_2;
}>;

/**
 * Generate translated metadata for Next.js pages
 * Optimized for SEO with server-side translation
 */
export declare function generateTranslatedMetadata(baseMetadata: {
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
}, options?: {
    locale?: Locale_2;
    localeBasePath?: string;
    fallback?: boolean;
}): Promise<Metadata>;

/**
 * Generate server-side translation script for hydration
 */
export declare function generateTranslationScript(locale: Locale_2, localeData: Record<string, string>): string;

/**
 * Get locale from cookie (works in both browser and server environments)
 */
export declare function getLocaleFromCookie(cookieString?: string): Locale | null;

/**
 * Get locale information from Next.js request in pages/components
 */
export declare function getLocaleFromNextRequest(request: NextRequest): {
    locale: Locale_2;
    pathWithoutLocale: string;
    alternateLinks: Array<{
        locale: Locale_2;
        href: string;
        hreflang: string;
    }>;
};

/**
 * Pages Router helper for getServerSideProps
 */
export declare function getRustleServerSideProps(context: any): Promise<{
    props: {
        rustleLocale: string | null;
        rustleLocaleData: Record<string, string> | null;
    };
}>;

/**
 * Pages Router helper for getStaticProps
 */
export declare function getRustleStaticProps(locale: string): Promise<{
    props: {
        rustleLocale: string;
        rustleLocaleData: Record<string, string> | null;
    };
}>;

/**
 * Get locale from server request
 */
export declare function getServerLocale(cookieHeader: string | undefined, acceptLanguageHeader: string | undefined, options?: ServerTranslationOptions): Locale;

/**
 * Server-side helper to get locale from request
 */
export declare function getServerSideLocale(req: any): string | null;

/**
 * Inject translations into HTML string (for SSR)
 */
export declare function injectServerTranslations(html: string, localeData: LocaleData | null, options?: {
    debug?: boolean;
}): string;

export declare const LegacyModelSchema: z.ZodEnum<["openai", "gemini", "azure"]>;

/**
 * Load locale data on the server
 */
export declare function loadServerLocaleData(locale: Locale, options?: ServerTranslationOptions): Promise<LocaleData | null>;

/**
 * Server-side helper to load locale data
 */
export declare function loadServerSideLocaleData(locale: string): Promise<Record<string, string> | null>;

export declare type Locale = z.infer<typeof LocaleSchema>;

declare type Locale_2 = z.infer<typeof LocaleSchema_2>;

export declare type LocaleData = z.infer<typeof LocaleDataSchema>;

export declare const LocaleDataSchema: z.ZodRecord<z.ZodString, z.ZodString>;

export declare const LocaleSchema: z.ZodString;

declare const LocaleSchema_2: z.ZodString;

export declare type MasterMetadata = z.infer<typeof MasterMetadataSchema>;

export declare const MasterMetadataSchema: z.ZodObject<{
    version: z.ZodString;
    sourceLanguage: z.ZodString;
    targetLanguages: z.ZodArray<z.ZodString, "many">;
    entries: z.ZodArray<z.ZodObject<{
        fingerprint: z.ZodString;
        source: z.ZodString;
        file: z.ZodString;
        loc: z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            start: number;
            end: number;
        }, {
            start: number;
            end: number;
        }>;
        contentHash: z.ZodString;
        version: z.ZodNumber;
        translations: z.ZodRecord<z.ZodString, z.ZodString>;
        lastTranslatedAt: z.ZodOptional<z.ZodString>;
        tags: z.ZodArray<z.ZodString, "many">;
        status: z.ZodEnum<["translated", "missing", "updated"]>;
    }, "strip", z.ZodTypeAny, {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }, {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }>, "many">;
    lastUpdated: z.ZodString;
}, "strip", z.ZodTypeAny, {
    entries: {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }[];
    sourceLanguage: string;
    targetLanguages: string[];
    version: string;
    lastUpdated: string;
}, {
    entries: {
        status: "translated" | "missing" | "updated";
        fingerprint: string;
        source: string;
        file: string;
        loc: {
            start: number;
            end: number;
        };
        contentHash: string;
        version: number;
        translations: Record<string, string>;
        tags: string[];
        lastTranslatedAt?: string | undefined;
    }[];
    sourceLanguage: string;
    targetLanguages: string[];
    version: string;
    lastUpdated: string;
}>;

export declare type ModelConfig = z.infer<typeof ModelConfigSchema>;

export declare const ModelConfigSchema: z.ZodRecord<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>, z.ZodRecord<z.ZodString, z.ZodString>>;

export declare interface NextPathBasedMiddlewareConfig extends Omit<PathBasedRoutingConfig, 'enabled'> {
    supportedLocales: Locale_2[];
    defaultLocale: Locale_2;
    excludePaths?: string[];
    includeDefaultLocaleInPath?: boolean;
    redirectToDefaultLocale?: boolean;
    cookieName?: string;
    debug?: boolean;
}

export declare const OpenAIModelSchema: z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>;

/**
 * Parse all cookies from cookie string
 */
export declare function parseCookies(cookieString: string): Record<string, string>;

/**
 * Path-based routing configuration options
 */
declare interface PathBasedRoutingConfig {
    enabled: boolean;
    supportedLocales?: Locale_2[];
    defaultLocale?: Locale_2;
    excludePaths?: string[];
    includeDefaultLocaleInPath?: boolean;
    redirectToDefaultLocale?: boolean;
}

/**
 * Remove locale cookie (browser only)
 */
export declare function removeLocaleFromCookie(): void;

export declare interface RustleBoxProps extends Partial<Omit<RustleConfig, 'apiKey'>> {
    children: React.ReactNode;
    apiKey: string;
    initialLocale?: Locale;
    serverLocale?: Locale;
    useVirtualDOM?: boolean;
    localeBasePath?: string;
    loadingConfig?: any;
}

export declare type RustleConfig = z.infer<typeof RustleConfigSchema>;

declare type RustleConfig_2 = z.infer<typeof RustleConfigSchema_2>;

export declare const RustleConfigSchema: z.ZodObject<{
    deactivate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    targetLanguages: z.ZodArray<z.ZodString, "many">;
    currentLocale: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodString;
    model: z.ZodDefault<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>>;
    modelConfig: z.ZodOptional<z.ZodRecord<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>, z.ZodRecord<z.ZodString, z.ZodString>>>;
    debug: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    auto: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    autoConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    fallback: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    fallbackConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    localeBasePath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    useVirtualDOM: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    deactivate: boolean;
    sourceLanguage: string;
    targetLanguages: string[];
    apiKey: string;
    model: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure";
    debug: boolean;
    auto: boolean;
    fallback: boolean;
    localeBasePath: string;
    useVirtualDOM: boolean;
    currentLocale?: string | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
}, {
    targetLanguages: string[];
    apiKey: string;
    deactivate?: boolean | undefined;
    sourceLanguage?: string | undefined;
    currentLocale?: string | undefined;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    debug?: boolean | undefined;
    auto?: boolean | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallback?: boolean | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    localeBasePath?: string | undefined;
    useVirtualDOM?: boolean | undefined;
}>;

declare const RustleConfigSchema_2: z.ZodObject<{
    deactivate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    sourceLanguage: z.ZodDefault<z.ZodString>;
    targetLanguages: z.ZodArray<z.ZodString, "many">;
    currentLocale: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodString;
    model: z.ZodDefault<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>>;
    modelConfig: z.ZodOptional<z.ZodRecord<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>, z.ZodRecord<z.ZodString, z.ZodString>>>;
    debug: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    auto: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    autoConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    fallback: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    fallbackConfig: z.ZodOptional<z.ZodObject<{
        exclude: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        include: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }, {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    }>>;
    localeBasePath: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    useVirtualDOM: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    deactivate: boolean;
    sourceLanguage: string;
    targetLanguages: string[];
    apiKey: string;
    model: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure";
    debug: boolean;
    auto: boolean;
    fallback: boolean;
    localeBasePath: string;
    useVirtualDOM: boolean;
    currentLocale?: string | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
}, {
    targetLanguages: string[];
    apiKey: string;
    deactivate?: boolean | undefined;
    sourceLanguage?: string | undefined;
    currentLocale?: string | undefined;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
    modelConfig?: Partial<Record<"gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure", Record<string, string>>> | undefined;
    debug?: boolean | undefined;
    auto?: boolean | undefined;
    autoConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    fallback?: boolean | undefined;
    fallbackConfig?: {
        exclude?: string[] | undefined;
        include?: string[] | undefined;
    } | undefined;
    localeBasePath?: string | undefined;
    useVirtualDOM?: boolean | undefined;
}>;

export declare interface RustleContextType {
    config: RustleConfig;
    currentLocale: Locale;
    setLocale: (locale: Locale) => void;
    localeData: Record<Locale, LocaleData>;
    isLoading: boolean;
    error: string | null;
}

/**
 * Create a Next.js plugin for Rustle
 */
export declare function rustleEngine(rustleConfig: RustleNextConfig): (nextConfig?: NextConfig) => NextConfig;

export declare interface RustleGoProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
    cache?: boolean;
}

/**
 * Next.js plugin configuration
 */
export declare interface RustleNextConfig extends Partial<RustleConfig_2> {
    extractOnBuild?: boolean;
    translateOnBuild?: boolean;
    outputDir?: string;
}

/**
 * App Router helper component for server-side rendering
 */
export declare function RustleServerProvider({ children, locale, localeData }: {
    children: default_2.ReactNode;
    locale?: string;
    localeData?: Record<string, string>;
}): default_2.FunctionComponentElement<{
    children?: default_2.ReactNode | undefined;
}>;

/**
 * Server-side translation component for Next.js
 * Renders translated content directly in the HTML for SEO
 */
export declare function ServerTranslate({ children, text, locale, localeBasePath, fallback, tag: Tag, className, ...props }: ServerTranslateProps): Promise<JSX_2.Element>;

declare interface ServerTranslateProps {
    children: ReactNode;
    text?: string;
    locale?: Locale_2;
    localeBasePath?: string;
    fallback?: boolean;
    tag?: keyof JSX.IntrinsicElements;
    className?: string;
    [key: string]: any;
}

/**
 * Server component wrapper that injects translations into HTML
 */
export declare function ServerTranslateWrapper({ children, locale, localeBasePath, }: {
    children: ReactNode;
    locale?: Locale_2;
    localeBasePath?: string;
}): Promise<JSX_2.Element>;

/**
 * Server-side translation utilities for Next.js and other SSR frameworks
 */
declare interface ServerTranslationOptions {
    localeBasePath?: string;
    sourceLanguage?: Locale;
    targetLanguages?: Locale[];
    fallback?: boolean;
    debug?: boolean;
}

/**
 * Set locale in cookie (browser only)
 */
export declare function setLocaleToCookie(locale: Locale, options?: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
}): void;

export declare interface TranslatedHTMLProps {
    html: string;
    tag?: keyof JSX.IntrinsicElements;
    className?: string;
    style?: React.CSSProperties;
    cache?: boolean;
    fallback?: string;
    [key: string]: any;
}

/**
 * Next.js page wrapper with server-side translation support
 */
export declare function TranslatedPage({ children, locale, localeBasePath, injectScript, }: {
    children: ReactNode;
    locale?: Locale_2;
    localeBasePath?: string;
    injectScript?: boolean;
}): Promise<JSX_2.Element>;

/**
 * Server-side translation function
 */
export declare function translateServer(fingerprint: string, originalText: string, localeData: LocaleData | null, fallback?: boolean): string;

/**
 * Server-side translation for metadata and structured content
 */
export declare function translateServerText(text: string, locale?: Locale_2, localeBasePath?: string, fallback?: boolean): Promise<string>;

/**
 * Batch server-side translation for multiple texts
 */
export declare function translateServerTexts(texts: string[], locale?: Locale_2, localeBasePath?: string, fallback?: boolean): Promise<Record<string, string>>;

export declare type TranslationEntry = z.infer<typeof TranslationEntrySchema>;

export declare const TranslationEntrySchema: z.ZodObject<{
    fingerprint: z.ZodString;
    source: z.ZodString;
    file: z.ZodString;
    loc: z.ZodObject<{
        start: z.ZodNumber;
        end: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        start: number;
        end: number;
    }, {
        start: number;
        end: number;
    }>;
    contentHash: z.ZodString;
    version: z.ZodNumber;
    translations: z.ZodRecord<z.ZodString, z.ZodString>;
    lastTranslatedAt: z.ZodOptional<z.ZodString>;
    tags: z.ZodArray<z.ZodString, "many">;
    status: z.ZodEnum<["translated", "missing", "updated"]>;
}, "strip", z.ZodTypeAny, {
    status: "translated" | "missing" | "updated";
    fingerprint: string;
    source: string;
    file: string;
    loc: {
        start: number;
        end: number;
    };
    contentHash: string;
    version: number;
    translations: Record<string, string>;
    tags: string[];
    lastTranslatedAt?: string | undefined;
}, {
    status: "translated" | "missing" | "updated";
    fingerprint: string;
    source: string;
    file: string;
    loc: {
        start: number;
        end: number;
    };
    contentHash: string;
    version: number;
    translations: Record<string, string>;
    tags: string[];
    lastTranslatedAt?: string | undefined;
}>;

export declare type TranslationRequest = z.infer<typeof TranslationRequestSchema>;

export declare const TranslationRequestSchema: z.ZodObject<{
    entries: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        context: z.ZodOptional<z.ZodObject<{
            tags: z.ZodArray<z.ZodString, "many">;
            file: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            file: string;
            tags: string[];
        }, {
            file: string;
            tags: string[];
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }, {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }>, "many">;
    sourceLanguage: z.ZodString;
    targetLanguage: z.ZodString;
    model: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>, z.ZodEnum<["gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro", "gemini-pro-vision"]>, z.ZodEnum<["openai", "gemini", "azure"]>]>>;
}, "strip", z.ZodTypeAny, {
    entries: {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }[];
    sourceLanguage: string;
    targetLanguage: string;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
}, {
    entries: {
        id: string;
        text: string;
        context?: {
            file: string;
            tags: string[];
        } | undefined;
    }[];
    sourceLanguage: string;
    targetLanguage: string;
    model?: "gpt-4" | "gpt-4-turbo" | "gpt-4-turbo-preview" | "gpt-3.5-turbo" | "gpt-3.5-turbo-16k" | "gemini-1.5-pro" | "gemini-1.5-flash" | "gemini-pro" | "gemini-pro-vision" | "openai" | "gemini" | "azure" | undefined;
}>;

export declare type TranslationResponse = z.infer<typeof TranslationResponseSchema>;

export declare const TranslationResponseSchema: z.ZodObject<{
    translations: z.ZodRecord<z.ZodString, z.ZodString>;
    success: z.ZodBoolean;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    translations: Record<string, string>;
    success: boolean;
    error?: string | undefined;
}, {
    translations: Record<string, string>;
    success: boolean;
    error?: string | undefined;
}>;

export declare interface UseRustleReturn {
    currentLocale: Locale;
    setLocale: (locale: Locale) => void;
    translate: (text: string, targetLocale?: Locale, options?: {
        cache?: boolean;
        context?: {
            tags?: string[];
            file?: string;
        };
    }) => Promise<string>;
    translateBatch?: (texts: Array<{
        id: string;
        text: string;
        context?: {
            tags?: string[];
            file?: string;
        };
    }>, targetLocale?: Locale, options?: {
        cache?: boolean;
        retryCount?: number;
        requestKey?: string;
    }) => Promise<Record<string, string>>;
    clearCache?: () => void;
    isLoading: boolean;
    error: string | null;
}

export { }
