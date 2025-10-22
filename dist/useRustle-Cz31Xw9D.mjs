"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { jsx, Fragment } from "react/jsx-runtime";
import React, { createContext, useRef, useReducer, useEffect, useContext, useMemo, useCallback, useState } from "react";
import { b as cleanBatchTranslations, c as cleanTranslation, g as generateContentFingerprint, i as isTranslatableText } from "./fingerprinting-iGOd0RNQ.mjs";
import { g as getLocaleFromCookie, s as setLocaleToCookie } from "./cookies-C2ACDSut.mjs";
const STORAGE_PREFIX = "rustle_";
const CACHE_VERSION = "1.0";
class MemoryStorageAdapter {
  constructor() {
    __publicField(this, "storage", /* @__PURE__ */ new Map());
  }
  getItem(key) {
    return this.storage.get(key) || null;
  }
  setItem(key, value) {
    this.storage.set(key, value);
  }
  removeItem(key) {
    this.storage.delete(key);
  }
  clear() {
    this.storage.clear();
  }
}
class StorageManager {
  constructor(adapter) {
    __publicField(this, "adapter");
    this.adapter = adapter || this.getDefaultAdapter();
  }
  getDefaultAdapter() {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("__test__", "test");
        localStorage.removeItem("__test__");
        return localStorage;
      }
    } catch (error) {
      console.warn("localStorage not available, falling back to memory storage");
    }
    return new MemoryStorageAdapter();
  }
  getKey(type, identifier) {
    return `${STORAGE_PREFIX}${type}_${identifier}`;
  }
  /**
   * Cache locale data
   */
  cacheLocaleData(locale, data) {
    try {
      const cacheEntry = {
        data: JSON.stringify(data),
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      const key = this.getKey("locale", locale);
      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("Failed to cache locale data:", error);
    }
  }
  /**
   * Get cached locale data
   */
  getCachedLocaleData(locale, maxAge = 24 * 60 * 60 * 1e3) {
    try {
      const key = this.getKey("locale", locale);
      const cached = this.adapter.getItem(key);
      if (!cached) return null;
      const cacheEntry = JSON.parse(cached);
      if (cacheEntry.version !== CACHE_VERSION) {
        this.adapter.removeItem(key);
        return null;
      }
      if (Date.now() - cacheEntry.timestamp > maxAge) {
        this.adapter.removeItem(key);
        return null;
      }
      return JSON.parse(cacheEntry.data);
    } catch (error) {
      console.warn("Failed to get cached locale data:", error);
      return null;
    }
  }
  /**
   * Cache a single translation
   */
  cacheTranslation(text, sourceLocale, targetLocale, translation) {
    try {
      const cacheEntry = {
        data: translation,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      const key = this.getKey("translation", `${sourceLocale}_${targetLocale}_${text}`);
      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("Failed to cache translation:", error);
    }
  }
  /**
   * Get cached translation
   */
  getCachedTranslation(text, sourceLocale, targetLocale, maxAge = 7 * 24 * 60 * 60 * 1e3) {
    try {
      const key = this.getKey("translation", `${sourceLocale}_${targetLocale}_${text}`);
      const cached = this.adapter.getItem(key);
      if (!cached) return null;
      const cacheEntry = JSON.parse(cached);
      if (cacheEntry.version !== CACHE_VERSION) {
        this.adapter.removeItem(key);
        return null;
      }
      if (Date.now() - cacheEntry.timestamp > maxAge) {
        this.adapter.removeItem(key);
        return null;
      }
      return cacheEntry.data;
    } catch (error) {
      console.warn("Failed to get cached translation:", error);
      return null;
    }
  }
  /**
   * Set cached translation
   */
  setCachedTranslation(text, sourceLocale, targetLocale, translation) {
    try {
      const key = this.getKey("translation", `${sourceLocale}_${targetLocale}_${text}`);
      const cacheEntry = {
        data: translation,
        timestamp: Date.now(),
        version: CACHE_VERSION
      };
      this.adapter.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
      console.warn("Failed to cache translation:", error);
    }
  }
  /**
   * Clear all cached data
   */
  clearCache() {
    try {
      if (this.adapter instanceof MemoryStorageAdapter) {
        this.adapter.clear();
      } else {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key);
          }
        }
        keys.forEach((key) => this.adapter.removeItem(key));
      }
    } catch (error) {
      console.warn("Failed to clear cache:", error);
    }
  }
  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalItems = 0;
    let totalSize = 0;
    try {
      if (this.adapter instanceof MemoryStorageAdapter) {
        return { totalItems: 0, totalSize: 0 };
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          totalItems++;
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length;
          }
        }
      }
    } catch (error) {
      console.warn("Failed to get cache stats:", error);
    }
    return { totalItems, totalSize };
  }
}
const defaultStorageManager = new StorageManager();
function validateApiKey(apiKey) {
  if (!apiKey || typeof apiKey !== "string") {
    return { valid: false, error: "API key is required" };
  }
  if (apiKey.trim() === "") {
    return { valid: false, error: "API key cannot be empty" };
  }
  if (apiKey.length < 10) {
    return { valid: false, error: "API key too short (minimum 10 characters)" };
  }
  if (apiKey.length > 200) {
    return { valid: false, error: "API key too long (maximum 200 characters)" };
  }
  if (apiKey.includes(" ") || apiKey.includes("\n") || apiKey.includes("	")) {
    return { valid: false, error: "API key contains invalid characters" };
  }
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    const testKeyPatterns = ["test", "demo", "mock", "example", "dev"];
    const lowerKey = apiKey.toLowerCase();
    for (const pattern of testKeyPatterns) {
      if (lowerKey.includes(pattern)) {
        console.warn("⚠️ Rustle Security Warning: Using test API key in production");
        break;
      }
    }
  }
  return { valid: true };
}
function isSecureContext() {
  if (typeof window === "undefined") {
    return true;
  }
  return window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
function sanitizeTextInput(input) {
  if (typeof input !== "string") {
    throw new Error("Input must be a string");
  }
  if (input.length > 1e4) {
    throw new Error("Input text too long (max 10000 characters)");
  }
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}
function validateLocale(locale) {
  if (!locale || typeof locale !== "string") {
    return { valid: false, error: "Locale is required" };
  }
  const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!localePattern.test(locale)) {
    return { valid: false, error: "Invalid locale format (expected: en, en-US, etc.)" };
  }
  return { valid: true };
}
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 6e4) {
    __publicField(this, "requests", /* @__PURE__ */ new Map());
    __publicField(this, "maxRequests");
    __publicField(this, "windowMs");
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }
  /**
   * Check if request is allowed
   */
  isAllowed(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter((time) => now - time < this.windowMs);
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    return true;
  }
  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier) {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}
