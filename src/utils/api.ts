import type {
  TranslationRequest,
  TranslationResponse,
  AIModel,
  Locale
} from '../types';
import {
  validateApiKey,
  validateUrl,
  isSecureContext,
  globalRateLimiter,
  obfuscateApiKey,
  generateSecureRequestId,
  getSecurityHeaders,
  sanitizeTextInput,
  validateLocale
} from './security';
import { cleanTranslation, cleanBatchTranslations } from './translationCleaner';

export class RustleAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public isQuotaExceeded?: boolean,
    public quotaDetails?: {
      limit?: number;
      used?: number;
      resetDate?: string;
    }
  ) {
    super(message);
    this.name = 'RustleAPIError';
  }
}

/**
 * Enhanced error notification system for quota and API issues
 */
export class RustleNotificationSystem {
  private static instance: RustleNotificationSystem;
  private notificationHistory: Set<string> = new Set();
  private isCI: boolean;

  private constructor() {
    // Detect CI environment
    this.isCI = typeof process !== 'undefined' && (
      !!process.env.CI ||
      !!process.env.GITHUB_ACTIONS ||
      !!process.env.GITLAB_CI ||
      !!process.env.JENKINS_URL ||
      !!process.env.TRAVIS ||
      !!process.env.CIRCLECI ||
      !!process.env.BUILDKITE ||
      !!process.env.DRONE
    );
  }

  static getInstance(): RustleNotificationSystem {
    if (!RustleNotificationSystem.instance) {
      RustleNotificationSystem.instance = new RustleNotificationSystem();
    }
    return RustleNotificationSystem.instance;
  }

  /**
   * Show quota exceeded notification
   */
  notifyQuotaExceeded(error: RustleAPIError): void {
    const notificationKey = `quota-exceeded-${error.quotaDetails?.limit || 'unknown'}`;

    // Avoid duplicate notifications
    if (this.notificationHistory.has(notificationKey)) {
      return;
    }
    this.notificationHistory.add(notificationKey);

    const message = this.formatQuotaMessage(error);

    if (this.isCI) {
      // CI/CD environment - use GitHub Actions annotations or standard error output
      this.logCIError(message, error);
    } else {
      // Development environment - use console with styling
      this.logDevelopmentError(message, error);
    }
  }

  /**
   * Show general API error notification
   */
  notifyAPIError(error: RustleAPIError, context?: string): void {
    const notificationKey = `api-error-${error.code || error.status}-${context || 'general'}`;

    // Avoid duplicate notifications for the same error type
    if (this.notificationHistory.has(notificationKey)) {
      return;
    }
    this.notificationHistory.add(notificationKey);

    const message = this.formatAPIErrorMessage(error, context);

    if (this.isCI) {
      this.logCIError(message, error);
    } else {
      this.logDevelopmentError(message, error);
    }
  }

  private formatQuotaMessage(error: RustleAPIError): string {
    const details = error.quotaDetails;
    let message = '🚨 RUSTLE.DEV QUOTA EXCEEDED 🚨\n\n';

    if (details) {
      message += `• Quota Limit: ${details.limit || 'Unknown'}\n`;
      message += `• Used: ${details.used || 'Unknown'}\n`;
      if (details.resetDate) {
        message += `• Resets: ${details.resetDate}\n`;
      }
    }

    message += '\n📋 NEXT STEPS:\n';
    message += '1. Check your usage at https://rustle.dev/dashboard\n';
    message += '2. Upgrade your plan at https://rustle.dev/pricing\n';
    message += '3. Contact support at support@rustle.dev\n';
    message += '\n📖 Documentation: https://rustle.dev/docs/quota';

    return message;
  }

  private formatAPIErrorMessage(error: RustleAPIError, context?: string): string {
    let message = '⚠️ RUSTLE.DEV API ERROR ⚠️\n\n';

    if (context) {
      message += `Context: ${context}\n`;
    }

    message += `Error: ${error.message}\n`;

    if (error.code) {
      message += `Code: ${error.code}\n`;
    }

    if (error.status) {
      message += `Status: ${error.status}\n`;
    }

    message += '\n📋 TROUBLESHOOTING:\n';
    message += '1. Check your API key at https://rustle.dev/dashboard\n';
    message += '2. Verify your network connection\n';
    message += '3. Check service status at https://rustle.dev/status\n';
    message += '4. Contact support at support@rustle.dev\n';
    message += '\n📖 Documentation: https://rustle.dev/docs/troubleshooting';

    return message;
  }

