import { JSX as JSX_2 } from 'react/jsx-runtime';
import { z } from 'zod';

/**
 * Get locale from cookie (works in both browser and server environments)
 */
export declare function getLocaleFromCookie(cookieString?: string): Locale | null;

export declare type Locale = z.infer<typeof LocaleSchema>;

declare const LocaleSchema: z.ZodString;

/**
 * RustleBox - SIMPLE APPROACH (Back to Basics)
 *
 * Based on requirements from AI-startup.md and react-dom.md:
 * - Only use cookie-based locale detection (rustle-locale cookie)
 * - Simple React Virtual DOM approach with AutoTranslate
 * - No complex client-side hooks (useEffect, useState)
 * - Works with SSR, CSR, SSG, ISR
 * - Static translations first, API calls as fallback
 */
export declare function RustleBox({ children, sourceLanguage, targetLanguages, apiKey, // Required, no default value
    model, debug, auto, fallback, initialLocale, serverLocale, useVirtualDOM, localeBasePath, loadingConfig, }: RustleBoxProps): JSX_2.Element;

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

declare const RustleConfigSchema: z.ZodObject<{
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

/**
 * Main hook for accessing Rustle functionality
 */
export declare function useRustle(): UseRustleReturn;

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
