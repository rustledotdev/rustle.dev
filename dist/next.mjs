"use client";
import { R as RustleConfigSchema } from "./index-B8ciGoAd.mjs";
import { A, b, F, G, L, d, a, c, M, O, T, e, f } from "./index-B8ciGoAd.mjs";
import React from "react";
import { g as getServerLocale, l as loadServerLocaleData } from "./index-Dja9Pmzb.mjs";
import { a as a2, c as c2, i, t } from "./index-Dja9Pmzb.mjs";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { A as AdvancedPathLocaleManager, P as PathLocaleManager } from "./localeUtils-BV0jqWwo.mjs";
import { c as c3, g, p, r, s } from "./cookies-C2ACDSut.mjs";
async function generateTranslatedMetadata(baseMetadata, options) {
  const locale = (options == null ? void 0 : options.locale) || getServerLocale(void 0, void 0);
  const localeBasePath = (options == null ? void 0 : options.localeBasePath) || "/rustle/locales";
  const fallback = (options == null ? void 0 : options.fallback) !== false;
  try {
    const localeData = await loadServerLocaleData(locale, { localeBasePath });
    const translateText = (text) => {
      if (!text) return text;
      const translation = localeData == null ? void 0 : localeData[text];
      if (translation) {
        return translation;
      }
      return fallback ? text : "";
    };
    const metadata = {};
    if (baseMetadata.title) {
      metadata.title = translateText(baseMetadata.title);
    }
    if (baseMetadata.description) {
      metadata.description = translateText(baseMetadata.description);
    }
    if (baseMetadata.keywords) {
      metadata.keywords = baseMetadata.keywords.map(translateText);
    }
    if (baseMetadata.openGraph) {
      metadata.openGraph = {};
      if (baseMetadata.openGraph.title) {
        metadata.openGraph.title = translateText(baseMetadata.openGraph.title);
      }
      if (baseMetadata.openGraph.description) {
        metadata.openGraph.description = translateText(baseMetadata.openGraph.description);
      }
      if (baseMetadata.openGraph.siteName) {
        metadata.openGraph.siteName = translateText(baseMetadata.openGraph.siteName);
      }
      metadata.openGraph.locale = locale;
    }
    if (baseMetadata.twitter) {
      metadata.twitter = {};
      if (baseMetadata.twitter.title) {
        metadata.twitter.title = translateText(baseMetadata.twitter.title);
      }
      if (baseMetadata.twitter.description) {
        metadata.twitter.description = translateText(baseMetadata.twitter.description);
      }
    }
    return metadata;
  } catch (error2) {
    console.error("Failed to generate translated metadata:", error2);
    return {
      title: baseMetadata.title,
      description: baseMetadata.description,
      keywords: baseMetadata.keywords,
      openGraph: baseMetadata.openGraph,
      twitter: baseMetadata.twitter
    };
  }
}
function generateAlternateLanguages(baseUrl, supportedLocales, currentPath = "") {
  const alternates = {};
  supportedLocales.forEach((locale) => {
    const url = `${baseUrl}/${locale}${currentPath}`;
    alternates[locale] = url;
  });
  return alternates;
}
function generateHreflangLinks(baseUrl, supportedLocales, currentPath = "", defaultLocale = "en") {
  const links = [];
  supportedLocales.forEach((locale) => {
    const href = locale === defaultLocale ? `${baseUrl}${currentPath}` : `${baseUrl}/${locale}${currentPath}`;
    links.push({
      rel: "alternate",
      hrefLang: locale,
      href
    });
  });
  links.push({
    rel: "alternate",
    hrefLang: "x-default",
    href: `${baseUrl}${currentPath}`
  });
  return links;
}
async function generateSEOMetadata(config) {
  const {
    title,
    description,
    keywords = [],
    baseUrl,
    currentPath = "",
    supportedLocales,
    defaultLocale = "en",
    siteName,
    locale,
    localeBasePath,
    fallback
  } = config;
  const translatedMetadata = await generateTranslatedMetadata(
    {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        siteName
      },
      twitter: {
        title,
        description
      }
    },
    { locale, localeBasePath, fallback }
  );
  const alternates = generateAlternateLanguages(baseUrl, supportedLocales, currentPath);
  const metadata = {
    ...translatedMetadata,
    alternates: {
      languages: alternates
    },
    robots: {
      index: true,
      follow: true
    }
  };
  return metadata;
}
async function generatePageMetadata(params, config) {
  const locale = params.locale || config.defaultLocale || "en";
  return generateSEOMetadata({
    ...config,
    locale,
    currentPath: params.locale ? `/${params.locale}` : ""
  });
}
async function ServerTranslate({
  children,
  text,
  locale,
  localeBasePath = "/rustle/locales",
  fallback = true,
  tag: Tag = "span",
  className,
  ...props
}) {
  const currentLocale = locale || getServerLocale(void 0, void 0);
  const textToTranslate = text || (typeof children === "string" ? children : "");
  if (!textToTranslate) {
    return /* @__PURE__ */ jsx(Tag, { className, ...props, children });
  }
  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });
    const translation = localeData == null ? void 0 : localeData[textToTranslate];
    const finalText = translation || (fallback ? textToTranslate : "");
    return /* @__PURE__ */ jsx(
      Tag,
      {
        className,
        "data-i18n": "true",
        "data-i18n-source": textToTranslate,
        "data-i18n-translated": "true",
        "data-i18n-locale": currentLocale,
        ...props,
        children: finalText
      }
    );
  } catch (error2) {
    console.error("ServerTranslate error:", error2);
    return /* @__PURE__ */ jsx(
      Tag,
      {
        className,
        "data-i18n": "true",
        "data-i18n-source": textToTranslate,
        "data-i18n-error": "true",
        ...props,
        children: fallback ? textToTranslate : children
      }
    );
  }
}
async function translateServerText(text, locale, localeBasePath = "/rustle/locales", fallback = true) {
  if (!text) return text;
  const currentLocale = locale || getServerLocale(void 0, void 0);
  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });
    const translation = localeData == null ? void 0 : localeData[text];
    return translation || (fallback ? text : "");
  } catch (error2) {
    console.error("translateServerText error:", error2);
    return fallback ? text : "";
  }
}
async function translateServerTexts(texts, locale, localeBasePath = "/rustle/locales", fallback = true) {
  if (!texts.length) return {};
  const currentLocale = locale || getServerLocale(void 0, void 0);
  const result = {};
  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });
    texts.forEach((text) => {
      const translation = localeData == null ? void 0 : localeData[text];
      result[text] = translation || (fallback ? text : "");
    });
    return result;
  } catch (error2) {
    console.error("translateServerTexts error:", error2);
    texts.forEach((text) => {
      result[text] = fallback ? text : "";
    });
    return result;
  }
}
async function ServerTranslateWrapper({
  children,
  locale,
  localeBasePath = "/rustle/locales"
}) {
  const currentLocale = locale || getServerLocale(void 0, void 0);
  try {
    await loadServerLocaleData(currentLocale, { localeBasePath });
    return /* @__PURE__ */ jsx(
      "div",
      {
        "data-rustle-server": "true",
        "data-rustle-locale": currentLocale,
        "data-rustle-locale-path": localeBasePath,
        children
      }
    );
  } catch (error2) {
    console.error("ServerTranslateWrapper error:", error2);
    return /* @__PURE__ */ jsx("div", { children });
  }
}
function generateTranslationScript(locale, localeData) {
  return `
    <script>
      window.__RUSTLE_LOCALE__ = ${JSON.stringify(locale)};
      window.__RUSTLE_TRANSLATIONS__ = ${JSON.stringify(localeData)};
      
      // Apply server translations to DOM elements
      document.addEventListener('DOMContentLoaded', function() {
        const elements = document.querySelectorAll('[data-i18n-translated="true"]');
        elements.forEach(function(element) {
          const source = element.getAttribute('data-i18n-source');
          const translation = window.__RUSTLE_TRANSLATIONS__[source];
          if (translation && element.textContent !== translation) {
            element.textContent = translation;
          }
        });
      });
    <\/script>
  `;
}
async function TranslatedPage({
  children,
  locale,
  localeBasePath = "/rustle/locales",
  injectScript = true
}) {
  const currentLocale = locale || getServerLocale(void 0, void 0);
  try {
    const localeData = await loadServerLocaleData(currentLocale, { localeBasePath });
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(ServerTranslateWrapper, { locale: currentLocale, localeBasePath, children }),
      injectScript && localeData && /* @__PURE__ */ jsx(
        "div",
        {
          dangerouslySetInnerHTML: {
            __html: generateTranslationScript(currentLocale, localeData)
          }
        }
      )
    ] });
  } catch (error2) {
    console.error("TranslatedPage error:", error2);
    return /* @__PURE__ */ jsx("div", { children });
  }
}
var server = { exports: {} };
var request = {};
var nextUrl = {};
var detectDomainLocale = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "detectDomainLocale", {
    enumerable: true,
    get: function() {
      return detectDomainLocale2;
    }
  });
  function detectDomainLocale2(domainItems, hostname, detectedLocale) {
    if (!domainItems) return;
    if (detectedLocale) {
      detectedLocale = detectedLocale.toLowerCase();
    }
    for (const item of domainItems) {
      var _item_domain, _item_locales;
      const domainHostname = (_item_domain = item.domain) == null ? void 0 : _item_domain.split(":", 1)[0].toLowerCase();
      if (hostname === domainHostname || detectedLocale === item.defaultLocale.toLowerCase() || ((_item_locales = item.locales) == null ? void 0 : _item_locales.some((locale) => locale.toLowerCase() === detectedLocale))) {
        return item;
      }
    }
  }
})(detectDomainLocale);
var formatNextPathnameInfo = {};
var removeTrailingSlash = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "removeTrailingSlash", {
    enumerable: true,
    get: function() {
      return removeTrailingSlash2;
    }
  });
  function removeTrailingSlash2(route) {
    return route.replace(/\/$/, "") || "/";
  }
})(removeTrailingSlash);
var addPathPrefix = {};
var parsePath = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "parsePath", {
    enumerable: true,
    get: function() {
      return parsePath2;
    }
  });
  function parsePath2(path) {
    const hashIndex = path.indexOf("#");
    const queryIndex = path.indexOf("?");
    const hasQuery = queryIndex > -1 && (hashIndex < 0 || queryIndex < hashIndex);
    if (hasQuery || hashIndex > -1) {
      return {
        pathname: path.substring(0, hasQuery ? queryIndex : hashIndex),
        query: hasQuery ? path.substring(queryIndex, hashIndex > -1 ? hashIndex : void 0) : "",
        hash: hashIndex > -1 ? path.slice(hashIndex) : ""
      };
    }
    return {
      pathname: path,
      query: "",
      hash: ""
    };
  }
})(parsePath);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "addPathPrefix", {
    enumerable: true,
    get: function() {
      return addPathPrefix2;
    }
  });
  const _parsepath = parsePath;
  function addPathPrefix2(path, prefix) {
    if (!path.startsWith("/") || !prefix) {
      return path;
    }
    const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
    return "" + prefix + pathname + query + hash;
  }
})(addPathPrefix);
var addPathSuffix = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "addPathSuffix", {
    enumerable: true,
    get: function() {
      return addPathSuffix2;
    }
  });
  const _parsepath = parsePath;
  function addPathSuffix2(path, suffix) {
    if (!path.startsWith("/") || !suffix) {
      return path;
    }
    const { pathname, query, hash } = (0, _parsepath.parsePath)(path);
    return "" + pathname + suffix + query + hash;
  }
})(addPathSuffix);
var addLocale = {};
var pathHasPrefix = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "pathHasPrefix", {
    enumerable: true,
    get: function() {
      return pathHasPrefix2;
    }
  });
  const _parsepath = parsePath;
  function pathHasPrefix2(path, prefix) {
    if (typeof path !== "string") {
      return false;
    }
    const { pathname } = (0, _parsepath.parsePath)(path);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }
})(pathHasPrefix);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "addLocale", {
    enumerable: true,
    get: function() {
      return addLocale2;
    }
  });
  const _addpathprefix = addPathPrefix;
  const _pathhasprefix = pathHasPrefix;
  function addLocale2(path, locale, defaultLocale, ignorePrefix) {
    if (!locale || locale === defaultLocale) return path;
    const lower = path.toLowerCase();
    if (!ignorePrefix) {
      if ((0, _pathhasprefix.pathHasPrefix)(lower, "/api")) return path;
      if ((0, _pathhasprefix.pathHasPrefix)(lower, "/" + locale.toLowerCase())) return path;
    }
    return (0, _addpathprefix.addPathPrefix)(path, "/" + locale);
  }
})(addLocale);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "formatNextPathnameInfo", {
    enumerable: true,
    get: function() {
      return formatNextPathnameInfo2;
    }
  });
  const _removetrailingslash = removeTrailingSlash;
  const _addpathprefix = addPathPrefix;
  const _addpathsuffix = addPathSuffix;
  const _addlocale = addLocale;
  function formatNextPathnameInfo2(info) {
    let pathname = (0, _addlocale.addLocale)(info.pathname, info.locale, info.buildId ? void 0 : info.defaultLocale, info.ignorePrefix);
    if (info.buildId || !info.trailingSlash) {
      pathname = (0, _removetrailingslash.removeTrailingSlash)(pathname);
    }
    if (info.buildId) {
      pathname = (0, _addpathsuffix.addPathSuffix)((0, _addpathprefix.addPathPrefix)(pathname, "/_next/data/" + info.buildId), info.pathname === "/" ? "index.json" : ".json");
    }
    pathname = (0, _addpathprefix.addPathPrefix)(pathname, info.basePath);
    return !info.buildId && info.trailingSlash ? !pathname.endsWith("/") ? (0, _addpathsuffix.addPathSuffix)(pathname, "/") : pathname : (0, _removetrailingslash.removeTrailingSlash)(pathname);
  }
})(formatNextPathnameInfo);
var getHostname = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "getHostname", {
    enumerable: true,
    get: function() {
      return getHostname2;
    }
  });
  function getHostname2(parsed, headers) {
    let hostname;
    if ((headers == null ? void 0 : headers.host) && !Array.isArray(headers.host)) {
      hostname = headers.host.toString().split(":", 1)[0];
    } else if (parsed.hostname) {
      hostname = parsed.hostname;
    } else return;
    return hostname.toLowerCase();
  }
})(getHostname);
var getNextPathnameInfo = {};
var normalizeLocalePath = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "normalizeLocalePath", {
    enumerable: true,
    get: function() {
      return normalizeLocalePath2;
    }
  });
  function normalizeLocalePath2(pathname, locales) {
    let detectedLocale;
    const pathnameParts = pathname.split("/");
    (locales || []).some((locale) => {
      if (pathnameParts[1] && pathnameParts[1].toLowerCase() === locale.toLowerCase()) {
        detectedLocale = locale;
        pathnameParts.splice(1, 1);
        pathname = pathnameParts.join("/") || "/";
        return true;
      }
      return false;
    });
    return {
      pathname,
      detectedLocale
    };
  }
})(normalizeLocalePath);
var removePathPrefix = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "removePathPrefix", {
    enumerable: true,
    get: function() {
      return removePathPrefix2;
    }
  });
  const _pathhasprefix = pathHasPrefix;
  function removePathPrefix2(path, prefix) {
    if (!(0, _pathhasprefix.pathHasPrefix)(path, prefix)) {
      return path;
    }
    const withoutPrefix = path.slice(prefix.length);
    if (withoutPrefix.startsWith("/")) {
      return withoutPrefix;
    }
    return "/" + withoutPrefix;
  }
})(removePathPrefix);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "getNextPathnameInfo", {
    enumerable: true,
    get: function() {
      return getNextPathnameInfo2;
    }
  });
  const _normalizelocalepath = normalizeLocalePath;
  const _removepathprefix = removePathPrefix;
  const _pathhasprefix = pathHasPrefix;
  function getNextPathnameInfo2(pathname, options) {
    var _options_nextConfig;
    const { basePath, i18n, trailingSlash } = (_options_nextConfig = options.nextConfig) != null ? _options_nextConfig : {};
    const info = {
      pathname,
      trailingSlash: pathname !== "/" ? pathname.endsWith("/") : trailingSlash
    };
    if (basePath && (0, _pathhasprefix.pathHasPrefix)(info.pathname, basePath)) {
      info.pathname = (0, _removepathprefix.removePathPrefix)(info.pathname, basePath);
      info.basePath = basePath;
    }
    let pathnameNoDataPrefix = info.pathname;
    if (info.pathname.startsWith("/_next/data/") && info.pathname.endsWith(".json")) {
      const paths = info.pathname.replace(/^\/_next\/data\//, "").replace(/\.json$/, "").split("/");
      const buildId = paths[0];
      info.buildId = buildId;
      pathnameNoDataPrefix = paths[1] !== "index" ? "/" + paths.slice(1).join("/") : "/";
      if (options.parseData === true) {
        info.pathname = pathnameNoDataPrefix;
      }
    }
    if (i18n) {
      let result = options.i18nProvider ? options.i18nProvider.analyze(info.pathname) : (0, _normalizelocalepath.normalizeLocalePath)(info.pathname, i18n.locales);
      info.locale = result.detectedLocale;
      var _result_pathname;
      info.pathname = (_result_pathname = result.pathname) != null ? _result_pathname : info.pathname;
      if (!result.detectedLocale && info.buildId) {
        result = options.i18nProvider ? options.i18nProvider.analyze(pathnameNoDataPrefix) : (0, _normalizelocalepath.normalizeLocalePath)(pathnameNoDataPrefix, i18n.locales);
        if (result.detectedLocale) {
          info.locale = result.detectedLocale;
        }
      }
    }
    return info;
  }
})(getNextPathnameInfo);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "NextURL", {
    enumerable: true,
    get: function() {
      return NextURL;
    }
  });
  const _detectdomainlocale = detectDomainLocale;
  const _formatnextpathnameinfo = formatNextPathnameInfo;
  const _gethostname = getHostname;
  const _getnextpathnameinfo = getNextPathnameInfo;
  const REGEX_LOCALHOST_HOSTNAME = /(?!^https?:\/\/)(127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}|\[::1\]|localhost)/;
  function parseURL(url, base) {
    return new URL(String(url).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"), base && String(base).replace(REGEX_LOCALHOST_HOSTNAME, "localhost"));
  }
  const Internal = Symbol("NextURLInternal");
  class NextURL {
    constructor(input, baseOrOpts, opts) {
      let base;
      let options;
      if (typeof baseOrOpts === "object" && "pathname" in baseOrOpts || typeof baseOrOpts === "string") {
        base = baseOrOpts;
        options = opts || {};
      } else {
        options = opts || baseOrOpts || {};
      }
      this[Internal] = {
        url: parseURL(input, base ?? options.base),
        options,
        basePath: ""
      };
      this.analyze();
    }
    analyze() {
      var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig, _this_Internal_domainLocale, _this_Internal_options_nextConfig_i18n1, _this_Internal_options_nextConfig1;
      const info = (0, _getnextpathnameinfo.getNextPathnameInfo)(this[Internal].url.pathname, {
        nextConfig: this[Internal].options.nextConfig,
        parseData: !process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE,
        i18nProvider: this[Internal].options.i18nProvider
      });
      const hostname = (0, _gethostname.getHostname)(this[Internal].url, this[Internal].options.headers);
      this[Internal].domainLocale = this[Internal].options.i18nProvider ? this[Internal].options.i18nProvider.detectDomainLocale(hostname) : (0, _detectdomainlocale.detectDomainLocale)((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.domains, hostname);
      const defaultLocale = ((_this_Internal_domainLocale = this[Internal].domainLocale) == null ? void 0 : _this_Internal_domainLocale.defaultLocale) || ((_this_Internal_options_nextConfig1 = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n1 = _this_Internal_options_nextConfig1.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n1.defaultLocale);
      this[Internal].url.pathname = info.pathname;
      this[Internal].defaultLocale = defaultLocale;
      this[Internal].basePath = info.basePath ?? "";
      this[Internal].buildId = info.buildId;
      this[Internal].locale = info.locale ?? defaultLocale;
      this[Internal].trailingSlash = info.trailingSlash;
    }
    formatPathname() {
      return (0, _formatnextpathnameinfo.formatNextPathnameInfo)({
        basePath: this[Internal].basePath,
        buildId: this[Internal].buildId,
        defaultLocale: !this[Internal].options.forceLocale ? this[Internal].defaultLocale : void 0,
        locale: this[Internal].locale,
        pathname: this[Internal].url.pathname,
        trailingSlash: this[Internal].trailingSlash
      });
    }
    formatSearch() {
      return this[Internal].url.search;
    }
    get buildId() {
      return this[Internal].buildId;
    }
    set buildId(buildId) {
      this[Internal].buildId = buildId;
    }
    get locale() {
      return this[Internal].locale ?? "";
    }
    set locale(locale) {
      var _this_Internal_options_nextConfig_i18n, _this_Internal_options_nextConfig;
      if (!this[Internal].locale || !((_this_Internal_options_nextConfig = this[Internal].options.nextConfig) == null ? void 0 : (_this_Internal_options_nextConfig_i18n = _this_Internal_options_nextConfig.i18n) == null ? void 0 : _this_Internal_options_nextConfig_i18n.locales.includes(locale))) {
        throw new TypeError(`The NextURL configuration includes no locale "${locale}"`);
      }
      this[Internal].locale = locale;
    }
    get defaultLocale() {
      return this[Internal].defaultLocale;
    }
    get domainLocale() {
      return this[Internal].domainLocale;
    }
    get searchParams() {
      return this[Internal].url.searchParams;
    }
    get host() {
      return this[Internal].url.host;
    }
    set host(value) {
      this[Internal].url.host = value;
    }
    get hostname() {
      return this[Internal].url.hostname;
    }
    set hostname(value) {
      this[Internal].url.hostname = value;
    }
    get port() {
      return this[Internal].url.port;
    }
    set port(value) {
      this[Internal].url.port = value;
    }
    get protocol() {
      return this[Internal].url.protocol;
    }
    set protocol(value) {
      this[Internal].url.protocol = value;
    }
    get href() {
      const pathname = this.formatPathname();
      const search = this.formatSearch();
      return `${this.protocol}//${this.host}${pathname}${search}${this.hash}`;
    }
    set href(url) {
      this[Internal].url = parseURL(url);
      this.analyze();
    }
    get origin() {
      return this[Internal].url.origin;
    }
    get pathname() {
      return this[Internal].url.pathname;
    }
    set pathname(value) {
      this[Internal].url.pathname = value;
    }
    get hash() {
      return this[Internal].url.hash;
    }
    set hash(value) {
      this[Internal].url.hash = value;
    }
    get search() {
      return this[Internal].url.search;
    }
    set search(value) {
      this[Internal].url.search = value;
    }
    get password() {
      return this[Internal].url.password;
    }
    set password(value) {
      this[Internal].url.password = value;
    }
    get username() {
      return this[Internal].url.username;
    }
    set username(value) {
      this[Internal].url.username = value;
    }
    get basePath() {
      return this[Internal].basePath;
    }
    set basePath(value) {
      this[Internal].basePath = value.startsWith("/") ? value : `/${value}`;
    }
    toString() {
      return this.href;
    }
    toJSON() {
      return this.href;
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
      return {
        href: this.href,
        origin: this.origin,
        protocol: this.protocol,
        username: this.username,
        password: this.password,
        host: this.host,
        hostname: this.hostname,
        port: this.port,
        pathname: this.pathname,
        search: this.search,
        searchParams: this.searchParams,
        hash: this.hash
      };
    }
    clone() {
      return new NextURL(String(this), this[Internal].options);
    }
  }
})(nextUrl);
var utils = {};
var constants = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    ACTION_SUFFIX: function() {
      return ACTION_SUFFIX;
    },
    APP_DIR_ALIAS: function() {
      return APP_DIR_ALIAS;
    },
    CACHE_ONE_YEAR: function() {
      return CACHE_ONE_YEAR;
    },
    DOT_NEXT_ALIAS: function() {
      return DOT_NEXT_ALIAS;
    },
    ESLINT_DEFAULT_DIRS: function() {
      return ESLINT_DEFAULT_DIRS;
    },
    GSP_NO_RETURNED_VALUE: function() {
      return GSP_NO_RETURNED_VALUE;
    },
    GSSP_COMPONENT_MEMBER_ERROR: function() {
      return GSSP_COMPONENT_MEMBER_ERROR;
    },
    GSSP_NO_RETURNED_VALUE: function() {
      return GSSP_NO_RETURNED_VALUE;
    },
    INSTRUMENTATION_HOOK_FILENAME: function() {
      return INSTRUMENTATION_HOOK_FILENAME;
    },
    MIDDLEWARE_FILENAME: function() {
      return MIDDLEWARE_FILENAME;
    },
    MIDDLEWARE_LOCATION_REGEXP: function() {
      return MIDDLEWARE_LOCATION_REGEXP;
    },
    NEXT_BODY_SUFFIX: function() {
      return NEXT_BODY_SUFFIX;
    },
    NEXT_CACHE_IMPLICIT_TAG_ID: function() {
      return NEXT_CACHE_IMPLICIT_TAG_ID;
    },
    NEXT_CACHE_REVALIDATED_TAGS_HEADER: function() {
      return NEXT_CACHE_REVALIDATED_TAGS_HEADER;
    },
    NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER: function() {
      return NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER;
    },
    NEXT_CACHE_SOFT_TAGS_HEADER: function() {
      return NEXT_CACHE_SOFT_TAGS_HEADER;
    },
    NEXT_CACHE_SOFT_TAG_MAX_LENGTH: function() {
      return NEXT_CACHE_SOFT_TAG_MAX_LENGTH;
    },
    NEXT_CACHE_TAGS_HEADER: function() {
      return NEXT_CACHE_TAGS_HEADER;
    },
    NEXT_CACHE_TAG_MAX_ITEMS: function() {
      return NEXT_CACHE_TAG_MAX_ITEMS;
    },
    NEXT_CACHE_TAG_MAX_LENGTH: function() {
      return NEXT_CACHE_TAG_MAX_LENGTH;
    },
    NEXT_DATA_SUFFIX: function() {
      return NEXT_DATA_SUFFIX;
    },
    NEXT_INTERCEPTION_MARKER_PREFIX: function() {
      return NEXT_INTERCEPTION_MARKER_PREFIX;
    },
    NEXT_META_SUFFIX: function() {
      return NEXT_META_SUFFIX;
    },
    NEXT_QUERY_PARAM_PREFIX: function() {
      return NEXT_QUERY_PARAM_PREFIX;
    },
    NON_STANDARD_NODE_ENV: function() {
      return NON_STANDARD_NODE_ENV;
    },
    PAGES_DIR_ALIAS: function() {
      return PAGES_DIR_ALIAS;
    },
    PRERENDER_REVALIDATE_HEADER: function() {
      return PRERENDER_REVALIDATE_HEADER;
    },
    PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER: function() {
      return PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER;
    },
    PUBLIC_DIR_MIDDLEWARE_CONFLICT: function() {
      return PUBLIC_DIR_MIDDLEWARE_CONFLICT;
    },
    ROOT_DIR_ALIAS: function() {
      return ROOT_DIR_ALIAS;
    },
    RSC_ACTION_CLIENT_WRAPPER_ALIAS: function() {
      return RSC_ACTION_CLIENT_WRAPPER_ALIAS;
    },
    RSC_ACTION_ENCRYPTION_ALIAS: function() {
      return RSC_ACTION_ENCRYPTION_ALIAS;
    },
    RSC_ACTION_PROXY_ALIAS: function() {
      return RSC_ACTION_PROXY_ALIAS;
    },
    RSC_ACTION_VALIDATE_ALIAS: function() {
      return RSC_ACTION_VALIDATE_ALIAS;
    },
    RSC_MOD_REF_PROXY_ALIAS: function() {
      return RSC_MOD_REF_PROXY_ALIAS;
    },
    RSC_PREFETCH_SUFFIX: function() {
      return RSC_PREFETCH_SUFFIX;
    },
    RSC_SUFFIX: function() {
      return RSC_SUFFIX;
    },
    SERVER_PROPS_EXPORT_ERROR: function() {
      return SERVER_PROPS_EXPORT_ERROR;
    },
    SERVER_PROPS_GET_INIT_PROPS_CONFLICT: function() {
      return SERVER_PROPS_GET_INIT_PROPS_CONFLICT;
    },
    SERVER_PROPS_SSG_CONFLICT: function() {
      return SERVER_PROPS_SSG_CONFLICT;
    },
    SERVER_RUNTIME: function() {
      return SERVER_RUNTIME;
    },
    SSG_FALLBACK_EXPORT_ERROR: function() {
      return SSG_FALLBACK_EXPORT_ERROR;
    },
    SSG_GET_INITIAL_PROPS_CONFLICT: function() {
      return SSG_GET_INITIAL_PROPS_CONFLICT;
    },
    STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR: function() {
      return STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR;
    },
    UNSTABLE_REVALIDATE_RENAME_ERROR: function() {
      return UNSTABLE_REVALIDATE_RENAME_ERROR;
    },
    WEBPACK_LAYERS: function() {
      return WEBPACK_LAYERS;
    },
    WEBPACK_RESOURCE_QUERIES: function() {
      return WEBPACK_RESOURCE_QUERIES;
    }
  });
  const NEXT_QUERY_PARAM_PREFIX = "nxtP";
  const NEXT_INTERCEPTION_MARKER_PREFIX = "nxtI";
  const PRERENDER_REVALIDATE_HEADER = "x-prerender-revalidate";
  const PRERENDER_REVALIDATE_ONLY_GENERATED_HEADER = "x-prerender-revalidate-if-generated";
  const RSC_PREFETCH_SUFFIX = ".prefetch.rsc";
  const RSC_SUFFIX = ".rsc";
  const ACTION_SUFFIX = ".action";
  const NEXT_DATA_SUFFIX = ".json";
  const NEXT_META_SUFFIX = ".meta";
  const NEXT_BODY_SUFFIX = ".body";
  const NEXT_CACHE_TAGS_HEADER = "x-next-cache-tags";
  const NEXT_CACHE_SOFT_TAGS_HEADER = "x-next-cache-soft-tags";
  const NEXT_CACHE_REVALIDATED_TAGS_HEADER = "x-next-revalidated-tags";
  const NEXT_CACHE_REVALIDATE_TAG_TOKEN_HEADER = "x-next-revalidate-tag-token";
  const NEXT_CACHE_TAG_MAX_ITEMS = 128;
  const NEXT_CACHE_TAG_MAX_LENGTH = 256;
  const NEXT_CACHE_SOFT_TAG_MAX_LENGTH = 1024;
  const NEXT_CACHE_IMPLICIT_TAG_ID = "_N_T_";
  const CACHE_ONE_YEAR = 31536e3;
  const MIDDLEWARE_FILENAME = "middleware";
  const MIDDLEWARE_LOCATION_REGEXP = `(?:src/)?${MIDDLEWARE_FILENAME}`;
  const INSTRUMENTATION_HOOK_FILENAME = "instrumentation";
  const PAGES_DIR_ALIAS = "private-next-pages";
  const DOT_NEXT_ALIAS = "private-dot-next";
  const ROOT_DIR_ALIAS = "private-next-root-dir";
  const APP_DIR_ALIAS = "private-next-app-dir";
  const RSC_MOD_REF_PROXY_ALIAS = "private-next-rsc-mod-ref-proxy";
  const RSC_ACTION_VALIDATE_ALIAS = "private-next-rsc-action-validate";
  const RSC_ACTION_PROXY_ALIAS = "private-next-rsc-server-reference";
  const RSC_ACTION_ENCRYPTION_ALIAS = "private-next-rsc-action-encryption";
  const RSC_ACTION_CLIENT_WRAPPER_ALIAS = "private-next-rsc-action-client-wrapper";
  const PUBLIC_DIR_MIDDLEWARE_CONFLICT = `You can not have a '_next' folder inside of your public folder. This conflicts with the internal '/_next' route. https://nextjs.org/docs/messages/public-next-folder-conflict`;
  const SSG_GET_INITIAL_PROPS_CONFLICT = `You can not use getInitialProps with getStaticProps. To use SSG, please remove your getInitialProps`;
  const SERVER_PROPS_GET_INIT_PROPS_CONFLICT = `You can not use getInitialProps with getServerSideProps. Please remove getInitialProps.`;
  const SERVER_PROPS_SSG_CONFLICT = `You can not use getStaticProps or getStaticPaths with getServerSideProps. To use SSG, please remove getServerSideProps`;
  const STATIC_STATUS_PAGE_GET_INITIAL_PROPS_ERROR = `can not have getInitialProps/getServerSideProps, https://nextjs.org/docs/messages/404-get-initial-props`;
  const SERVER_PROPS_EXPORT_ERROR = `pages with \`getServerSideProps\` can not be exported. See more info here: https://nextjs.org/docs/messages/gssp-export`;
  const GSP_NO_RETURNED_VALUE = "Your `getStaticProps` function did not return an object. Did you forget to add a `return`?";
  const GSSP_NO_RETURNED_VALUE = "Your `getServerSideProps` function did not return an object. Did you forget to add a `return`?";
  const UNSTABLE_REVALIDATE_RENAME_ERROR = "The `unstable_revalidate` property is available for general use.\nPlease use `revalidate` instead.";
  const GSSP_COMPONENT_MEMBER_ERROR = `can not be attached to a page's component and must be exported from the page. See more info here: https://nextjs.org/docs/messages/gssp-component-member`;
  const NON_STANDARD_NODE_ENV = `You are using a non-standard "NODE_ENV" value in your environment. This creates inconsistencies in the project and is strongly advised against. Read more: https://nextjs.org/docs/messages/non-standard-node-env`;
  const SSG_FALLBACK_EXPORT_ERROR = `Pages with \`fallback\` enabled in \`getStaticPaths\` can not be exported. See more info here: https://nextjs.org/docs/messages/ssg-fallback-true-export`;
  const ESLINT_DEFAULT_DIRS = [
    "app",
    "pages",
    "components",
    "lib",
    "src"
  ];
  const SERVER_RUNTIME = {
    edge: "edge",
    experimentalEdge: "experimental-edge",
    nodejs: "nodejs"
  };
  const WEBPACK_LAYERS_NAMES = {
    /**
    * The layer for the shared code between the client and server bundles.
    */
    shared: "shared",
    /**
    * React Server Components layer (rsc).
    */
    reactServerComponents: "rsc",
    /**
    * Server Side Rendering layer for app (ssr).
    */
    serverSideRendering: "ssr",
    /**
    * The browser client bundle layer for actions.
    */
    actionBrowser: "action-browser",
    /**
    * The layer for the API routes.
    */
    api: "api",
    /**
    * The layer for the middleware code.
    */
    middleware: "middleware",
    /**
    * The layer for the instrumentation hooks.
    */
    instrument: "instrument",
    /**
    * The layer for assets on the edge.
    */
    edgeAsset: "edge-asset",
    /**
    * The browser client bundle layer for App directory.
    */
    appPagesBrowser: "app-pages-browser",
    /**
    * The server bundle layer for metadata routes.
    */
    appMetadataRoute: "app-metadata-route",
    /**
    * The layer for the server bundle for App Route handlers.
    */
    appRouteHandler: "app-route-handler"
  };
  const WEBPACK_LAYERS = {
    ...WEBPACK_LAYERS_NAMES,
    GROUP: {
      serverOnly: [
        WEBPACK_LAYERS_NAMES.reactServerComponents,
        WEBPACK_LAYERS_NAMES.actionBrowser,
        WEBPACK_LAYERS_NAMES.appMetadataRoute,
        WEBPACK_LAYERS_NAMES.appRouteHandler,
        WEBPACK_LAYERS_NAMES.instrument
      ],
      clientOnly: [
        WEBPACK_LAYERS_NAMES.serverSideRendering,
        WEBPACK_LAYERS_NAMES.appPagesBrowser
      ],
      nonClientServerTarget: [
        // middleware and pages api
        WEBPACK_LAYERS_NAMES.middleware,
        WEBPACK_LAYERS_NAMES.api
      ],
      app: [
        WEBPACK_LAYERS_NAMES.reactServerComponents,
        WEBPACK_LAYERS_NAMES.actionBrowser,
        WEBPACK_LAYERS_NAMES.appMetadataRoute,
        WEBPACK_LAYERS_NAMES.appRouteHandler,
        WEBPACK_LAYERS_NAMES.serverSideRendering,
        WEBPACK_LAYERS_NAMES.appPagesBrowser,
        WEBPACK_LAYERS_NAMES.shared,
        WEBPACK_LAYERS_NAMES.instrument
      ]
    }
  };
  const WEBPACK_RESOURCE_QUERIES = {
    edgeSSREntry: "__next_edge_ssr_entry__",
    metadata: "__next_metadata__",
    metadataRoute: "__next_metadata_route__",
    metadataImageMeta: "__next_metadata_image_meta__"
  };
})(constants);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    fromNodeOutgoingHttpHeaders: function() {
      return fromNodeOutgoingHttpHeaders;
    },
    normalizeNextQueryParam: function() {
      return normalizeNextQueryParam;
    },
    splitCookiesString: function() {
      return splitCookiesString2;
    },
    toNodeOutgoingHttpHeaders: function() {
      return toNodeOutgoingHttpHeaders;
    },
    validateURL: function() {
      return validateURL;
    }
  });
  const _constants = constants;
  function fromNodeOutgoingHttpHeaders(nodeHeaders) {
    const headers = new Headers();
    for (let [key, value] of Object.entries(nodeHeaders)) {
      const values = Array.isArray(value) ? value : [
        value
      ];
      for (let v of values) {
        if (typeof v === "undefined") continue;
        if (typeof v === "number") {
          v = v.toString();
        }
        headers.append(key, v);
      }
    }
    return headers;
  }
  function splitCookiesString2(cookiesString) {
    var cookiesStrings = [];
    var pos = 0;
    var start;
    var ch;
    var lastComma;
    var nextStart;
    var cookiesSeparatorFound;
    function skipWhitespace() {
      while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
        pos += 1;
      }
      return pos < cookiesString.length;
    }
    function notSpecialChar() {
      ch = cookiesString.charAt(pos);
      return ch !== "=" && ch !== ";" && ch !== ",";
    }
    while (pos < cookiesString.length) {
      start = pos;
      cookiesSeparatorFound = false;
      while (skipWhitespace()) {
        ch = cookiesString.charAt(pos);
        if (ch === ",") {
          lastComma = pos;
          pos += 1;
          skipWhitespace();
          nextStart = pos;
          while (pos < cookiesString.length && notSpecialChar()) {
            pos += 1;
          }
          if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
            cookiesSeparatorFound = true;
            pos = nextStart;
            cookiesStrings.push(cookiesString.substring(start, lastComma));
            start = pos;
          } else {
            pos = lastComma + 1;
          }
        } else {
          pos += 1;
        }
      }
      if (!cookiesSeparatorFound || pos >= cookiesString.length) {
        cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
      }
    }
    return cookiesStrings;
  }
  function toNodeOutgoingHttpHeaders(headers) {
    const nodeHeaders = {};
    const cookies2 = [];
    if (headers) {
      for (const [key, value] of headers.entries()) {
        if (key.toLowerCase() === "set-cookie") {
          cookies2.push(...splitCookiesString2(value));
          nodeHeaders[key] = cookies2.length === 1 ? cookies2[0] : cookies2;
        } else {
          nodeHeaders[key] = value;
        }
      }
    }
    return nodeHeaders;
  }
  function validateURL(url) {
    try {
      return String(new URL(String(url)));
    } catch (error2) {
      throw new Error(`URL is malformed "${String(url)}". Please use only absolute URLs - https://nextjs.org/docs/messages/middleware-relative-urls`, {
        cause: error2
      });
    }
  }
  function normalizeNextQueryParam(key, onKeyNormalized) {
    const prefixes = [
      _constants.NEXT_QUERY_PARAM_PREFIX,
      _constants.NEXT_INTERCEPTION_MARKER_PREFIX
    ];
    for (const prefix of prefixes) {
      if (key !== prefix && key.startsWith(prefix)) {
        const normalizedKey = key.substring(prefix.length);
        onKeyNormalized(normalizedKey);
      }
    }
  }
})(utils);
var error = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    PageSignatureError: function() {
      return PageSignatureError;
    },
    RemovedPageError: function() {
      return RemovedPageError;
    },
    RemovedUAError: function() {
      return RemovedUAError;
    }
  });
  class PageSignatureError extends Error {
    constructor({ page }) {
      super(`The middleware "${page}" accepts an async API directly with the form:
  
  export function middleware(request, event) {
    return NextResponse.redirect('/new-location')
  }
  
  Read more: https://nextjs.org/docs/messages/middleware-new-signature
  `);
    }
  }
  class RemovedPageError extends Error {
    constructor() {
      super(`The request.page has been deprecated in favour of \`URLPattern\`.
  Read more: https://nextjs.org/docs/messages/middleware-request-page
  `);
    }
  }
  class RemovedUAError extends Error {
    constructor() {
      super(`The request.ua has been removed in favour of \`userAgent\` function.
  Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
  `);
    }
  }
})(error);
var cookies$1 = {};
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var src_exports = {};
__export(src_exports, {
  RequestCookies: () => RequestCookies,
  ResponseCookies: () => ResponseCookies,
  parseCookie: () => parseCookie,
  parseSetCookie: () => parseSetCookie,
  stringifyCookie: () => stringifyCookie
});
var cookies = __toCommonJS(src_exports);
function stringifyCookie(c4) {
  var _a;
  const attrs = [
    "path" in c4 && c4.path && `Path=${c4.path}`,
    "expires" in c4 && (c4.expires || c4.expires === 0) && `Expires=${(typeof c4.expires === "number" ? new Date(c4.expires) : c4.expires).toUTCString()}`,
    "maxAge" in c4 && typeof c4.maxAge === "number" && `Max-Age=${c4.maxAge}`,
    "domain" in c4 && c4.domain && `Domain=${c4.domain}`,
    "secure" in c4 && c4.secure && "Secure",
    "httpOnly" in c4 && c4.httpOnly && "HttpOnly",
    "sameSite" in c4 && c4.sameSite && `SameSite=${c4.sameSite}`,
    "partitioned" in c4 && c4.partitioned && "Partitioned",
    "priority" in c4 && c4.priority && `Priority=${c4.priority}`
  ].filter(Boolean);
  const stringified = `${c4.name}=${encodeURIComponent((_a = c4.value) != null ? _a : "")}`;
  return attrs.length === 0 ? stringified : `${stringified}; ${attrs.join("; ")}`;
}
function parseCookie(cookie) {
  const map = /* @__PURE__ */ new Map();
  for (const pair of cookie.split(/; */)) {
    if (!pair)
      continue;
    const splitAt = pair.indexOf("=");
    if (splitAt === -1) {
      map.set(pair, "true");
      continue;
    }
    const [key, value] = [pair.slice(0, splitAt), pair.slice(splitAt + 1)];
    try {
      map.set(key, decodeURIComponent(value != null ? value : "true"));
    } catch {
    }
  }
  return map;
}
function parseSetCookie(setCookie) {
  if (!setCookie) {
    return void 0;
  }
  const [[name, value], ...attributes] = parseCookie(setCookie);
  const {
    domain,
    expires,
    httponly,
    maxage,
    path,
    samesite,
    secure,
    partitioned,
    priority
  } = Object.fromEntries(
    attributes.map(([key, value2]) => [key.toLowerCase(), value2])
  );
  const cookie = {
    name,
    value: decodeURIComponent(value),
    domain,
    ...expires && { expires: new Date(expires) },
    ...httponly && { httpOnly: true },
    ...typeof maxage === "string" && { maxAge: Number(maxage) },
    path,
    ...samesite && { sameSite: parseSameSite(samesite) },
    ...secure && { secure: true },
    ...priority && { priority: parsePriority(priority) },
    ...partitioned && { partitioned: true }
  };
  return compact(cookie);
}
function compact(t2) {
  const newT = {};
  for (const key in t2) {
    if (t2[key]) {
      newT[key] = t2[key];
    }
  }
  return newT;
}
var SAME_SITE = ["strict", "lax", "none"];
function parseSameSite(string) {
  string = string.toLowerCase();
  return SAME_SITE.includes(string) ? string : void 0;
}
var PRIORITY = ["low", "medium", "high"];
function parsePriority(string) {
  string = string.toLowerCase();
  return PRIORITY.includes(string) ? string : void 0;
}
function splitCookiesString(cookiesString) {
  if (!cookiesString)
    return [];
  var cookiesStrings = [];
  var pos = 0;
  var start;
  var ch;
  var lastComma;
  var nextStart;
  var cookiesSeparatorFound;
  function skipWhitespace() {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  }
  function notSpecialChar() {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  }
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.substring(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.substring(start, cookiesString.length));
    }
  }
  return cookiesStrings;
}
var RequestCookies = class {
  constructor(requestHeaders) {
    this._parsed = /* @__PURE__ */ new Map();
    this._headers = requestHeaders;
    const header = requestHeaders.get("cookie");
    if (header) {
      const parsed = parseCookie(header);
      for (const [name, value] of parsed) {
        this._parsed.set(name, { name, value });
      }
    }
  }
  [Symbol.iterator]() {
    return this._parsed[Symbol.iterator]();
  }
  /**
   * The amount of cookies received from the client
   */
  get size() {
    return this._parsed.size;
  }
  get(...args) {
    const name = typeof args[0] === "string" ? args[0] : args[0].name;
    return this._parsed.get(name);
  }
  getAll(...args) {
    var _a;
    const all = Array.from(this._parsed);
    if (!args.length) {
      return all.map(([_, value]) => value);
    }
    const name = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
    return all.filter(([n]) => n === name).map(([_, value]) => value);
  }
  has(name) {
    return this._parsed.has(name);
  }
  set(...args) {
    const [name, value] = args.length === 1 ? [args[0].name, args[0].value] : args;
    const map = this._parsed;
    map.set(name, { name, value });
    this._headers.set(
      "cookie",
      Array.from(map).map(([_, value2]) => stringifyCookie(value2)).join("; ")
    );
    return this;
  }
  /**
   * Delete the cookies matching the passed name or names in the request.
   */
  delete(names) {
    const map = this._parsed;
    const result = !Array.isArray(names) ? map.delete(names) : names.map((name) => map.delete(name));
    this._headers.set(
      "cookie",
      Array.from(map).map(([_, value]) => stringifyCookie(value)).join("; ")
    );
    return result;
  }
  /**
   * Delete all the cookies in the cookies in the request.
   */
  clear() {
    this.delete(Array.from(this._parsed.keys()));
    return this;
  }
  /**
   * Format the cookies in the request as a string for logging
   */
  [Symbol.for("edge-runtime.inspect.custom")]() {
    return `RequestCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
  }
  toString() {
    return [...this._parsed.values()].map((v) => `${v.name}=${encodeURIComponent(v.value)}`).join("; ");
  }
};
var ResponseCookies = class {
  constructor(responseHeaders) {
    this._parsed = /* @__PURE__ */ new Map();
    var _a, _b, _c;
    this._headers = responseHeaders;
    const setCookie = (_c = (_b = (_a = responseHeaders.getSetCookie) == null ? void 0 : _a.call(responseHeaders)) != null ? _b : responseHeaders.get("set-cookie")) != null ? _c : [];
    const cookieStrings = Array.isArray(setCookie) ? setCookie : splitCookiesString(setCookie);
    for (const cookieString of cookieStrings) {
      const parsed = parseSetCookie(cookieString);
      if (parsed)
        this._parsed.set(parsed.name, parsed);
    }
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-get CookieStore#get} without the Promise.
   */
  get(...args) {
    const key = typeof args[0] === "string" ? args[0] : args[0].name;
    return this._parsed.get(key);
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-getAll CookieStore#getAll} without the Promise.
   */
  getAll(...args) {
    var _a;
    const all = Array.from(this._parsed.values());
    if (!args.length) {
      return all;
    }
    const key = typeof args[0] === "string" ? args[0] : (_a = args[0]) == null ? void 0 : _a.name;
    return all.filter((c4) => c4.name === key);
  }
  has(name) {
    return this._parsed.has(name);
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-set CookieStore#set} without the Promise.
   */
  set(...args) {
    const [name, value, cookie] = args.length === 1 ? [args[0].name, args[0].value, args[0]] : args;
    const map = this._parsed;
    map.set(name, normalizeCookie({ name, value, ...cookie }));
    replace(map, this._headers);
    return this;
  }
  /**
   * {@link https://wicg.github.io/cookie-store/#CookieStore-delete CookieStore#delete} without the Promise.
   */
  delete(...args) {
    const [name, path, domain] = typeof args[0] === "string" ? [args[0]] : [args[0].name, args[0].path, args[0].domain];
    return this.set({ name, path, domain, value: "", expires: /* @__PURE__ */ new Date(0) });
  }
  [Symbol.for("edge-runtime.inspect.custom")]() {
    return `ResponseCookies ${JSON.stringify(Object.fromEntries(this._parsed))}`;
  }
  toString() {
    return [...this._parsed.values()].map(stringifyCookie).join("; ");
  }
};
function replace(bag, headers) {
  headers.delete("set-cookie");
  for (const [, value] of bag) {
    const serialized = stringifyCookie(value);
    headers.append("set-cookie", serialized);
  }
}
function normalizeCookie(cookie = { name: "", value: "" }) {
  if (typeof cookie.expires === "number") {
    cookie.expires = new Date(cookie.expires);
  }
  if (cookie.maxAge) {
    cookie.expires = new Date(Date.now() + cookie.maxAge * 1e3);
  }
  if (cookie.path === null || cookie.path === void 0) {
    cookie.path = "/";
  }
  return cookie;
}
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    RequestCookies: function() {
      return _cookies.RequestCookies;
    },
    ResponseCookies: function() {
      return _cookies.ResponseCookies;
    },
    stringifyCookie: function() {
      return _cookies.stringifyCookie;
    }
  });
  const _cookies = cookies;
})(cookies$1);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    INTERNALS: function() {
      return INTERNALS;
    },
    NextRequest: function() {
      return NextRequest;
    }
  });
  const _nexturl = nextUrl;
  const _utils = utils;
  const _error = error;
  const _cookies = cookies$1;
  const INTERNALS = Symbol("internal request");
  class NextRequest extends Request {
    constructor(input, init = {}) {
      const url = typeof input !== "string" && "url" in input ? input.url : String(input);
      (0, _utils.validateURL)(url);
      if (input instanceof Request) super(input, init);
      else super(url, init);
      const nextUrl2 = new _nexturl.NextURL(url, {
        headers: (0, _utils.toNodeOutgoingHttpHeaders)(this.headers),
        nextConfig: init.nextConfig
      });
      this[INTERNALS] = {
        cookies: new _cookies.RequestCookies(this.headers),
        geo: init.geo || {},
        ip: init.ip,
        nextUrl: nextUrl2,
        url: process.env.__NEXT_NO_MIDDLEWARE_URL_NORMALIZE ? url : nextUrl2.toString()
      };
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
      return {
        cookies: this.cookies,
        geo: this.geo,
        ip: this.ip,
        nextUrl: this.nextUrl,
        url: this.url,
        // rest of props come from Request
        bodyUsed: this.bodyUsed,
        cache: this.cache,
        credentials: this.credentials,
        destination: this.destination,
        headers: Object.fromEntries(this.headers),
        integrity: this.integrity,
        keepalive: this.keepalive,
        method: this.method,
        mode: this.mode,
        redirect: this.redirect,
        referrer: this.referrer,
        referrerPolicy: this.referrerPolicy,
        signal: this.signal
      };
    }
    get cookies() {
      return this[INTERNALS].cookies;
    }
    get geo() {
      return this[INTERNALS].geo;
    }
    get ip() {
      return this[INTERNALS].ip;
    }
    get nextUrl() {
      return this[INTERNALS].nextUrl;
    }
    /**
    * @deprecated
    * `page` has been deprecated in favour of `URLPattern`.
    * Read more: https://nextjs.org/docs/messages/middleware-request-page
    */
    get page() {
      throw new _error.RemovedPageError();
    }
    /**
    * @deprecated
    * `ua` has been removed in favour of \`userAgent\` function.
    * Read more: https://nextjs.org/docs/messages/middleware-parse-user-agent
    */
    get ua() {
      throw new _error.RemovedUAError();
    }
    get url() {
      return this[INTERNALS].url;
    }
  }
})(request);
var response = {};
var reflect = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "ReflectAdapter", {
    enumerable: true,
    get: function() {
      return ReflectAdapter;
    }
  });
  class ReflectAdapter {
    static get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === "function") {
        return value.bind(target);
      }
      return value;
    }
    static set(target, prop, value, receiver) {
      return Reflect.set(target, prop, value, receiver);
    }
    static has(target, prop) {
      return Reflect.has(target, prop);
    }
    static deleteProperty(target, prop) {
      return Reflect.deleteProperty(target, prop);
    }
  }
})(reflect);
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "NextResponse", {
    enumerable: true,
    get: function() {
      return NextResponse;
    }
  });
  const _cookies = cookies$1;
  const _nexturl = nextUrl;
  const _utils = utils;
  const _reflect = reflect;
  const _cookies1 = cookies$1;
  const INTERNALS = Symbol("internal response");
  const REDIRECTS = /* @__PURE__ */ new Set([
    301,
    302,
    303,
    307,
    308
  ]);
  function handleMiddlewareField(init, headers) {
    var _init_request;
    if (init == null ? void 0 : (_init_request = init.request) == null ? void 0 : _init_request.headers) {
      if (!(init.request.headers instanceof Headers)) {
        throw new Error("request.headers must be an instance of Headers");
      }
      const keys = [];
      for (const [key, value] of init.request.headers) {
        headers.set("x-middleware-request-" + key, value);
        keys.push(key);
      }
      headers.set("x-middleware-override-headers", keys.join(","));
    }
  }
  class NextResponse extends Response {
    constructor(body, init = {}) {
      super(body, init);
      const headers = this.headers;
      const cookies2 = new _cookies1.ResponseCookies(headers);
      const cookiesProxy = new Proxy(cookies2, {
        get(target, prop, receiver) {
          switch (prop) {
            case "delete":
            case "set": {
              return (...args) => {
                const result = Reflect.apply(target[prop], target, args);
                const newHeaders = new Headers(headers);
                if (result instanceof _cookies1.ResponseCookies) {
                  headers.set("x-middleware-set-cookie", result.getAll().map((cookie) => (0, _cookies.stringifyCookie)(cookie)).join(","));
                }
                handleMiddlewareField(init, newHeaders);
                return result;
              };
            }
            default:
              return _reflect.ReflectAdapter.get(target, prop, receiver);
          }
        }
      });
      this[INTERNALS] = {
        cookies: cookiesProxy,
        url: init.url ? new _nexturl.NextURL(init.url, {
          headers: (0, _utils.toNodeOutgoingHttpHeaders)(headers),
          nextConfig: init.nextConfig
        }) : void 0
      };
    }
    [Symbol.for("edge-runtime.inspect.custom")]() {
      return {
        cookies: this.cookies,
        url: this.url,
        // rest of props come from Response
        body: this.body,
        bodyUsed: this.bodyUsed,
        headers: Object.fromEntries(this.headers),
        ok: this.ok,
        redirected: this.redirected,
        status: this.status,
        statusText: this.statusText,
        type: this.type
      };
    }
    get cookies() {
      return this[INTERNALS].cookies;
    }
    static json(body, init) {
      const response2 = Response.json(body, init);
      return new NextResponse(response2.body, response2);
    }
    static redirect(url, init) {
      const status = typeof init === "number" ? init : (init == null ? void 0 : init.status) ?? 307;
      if (!REDIRECTS.has(status)) {
        throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
      }
      const initObj = typeof init === "object" ? init : {};
      const headers = new Headers(initObj == null ? void 0 : initObj.headers);
      headers.set("Location", (0, _utils.validateURL)(url));
      return new NextResponse(null, {
        ...initObj,
        headers,
        status
      });
    }
    static rewrite(destination, init) {
      const headers = new Headers(init == null ? void 0 : init.headers);
      headers.set("x-middleware-rewrite", (0, _utils.validateURL)(destination));
      handleMiddlewareField(init, headers);
      return new NextResponse(null, {
        ...init,
        headers
      });
    }
    static next(init) {
      const headers = new Headers(init == null ? void 0 : init.headers);
      headers.set("x-middleware-next", "1");
      handleMiddlewareField(init, headers);
      return new NextResponse(null, {
        ...init,
        headers
      });
    }
  }
})(response);
var imageResponse = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "ImageResponse", {
    enumerable: true,
    get: function() {
      return ImageResponse;
    }
  });
  function ImageResponse() {
    throw new Error('ImageResponse moved from "next/server" to "next/og" since Next.js 14, please import from "next/og" instead');
  }
})(imageResponse);
var userAgent = {};
var uaParser = { exports: {} };
(() => {
  var i2 = { 226: function(i3, e3) {
    (function(o2, a3) {
      var r2 = "1.0.35", t2 = "", n = "?", s2 = "function", b2 = "undefined", w = "object", l = "string", d2 = "major", c4 = "model", u = "name", p2 = "type", m = "vendor", f2 = "version", h = "architecture", v = "console", g2 = "mobile", k = "tablet", x = "smarttv", _ = "wearable", y = "embedded", q = 350;
      var T2 = "Amazon", S = "Apple", z = "ASUS", N = "BlackBerry", A2 = "Browser", C = "Chrome", E = "Edge", O2 = "Firefox", U = "Google", j = "Huawei", P = "LG", R = "Microsoft", M2 = "Motorola", B = "Opera", V = "Samsung", D = "Sharp", I = "Sony", F2 = "Xiaomi", G2 = "Zebra", H = "Facebook", L2 = "Chromium OS", Z = "Mac OS";
      var extend = function(i4, e4) {
        var o3 = {};
        for (var a4 in i4) {
          if (e4[a4] && e4[a4].length % 2 === 0) {
            o3[a4] = e4[a4].concat(i4[a4]);
          } else {
            o3[a4] = i4[a4];
          }
        }
        return o3;
      }, enumerize = function(i4) {
        var e4 = {};
        for (var o3 = 0; o3 < i4.length; o3++) {
          e4[i4[o3].toUpperCase()] = i4[o3];
        }
        return e4;
      }, has = function(i4, e4) {
        return typeof i4 === l ? lowerize(e4).indexOf(lowerize(i4)) !== -1 : false;
      }, lowerize = function(i4) {
        return i4.toLowerCase();
      }, majorize = function(i4) {
        return typeof i4 === l ? i4.replace(/[^\d\.]/g, t2).split(".")[0] : a3;
      }, trim = function(i4, e4) {
        if (typeof i4 === l) {
          i4 = i4.replace(/^\s\s*/, t2);
          return typeof e4 === b2 ? i4 : i4.substring(0, q);
        }
      };
      var rgxMapper = function(i4, e4) {
        var o3 = 0, r3, t3, n2, b3, l2, d3;
        while (o3 < e4.length && !l2) {
          var c5 = e4[o3], u2 = e4[o3 + 1];
          r3 = t3 = 0;
          while (r3 < c5.length && !l2) {
            if (!c5[r3]) {
              break;
            }
            l2 = c5[r3++].exec(i4);
            if (!!l2) {
              for (n2 = 0; n2 < u2.length; n2++) {
                d3 = l2[++t3];
                b3 = u2[n2];
                if (typeof b3 === w && b3.length > 0) {
                  if (b3.length === 2) {
                    if (typeof b3[1] == s2) {
                      this[b3[0]] = b3[1].call(this, d3);
                    } else {
                      this[b3[0]] = b3[1];
                    }
                  } else if (b3.length === 3) {
                    if (typeof b3[1] === s2 && !(b3[1].exec && b3[1].test)) {
                      this[b3[0]] = d3 ? b3[1].call(this, d3, b3[2]) : a3;
                    } else {
                      this[b3[0]] = d3 ? d3.replace(b3[1], b3[2]) : a3;
                    }
                  } else if (b3.length === 4) {
                    this[b3[0]] = d3 ? b3[3].call(this, d3.replace(b3[1], b3[2])) : a3;
                  }
                } else {
                  this[b3] = d3 ? d3 : a3;
                }
              }
            }
          }
          o3 += 2;
        }
      }, strMapper = function(i4, e4) {
        for (var o3 in e4) {
          if (typeof e4[o3] === w && e4[o3].length > 0) {
            for (var r3 = 0; r3 < e4[o3].length; r3++) {
              if (has(e4[o3][r3], i4)) {
                return o3 === n ? a3 : o3;
              }
            }
          } else if (has(e4[o3], i4)) {
            return o3 === n ? a3 : o3;
          }
        }
        return i4;
      };
      var $ = { "1.0": "/8", 1.2: "/1", 1.3: "/3", "2.0": "/412", "2.0.2": "/416", "2.0.3": "/417", "2.0.4": "/419", "?": "/" }, X = { ME: "4.90", "NT 3.11": "NT3.51", "NT 4.0": "NT4.0", 2e3: "NT 5.0", XP: ["NT 5.1", "NT 5.2"], Vista: "NT 6.0", 7: "NT 6.1", 8: "NT 6.2", 8.1: "NT 6.3", 10: ["NT 6.4", "NT 10.0"], RT: "ARM" };
      var K = { browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [f2, [u, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [f2, [u, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [u, f2], [/opios[\/ ]+([\w\.]+)/i], [f2, [u, B + " Mini"]], [/\bopr\/([\w\.]+)/i], [f2, [u, B]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i, /(heytap|ovi)browser\/([\d\.]+)/i, /(weibo)__([\d\.]+)/i], [u, f2], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [f2, [u, "UC" + A2]], [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i], [f2, [u, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [f2, [u, "WeChat"]], [/konqueror\/([\w\.]+)/i], [f2, [u, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [f2, [u, "IE"]], [/ya(?:search)?browser\/([\w\.]+)/i], [f2, [u, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[u, /(.+)/, "$1 Secure " + A2], f2], [/\bfocus\/([\w\.]+)/i], [f2, [u, O2 + " Focus"]], [/\bopt\/([\w\.]+)/i], [f2, [u, B + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [f2, [u, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [f2, [u, "Dolphin"]], [/coast\/([\w\.]+)/i], [f2, [u, B + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [f2, [u, "MIUI " + A2]], [/fxios\/([-\w\.]+)/i], [f2, [u, O2]], [/\bqihu|(qi?ho?o?|360)browser/i], [[u, "360 " + A2]], [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i], [[u, /(.+)/, "$1 " + A2], f2], [/(comodo_dragon)\/([\w\.]+)/i], [[u, /_/g, " "], f2], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [u, f2], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i], [u], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[u, H], f2], [/(kakao(?:talk|story))[\/ ]([\w\.]+)/i, /(naver)\(.*?(\d+\.[\w\.]+).*\)/i, /safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [u, f2], [/\bgsa\/([\w\.]+) .*safari\//i], [f2, [u, "GSA"]], [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i], [f2, [u, "TikTok"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [f2, [u, C + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[u, C + " WebView"], f2], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [f2, [u, "Android " + A2]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [u, f2], [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i], [f2, [u, "Mobile Safari"]], [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i], [f2, u], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [u, [f2, strMapper, $]], [/(webkit|khtml)\/([\w\.]+)/i], [u, f2], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[u, "Netscape"], f2], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [f2, [u, O2 + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i, /panasonic;(viera)/i], [u, f2], [/(cobalt)\/([\w\.]+)/i], [u, [f2, /master.|lts./, ""]]], cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[h, "amd64"]], [/(ia32(?=;))/i], [[h, lowerize]], [/((?:i[346]|x)86)[;\)]/i], [[h, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[h, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[h, "armhf"]], [/windows (ce|mobile); ppc;/i], [[h, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[h, /ower/, t2, lowerize]], [/(sun4\w)[;\)]/i], [[h, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[h, lowerize]]], device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [c4, [m, V], [p2, k]], [/\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [c4, [m, V], [p2, g2]], [/(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i], [c4, [m, S], [p2, g2]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [c4, [m, S], [p2, k]], [/(macintosh);/i], [c4, [m, S]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [c4, [m, D], [p2, g2]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [c4, [m, j], [p2, k]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i], [c4, [m, j], [p2, g2]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[c4, /_/g, " "], [m, F2], [p2, g2]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[c4, /_/g, " "], [m, F2], [p2, k]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [c4, [m, "OPPO"], [p2, g2]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [c4, [m, "Vivo"], [p2, g2]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [c4, [m, "Realme"], [p2, g2]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [c4, [m, M2], [p2, g2]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [c4, [m, M2], [p2, k]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [c4, [m, P], [p2, k]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [c4, [m, P], [p2, g2]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [c4, [m, "Lenovo"], [p2, k]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[c4, /_/g, " "], [m, "Nokia"], [p2, g2]], [/(pixel c)\b/i], [c4, [m, U], [p2, k]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [c4, [m, U], [p2, g2]], [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [c4, [m, I], [p2, g2]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[c4, "Xperia Tablet"], [m, I], [p2, k]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [c4, [m, "OnePlus"], [p2, g2]], [/(alexa)webm/i, /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [c4, [m, T2], [p2, k]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[c4, /(.+)/g, "Fire Phone $1"], [m, T2], [p2, g2]], [/(playbook);[-\w\),; ]+(rim)/i], [c4, m, [p2, k]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [c4, [m, N], [p2, g2]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [c4, [m, z], [p2, k]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [c4, [m, z], [p2, g2]], [/(nexus 9)/i], [c4, [m, "HTC"], [p2, k]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i], [m, [c4, /_/g, " "], [p2, g2]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [c4, [m, "Acer"], [p2, k]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [c4, [m, "Meizu"], [p2, g2]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [m, c4, [p2, g2]], [/(kobo)\s(ereader|touch)/i, /(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [m, c4, [p2, k]], [/(surface duo)/i], [c4, [m, R], [p2, k]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [c4, [m, "Fairphone"], [p2, g2]], [/(u304aa)/i], [c4, [m, "AT&T"], [p2, g2]], [/\bsie-(\w*)/i], [c4, [m, "Siemens"], [p2, g2]], [/\b(rct\w+) b/i], [c4, [m, "RCA"], [p2, k]], [/\b(venue[\d ]{2,7}) b/i], [c4, [m, "Dell"], [p2, k]], [/\b(q(?:mv|ta)\w+) b/i], [c4, [m, "Verizon"], [p2, k]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [c4, [m, "Barnes & Noble"], [p2, k]], [/\b(tm\d{3}\w+) b/i], [c4, [m, "NuVision"], [p2, k]], [/\b(k88) b/i], [c4, [m, "ZTE"], [p2, k]], [/\b(nx\d{3}j) b/i], [c4, [m, "ZTE"], [p2, g2]], [/\b(gen\d{3}) b.+49h/i], [c4, [m, "Swiss"], [p2, g2]], [/\b(zur\d{3}) b/i], [c4, [m, "Swiss"], [p2, k]], [/\b((zeki)?tb.*\b) b/i], [c4, [m, "Zeki"], [p2, k]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[m, "Dragon Touch"], c4, [p2, k]], [/\b(ns-?\w{0,9}) b/i], [c4, [m, "Insignia"], [p2, k]], [/\b((nxa|next)-?\w{0,9}) b/i], [c4, [m, "NextBook"], [p2, k]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[m, "Voice"], c4, [p2, g2]], [/\b(lvtel\-)?(v1[12]) b/i], [[m, "LvTel"], c4, [p2, g2]], [/\b(ph-1) /i], [c4, [m, "Essential"], [p2, g2]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [c4, [m, "Envizen"], [p2, k]], [/\b(trio[-\w\. ]+) b/i], [c4, [m, "MachSpeed"], [p2, k]], [/\btu_(1491) b/i], [c4, [m, "Rotor"], [p2, k]], [/(shield[\w ]+) b/i], [c4, [m, "Nvidia"], [p2, k]], [/(sprint) (\w+)/i], [m, c4, [p2, g2]], [/(kin\.[onetw]{3})/i], [[c4, /\./g, " "], [m, R], [p2, g2]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [c4, [m, G2], [p2, k]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [c4, [m, G2], [p2, g2]], [/smart-tv.+(samsung)/i], [m, [p2, x]], [/hbbtv.+maple;(\d+)/i], [[c4, /^/, "SmartTV"], [m, V], [p2, x]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[m, P], [p2, x]], [/(apple) ?tv/i], [m, [c4, S + " TV"], [p2, x]], [/crkey/i], [[c4, C + "cast"], [m, U], [p2, x]], [/droid.+aft(\w)( bui|\))/i], [c4, [m, T2], [p2, x]], [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i], [c4, [m, D], [p2, x]], [/(bravia[\w ]+)( bui|\))/i], [c4, [m, I], [p2, x]], [/(mitv-\w{5}) bui/i], [c4, [m, F2], [p2, x]], [/Hbbtv.*(technisat) (.*);/i], [m, c4, [p2, x]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i], [[m, trim], [c4, trim], [p2, x]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[p2, x]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [m, c4, [p2, v]], [/droid.+; (shield) bui/i], [c4, [m, "Nvidia"], [p2, v]], [/(playstation [345portablevi]+)/i], [c4, [m, I], [p2, v]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [c4, [m, R], [p2, v]], [/((pebble))app/i], [m, c4, [p2, _]], [/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i], [c4, [m, S], [p2, _]], [/droid.+; (glass) \d/i], [c4, [m, U], [p2, _]], [/droid.+; (wt63?0{2,3})\)/i], [c4, [m, G2], [p2, _]], [/(quest( 2| pro)?)/i], [c4, [m, H], [p2, _]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [m, [p2, y]], [/(aeobc)\b/i], [c4, [m, T2], [p2, y]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [c4, [p2, g2]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [c4, [p2, k]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[p2, k]], [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i], [[p2, g2]], [/(android[-\w\. ]{0,9});.+buil/i], [c4, [m, "Generic"]]], engine: [[/windows.+ edge\/([\w\.]+)/i], [f2, [u, E + "HTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [f2, [u, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i, /\b(libweb)/i], [u, f2], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [f2, u]], os: [[/microsoft (windows) (vista|xp)/i], [u, f2], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [u, [f2, strMapper, X]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[u, "Windows"], [f2, strMapper, X]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /ios;fbsv\/([\d\.]+)/i, /cfnetwork\/.+darwin/i], [[f2, /_/g, "."], [u, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[u, Z], [f2, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i], [f2, u], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [u, f2], [/\(bb(10);/i], [f2, [u, N]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [f2, [u, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [f2, [u, O2 + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [f2, [u, "webOS"]], [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i], [f2, [u, "watchOS"]], [/crkey\/([\d\.]+)/i], [f2, [u, C + "cast"]], [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i], [[u, L2], f2], [/panasonic;(viera)/i, /(netrange)mmh/i, /(nettv)\/(\d+\.[\w\.]+)/i, /(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [u, f2], [/(sunos) ?([\w\.\d]*)/i], [[u, "Solaris"], f2], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, /(unix) ?([\w\.]*)/i], [u, f2]] };
      var UAParser = function(i4, e4) {
        if (typeof i4 === w) {
          e4 = i4;
          i4 = a3;
        }
        if (!(this instanceof UAParser)) {
          return new UAParser(i4, e4).getResult();
        }
        var r3 = typeof o2 !== b2 && o2.navigator ? o2.navigator : a3;
        var n2 = i4 || (r3 && r3.userAgent ? r3.userAgent : t2);
        var v2 = r3 && r3.userAgentData ? r3.userAgentData : a3;
        var x2 = e4 ? extend(K, e4) : K;
        var _2 = r3 && r3.userAgent == n2;
        this.getBrowser = function() {
          var i5 = {};
          i5[u] = a3;
          i5[f2] = a3;
          rgxMapper.call(i5, n2, x2.browser);
          i5[d2] = majorize(i5[f2]);
          if (_2 && r3 && r3.brave && typeof r3.brave.isBrave == s2) {
            i5[u] = "Brave";
          }
          return i5;
        };
        this.getCPU = function() {
          var i5 = {};
          i5[h] = a3;
          rgxMapper.call(i5, n2, x2.cpu);
          return i5;
        };
        this.getDevice = function() {
          var i5 = {};
          i5[m] = a3;
          i5[c4] = a3;
          i5[p2] = a3;
          rgxMapper.call(i5, n2, x2.device);
          if (_2 && !i5[p2] && v2 && v2.mobile) {
            i5[p2] = g2;
          }
          if (_2 && i5[c4] == "Macintosh" && r3 && typeof r3.standalone !== b2 && r3.maxTouchPoints && r3.maxTouchPoints > 2) {
            i5[c4] = "iPad";
            i5[p2] = k;
          }
          return i5;
        };
        this.getEngine = function() {
          var i5 = {};
          i5[u] = a3;
          i5[f2] = a3;
          rgxMapper.call(i5, n2, x2.engine);
          return i5;
        };
        this.getOS = function() {
          var i5 = {};
          i5[u] = a3;
          i5[f2] = a3;
          rgxMapper.call(i5, n2, x2.os);
          if (_2 && !i5[u] && v2 && v2.platform != "Unknown") {
            i5[u] = v2.platform.replace(/chrome os/i, L2).replace(/macos/i, Z);
          }
          return i5;
        };
        this.getResult = function() {
          return { ua: this.getUA(), browser: this.getBrowser(), engine: this.getEngine(), os: this.getOS(), device: this.getDevice(), cpu: this.getCPU() };
        };
        this.getUA = function() {
          return n2;
        };
        this.setUA = function(i5) {
          n2 = typeof i5 === l && i5.length > q ? trim(i5, q) : i5;
          return this;
        };
        this.setUA(n2);
        return this;
      };
      UAParser.VERSION = r2;
      UAParser.BROWSER = enumerize([u, f2, d2]);
      UAParser.CPU = enumerize([h]);
      UAParser.DEVICE = enumerize([c4, m, p2, v, g2, x, k, _, y]);
      UAParser.ENGINE = UAParser.OS = enumerize([u, f2]);
      if (typeof e3 !== b2) {
        if (i3.exports) {
          e3 = i3.exports = UAParser;
        }
        e3.UAParser = UAParser;
      } else {
        if (typeof o2 !== b2) {
          o2.UAParser = UAParser;
        }
      }
      var Q = typeof o2 !== b2 && (o2.jQuery || o2.Zepto);
      if (Q && !Q.ua) {
        var Y = new UAParser();
        Q.ua = Y.getResult();
        Q.ua.get = function() {
          return Y.getUA();
        };
        Q.ua.set = function(i4) {
          Y.setUA(i4);
          var e4 = Y.getResult();
          for (var o3 in e4) {
            Q.ua[o3] = e4[o3];
          }
        };
      }
    })(typeof window === "object" ? window : this);
  } };
  var e2 = {};
  function __nccwpck_require__(o2) {
    var a3 = e2[o2];
    if (a3 !== void 0) {
      return a3.exports;
    }
    var r2 = e2[o2] = { exports: {} };
    var t2 = true;
    try {
      i2[o2].call(r2.exports, r2, r2.exports, __nccwpck_require__);
      t2 = false;
    } finally {
      if (t2) delete e2[o2];
    }
    return r2.exports;
  }
  if (typeof __nccwpck_require__ !== "undefined") __nccwpck_require__.ab = __dirname + "/";
  var o = __nccwpck_require__(226);
  uaParser.exports = o;
})();
var uaParserExports = uaParser.exports;
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  function _export(target, all) {
    for (var name in all) Object.defineProperty(target, name, {
      enumerable: true,
      get: all[name]
    });
  }
  _export(exports, {
    isBot: function() {
      return isBot;
    },
    userAgent: function() {
      return userAgent2;
    },
    userAgentFromString: function() {
      return userAgentFromString;
    }
  });
  const _uaparserjs = /* @__PURE__ */ _interop_require_default(uaParserExports);
  function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }
  function isBot(input) {
    return /Googlebot|Mediapartners-Google|AdsBot-Google|googleweblight|Storebot-Google|Google-PageRenderer|Google-InspectionTool|Bingbot|BingPreview|Slurp|DuckDuckBot|baiduspider|yandex|sogou|LinkedInBot|bitlybot|tumblr|vkShare|quora link preview|facebookexternalhit|facebookcatalog|Twitterbot|applebot|redditbot|Slackbot|Discordbot|WhatsApp|SkypeUriPreview|ia_archiver/i.test(input);
  }
  function userAgentFromString(input) {
    return {
      ...(0, _uaparserjs.default)(input),
      isBot: input === void 0 ? false : isBot(input)
    };
  }
  function userAgent2({ headers }) {
    return userAgentFromString(headers.get("user-agent") || void 0);
  }
})(userAgent);
var urlPattern = {};
(function(exports) {
  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.defineProperty(exports, "URLPattern", {
    enumerable: true,
    get: function() {
      return GlobalURLPattern;
    }
  });
  const GlobalURLPattern = (
    // @ts-expect-error: URLPattern is not available in Node.js
    typeof URLPattern === "undefined" ? void 0 : URLPattern
  );
})(urlPattern);
(function(module, exports) {
  const serverExports2 = {
    NextRequest: request.NextRequest,
    NextResponse: response.NextResponse,
    ImageResponse: imageResponse.ImageResponse,
    userAgentFromString: userAgent.userAgentFromString,
    userAgent: userAgent.userAgent,
    URLPattern: urlPattern.URLPattern
  };
  module.exports = serverExports2;
  exports.NextRequest = serverExports2.NextRequest;
  exports.NextResponse = serverExports2.NextResponse;
  exports.ImageResponse = serverExports2.ImageResponse;
  exports.userAgentFromString = serverExports2.userAgentFromString;
  exports.userAgent = serverExports2.userAgent;
  exports.URLPattern = serverExports2.URLPattern;
})(server, server.exports);
var serverExports = server.exports;
function createPathBasedMiddleware(config) {
  const {
    supportedLocales,
    defaultLocale,
    excludePaths = ["/api", "/static", "/_next", "/favicon.ico"],
    includeDefaultLocaleInPath = false,
    redirectToDefaultLocale = true,
    cookieName = "rustle-locale",
    debug = false
  } = config;
  AdvancedPathLocaleManager.configure({
    enabled: true,
    supportedLocales,
    defaultLocale,
    excludePaths,
    includeDefaultLocaleInPath,
    redirectToDefaultLocale
  });
  return function middleware(request2) {
    var _a;
    const pathname = request2.nextUrl.pathname;
    if (debug) {
      console.log(`🌐 [PathBasedMiddleware] Processing: ${pathname}`);
    }
    if (AdvancedPathLocaleManager.shouldExcludePath(pathname)) {
      if (debug) {
        console.log(`⏭️ [PathBasedMiddleware] Skipping excluded path: ${pathname}`);
      }
      return serverExports.NextResponse.next();
    }
    const requestData = {
      pathname,
      headers: Object.fromEntries(request2.headers.entries()),
      cookies: Object.fromEntries(
        request2.cookies.getAll().map((cookie) => [cookie.name, cookie.value])
      )
    };
    const { locale, shouldRedirect, redirectPath } = AdvancedPathLocaleManager.getLocaleFromRequest(requestData);
    if (debug) {
      console.log(`🔍 [PathBasedMiddleware] Detected locale: ${locale}, shouldRedirect: ${shouldRedirect}`);
    }
    if (shouldRedirect && redirectPath) {
      if (debug) {
        console.log(`↩️ [PathBasedMiddleware] Redirecting to: ${redirectPath}`);
      }
      const response22 = serverExports.NextResponse.redirect(new URL(redirectPath, request2.url));
      response22.cookies.set(cookieName, locale, {
        path: "/",
        maxAge: 31536e3,
        // 1 year
        sameSite: "lax"
      });
      return response22;
    }
    const response2 = serverExports.NextResponse.next();
    const currentCookieLocale = (_a = request2.cookies.get(cookieName)) == null ? void 0 : _a.value;
    if (currentCookieLocale !== locale) {
      response2.cookies.set(cookieName, locale, {
        path: "/",
        maxAge: 31536e3,
        // 1 year
        sameSite: "lax"
      });
      if (debug) {
        console.log(`🍪 [PathBasedMiddleware] Setting locale cookie: ${locale}`);
      }
    }
    response2.headers.set("x-rustle-locale", locale);
    response2.headers.set(
      "x-rustle-path-without-locale",
      PathLocaleManager.removeLocaleFromPath(pathname, supportedLocales)
    );
    if (debug) {
      console.log(`✅ [PathBasedMiddleware] Processed successfully: ${pathname} -> ${locale}`);
    }
    return response2;
  };
}
function getLocaleFromNextRequest(request2) {
  const locale = request2.headers.get("x-rustle-locale") || "en";
  const pathWithoutLocale = request2.headers.get("x-rustle-path-without-locale") || "/";
  const alternateLinks = AdvancedPathLocaleManager.generateAlternateLinks(
    request2.nextUrl.pathname,
    request2.nextUrl.origin
  );
  return {
    locale,
    pathWithoutLocale,
    alternateLinks
  };
}
function generateStaticPathsForLocales(basePaths, config) {
  const { supportedLocales, defaultLocale, includeDefaultLocaleInPath = false } = config;
  const paths = [];
  basePaths.forEach(({ slug }) => {
    supportedLocales.forEach((locale) => {
      if (locale === defaultLocale && !includeDefaultLocaleInPath) {
        paths.push({
          params: { slug },
          locale
        });
      } else {
        paths.push({
          params: { slug: [locale, ...slug] },
          locale
        });
      }
    });
  });
  return paths;
}
function extractLocaleFromParams(params, config) {
  const { supportedLocales, defaultLocale } = config;
  const slug = params.slug || [];
  if (slug.length === 0) {
    return { locale: defaultLocale, cleanSlug: [] };
  }
  const firstSegment = slug[0];
  if (supportedLocales.includes(firstSegment)) {
    return {
      locale: firstSegment,
      cleanSlug: slug.slice(1)
    };
  }
  return { locale: defaultLocale, cleanSlug: slug };
}
function createLocaleAwareGetStaticProps(getProps) {
  return async function getStaticProps(context) {
    const { locale: contextLocale, params } = context;
    const { locale, cleanSlug } = extractLocaleFromParams(params, {
      supportedLocales: ["en", "es", "fr", "de", "it", "pt"],
      // Default, should be configurable
      defaultLocale: "en"
    });
    const finalLocale = contextLocale || locale;
    const result = await getProps({
      locale: finalLocale,
      cleanSlug,
      params
    });
    return {
      ...result,
      props: {
        ...result.props,
        locale: finalLocale,
        pathWithoutLocale: "/" + cleanSlug.join("/")
      }
    };
  };
}
function rustleEngine(rustleConfig) {
  return function withRustle(nextConfig = {}) {
    const validatedConfig = RustleConfigSchema.partial().parse(rustleConfig);
    if (validatedConfig.debug) {
      console.log("Rustle Next.js Plugin: Initialized with config:", validatedConfig);
    }
    return {
      ...nextConfig,
      // Extend webpack configuration
      webpack: (config, context) => {
        if (!validatedConfig.deactivate) {
          if (validatedConfig.debug && !context.dev) {
            console.log("Rustle Next.js Plugin: Webpack configuration extended");
          }
        }
        if (typeof nextConfig.webpack === "function") {
          return nextConfig.webpack(config, context);
        }
        return config;
      },
      // Extend environment variables
      env: {
        ...nextConfig.env,
        RUSTLE_CONFIG: JSON.stringify(validatedConfig)
      },
      // Add experimental features if needed
      experimental: {
        ...nextConfig.experimental
        // Add any experimental features needed for Rustle
      }
    };
  };
}
function getServerSideLocale(req) {
  const cookies2 = req.headers.cookie || "";
  const match = cookies2.match(/rustle-locale=([^;]+)/);
  return match ? match[1] : null;
}
async function loadServerSideLocaleData(locale) {
  try {
    return null;
  } catch (error2) {
    console.warn(`Failed to load server-side locale data for ${locale}:`, error2);
    return null;
  }
}
function RustleServerProvider({
  children,
  locale,
  localeData
}) {
  return React.createElement(React.Fragment, null, children);
}
async function getRustleServerSideProps(context) {
  const locale = getServerSideLocale(context.req);
  const localeData = locale ? await loadServerSideLocaleData(locale) : null;
  return {
    props: {
      rustleLocale: locale,
      rustleLocaleData: localeData
    }
  };
}
async function getRustleStaticProps(locale) {
  const localeData = await loadServerSideLocaleData(locale);
  return {
    props: {
      rustleLocale: locale,
      rustleLocaleData: localeData
    }
  };
}
export {
  A as AIModelSchema,
  b as AutoConfigSchema,
  F as FallbackConfigSchema,
  G as GeminiModelSchema,
  L as LegacyModelSchema,
  d as LocaleDataSchema,
  a as LocaleSchema,
  c as MasterMetadataSchema,
  M as ModelConfigSchema,
  O as OpenAIModelSchema,
  RustleConfigSchema,
  RustleServerProvider,
  ServerTranslate,
  ServerTranslateWrapper,
  TranslatedPage,
  T as TranslationEntrySchema,
  e as TranslationRequestSchema,
  f as TranslationResponseSchema,
  createLocaleAwareGetStaticProps,
  a2 as createLocaleMiddleware,
  createPathBasedMiddleware,
  c3 as createServerLocaleCookie,
  c2 as createServerLocaleHeader,
  extractLocaleFromParams,
  generateAlternateLanguages,
  generateHreflangLinks,
  generatePageMetadata,
  generateSEOMetadata,
  generateStaticPathsForLocales,
  generateTranslatedMetadata,
  generateTranslationScript,
  g as getLocaleFromCookie,
  getLocaleFromNextRequest,
  getRustleServerSideProps,
  getRustleStaticProps,
  getServerLocale,
  getServerSideLocale,
  i as injectServerTranslations,
  loadServerLocaleData,
  loadServerSideLocaleData,
  p as parseCookies,
  r as removeLocaleFromCookie,
  rustleEngine,
  s as setLocaleToCookie,
  t as translateServer,
  translateServerText,
  translateServerTexts
};
