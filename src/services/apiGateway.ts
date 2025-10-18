/**
 * API Security Gateway
 * Enterprise-grade API security with rate limiting, validation, and monitoring
 */

import { validateFields, sanitizeInput } from '../utils/inputValidation';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './secureStorage';

// API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  timestamp: string;
  requestId: string;
}

// Request configuration
export interface ApiRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  validateResponse?: boolean;
  requireAuth?: boolean;
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
}

// Rate limiting storage
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class ApiGateway {
  private baseUrl: string;
  private defaultTimeout: number = 10000;
  private rateLimitStorage = new Map<string, RateLimitRecord>();
  private requestQueue: Map<string, Promise<any>> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Make a secure API request
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Validate and sanitize request data
      if (config.data) {
        config.data = this.sanitizeRequestData(config.data);
      }

      // Check rate limiting
      if (config.rateLimit) {
        const rateLimitResult = this.checkRateLimit(
          config.endpoint,
          config.rateLimit.maxRequests,
          config.rateLimit.windowMs
        );
        
        if (!rateLimitResult.allowed) {
          throw new Error(`Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`);
        }
      }

      // Prevent duplicate requests
      const requestKey = this.getRequestKey(config);
      if (this.requestQueue.has(requestKey)) {
        logger.debug('Returning cached request', { requestKey });
        return await this.requestQueue.get(requestKey);
      }

      // Create the request promise
      const requestPromise = this.executeRequest<T>(config, requestId);
      this.requestQueue.set(requestKey, requestPromise);

      try {
        const response = await requestPromise;
        
        // Log successful request
        const duration = Date.now() - startTime;
        logger.info('API request completed', {
          requestId,
          method: config.method,
          endpoint: config.endpoint,
          duration,
          status: 'success'
        });

        return response;
      } finally {
        // Clean up request queue
        this.requestQueue.delete(requestKey);
      }

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // Log error
      logger.error('API request failed', {
        requestId,
        method: config.method,
        endpoint: config.endpoint,
        duration,
        error: error.message,
        status: 'error'
      });

      // Return formatted error response
      return {
        success: false,
        error: this.getErrorMessage(error),
        code: error.code || 'API_ERROR',
        timestamp: new Date().toISOString(),
        requestId
      };
    }
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(config: ApiRequestConfig, requestId: string): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${config.endpoint}`;
    const timeout = config.timeout || this.defaultTimeout;

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Client-Version': '1.0.0',
      'X-Platform': 'mobile',
      ...config.headers
    };

    // Add authentication if required
    if (config.requireAuth !== false) {
      const authToken = await this.getAuthToken();
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      } else if (config.requireAuth) {
        throw new Error('Authentication required but no token available');
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    // Add body for non-GET requests
    if (config.method !== 'GET' && config.data) {
      requestOptions.body = JSON.stringify(config.data);
    }

    // Execute request with retry logic
    let lastError: Error;
    const maxRetries = config.retries || 3;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        
        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const responseData = await response.json();

        // Validate response if requested
        if (config.validateResponse) {
          this.validateResponse(responseData);
        }

        return {
          success: true,
          data: responseData,
          timestamp: new Date().toISOString(),
          requestId
        };

      } catch (error: any) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.name === 'AbortError' || 
            error.message.includes('401') || 
            error.message.includes('403') ||
            attempt === maxRetries) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        logger.warn('API request retry', {
          requestId,
          attempt: attempt + 1,
          maxRetries,
          error: error.message
        });
      }
    }

    throw lastError!;
  }

  /**
   * Get authentication token from secure storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // ✅ SECURITY FIX: Use secure storage instead of AsyncStorage
      const token = await secureStorage.getItem('auth_token');
      if (token) {
        return token;
      }

      // Try to get from Firebase Auth if available
      if (typeof window !== 'undefined' && window.firebase?.auth) {
        const user = window.firebase.auth().currentUser;
        if (user) {
          const freshToken = await user.getIdToken();
          // Store the fresh token securely
          if (freshToken) {
            await secureStorage.setItem('auth_token', freshToken);
          }
          return freshToken;
        }
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get auth token', { error: error.message });
      return null;
    }
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(endpoint: string, maxRequests: number, windowMs: number): {
    allowed: boolean;
    retryAfter?: number;
  } {
    const now = Date.now();
    const key = `rate_limit_${endpoint}`;
    const record = this.rateLimitStorage.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.rateLimitStorage.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true };
    }

    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment counter
    record.count++;
    this.rateLimitStorage.set(key, record);

    return { allowed: true };
  }

  /**
   * Sanitize request data
   */
  private sanitizeRequestData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeInput(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeRequestData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeRequestData(value);
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Validate API response
   */
  private validateResponse(response: any): void {
    // Check for suspicious content in response
    const responseStr = JSON.stringify(response);
    
    if (responseStr.includes('<script>') || 
        responseStr.includes('javascript:') ||
        responseStr.includes('data:text/html')) {
      throw new Error('Response contains potentially dangerous content');
    }

    // Validate response structure
    if (typeof response !== 'object') {
      throw new Error('Invalid response format');
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate request key for deduplication
   */
  private getRequestKey(config: ApiRequestConfig): string {
    const dataHash = config.data ? JSON.stringify(config.data) : '';
    return `${config.method}_${config.endpoint}_${dataHash}`;
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    if (error.name === 'AbortError') {
      return 'Request timeout. Please try again.';
    }

    if (error.message.includes('Network request failed')) {
      return 'Network error. Please check your connection.';
    }

    if (error.message.includes('401')) {
      return 'Authentication required. Please sign in.';
    }

    if (error.message.includes('403')) {
      return 'Access denied. You don\'t have permission for this action.';
    }

    if (error.message.includes('404')) {
      return 'Resource not found.';
    }

    if (error.message.includes('429')) {
      return 'Too many requests. Please try again later.';
    }

    if (error.message.includes('500')) {
      return 'Server error. Please try again later.';
    }

    return error.message || 'An unexpected error occurred';
  }

  /**
   * Clear rate limit cache
   */
  clearRateLimits(): void {
    this.rateLimitStorage.clear();
  }

  /**
   * Update base URL
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  /**
   * Set default timeout
   */
  setTimeout(timeout: number): void {
    this.defaultTimeout = timeout;
  }
}

// Create singleton instance
const apiGateway = new ApiGateway(process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.36:4000/api/v1');

// Convenience methods for common HTTP methods
export const api = {
  get: <T = any>(endpoint: string, config?: Partial<ApiRequestConfig>) =>
    apiGateway.request<T>({ method: 'GET', endpoint, ...config }),

  post: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>) =>
    apiGateway.request<T>({ method: 'POST', endpoint, data, ...config }),

  put: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>) =>
    apiGateway.request<T>({ method: 'PUT', endpoint, data, ...config }),

  delete: <T = any>(endpoint: string, config?: Partial<ApiRequestConfig>) =>
    apiGateway.request<T>({ method: 'DELETE', endpoint, ...config }),

  patch: <T = any>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>) =>
    apiGateway.request<T>({ method: 'PATCH', endpoint, data, ...config }),
};

export { apiGateway };
export default api;
