#!/usr/bin/env node
"use client";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import fs from "fs";
import path from "path";
import * as glob from "glob";
import { i as isTranslatableText, g as generateContentFingerprint, a as generateContentHash, c as cleanTranslation } from "../fingerprinting-iGOd0RNQ.mjs";
class RustleEngine {
  constructor(config) {
    __publicField(this, "config");
    __publicField(this, "extractedEntries", /* @__PURE__ */ new Map());
    __publicField(this, "existingMaster", null);
    this.config = config;
  }
  /**
   * Main extraction process
   */
  async extract() {
    console.log("🚀 RustleEngine: Starting extraction...");
    await this.loadExistingMaster();
    const files = await this.findSourceFiles();
    console.log(`📁 Found ${files.length} source files to process`);
    for (const file of files) {
      await this.extractFromFile(file);
    }
    await this.generateMasterFile();
    await this.generateLocaleFiles();
    console.log("✅ RustleEngine: Extraction completed successfully!");
  }
  /**
   * Load existing master.json file
   */
  async loadExistingMaster() {
    var _a;
    const masterPath = path.join(this.config.outputDir, "master.json");
    if (fs.existsSync(masterPath)) {
      try {
        const content = fs.readFileSync(masterPath, "utf-8");
        this.existingMaster = JSON.parse(content);
        console.log(`📖 Loaded existing master.json with ${Object.keys(((_a = this.existingMaster) == null ? void 0 : _a.entries) || {}).length} entries`);
      } catch (error) {
        console.warn("⚠️ Failed to load existing master.json:", error);
      }
    }
  }
  /**
   * Find all source files to process
   */
  async findSourceFiles() {
    const patterns = this.config.filePatterns.map(
      (pattern) => path.join(this.config.srcDir, pattern)
    );
    const files = [];
    for (const pattern of patterns) {
      const matches = await new Promise((resolve, reject) => {
        glob.glob(pattern, (err, matches2) => {
          if (err) reject(err);
          else resolve(matches2);
        });
      });
      files.push(...matches);
    }
    const filteredFiles = files.filter((file) => {
      return !this.config.excludePatterns.some((excludePattern) => {
        return file.includes(excludePattern.replace("**/", "").replace("/**", ""));
      });
    });
    return [...new Set(filteredFiles)];
  }
  /**
   * Extract translatable content from a single file
   */
  async extractFromFile(filePath) {
    if (this.config.debug) {
      console.log(`🔍 Processing: ${filePath}`);
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const relativeFilePath = path.relative(this.config.srcDir, filePath);
      this.extractWithRegex(content, relativeFilePath);
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }
  /**
   * Extract translatable content using regex (MVP approach)
   * In production, this would use proper AST parsing
   */
  extractWithRegex(content, filePath) {
    const patterns = [
      // JSX text content: <h1>Hello World</h1>
      /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>([^<]+)<\/\1>/g,
      // JSX self-closing with text attributes: <img alt="Hello" />
      /<[a-zA-Z][a-zA-Z0-9]*[^>]*\s(alt|title|placeholder|aria-label)=["']([^"']+)["'][^>]*\/?>/g,
      // String literals in JSX: {"Hello World"}
      /\{["']([^"']+)["']\}/g
    ];
    patterns.forEach((pattern, patternIndex) => {
      var _a;
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[2] || match[1];
        if (text && isTranslatableText(text)) {
          const position = match.index;
          const fingerprint = generateContentFingerprint(text);
          const contentHash = generateContentHash(text);
          const tags = this.extractTagContext(content, position);
          const entry = {
            fingerprint,
            source: text.trim(),
            file: filePath,
            loc: { start: position, end: position + match[0].length },
            contentHash,
            version: 1,
            translations: {},
            lastTranslatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            tags,
            status: "new"
          };
          const existingEntry = (_a = this.existingMaster) == null ? void 0 : _a.entries[fingerprint];
          if (existingEntry) {
            if (existingEntry.contentHash !== contentHash) {
              entry.version = existingEntry.version + 1;
              entry.status = "updated";
              entry.translations = existingEntry.translations;
            } else {
              entry.version = existingEntry.version;
              entry.status = existingEntry.status;
              entry.translations = existingEntry.translations;
              entry.lastTranslatedAt = existingEntry.lastTranslatedAt;
            }
          }
          this.extractedEntries.set(fingerprint, entry);
          if (this.config.debug) {
            console.log(`📝 Extracted: "${text.substring(0, 30)}..." -> ${fingerprint}`);
          }
        }
      }
    });
  }
  /**
   * Check if tag should be excluded from extraction
   */
  shouldExcludeTag(tagName) {
    const excludedTags = [
      "html",
      "head",
      "body",
      "script",
      "style",
      "meta",
      "link",
      "title",
      "rustlebox",
      "rustlego",
      "autotranslate",
      // Rustle components
      "provider",
      "context",
      "fragment"
      // React internals
    ];
    return excludedTags.includes(tagName.toLowerCase());
  }
  /**
   * Extract tag context from surrounding content
   */
  extractTagContext(content, position) {
    const before = content.substring(Math.max(0, position - 100), position);
    const after = content.substring(position, Math.min(content.length, position + 100));
    const tagMatches = (before + after).match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g) || [];
    const tags = [...new Set(tagMatches.map((tag) => tag.replace(/[</>]/g, "").toLowerCase()))].filter((tag) => !this.shouldExcludeTag(tag));
    return tags.slice(0, 3);
  }
  /**
   * Generate master.json file
   */
  async generateMasterFile() {
    const masterData = {
      metadata: {
        version: "1.0.0",
        sourceLanguage: this.config.sourceLanguage,
        targetLanguages: this.config.targetLanguages,
        lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
        totalEntries: this.extractedEntries.size
      },
      entries: Object.fromEntries(this.extractedEntries)
    };
    const outputPath = path.join(this.config.outputDir, "master.json");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(masterData, null, 2));
    console.log(`📄 Generated master.json with ${this.extractedEntries.size} entries`);
  }
  /**
   * Generate locale files
   */
  async generateLocaleFiles() {
    const localesDir = path.join(this.config.outputDir, "locales");
    fs.mkdirSync(localesDir, { recursive: true });
    const sourceLocaleData = {};
    for (const [fingerprint, entry] of this.extractedEntries) {
      sourceLocaleData[fingerprint] = entry.source;
    }
    const sourceLocalePath = path.join(localesDir, `${this.config.sourceLanguage}.json`);
    fs.writeFileSync(sourceLocalePath, JSON.stringify(sourceLocaleData, null, 2));
    console.log(`📄 Generated ${this.config.sourceLanguage}.json`);
    for (const targetLang of this.config.targetLanguages) {
      console.log(`🌐 Translating content to ${targetLang}...`);
      const targetLocaleData = {};
      const entriesToTranslate = [];
      for (const [fingerprint, entry] of this.extractedEntries) {
        if (entry.translations[targetLang]) {
          targetLocaleData[fingerprint] = entry.translations[targetLang];
        } else {
          entriesToTranslate.push({
            id: fingerprint,
            text: entry.source
          });
        }
      }
      if (entriesToTranslate.length > 0) {
        try {
          console.log(`📝 Translating ${entriesToTranslate.length} entries to ${targetLang}...`);
          const translations = await this.translateBatch(
            entriesToTranslate,
            this.config.sourceLanguage,
            targetLang
          );
          console.log(`✅ Received ${Object.keys(translations).length} translations for ${targetLang}`);
          for (const entry of entriesToTranslate) {
            const rawTranslation = translations[entry.id];
            if (rawTranslation) {
              const cleanTranslation2 = this.cleanTranslation(rawTranslation);
              targetLocaleData[entry.id] = cleanTranslation2;
              const extractedEntry = this.extractedEntries.get(entry.id);
              if (extractedEntry) {
                extractedEntry.translations[targetLang] = cleanTranslation2;
              }
              console.log(`🔄 ${entry.id}: "${entry.text}" → "${cleanTranslation2}"`);
            } else {
              targetLocaleData[entry.id] = entry.text;
              console.log(`⚠️  No translation for ${entry.id}: "${entry.text}"`);
            }
          }
        } catch (error) {
          console.warn(`⚠️  Translation failed for ${targetLang}, using source text as fallback`);
          console.warn(`Error: ${error instanceof Error ? error.message : String(error)}`);
          for (const entry of entriesToTranslate) {
            targetLocaleData[entry.id] = entry.text;
          }
        }
      }
      const targetLocalePath = path.join(localesDir, `${targetLang}.json`);
      fs.writeFileSync(targetLocalePath, JSON.stringify(targetLocaleData, null, 2));
      console.log(`📄 Generated ${targetLang}.json`);
    }
  }
  /**
   * Clean up translation text using shared utility
   */
  cleanTranslation(translation) {
    return cleanTranslation(translation);
  }
  /**
   * Translate a batch of entries using the API
   */
  async translateBatch(entries, sourceLanguage, targetLanguage) {
    const apiUrl = process.env.RUSTLE_API_URL || "https://api.rustle.dev";
    const apiKey = process.env.RUSTLE_API_KEY || "test-api-key-123";
    const response = await fetch(`${apiUrl}/api/translate/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        entries,
        sourceLanguage,
        targetLanguage,
        model: "gpt-3.5-turbo"
      })
    });
    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(`Translation failed: ${result.error || "Unknown error"}`);
    }
    return result.translations;
  }
}
async function runRustleEngine(config) {
  const defaultConfig = {
    sourceLanguage: "en",
    targetLanguages: ["es", "fr", "de", "it", "pt"],
    srcDir: "./src",
    outputDir: "./public/rustle",
    filePatterns: ["**/*.tsx", "**/*.jsx", "**/*.ts", "**/*.js"],
    excludePatterns: ["**/node_modules/**", "**/dist/**", "**/*.test.*", "**/*.spec.*"],
    debug: false
  };
  const finalConfig = { ...defaultConfig, ...config };
  const engine = new RustleEngine(finalConfig);
  try {
    await engine.extract();
  } catch (error) {
    console.error("❌ RustleEngine failed:", error);
    process.exit(1);
  }
}
if (require.main === module) {
  runRustleEngine({
    debug: process.argv.includes("--debug")
  });
}
export {
  runRustleEngine
};