  private logCIError(message: string, error: RustleAPIError): void {
    // GitHub Actions annotation format
    if (process.env.GITHUB_ACTIONS) {
      console.log(`::error title=Rustle.dev API Error::${message.replace(/\n/g, '%0A')}`);
    }

    // Standard error output for all CI systems
    console.error('\n' + '='.repeat(80));
    console.error(message);
    console.error('='.repeat(80) + '\n');

    // Set exit code for CI failure (if quota exceeded)
    if (error.isQuotaExceeded && typeof process !== 'undefined') {
      process.exitCode = 1;
    }
  }

  private logDevelopmentError(message: string, error: RustleAPIError): void {
    // Styled console output for development
    console.group('%c🚨 Rustle.dev Notification', 'color: #ff4444; font-weight: bold; font-size: 14px;');
    console.log('%c' + message, 'color: #333; line-height: 1.5;');

    if (error.isQuotaExceeded) {
      console.log('%c💡 TIP: Set up quota alerts at https://rustle.dev/dashboard/alerts', 'color: #0066cc; font-style: italic;');
    }

    console.groupEnd();

    // Also show browser notification if available
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.showBrowserNotification(error);
    }
  }

  private showBrowserNotification(error: RustleAPIError): void {
    if (Notification.permission === 'granted') {
      new Notification('Rustle.dev API Issue', {
        body: error.isQuotaExceeded ? 'Quota exceeded - check your dashboard' : 'API error occurred',
        icon: 'https://rustle.dev/favicon.ico'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showBrowserNotification(error);
        }
      });
    }
  }

  /**
   * Clear notification history (useful for testing)
   */
  clearHistory(): void {
    this.notificationHistory.clear();
  }
}

export interface APIClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

/**
 * Get the API base URL from environment variables or runtime config
 */
function getAPIBaseUrl(): string {
  // Default production API URL
  const DEFAULT_API_URL = 'https://api.rustle.dev/v1';
  const DEFAULT_DEV_API_URL = 'https://api.rustle.dev/api';

  // Check if we're in development mode
  const isDevelopment = typeof process !== 'undefined' &&
    (process.env.NODE_ENV === 'development' ||
     (typeof window !== 'undefined' && window.location.hostname === 'localhost'));

  // Check environment variables (for Node.js/SSR)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.RUSTLE_API_URL) {
      return process.env.RUSTLE_API_URL;
    }
    if (process.env.NEXT_PUBLIC_RUSTLE_API_URL) {
      return process.env.NEXT_PUBLIC_RUSTLE_API_URL;
    }
  }

  // Check window object for runtime config (client-side)
  if (typeof window !== 'undefined') {
    const globalConfig = (window as any).__RUSTLE_CONFIG__;
    if (globalConfig?.apiUrl) {
      return globalConfig.apiUrl;
    }
  }

  // Return appropriate default based on environment
  return isDevelopment ? DEFAULT_DEV_API_URL : DEFAULT_API_URL;
}

export class APIClient {
  private config: APIClientConfig;
  private activeRequests: Map<string, AbortController> = new Map();
  private notificationSystem: RustleNotificationSystem;

