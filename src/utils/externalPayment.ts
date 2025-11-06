/**
 * External Payment Utility
 * 🍎 Apple Compliance: Opens payment in external browser (Safari) for iOS
 * Prevents App Store rejection for using non-Apple payment systems
 * 
 * Apple Guideline 3.1.1: All digital purchases must use IAP or external browser
 */

import { Platform, Linking, Alert } from 'react-native';
import { logger } from './logger';

/**
 * Open payment URL in external browser
 * iOS: Opens in Safari (external)
 * Android: Can use external browser or WebView (configurable)
 */
export const openExternalPayment = async (
  paymentUrl: string,
  orderId: string,
  onSuccess?: (transactionId: string, orderId: string) => void,
  onFailure?: (error: string) => void
): Promise<void> => {
  try {
    if (Platform.OS === 'ios') {
      // 🍎 iOS: Must use external browser (Safari) for Apple compliance
      logger.info('🍎 Opening payment in Safari (external browser) for iOS compliance');
      
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        logger.info('✅ Payment opened in Safari');
      } else {
        logger.error('❌ Cannot open payment URL:', paymentUrl);
        Alert.alert(
          'Payment Error',
          'Unable to open payment page. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        onFailure?.('Cannot open payment URL');
      }
    } else {
      // Android: Can use external browser or WebView (configurable)
      // For consistency, we'll also use external browser on Android
      logger.info('🤖 Opening payment in external browser (Android)');
      
      const canOpen = await Linking.canOpenURL(paymentUrl);
      if (canOpen) {
        await Linking.openURL(paymentUrl);
        logger.info('✅ Payment opened in external browser');
      } else {
        logger.error('❌ Cannot open payment URL:', paymentUrl);
        Alert.alert(
          'Payment Error',
          'Unable to open payment page. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        onFailure?.('Cannot open payment URL');
      }
    }
  } catch (error: any) {
    logger.error('❌ Error opening external payment:', error);
    Alert.alert(
      'Payment Error',
      'Failed to open payment page. Please try again.',
      [{ text: 'OK' }]
    );
    onFailure?.(error.message || 'Failed to open payment');
  }
};

/**
 * Check if platform requires external browser
 * iOS: Always requires external browser
 * Android: Optional (can use WebView or external browser)
 */
export const requiresExternalBrowser = (): boolean => {
  return Platform.OS === 'ios';
};

/**
 * Get deep link URL for payment return
 * Used by backend to redirect user back to app after payment
 */
export const getPaymentDeepLink = (
  type: 'success' | 'failure' | 'cancel',
  transactionId?: string,
  orderId?: string,
  error?: string
): string => {
  const baseUrl = 'guild://payment';
  
  switch (type) {
    case 'success':
      return `${baseUrl}/success?transaction_id=${transactionId || ''}&order_id=${orderId || ''}`;
    case 'failure':
      return `${baseUrl}/failure?order_id=${orderId || ''}&error=${encodeURIComponent(error || 'Payment failed')}`;
    case 'cancel':
      return `${baseUrl}/cancel?order_id=${orderId || ''}`;
    default:
      return `${baseUrl}/cancel?order_id=${orderId || ''}`;
  }
};

/**
 * Parse deep link parameters
 * 🔒 SECURITY: Enhanced with validation and sanitization
 */
export const parsePaymentDeepLink = (url: string): {
  type: 'success' | 'failure' | 'cancel';
  transactionId?: string;
  orderId?: string;
  error?: string;
  valid: boolean;
  reason?: string;
} | null => {
  try {
    // 🔒 SECURITY: Validate deep link format
    if (!url || typeof url !== 'string') {
      logger.error('❌ Invalid deep link: URL is not a string');
      return null;
    }

    if (!url.includes('guild://payment')) {
      return null;
    }

    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // 🔒 SECURITY: Validate transaction_id and order_id format
    const transactionId = urlObj.searchParams.get('transaction_id');
    const orderId = urlObj.searchParams.get('order_id');
    
    // Validate format: alphanumeric, 8-64 characters
    const idRegex = /^[a-zA-Z0-9_-]{8,64}$/;
    
    if (transactionId && !idRegex.test(transactionId)) {
      logger.error('❌ Invalid transaction_id format:', transactionId);
      return {
        type: 'success',
        valid: false,
        reason: 'Invalid transaction_id format'
      };
    }
    
    if (orderId && !idRegex.test(orderId)) {
      logger.error('❌ Invalid order_id format:', orderId);
      return {
        type: 'success',
        valid: false,
        reason: 'Invalid order_id format'
      };
    }
    
    if (path.includes('/success')) {
      return {
        type: 'success',
        transactionId: transactionId || undefined,
        orderId: orderId || undefined,
        valid: true
      };
    } else if (path.includes('/failure')) {
      // 🔒 SECURITY: Sanitize error message
      const error = urlObj.searchParams.get('error');
      const sanitizedError = error ? decodeURIComponent(error).substring(0, 200) : undefined;
      
      return {
        type: 'failure',
        orderId: orderId || undefined,
        error: sanitizedError,
        valid: true
      };
    } else if (path.includes('/cancel')) {
      return {
        type: 'cancel',
        orderId: orderId || undefined,
        valid: true
      };
    }

    return null;
  } catch (error) {
    logger.error('❌ Error parsing payment deep link:', error);
    return null;
  }
};

