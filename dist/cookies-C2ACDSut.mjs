"use client";
const LOCALE_COOKIE_NAME = "rustle-locale";
function getLocaleFromCookie(cookieString) {
  const cookies = cookieString || (typeof document !== "undefined" ? document.cookie : "");
  if (!cookies) return null;
  const match = cookies.match(new RegExp(`(^| )${LOCALE_COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : null;
}
function setLocaleToCookie(locale, options = {}) {
  if (typeof document === "undefined") {
    console.warn("setLocaleToCookie: document is not available (server-side)");
    return;
  }
  const {
    maxAge = 365 * 24 * 60 * 60,
    // 1 year in seconds
    path = "/",
    domain,
    secure = false,
    sameSite = "lax"
  } = options;
  let cookieString = `${LOCALE_COOKIE_NAME}=${locale}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}`;
  if (domain) {
    cookieString += `; Domain=${domain}`;
  }
  if (secure) {
    cookieString += "; Secure";
  }
  document.cookie = cookieString;
}
function removeLocaleFromCookie() {
  if (typeof document === "undefined") {
    console.warn("removeLocaleFromCookie: document is not available (server-side)");
    return;
  }
  document.cookie = `${LOCALE_COOKIE_NAME}=; Max-Age=0; Path=/`;
}
function parseCookies(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;
  cookieString.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    const value = rest.join("=");
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value.trim());
    }
  });
  return cookies;
}
function createServerLocaleCookie(locale, options = {}) {
  const {
    maxAge = 365 * 24 * 60 * 60,
    // 1 year in seconds
    path = "/",
    domain,
    secure = false,
    httpOnly = false,
    sameSite = "lax"
  } = options;
  let cookie = `${LOCALE_COOKIE_NAME}=${locale}`;
  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  if (path) cookie += `; Path=${path}`;
  if (domain) cookie += `; Domain=${domain}`;
  if (secure) cookie += `; Secure`;
  if (httpOnly) cookie += `; HttpOnly`;
  if (sameSite) cookie += `; SameSite=${sameSite}`;
  return cookie;
}
export {
  createServerLocaleCookie as c,
  getLocaleFromCookie as g,
  parseCookies as p,
  removeLocaleFromCookie as r,
  setLocaleToCookie as s
};
