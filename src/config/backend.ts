/**
 * Backend API Configuration
 * Connects Guild app to the custom backend (40% of operations)
 * Firebase handles 60% directly from the app
 */

import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';
import { authTokenService } from '../services/authTokenService';

// Backend API Configuration
// Choose the right URL based on how you're running the app:
// - Physical device on same WiFi: use your computer's IP (192.168.1.34)
// - iOS Simulator: use 'localhost'
// - Android Emulator: use '10.0.2.2'
const BACKEND_CONFIG = {
  baseURL: 'https://guild-yf7q.onrender.com',  // Production backend on Render (removed /api)
  timeout: 10000,
  retries: 3,
};

/**
 * API Client Class
 * Handles all backend communication with automatic token management
 */
export class BackendAPI {
  private static baseURL = BACKEND_CONFIG.baseURL;
  private static timeout = BACKEND_CONFIG.timeout;

  /**
   * Get Firebase ID token for backend authentication (with caching and retry)
   */
  private static async getAuthToken(): Promise<string | null> {
    try {
      // Use enhanced token service with caching and automatic refresh
      const token = await authTokenService.getTokenWithRetry(2);
      return token;
    } catch (error) {
      logger.error('Failed to get auth token:', error);
      return null;
    }
  }

  /**
   * Make authenticated API request
   */
  private static async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
        console.log('🔐 BackendAPI: Sending request with token', {
          endpoint,
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...',
          hasBearer: headers.Authorization?.startsWith('Bearer ')
        });
      } else {
        console.warn('🔐 BackendAPI: No token available for request', { endpoint });
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        timeout: this.timeout,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Backend error response:', errorData);
        const errorMessage = 
          errorData.error?.message || 
          errorData.error || 
          errorData.message || 
          `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      logger.error(`Backend API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  static async get(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  static async post(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  static async put(endpoint: string, data?: any): Promise<any> {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  static async delete(endpoint: string): Promise<any> {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      // Remove /api/v1 or /api from baseURL to get root URL for health check
      const rootURL = this.baseURL.replace('/api/v1', '').replace('/api', '');
      const response = await fetch(`${rootURL}/health`);
      return response.ok;
    } catch (error) {
      logger.error('Health check failed:', error);
      return false;
    }
  }
}

/**
 * Backend Service Classes
 * These handle specific backend operations (25-40% of app logic)
 */

export class BackendUserService {
  /**
   * Get user analytics (PostgreSQL backend)
   */
  static async getUserAnalytics(userId: string, startDate: string, endDate: string) {
    return BackendAPI.get(`/users/${userId}/analytics?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * Update user status (Admin only)
   */
  static async updateUserStatus(userId: string, status: string, reason?: string) {
    return BackendAPI.put(`/users/${userId}/status`, { status, reason });
  }

  /**
   * Set user role (Super Admin only)
   */
  static async setUserRole(userId: string, role: string, permissions: string[]) {
    return BackendAPI.put(`/users/${userId}/role`, { role, permissions });
  }

  /**
   * Get user ranking data
   */
  static async getUserRanking(userId: string) {
    return BackendAPI.get(`/users/${userId}/ranking`);
  }

  /**
   * Search users (Admin)
   */
  static async searchUsers(searchTerm: string, limit: number = 20) {
    return BackendAPI.get(`/users/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`);
  }
}

export class BackendJobService {
  /**
   * Get job analytics
   */
  static async getJobAnalytics(jobId: string) {
    return BackendAPI.get(`/jobs/${jobId}/analytics`);
  }

  /**
   * Process job payment
   */
  static async processJobPayment(jobId: string, paymentData: any) {
    return BackendAPI.post(`/jobs/${jobId}/payment`, paymentData);
  }

  /**
   * Create escrow account
   */
  static async createEscrow(jobId: string, amount: number) {
    return BackendAPI.post(`/payments/escrow`, { jobId, amount });
  }
}

export class BackendGuildService {
  /**
   * Get guild financial data
   */
  static async getGuildFinances(guildId: string) {
    return BackendAPI.get(`/guilds/${guildId}/finances`);
  }

  /**
   * Process guild payment distribution
   */
  static async distributeGuildPayment(guildId: string, jobId: string, amount: number) {
    return BackendAPI.post(`/guilds/${guildId}/distribute-payment`, { jobId, amount });
  }

  /**
   * Get guild analytics
   */
  static async getGuildAnalytics(guildId: string, startDate: string, endDate: string) {
    return BackendAPI.get(`/guilds/${guildId}/analytics?startDate=${startDate}&endDate=${endDate}`);
  }
}

export class BackendPaymentService {
  /**
   * Get user financial summary
   */
  static async getUserFinancialSummary(userId: string) {
    return BackendAPI.get(`/payments/user/${userId}/summary`);
  }

  /**
   * Process withdrawal
   */
  static async processWithdrawal(userId: string, amount: number, method: string) {
    return BackendAPI.post(`/payments/withdraw`, { userId, amount, method });
  }

  /**
   * Get transaction history
   */
  static async getTransactionHistory(userId: string, page: number = 1, limit: number = 20) {
    return BackendAPI.get(`/payments/transactions?userId=${userId}&page=${page}&limit=${limit}`);
  }
}

export class BackendAnalyticsService {
  /**
   * Get platform analytics
   */
  static async getPlatformAnalytics(startDate: string, endDate: string) {
    return BackendAPI.get(`/analytics/platform?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * Track user event
   */
  static async trackEvent(eventType: string, eventData: any) {
    return BackendAPI.post(`/analytics/events`, { eventType, eventData });
  }

  /**
   * Get user behavior analytics
   */
  static async getUserBehaviorAnalytics(userId: string) {
    return BackendAPI.get(`/analytics/user/${userId}/behavior`);
  }
}

/**
 * Backend Connection Manager
 * Manages connection health and fallback strategies
 */
export class BackendConnectionManager {
  private static isConnected = false;
  private static lastHealthCheck = 0;
  private static healthCheckInterval = 30000; // 30 seconds
  private static healthCheckTimer: NodeJS.Timeout | null = null;

  /**
   * Check backend connection health
   */
  static async checkConnection(): Promise<boolean> {
    const now = Date.now();
    
    // Skip if recently checked
    if (now - this.lastHealthCheck < this.healthCheckInterval) {
      return this.isConnected;
    }

    try {
      this.isConnected = await BackendAPI.healthCheck();
      this.lastHealthCheck = now;
      
      if (this.isConnected) {
        logger.info('✅ Backend connection healthy');
      } else {
        logger.warn('⚠️ Backend connection failed');
      }
      
      return this.isConnected;
    } catch (error) {
      logger.error('❌ Backend health check failed:', error);
      this.isConnected = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Get connection status
   */
  static isBackendConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Initialize backend connection
   */
  static async initialize(): Promise<void> {
    logger.info('🔗 Initializing backend connection...');
    
    const isConnected = await this.checkConnection();
    
    if (isConnected) {
      logger.info('🚀 Backend connection established successfully');
    } else {
      logger.warn('⚠️ Backend connection failed - using Firebase-only mode');
    }

    // Set up periodic health checks with cleanup
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    this.healthCheckTimer = setInterval(() => {
      this.checkConnection();
    }, this.healthCheckInterval);
  }

  /**
   * Cleanup resources and stop health checks
   */
  static cleanup(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      logger.info('🧹 Backend connection manager cleaned up');
    }
  }
}

// Export main API class
export default BackendAPI;
