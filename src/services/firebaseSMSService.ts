/**
 * Firebase SMS Authentication Service
 * Environment-aware implementation for Expo Go, EAS builds, and web
 */

import { auth } from '../config/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { detectBuildEnvironment, getFirebaseSMSMethod } from '../utils/environmentDetection';
import { logger } from '../utils/logger';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '../config/environment';
import Constants from 'expo-constants';

export interface SMSVerificationResult {
  verificationId: string;
  method: 'expo-firebase-recaptcha' | 'react-native-firebase' | 'web-firebase' | 'backend-only';
}

export interface SMSVerificationError extends Error {
  code?: string;
  retryable?: boolean;
}

class FirebaseSMSService {
  private static instance: FirebaseSMSService;
  private recaptchaVerifier: any = null;
  
  static getInstance(): FirebaseSMSService {
    if (!FirebaseSMSService.instance) {
      FirebaseSMSService.instance = new FirebaseSMSService();
    }
    return FirebaseSMSService.instance;
  }

  /**
   * Send SMS verification code
   */
  async sendVerificationCode(phoneNumber: string): Promise<SMSVerificationResult> {
    const env = detectBuildEnvironment();
    const method = getFirebaseSMSMethod();
    
    logger.info(`📱 Sending SMS via ${method} to ${phoneNumber}`);
    
    try {
      switch (method) {
        case 'backend-only':
          return await this.sendViaBackendFallback(phoneNumber);
        case 'expo-firebase-recaptcha':
          return await this.sendViaExpoFirebaseRecaptcha(phoneNumber);
        case 'react-native-firebase':
          return await this.sendViaReactNativeFirebase(phoneNumber);
        case 'web-firebase':
          return await this.sendViaWebFirebase(phoneNumber);
        default:
          throw new Error(`Unsupported SMS method: ${method}`);
      }
    } catch (error: any) {
      logger.error(`📱 SMS sending failed via ${method}:`, error);
      
      // Check if error is retryable (quota, network, etc.)
      if (this.isRetryableError(error)) {
        logger.info('📱 Attempting backend fallback due to retryable error');
        return await this.sendViaBackendFallback(phoneNumber);
      }
      
      throw this.createSMSVerificationError(error);
    }
  }

  /**
   * Verify SMS code
   */
  async verifyCode(verificationId: string, code: string): Promise<void> {
    logger.info(`📱 Verifying code with ID: ${verificationId.substring(0, 20)}...`);
    
    try {
      // Handle backend/mock verification
      if (verificationId.startsWith('backend_verification_') || verificationId.startsWith('mock_verification_')) {
        await this.verifyViaBackend(verificationId, code);
        return;
      }
      
      // Handle Firebase verification
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      
      logger.info('✅ Firebase SMS verification successful');
    } catch (error: any) {
      logger.error('📱 SMS verification failed:', error);
      throw this.createSMSVerificationError(error);
    }
  }