const globalRateLimiter = new RateLimiter();
function getSecurityHeaders() {
  return {};
}
function obfuscateApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return "****";
  }
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  const middle = "*".repeat(Math.max(0, apiKey.length - 8));
  return `${start}${middle}${end}`;
}
function validateSecurityConfig(config) {
  const warnings = [];
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production" && config.debug) {
    warnings.push("Debug mode is enabled in production - this may expose sensitive information");
  }
  if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
    if (config.apiUrl && config.apiUrl.startsWith("http://")) {
      warnings.push("Using insecure HTTP API URL in production - use HTTPS instead");
    }
  }
  if (config.apiKey) {
    const validation = validateApiKey(config.apiKey);
    if (!validation.valid) {
      warnings.push(`API key validation failed: ${validation.error}`);
    }
  }
  return warnings;
}
function generateSecureRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}
function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, error: "Only HTTP and HTTPS URLs are allowed" };
    }
    if (typeof process !== "undefined" && process.env.NODE_ENV === "production") {
      const hostname = parsed.hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.") || hostname.startsWith("10.") || hostname.startsWith("172.")) {
        return { valid: false, error: "Private IP addresses not allowed in production" };
      }
    }
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Invalid URL format" };
  }
}
class RustleAPIError extends Error {
  constructor(message, status, code, isQuotaExceeded, quotaDetails) {
    super(message);
    this.status = status;
    this.code = code;
    this.isQuotaExceeded = isQuotaExceeded;
    this.quotaDetails = quotaDetails;
    this.name = "RustleAPIError";
  }
}
const _RustleNotificationSystem = class _RustleNotificationSystem {
  constructor() {
    __publicField(this, "notificationHistory", /* @__PURE__ */ new Set());
    __publicField(this, "isCI");
    this.isCI = typeof process !== "undefined" && (!!process.env.CI || !!process.env.GITHUB_ACTIONS || !!process.env.GITLAB_CI || !!process.env.JENKINS_URL || !!process.env.TRAVIS || !!process.env.CIRCLECI || !!process.env.BUILDKITE || !!process.env.DRONE);
  }
  static getInstance() {
    if (!_RustleNotificationSystem.instance) {
      _RustleNotificationSystem.instance = new _RustleNotificationSystem();
    }
    return _RustleNotificationSystem.instance;
  }
  /**
   * Show quota exceeded notification
   */
  notifyQuotaExceeded(error) {
    var _a;
    const notificationKey = `quota-exceeded-${((_a = error.quotaDetails) == null ? void 0 : _a.limit) || "unknown"}`;
    if (this.notificationHistory.has(notificationKey)) {
      return;
    }
    this.notificationHistory.add(notificationKey);
    const message = this.formatQuotaMessage(error);
    if (this.isCI) {
      this.logCIError(message, error);
    } else {
      this.logDevelopmentError(message, error);
    }
  }
  /**
   * Show general API error notification
   */
  notifyAPIError(error, context) {
    const notificationKey = `api-error-${error.code || error.status}-${context || "general"}`;
    if (this.notificationHistory.has(notificationKey)) {
      return;
    }
    this.notificationHistory.add(notificationKey);
    const message = this.formatAPIErrorMessage(error, context);
    if (this.isCI) {
      this.logCIError(message, error);
    } else {
      this.logDevelopmentError(message, error);
    }
  }
  formatQuotaMessage(error) {
    const details = error.quotaDetails;
    let message = "🚨 RUSTLE.DEV QUOTA EXCEEDED 🚨\n\n";
    if (details) {
      message += `• Quota Limit: ${details.limit || "Unknown"}
`;
      message += `• Used: ${details.used || "Unknown"}
`;
      if (details.resetDate) {
        message += `• Resets: ${details.resetDate}
`;
      }
    }
    message += "\n📋 NEXT STEPS:\n";
    message += "1. Check your usage at https://rustle.dev/dashboard\n";
    message += "2. Upgrade your plan at https://rustle.dev/pricing\n";
    message += "3. Contact support at support@rustle.dev\n";
    message += "\n📖 Documentation: https://rustle.dev/docs/quota";
    return message;
  }
  formatAPIErrorMessage(error, context) {
    let message = "⚠️ RUSTLE.DEV API ERROR ⚠️\n\n";
    if (context) {
      message += `Context: ${context}
`;
    }
    message += `Error: ${error.message}
`;
    if (error.code) {
      message += `Code: ${error.code}
`;
    }
    if (error.status) {
      message += `Status: ${error.status}
`;
    }
    message += "\n📋 TROUBLESHOOTING:\n";
    message += "1. Check your API key at https://rustle.dev/dashboard\n";
    message += "2. Verify your network connection\n";
    message += "3. Check service status at https://rustle.dev/status\n";
    message += "4. Contact support at support@rustle.dev\n";
    message += "\n📖 Documentation: https://rustle.dev/docs/troubleshooting";
    return message;
  }
  logCIError(message, error) {
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error title=Rustle.dev API Error::${message.replace(/\n/g, "%0A")}`);
    }
    console.error("\n" + "=".repeat(80));
    console.error(message);
    console.error("=".repeat(80) + "\n");
    if (error.isQuotaExceeded && typeof process !== "undefined") {
      process.exitCode = 1;
    }
  }
  logDevelopmentError(message, error) {
    console.group("%c🚨 Rustle.dev Notification", "color: #ff4444; font-weight: bold; font-size: 14px;");
    console.log("%c" + message, "color: #333; line-height: 1.5;");
    if (error.isQuotaExceeded) {
      console.log("%c💡 TIP: Set up quota alerts at https://rustle.dev/dashboard/alerts", "color: #0066cc; font-style: italic;");
    }
    console.groupEnd();
    if (typeof window !== "undefined" && "Notification" in window) {
      this.showBrowserNotification(error);
    }
  }
  showBrowserNotification(error) {
    if (Notification.permission === "granted") {
      new Notification("Rustle.dev API Issue", {
        body: error.isQuotaExceeded ? "Quota exceeded - check your dashboard" : "API error occurred",
        icon: "https://rustle.dev/favicon.ico"
      });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          this.showBrowserNotification(error);
        }
      });
    }
  }
  /**
   * Clear notification history (useful for testing)
   */
  clearHistory() {
    this.notificationHistory.clear();
  }
};
__publicField(_RustleNotificationSystem, "instance");
let RustleNotificationSystem = _RustleNotificationSystem;
function getAPIBaseUrl() {
  const DEFAULT_API_URL = "https://api.rustle.dev/v1";
  const DEFAULT_DEV_API_URL = "https://api.rustle.dev/api";
  const isDevelopment = typeof process !== "undefined" && (process.env.NODE_ENV === "development" || typeof window !== "undefined" && window.location.hostname === "localhost");
  if (typeof process !== "undefined" && process.env) {
    if (process.env.RUSTLE_API_URL) {
      return process.env.RUSTLE_API_URL;
    }
    if (process.env.NEXT_PUBLIC_RUSTLE_API_URL) {
      return process.env.NEXT_PUBLIC_RUSTLE_API_URL;
    }
  }
  if (typeof window !== "undefined") {
    const globalConfig = window.__RUSTLE_CONFIG__;
    if (globalConfig == null ? void 0 : globalConfig.apiUrl) {
      return globalConfig.apiUrl;
    }
  }
  return isDevelopment ? DEFAULT_DEV_API_URL : DEFAULT_API_URL;
}
class APIClient {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "activeRequests", /* @__PURE__ */ new Map());
    __publicField(this, "notificationSystem");
    this.config = {
      baseUrl: getAPIBaseUrl(),
      timeout: 3e4,
      // 30 seconds
      ...config
    };
    this.notificationSystem = RustleNotificationSystem.getInstance();
    const apiKeyValidation = validateApiKey(this.config.apiKey);
    if (!apiKeyValidation.valid) {
      throw new Error(`Invalid API key: ${apiKeyValidation.error}`);
    }
    const urlValidation = validateUrl(this.config.baseUrl);
    if (!urlValidation.valid) {
      throw new Error(`Invalid API URL: ${urlValidation.error}`);
    }
    if (!isSecureContext()) {
      console.warn("⚠️ Rustle Security Warning: API calls should be made over HTTPS in production");
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`🔐 Rustle API Client initialized with key: ${obfuscateApiKey(this.config.apiKey)}`);
    }
  }
  /**
   * Cancel an active request by key
   */
  cancelRequest(requestKey) {
    const controller = this.activeRequests.get(requestKey);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestKey);
      return true;
    }
    return false;
  }
  /**
   * Cancel all active requests
   */
  cancelAllRequests() {
    for (const [key, controller] of this.activeRequests.entries()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }
  async request(endpoint, options = {}, requestKey) {
    const url = `${this.config.baseUrl}${endpoint}`;
    const secureRequestId = requestKey || generateSecureRequestId();
    if (!globalRateLimiter.isAllowed(this.config.apiKey)) {
      throw new RustleAPIError(
        "Rate limit exceeded. Please try again later.",
        429,
        "RATE_LIMIT_EXCEEDED"
      );
    }
    if (requestKey) {
      this.cancelRequest(requestKey);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    this.activeRequests.set(secureRequestId, controller);
    try {
      const securityHeaders = getSecurityHeaders();
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.config.apiKey}`,
          "X-Request-ID": secureRequestId,
          ...securityHeaders,
          ...options.headers
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.activeRequests.delete(secureRequestId);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const isQuotaExceeded = response.status === 429 || errorData.code === "QUOTA_EXCEEDED" || errorData.code === "RATE_LIMIT_EXCEEDED";
        const error = new RustleAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          isQuotaExceeded,
          errorData.quota
        );
        if (isQuotaExceeded) {
          this.notificationSystem.notifyQuotaExceeded(error);
        } else {
          this.notificationSystem.notifyAPIError(error, endpoint);
        }
        throw error;
      }
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      this.activeRequests.delete(secureRequestId);
      if (error instanceof RustleAPIError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new RustleAPIError("Request cancelled or timeout");
        }
        throw new RustleAPIError(`Network error: ${error.message}`);
      }
      throw new RustleAPIError("Unknown error occurred");
    }
  }
  /**
   * Translate a batch of text entries
   */
  async translateBatch(request, requestKey) {
    if (!request.entries || request.entries.length === 0) {
      throw new RustleAPIError("No entries provided for translation");
    }
    if (request.entries.length > 100) {
      throw new RustleAPIError("Too many entries (max 100 per batch)");
    }
    const sourceValidation = validateLocale(request.sourceLanguage);
    if (!sourceValidation.valid) {
      throw new RustleAPIError(`Invalid source language: ${sourceValidation.error}`);
    }
    const targetValidation = validateLocale(request.targetLanguage);
    if (!targetValidation.valid) {
      throw new RustleAPIError(`Invalid target language: ${targetValidation.error}`);
    }
    const sanitizedRequest = {
      ...request,
      entries: request.entries.map((entry) => ({
        ...entry,
        text: sanitizeTextInput(entry.text)
      }))
    };
    const response = await this.request("/translate/batch", {
      method: "POST",
      body: JSON.stringify(sanitizedRequest)
    }, requestKey);
    if (response.success && response.translations) {
      response.translations = cleanBatchTranslations(response.translations);
    }
    return response;
  }
  /**
   * Translate a single text entry
   */
  async translateSingle(text, sourceLanguage, targetLanguage, model, context) {
    const sanitizedText = sanitizeTextInput(text);
    const sourceValidation = validateLocale(sourceLanguage);
    if (!sourceValidation.valid) {
      throw new RustleAPIError(`Invalid source language: ${sourceValidation.error}`);
    }
    const targetValidation = validateLocale(targetLanguage);
    if (!targetValidation.valid) {
      throw new RustleAPIError(`Invalid target language: ${targetValidation.error}`);
    }
    const request = {
      entries: [{
        id: "single",
        text: sanitizedText,
        context: context && context.file && context.tags ? {
          file: context.file,
          tags: context.tags
        } : void 0
      }],
      sourceLanguage,
      targetLanguage,
      model
    };
    const response = await this.translateBatch(request);
    if (!response.success) {
      throw new RustleAPIError(response.error || "Translation failed");
    }
    const translation = response.translations["single"];
    if (!translation) {
      throw new RustleAPIError("No translation returned");
    }
    return cleanTranslation(translation);
  }
  /**
   * Health check endpoint
   */
  async healthCheck() {
    return this.request("/health");
  }
  /**
   * Get supported models and languages
   */
  async getSupportedModels() {
    return this.request("/models");
  }
}
function createAPIClient(config) {
  return new APIClient(config);
}
class TranslationEngine {
  constructor(config, currentLocale, localeData) {
    __publicField(this, "config");
    __publicField(this, "currentLocale");
    __publicField(this, "localeData");
    __publicField(this, "mutationObserver");
    __publicField(this, "intersectionObserver");
    __publicField(this, "apiClient");
    __publicField(this, "fingerprintCounter", 0);
    __publicField(this, "processedElements", /* @__PURE__ */ new WeakSet());
    __publicField(this, "pendingTranslations", /* @__PURE__ */ new Map());
    __publicField(this, "batchTimeout");
    this.config = config;
    this.currentLocale = currentLocale;
    this.localeData = localeData;
    this.apiClient = createAPIClient({ apiKey: config.apiKey });
  }
  /**
   * Initialize the translation engine
   */
  initialize() {
    if (this.config.deactivate) return;
    if (this.config.debug) {
      console.log("🚀 Rustle Translation Engine initializing...", {
        currentLocale: this.currentLocale,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguages: this.config.targetLanguages,
        localeDataKeys: Object.keys(this.localeData)
      });
    }
    this.scanAndProcessDOM();
    this.setupMutationObserver();
    this.setupIntersectionObserver();
    if (process.env.NODE_ENV === "development") {
      setTimeout(() => {
        this.scanForMissingContent();
      }, 1e3);
    }
    if (this.config.debug) {
      console.log("✅ Rustle Translation Engine initialized successfully");
    }
  }
  /**
   * Update locale and re-translate all elements
   */
  updateLocale(newLocale, newLocaleData) {
    this.currentLocale = newLocale;
    this.localeData = newLocaleData;
    this.translateAllElements();
  }
  /**
   * Scan DOM and add fingerprints to translatable elements
   */
  scanAndProcessDOM() {
    const elements = this.getTranslatableElements();
    if (this.config.debug) {
      console.log(`🔍 Rustle: Found ${elements.length} translatable elements`);
    }
    elements.forEach((element, index) => {
      if (!this.processedElements.has(element)) {
        if (this.config.debug && index < 5) {
          console.log(`🔧 Processing element ${index + 1}:`, {
            tag: element.tagName,
            text: this.getElementTextContent(element).substring(0, 50) + "...",
            hasFingerprint: element.hasAttribute("data-i18n-fingerprint")
          });
        }
        this.processElement(element);
        this.processedElements.add(element);
      }
    });
  }
  /**
   * Aggressively scan for missing content that doesn't have fingerprints yet
   * This is used in development mode to catch content that was missed
   */
  scanForMissingContent() {
    if (this.config.debug) {
      console.log("🔍 Rustle: Scanning for missing content...");
    }
    const allElements = document.querySelectorAll("*");
    let missingCount = 0;
    allElements.forEach((element) => {
      if (element.getAttribute("data-i18n-fingerprint")) return;
      if (!this.isTranslatableElement(element)) return;
      const textContent = this.getElementTextContent(element);
      if (!textContent.trim() || textContent.length < 2) return;
      if (!/[a-zA-Z]/.test(textContent)) return;
      if (element.closest("script, style, noscript")) return;
      if (this.config.debug) {
        console.log(`🆕 Rustle: Found missing content: "${textContent.substring(0, 50)}..."`);
      }
      this.processElement(element);
      this.processedElements.add(element);
      missingCount++;
    });
    if (this.config.debug) {
      console.log(`🔍 Rustle: Scan complete. Found ${missingCount} missing content items`);
    }
    if (this.pendingTranslations.size > 0) {
      this.processPendingTranslations();
    }
  }
  /**
   * Get all translatable elements based on config
   */
  getTranslatableElements() {
    const selector = this.buildElementSelector();
    return Array.from(document.querySelectorAll(selector));
  }
  /**
   * Build CSS selector for translatable elements
   */
  buildElementSelector() {
    const { autoConfig } = this.config;
    const defaultElements = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "button", "a", "li"];
    let includeElements = defaultElements;
    if ((autoConfig == null ? void 0 : autoConfig.include) && autoConfig.include.length > 0) {
      includeElements = autoConfig.include;
    }
    const excludeElements = (autoConfig == null ? void 0 : autoConfig.exclude) || ["script", "style", "code", "pre"];
    const excludeSelector = excludeElements.map((tag) => `:not(${tag})`).join("");
    const selector = includeElements.map((tag) => `${tag}${excludeSelector}:not([data-i18n="false"])`).join(", ");
    return selector;
  }
  /**
   * Process a single element - add fingerprint and translate
   */
  processElement(element) {
    const textContent = this.getElementTextContent(element);
    if (!textContent.trim()) return;
    if (element.hasAttribute("data-i18n-fingerprint")) {
      this.translateElement(element);
      return;
    }
    const fingerprint = generateContentFingerprint(textContent);
    element.setAttribute("data-i18n-fingerprint", fingerprint);
    element.setAttribute("data-i18n", "true");
    element.setAttribute("data-i18n-original", textContent);
    this.translateElement(element);
    if (this.config.debug) {
      console.log(`Rustle: Processed element with fingerprint ${fingerprint}:`, textContent);
    }
  }
  /**
   * Simple hash function (replace with proper sha1 in production)
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  /**
   * Get text content from element (excluding child elements)
   */
  getElementTextContent(element) {
    const textNodes = Array.from(element.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent || "").join(" ");
    return textNodes.trim();
  }
  /**
   * Translate a single element based on its fingerprint
   */
  translateElement(element) {
    const fingerprint = element.getAttribute("data-i18n-fingerprint");
    if (!fingerprint) return;
    if (this.config.debug) {
      console.log(`🔍 Translating element with fingerprint: ${fingerprint}`);
      console.log(`📊 Current locale: ${this.currentLocale}`);
      console.log(`📚 Available locales:`, Object.keys(this.localeData));
    }
    if (this.currentLocale === this.config.sourceLanguage) {
      const originalText = element.getAttribute("data-i18n-original");
      if (originalText) {
        this.updateElementText(element, originalText);
        if (this.config.debug) {
          console.log(`✅ Restored original text for ${fingerprint}: ${originalText}`);
        }
      }
      return;
    }
    const currentLocaleData = this.localeData[this.currentLocale];
    if (currentLocaleData && currentLocaleData[fingerprint]) {
      const translatedText = currentLocaleData[fingerprint];
      this.updateElementText(element, translatedText);
      if (this.config.debug) {
        console.log(`✅ Applied translation for ${fingerprint}: ${translatedText}`);
      }
    } else {
      if (this.config.debug) {
        console.log(`❌ No translation found for ${fingerprint} in locale ${this.currentLocale}`);
        console.log(`📋 Available translations for this locale:`, Object.keys(currentLocaleData || {}));
      }
      this.addToPendingTranslations(element, fingerprint);
    }
  }
  /**
   * Add element to pending translations for batch processing
   */
  addToPendingTranslations(element, fingerprint) {
    const locale = this.currentLocale;
    const key = `${locale}:${fingerprint}`;
    if (!this.pendingTranslations.has(key)) {
      this.pendingTranslations.set(key, []);
    }
    const elements = this.pendingTranslations.get(key);
    if (elements && !elements.includes(element)) {
      elements.push(element);
    }
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.batchTimeout = setTimeout(() => {
      this.processPendingTranslations();
    }, 100);
  }
  /**
   * Process all pending translations in batches
   */
  async processPendingTranslations() {
    if (this.pendingTranslations.size === 0) return;
    const locale = this.currentLocale;
    const entries = [];
    const elementMap = /* @__PURE__ */ new Map();
    for (const [key, elements] of this.pendingTranslations.entries()) {
      const [keyLocale, fingerprint] = key.split(":");
      if (keyLocale === locale && elements.length > 0 && fingerprint) {
        const firstElement = elements[0];
        if (firstElement) {
          const originalText = firstElement.getAttribute("data-i18n-original");
          if (originalText) {
            entries.push({ id: fingerprint, text: originalText });
            elementMap.set(fingerprint, elements);
          }
        }
      }
    }
    if (entries.length === 0) return;
    try {
      if (this.config.debug) {
        console.log(`Rustle: Batch translating ${entries.length} entries to ${locale}`);
      }
      const response = await this.apiClient.translateBatch({
        entries,
        sourceLanguage: this.config.sourceLanguage,
        targetLanguage: locale,
        model: this.config.model
      });
      for (const [fingerprint, translatedText] of Object.entries(response.translations)) {
        const elements = elementMap.get(fingerprint);
        if (elements) {
          elements.forEach((element) => {
            this.updateElementText(element, translatedText);
          });
          if (this.config.debug) {
            console.log(`Rustle: Batch translated ${fingerprint}: ${translatedText}`);
          }
        }
        if (!this.localeData[locale]) {
          this.localeData[locale] = {};
        }
        this.localeData[locale][fingerprint] = translatedText;
      }
      for (const [key] of this.pendingTranslations.entries()) {
        const [keyLocale] = key.split(":");
        if (keyLocale === locale) {
          this.pendingTranslations.delete(key);
        }
      }
    } catch (error) {
      console.error("Rustle: Batch translation failed:", error);
      if (this.config.fallback) {
        for (const elements of elementMap.values()) {
          elements.forEach((element) => {
            const originalText = element.getAttribute("data-i18n-original");
            if (originalText) {
              this.updateElementText(element, originalText);
            }
          });
        }
      }
      for (const [key] of this.pendingTranslations.entries()) {
        const [keyLocale] = key.split(":");
        if (keyLocale === locale) {
          this.pendingTranslations.delete(key);
        }
      }
    }
  }
  /**
   * Update element text content
   */
  updateElementText(element, text) {
    var _a;
    const originalText = element.textContent;
    if (this.config.debug) {
      console.log(`🔄 Updating element text:`, {
        tag: element.tagName,
        fingerprint: element.getAttribute("data-i18n-fingerprint"),
        from: (originalText == null ? void 0 : originalText.substring(0, 30)) + "...",
        to: text.substring(0, 30) + "..."
      });
    }
    element.textContent = text;
    if (this.config.debug) {
      console.log(`✅ Element updated. New content:`, ((_a = element.textContent) == null ? void 0 : _a.substring(0, 50)) + "...");
    }
  }
  /**
   * Translate all elements with fingerprints
   */
  translateAllElements() {
    const elements = document.querySelectorAll("[data-i18n-fingerprint]");
    elements.forEach((element) => this.translateElement(element));
  }
  /**
   * Setup MutationObserver to watch for DOM changes
   */
  setupMutationObserver() {
    this.mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node;
            if (this.isTranslatableElement(element)) {
              this.processElement(element);
            }
            const children = this.getTranslatableElementsInSubtree(element);
            children.forEach((child) => this.processElement(child));
          }
        });
      });
    });
    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Setup IntersectionObserver for performance optimization
   */
  setupIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (!this.processedElements.has(element)) {
            this.processElement(element);
            this.processedElements.add(element);
          }
        }
      });
    });
    const elements = this.getTranslatableElements();
    elements.forEach((element) => {
      var _a;
      (_a = this.intersectionObserver) == null ? void 0 : _a.observe(element);
    });
  }
  /**
   * Check if element is translatable based on config
   */
  isTranslatableElement(element) {
    var _a;
    const tagName = element.tagName.toLowerCase();
    const { autoConfig } = this.config;
    if ((_a = autoConfig == null ? void 0 : autoConfig.exclude) == null ? void 0 : _a.includes(tagName)) {
      return false;
    }
    if (element.getAttribute("data-i18n") === "false") {
      return false;
    }
    const defaultElements = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "button", "a", "li"];
    const includeElements = (autoConfig == null ? void 0 : autoConfig.include) || defaultElements;
    return includeElements.includes(tagName);
  }
  /**
   * Get translatable elements in a subtree
   */
  getTranslatableElementsInSubtree(root) {
    const selector = this.buildElementSelector();
    return Array.from(root.querySelectorAll(selector));
  }
  /**
   * Cleanup observers and pending operations
   */
  destroy() {
    var _a, _b;
    (_a = this.mutationObserver) == null ? void 0 : _a.disconnect();
    (_b = this.intersectionObserver) == null ? void 0 : _b.disconnect();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    this.pendingTranslations.clear();
  }
}
class DevModeWatcher {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "observer", null);
    __publicField(this, "missingContent", /* @__PURE__ */ new Map());
    __publicField(this, "processingQueue", /* @__PURE__ */ new Set());
    __publicField(this, "lastProcessTime", 0);
    __publicField(this, "processTimeout", null);
    this.config = config;
  }
  /**
   * Start watching for content changes
   */
  start() {
    if (!this.config.enabled || typeof window === "undefined") {
      return;
    }
    if (this.config.debug) {
      console.log("🔧 DevModeWatcher: Starting development mode content monitoring...");
    }
    this.scanExistingContent();
    this.setupMutationObserver();
    this.setupPeriodicProcessing();
  }
  /**
   * Stop watching
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
      this.processTimeout = null;
    }
    if (this.config.debug) {
      console.log("🔧 DevModeWatcher: Stopped development mode monitoring");
    }
  }
  /**
   * Scan existing content for missing fingerprints
   */
  scanExistingContent() {
    var _a;
    const textNodes = this.findTextNodes(document.body);
    for (const node of textNodes) {
      const text = (_a = node.textContent) == null ? void 0 : _a.trim();
      if (text && isTranslatableText(text)) {
        const element = node.parentElement;
        if (element && !element.hasAttribute("data-i18n-fingerprint")) {
          this.addMissingContent(text, element);
        }
      }
    }
    if (this.config.debug && this.missingContent.size > 0) {
      console.log(`🔧 DevModeWatcher: Found ${this.missingContent.size} elements without fingerprints`);
    }
  }
  /**
   * Set up mutation observer for dynamic content
   */
  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node);
            } else if (node.nodeType === Node.TEXT_NODE) {
              this.checkTextNode(node);
            }
          }
        } else if (mutation.type === "characterData") {
          this.checkTextNode(mutation.target);
        }
      }
    });
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
  /**
   * Set up periodic processing of missing content
   */
  setupPeriodicProcessing() {
    const processInterval = Math.max(this.config.watchInterval, 1e3);
    const scheduleNextProcess = () => {
      this.processTimeout = setTimeout(() => {
        this.processMissingContent();
        scheduleNextProcess();
      }, processInterval);
    };
    scheduleNextProcess();
  }
  /**
   * Find all text nodes in an element
   */
  findTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node2) => {
          var _a;
          const text = (_a = node2.textContent) == null ? void 0 : _a.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    return textNodes;
  }
  /**
   * Scan an element for missing fingerprints
   */
  scanElement(element) {
    const textNodes = this.findTextNodes(element);
    for (const node of textNodes) {
      this.checkTextNode(node);
    }
  }
  /**
   * Check a text node for missing fingerprint
   */
  checkTextNode(textNode) {
    var _a;
    const text = (_a = textNode.textContent) == null ? void 0 : _a.trim();
    if (!text || !isTranslatableText(text)) {
      return;
    }
    const element = textNode.parentElement;
    if (element && !element.hasAttribute("data-i18n-fingerprint")) {
      this.addMissingContent(text, element);
    }
  }
  /**
   * Add content to missing content queue
   */
  addMissingContent(text, element) {
    const fingerprint = generateContentFingerprint(text);
    if (!this.missingContent.has(fingerprint)) {
      this.missingContent.set(fingerprint, {
        text,
        fingerprint,
        element,
        timestamp: Date.now()
      });
      if (this.config.debug) {
        console.log(`🔧 DevModeWatcher: Added missing content: "${text}" → ${fingerprint}`);
      }
    }
  }
  /**
   * Process missing content queue
   */
  async processMissingContent() {
    if (this.missingContent.size === 0) {
      return;
    }
    const now = Date.now();
    const minProcessInterval = 5e3;
    if (now - this.lastProcessTime < minProcessInterval) {
      return;
    }
    this.lastProcessTime = now;
    if (this.config.debug) {
      console.log(`🔧 DevModeWatcher: Processing ${this.missingContent.size} missing content items...`);
    }
    const contentToProcess = Array.from(this.missingContent.values());
    for (const item of contentToProcess) {
      if (item.element.isConnected) {
        item.element.setAttribute("data-i18n-fingerprint", item.fingerprint);
        if (this.config.debug) {
          console.log(`🔧 DevModeWatcher: Added fingerprint to element: ${item.fingerprint}`);
        }
      }
    }
    if (this.config.autoExtract && contentToProcess.length > 0) {
      this.simulateFileUpdates(contentToProcess);
    }
    this.missingContent.clear();
  }
  /**
   * Simulate file updates (in real implementation, this would update actual files)
   */
  simulateFileUpdates(content) {
    if (this.config.debug) {
      console.log("🔧 DevModeWatcher: Would update files with new content:");
      const masterEntries = content.map((item) => ({
        fingerprint: item.fingerprint,
        source: item.text,
        status: "new"
      }));
      console.log("📄 master.json updates:", masterEntries);
      for (const locale of this.config.targetLanguages) {
        const localeEntries = content.reduce((acc, item) => {
          acc[item.fingerprint] = `[${locale.toUpperCase()}] ${item.text}`;
          return acc;
        }, {});
        console.log(`📄 ${locale}.json updates:`, localeEntries);
      }
    }
  }
  /**
   * Get current statistics
   */
  getStats() {
    return {
      missingContentCount: this.missingContent.size,
      isActive: this.observer !== null,
      lastProcessTime: this.lastProcessTime
    };
  }
}
let globalWatcher = null;
function initDevModeWatcher(config) {
  if (globalWatcher) {
    globalWatcher.stop();
  }
  globalWatcher = new DevModeWatcher(config);
  globalWatcher.start();
  return globalWatcher;
}
function stopDevModeWatcher() {
  if (globalWatcher) {
    globalWatcher.stop();
    globalWatcher = null;
  }
}
const RustleContext = createContext(null);
function rustleReducer(state, action) {
  switch (action.type) {
    case "SET_LOCALE":
      return {
        ...state,
        currentLocale: action.payload,
        error: null
      };
    case "SET_LOCALE_DATA":
      return {
        ...state,
        localeData: {
          ...state.localeData,
          [action.payload.locale]: action.payload.data
        }
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
}
function RustleProvider({
  config,
  children,
  initialLocaleData = {},
  cookieString
}) {
  const translationEngineRef = useRef(null);
  const getInitialLocale = () => {
    if (config.currentLocale) {
      if (config.debug) {
        console.log(`🔧 RustleContext: Using config locale: ${config.currentLocale}`);
      }
      return config.currentLocale;
    }
    const cookieLocale = getLocaleFromCookie(cookieString);
    if (cookieLocale && config.targetLanguages.includes(cookieLocale)) {
      if (config.debug) {
        console.log(`🍪 RustleContext: Using cookie locale: ${cookieLocale}`);
      }
      return cookieLocale;
    }
    if (config.debug) {
      console.log(`🔄 RustleContext: Using fallback locale: ${config.sourceLanguage}`);
    }
    return config.sourceLanguage;
  };
  const [state, dispatch] = useReducer(rustleReducer, {
    currentLocale: getInitialLocale(),
    localeData: initialLocaleData,
    isLoading: false,
    error: null
  });
  useEffect(() => {
    if (config.deactivate) return;
    const loadLocaleData = async () => {
      const { currentLocale } = state;
      if (state.localeData[currentLocale]) {
        return;
      }
      if (currentLocale === config.sourceLanguage) {
        return;
      }
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const localeBasePath = config.localeBasePath || "/rustle/locales";
        const staticUrl = `${localeBasePath}/${currentLocale}.json`;
        if (config.debug) {
          console.log(`📁 RustleContext: Attempting to load static file: ${staticUrl}`);
        }
        try {
          const response = await fetch(staticUrl);
          if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
              dispatch({
                type: "SET_LOCALE_DATA",
                payload: { locale: currentLocale, data }
              });
              defaultStorageManager.cacheLocaleData(currentLocale, data);
              dispatch({ type: "SET_LOADING", payload: false });
              if (config.debug) {
                console.log(`✅ RustleContext: Successfully loaded static locale ${currentLocale} with ${Object.keys(data).length} entries`);
                console.log(`📊 RustleContext: Sample entries:`, Object.keys(data).slice(0, 3));
              }
              return;
            } else {
              if (config.debug) {
                console.warn(`⚠️ RustleContext: Static locale file ${staticUrl} is empty or invalid`);
              }
            }
          } else {
            if (config.debug) {
              console.warn(`⚠️ RustleContext: Static locale file not found: ${staticUrl} (${response.status})`);
            }
          }
        } catch (staticError) {
          if (config.debug) {
            console.warn(`⚠️ RustleContext: Failed to load static locale ${currentLocale}:`, staticError);
          }
        }
        const cachedData = defaultStorageManager.getCachedLocaleData(currentLocale);
        if (cachedData && Object.keys(cachedData).length > 0) {
          dispatch({
            type: "SET_LOCALE_DATA",
            payload: { locale: currentLocale, data: cachedData }
          });
          dispatch({ type: "SET_LOADING", payload: false });
          if (config.debug) {
            console.log(`💾 RustleContext: Using cached locale ${currentLocale} with ${Object.keys(cachedData).length} entries`);
          }
          return;
        }
        dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        console.error("Failed to load locale data:", error);
        dispatch({
          type: "SET_ERROR",
          payload: error instanceof Error ? error.message : "Failed to load translations"
        });
      }
    };
    loadLocaleData();
  }, [state.currentLocale, config.deactivate, config.sourceLanguage]);
  useEffect(() => {
    if (config.deactivate || typeof window === "undefined") return;
    const preloadAllLocales = async () => {
      if (config.debug) {
        console.log(`🚀 RustleContext: Preloading ALL locale files for cost optimization...`);
      }
      const localeBasePath = config.localeBasePath || "/rustle/locales";
      const loadPromises = config.targetLanguages.map(async (locale) => {
        if (state.localeData[locale] || locale === config.sourceLanguage) {
          return;
        }
        try {
          const response = await fetch(`${localeBasePath}/${locale}.json`);
          if (response.ok) {
            const data = await response.json();
            if (data && Object.keys(data).length > 0) {
              dispatch({
                type: "SET_LOCALE_DATA",
                payload: { locale, data }
              });
              defaultStorageManager.cacheLocaleData(locale, data);
              if (config.debug) {
                console.log(`✅ RustleContext: Preloaded ${locale}.json with ${Object.keys(data).length} entries`);
              }
            }
          }
        } catch (error) {
          if (config.debug) {
            console.warn(`⚠️ RustleContext: Failed to preload ${locale}:`, error);
          }
        }
      });
      await Promise.all(loadPromises);
      if (config.debug) {
        const totalLoaded = Object.keys(state.localeData).length;
        console.log(`🎯 RustleContext: Preloading completed. Total locales loaded: ${totalLoaded}`);
      }
    };
    preloadAllLocales();
  }, [config.targetLanguages, config.localeBasePath, config.debug, config.deactivate, config.sourceLanguage]);
  useEffect(() => {
    if (config.deactivate) return;
    const securityWarnings = validateSecurityConfig(config);
    if (securityWarnings.length > 0) {
      securityWarnings.forEach((warning) => {
        console.warn(`⚠️ Rustle Security Warning: ${warning}`);
      });
    }
    if (typeof window !== "undefined") {
      translationEngineRef.current = new TranslationEngine(config, state.currentLocale, state.localeData);
      if (process.env.NODE_ENV === "development" && config.auto) {
        initDevModeWatcher({
          enabled: true,
          debug: config.debug,
          autoExtract: true,
          watchInterval: 3e3,
          // Check every 3 seconds
          apiKey: config.apiKey,
          sourceLanguage: config.sourceLanguage,
          targetLanguages: config.targetLanguages,
          localeBasePath: config.localeBasePath || "/rustle/locales"
        });
        if (config.debug) {
          console.log("🔧 Rustle: Auto-extraction and dev mode watcher enabled");
        }
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          var _a;
          (_a = translationEngineRef.current) == null ? void 0 : _a.initialize();
        });
      } else {
        setTimeout(() => {
          var _a;
          (_a = translationEngineRef.current) == null ? void 0 : _a.initialize();
        }, 100);
      }
    }
    return () => {
      var _a;
      (_a = translationEngineRef.current) == null ? void 0 : _a.destroy();
      if (process.env.NODE_ENV === "development") {
        stopDevModeWatcher();
      }
    };
  }, [config]);
  useEffect(() => {
    if (translationEngineRef.current) {
      translationEngineRef.current.updateLocale(state.currentLocale, state.localeData);
    }
  }, [state.currentLocale, state.localeData]);
  const setLocale = (locale) => {
    if (config.deactivate) return;
    if (!config.targetLanguages.includes(locale) && locale !== config.sourceLanguage) {
      console.warn(`Locale ${locale} is not in target languages`);
      return;
    }
    const previousLocale = state.currentLocale;
    dispatch({ type: "SET_LOCALE", payload: locale });
    setLocaleToCookie(locale);
    if (typeof window !== "undefined" && locale !== previousLocale) {
      const event = new CustomEvent("rustleLocaleChanged", {
        detail: {
          locale,
          previousLocale,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(event);
      if (config.debug) {
        console.log(`📡 RustleContext: Emitted rustleLocaleChanged event for ${locale}`);
      }
    }
    if (config.debug) {
      console.log(`Rustle: Locale changed to ${locale}`);
    }
  };
  const contextValue = {
    config,
    currentLocale: state.currentLocale,
    setLocale,
    localeData: state.localeData,
    isLoading: state.isLoading,
    error: state.error
  };
  return /* @__PURE__ */ jsx(RustleContext.Provider, { value: contextValue, children });
}
function useRustleContext() {
  const context = useContext(RustleContext);
  if (!context) {
    throw new Error("useRustleContext must be used within a RustleProvider");
  }
  return context;
}
function AutoTranslate({ children }) {
  const { currentLocale, localeData, config } = useRustleContext();
  const translations = useMemo(() => {
    if (!localeData[currentLocale]) {
      if (config.debug) {
        console.log(`🔍 AutoTranslate: No translations found for locale ${currentLocale}`);
      }
      return {};
    }
    if (config.debug) {
      console.log(`✅ AutoTranslate: Using translations for locale ${currentLocale} with ${Object.keys(localeData[currentLocale]).length} entries`);
    }
    return localeData[currentLocale];
  }, [currentLocale, localeData, config.debug]);
  const getTranslationByText = useCallback((text) => {
    if (!text || typeof text !== "string") return null;
    if (translations[text]) {
      return translations[text];
    }
    for (const [key, value] of Object.entries(translations)) {
      if (value === text || key === text) {
        return value;
      }
    }
    const normalizedText = text.trim().toLowerCase();
    for (const [, value] of Object.entries(translations)) {
      if (typeof value === "string" && value.trim().toLowerCase() === normalizedText) {
        return value;
      }
    }
    return null;
  }, [translations]);
  const processChildren = useCallback((children2) => {
    return React.Children.map(children2, (child) => {
      if (React.isValidElement(child)) {
        const props = child.props;
        const isPaused = props["data-i18n-pause"] === "true" || props["data-i18n-pause"] === true;
        if (isPaused) {
          if (config.debug) {
            console.log(`⏸️ AutoTranslate: Translation paused for element with fingerprint ${props["data-i18n-fingerprint"]}`);
          }
          return child;
        }
        const fingerprint = props["data-i18n-fingerprint"];
        let translatedText = null;
        if (fingerprint && translations[fingerprint]) {
          translatedText = translations[fingerprint];
          if (config.debug) {
            console.log(`🔄 AutoTranslate: Translating ${fingerprint}: "${props.children}" → "${translatedText}"`);
          }
        } else if (typeof props.children === "string" && props.children.trim()) {
          translatedText = getTranslationByText(props.children);
          if (translatedText && config.debug) {
            console.log(`🔄 AutoTranslate: Translating text: "${props.children}" → "${translatedText}"`);
          }
          if (!translatedText && process.env.NODE_ENV === "development" && config.auto) {
            const generatedFingerprint = generateContentFingerprint(props.children);
            if (config.debug) {
              console.log(`🔧 AutoTranslate: Generated fingerprint for missing content: "${props.children}" → ${generatedFingerprint}`);
            }
          }
        }
        if (translatedText) {
          return React.cloneElement(child, {
            ...props,
            "data-i18n-original": props.children,
            "data-i18n": "true"
          }, translatedText);
        }
        if (props.children) {
          const processedChildren = processChildren(props.children);
          return React.cloneElement(child, props, processedChildren);
        }
      }
      return child;
    });
  }, [translations, config.debug]);
  return /* @__PURE__ */ jsx(Fragment, { children: processChildren(children) });
}
const defaultLoadingConfig = {
  enabled: true,
  type: "skeleton",
  // Will use WordSkeletonLoader when originalText is available
  duration: 0,
  // No artificial delay - show immediately when needed
  skeletonProps: {
    height: "1em",
    width: "100%",
    borderRadius: "3px",
    backgroundColor: "#e2e8f0",
    animationDuration: "1.2s"
    // Faster animation for better UX
  }
};
function RustleBox({
  children,
  sourceLanguage = "en",
  targetLanguages = ["es", "fr", "de", "it", "pt"],
  apiKey,
  // Required, no default value
  model = "gpt-3.5-turbo",
  debug = false,
  auto = true,
  fallback = true,
  initialLocale,
  serverLocale,
  useVirtualDOM = true,
  localeBasePath = "/rustle/locales",
  loadingConfig = defaultLoadingConfig
}) {
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("RustleBox: apiKey is required. Please provide a valid API key to use Rustle.dev services.");
  }
  const currentLocale = (() => {
    const cookieLocale = getLocaleFromCookie();
    if (cookieLocale && targetLanguages.includes(cookieLocale)) {
      if (debug) {
        console.log(`🍪 RustleBox: Using locale from cookie: ${cookieLocale}`);
      }
      return cookieLocale;
    }
    const fallbackLocale = serverLocale || initialLocale || sourceLanguage;
    if (debug) {
      console.log(`🔄 RustleBox: Using fallback locale: ${fallbackLocale}`);
    }
    return fallbackLocale;
  })();
  const localeData = {};
  const switchLocale = (newLocale) => {
    if (targetLanguages.includes(newLocale)) {
      if (debug) {
        console.log(`🌐 RustleBox: Switching locale to: ${newLocale}`);
      }
      setLocaleToCookie(newLocale);
      if (debug) {
        console.log(`🍪 RustleBox: Saved locale ${newLocale} to cookie`);
      }
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } else {
      console.warn(`⚠️ RustleBox: Invalid locale: ${newLocale}. Valid locales: [${targetLanguages.join(", ")}]`);
    }
  };
  if (typeof window !== "undefined") {
    window.rustleSwitchLocale = switchLocale;
    if (debug) {
      console.log("🌍 RustleBox: Global locale switcher available: window.rustleSwitchLocale(locale)");
    }
  }
  const config = {
    deactivate: false,
    sourceLanguage,
    targetLanguages,
    currentLocale,
    apiKey,
    model,
    debug,
    auto,
    fallback,
    localeBasePath,
    useVirtualDOM,
    loadingConfig,
    switchLocale
    // Add switchLocale to config for useRustle hook
  };
  if (debug) {
    console.log("🔍 RustleBox: Rendering with config:", {
      currentLocale,
      useVirtualDOM,
      localeDataKeys: Object.keys(localeData),
      isSSR: typeof window === "undefined"
    });
  }
  return /* @__PURE__ */ jsx(RustleProvider, { config, initialLocaleData: localeData, children: useVirtualDOM ? /* @__PURE__ */ jsx(AutoTranslate, { children }) : children });
}
function useRustle() {
  const context = useRustleContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { config, currentLocale, setLocale, localeData } = context;
  const translate = useCallback(async (text, targetLocale) => {
    var _a;
    if (config.deactivate) {
      return text;
    }
    const target = targetLocale || currentLocale;
    if (target === config.sourceLanguage) {
      return text;
    }
    const staticTranslation = (_a = localeData[target]) == null ? void 0 : _a[text];
    if (staticTranslation) {
      return staticTranslation;
    }
    const cachedTranslation = defaultStorageManager.getCachedTranslation(
      text,
      config.sourceLanguage,
      target
    );
    if (cachedTranslation) {
      return cachedTranslation;
    }
    setIsLoading(true);
    setError(null);
    try {
      const apiClient = createAPIClient({
        apiKey: config.apiKey
      });
      const translation = await apiClient.translateSingle(
        text,
        config.sourceLanguage,
        target,
        config.model
      );
      defaultStorageManager.cacheTranslation(
        text,
        config.sourceLanguage,
        target,
        translation
      );
      if (config.debug) {
        console.log(`Rustle: Translated "${text}" to "${translation}" (${target})`);
      }
      setIsLoading(false);
      return translation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Translation failed";
      setError(errorMessage);
      setIsLoading(false);
      if (config.debug) {
        console.error("Rustle: Translation error:", err);
      }
      if (config.fallback) {
        return text;
      }
      throw new Error(errorMessage);
    }
  }, [config, currentLocale, localeData]);
  return {
    currentLocale,
    setLocale,
    translate,
    isLoading: isLoading || context.isLoading,
    error: error || context.error
  };
}
export {
  AutoTranslate as A,
  RustleBox as R,
  StorageManager as S,
  useRustleContext as a,
  RustleAPIError as b,
  createAPIClient as c,
  defaultStorageManager as d,
  useRustle as u
};
