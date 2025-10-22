'use client';

/**
 * Development Mode File Watcher
 * Monitors for content changes and automatically generates fingerprints
 * and updates locale files in development mode
 */

import { generateContentFingerprint, isTranslatableText } from './fingerprinting';

export interface DevModeConfig {
  enabled: boolean;
  debug: boolean;
  autoExtract: boolean;
  watchInterval: number; // milliseconds
  apiKey: string;
  sourceLanguage: string;
  targetLanguages: string[];
  localeBasePath: string;
}

export interface MissingContent {
  text: string;
  fingerprint: string;
  element: Element;
  timestamp: number;
}

/**
 * Development mode watcher class
 */
export class DevModeWatcher {
  private config: DevModeConfig;
  private observer: MutationObserver | null = null;
  private missingContent: Map<string, MissingContent> = new Map();
  private processingQueue: Set<string> = new Set();
  private lastProcessTime = 0;
  private processTimeout: NodeJS.Timeout | null = null;

  constructor(config: DevModeConfig) {
    this.config = config;
  }

  /**
   * Start watching for content changes
   */
  public start(): void {
    if (!this.config.enabled || typeof window === 'undefined') {
      return;
    }

    if (this.config.debug) {
      console.log('🔧 DevModeWatcher: Starting development mode content monitoring...');
    }

    // Initial scan of existing content
    this.scanExistingContent();

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();

    // Set up periodic processing
    this.setupPeriodicProcessing();
  }

  /**
   * Stop watching
   */
  public stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.processTimeout) {
      clearTimeout(this.processTimeout);
      this.processTimeout = null;
    }

    if (this.config.debug) {
      console.log('🔧 DevModeWatcher: Stopped development mode monitoring');
    }
  }

  /**
   * Scan existing content for missing fingerprints
   */
  private scanExistingContent(): void {
    const textNodes = this.findTextNodes(document.body);
    
    for (const node of textNodes) {
      const text = node.textContent?.trim();
      if (text && isTranslatableText(text)) {
        const element = node.parentElement;
        if (element && !element.hasAttribute('data-i18n-fingerprint')) {
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
  private setupMutationObserver(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          // Check added nodes
          for (const node of Array.from(mutation.addedNodes)) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanElement(node as Element);
            } else if (node.nodeType === Node.TEXT_NODE) {
              this.checkTextNode(node as Text);
            }
          }
        } else if (mutation.type === 'characterData') {
          // Text content changed
          this.checkTextNode(mutation.target as Text);
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
  private setupPeriodicProcessing(): void {
    const processInterval = Math.max(this.config.watchInterval, 1000); // Minimum 1 second

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
  private findTextNodes(element: Element): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }

  /**
   * Scan an element for missing fingerprints
   */
  private scanElement(element: Element): void {
    const textNodes = this.findTextNodes(element);
    
    for (const node of textNodes) {
      this.checkTextNode(node);
    }
  }

  /**
   * Check a text node for missing fingerprint
   */
  private checkTextNode(textNode: Text): void {
    const text = textNode.textContent?.trim();
    if (!text || !isTranslatableText(text)) {
      return;
    }

    const element = textNode.parentElement;
    if (element && !element.hasAttribute('data-i18n-fingerprint')) {
      this.addMissingContent(text, element);
    }
  }

  /**
   * Add content to missing content queue
   */
  private addMissingContent(text: string, element: Element): void {
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
  private async processMissingContent(): Promise<void> {
    if (this.missingContent.size === 0) {
      return;
    }

    const now = Date.now();
    const minProcessInterval = 5000; // Minimum 5 seconds between processing

    if (now - this.lastProcessTime < minProcessInterval) {
      return;
    }

    this.lastProcessTime = now;

    if (this.config.debug) {
      console.log(`🔧 DevModeWatcher: Processing ${this.missingContent.size} missing content items...`);
    }

    // Group content by text to avoid duplicates
    const contentToProcess = Array.from(this.missingContent.values());
    
    // Add fingerprints to elements immediately
    for (const item of contentToProcess) {
      if (item.element.isConnected) {
        item.element.setAttribute('data-i18n-fingerprint', item.fingerprint);
        
        if (this.config.debug) {
          console.log(`🔧 DevModeWatcher: Added fingerprint to element: ${item.fingerprint}`);
        }
      }
    }

    // In a real implementation, this would trigger file updates
    // For now, we'll just log what would be updated
    if (this.config.autoExtract && contentToProcess.length > 0) {
      this.simulateFileUpdates(contentToProcess);
    }

    // Clear processed content
    this.missingContent.clear();
  }

  /**
   * Simulate file updates (in real implementation, this would update actual files)
   */
  private simulateFileUpdates(content: MissingContent[]): void {
    if (this.config.debug) {
      console.log('🔧 DevModeWatcher: Would update files with new content:');
      
      const masterEntries = content.map(item => ({
        fingerprint: item.fingerprint,
        source: item.text,
        status: 'new'
      }));

      console.log('📄 master.json updates:', masterEntries);

      for (const locale of this.config.targetLanguages) {
        const localeEntries = content.reduce((acc, item) => {
          acc[item.fingerprint] = `[${locale.toUpperCase()}] ${item.text}`;
          return acc;
        }, {} as Record<string, string>);

        console.log(`📄 ${locale}.json updates:`, localeEntries);
      }
    }
  }

  /**
   * Get current statistics
   */
  public getStats() {
    return {
      missingContentCount: this.missingContent.size,
      isActive: this.observer !== null,
      lastProcessTime: this.lastProcessTime
    };
  }
}

/**
 * Global dev mode watcher instance
 */
let globalWatcher: DevModeWatcher | null = null;

/**
 * Initialize development mode watcher
 */
export function initDevModeWatcher(config: DevModeConfig): DevModeWatcher {
  if (globalWatcher) {
    globalWatcher.stop();
  }

  globalWatcher = new DevModeWatcher(config);
  globalWatcher.start();

  return globalWatcher;
}

/**
 * Get current dev mode watcher
 */
export function getDevModeWatcher(): DevModeWatcher | null {
  return globalWatcher;
}

/**
 * Stop development mode watcher
 */
export function stopDevModeWatcher(): void {
  if (globalWatcher) {
    globalWatcher.stop();
    globalWatcher = null;
  }
}
