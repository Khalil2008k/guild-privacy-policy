/**
 * Authentication Token Service
 * Manages Firebase ID tokens for backend authentication
 */

import { auth } from '../config/firebase';
import { secureStorage } from './secureStorage';

class AuthTokenService {
  private tokenKey = 'guild_auth_token';
  private tokenExpiryKey = 'guild_auth_token_expiry';
  private refreshThresholdMinutes = 5; // Refresh token if expiring in 5 minutes

  /**
   * Get current Firebase ID token, refresh if needed
   */
  async getToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        console.log('🔐 AuthToken: No user signed in');
        return null;
      }

      // Check if cached token is still valid
      const cachedToken = await this.getCachedToken();
      if (cachedToken && await this.isTokenValid()) {
        console.log('🔐 AuthToken: Using cached token');
        return cachedToken;
      }

      // Get fresh token from Firebase
      console.log('🔐 AuthToken: Fetching fresh token from Firebase');
      const token = await currentUser.getIdToken(true); // Force refresh
      
      // Cache token with expiry (tokens typically expire in 1 hour)
      await this.cacheToken(token);
      
      return token;
    } catch (error) {
      console.error('🔐 AuthToken: Error getting token:', error);
      return null;
    }
  }

  /**
   * Force refresh the token
   */
  async refreshToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        return null;
      }

      console.log('🔐 AuthToken: Force refreshing token');
      const token = await currentUser.getIdToken(true);
      await this.cacheToken(token);
      
      return token;
    } catch (error) {
      console.error('🔐 AuthToken: Error refreshing token:', error);
      return null;
    }
  }

  /**
   * Clear cached token
   */
  async clearToken(): Promise<void> {
    try {
      await secureStorage.removeItem(this.tokenKey);
      await secureStorage.removeItem(this.tokenExpiryKey);
      console.log('🔐 AuthToken: Cleared cached token');
    } catch (error) {
      console.error('🔐 AuthToken: Error clearing token:', error);
    }
  }

  /**
   * Cache token with expiry time
   */
  private async cacheToken(token: string): Promise<void> {
    try {
      // Firebase tokens typically expire in 1 hour
      const expiryTime = Date.now() + (55 * 60 * 1000); // Cache for 55 minutes
      
      await secureStorage.setItem(this.tokenKey, token);
      await secureStorage.setItem(this.tokenExpiryKey, expiryTime.toString());
      
      console.log('🔐 AuthToken: Cached token, expires in 55 minutes');
    } catch (error) {
      console.warn('🔐 AuthToken: Failed to cache token:', error);
      // Non-critical error, continue without caching
    }
  }

  /**
   * Get cached token without validation
   */
  private async getCachedToken(): Promise<string | null> {
    try {
      return await secureStorage.getItem(this.tokenKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if cached token is still valid
   */
  private async isTokenValid(): Promise<boolean> {
    try {
      const expiryStr = await secureStorage.getItem(this.tokenExpiryKey);
      
      if (!expiryStr) {
        return false;
      }

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      const threshold = this.refreshThresholdMinutes * 60 * 1000;

      // Token is valid if it won't expire within the threshold
      return (expiry - now) > threshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get token with automatic retry on failure
   */
  async getTokenWithRetry(maxRetries = 2): Promise<string | null> {
    for (let i = 0; i < maxRetries; i++) {
      const token = await this.getToken();
      
      if (token) {
        return token;
      }

      console.log(`🔐 AuthToken: Retry ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
    }

    console.error('🔐 AuthToken: Failed to get token after retries');
    return null;
  }

  /**
   * Get auth headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken();
    
    if (!token) {
      console.warn('🔐 AuthToken: No token available for auth headers');
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
      'X-Auth-Token': token, // Alternative header for compatibility
    };
  }
}

export const authTokenService = new AuthTokenService();
export default authTokenService;

