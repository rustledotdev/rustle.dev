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
 * Next.js middleware helper for locale detection and redirection
 */
export declare function createLocaleMiddleware(options?: ServerTranslationOptions): (request: any) => {
    locale: string;
    cookieHeader: string;
};

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
 * Get locale from cookie (works in both browser and server environments)
 */
export declare function getLocaleFromCookie(cookieString?: string): Locale | null;

/**
 * Get locale from server request
 */
export declare function getServerLocale(cookieHeader: string | undefined, acceptLanguageHeader: string | undefined, options?: ServerTranslationOptions): Locale;

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

export declare type Locale = z.infer<typeof LocaleSchema>;

export declare type LocaleData = z.infer<typeof LocaleDataSchema>;

export declare const LocaleDataSchema: z.ZodRecord<z.ZodString, z.ZodString>;

export declare const LocaleSchema: z.ZodString;

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

export declare const OpenAIModelSchema: z.ZodEnum<["gpt-4", "gpt-4-turbo", "gpt-4-turbo-preview", "gpt-3.5-turbo", "gpt-3.5-turbo-16k"]>;

/**
 * Parse all cookies from cookie string
 */
export declare function parseCookies(cookieString: string): Record<string, string>;

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

export declare interface RustleContextType {
    config: RustleConfig;
    currentLocale: Locale;
    setLocale: (locale: Locale) => void;
    localeData: Record<Locale, LocaleData>;
    isLoading: boolean;
    error: string | null;
}

export declare interface RustleGoProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    className?: string;
    cache?: boolean;
}

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
 * Server-side translation function
 */
export declare function translateServer(fingerprint: string, originalText: string, localeData: LocaleData | null, fallback?: boolean): string;

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
