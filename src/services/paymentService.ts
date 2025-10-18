/**
 * Payment Service
 * Handles payment initiation and verification with Fatora PSP
 * Integrates with backend Fatora API
 */

import { BackendAPI } from '../config/backend';
import { getAuth } from 'firebase/auth';
import { logger } from '../utils/logger';

export interface PaymentRequest {
  amount: number;
  orderId: string;
  jobId?: string;
  freelancerId?: string;
  clientId?: string;
  description?: string;
  language?: 'en' | 'ar';
}

export interface PaymentResponse {
  success: boolean;
  checkout_url?: string;
  payment_url?: string;
  payment_id?: string;
  error?: string;
  message?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  status?: 'pending' | 'completed' | 'failed';
  amount?: number;
  order_id?: string;
  error?: string;
}

/**
 * Initiate payment with Fatora
 * Creates a checkout session and returns the payment URL
 */
export const initiatePayment = async (
  request: PaymentRequest
): Promise<PaymentResponse> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      logger.error('User not authenticated for payment');
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    logger.info('💳 Initiating payment:', {
      amount: request.amount,
      orderId: request.orderId
    });

    // Get FCM token for push notifications (optional)
    let fcmToken: string | undefined;
    try {
      // Note: Requires @react-native-firebase/messaging
      // const messaging = await import('@react-native-firebase/messaging');
      // fcmToken = await messaging.default().getToken();
      // logger.debug('FCM token obtained for push notifications');
    } catch (error) {
      logger.warn('Failed to get FCM token (push notifications disabled):', error);
    }

    // Call backend to create Fatora checkout
    const response = await BackendAPI.post('/payments/create', {
      amount: request.amount,
      orderId: request.orderId,
      userId: user.uid,
      clientName: user.displayName || 'GUILD User',
      clientPhone: user.phoneNumber || '',
      clientEmail: user.email || '',
      fcmToken: fcmToken,
      jobId: request.jobId,
      freelancerId: request.freelancerId,
      clientId: request.clientId,
      note: request.description || `GUILD Payment - ${request.orderId}`,
      language: request.language || 'en'
    });

    if (response && response.success) {
      const paymentUrl = response.payment_url || response.checkout_url;
      
      if (!paymentUrl) {
        logger.error('No payment URL in response:', response);
        return {
          success: false,
          error: 'Payment URL not received from server'
        };
      }

      logger.info('✅ Payment checkout created:', response.payment_id);
      
      return {
        success: true,
        checkout_url: paymentUrl,
        payment_url: paymentUrl,
        payment_id: response.payment_id,
        message: 'Payment checkout created successfully'
      };
    }

    logger.error('Payment initiation failed:', response);
    return {
      success: false,
      error: response?.error || response?.message || 'Payment initialization failed'
    };

  } catch (error: any) {
    logger.error('Payment initiation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to initialize payment'
    };
  }
};

/**
 * Verify payment status
 * Checks the payment status with backend/Fatora
 */
export const verifyPayment = async (
  paymentId: string
): Promise<PaymentVerificationResult> => {
  try {
    logger.info('🔍 Verifying payment:', paymentId);

    const response = await BackendAPI.get(`/payments/verify/${paymentId}`);
    
    if (response && response.success) {
      logger.info('✅ Payment verified:', {
        status: response.status,
        orderId: response.order_id
      });

      return {
        success: true,
        status: response.status,
        amount: response.amount,
        order_id: response.order_id
      };
    }

    logger.warn('Payment verification failed:', response);
    return {
      success: false,
      error: response?.error || 'Payment verification failed'
    };

  } catch (error: any) {
    logger.error('Payment verification error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify payment'
    };
  }
};

/**
 * Get payment status
 * Similar to verify but returns more detailed status
 */
export const getPaymentStatus = async (
  paymentId: string
): Promise<PaymentVerificationResult> => {
  try {
    logger.info('📊 Getting payment status:', paymentId);

    const response = await BackendAPI.get(`/payments/status/${paymentId}`);
    
    if (response && response.success) {
      return {
        success: true,
        status: response.status,
        amount: response.amount,
        order_id: response.order_id
      };
    }

    return {
      success: false,
      error: response?.error || 'Failed to get payment status'
    };

  } catch (error: any) {
    logger.error('Get payment status error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get payment status'
    };
  }
};

/**
 * Generate order ID
 * Creates a unique order ID for payment tracking
 */
export const generateOrderId = (prefix: string = 'ORD'): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Format amount for display
 */
export const formatAmount = (amount: number, currency: string = 'QAR'): string => {
  return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Validate payment amount
 */
export const validatePaymentAmount = (amount: number): { valid: boolean; error?: string } => {
  if (!amount || isNaN(amount)) {
    return { valid: false, error: 'Invalid amount' };
  }

  if (amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' };
  }

  if (amount > 1000000) {
    return { valid: false, error: 'Amount exceeds maximum limit' };
  }

  return { valid: true };
};
