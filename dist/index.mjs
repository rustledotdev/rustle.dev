"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { a as useRustleContext, d as defaultStorageManager, c as createAPIClient } from "./useRustle-Cz31Xw9D.mjs";
import { A, b, R, S, u } from "./useRustle-Cz31Xw9D.mjs";
import { jsx } from "react/jsx-runtime";
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { d as cleanTranslationWithContext, b as cleanBatchTranslations, s as sanitizeHTML } from "./fingerprinting-iGOd0RNQ.mjs";
import { A as AdvancedPathLocaleManager, P as PathLocaleManager, U as UniversalLocaleManager } from "./localeUtils-BV0jqWwo.mjs";
import { M, S as S2, c, a, e, i } from "./localeUtils-BV0jqWwo.mjs";
import { g as getLocaleFromCookie, s as setLocaleToCookie } from "./cookies-C2ACDSut.mjs";
import { r } from "./cookies-C2ACDSut.mjs";
import { R as RustleConfigSchema } from "./index-B8ciGoAd.mjs";
const isServer = typeof window === "undefined";
function applyRustle() {
  const context = useRustleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingTranslations] = useState(/* @__PURE__ */ new Map());
  const { config, currentLocale, setLocale, localeData } = context;
  const staticTranslations = useMemo(() => {
    if (isServer) {
      return localeData[currentLocale] || {};
    }
    return localeData[currentLocale] || {};
  }, [currentLocale, localeData]);
  const shouldUseDynamicTranslation = useMemo(() => {
    if (isServer) {
      return config.enableSSRDynamicTranslation === true;
    }
    return true;
  }, [config]);
  const translate = useCallback(async (text, targetLocale, options) => {
    if (config.deactivate) {
      return text;
    }
    const target = targetLocale || currentLocale;
    const cacheEnabled = (options == null ? void 0 : options.cache) !== false;
    if (target === config.sourceLanguage) {
      return text;
    }
    const staticTranslation = staticTranslations[text];
    if (staticTranslation) {
      if (config.debug) {
        console.log(`📁 applyRustle: Using static translation for "${text}" -> "${staticTranslation}"`);
      }
      return staticTranslation;
    }
    const localeTranslations = localeData[target];
    if (localeTranslations) {
      if (localeTranslations[text]) {
        if (config.debug) {
          console.log(`📁 applyRustle: Using locale file translation for "${text}" -> "${localeTranslations[text]}"`);
        }
        return localeTranslations[text];
      }
      for (const [key, value] of Object.entries(localeTranslations)) {
        if (typeof value === "string" && (value === text || key === text)) {
          if (config.debug) {
            console.log(`📁 applyRustle: Using locale file text match for "${text}" -> "${value}"`);
          }
          return value;
        }
      }
    }
    if (isServer && !shouldUseDynamicTranslation) {
      if (config.debug) {
        console.log(`⚡ applyRustle: SSR mode - returning original text for "${text}"`);
      }
      return text;
    }
    const cacheKey = `${text}_${config.sourceLanguage}_${target}`;
    if (pendingTranslations.has(cacheKey)) {
      return pendingTranslations.get(cacheKey);
    }
    if (cacheEnabled) {
      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        text,
        config.sourceLanguage,
        target
      );
      if (cachedTranslation) {
        return cachedTranslation;
      }
    }
    const translationPromise = performTranslation(text, target, options);
    pendingTranslations.set(cacheKey, translationPromise);
    try {
      const result = await translationPromise;
      return result;
    } finally {
      pendingTranslations.delete(cacheKey);
    }
  }, [config, currentLocale, localeData, pendingTranslations]);
  const performTranslation = async (text, target, options) => {
    setIsLoading(true);
    setError(null);
    const maxRetries = 3;
    const retryCount = (options == null ? void 0 : options.retryCount) || 0;
    if ((options == null ? void 0 : options.cache) !== false) {
      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        text,
        config.sourceLanguage,
        target
      );
      if (cachedTranslation) {
        if (config.debug) {
          console.log(`💾 applyRustle: Using cached translation for "${text}" -> "${cachedTranslation}"`);
        }
        setIsLoading(false);
        return cachedTranslation;
      }
    }
    const staticFallback = staticTranslations[text];
    if (staticFallback) {
      if (config.debug) {
        console.log(`📁 applyRustle: Using static translation for "${text}" -> "${staticFallback}"`);
      }
      if ((options == null ? void 0 : options.cache) !== false) {
        defaultStorageManager.cacheTranslation(
          text,
          config.sourceLanguage,
          target,
          staticFallback
        );
      }
      setIsLoading(false);
      return staticFallback;
    }
    try {
      if (!config.apiKey) {
        throw new Error("API key is required. Please provide apiKey in RustleBox configuration.");
      }
      const apiClient = createAPIClient({
        apiKey: config.apiKey
      });
      const rawTranslation = await apiClient.translateSingle(
        text,
        config.sourceLanguage,
        target,
        config.model,
        options == null ? void 0 : options.context
      );
      const translation = cleanTranslationWithContext(rawTranslation, {
        originalText: text,
        targetLanguage: target,
        sourceLanguage: config.sourceLanguage,
        isHTML: false
      });
      if ((options == null ? void 0 : options.cache) !== false) {
        defaultStorageManager.cacheTranslation(
          text,
          config.sourceLanguage,
          target,
          translation
        );
      }
      if (config.debug) {
        console.log(`🌐 applyRustle: API translated "${text}" to "${translation}" (${target})`);
      }
      setIsLoading(false);
      return translation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Translation failed";
      if (config.debug) {
        console.error(`❌ applyRustle: Translation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      }
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1e3;
        if (config.debug) {
          console.log(`🔄 applyRustle: Retrying in ${delay}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        return performTranslation(text, target, { ...options, retryCount: retryCount + 1 });
      }
      const staticFallback2 = staticTranslations[text];
      if (staticFallback2) {
        if (config.debug) {
          console.log(`🔄 applyRustle: Using static translation fallback for "${text}"`);
        }
        setIsLoading(false);
        return staticFallback2;
      }
      setError(errorMessage);
      setIsLoading(false);
      if (config.fallback) {
        if (config.debug) {
          console.log(`🔄 applyRustle: Using original text fallback for "${text}"`);
        }
        return text;
      }
      throw new Error(errorMessage);
    }
  };
  const translateBatch = useCallback(async (texts, targetLocale, options) => {
    if (config.deactivate) {
      return texts.reduce((acc, { id, text }) => ({ ...acc, [id]: text }), {});
    }
    const target = targetLocale || currentLocale;
    const cacheEnabled = (options == null ? void 0 : options.cache) !== false;
    const maxRetries = 3;
    const retryCount = (options == null ? void 0 : options.retryCount) || 0;
    if (target === config.sourceLanguage) {
      return texts.reduce((acc, { id, text }) => ({ ...acc, [id]: text }), {});
    }
    setIsLoading(true);
    setError(null);
    try {
      if (!config.apiKey) {
        throw new Error("API key is required. Please provide apiKey in RustleBox configuration.");
      }
      const apiClient = createAPIClient({
        apiKey: config.apiKey
      });
      const response = await apiClient.translateBatch({
        entries: texts.map((t) => ({
          id: t.id,
          text: t.text,
          context: t.context ? {
            tags: t.context.tags || [],
            file: t.context.file || ""
          } : void 0
        })),
        sourceLanguage: config.sourceLanguage,
        targetLanguage: target,
        model: config.model
      }, options == null ? void 0 : options.requestKey);
      if (!response.success) {
        throw new Error(response.error || "Batch translation failed");
      }
      const cleanedTranslations = cleanBatchTranslations(response.translations);
      if (cacheEnabled) {
        Object.entries(cleanedTranslations).forEach(([id, translation]) => {
          var _a;
          const originalText = (_a = texts.find((t) => t.id === id)) == null ? void 0 : _a.text;
          if (originalText) {
            defaultStorageManager.cacheTranslation(
              originalText,
              config.sourceLanguage,
              target,
              translation
            );
          }
        });
      }
      if (config.debug) {
        console.log(`🔄 applyRustle: Batch translated ${Object.keys(cleanedTranslations).length} texts to ${target} (cleaned)`);
      }
      setIsLoading(false);
      return cleanedTranslations;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Batch translation failed";
      if (config.debug) {
        console.error(`❌ applyRustle: Batch translation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
      }
      if (retryCount < maxRetries) {
        const delay = Math.pow(2, retryCount) * 1e3;
        if (config.debug) {
          console.log(`🔄 applyRustle: Retrying batch translation in ${delay}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        return translateBatch(texts, targetLocale, { ...options, retryCount: retryCount + 1 });
      }
      const fallbackTranslations = {};
      let hasStaticFallbacks = false;
      texts.forEach(({ id, text }) => {
        const staticFallback = staticTranslations[text];
        if (staticFallback) {
          fallbackTranslations[id] = staticFallback;
          hasStaticFallbacks = true;
          if (config.debug) {
            console.log(`🔄 applyRustle: Using static translation fallback for "${text}"`);
          }
        } else if (config.fallback) {
          fallbackTranslations[id] = text;
        }
      });
      if (hasStaticFallbacks || config.fallback) {
        setIsLoading(false);
        if (config.debug) {
          console.log(`🔄 applyRustle: Returning ${Object.keys(fallbackTranslations).length} fallback translations`);
        }
        return fallbackTranslations;
      }
      setError(errorMessage);
      setIsLoading(false);
      throw new Error(errorMessage);
    }
  }, [config, currentLocale, staticTranslations]);
  const clearCache = useCallback(() => {
    defaultStorageManager.clearCache();
    if (config.debug) {
      console.log("🧹 applyRustle: Translation cache cleared");
    }
  }, [config.debug]);
  return {
    currentLocale,
    setLocale,
    translate,
    translateBatch,
    clearCache,
    isLoading: isLoading || context.isLoading,
    error: error || context.error
  };
}
function simpleHash(input) {
  let hash = 0;
  if (input.length === 0) return hash.toString();
  for (let i2 = 0; i2 < input.length; i2++) {
    const char = input.charCodeAt(i2);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
function generateFingerprint(filePath, startPosition) {
  const input = `${filePath}:${startPosition}`;
  return `fp_${simpleHash(input)}`;
}
function generateContentHash(text) {
  const normalizedText = text.trim().toLowerCase();
  return `ch_${simpleHash(normalizedText)}`;
}
function extractTags(element) {
  const tags = [];
  let current = element;
  while (current && current !== document.body) {
    tags.unshift(current.tagName.toLowerCase());
    current = current.parentElement;
  }
  return tags.slice(0, 5);
}
function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ").replace(/\n/g, " ").trim();
}
function isTranslatableText(text) {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  if (/^[\d\s\p{P}\p{S}]+$/u.test(normalized)) return false;
  if (normalized.length < 2) return false;
  if (/^[A-Z_][A-Z0-9_]*$/.test(normalized)) return false;
  return true;
}
function generateTranslationId() {
  return `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
function RustleGo({
  children,
  fallback,
  className,
  cache = true
  // Default to true for cost optimization
}) {
  const context = useRustleContext();
  const { translate, translateBatch, isLoading } = applyRustle();
  const [translatedContent, setTranslatedContent] = useState(children);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const translationCacheRef = useRef(/* @__PURE__ */ new Map());
  const batchQueueRef = useRef([]);
  const batchTimeoutRef = useRef(null);
  const currentRequestKeyRef = useRef(null);
  const { config, currentLocale, localeData } = context;
  const lastLocaleRef = useRef(currentLocale);
  const forceRetranslateRef = useRef(false);
  const staticTranslations = localeData[currentLocale] || {};
  useEffect(() => {
    const handleLocaleChange = (event) => {
      var _a;
      const newLocale = (_a = event.detail) == null ? void 0 : _a.locale;
      if (newLocale && newLocale !== lastLocaleRef.current) {
        console.log("🔄 RustleGo: Detected global locale change, forcing re-translation");
        forceRetranslateRef.current = true;
        lastLocaleRef.current = newLocale;
      }
    };
    window.addEventListener("rustleLocaleChanged", handleLocaleChange);
    return () => {
      window.removeEventListener("rustleLocaleChanged", handleLocaleChange);
    };
  }, []);
  useEffect(() => {
    if (config.deactivate) {
      setTranslatedContent(children);
      return;
    }
    if (currentLocale === config.sourceLanguage) {
      setTranslatedContent(children);
      return;
    }
    const localeChanged = currentLocale !== lastLocaleRef.current;
    const shouldForceRetranslate = forceRetranslateRef.current;
    lastLocaleRef.current = currentLocale;
    if (shouldForceRetranslate) {
      forceRetranslateRef.current = false;
    }
    const translateContent = async () => {
      try {
        setError(null);
        if (config.debug && (localeChanged || shouldForceRetranslate)) {
          console.log(`🔄 RustleGo: Re-translating dynamic content to ${currentLocale}`);
        }
        if (currentRequestKeyRef.current) {
          if (config.debug) {
            console.log(`🚫 RustleGo: Cancelling ongoing batch request: ${currentRequestKeyRef.current}`);
          }
          currentRequestKeyRef.current = null;
        }
        if (batchTimeoutRef.current) {
          clearTimeout(batchTimeoutRef.current);
          batchTimeoutRef.current = null;
        }
        if (batchQueueRef.current.length > 0) {
          const cancelledBatch = [...batchQueueRef.current];
          batchQueueRef.current = [];
          cancelledBatch.forEach((item) => {
            item.reject(new Error("Translation cancelled due to locale change"));
          });
          if (config.debug) {
            console.log(`🚫 RustleGo: Cancelled ${cancelledBatch.length} pending batch items`);
          }
        }
        if (localeChanged || shouldForceRetranslate) {
          translationCacheRef.current.clear();
        }
        const translatedNode = await translateReactNode(children);
        setTranslatedContent(translatedNode);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Translation failed";
        setError(errorMessage);
        if (config.debug) {
          console.error("RustleGo: Translation error:", err);
        }
        if (config.fallback) {
          setTranslatedContent(fallback || children);
        }
      }
    };
    translateContent();
  }, [children, currentLocale, config, fallback]);
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchQueueRef.current = [];
      currentRequestKeyRef.current = null;
    };
  }, []);
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);
  const translateTextBatched = async (text) => {
    const normalizedText = normalizeText(text);
    if (!isTranslatableText(normalizedText)) {
      return text;
    }
    const cacheKey = `${normalizedText}_${currentLocale}`;
    if (cache && translationCacheRef.current.has(cacheKey)) {
      if (config.debug) {
        console.log(`💾 RustleGo: Using cached translation for "${normalizedText}"`);
      }
      return translationCacheRef.current.get(cacheKey);
    }
    const staticTranslation = staticTranslations[normalizedText];
    if (staticTranslation) {
      if (config.debug) {
        console.log(`📁 RustleGo: Using static translation for "${normalizedText}" -> "${staticTranslation}"`);
      }
      if (cache) {
        translationCacheRef.current.set(cacheKey, staticTranslation);
      }
      return staticTranslation;
    }
    return new Promise((resolve, reject) => {
      const wrappedReject = (error2) => {
        if (error2.message.includes("cancelled")) {
          if (config.fallback) {
            resolve(text);
          } else {
            reject(error2);
          }
        } else {
          reject(error2);
        }
      };
      batchQueueRef.current.push({ text: normalizedText, resolve, reject: wrappedReject });
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
      batchTimeoutRef.current = setTimeout(async () => {
        const batch = [...batchQueueRef.current];
        batchQueueRef.current = [];
        if (batch.length === 0) return;
        const requestKey = `rustlego_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        currentRequestKeyRef.current = requestKey;
        try {
          const batchEntries = batch.map((item, index) => ({
            id: `batch_${index}`,
            text: item.text,
            context: { tags: [], file: "dynamic" }
          }));
          if (!translateBatch) {
            throw new Error("translateBatch function is not available");
          }
          const translations = await translateBatch(batchEntries, currentLocale, { cache, requestKey });
          if (currentRequestKeyRef.current !== requestKey) {
            if (config.debug) {
              console.log(`🚫 RustleGo: Batch request ${requestKey} was cancelled, ignoring results`);
            }
            batch.forEach((item) => {
              item.reject(new Error("Translation request was cancelled"));
            });
            return;
          }
          currentRequestKeyRef.current = null;
          batch.forEach((item, index) => {
            const translation = translations[`batch_${index}`] || item.text;
            if (cache) {
              const cacheKey2 = `${item.text}_${currentLocale}`;
              translationCacheRef.current.set(cacheKey2, translation);
            }
            item.resolve(translation);
          });
          if (config.debug) {
            console.log(`🌐 RustleGo: Batch translated ${batch.length} items with key ${requestKey}`);
          }
        } catch (error2) {
          if (currentRequestKeyRef.current !== requestKey) {
            if (config.debug) {
              console.log(`🚫 RustleGo: Batch request ${requestKey} was cancelled, ignoring error fallback`);
            }
            batch.forEach((item) => {
              item.reject(new Error("Translation request was cancelled"));
            });
            return;
          }
          if (config.debug) {
            console.error(`❌ RustleGo: Batch translation failed with key ${requestKey}:`, error2);
          }
          batch.forEach(async (item, index) => {
            try {
              const fallbackTranslation = await translate(item.text, currentLocale, { cache });
              if (cache) {
                const cacheKey2 = `${item.text}_${currentLocale}`;
                translationCacheRef.current.set(cacheKey2, fallbackTranslation);
              }
              item.resolve(fallbackTranslation);
            } catch (fallbackError) {
              if (context.config.fallback) {
                item.resolve(item.text);
              } else {
                item.reject(fallbackError);
              }
            }
          });
        }
      }, 100);
    });
  };
  const translateReactNode = async (node) => {
    var _a, _b, _c, _d, _e;
    if (typeof node === "string") {
      try {
        const translation = await translateTextBatched(node);
        return translation;
      } catch (error2) {
        if (config.debug) {
          console.warn(`RustleGo: Failed to translate "${node}":`, error2);
        }
        return node;
      }
    }
    if (typeof node === "number" || typeof node === "boolean" || node == null) {
      return node;
    }
    if (Array.isArray(node)) {
      const translatedArray = await Promise.all(
        node.map((child) => translateReactNode(child))
      );
      return translatedArray;
    }
    if (React.isValidElement(node)) {
      const element = node;
      if (typeof element.type === "string") {
        const tagName = element.type.toLowerCase();
        if ((_b = (_a = config.autoConfig) == null ? void 0 : _a.exclude) == null ? void 0 : _b.includes(tagName)) {
          return node;
        }
        if (((_c = config.autoConfig) == null ? void 0 : _c.include) && !config.autoConfig.include.includes(tagName)) {
          return node;
        }
      }
      if (((_d = element.props) == null ? void 0 : _d["data-i18n"]) === "false") {
        return node;
      }
      if (((_e = element.props) == null ? void 0 : _e["data-i18n-pause"]) === "true") {
        return node;
      }
      let translatedChildren = element.props.children;
      if (translatedChildren) {
        translatedChildren = await translateReactNode(translatedChildren);
      }
      try {
        return React.cloneElement(element, {
          ...element.props,
          "data-i18n": "true",
          "data-i18n-dynamic": "true",
          "data-i18n-id": generateTranslationId()
        }, translatedChildren);
      } catch (cloneError) {
        if (config.debug) {
          console.warn("RustleGo: Failed to clone element, returning original:", cloneError);
        }
        return node;
      }
    }
    return node;
  };
  if (isLoading && !translatedContent) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        className,
        "data-rustle-go": "loading",
        children: fallback || children
      }
    );
  }
  if (error && !config.fallback) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        className,
        "data-rustle-go": "error",
        "data-rustle-error": error,
        children: fallback || children
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: containerRef,
      className,
      "data-rustle-go": "translated",
      "data-rustle-locale": currentLocale,
      children: translatedContent
    }
  );
}
function TranslatedHTML({
  html,
  tag: Tag = "div",
  className,
  style,
  cache = true,
  fallback,
  ...props
}) {
  const context = useRustleContext();
  const { translateBatch } = applyRustle();
  const [translatedHTML, setTranslatedHTML] = useState(html);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const translationCacheRef = useRef(/* @__PURE__ */ new Map());
  const { config, currentLocale } = context;
  useEffect(() => {
    if (config.deactivate) {
      setTranslatedHTML(html);
      return;
    }
    if (currentLocale === config.sourceLanguage) {
      setTranslatedHTML(html);
      return;
    }
    const translateHTML = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const textNodes = extractTextFromHTML(html);
        if (textNodes.length === 0) {
          setTranslatedHTML(html);
          return;
        }
        const uncachedNodes = [];
        const cachedTranslations = {};
        textNodes.forEach((node, index) => {
          const cacheKey = `${node}_${currentLocale}`;
          if (cache && translationCacheRef.current.has(cacheKey)) {
            cachedTranslations[`node_${index}`] = translationCacheRef.current.get(cacheKey);
          } else {
            uncachedNodes.push({
              id: `node_${index}`,
              text: node,
              context: { tags: ["html"], file: "dynamic" }
            });
          }
        });
        let newTranslations = {};
        if (uncachedNodes.length > 0) {
          if (!translateBatch) {
            throw new Error("translateBatch function is not available");
          }
          const rawTranslations = await translateBatch(uncachedNodes, currentLocale, { cache });
          newTranslations = {};
          for (const [id, translation] of Object.entries(rawTranslations)) {
            const originalNode = uncachedNodes.find((node) => node.id === id);
            const cleaned = cleanTranslationWithContext(translation, {
              originalText: originalNode == null ? void 0 : originalNode.text,
              targetLanguage: currentLocale,
              sourceLanguage: config.sourceLanguage,
              isHTML: false
            });
            newTranslations[id] = cleaned;
          }
          if (cache) {
            uncachedNodes.forEach((node, index) => {
              const translation = newTranslations[node.id];
              if (translation) {
                const cacheKey = `${node.text}_${currentLocale}`;
                translationCacheRef.current.set(cacheKey, translation);
              }
            });
          }
        }
        const allTranslations = { ...cachedTranslations, ...newTranslations };
        let translatedHTMLContent = html;
        textNodes.forEach((originalText, index) => {
          const translation = allTranslations[`node_${index}`];
          if (translation && translation !== originalText) {
            translatedHTMLContent = replaceTextInHTML(translatedHTMLContent, originalText, translation);
          }
        });
        const sanitizedHTML = sanitizeHTML(translatedHTMLContent);
        setTranslatedHTML(sanitizedHTML);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "HTML translation failed";
        setError(errorMessage);
        if (config.debug) {
          console.error("TranslatedHTML: Translation error:", err);
        }
        if (config.fallback) {
          setTranslatedHTML(fallback || html);
        }
      } finally {
        setIsLoading(false);
      }
    };
    translateHTML();
  }, [html, currentLocale, config, cache, fallback]);
  const extractTextFromHTML = (htmlString) => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlString;
    const textNodes = [];
    const extractText = (node) => {
      var _a;
      if (node.nodeType === Node.TEXT_NODE) {
        const text = (_a = node.textContent) == null ? void 0 : _a.trim();
        if (text && isTranslatableText(normalizeText(text))) {
          textNodes.push(text);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (element.getAttribute("data-i18n") === "false") {
          return;
        }
        Array.from(node.childNodes).forEach(extractText);
      }
    };
    Array.from(tempDiv.childNodes).forEach(extractText);
    return textNodes;
  };
  const replaceTextInHTML = (htmlString, originalText, translatedText) => {
    const escapedOriginal = originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(?<=>)([^<]*?)${escapedOriginal}([^<]*?)(?=<|$)`, "g");
    return htmlString.replace(regex, (match, before, after) => {
      return `${before}${translatedText}${after}`;
    });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx(
      Tag,
      {
        className,
        style,
        "data-translated-html": "loading",
        ...props,
        dangerouslySetInnerHTML: { __html: fallback || html }
      }
    );
  }
  if (error && !config.fallback) {
    return /* @__PURE__ */ jsx(
      Tag,
      {
        className,
        style,
        "data-translated-html": "error",
        "data-translation-error": error,
        ...props,
        dangerouslySetInnerHTML: { __html: fallback || html }
      }
    );
  }
  return /* @__PURE__ */ jsx(
    Tag,
    {
      className,
      style,
      "data-translated-html": "translated",
      "data-translation-locale": currentLocale,
      "data-translation-id": generateTranslationId(),
      ...props,
      dangerouslySetInnerHTML: { __html: translatedHTML }
    }
  );
}
function usePathBasedLocale(options = {}) {
  const {
    supportedLocales = ["en", "es", "fr", "de", "it", "pt"],
    defaultLocale = "en",
    enablePathRouting = false,
    excludePaths = ["/api", "/static", "/_next", "/favicon.ico"],
    includeDefaultLocaleInPath = false,
    onLocaleChange
  } = options;
  const [currentLocale, setCurrentLocaleState] = useState(defaultLocale);
  const [pathWithoutLocale, setPathWithoutLocale] = useState("/");
  useEffect(() => {
    if (enablePathRouting) {
      AdvancedPathLocaleManager.configure({
        enabled: true,
        supportedLocales,
        defaultLocale,
        excludePaths,
        includeDefaultLocaleInPath,
        redirectToDefaultLocale: false
        // Handle redirects manually in React
      });
    }
  }, [enablePathRouting, supportedLocales, defaultLocale, excludePaths, includeDefaultLocaleInPath]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { locale, pathWithoutLocale: cleanPath } = PathLocaleManager.extractLocaleFromPath(
      window.location.pathname,
      supportedLocales
    );
    const detectedLocale = locale || UniversalLocaleManager.getCurrentLocale();
    setCurrentLocaleState(detectedLocale);
    setPathWithoutLocale(cleanPath);
    UniversalLocaleManager.configurePathBasedRouting(enablePathRouting, supportedLocales);
    UniversalLocaleManager.setCurrentLocale(detectedLocale, false);
  }, [enablePathRouting, supportedLocales]);
  useEffect(() => {
    if (typeof window === "undefined" || !enablePathRouting) return;
    const handlePopState = () => {
      const { locale, pathWithoutLocale: cleanPath } = PathLocaleManager.extractLocaleFromPath(
        window.location.pathname,
        supportedLocales
      );
      const newLocale = locale || defaultLocale;
      setCurrentLocaleState(newLocale);
      setPathWithoutLocale(cleanPath);
      UniversalLocaleManager.setCurrentLocale(newLocale, false);
      if (onLocaleChange) {
        onLocaleChange(newLocale);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enablePathRouting, supportedLocales, defaultLocale, onLocaleChange]);
  const setLocale = useCallback((locale, updatePath = true) => {
    setCurrentLocaleState(locale);
    UniversalLocaleManager.setCurrentLocale(locale, enablePathRouting && updatePath);
    if (enablePathRouting && updatePath && typeof window !== "undefined") {
      const newPath = getLocalizedPath(pathWithoutLocale, locale);
      const newUrl = newPath + window.location.search + window.location.hash;
      window.history.pushState(null, "", newUrl);
      setPathWithoutLocale(PathLocaleManager.removeLocaleFromPath(newPath, supportedLocales));
    }
    if (onLocaleChange) {
      onLocaleChange(locale);
    }
  }, [enablePathRouting, pathWithoutLocale, supportedLocales, onLocaleChange]);
  const navigateToLocalizedPath = useCallback((path, locale) => {
    const targetLocale = locale || currentLocale;
    if (enablePathRouting) {
      const localizedPath = getLocalizedPath(path, targetLocale);
      window.location.href = localizedPath;
    } else {
      setLocale(targetLocale, false);
      window.location.href = path;
    }
  }, [currentLocale, enablePathRouting, setLocale]);
  const getLocalizedPath = useCallback((path, locale) => {
    const targetLocale = locale || currentLocale;
    if (!enablePathRouting) {
      return path;
    }
    if (targetLocale === defaultLocale && !includeDefaultLocaleInPath) {
      return PathLocaleManager.removeLocaleFromPath(path, supportedLocales);
    }
    return PathLocaleManager.addLocaleToPath(path, targetLocale);
  }, [currentLocale, enablePathRouting, defaultLocale, includeDefaultLocaleInPath, supportedLocales]);
  const removeLocaleFromPath = useCallback((path) => {
    return PathLocaleManager.removeLocaleFromPath(path, supportedLocales);
  }, [supportedLocales]);
  const generateAlternateLinks = useCallback((baseUrl = "") => {
    var _a;
    if (!enablePathRouting) {
      return supportedLocales.map((locale) => ({
        locale,
        href: `${baseUrl}${pathWithoutLocale}?locale=${locale}`,
        hreflang: locale === defaultLocale ? "x-default" : locale
      }));
    }
    return AdvancedPathLocaleManager.generateAlternateLinks(
      ((_a = window == null ? void 0 : window.location) == null ? void 0 : _a.pathname) || pathWithoutLocale,
      baseUrl
    );
  }, [enablePathRouting, supportedLocales, pathWithoutLocale, defaultLocale]);
  return {
    currentLocale,
    setLocale,
    navigateToLocalizedPath,
    getLocalizedPath,
    removeLocaleFromPath,
    generateAlternateLinks,
    isPathBasedRoutingEnabled: enablePathRouting,
    supportedLocales,
    pathWithoutLocale
  };
}
function withPathBasedLocale(Component, options) {
  const PathBasedLocaleWrapper = (props) => {
    const localeProps = usePathBasedLocale(options);
    return React.createElement(Component, { ...props, ...localeProps });
  };
  PathBasedLocaleWrapper.displayName = `withPathBasedLocale(${Component.displayName || Component.name})`;
  return PathBasedLocaleWrapper;
}
class PluginManager {
  constructor() {
    __publicField(this, "plugins", /* @__PURE__ */ new Map());
    __publicField(this, "config", null);
  }
  /**
   * Register a plugin
   */
  use(plugin) {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin "${plugin.name}" is already registered. Overwriting...`);
    }
    this.plugins.set(plugin.name, plugin);
    if (this.config && plugin.onInit) {
      try {
        const result = plugin.onInit(this.config);
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Plugin "${plugin.name}" initialization failed:`, error);
          });
        }
      } catch (error) {
        console.error(`Plugin "${plugin.name}" initialization failed:`, error);
      }
    }
    return this;
  }
  /**
   * Unregister a plugin
   */
  unuse(pluginName) {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return false;
    }
    if (plugin.onDestroy) {
      try {
        const result = plugin.onDestroy();
        if (result instanceof Promise) {
          result.catch((error) => {
            console.error(`Plugin "${pluginName}" cleanup failed:`, error);
          });
        }
      } catch (error) {
        console.error(`Plugin "${pluginName}" cleanup failed:`, error);
      }
    }
    return this.plugins.delete(pluginName);
  }
  /**
   * Get a registered plugin
   */
  getPlugin(name) {
    return this.plugins.get(name);
  }
  /**
   * Get all registered plugins
   */
  getPlugins() {
    return Array.from(this.plugins.values());
  }
  /**
   * Initialize all plugins
   */
  async init(config) {
    this.config = config;
    const initPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.onInit) {
        try {
          await plugin.onInit(config);
        } catch (error) {
          console.error(`Plugin "${plugin.name}" initialization failed:`, error);
        }
      }
    });
    await Promise.all(initPromises);
  }
  /**
   * Destroy all plugins
   */
  async destroy() {
    const destroyPromises = Array.from(this.plugins.values()).map(async (plugin) => {
      if (plugin.onDestroy) {
        try {
          await plugin.onDestroy();
        } catch (error) {
          console.error(`Plugin "${plugin.name}" cleanup failed:`, error);
        }
      }
    });
    await Promise.all(destroyPromises);
    this.plugins.clear();
    this.config = null;
  }
  /**
   * Execute hook for all plugins
   */
  async executeHook(hookName, ...args) {
    const results = [];
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        try {
          const result = await hook.apply(plugin, args);
          results.push(result);
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    return results;
  }
  /**
   * Execute hook and return the first non-undefined result
   */
  async executeHookFirst(hookName, ...args) {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        try {
          const result = await hook.apply(plugin, args);
          if (result !== void 0) {
            return result;
          }
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    return void 0;
  }
  /**
   * Execute hook and chain the results (useful for text transformations)
   */
  async executeHookChain(hookName, initialValue, ...args) {
    let currentValue = initialValue;
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === "function") {
        try {
          const result = await hook.apply(plugin, [currentValue, ...args.slice(1)]);
          if (result !== void 0) {
            currentValue = result;
          }
        } catch (error) {
          console.error(`Plugin "${plugin.name}" hook "${String(hookName)}" failed:`, error);
          if (plugin.onError) {
            try {
              await plugin.onError(error instanceof Error ? error : new Error(String(error)), { hook: hookName, args: [currentValue, ...args.slice(1)] });
            } catch (errorHookError) {
              console.error(`Plugin "${plugin.name}" error hook failed:`, errorHookError);
            }
          }
        }
      }
    }
    return currentValue;
  }
}
const debugPlugin = {
  name: "debug",
  version: "1.0.0",
  onInit(config) {
    if (config.debug) {
      console.log("🔧 Debug plugin initialized");
    }
  },
  beforeTranslate(text, targetLocale) {
    console.log(`🔄 Translating "${text}" to ${targetLocale}`);
    return text;
  },
  afterTranslate(originalText, translatedText, targetLocale) {
    console.log(`✅ Translated "${originalText}" → "${translatedText}" (${targetLocale})`);
    return translatedText;
  },
  onLocaleChange(newLocale, oldLocale) {
    console.log(`🌐 Locale changed: ${oldLocale} → ${newLocale}`);
  },
  onError(error, context) {
    console.error("❌ Translation error:", error, context);
  },
  onCacheHit(key, value) {
    console.log(`💾 Cache hit: ${key} → ${value}`);
  },
  onCacheMiss(key) {
    console.log(`💾 Cache miss: ${key}`);
  }
};
const performancePlugin = {
  name: "performance",
  version: "1.0.0",
  private: {
    startTimes: /* @__PURE__ */ new Map(),
    stats: {
      translations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      totalTime: 0
    }
  },
  onInit() {
    console.log("📊 Performance monitoring enabled");
  },
  beforeTranslate(text) {
    this.private.startTimes.set(text, performance.now());
    return text;
  },
  afterTranslate(originalText, translatedText) {
    const startTime = this.private.startTimes.get(originalText);
    if (startTime) {
      const duration = performance.now() - startTime;
      this.private.stats.totalTime += duration;
      this.private.stats.translations++;
      this.private.startTimes.delete(originalText);
    }
    return translatedText;
  },
  onCacheHit() {
    this.private.stats.cacheHits++;
  },
  onCacheMiss() {
    this.private.stats.cacheMisses++;
  },
  onError() {
    this.private.stats.errors++;
  },
  onDestroy() {
    const stats = this.private.stats;
    console.log("📊 Performance Stats:", {
      translations: stats.translations,
      averageTime: stats.translations > 0 ? (stats.totalTime / stats.translations).toFixed(2) + "ms" : "0ms",
      cacheHitRate: stats.cacheHits + stats.cacheMisses > 0 ? (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1) + "%" : "0%",
      errors: stats.errors
    });
  }
};
class OfflineManager {
  constructor() {
    __publicField(this, "isOnline", true);
    __publicField(this, "onlineCallbacks", []);
    __publicField(this, "offlineCallbacks", []);
    __publicField(this, "pendingTranslations", /* @__PURE__ */ new Map());
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
    }
  }
  /**
   * Setup online/offline event listeners
   */
  setupEventListeners() {
    window.addEventListener("online", this.handleOnline.bind(this));
    window.addEventListener("offline", this.handleOffline.bind(this));
  }
  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    console.log("🌐 Rustle: Back online, syncing pending translations...");
    this.onlineCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in online callback:", error);
      }
    });
    this.syncPendingTranslations();
  }
  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    console.log("📴 Rustle: Gone offline, using cached translations only");
    this.offlineCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error("Error in offline callback:", error);
      }
    });
  }
  /**
   * Check if currently online
   */
  getOnlineStatus() {
    return this.isOnline;
  }
  /**
   * Add callback for when going online
   */
  onOnline(callback) {
    this.onlineCallbacks.push(callback);
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }
  /**
   * Add callback for when going offline
   */
  onOffline(callback) {
    this.offlineCallbacks.push(callback);
    return () => {
      const index = this.offlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.offlineCallbacks.splice(index, 1);
      }
    };
  }
  /**
   * Get cached translation or add to pending queue
   */
  async getTranslation(text, sourceLocale, targetLocale, fallbackToOriginal = true) {
    const cachedTranslation = defaultStorageManager.getCachedTranslation(text, sourceLocale, targetLocale);
    if (cachedTranslation) {
      return cachedTranslation;
    }
    if (!this.isOnline) {
      const pendingKey = `${text}_${sourceLocale}_${targetLocale}`;
      this.pendingTranslations.set(pendingKey, {
        text,
        locale: targetLocale,
        timestamp: Date.now()
      });
      console.log(`📴 Rustle: Added "${text}" to pending translations queue`);
      return fallbackToOriginal ? text : null;
    }
    return null;
  }
  /**
   * Cache a translation for offline use
   */
  cacheTranslation(text, sourceLocale, targetLocale, translation) {
    defaultStorageManager.setCachedTranslation(text, sourceLocale, targetLocale, translation);
  }
  /**
   * Preload translations for offline use
   */
  async preloadTranslations(localeData) {
    console.log("💾 Rustle: Preloading translations for offline use...");
    let totalCached = 0;
    for (const [locale, data] of Object.entries(localeData)) {
      for (const [fingerprint, translation] of Object.entries(data)) {
        defaultStorageManager.setCachedTranslation(fingerprint, "en", locale, translation);
        totalCached++;
      }
    }
    console.log(`💾 Rustle: Preloaded ${totalCached} translations for offline use`);
  }
  /**
   * Get pending translations count
   */
  getPendingTranslationsCount() {
    return this.pendingTranslations.size;
  }
  /**
   * Get pending translations
   */
  getPendingTranslations() {
    return Array.from(this.pendingTranslations.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }
  /**
   * Sync pending translations when back online
   */
  async syncPendingTranslations() {
    if (this.pendingTranslations.size === 0) {
      return;
    }
    console.log(`🔄 Rustle: Syncing ${this.pendingTranslations.size} pending translations...`);
    this.pendingTranslations.clear();
    console.log("✅ Rustle: Pending translations synced");
  }
  /**
   * Clear pending translations
   */
  clearPendingTranslations() {
    this.pendingTranslations.clear();
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalCached: 0,
      cacheSize: "0 KB",
      oldestEntry: null,
      newestEntry: null
    };
  }
  /**
   * Clear all cached translations
   */
  clearCache() {
    if (typeof localStorage !== "undefined") {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("rustle_translation_")) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log("🧹 Rustle: Translation cache cleared");
  }
  /**
   * Export cached translations for backup
   */
  exportCache() {
    const cache = {};
    if (typeof localStorage !== "undefined") {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("rustle_translation_")) {
          cache[key] = localStorage.getItem(key) || "";
        }
      });
    }
    return JSON.stringify(cache, null, 2);
  }
  /**
   * Import cached translations from backup
   */
  importCache(cacheData) {
    try {
      const cache = JSON.parse(cacheData);
      if (typeof localStorage !== "undefined") {
        Object.entries(cache).forEach(([key, value]) => {
          if (key.startsWith("rustle_translation_") && typeof value === "string") {
            localStorage.setItem(key, value);
          }
        });
      }
      console.log("📥 Rustle: Translation cache imported successfully");
    } catch (error) {
      console.error("❌ Rustle: Failed to import cache:", error);
      throw new Error("Invalid cache data format");
    }
  }
  /**
   * Cleanup old cache entries
   */
  cleanupOldCache(maxAgeMs = 7 * 24 * 60 * 60 * 1e3) {
    if (typeof localStorage === "undefined") return;
    const now = Date.now();
    const keys = Object.keys(localStorage);
    let removedCount = 0;
    keys.forEach((key) => {
      if (key.startsWith("rustle_translation_")) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const data = JSON.parse(item);
            if (data.timestamp && now - data.timestamp > maxAgeMs) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (error) {
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    });
    if (removedCount > 0) {
      console.log(`🧹 Rustle: Cleaned up ${removedCount} old cache entries`);
    }
  }
  /**
   * Destroy the offline manager
   */
  destroy() {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline.bind(this));
      window.removeEventListener("offline", this.handleOffline.bind(this));
    }
    this.onlineCallbacks = [];
    this.offlineCallbacks = [];
    this.pendingTranslations.clear();
  }
}
const offlineManager = new OfflineManager();
class RustleEngine {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "localeData", {});
    __publicField(this, "observer", null);
    __publicField(this, "processedElements", /* @__PURE__ */ new Set());
    __publicField(this, "pendingTranslations", /* @__PURE__ */ new Map());
    __publicField(this, "pluginManager", new PluginManager());
    this.config = {
      deactivate: false,
      sourceLanguage: "en",
      targetLanguages: ["es", "fr", "de", "it", "pt"],
      currentLocale: "en",
      apiKey: "",
      model: "gpt-3.5-turbo",
      debug: false,
      auto: true,
      fallback: true,
      ...config
    };
    if (this.config.debug) {
      console.log("🚀 RustleEngine: Initialized with config:", this.config);
    }
  }
  /**
   * Use a plugin
   */
  use(plugin) {
    this.pluginManager.use(plugin);
    return this;
  }
  /**
   * Remove a plugin
   */
  unuse(pluginName) {
    return this.pluginManager.unuse(pluginName);
  }
  /**
   * Get a plugin
   */
  getPlugin(name) {
    return this.pluginManager.getPlugin(name);
  }
  /**
   * Get offline status
   */
  isOffline() {
    return !offlineManager.getOnlineStatus();
  }
  /**
   * Get pending translations count
   */
  getPendingTranslationsCount() {
    return offlineManager.getPendingTranslationsCount();
  }
  /**
   * Export cache for backup
   */
  exportCache() {
    return offlineManager.exportCache();
  }
  /**
   * Import cache from backup
   */
  importCache(cacheData) {
    offlineManager.importCache(cacheData);
  }
  /**
   * Clear translation cache
   */
  clearCache() {
    offlineManager.clearCache();
    defaultStorageManager.clearCache();
    if (this.config.debug) {
      console.log("🧹 RustleEngine: Cache cleared");
    }
  }
  /**
   * Initialize the engine and start processing
   */
  async init() {
    if (this.config.deactivate) {
      if (this.config.debug) {
        console.log("⏸️ RustleEngine: Deactivated, skipping initialization");
      }
      return;
    }
    await this.pluginManager.init(this.config);
    await this.loadLocaleData(this.config.currentLocale);
    if (this.localeData && Object.keys(this.localeData).length > 0) {
      await offlineManager.preloadTranslations(this.localeData);
    }
    if (this.config.auto && typeof document !== "undefined") {
      this.startAutoProcessing();
    }
  }
  /**
   * Load locale data from files or API
   */
  async loadLocaleData(locale) {
    if (this.localeData[locale]) {
      return;
    }
    try {
      const response = await fetch(`/rustle/locales/${locale}.json`);
      if (response.ok) {
        const data = await response.json();
        this.localeData[locale] = data;
        if (this.config.debug) {
          console.log(`✅ RustleEngine: Loaded locale ${locale} with ${Object.keys(data).length} entries`);
        }
        return;
      }
    } catch (error) {
      if (this.config.debug) {
        console.warn(`⚠️ RustleEngine: Failed to load static locale ${locale}:`, error);
      }
    }
    this.localeData[locale] = {};
  }
  /**
   * Start automatic processing of DOM elements
   */
  startAutoProcessing() {
    this.processExistingElements();
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processElement(node);
            }
          });
        }
      });
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    if (this.config.debug) {
      console.log("👀 RustleEngine: Started auto-processing with MutationObserver");
    }
  }
  /**
   * Process existing elements in the DOM
   */
  processExistingElements() {
    if (typeof document === "undefined") return;
    const elements = document.querySelectorAll("body *");
    elements.forEach((element) => this.processElement(element));
  }
  /**
   * Process a single element for translation
   */
  processElement(element) {
    var _a, _b, _c, _d;
    if (this.processedElements.has(element)) {
      return;
    }
    if (element.getAttribute("data-i18n") === "false") {
      return;
    }
    if (element.getAttribute("data-i18n-pause") === "true") {
      return;
    }
    const tagName = element.tagName.toLowerCase();
    if ((_b = (_a = this.config.autoConfig) == null ? void 0 : _a.exclude) == null ? void 0 : _b.includes(tagName)) {
      return;
    }
    if (((_c = this.config.autoConfig) == null ? void 0 : _c.include) && !this.config.autoConfig.include.includes(tagName)) {
      return;
    }
    const textContent = (_d = element.textContent) == null ? void 0 : _d.trim();
    if (!textContent || !isTranslatableText(textContent)) {
      return;
    }
    const normalizedText = normalizeText(textContent);
    if (!normalizedText) {
      return;
    }
    const fingerprint = generateFingerprint(window.location.pathname, 0);
    const contentHash = generateContentHash(normalizedText);
    element.setAttribute("data-i18n", "true");
    element.setAttribute("data-i18n-fingerprint", fingerprint);
    element.setAttribute("data-i18n-content-hash", contentHash);
    element.setAttribute("data-i18n-source", normalizedText);
    this.processedElements.add(element);
    if (this.config.currentLocale !== this.config.sourceLanguage) {
      this.translateElement(element, normalizedText);
    }
    if (this.config.debug) {
      console.log(`🔍 RustleEngine: Processed element with fingerprint: ${fingerprint}`);
    }
  }
  /**
   * Translate a specific element
   */
  async translateElement(element, sourceText) {
    try {
      const translation = await this.translate(sourceText, this.config.currentLocale);
      element.textContent = translation;
    } catch (error) {
      if (this.config.debug) {
        console.error("❌ RustleEngine: Translation error:", error);
      }
      if (this.config.fallback) {
        element.textContent = sourceText;
      }
    }
  }
  /**
   * Translate text with deduplication and caching
   */
  async translate(text, targetLocale, options) {
    var _a;
    const target = targetLocale || this.config.currentLocale;
    const cacheEnabled = (options == null ? void 0 : options.cache) !== false;
    if (target === this.config.sourceLanguage) {
      return text;
    }
    const processedText = await this.pluginManager.executeHookChain("beforeTranslate", text, target, options);
    const staticTranslation = (_a = this.localeData[target]) == null ? void 0 : _a[processedText];
    if (staticTranslation) {
      await this.pluginManager.executeHook("onCacheHit", `static_${processedText}_${target}`, staticTranslation);
      return staticTranslation;
    }
    const cacheKey = `${processedText}_${this.config.sourceLanguage}_${target}`;
    if (this.pendingTranslations.has(cacheKey)) {
      return this.pendingTranslations.get(cacheKey);
    }
    if (cacheEnabled) {
      const offlineTranslation = await offlineManager.getTranslation(
        processedText,
        this.config.sourceLanguage,
        target,
        true
        // fallback to original text if offline
      );
      if (offlineTranslation && offlineTranslation !== processedText) {
        await this.pluginManager.executeHook("onCacheHit", cacheKey, offlineTranslation);
        return offlineTranslation;
      } else if (!offlineManager.getOnlineStatus()) {
        console.log(`📴 Rustle: Offline, returning original text for "${processedText}"`);
        return processedText;
      } else {
        await this.pluginManager.executeHook("onCacheMiss", cacheKey);
      }
    }
    const translationPromise = this.performTranslation(processedText, target, cacheEnabled);
    this.pendingTranslations.set(cacheKey, translationPromise);
    try {
      const result = await translationPromise;
      const finalResult = await this.pluginManager.executeHookChain("afterTranslate", result, processedText, target, options);
      return finalResult;
    } catch (error) {
      await this.pluginManager.executeHook("onError", error instanceof Error ? error : new Error(String(error)), { text: processedText, target, options });
      throw error;
    } finally {
      this.pendingTranslations.delete(cacheKey);
    }
  }
  /**
   * Perform actual translation via API
   */
  async performTranslation(text, target, cache) {
    try {
      const apiClient = createAPIClient({
        apiKey: this.config.apiKey
      });
      const translation = await apiClient.translateSingle(
        text,
        this.config.sourceLanguage,
        target,
        this.config.model
      );
      if (cache) {
        defaultStorageManager.cacheTranslation(
          text,
          this.config.sourceLanguage,
          target,
          translation
        );
      }
      if (this.config.debug) {
        console.log(`🔄 RustleEngine: Translated "${text}" to "${translation}" (${target})`);
      }
      return translation;
    } catch (error) {
      if (this.config.debug) {
        console.error("❌ RustleEngine: Translation error:", error);
      }
      if (this.config.fallback) {
        return text;
      }
      throw error;
    }
  }
  /**
   * Change current locale and re-translate content
   */
  async setLocale(locale) {
    if (locale === this.config.currentLocale) {
      return;
    }
    const oldLocale = this.config.currentLocale;
    this.config.currentLocale = locale;
    await this.pluginManager.executeHook("onLocaleChange", locale, oldLocale);
    await this.loadLocaleData(locale);
    if (typeof document !== "undefined") {
      const elements = document.querySelectorAll('[data-i18n="true"]');
      for (const element of elements) {
        const sourceText = element.getAttribute("data-i18n-source");
        if (sourceText) {
          await this.translateElement(element, sourceText);
        }
      }
    }
    if (this.config.debug) {
      console.log(`🌐 RustleEngine: Changed locale to ${locale}`);
    }
  }
  /**
   * Get current locale
   */
  getCurrentLocale() {
    return this.config.currentLocale;
  }
  /**
   * Destroy the engine and cleanup
   */
  async destroy() {
    await this.pluginManager.destroy();
    offlineManager.destroy();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.processedElements.clear();
    this.pendingTranslations.clear();
    if (this.config.debug) {
      console.log("🗑️ RustleEngine: Destroyed and cleaned up");
    }
  }
}
class RustleEngineInstance {
  constructor() {
    __publicField(this, "config", null);
    __publicField(this, "observer", null);
    __publicField(this, "processedNodes", /* @__PURE__ */ new Set());
    __publicField(this, "apiClient", null);
  }
  /**
   * Initialize the Rustle engine
   */
  initialize(config) {
    this.config = RustleConfigSchema.parse({
      sourceLanguage: "en",
      targetLanguages: [],
      apiKey: "",
      ...config,
      currentLocale: config.currentLocale || getLocaleFromCookie() || config.sourceLanguage || "en"
    });
    if (this.config.deactivate) {
      if (this.config.debug) {
        console.log("Rustle: Engine deactivated");
      }
      return;
    }
    this.apiClient = createAPIClient({
      apiKey: this.config.apiKey
    });
    if (this.config.debug) {
      console.log("Rustle: Engine initialized with config:", this.config);
    }
    if (typeof window !== "undefined") {
      this.startProcessing();
    }
  }
  /**
   * Start processing DOM elements
   */
  startProcessing() {
    if (!this.config || this.config.deactivate) return;
    this.processExistingElements();
    this.setupMutationObserver();
    this.setupLocaleHandling();
  }
  /**
   * Process existing DOM elements
   */
  processExistingElements() {
    var _a;
    if (!((_a = this.config) == null ? void 0 : _a.auto)) return;
    const elements = document.querySelectorAll("body *");
    elements.forEach((element) => this.processElement(element));
  }
  /**
   * Process a single element
   */
  processElement(element) {
    var _a, _b, _c, _d;
    if (!this.config) return;
    if (this.processedNodes.has(element)) return;
    const tagName = element.tagName.toLowerCase();
    if ((_b = (_a = this.config.autoConfig) == null ? void 0 : _a.exclude) == null ? void 0 : _b.includes(tagName)) return;
    if (((_c = this.config.autoConfig) == null ? void 0 : _c.include) && !this.config.autoConfig.include.includes(tagName)) {
      return;
    }
    if (element.getAttribute("data-i18n") === "false") return;
    if (element.getAttribute("data-i18n-pause") === "true") return;
    const textContent = (_d = element.textContent) == null ? void 0 : _d.trim();
    if (!textContent || !isTranslatableText(textContent)) return;
    const tags = extractTags(element);
    const fingerprint = generateFingerprint(window.location.pathname, 0);
    const contentHash = generateContentHash(textContent);
    element.setAttribute("data-i18n", "true");
    element.setAttribute("data-i18n-fingerprint", fingerprint);
    element.setAttribute("data-i18n-content-hash", contentHash);
    element.setAttribute("data-i18n-tags", tags.join(","));
    element.setAttribute("data-i18n-source", textContent);
    this.processedNodes.add(element);
    if (this.config.debug) {
      console.log(`Rustle: Processed element: "${textContent}" with fingerprint: ${fingerprint}`);
    }
  }
  /**
   * Set up mutation observer
   */
  setupMutationObserver() {
    var _a;
    if (!((_a = this.config) == null ? void 0 : _a.auto)) return;
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node;
              this.processElement(element);
              const childElements = element.querySelectorAll("*");
              childElements.forEach((child) => this.processElement(child));
            }
          });
        }
      });
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Set up locale change handling
   */
  setupLocaleHandling() {
    window.addEventListener("rustleLocaleChange", (event) => {
      const newLocale = event.detail.locale;
      this.setLocale(newLocale);
    });
  }
  /**
   * Change current locale
   */
  setLocale(locale) {
    if (!this.config) return;
    if (!this.config.targetLanguages.includes(locale) && locale !== this.config.sourceLanguage) {
      console.warn(`Rustle: Locale ${locale} is not in target languages`);
      return;
    }
    this.config = { ...this.config, currentLocale: locale };
    setLocaleToCookie(locale);
    if (this.config.debug) {
      console.log(`Rustle: Locale changed to ${locale}`);
    }
    this.translateElements();
    window.dispatchEvent(new CustomEvent("rustleLocaleChanged", {
      detail: { locale }
    }));
  }
  /**
   * Translate all marked elements
   */
  async translateElements() {
    if (!this.config) return;
    const elements = document.querySelectorAll('[data-i18n="true"]');
    for (const element of elements) {
      await this.translateElement(element);
    }
  }
  /**
   * Translate a single element
   */
  async translateElement(element) {
    if (!this.config) return;
    const sourceText = element.getAttribute("data-i18n-source");
    const fingerprint = element.getAttribute("data-i18n-fingerprint");
    if (!sourceText || !fingerprint) return;
    if (this.config.currentLocale === this.config.sourceLanguage) {
      element.textContent = sourceText;
      return;
    }
    try {
      if (!this.config.currentLocale) return;
      const cachedTranslation = defaultStorageManager.getCachedTranslation(
        sourceText,
        this.config.sourceLanguage,
        this.config.currentLocale
      );
      if (cachedTranslation) {
        element.textContent = cachedTranslation;
        return;
      }
      if (this.apiClient && this.config.currentLocale) {
        const translation = await this.apiClient.translateSingle(
          sourceText,
          this.config.sourceLanguage,
          this.config.currentLocale,
          this.config.model
        );
        element.textContent = translation;
        if (this.config.currentLocale) {
          defaultStorageManager.cacheTranslation(
            sourceText,
            this.config.sourceLanguage,
            this.config.currentLocale,
            translation
          );
        }
        if (this.config.debug) {
          console.log(`Rustle: Translated "${sourceText}" to "${translation}"`);
        }
      }
    } catch (error) {
      if (this.config.debug) {
        console.error("Rustle: Translation error:", error);
      }
      if (this.config.fallback) {
        element.textContent = sourceText;
      }
    }
  }
  /**
   * Get current locale
   */
  getCurrentLocale() {
    var _a;
    return ((_a = this.config) == null ? void 0 : _a.currentLocale) || null;
  }
  /**
   * Cleanup
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.processedNodes.clear();
    this.config = null;
    this.apiClient = null;
  }
}
const rustleEngineInstance = new RustleEngineInstance();
function rustleEngine(config) {
  rustleEngineInstance.initialize(config);
}
if (typeof window !== "undefined") {
  window.rustleEngine = rustleEngine;
  window.rustleSetLocale = (locale) => rustleEngineInstance.setLocale(locale);
  window.rustleGetLocale = () => rustleEngineInstance.getCurrentLocale();
}
function debounce(func, wait, options = {}) {
  const { leading = false, trailing = true, maxWait } = options;
  let timeout = null;
  let maxTimeout = null;
  let lastCallTime = null;
  let lastInvokeTime = 0;
  return (...args) => {
    const now = Date.now();
    const isInvoking = lastCallTime === null;
    lastCallTime = now;
    if (timeout) clearTimeout(timeout);
    if (maxTimeout) clearTimeout(maxTimeout);
    if (leading && isInvoking) {
      lastInvokeTime = now;
      func(...args);
      return;
    }
    if (trailing) {
      timeout = setTimeout(() => {
        lastInvokeTime = Date.now();
        func(...args);
        lastCallTime = null;
      }, wait);
    }
    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (lastCallTime && now - lastInvokeTime >= maxWait) {
          lastInvokeTime = Date.now();
          func(...args);
          lastCallTime = null;
        }
      }, maxWait);
    }
  };
}
function throttle(func, limit, options = {}) {
  const { leading = true, trailing = true } = options;
  let inThrottle = false;
  let lastArgs = null;
  return (...args) => {
    lastArgs = args;
    if (!inThrottle) {
      if (leading) {
        func(...args);
      }
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}
function memoize(func, maxSize = 100) {
  const cache = /* @__PURE__ */ new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== void 0) {
        cache.delete(firstKey);
      }
    }
    cache.set(key, result);
    return result;
  };
}
class LazyObserver {
  constructor(options) {
    __publicField(this, "observer", null);
    __publicField(this, "callbacks", /* @__PURE__ */ new Map());
    if (typeof IntersectionObserver !== "undefined") {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.unobserve(entry.target);
            }
          }
        });
      }, {
        rootMargin: "50px",
        threshold: 0.1,
        ...options
      });
    }
  }
  observe(element, callback) {
    if (!this.observer) {
      callback();
      return;
    }
    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }
  unobserve(element) {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.callbacks.delete(element);
  }
  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.callbacks.clear();
  }
}
function requestIdleCallback(callback, options) {
  if ("requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }
  return setTimeout(callback, (options == null ? void 0 : options.timeout) || 1);
}
function cancelIdleCallback(id) {
  if ("cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}
class DOMBatcher {
  constructor() {
    __publicField(this, "operations", []);
    __publicField(this, "scheduled", false);
  }
  add(operation) {
    this.operations.push(operation);
    this.schedule();
  }
  schedule() {
    if (this.scheduled) return;
    this.scheduled = true;
    requestIdleCallback(() => {
      this.flush();
    });
  }
  flush() {
    const ops = this.operations.splice(0);
    if (ops.length > 1) {
      document.createDocumentFragment();
      ops.forEach((op) => op());
    } else if (ops.length === 1 && ops[0]) {
      ops[0]();
    }
    this.scheduled = false;
  }
  clear() {
    this.operations = [];
    this.scheduled = false;
  }
}
class MemoryMonitor {
  constructor() {
    __publicField(this, "maxMemoryUsage", 0);
    __publicField(this, "checkInterval", null);
  }
  start(intervalMs = 5e3) {
    if (this.checkInterval) return;
    this.checkInterval = setInterval(() => {
      this.checkMemory();
    }, intervalMs);
  }
  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
  checkMemory() {
    if ("memory" in performance) {
      const memory = performance.memory;
      const currentUsage = memory.usedJSHeapSize;
      if (currentUsage > this.maxMemoryUsage) {
        this.maxMemoryUsage = currentUsage;
      }
      if (currentUsage > 50 * 1024 * 1024) {
        console.warn("Rustle: High memory usage detected:", {
          current: `${(currentUsage / 1024 / 1024).toFixed(2)}MB`,
          max: `${(this.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
  }
  getStats() {
    if ("memory" in performance) {
      const memory = performance.memory;
      return {
        current: memory.usedJSHeapSize,
        max: this.maxMemoryUsage,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
}
class PerformanceCollector {
  constructor() {
    __publicField(this, "metrics", /* @__PURE__ */ new Map());
  }
  mark(name) {
    if ("performance" in window && performance.mark) {
      performance.mark(name);
    }
  }
  measure(name, startMark, endMark) {
    var _a;
    if ("performance" in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, "measure");
        const duration = ((_a = entries[entries.length - 1]) == null ? void 0 : _a.duration) || 0;
        this.addMetric(name, duration);
        return duration;
      } catch (error) {
        console.warn("Performance measurement failed:", error);
      }
    }
    return 0;
  }
  addMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    const values = this.metrics.get(name);
    values.push(value);
    if (values.length > 100) {
      values.shift();
    }
  }
  getMetrics(name) {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }
  getAllMetrics() {
    const result = {};
    for (const [name] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }
    return result;
  }
  clear() {
    this.metrics.clear();
    if ("performance" in window && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}
const performanceUtils = {
  lazyObserver: new LazyObserver(),
  domBatcher: new DOMBatcher(),
  memoryMonitor: new MemoryMonitor(),
  performanceCollector: new PerformanceCollector(),
  /**
   * Initialize performance monitoring
   */
  init(options) {
    if (options == null ? void 0 : options.enableMemoryMonitoring) {
      this.memoryMonitor.start(options.memoryCheckInterval);
    }
  },
  /**
   * Cleanup all performance utilities
   */
  cleanup() {
    this.lazyObserver.disconnect();
    this.domBatcher.clear();
    this.memoryMonitor.stop();
    this.performanceCollector.clear();
  }
};
function lazyImport(importFn, fallback) {
  let cached = null;
  let loading = null;
  return async () => {
    if (cached) {
      return cached;
    }
    if (loading) {
      return loading;
    }
    loading = importFn().then((module) => {
      cached = module;
      loading = null;
      return module;
    }).catch((error) => {
      loading = null;
      console.warn("Failed to lazy load module:", error);
      if (fallback) {
        cached = fallback;
        return fallback;
      }
      throw error;
    });
    return loading;
  };
}
function lazyComponent(importFn, fallback) {
  if (typeof React === "undefined") {
    throw new Error("lazyComponent can only be used in React environment");
  }
  return React.lazy(async () => {
    try {
      const module = await importFn();
      if ("default" in module) {
        return { default: module.default };
      } else {
        return { default: module };
      }
    } catch (error) {
      console.warn("Failed to lazy load component:", error);
      if (fallback) {
        return { default: fallback };
      }
      throw error;
    }
  });
}
function conditionalImport(condition, importFn, fallback) {
  const shouldLoad = typeof condition === "function" ? condition() : condition;
  if (!shouldLoad) {
    return Promise.resolve(fallback);
  }
  return importFn().catch((error) => {
    console.warn("Failed to conditionally load module:", error);
    return fallback;
  });
}
function browserOnlyImport(importFn, fallback) {
  return conditionalImport(
    typeof window !== "undefined",
    importFn,
    fallback
  );
}
function nodeOnlyImport(importFn, fallback) {
  return conditionalImport(
    typeof window === "undefined" && typeof process !== "undefined",
    importFn,
    fallback
  );
}
function preloadModule(importFn, delay = 0) {
  if (delay > 0) {
    setTimeout(() => {
      importFn().catch(() => {
      });
    }, delay);
  } else {
    importFn().catch(() => {
    });
  }
}
class ModuleCache {
  constructor() {
    __publicField(this, "cache", /* @__PURE__ */ new Map());
    __publicField(this, "loading", /* @__PURE__ */ new Map());
  }
  async get(key, importFn) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    if (this.loading.has(key)) {
      return this.loading.get(key);
    }
    const promise = importFn().then((module) => {
      this.cache.set(key, module);
      this.loading.delete(key);
      return module;
    }).catch((error) => {
      this.loading.delete(key);
      throw error;
    });
    this.loading.set(key, promise);
    return promise;
  }
  has(key) {
    return this.cache.has(key);
  }
  clear() {
    this.cache.clear();
    this.loading.clear();
  }
  size() {
    return this.cache.size;
  }
}
const moduleCache = new ModuleCache();
function featureSupported(feature) {
  switch (feature) {
    case "intersectionObserver":
      return typeof IntersectionObserver !== "undefined";
    case "mutationObserver":
      return typeof MutationObserver !== "undefined";
    case "localStorage":
      try {
        return typeof localStorage !== "undefined" && localStorage !== null;
      } catch {
        return false;
      }
    case "webWorkers":
      return typeof Worker !== "undefined";
    case "serviceWorker":
      return "serviceWorker" in navigator;
    case "indexedDB":
      return "indexedDB" in window;
    default:
      return false;
  }
}
async function loadPolyfillIfNeeded(feature, polyfillImport) {
  if (!featureSupported(feature)) {
    try {
      await polyfillImport();
      console.log(`Loaded polyfill for ${feature}`);
    } catch (error) {
      console.warn(`Failed to load polyfill for ${feature}:`, error);
    }
  }
}
const bundleOptimization = {
  /**
   * Tree-shake unused exports by importing only what's needed
   */
  selectiveImport: (module, keys) => {
    const result = {};
    keys.forEach((key) => {
      if (key in module) {
        result[key] = module[key];
      }
    });
    return result;
  },
  /**
   * Defer non-critical imports
   */
  deferImport: (importFn, timeout = 100) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        importFn().then(resolve).catch(reject);
      }, timeout);
    });
  },
  /**
   * Load modules in chunks to avoid blocking
   */
  chunkLoad: async (imports, chunkSize = 3) => {
    const results = [];
    for (let i2 = 0; i2 < imports.length; i2 += chunkSize) {
      const chunk = imports.slice(i2, i2 + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map((importFn) => importFn())
      );
      results.push(...chunkResults);
      if (i2 + chunkSize < imports.length) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
    return results;
  }
};
const _ConfigManager = class _ConfigManager {
  constructor() {
    __publicField(this, "config", {});
    this.loadConfiguration();
  }
  static getInstance() {
    if (!_ConfigManager.instance) {
      _ConfigManager.instance = new _ConfigManager();
    }
    return _ConfigManager.instance;
  }
  /**
   * Load configuration from multiple sources
   */
  loadConfiguration() {
    if (typeof process !== "undefined" && process.env) {
      this.config = {
        ...this.config,
        apiUrl: process.env.RUSTLE_API_URL || process.env.NEXT_PUBLIC_RUSTLE_API_URL,
        apiKey: process.env.RUSTLE_API_KEY,
        sourceLanguage: process.env.RUSTLE_SOURCE_LANGUAGE || "en",
        localeBasePath: process.env.RUSTLE_LOCALE_PATH || "/rustle/locales",
        debug: process.env.RUSTLE_DEBUG === "true",
        useVirtualDOM: process.env.RUSTLE_USE_VIRTUAL_DOM !== "false",
        enableBatching: process.env.RUSTLE_ENABLE_BATCHING !== "false",
        enableCaching: process.env.RUSTLE_ENABLE_CACHING !== "false",
        enableOffline: process.env.RUSTLE_ENABLE_OFFLINE === "true",
        batchTimeout: parseInt(process.env.RUSTLE_BATCH_TIMEOUT || "50"),
        maxRetries: parseInt(process.env.RUSTLE_MAX_RETRIES || "3"),
        cacheTimeout: parseInt(process.env.RUSTLE_CACHE_TIMEOUT || "86400000")
        // 24 hours
      };
    }
    if (typeof window !== "undefined") {
      const globalConfig2 = window.__RUSTLE_CONFIG__;
      if (globalConfig2) {
        this.config = { ...this.config, ...globalConfig2 };
      }
    }
    this.config = {
      apiUrl: "https://api.rustle.dev/api",
      sourceLanguage: "en",
      targetLanguages: ["es", "fr", "de", "it", "pt"],
      defaultModel: "gpt-3.5-turbo",
      localeBasePath: "/rustle/locales",
      useVirtualDOM: true,
      enableBatching: true,
      enableCaching: true,
      enableOffline: false,
      batchTimeout: 50,
      maxRetries: 3,
      cacheTimeout: 864e5,
      // 24 hours
      obfuscateRequests: false,
      enableCSP: true,
      debug: false,
      enableMetrics: false,
      ...this.config
    };
  }
  /**
   * Get configuration value
   */
  get(key) {
    return this.config[key];
  }
  /**
   * Set configuration value
   */
  set(key, value) {
    this.config[key] = value;
  }
  /**
   * Update multiple configuration values
   */
  update(updates) {
    this.config = { ...this.config, ...updates };
  }
  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }
  /**
   * Reset to defaults
   */
  reset() {
    this.config = {};
    this.loadConfiguration();
  }
  /**
   * Validate configuration
   */
  validate() {
    const errors = [];
    if (!this.config.apiKey) {
      errors.push("API key is required");
    }
    if (!this.config.apiUrl) {
      errors.push("API URL is required");
    } else {
      try {
        new URL(this.config.apiUrl);
      } catch {
        errors.push("Invalid API URL format");
      }
    }
    if (!this.config.sourceLanguage) {
      errors.push("Source language is required");
    }
    if (!this.config.targetLanguages || this.config.targetLanguages.length === 0) {
      errors.push("At least one target language is required");
    }
    if (!this.config.localeBasePath) {
      errors.push("Locale base path is required");
    }
    if (this.config.batchTimeout && this.config.batchTimeout < 0) {
      errors.push("Batch timeout must be non-negative");
    }
    if (this.config.maxRetries && this.config.maxRetries < 0) {
      errors.push("Max retries must be non-negative");
    }
    if (this.config.cacheTimeout && this.config.cacheTimeout < 0) {
      errors.push("Cache timeout must be non-negative");
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
__publicField(_ConfigManager, "instance");
let ConfigManager = _ConfigManager;
const globalConfig = ConfigManager.getInstance();
const configHelpers = {
  /**
   * Check if we're in development mode
   */
  isDevelopment() {
    return globalConfig.get("debug") === true || typeof process !== "undefined" && process.env.NODE_ENV === "development";
  },
  /**
   * Check if we're in production mode
   */
  isProduction() {
    return !this.isDevelopment();
  },
  /**
   * Get the best available AI model
   */
  getBestModel() {
    const model = globalConfig.get("defaultModel");
    return model || "gpt-3.5-turbo";
  },
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature) {
    return globalConfig.get(feature) === true;
  },
  /**
   * Get locale file path
   */
  getLocalePath(locale) {
    const basePath = globalConfig.get("localeBasePath") || "/rustle/locales";
    return `${basePath}/${locale}.json`;
  },
  /**
   * Get master file path
   */
  getMasterPath() {
    const basePath = globalConfig.get("localeBasePath") || "/rustle/locales";
    return `${basePath}/master.json`;
  },
  /**
   * Setup configuration for different environments
   */
  setupEnvironment(env) {
    switch (env) {
      case "development":
        globalConfig.update({
          debug: true,
          enableMetrics: true,
          obfuscateRequests: false
        });
        break;
      case "staging":
        globalConfig.update({
          debug: false,
          enableMetrics: true,
          obfuscateRequests: true
        });
        break;
      case "production":
        globalConfig.update({
          debug: false,
          enableMetrics: false,
          obfuscateRequests: true
        });
        break;
    }
  }
};
export {
  AdvancedPathLocaleManager,
  A as AutoTranslate,
  ConfigManager,
  DOMBatcher,
  LazyObserver,
  MemoryMonitor,
  M as MetadataPathManager,
  ModuleCache,
  OfflineManager,
  PathLocaleManager,
  PerformanceCollector,
  PluginManager,
  b as RustleAPIError,
  R as RustleBox,
  RustleEngine,
  RustleGo,
  S2 as ServerLocaleManager,
  S as StorageManager,
  TranslatedHTML,
  UniversalLocaleManager,
  applyRustle,
  browserOnlyImport,
  bundleOptimization,
  cancelIdleCallback,
  c as commonPatterns,
  conditionalImport,
  configHelpers,
  createAPIClient,
  a as createLocaleManager,
  debounce,
  debugPlugin,
  defaultStorageManager,
  e as extractTemplate,
  featureSupported,
  getLocaleFromCookie,
  globalConfig,
  i as interpolateText,
  lazyComponent,
  lazyImport,
  loadPolyfillIfNeeded,
  memoize,
  moduleCache,
  nodeOnlyImport,
  offlineManager,
  performancePlugin,
  performanceUtils,
  preloadModule,
  r as removeLocaleFromCookie,
  requestIdleCallback,
  rustleEngine,
  setLocaleToCookie,
  throttle,
  usePathBasedLocale,
  u as useRustle,
  withPathBasedLocale
};
