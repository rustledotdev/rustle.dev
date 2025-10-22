"use client";
import { readFileSync } from "fs";
import { join } from "path";
import { g as getLocaleFromCookie, c as createServerLocaleCookie } from "./cookies-C2ACDSut.mjs";
import "./index-B8ciGoAd.mjs";
async function loadServerLocaleData(locale, options = {}) {
  const {
    localeBasePath = "./public/rustle/locales",
    fallback = true,
    sourceLanguage = "en",
    debug = false
  } = options;
  try {
    const localePath = join(process.cwd(), localeBasePath, `${locale}.json`);
    const data = readFileSync(localePath, "utf-8");
    const localeData = JSON.parse(data);
    if (debug) {
      console.log(`✅ Server: Loaded locale ${locale} with ${Object.keys(localeData).length} entries`);
    }
    return localeData;
  } catch (error) {
    if (debug) {
      console.warn(`⚠️ Server: Failed to load locale ${locale}:`, error);
    }
    if (fallback && locale !== sourceLanguage) {
      if (debug) {
        console.log(`🔄 Server: Falling back to source language ${sourceLanguage}`);
      }
      return loadServerLocaleData(sourceLanguage, options);
    }
    return null;
  }
}
function getServerLocale(cookieHeader, acceptLanguageHeader, options = {}) {
  const {
    sourceLanguage = "en",
    targetLanguages = ["es", "fr", "de", "it", "pt"]
  } = options;
  const cookieLocale = getLocaleFromCookie(cookieHeader);
  if (cookieLocale && targetLanguages.includes(cookieLocale)) {
    return cookieLocale;
  }
  if (acceptLanguageHeader) {
    const preferredLanguages = acceptLanguageHeader.split(",").map((lang) => {
      var _a;
      const langCode = (_a = lang.split(";")[0]) == null ? void 0 : _a.trim().split("-")[0];
      return langCode;
    }).filter((lang) => lang && targetLanguages.includes(lang));
    if (preferredLanguages.length > 0) {
      return preferredLanguages[0];
    }
  }
  return sourceLanguage;
}
function createServerLocaleHeader(locale) {
  return createServerLocaleCookie(locale);
}
function translateServer(fingerprint, originalText, localeData, fallback = true) {
  if (!localeData || !localeData[fingerprint]) {
    return fallback ? originalText : "";
  }
  return localeData[fingerprint];
}
function injectServerTranslations(html, localeData, options = {}) {
  if (!localeData) {
    return html;
  }
  const { debug = false } = options;
  let translatedHtml = html;
  let translationCount = 0;
  const fingerprintPattern = /(<[^>]*data-i18n-fingerprint=["']([^"']+)["'][^>]*>)([^<]+)(<\/[^>]+>)/g;
  translatedHtml = translatedHtml.replace(fingerprintPattern, (match, openTag, fingerprint, content, closeTag) => {
    const translation = localeData[fingerprint];
    if (translation) {
      translationCount++;
      if (debug) {
        console.log(`🔄 Server: Translating ${fingerprint}: "${content}" → "${translation}"`);
      }
      const enhancedOpenTag = openTag.replace(">", ` data-i18n-original="${content}" data-i18n="true">`);
      return `${enhancedOpenTag}${translation}${closeTag}`;
    }
    return match;
  });
  if (debug && translationCount > 0) {
    console.log(`✅ Server: Applied ${translationCount} translations`);
  }
  return translatedHtml;
}
function createLocaleMiddleware(options = {}) {
  const {
    sourceLanguage = "en",
    targetLanguages = ["es", "fr", "de", "it", "pt"],
    debug = false
  } = options;
  return function localeMiddleware(request) {
    const cookieHeader = request.headers.get("cookie");
    const acceptLanguageHeader = request.headers.get("accept-language");
    const detectedLocale = getServerLocale(cookieHeader, acceptLanguageHeader, {
      sourceLanguage,
      targetLanguages
    });
    if (debug) {
      console.log(`🌐 Middleware: Detected locale ${detectedLocale} for ${request.url}`);
    }
    return {
      locale: detectedLocale,
      cookieHeader: createServerLocaleHeader(detectedLocale)
    };
  };
}
export {
  createLocaleMiddleware as a,
  createServerLocaleHeader as c,
  getServerLocale as g,
  injectServerTranslations as i,
  loadServerLocaleData as l,
  translateServer as t
};
