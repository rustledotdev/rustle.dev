'use client';

/**
 * Security utilities for Rustle.dev SDK
 * Handles API key validation, input sanitization, and security checks
 */

/**
 * Validate API key format and security
 */
export function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || typeof apiKey !== 'string') {
    return { valid: false, error: 'API key is required' };
  }

  if (apiKey.trim() === '') {
    return { valid: false, error: 'API key cannot be empty' };
  }

  if (apiKey.length < 10) {
    return { valid: false, error: 'API key too short (minimum 10 characters)' };
  }

  if (apiKey.length > 200) {
    return { valid: false, error: 'API key too long (maximum 200 characters)' };
  }

  // Check for suspicious patterns
  if (apiKey.includes(' ') || apiKey.includes('\n') || apiKey.includes('\t')) {
    return { valid: false, error: 'API key contains invalid characters' };
  }

  // Warn about test keys in production
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    const testKeyPatterns = ['test', 'demo', 'mock', 'example', 'dev'];
    const lowerKey = apiKey.toLowerCase();
    
    for (const pattern of testKeyPatterns) {
      if (lowerKey.includes(pattern)) {
        console.warn('⚠️ Rustle Security Warning: Using test API key in production');
        break;
      }
    }
  }

  return { valid: true };
}

/**
 * Check if we're in a secure context for API operations
 */
export function isSecureContext(): boolean {
  if (typeof window === 'undefined') {
    // Server-side is considered secure
    return true;
  }

  // Check if we're in HTTPS or localhost
  return window.location.protocol === 'https:' || 
         window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Sanitize text input to prevent injection attacks
 */
export function sanitizeTextInput(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  // Limit input length to prevent DoS
  if (input.length > 10000) {
    throw new Error('Input text too long (max 10000 characters)');
  }

  // Remove null bytes and control characters (except newlines and tabs)
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate locale string format
 */
export function validateLocale(locale: string): { valid: boolean; error?: string } {
  if (!locale || typeof locale !== 'string') {
    return { valid: false, error: 'Locale is required' };
  }

  // Basic locale format validation (e.g., 'en', 'en-US', 'zh-CN')
  const localePattern = /^[a-z]{2}(-[A-Z]{2})?$/;
  if (!localePattern.test(locale)) {
    return { valid: false, error: 'Invalid locale format (expected: en, en-US, etc.)' };
  }

  return { valid: true };
}

/**
 * Rate limiting for API calls (simple in-memory implementation)
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];
    const validRequests = requests.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

/**
 * Security headers for API requests (client-side only)
 */
export function getSecurityHeaders(): Record<string, string> {
  // Only include headers that are safe to send from client
  // Security headers like CSP should be set by the server, not the client
  return {};
}

/**
 * Obfuscate API key for logging (show only first and last 4 characters)
 */
export function obfuscateApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return '****';
  }
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  const middle = '*'.repeat(Math.max(0, apiKey.length - 8));
  
  return `${start}${middle}${end}`;
}

/**
 * Check for potential security issues in configuration
 */
export function validateSecurityConfig(config: any): string[] {
  const warnings: string[] = [];

  // Check for debug mode in production
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production' && config.debug) {
    warnings.push('Debug mode is enabled in production - this may expose sensitive information');
  }

  // Check for insecure API URL in production
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (config.apiUrl && config.apiUrl.startsWith('http://')) {
      warnings.push('Using insecure HTTP API URL in production - use HTTPS instead');
    }
  }

  // Check for weak API key patterns
  if (config.apiKey) {
    const validation = validateApiKey(config.apiKey);
    if (!validation.valid) {
      warnings.push(`API key validation failed: ${validation.error}`);
    }
  }

  return warnings;
}

/**
 * Generate a secure request ID for tracking
 */
export function generateSecureRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

/**
 * Validate URL to prevent SSRF attacks
 */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    // Block private IP ranges in production
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      const hostname = parsed.hostname;
      
      // Block localhost and private IPs
      if (hostname === 'localhost' || 
          hostname === '127.0.0.1' ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.startsWith('172.')) {
        return { valid: false, error: 'Private IP addresses not allowed in production' };
      }
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
}
