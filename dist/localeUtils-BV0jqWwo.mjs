"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { g as getLocaleFromCookie, s as setLocaleToCookie } from "./cookies-C2ACDSut.mjs";
function interpolateText(template, variables) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = variables[key];
    return value !== void 0 ? String(value) : match;
  });
}
function extractTemplate(text, patterns) {
  let template = text;
  patterns.forEach(({ regex, placeholder }) => {
    template = template.replace(regex, placeholder);
  });
  return template;
}
const commonPatterns = [
  { regex: /\b\d+\b/g, placeholder: "{count}" },
  { regex: /\b\d+\.\d+\b/g, placeholder: "{amount}" },
  { regex: /\b[A-Z][a-z]+ \d{1,2}, \d{4}\b/g, placeholder: "{date}" },
  { regex: /\b\d{1,2}:\d{2}(:\d{2})?\b/g, placeholder: "{time}" }
];
class PathLocaleManager {
  /**
   * Extract locale from URL path (e.g., /en/about, /fr/contact)
   */
  static extractLocaleFromPath(pathname, supportedLocales = ["en", "es", "fr", "de", "it", "pt"]) {
    const pathSegments = pathname.replace(/^\/+/, "").split("/");
    const firstSegment = pathSegments[0];
    if (firstSegment && supportedLocales.includes(firstSegment)) {
      const locale = firstSegment;
      const pathWithoutLocale = "/" + pathSegments.slice(1).join("/");
      return { locale, pathWithoutLocale };
    }
    return { locale: null, pathWithoutLocale: pathname };
  }
  /**
   * Add locale to path (e.g., /about -> /fr/about)
   */
  static addLocaleToPath(pathname, locale) {
    const { pathWithoutLocale } = this.extractLocaleFromPath(pathname);
    const cleanPath = pathWithoutLocale.replace(/^\/+/, "");
    return `/${locale}${cleanPath ? "/" + cleanPath : ""}`;
  }
  /**
   * Remove locale from path (e.g., /fr/about -> /about)
   */
  static removeLocaleFromPath(pathname, supportedLocales = ["en", "es", "fr", "de", "it", "pt"]) {
    const { pathWithoutLocale } = this.extractLocaleFromPath(pathname, supportedLocales);
    return pathWithoutLocale || "/";
  }
  /**
   * Check if path contains a locale
   */
  static hasLocaleInPath(pathname, supportedLocales = ["en", "es", "fr", "de", "it", "pt"]) {
    const { locale } = this.extractLocaleFromPath(pathname, supportedLocales);
    return locale !== null;
  }
  /**
   * Generate localized paths for all supported locales
   */
  static generateLocalizedPaths(basePath, supportedLocales = ["en", "es", "fr", "de", "it", "pt"]) {
    const { pathWithoutLocale } = this.extractLocaleFromPath(basePath, supportedLocales);
    const paths = {};
    supportedLocales.forEach((locale) => {
      paths[locale] = this.addLocaleToPath(pathWithoutLocale, locale);
    });
    return paths;
  }
}
class ServerLocaleManager {
  /**
   * Get locale from server-side sources (path, headers, cookies)
   */
  static getServerLocale(request, supportedLocales = ["en", "es", "fr", "de", "it", "pt"]) {
    var _a, _b;
    if (!request) return "en";
    const pathname = request.pathname || request.url;
    if (pathname) {
      const { locale } = PathLocaleManager.extractLocaleFromPath(pathname, supportedLocales);
      if (locale) {
        return locale;
      }
    }
    const cookieLocale = (_a = request.cookies) == null ? void 0 : _a["rustle-locale"];
    if (cookieLocale && supportedLocales.includes(cookieLocale)) {
      return cookieLocale;
    }
    const acceptLanguage = (_b = request.headers) == null ? void 0 : _b["accept-language"];
    if (acceptLanguage) {
      const languages = acceptLanguage.split(",").map((lang) => {
        var _a2, _b2, _c, _d;
        return (_d = (_c = (_b2 = (_a2 = lang == null ? void 0 : lang.split(";")) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.trim()) == null ? void 0 : _c.split("-")) == null ? void 0 : _d[0];
      }).filter((lang) => lang && supportedLocales.includes(lang));
      if (languages.length > 0) {
        return languages[0];
      }
    }
    return "en";
  }
  /**
   * Set locale on server-side (for SSR)
   */
  static setServerLocale(locale, response) {
    if (!response) return;
    const cookieValue = `rustle-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    if (response.setHeader) {
      response.setHeader("Set-Cookie", cookieValue);
    } else if (response.headers) {
      response.headers["Set-Cookie"] = cookieValue;
    }
  }
}
class UniversalLocaleManager {
  /**
   * Configure path-based routing
   */
  static configurePathBasedRouting(enabled, supportedLocales) {
    this.pathBasedRouting = enabled;
    if (supportedLocales) {
      this.supportedLocales = supportedLocales;
    }
  }
  /**
   * Get current locale (works on both client and server)
   */
  static getCurrentLocale() {
    if (typeof window !== "undefined" && this.pathBasedRouting) {
      const { locale } = PathLocaleManager.extractLocaleFromPath(
        window.location.pathname,
        this.supportedLocales
      );
      if (locale) {
        this.currentLocale = locale;
        return locale;
      }
    }
    if (typeof window !== "undefined") {
      const cookieLocale = getLocaleFromCookie();
      if (cookieLocale) {
        this.currentLocale = cookieLocale;
      }
    }
    return this.currentLocale;
  }
  /**
   * Set current locale (works on both client and server)
   */
  static setCurrentLocale(locale, updatePath = true) {
    this.currentLocale = locale;
    if (typeof window !== "undefined") {
      setLocaleToCookie(locale);
      if (this.pathBasedRouting && updatePath) {
        const newPath = PathLocaleManager.addLocaleToPath(window.location.pathname, locale);
        const newUrl = newPath + window.location.search + window.location.hash;
        window.history.pushState(null, "", newUrl);
      }
    }
    this.listeners.forEach((listener) => listener(locale));
  }
  /**
   * Navigate to a path with locale
   */
  static navigateToLocalizedPath(path, locale) {
    if (typeof window === "undefined") return;
    const targetLocale = locale || this.currentLocale;
    if (this.pathBasedRouting) {
      const localizedPath = PathLocaleManager.addLocaleToPath(path, targetLocale);
      window.location.href = localizedPath;
    } else {
      this.setCurrentLocale(targetLocale, false);
      window.location.href = path;
    }
  }
  /**
   * Subscribe to locale changes
   */
  static subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  /**
   * Initialize locale from server-side data
   */
  static initializeFromServer(serverLocale) {
    this.currentLocale = serverLocale;
  }
}
__publicField(UniversalLocaleManager, "currentLocale", "en");
__publicField(UniversalLocaleManager, "listeners", []);
__publicField(UniversalLocaleManager, "pathBasedRouting", false);
__publicField(UniversalLocaleManager, "supportedLocales", ["en", "es", "fr", "de", "it", "pt"]);
function createLocaleManager(initialLocale) {
  if (initialLocale) {
    UniversalLocaleManager.initializeFromServer(initialLocale);
  }
  return {
    getCurrentLocale: () => UniversalLocaleManager.getCurrentLocale(),
    setLocale: (locale, updatePath) => UniversalLocaleManager.setCurrentLocale(locale, updatePath),
    subscribe: (listener) => UniversalLocaleManager.subscribe(listener),
    navigateToLocalizedPath: (path, locale) => UniversalLocaleManager.navigateToLocalizedPath(path, locale),
    configurePathBasedRouting: (enabled, supportedLocales) => UniversalLocaleManager.configurePathBasedRouting(enabled, supportedLocales)
  };
}
class AdvancedPathLocaleManager {
  /**
   * Configure path-based routing
   */
  static configure(config) {
    this.config = { ...this.config, ...config };
    UniversalLocaleManager.configurePathBasedRouting(
      this.config.enabled,
      this.config.supportedLocales
    );
  }
  /**
   * Check if path should be excluded from locale handling
   */
  static shouldExcludePath(pathname) {
    var _a;
    return ((_a = this.config.excludePaths) == null ? void 0 : _a.some(
      (excludePath) => pathname.startsWith(excludePath)
    )) || false;
  }
  /**
   * Get locale from request with advanced path handling
   */
  static getLocaleFromRequest(request) {
    const { pathname } = request;
    if (this.shouldExcludePath(pathname)) {
      return { locale: this.config.defaultLocale, shouldRedirect: false };
    }
    const { locale: pathLocale, pathWithoutLocale } = PathLocaleManager.extractLocaleFromPath(
      pathname,
      this.config.supportedLocales
    );
    if (pathLocale) {
      return { locale: pathLocale, shouldRedirect: false };
    }
    const fallbackLocale = ServerLocaleManager.getServerLocale(
      { ...request, pathname: void 0 },
      // Don't use pathname for fallback detection
      this.config.supportedLocales
    );
    if (fallbackLocale === this.config.defaultLocale && !this.config.includeDefaultLocaleInPath) {
      return { locale: fallbackLocale, shouldRedirect: false };
    }
    if (this.config.redirectToDefaultLocale) {
      const redirectPath = PathLocaleManager.addLocaleToPath(pathname, fallbackLocale);
      return {
        locale: fallbackLocale,
        shouldRedirect: true,
        redirectPath
      };
    }
    return { locale: fallbackLocale, shouldRedirect: false };
  }
  /**
   * Generate alternate language links for SEO
   */
  static generateAlternateLinks(currentPath, baseUrl = "") {
    const { pathWithoutLocale } = PathLocaleManager.extractLocaleFromPath(
      currentPath,
      this.config.supportedLocales
    );
    return this.config.supportedLocales.map((locale) => {
      let href;
      if (locale === this.config.defaultLocale && !this.config.includeDefaultLocaleInPath) {
        href = pathWithoutLocale;
      } else {
        href = PathLocaleManager.addLocaleToPath(pathWithoutLocale, locale);
      }
      return {
        locale,
        href: baseUrl + href,
        hreflang: locale === this.config.defaultLocale ? "x-default" : locale
      };
    });
  }
  /**
   * Get configuration
   */
  static getConfig() {
    return { ...this.config };
  }
}
__publicField(AdvancedPathLocaleManager, "config", {
  enabled: false,
  supportedLocales: ["en", "es", "fr", "de", "it", "pt"],
  defaultLocale: "en",
  excludePaths: ["/api", "/static", "/_next", "/favicon.ico"],
  includeDefaultLocaleInPath: false,
  redirectToDefaultLocale: true
});
class MetadataPathManager {
  static setBasePath(path) {
    this.basePath = path.endsWith("/") ? path.slice(0, -1) : path;
  }
  static getBasePath() {
    return this.basePath;
  }
  static getLocalePath(locale) {
    return `${this.basePath}/${locale}.json`;
  }
  static getMasterPath() {
    return `${this.basePath}/master.json`;
  }
}
__publicField(MetadataPathManager, "basePath", "/rustle/locales");
export {
  AdvancedPathLocaleManager as A,
  MetadataPathManager as M,
  PathLocaleManager as P,
  ServerLocaleManager as S,
  UniversalLocaleManager as U,
  createLocaleManager as a,
  commonPatterns as c,
  extractTemplate as e,
  interpolateText as i
};
