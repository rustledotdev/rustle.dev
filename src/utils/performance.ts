'use client';

/**
 * Performance optimization utilities for Rustle SDK
 */

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Advanced debounce function with leading/trailing edge options
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = false, trailing = true, maxWait } = options;
  let timeout: NodeJS.Timeout | null = null;
  let maxTimeout: NodeJS.Timeout | null = null;
  let lastCallTime: number | null = null;
  let lastInvokeTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const isInvoking = lastCallTime === null;

    lastCallTime = now;

    if (timeout) clearTimeout(timeout);
    if (maxTimeout) clearTimeout(maxTimeout);

    if (leading && isInvoking) {
      lastInvokeTime = now;
      func(...args);
      return;
    }

    if (trailing) {
      timeout = setTimeout(() => {
        lastInvokeTime = Date.now();
        func(...args);
        lastCallTime = null;
      }, wait);
    }

    if (maxWait && !maxTimeout) {
      maxTimeout = setTimeout(() => {
        if (lastCallTime && now - lastInvokeTime >= maxWait) {
          lastInvokeTime = Date.now();
          func(...args);
          lastCallTime = null;
        }
      }, maxWait);
    }
  };
}

/**
 * Advanced throttle function with leading/trailing edge options
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
  options: ThrottleOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = true } = options;
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (!inThrottle) {
      if (leading) {
        func(...args);
      }
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
        if (trailing && lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    }
  };
}

/**
 * Debounce for async functions with promise support
 */
export function debouncePromise<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  let resolvers: Array<{ resolve: (value: any) => void; reject: (error: any) => void }> = [];

  return (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return new Promise((resolve, reject) => {
      resolvers.push({ resolve, reject });

      if (timeout) clearTimeout(timeout);

      timeout = setTimeout(async () => {
        const currentResolvers = [...resolvers];
        resolvers = [];

        try {
          const result = await func(...args);
          currentResolvers.forEach(({ resolve }) => resolve(result));
        } catch (error) {
          currentResolvers.forEach(({ reject }) => reject(error));
        }
      }, wait);
    });
  };
}

/**
 * Memoization utility for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  maxSize: number = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    
    // Implement LRU cache
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      if (firstKey !== undefined) {
        cache.delete(firstKey);
      }
    }
    
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * Intersection Observer for lazy loading
 */
export class LazyObserver {
  private observer: IntersectionObserver | null = null;
  private callbacks = new Map<Element, () => void>();

  constructor(options?: IntersectionObserverInit) {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target);
            if (callback) {
              callback();
              this.unobserve(entry.target);
            }
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options
      });
    }
  }

  observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      // Fallback: execute immediately if IntersectionObserver not supported
      callback();
      return;
    }

    this.callbacks.set(element, callback);
    this.observer.observe(element);
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.callbacks.delete(element);
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.callbacks.clear();
  }
}

/**
 * Request idle callback polyfill
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, options?.timeout || 1) as any;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch DOM operations for better performance
 */
export class DOMBatcher {
  private operations: (() => void)[] = [];
  private scheduled = false;

  add(operation: () => void): void {
    this.operations.push(operation);
    this.schedule();
  }

  private schedule(): void {
    if (this.scheduled) return;
    
    this.scheduled = true;
    requestIdleCallback(() => {
      this.flush();
    });
  }

  private flush(): void {
    const ops = this.operations.splice(0);
    
    // Use document fragment for multiple DOM operations
    if (ops.length > 1) {
      const fragment = document.createDocumentFragment();
      ops.forEach(op => op());
    } else if (ops.length === 1 && ops[0]) {
      ops[0]();
    }
    
    this.scheduled = false;
  }

  clear(): void {
    this.operations = [];
    this.scheduled = false;
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private maxMemoryUsage = 0;
  private checkInterval: NodeJS.Timeout | null = null;

  start(intervalMs: number = 5000): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      this.checkMemory();
    }, intervalMs);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private checkMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const currentUsage = memory.usedJSHeapSize;
      
      if (currentUsage > this.maxMemoryUsage) {
        this.maxMemoryUsage = currentUsage;
      }

      // Warn if memory usage is high
      if (currentUsage > 50 * 1024 * 1024) { // 50MB
        console.warn('Rustle: High memory usage detected:', {
          current: `${(currentUsage / 1024 / 1024).toFixed(2)}MB`,
          max: `${(this.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
        });
      }
    }
  }

  getStats(): { current: number; max: number; limit: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        current: memory.usedJSHeapSize,
        max: this.maxMemoryUsage,
        limit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }
}

/**
 * Performance metrics collector
 */
export class PerformanceCollector {
  private metrics = new Map<string, number[]>();

  mark(name: string): void {
    if ('performance' in window && performance.mark) {
      performance.mark(name);
    }
  }

  measure(name: string, startMark: string, endMark?: string): number {
    if ('performance' in window && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const entries = performance.getEntriesByName(name, 'measure');
        const duration = entries[entries.length - 1]?.duration || 0;
        
        this.addMetric(name, duration);
        return duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
      }
    }
    return 0;
  }

  private addMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift();
    }
  }

  getMetrics(name: string): { avg: number; min: number; max: number; count: number } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    return {
      avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        result[name] = metrics;
      }
    }
    
    return result;
  }

  clear(): void {
    this.metrics.clear();
    if ('performance' in window && performance.clearMarks) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Global performance utilities
 */
export const performanceUtils = {
  lazyObserver: new LazyObserver(),
  domBatcher: new DOMBatcher(),
  memoryMonitor: new MemoryMonitor(),
  performanceCollector: new PerformanceCollector(),

  /**
   * Initialize performance monitoring
   */
  init(options?: {
    enableMemoryMonitoring?: boolean;
    memoryCheckInterval?: number;
  }): void {
    if (options?.enableMemoryMonitoring) {
      this.memoryMonitor.start(options.memoryCheckInterval);
    }
  },

  /**
   * Cleanup all performance utilities
   */
  cleanup(): void {
    this.lazyObserver.disconnect();
    this.domBatcher.clear();
    this.memoryMonitor.stop();
    this.performanceCollector.clear();
  }
};
