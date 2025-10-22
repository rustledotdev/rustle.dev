'use client';

import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Locale } from '../types';

/**
 * Development mode utilities for Next.js
 * Automatically creates/updates locale files during development
 */

interface DevModeOptions {
  localeBasePath?: string;
  sourceLanguage?: Locale;
  targetLanguages?: Locale[];
  debug?: boolean;
}

/**
 * Extract text content from React components and generate locale files
 */
export function extractAndGenerateLocales(
  componentPaths: string[],
  options: DevModeOptions = {}
) {
  const {
    localeBasePath = './public/rustle/locales',
    sourceLanguage = 'en',
    targetLanguages = ['es', 'fr', 'de', 'it', 'pt'],
    debug = false
  } = options;

  // This would be called during Next.js compilation
  if (typeof window !== 'undefined') {
    // Client-side, skip
    return;
  }

  try {
    // Ensure locale directory exists
    const localeDir = join(process.cwd(), localeBasePath);
    if (!existsSync(localeDir)) {
      mkdirSync(localeDir, { recursive: true });
    }

    // Generate basic locale files if they don't exist
    targetLanguages.forEach(locale => {
      const localeFile = join(localeDir, `${locale}.json`);
      if (!existsSync(localeFile)) {
        // Create empty locale file
        writeFileSync(localeFile, JSON.stringify({}, null, 2));
        
        if (debug) {
          console.log(`✅ DevMode: Created locale file ${localeFile}`);
        }
      }
    });

    // Create source language file
    const sourceFile = join(localeDir, `${sourceLanguage}.json`);
    if (!existsSync(sourceFile)) {
      writeFileSync(sourceFile, JSON.stringify({}, null, 2));
      
      if (debug) {
        console.log(`✅ DevMode: Created source locale file ${sourceFile}`);
      }
    }

  } catch (error) {
    if (debug) {
      console.error('❌ DevMode: Failed to generate locale files:', error);
    }
  }
}

/**
 * Next.js webpack plugin to automatically generate locale files
 */
export function createRustleDevPlugin(options: DevModeOptions = {}) {
  return {
    name: 'rustle-dev-plugin',
    setup(build: any) {
      build.onStart(() => {
        extractAndGenerateLocales([], options);
      });
    }
  };
}

/**
 * Next.js config helper to enable development mode features
 */
export function withRustleDev(nextConfig: any = {}, options: DevModeOptions = {}) {
  return {
    ...nextConfig,
    webpack: (config: any, { dev, isServer }: any) => {
      if (dev && isServer) {
        // Add development mode features
        extractAndGenerateLocales([], options);
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, { dev, isServer });
      }

      return config;
    },
  };
}

/**
 * Runtime locale file updater for development
 */
export function updateLocaleFileInDev(
  locale: Locale,
  fingerprint: string,
  originalText: string,
  translatedText: string,
  options: DevModeOptions = {}
) {
  if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const {
    localeBasePath = './public/rustle/locales',
    debug = false
  } = options;

  try {
    const localeFile = join(process.cwd(), localeBasePath, `${locale}.json`);
    
    let localeData = {};
    if (existsSync(localeFile)) {
      const content = require('fs').readFileSync(localeFile, 'utf-8');
      localeData = JSON.parse(content);
    }

    // Update the locale data
    (localeData as any)[fingerprint] = translatedText;

    // Write back to file
    writeFileSync(localeFile, JSON.stringify(localeData, null, 2));

    if (debug) {
      console.log(`✅ DevMode: Updated ${locale}.json with ${fingerprint}: "${originalText}" -> "${translatedText}"`);
    }

  } catch (error) {
    if (debug) {
      console.error(`❌ DevMode: Failed to update locale file for ${locale}:`, error);
    }
  }
}

/**
 * Development mode middleware for Next.js API routes
 */
export function createDevModeMiddleware(options: DevModeOptions = {}) {
  return async (req: any, res: any, next: any) => {
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    // Add development mode headers
    res.setHeader('X-Rustle-Dev-Mode', 'true');
    
    // Initialize locale files if needed
    extractAndGenerateLocales([], options);

    next();
  };
}