  constructor(config: APIClientConfig) {
    this.config = {
      baseUrl: getAPIBaseUrl(),
      timeout: 30000, // 30 seconds
      ...config,
    };

    // Initialize notification system
    this.notificationSystem = RustleNotificationSystem.getInstance();

    // Validate API key with security checks
    const apiKeyValidation = validateApiKey(this.config.apiKey);
    if (!apiKeyValidation.valid) {
      throw new Error(`Invalid API key: ${apiKeyValidation.error}`);
    }

    // Validate base URL
    const urlValidation = validateUrl(this.config.baseUrl!);
    if (!urlValidation.valid) {
      throw new Error(`Invalid API URL: ${urlValidation.error}`);
    }

    // Warn about insecure context
    if (!isSecureContext()) {
      console.warn('⚠️ Rustle Security Warning: API calls should be made over HTTPS in production');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Rustle API Client initialized with key: ${obfuscateApiKey(this.config.apiKey)}`);
    }
  }

  /**
   * Cancel an active request by key
   */
  cancelRequest(requestKey: string): boolean {
    const controller = this.activeRequests.get(requestKey);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(requestKey);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active requests
   */
  cancelAllRequests(): void {
    for (const [key, controller] of this.activeRequests.entries()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requestKey?: string
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Generate secure request ID if not provided
    const secureRequestId = requestKey || generateSecureRequestId();

    // Rate limiting check
    if (!globalRateLimiter.isAllowed(this.config.apiKey)) {
      throw new RustleAPIError(
        'Rate limit exceeded. Please try again later.',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Cancel existing request with same key if provided
    if (requestKey) {
      this.cancelRequest(requestKey);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    // Store the controller for potential cancellation
    this.activeRequests.set(secureRequestId, controller);

    try {
      const securityHeaders = getSecurityHeaders();

      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-Request-ID': secureRequestId,
          ...securityHeaders,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Remove from active requests on completion
      this.activeRequests.delete(secureRequestId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check for quota exceeded error
        const isQuotaExceeded = response.status === 429 ||
          errorData.code === 'QUOTA_EXCEEDED' ||
          errorData.code === 'RATE_LIMIT_EXCEEDED';

        const error = new RustleAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code,
          isQuotaExceeded,
          errorData.quota
        );

        // Show appropriate notification
        if (isQuotaExceeded) {
          this.notificationSystem.notifyQuotaExceeded(error);
        } else {
          this.notificationSystem.notifyAPIError(error, endpoint);
        }

        throw error;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Remove from active requests on error
      this.activeRequests.delete(secureRequestId);

      if (error instanceof RustleAPIError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new RustleAPIError('Request cancelled or timeout');
        }
        throw new RustleAPIError(`Network error: ${error.message}`);
      }

      throw new RustleAPIError('Unknown error occurred');
    }
  }

  /**
   * Translate a batch of text entries
   */
  async translateBatch(
    request: TranslationRequest,
    requestKey?: string
  ): Promise<TranslationResponse> {
    // Input validation
    if (!request.entries || request.entries.length === 0) {
      throw new RustleAPIError('No entries provided for translation');
    }

    if (request.entries.length > 100) {
      throw new RustleAPIError('Too many entries (max 100 per batch)');
    }

    // Validate locales
    const sourceValidation = validateLocale(request.sourceLanguage);
    if (!sourceValidation.valid) {
      throw new RustleAPIError(`Invalid source language: ${sourceValidation.error}`);
    }

    const targetValidation = validateLocale(request.targetLanguage);
    if (!targetValidation.valid) {
      throw new RustleAPIError(`Invalid target language: ${targetValidation.error}`);
    }

    // Sanitize all text entries
    const sanitizedRequest = {
      ...request,
      entries: request.entries.map(entry => ({
        ...entry,
        text: sanitizeTextInput(entry.text)
      }))
    };

    const response = await this.request<TranslationResponse>('/translate/batch', {
      method: 'POST',
      body: JSON.stringify(sanitizedRequest),
    }, requestKey);

    // Clean all translations in the response to remove quotes and artifacts
    if (response.success && response.translations) {
      response.translations = cleanBatchTranslations(response.translations);
    }

    return response;
  }

  /**
   * Translate a single text entry
   */
  async translateSingle(
    text: string,
    sourceLanguage: Locale,
    targetLanguage: Locale,
    model?: AIModel,
    context?: { tags?: string[]; file?: string }
  ): Promise<string> {
    // Input validation
    const sanitizedText = sanitizeTextInput(text);

    const sourceValidation = validateLocale(sourceLanguage);
    if (!sourceValidation.valid) {
      throw new RustleAPIError(`Invalid source language: ${sourceValidation.error}`);
    }

    const targetValidation = validateLocale(targetLanguage);
    if (!targetValidation.valid) {
      throw new RustleAPIError(`Invalid target language: ${targetValidation.error}`);
    }

    const request: TranslationRequest = {
      entries: [{
        id: 'single',
        text: sanitizedText,
        context: context && context.file && context.tags ? {
          file: context.file,
          tags: context.tags,
        } : undefined,
      }],
      sourceLanguage,
      targetLanguage,
      model,
    };

    const response = await this.translateBatch(request);
    
    if (!response.success) {
      throw new RustleAPIError(response.error || 'Translation failed');
    }

    const translation = response.translations['single'];
    if (!translation) {
      throw new RustleAPIError('No translation returned');
    }

    // Clean the translation to remove quotes and artifacts
    return cleanTranslation(translation);
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }

  /**
   * Get supported models and languages
   */
  async getSupportedModels(): Promise<{
    models: AIModel[];
    languages: Locale[];
  }> {
    return this.request<{
      models: AIModel[];
      languages: Locale[];
    }>('/models');
  }
}

/**
 * Create a configured API client instance
 */
export function createAPIClient(config: APIClientConfig): APIClient {
  return new APIClient(config);
}
