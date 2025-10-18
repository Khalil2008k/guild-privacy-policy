/**
 * Firebase App Check Service for Mobile App
 * Protects Firebase resources from abuse by verifying app authenticity
 */

import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { app } from '../config/firebase';
import { config, isProduction, isFeatureEnabled } from '../config/environment';

class AppCheckService {
  private isInitialized = false;
  private appCheck: any = null;

  /**
   * Initialize Firebase App Check
   */
  async initialize(): Promise<void> {
    try {
      // Only initialize if App Check is enabled
      if (!isFeatureEnabled('enableAppCheck')) {
        console.log('🛡️ App Check disabled via feature flag');
        return;
      }

      if (this.isInitialized) {
        console.log('🛡️ App Check already initialized');
        return;
      }

      // App Check configuration
      const appCheckConfig = {
        // In production, use reCAPTCHA v3
        // In development, use debug token
        provider: isProduction() 
          ? new ReCaptchaV3Provider(process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI') // Test key
          : 'debug', // Debug mode for development

        // Enable automatic token refresh
        isTokenAutoRefreshEnabled: true
      };

      // Initialize App Check
      this.appCheck = initializeAppCheck(app, appCheckConfig);
      this.isInitialized = true;

      console.log('🛡️ Firebase App Check initialized successfully');

      // Test token generation
      await this.testTokenGeneration();

    } catch (error) {
      console.error('❌ Failed to initialize Firebase App Check:', error);
      
      // In development, don't fail the app
      if (!isProduction()) {
        console.warn('⚠️ Continuing without App Check in development mode');
        return;
      }
      
      throw error;
    }
  }

  /**
   * Get App Check token manually
   */
  async getAppCheckToken(forceRefresh = false): Promise<string | null> {
    try {
      if (!this.isInitialized || !this.appCheck) {
        console.warn('⚠️ App Check not initialized');
        return null;
      }

      const token = await getToken(this.appCheck, forceRefresh);
      
      if (token) {
        console.log('🛡️ App Check token obtained successfully');
        return token.token;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get App Check token:', error);
      return null;
    }
  }

  /**
   * Test token generation (development only)
   */
  private async testTokenGeneration(): Promise<void> {
    if (isProduction()) return;

    try {
      const token = await this.getAppCheckToken();
      if (token) {
        console.log('✅ App Check token test successful');
      } else {
        console.warn('⚠️ App Check token test failed');
      }
    } catch (error) {
      console.error('❌ App Check token test error:', error);
    }
  }

  /**
   * Check if App Check is properly configured
   */
  isConfigured(): boolean {
    return this.isInitialized && this.appCheck !== null;
  }

  /**
   * Get App Check status for debugging
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      configured: this.isConfigured(),
      environment: isProduction() ? 'production' : 'development',
      featureEnabled: isFeatureEnabled('enableAppCheck')
    };
  }
}

// Export singleton instance
export const appCheckService = new AppCheckService();

// Auto-initialize in production
if (isProduction() && isFeatureEnabled('enableAppCheck')) {
  appCheckService.initialize().catch(error => {
    console.error('Failed to auto-initialize App Check:', error);
  });
}

export default appCheckService;


