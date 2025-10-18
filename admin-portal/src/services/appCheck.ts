/**
 * Firebase App Check Service for Admin Portal
 * Protects Firebase resources from abuse by verifying app authenticity
 */

import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { app } from '../utils/firebase';
import { isAdminProduction, isAdminFeatureEnabled } from '../config/environment';

class AdminAppCheckService {
  private isInitialized = false;
  private appCheck: any = null;

  /**
   * Initialize Firebase App Check for Admin Portal
   */
  async initialize(): Promise<void> {
    try {
      // Only initialize if App Check is enabled
      if (!isAdminFeatureEnabled('enableAppCheck')) {
        console.log('🛡️ Admin App Check disabled via feature flag');
        return;
      }

      if (this.isInitialized) {
        console.log('🛡️ Admin App Check already initialized');
        return;
      }

      // Get reCAPTCHA site key from environment
      const recaptchaSiteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'; // Test key

      // App Check configuration for web
      const appCheckConfig = {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey),
        isTokenAutoRefreshEnabled: true
      };

      // Initialize App Check
      this.appCheck = initializeAppCheck(app, appCheckConfig);
      this.isInitialized = true;

      console.log('🛡️ Firebase App Check initialized for Admin Portal');

      // Test token generation in development
      if (!isAdminProduction()) {
        await this.testTokenGeneration();
      }

    } catch (error) {
      console.error('❌ Failed to initialize Admin App Check:', error);
      
      // In development, don't fail the app
      if (!isAdminProduction()) {
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
        console.warn('⚠️ Admin App Check not initialized');
        return null;
      }

      const token = await getToken(this.appCheck, forceRefresh);
      
      if (token) {
        console.log('🛡️ Admin App Check token obtained successfully');
        return token.token;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get Admin App Check token:', error);
      return null;
    }
  }

  /**
   * Test token generation (development only)
   */
  private async testTokenGeneration(): Promise<void> {
    if (isAdminProduction()) return;

    try {
      const token = await this.getAppCheckToken();
      if (token) {
        console.log('✅ Admin App Check token test successful');
      } else {
        console.warn('⚠️ Admin App Check token test failed');
      }
    } catch (error) {
      console.error('❌ Admin App Check token test error:', error);
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
      environment: isAdminProduction() ? 'production' : 'development',
      featureEnabled: isAdminFeatureEnabled('enableAppCheck'),
      domain: window.location.hostname
    };
  }

  /**
   * Setup reCAPTCHA v3 for enhanced security
   */
  setupRecaptcha(): void {
    if (isAdminProduction() && !document.querySelector('script[src*="recaptcha"]')) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.REACT_APP_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      console.log('🛡️ reCAPTCHA v3 script loaded for Admin Portal');
    }
  }
}

// Export singleton instance
export const adminAppCheckService = new AdminAppCheckService();

// Auto-initialize and setup
if (typeof window !== 'undefined') {
  // Setup reCAPTCHA
  adminAppCheckService.setupRecaptcha();
  
  // Initialize App Check in production
  if (isAdminProduction() && isAdminFeatureEnabled('enableAppCheck')) {
    adminAppCheckService.initialize().catch(error => {
      console.error('Failed to auto-initialize Admin App Check:', error);
    });
  }
}

export default adminAppCheckService;


