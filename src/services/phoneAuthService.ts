/**
 * Firebase Phone Authentication Service
 * Full PhoneAuthProvider implementation
 */

import { auth } from '../config/firebase';
import {
  PhoneAuthProvider,
  signInWithCredential,
  linkWithCredential,
  RecaptchaVerifier,
  ApplicationVerifier
} from 'firebase/auth';
import { logger } from '../utils/logger';

export class PhoneAuthService {
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  
  /**
   * Initialize reCAPTCHA verifier
   */
  initRecaptcha(containerId: string): ApplicationVerifier {
    if (this.recaptchaVerifier) {
      return this.recaptchaVerifier;
    }
    
    this.recaptchaVerifier = new RecaptchaVerifier(
      containerId,
      {
        size: 'invisible',
        callback: () => {
          logger.info('reCAPTCHA verified');
        },
        'expired-callback': () => {
          logger.warn('reCAPTCHA expired');
        }
      },
      auth
    );
    
    return this.recaptchaVerifier;
  }
  
  /**
   * Send verification code to phone number
   */
  async sendVerificationCode(
    phoneNumber: string,
    recaptchaVerifier: ApplicationVerifier
  ): Promise<string> {
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );
      
      logger.info('Phone verification code sent', { phoneNumber });
      return verificationId;
    } catch (error: any) {
      logger.error('Failed to send verification code:', error);
      throw new Error(`Failed to send verification: ${error.message}`);
    }
  }
  
  /**
   * Verify phone code and sign in
   */
  async verifyCodeAndSignIn(
    verificationId: string,
    code: string
  ): Promise<void> {
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
      
      logger.info('Phone verification successful - user signed in');
    } catch (error: any) {
      logger.error('Phone verification failed:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }
  }
  
  /**
   * Link phone number to existing account
   */
  async linkPhoneToAccount(
    verificationId: string,
    code: string
  ): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user signed in');
      }
      
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await linkWithCredential(user, credential);
      
      logger.info('Phone number linked to account');
    } catch (error: any) {
      logger.error('Failed to link phone:', error);
      throw new Error(`Failed to link phone: ${error.message}`);
    }
  }
  
  /**
   * Clean up reCAPTCHA
   */
  cleanup(): void {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
      this.recaptchaVerifier = null;
    }
  }
}

export const phoneAuthService = new PhoneAuthService();