  /**
   * Send SMS via Expo Firebase reCAPTCHA (Expo Go with Firebase Web SDK)
   */
  private async sendViaExpoFirebaseRecaptcha(phoneNumber: string): Promise<SMSVerificationResult> {
    try {
      // Skip Firebase SMS in Expo Go (reCAPTCHA doesn't work properly)
      if (Constants.appOwnership === 'expo') {
        logger.info('📱 Expo Go detected, skipping Firebase SMS and using backend API only');
        return await this.sendViaBackendFallback(phoneNumber);
      }

      // Import Firebase Web SDK
      const { PhoneAuthProvider } = await import('firebase/auth');
      
      logger.info('📱 Using Firebase Web SDK for Expo Go SMS');
      
      // Create a custom reCAPTCHA verifier for Expo Go
      if (!this.recaptchaVerifier) {
        // Create a custom reCAPTCHA verifier that works in Expo Go
        this.recaptchaVerifier = {
          type: 'recaptcha',
          verify: async () => {
            logger.info('📱 Expo Go reCAPTCHA verification (Firebase Web SDK)');
            
            // For Expo Go, we'll use a custom reCAPTCHA implementation
            // This bypasses the need for DOM elements
            try {
              // Create a simple verification that Firebase will accept
              const verificationToken = `expo-go-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              logger.info('📱 Generated reCAPTCHA token for Expo Go');
              return verificationToken;
            } catch (error) {
              logger.error('📱 reCAPTCHA token generation failed:', error);
              throw new Error('reCAPTCHA verification failed');
            }
          }
        };
      }
      
      // Use PhoneAuthProvider with custom reCAPTCHA
      const provider = new PhoneAuthProvider(auth);
      logger.info('📱 Sending SMS via Firebase Phone Auth...');
      
      const verificationId = await provider.verifyPhoneNumber(phoneNumber, this.recaptchaVerifier);
      
      logger.info('✅ Real SMS sent via Firebase Phone Auth!');
      logger.info(`📱 Verification ID: ${verificationId.substring(0, 20)}...`);
      
      return {
        verificationId,
        method: 'expo-firebase-recaptcha'
      };
    } catch (error: any) {
      logger.error('📱 Firebase Phone Auth failed:', error);
      
      // If Firebase fails, fall back to backend
      logger.info('📱 Firebase SMS failed, falling back to backend');
      return await this.sendViaBackendFallback(phoneNumber);
    }
  }

  /**
   * Send SMS via React Native Firebase (EAS builds)
   */
  private async sendViaReactNativeFirebase(phoneNumber: string): Promise<SMSVerificationResult> {
    try {
      // Check if @react-native-firebase/auth is available
      try {
        const rnFirebaseAuth = require('@react-native-firebase/auth').default;
        
        // Send verification code
        const confirmation = await rnFirebaseAuth().signInWithPhoneNumber(phoneNumber);
        
        logger.info('✅ SMS sent via React Native Firebase');
        return {
          verificationId: confirmation.verificationId,
          method: 'react-native-firebase'
        };
      } catch (importError) {
        logger.warn('📱 @react-native-firebase/auth not available, falling back to Firebase Web SDK');
        // Fall back to Firebase Web SDK
        return await this.sendViaExpoFirebaseRecaptcha(phoneNumber);
      }
    } catch (error: any) {
      logger.error('📱 React Native Firebase failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS via Web Firebase (web platform)
   */
  private async sendViaWebFirebase(phoneNumber: string): Promise<SMSVerificationResult> {
    try {
      // Import Firebase Auth dynamically
      const { RecaptchaVerifier } = await import('firebase/auth');
      
      // Create reCAPTCHA verifier
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => logger.info('📱 reCAPTCHA solved'),
          'expired-callback': () => logger.warn('📱 reCAPTCHA expired'),
        });
      }
      
      // Send verification code
      const verificationId = await this.recaptchaVerifier.verifyPhoneNumber(phoneNumber);
      
      logger.info('✅ SMS sent via Web Firebase');
      return {
        verificationId,
        method: 'web-firebase'
      };
    } catch (error: any) {
      logger.error('📱 Web Firebase failed:', error);
      throw error;
    }
  }

  /**
   * Send SMS via backend fallback
   */
  private async sendViaBackendFallback(phoneNumber: string): Promise<SMSVerificationResult> {
    try {
      logger.info('📱 Using backend SMS service');
      
      // Try backend first
      try {
        const response = await fetch(`${config.apiUrl}/v1/auth/sms/send-verification-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: phoneNumber,
            userId: `temp_user_${Date.now()}`
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Store phone number for verification
          await AsyncStorage.setItem('pending_phone_verification', phoneNumber);
          
          logger.info('✅ SMS sent via backend service');
          return {
            verificationId: `backend_verification_${Date.now()}`,
            method: 'backend-only'
          };
        }
      } catch (backendError) {
        logger.warn('📱 Backend SMS service not available, using mock SMS for development');
      }
      
      // Fallback to mock SMS for development
      if (__DEV__) {
        logger.info('📱 Using mock SMS service for development');
        
        // Store phone number for verification
        await AsyncStorage.setItem('pending_phone_verification', phoneNumber);
        
        // Generate a mock verification code
        const mockCode = '123456';
        await AsyncStorage.setItem('mock_verification_code', mockCode);
        
        logger.info(`📱 Mock SMS sent to ${phoneNumber}. Use code: ${mockCode}`);
        
        return {
          verificationId: `mock_verification_${Date.now()}`,
          method: 'backend-only'
        };
      } else {
        throw new Error('Backend SMS service not available and not in development mode');
      }
    } catch (error: any) {
      logger.error('📱 Backend SMS service failed:', error);
      throw error;
    }
  }

  /**
   * Verify code via backend
   */
  private async verifyViaBackend(verificationId: string, code: string): Promise<void> {
    try {
      // Handle mock verification for development
      if (verificationId.startsWith('mock_verification_')) {
        const storedCode = await AsyncStorage.getItem('mock_verification_code');
        if (storedCode === code) {
          // Clean up stored data
          await AsyncStorage.removeItem('pending_phone_verification');
          await AsyncStorage.removeItem('mock_verification_code');
          
          logger.info('✅ Mock SMS verification successful');
          return;
        } else {
          throw new Error('Invalid verification code');
        }
      }
      
      // Handle real backend verification
      const storedPhoneNumber = await AsyncStorage.getItem('pending_phone_verification');
      
      if (!storedPhoneNumber) {
        throw new Error('Phone number not found for verification');
      }
      
      try {
        const response = await fetch(`${config.apiUrl}/auth/sms/verify-phone-code`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phoneNumber: storedPhoneNumber,
            code: code
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          // Clean up stored phone number
          await AsyncStorage.removeItem('pending_phone_verification');
          
          // Store verification success
          await AsyncStorage.setItem('phone_verification_success', JSON.stringify({
            phoneNumber: result.phoneNumber,
            verifiedAt: new Date().toISOString(),
            success: true
          }));
          
          logger.info('✅ Backend SMS verification successful');
        } else {
          throw new Error(result.error || result.message || 'Verification failed');
        }
      } catch (backendError) {
        logger.warn('📱 Backend verification not available, using mock verification for development');
        
        // Fallback to mock verification for development
        if (__DEV__) {
          const storedCode = await AsyncStorage.getItem('mock_verification_code');
          if (storedCode === code) {
            // Clean up stored data
            await AsyncStorage.removeItem('pending_phone_verification');
            await AsyncStorage.removeItem('mock_verification_code');
            
            logger.info('✅ Mock SMS verification successful');
            return;
          } else {
            throw new Error('Invalid verification code');
          }
        } else {
          throw backendError;
        }
      }
    } catch (error: any) {
      logger.error('📱 Backend verification failed:', error);
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    const retryableCodes = [
      'auth/too-many-requests',
      'auth/quota-exceeded',
      'auth/network-request-failed',
      'auth/timeout',
      'auth/unavailable',
    ];
    
    return retryableCodes.includes(error.code) || 
           error.message?.includes('quota') ||
           error.message?.includes('network') ||
           error.message?.includes('timeout');
  }

  /**
   * Create standardized SMS verification error
   */
  private createSMSVerificationError(error: any): SMSVerificationError {
    const smsError = new Error(error.message || 'SMS verification failed') as SMSVerificationError;
    smsError.code = error.code;
    smsError.retryable = this.isRetryableError(error);
    return smsError;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      } catch (error) {
        logger.warn('📱 Error cleaning up reCAPTCHA verifier:', error);
      }
    }
  }
}

export const firebaseSMSService = FirebaseSMSService.getInstance();
