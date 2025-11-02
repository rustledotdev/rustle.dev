/**
 * Global constants for Rustle.dev SDK
 *
 * This file contains all shared constants used across the SDK.
 * DO NOT hardcode values elsewhere - use these constants instead.
 */

/**
 * Default API endpoint URL
 * Can be overridden via RUSTLE_API_URL environment variable
 */
export const DEFAULT_API_URL = 'https://brain.rustle.dev/api';

/**
 * Default locale base path under /public (e.g. /public/rustle)
 */
export const DEFAULT_LOCALE_BASE_PATH = '/rustle';

/**
 * Default subdirectory containing per-locale JSON files (under DEFAULT_LOCALE_BASE_PATH)
 */
export const DEFAULT_LOCALES_DIR = 'locales';

/**
 * Full public URL base for locale JSON files (e.g. /rustle/locales)
 */
export const DEFAULT_LOCALES_JSON_PATH = `${DEFAULT_LOCALE_BASE_PATH}/${DEFAULT_LOCALES_DIR}`;

/**
 * Default master file name
 */
export const DEFAULT_MASTER_FILE_NAME = 'master.json';

/**
 * Default rustle config file name
 */
export const DEFAULT_CONFIG_FILE_NAME = 'rustle.config.json';

/**
 * Default cookie name for persisted locale
 */
export const DEFAULT_LOCALE_COOKIE_NAME = 'rustle-locale';
