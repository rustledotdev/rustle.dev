#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as glob from 'glob';
import { generateContentFingerprint, generateContentHash, isTranslatableText } from '../utils/fingerprinting';
import { cleanTranslation } from '../utils/translationCleaner';

/**
 * RustleEngine CLI - Automatic extraction and file generation
 * Scans JSX/TSX files, extracts translatable content, generates fingerprints,
 * and creates master.json and locale files automatically
 */

interface ExtractedEntry {
  fingerprint: string;
  source: string;
  file: string;
  loc: { start: number; end: number };
  contentHash: string;
  version: number;
  translations: Record<string, string>;
  lastTranslatedAt: string;
  tags: string[];
  status: 'new' | 'translated' | 'updated' | 'missing';
}

interface MasterData {
  metadata: {
    version: string;
    sourceLanguage: string;
    targetLanguages: string[];
    lastUpdated: string;
    totalEntries: number;
  };
  entries: Record<string, ExtractedEntry>;
}

interface RustleEngineConfig {
  sourceLanguage: string;
  targetLanguages: string[];
  srcDir: string;
  outputDir: string;
  filePatterns: string[];
  excludePatterns: string[];
  debug: boolean;
}

class RustleEngine {
  private config: RustleEngineConfig;
  private extractedEntries: Map<string, ExtractedEntry> = new Map();
  private existingMaster: MasterData | null = null;

  constructor(config: RustleEngineConfig) {
    this.config = config;
  }

  /**
   * Main extraction process
   */
  public async extract(): Promise<void> {
    console.log('🚀 RustleEngine: Starting extraction...');

    // Load existing master.json if it exists
    await this.loadExistingMaster();

    // Find all source files
    const files = await this.findSourceFiles();
    console.log(`📁 Found ${files.length} source files to process`);

    // Extract translatable content from each file
    for (const file of files) {
      await this.extractFromFile(file);
    }

    // Generate master.json
    await this.generateMasterFile();

    // Generate locale files
    await this.generateLocaleFiles();

    console.log('✅ RustleEngine: Extraction completed successfully!');
  }

  /**
   * Load existing master.json file
   */
  private async loadExistingMaster(): Promise<void> {
    const masterPath = path.join(this.config.outputDir, 'master.json');
    
    if (fs.existsSync(masterPath)) {
      try {
        const content = fs.readFileSync(masterPath, 'utf-8');
        this.existingMaster = JSON.parse(content);
        console.log(`📖 Loaded existing master.json with ${Object.keys(this.existingMaster?.entries || {}).length} entries`);
      } catch (error) {
        console.warn('⚠️ Failed to load existing master.json:', error);
      }
    }
  }

