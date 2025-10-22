'use client';

import { debouncePromise } from './performance';

export interface BatchItem<T = any> {
  id: string;
  data: T;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  sectionId?: string;
  pageId?: string;
}

export interface BatchConfig {
  maxSize: number;
  maxWait: number;
  sectionBased: boolean;
  pageBased: boolean;
  strategy: 'immediate' | 'delayed' | 'adaptive';
}

export interface BatchProcessor<T, R> {
  (items: T[]): Promise<R[]>;
}

/**
 * Smart batch collector that groups requests by time window, size, and section/page
 */
export class BatchCollector<T = any, R = any> {
  private batches = new Map<string, BatchItem<T>[]>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  private config: BatchConfig;
  private processor: BatchProcessor<T, R>;

  constructor(
    processor: BatchProcessor<T, R>,
    config: Partial<BatchConfig> = {}
  ) {
    this.processor = processor;
    this.config = {
      maxSize: 10,
      maxWait: 200,
      sectionBased: true,
      pageBased: false,
      strategy: 'adaptive',
      ...config
    };
  }

  /**
   * Add item to batch queue
   */
  add(
    id: string,
    data: T,
    options: {
      sectionId?: string;
      pageId?: string;
    } = {}
  ): Promise<R> {
    return new Promise((resolve, reject) => {
      const batchKey = this.getBatchKey(options);
      const item: BatchItem<T> = {
        id,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
        sectionId: options.sectionId,
        pageId: options.pageId
      };

      // Get or create batch for this key
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      const batch = this.batches.get(batchKey)!;
      batch.push(item);

      // Clear existing timeout for this batch
      const existingTimeout = this.timeouts.get(batchKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Check if we should process immediately
      if (this.shouldProcessImmediately(batch)) {
        this.processBatch(batchKey);
      } else {
        // Set new timeout
        const delay = this.getDelay(batch);
        const timeout = setTimeout(() => {
          this.processBatch(batchKey);
        }, delay);
        
        this.timeouts.set(batchKey, timeout);
      }
    });
  }

  /**
   * Get batch key based on configuration
   */
  private getBatchKey(options: { sectionId?: string; pageId?: string }): string {
    if (this.config.sectionBased && options.sectionId) {
      return `section:${options.sectionId}`;
    }
    
    if (this.config.pageBased && options.pageId) {
      return `page:${options.pageId}`;
    }
    
    return 'global';
  }

  /**
   * Determine if batch should be processed immediately
   */
  private shouldProcessImmediately(batch: BatchItem<T>[]): boolean {
    switch (this.config.strategy) {
      case 'immediate':
        return true;
      
      case 'delayed':
        return batch.length >= this.config.maxSize;
      
      case 'adaptive':
        // Process immediately if batch is full or if items are getting old
        const oldestItem = Math.min(...batch.map(item => item.timestamp));
        const age = Date.now() - oldestItem;
        return batch.length >= this.config.maxSize || age >= this.config.maxWait;
      
      default:
        return false;
    }
  }

  /**
   * Get delay for batch processing
   */
  private getDelay(batch: BatchItem<T>[]): number {
    switch (this.config.strategy) {
      case 'immediate':
        return 0;
      
      case 'delayed':
        return this.config.maxWait;
      
      case 'adaptive':
        // Adaptive delay based on batch size and network conditions
        const sizeRatio = batch.length / this.config.maxSize;
        const baseDelay = this.config.maxWait;
        
        // Reduce delay as batch fills up
        return Math.max(50, baseDelay * (1 - sizeRatio * 0.8));
      
      default:
        return this.config.maxWait;
    }
  }

  /**
   * Process a batch
   */
  private async processBatch(batchKey: string): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch || batch.length === 0) return;

    // Remove batch from queue
    this.batches.delete(batchKey);
    
    // Clear timeout
    const timeout = this.timeouts.get(batchKey);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(batchKey);
    }

    try {
      // Extract data for processing
      const dataItems = batch.map(item => item.data);
      
      // Process the batch
      const results = await this.processor(dataItems);
      
      // Resolve all promises
      batch.forEach((item, index) => {
        const result = results[index];
        if (result !== undefined) {
          item.resolve(result);
        } else {
          item.reject(new Error(`No result for item ${item.id}`));
        }
      });
      
    } catch (error) {
      // Reject all promises on error
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  /**
   * Cancel all pending batches
   */
  cancelAll(): void {
    // Clear all timeouts
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout);
    }
    this.timeouts.clear();

    // Reject all pending items
    for (const batch of this.batches.values()) {
      batch.forEach(item => {
        item.reject(new Error('Batch cancelled'));
      });
    }
    this.batches.clear();
  }

  /**
   * Get current batch statistics
   */
  getStats(): {
    totalBatches: number;
    totalItems: number;
    batchSizes: number[];
    oldestItemAge: number;
  } {
    const batchSizes = Array.from(this.batches.values()).map(batch => batch.length);
    const allItems = Array.from(this.batches.values()).flat();
    const oldestTimestamp = allItems.length > 0 
      ? Math.min(...allItems.map(item => item.timestamp))
      : Date.now();

    return {
      totalBatches: this.batches.size,
      totalItems: allItems.length,
      batchSizes,
      oldestItemAge: Date.now() - oldestTimestamp
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

/**
 * Create a debounced batch collector
 */
export function createDebouncedBatchCollector<T, R>(
  processor: BatchProcessor<T, R>,
  wait: number,
  config: Partial<BatchConfig> = {}
): BatchCollector<T, R> {
  // Create a wrapper that returns the correct type
  const wrappedProcessor: BatchProcessor<T, R> = async (items: T[]): Promise<R[]> => {
    const debouncedFn = debouncePromise(async (data: T[]) => processor(data), wait);
    return await debouncedFn(items);
  };

  return new BatchCollector(wrappedProcessor, config);
}