  /**
   * Find all source files to process
   */
  private async findSourceFiles(): Promise<string[]> {
    const patterns = this.config.filePatterns.map(pattern =>
      path.join(this.config.srcDir, pattern)
    );

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await new Promise<string[]>((resolve, reject) => {
        glob.glob(pattern, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      files.push(...matches);
    }

    // Filter out excluded patterns
    const filteredFiles = files.filter(file => {
      return !this.config.excludePatterns.some(excludePattern => {
        return file.includes(excludePattern.replace('**/', '').replace('/**', ''));
      });
    });

    return [...new Set(filteredFiles)]; // Remove duplicates
  }

  /**
   * Extract translatable content from a single file
   */
  private async extractFromFile(filePath: string): Promise<void> {
    if (this.config.debug) {
      console.log(`🔍 Processing: ${filePath}`);
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativeFilePath = path.relative(this.config.srcDir, filePath);

      // Simple regex-based extraction for MVP
      // In production, this would use a proper AST parser (Babel/SWC)
      this.extractWithRegex(content, relativeFilePath);

    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error);
    }
  }

  /**
   * Extract translatable content using regex (MVP approach)
   * In production, this would use proper AST parsing
   */
  private extractWithRegex(content: string, filePath: string): void {
    // Patterns to match translatable content
    const patterns = [
      // JSX text content: <h1>Hello World</h1>
      /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>([^<]+)<\/\1>/g,
      // JSX self-closing with text attributes: <img alt="Hello" />
      /<[a-zA-Z][a-zA-Z0-9]*[^>]*\s(alt|title|placeholder|aria-label)=["']([^"']+)["'][^>]*\/?>/g,
      // String literals in JSX: {"Hello World"}
      /\{["']([^"']+)["']\}/g,
    ];

    patterns.forEach((pattern, patternIndex) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[2] || match[1]; // Get the captured text

        if (text && isTranslatableText(text)) {
          const position = match.index;
          const fingerprint = generateContentFingerprint(text);
          const contentHash = generateContentHash(text);

          // Determine tag context
          const tags = this.extractTagContext(content, position);

          const entry: ExtractedEntry = {
            fingerprint,
            source: text.trim(),
            file: filePath,
            loc: { start: position, end: position + match[0].length },
            contentHash,
            version: 1,
            translations: {},
            lastTranslatedAt: new Date().toISOString(),
            tags,
            status: 'new'
          };

          // Check if this entry already exists
          const existingEntry = this.existingMaster?.entries[fingerprint];
          if (existingEntry) {
            if (existingEntry.contentHash !== contentHash) {
              // Content changed, increment version
              entry.version = existingEntry.version + 1;
              entry.status = 'updated';
              entry.translations = existingEntry.translations; // Keep existing translations
            } else {
              // Content unchanged, keep existing data
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
  private shouldExcludeTag(tagName: string): boolean {
    const excludedTags = [
      'html', 'head', 'body', 'script', 'style', 'meta', 'link', 'title',
      'rustlebox', 'rustlego', 'autotranslate', // Rustle components
      'provider', 'context', 'fragment' // React internals
    ];

    return excludedTags.includes(tagName.toLowerCase());
  }

  /**
   * Extract tag context from surrounding content
   */
  private extractTagContext(content: string, position: number): string[] {
    // Simple approach: look for HTML tags around the position
    const before = content.substring(Math.max(0, position - 100), position);
    const after = content.substring(position, Math.min(content.length, position + 100));

    const tagMatches = (before + after).match(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g) || [];
    const tags = [...new Set(tagMatches.map(tag => tag.replace(/[</>]/g, '').toLowerCase()))]
      .filter(tag => !this.shouldExcludeTag(tag)); // Filter out excluded tags

    return tags.slice(0, 3); // Limit to 3 tags
  }

  /**
   * Generate master.json file
   */
  private async generateMasterFile(): Promise<void> {
    const masterData: MasterData = {
      metadata: {
        version: '1.0.0',
        sourceLanguage: this.config.sourceLanguage,
        targetLanguages: this.config.targetLanguages,
        lastUpdated: new Date().toISOString(),
        totalEntries: this.extractedEntries.size
      },
      entries: Object.fromEntries(this.extractedEntries)
    };

    const outputPath = path.join(this.config.outputDir, 'master.json');
    
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    fs.writeFileSync(outputPath, JSON.stringify(masterData, null, 2));
    console.log(`📄 Generated master.json with ${this.extractedEntries.size} entries`);
  }

  /**
   * Generate locale files
   */
  private async generateLocaleFiles(): Promise<void> {
    const localesDir = path.join(this.config.outputDir, 'locales');
    fs.mkdirSync(localesDir, { recursive: true });

    // Generate source language file
    const sourceLocaleData: Record<string, string> = {};
    for (const [fingerprint, entry] of this.extractedEntries) {
      sourceLocaleData[fingerprint] = entry.source;
    }

    const sourceLocalePath = path.join(localesDir, `${this.config.sourceLanguage}.json`);
    fs.writeFileSync(sourceLocalePath, JSON.stringify(sourceLocaleData, null, 2));
    console.log(`📄 Generated ${this.config.sourceLanguage}.json`);

    // Generate target language files with translations
    for (const targetLang of this.config.targetLanguages) {
      console.log(`🌐 Translating content to ${targetLang}...`);

      const targetLocaleData: Record<string, string> = {};

      // Prepare entries for batch translation
      const entriesToTranslate: Array<{ id: string; text: string }> = [];
      for (const [fingerprint, entry] of this.extractedEntries) {
        // Skip if translation already exists
        if (entry.translations[targetLang]) {
          targetLocaleData[fingerprint] = entry.translations[targetLang];
        } else {
          // Add to batch for translation
          entriesToTranslate.push({
            id: fingerprint,
            text: entry.source
          });
        }
      }

      // Translate missing entries in batch
      if (entriesToTranslate.length > 0) {
        try {
          console.log(`📝 Translating ${entriesToTranslate.length} entries to ${targetLang}...`);
          const translations = await this.translateBatch(
            entriesToTranslate,
            this.config.sourceLanguage,
            targetLang
          );

          console.log(`✅ Received ${Object.keys(translations).length} translations for ${targetLang}`);

          // Apply translations
          for (const entry of entriesToTranslate) {
            const rawTranslation = translations[entry.id];
            if (rawTranslation) {
              // Clean up the translation (remove extra quotes, normalize whitespace)
              const cleanTranslation = this.cleanTranslation(rawTranslation);

              targetLocaleData[entry.id] = cleanTranslation;
              // Update the extracted entry with the translation
              const extractedEntry = this.extractedEntries.get(entry.id);
              if (extractedEntry) {
                extractedEntry.translations[targetLang] = cleanTranslation;
              }
              console.log(`🔄 ${entry.id}: "${entry.text}" → "${cleanTranslation}"`);
            } else {
              // Fallback to source text
              targetLocaleData[entry.id] = entry.text;
              console.log(`⚠️  No translation for ${entry.id}: "${entry.text}"`);
            }
          }
        } catch (error) {
          console.warn(`⚠️  Translation failed for ${targetLang}, using source text as fallback`);
          console.warn(`Error: ${error instanceof Error ? error.message : String(error)}`);

          // Fallback to source text for failed translations
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
  private cleanTranslation(translation: string): string {
    return cleanTranslation(translation);
  }

  /**
   * Translate a batch of entries using the API
   */
  private async translateBatch(
    entries: Array<{ id: string; text: string }>,
    sourceLanguage: string,
    targetLanguage: string
  ): Promise<Record<string, string>> {
    const apiUrl = process.env.RUSTLE_API_URL || 'https://api.rustle.dev';
    const apiKey = process.env.RUSTLE_API_KEY || 'test-api-key-123';

    const response = await fetch(`${apiUrl}/api/translate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        entries,
        sourceLanguage,
        targetLanguage,
        model: 'gpt-3.5-turbo',
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Translation failed: ${result.error || 'Unknown error'}`);
    }

    return result.translations;
  }
}

/**
 * CLI Entry Point
 */
export async function runRustleEngine(config?: Partial<RustleEngineConfig>): Promise<void> {
  const defaultConfig: RustleEngineConfig = {
    sourceLanguage: 'en',
    targetLanguages: ['es', 'fr', 'de', 'it', 'pt'],
    srcDir: './src',
    outputDir: './public/rustle',
    filePatterns: ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js'],
    excludePatterns: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
    debug: false
  };

  const finalConfig = { ...defaultConfig, ...config };
  const engine = new RustleEngine(finalConfig);
  
  try {
    await engine.extract();
  } catch (error) {
    console.error('❌ RustleEngine failed:', error);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  runRustleEngine({
    debug: process.argv.includes('--debug')
  });
}
