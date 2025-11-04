/**
 * Payment Processor
 * Centralized payment validation and state management
 * COMMENT: PRODUCTION HARDENING - Task 2.6 - PaymentProcessor validates inputs and handles all payment states
 */

import { logger } from '../utils/logger';

/**
 * Payment States
 */
export type PaymentState = 
  | 'idle'           // Initial state
  | 'validating'     // Validating inputs
  | 'pending'        // Payment initiated, awaiting PSP response
  | 'processing'     // Payment being processed by PSP
  | 'completed'      // Payment successful
  | 'failed'         // Payment failed
  | 'cancelled'      // Payment cancelled by user
  | 'refunded'       // Payment refunded
  | 'expired';       // Payment expired

/**
 * Payment Validation Result
 */
export interface PaymentValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Payment Input Data
 */
export interface PaymentInputData {
  amount: number;
  orderId: string;
  jobId?: string;
  freelancerId?: string;
  clientId?: string;
  description?: string;
  currency?: string;
}

/**
 * Payment State Data
 */
export interface PaymentStateData {
  state: PaymentState;
  paymentId?: string;
  transactionId?: string;
  error?: string;
  errorCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment Processor Class
 * Handles payment validation and state management
 */
export class PaymentProcessor {
  // Payment state machine
  private static readonly VALID_STATE_TRANSITIONS: Record<PaymentState, PaymentState[]> = {
    idle: ['validating', 'pending'],
    validating: ['pending', 'failed', 'idle'],
    pending: ['processing', 'failed', 'cancelled', 'expired'],
    processing: ['completed', 'failed', 'cancelled'],
    completed: ['refunded'],
    failed: ['idle', 'pending'], // Allow retry
    cancelled: ['idle', 'pending'], // Allow retry
    refunded: [], // Terminal state
    expired: ['idle', 'pending'], // Allow retry
  };

  // Validation constants
  private static readonly MIN_AMOUNT = 0.01;
  private static readonly MAX_AMOUNT = 1000000;
  private static readonly MAX_DESCRIPTION_LENGTH = 500;
  private static readonly MAX_ORDER_ID_LENGTH = 100;
  private static readonly VALID_CURRENCIES = ['QAR', 'USD', 'EUR', 'SAR', 'AED'];
  private static readonly ORDER_ID_PATTERN = /^[A-Z0-9-_]+$/;

  /**
   * Validate payment input data
   */
  static validatePaymentInput(data: PaymentInputData): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate amount
    if (typeof data.amount !== 'number' || isNaN(data.amount)) {
      errors.push('Amount must be a valid number');
    } else {
      if (data.amount < PaymentProcessor.MIN_AMOUNT) {
        errors.push(`Amount must be at least ${PaymentProcessor.MIN_AMOUNT} QAR`);
      }
      if (data.amount > PaymentProcessor.MAX_AMOUNT) {
        errors.push(`Amount cannot exceed ${PaymentProcessor.MAX_AMOUNT} QAR`);
      }
      
      // Round to 2 decimal places
      const rounded = Math.round(data.amount * 100) / 100;
      if (Math.abs(data.amount - rounded) > 0.001) {
        warnings.push('Amount will be rounded to 2 decimal places');
      }
    }

    // Validate order ID
    if (!data.orderId || typeof data.orderId !== 'string') {
      errors.push('Order ID is required');
    } else {
      if (data.orderId.length > PaymentProcessor.MAX_ORDER_ID_LENGTH) {
        errors.push(`Order ID cannot exceed ${PaymentProcessor.MAX_ORDER_ID_LENGTH} characters`);
      }
      if (!PaymentProcessor.ORDER_ID_PATTERN.test(data.orderId)) {
        errors.push('Order ID can only contain letters, numbers, hyphens, and underscores');
      }
    }

    // Validate job ID (if provided)
    if (data.jobId !== undefined) {
      if (typeof data.jobId !== 'string' || data.jobId.trim().length === 0) {
        errors.push('Job ID must be a non-empty string if provided');
      }
    }

    // Validate freelancer ID (if provided)
    if (data.freelancerId !== undefined) {
      if (typeof data.freelancerId !== 'string' || data.freelancerId.trim().length === 0) {
        errors.push('Freelancer ID must be a non-empty string if provided');
      }
    }

    // Validate client ID (if provided)
    if (data.clientId !== undefined) {
      if (typeof data.clientId !== 'string' || data.clientId.trim().length === 0) {
        errors.push('Client ID must be a non-empty string if provided');
      }
    }

    // Validate description (if provided)
    if (data.description !== undefined) {
      if (typeof data.description !== 'string') {
        errors.push('Description must be a string');
      } else if (data.description.length > PaymentProcessor.MAX_DESCRIPTION_LENGTH) {
        errors.push(`Description cannot exceed ${PaymentProcessor.MAX_DESCRIPTION_LENGTH} characters`);
      }
    }

    // Validate currency (if provided)
    if (data.currency !== undefined) {
      if (!PaymentProcessor.VALID_CURRENCIES.includes(data.currency)) {
        errors.push(`Currency must be one of: ${PaymentProcessor.VALID_CURRENCIES.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate payment state transition
   */
  static canTransitionState(
    currentState: PaymentState,
    newState: PaymentState
  ): { allowed: boolean; reason?: string } {
    const allowedStates = PaymentProcessor.VALID_STATE_TRANSITIONS[currentState];

    if (!allowedStates) {
      return {
        allowed: false,
        reason: `Invalid current state: ${currentState}`,
      };
    }

    if (allowedStates.includes(newState)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: `Cannot transition from ${currentState} to ${newState}. Valid transitions: ${allowedStates.join(', ')}`,
    };
  }

  /**
   * Sanitize payment input data
   */
  static sanitizePaymentInput(data: PaymentInputData): PaymentInputData {
    return {
      amount: Math.round(data.amount * 100) / 100, // Round to 2 decimals
      orderId: (data.orderId || '').trim(),
      jobId: data.jobId?.trim(),
      freelancerId: data.freelancerId?.trim(),
      clientId: data.clientId?.trim(),
      description: data.description?.trim().substring(0, PaymentProcessor.MAX_DESCRIPTION_LENGTH),
      currency: data.currency?.toUpperCase() || 'QAR',
    };
  }

  /**
   * Get payment state display info
   */
  static getStateDisplayInfo(state: PaymentState): {
    label: string;
    color: string;
    icon: string;
    canRetry: boolean;
  } {
    const stateInfo: Record<PaymentState, { label: string; color: string; icon: string; canRetry: boolean }> = {
      idle: { label: 'Ready', color: '#888', icon: '⏸️', canRetry: false },
      validating: { label: 'Validating', color: '#FFA500', icon: '🔍', canRetry: false },
      pending: { label: 'Pending', color: '#FFA500', icon: '⏳', canRetry: false },
      processing: { label: 'Processing', color: '#0066FF', icon: '⚙️', canRetry: false },
      completed: { label: 'Completed', color: '#00AA00', icon: '✅', canRetry: false },
      failed: { label: 'Failed', color: '#FF0000', icon: '❌', canRetry: true },
      cancelled: { label: 'Cancelled', color: '#888', icon: '🚫', canRetry: true },
      refunded: { label: 'Refunded', color: '#888', icon: '↩️', canRetry: false },
      expired: { label: 'Expired', color: '#FF6600', icon: '⏰', canRetry: true },
    };

    return stateInfo[state] || { label: 'Unknown', color: '#888', icon: '❓', canRetry: false };
  }

  /**
   * Check if payment can be retried
   */
  static canRetryPayment(state: PaymentState): boolean {
    return PaymentProcessor.getStateDisplayInfo(state).canRetry;
  }

  /**
   * Validate payment state data
   */
  static validatePaymentState(data: PaymentStateData): PaymentValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.state) {
      errors.push('Payment state is required');
    } else if (!Object.keys(PaymentProcessor.VALID_STATE_TRANSITIONS).includes(data.state)) {
      errors.push(`Invalid payment state: ${data.state}`);
    }

    if (data.state === 'failed' || data.state === 'cancelled') {
      if (!data.error && !data.errorCode) {
        warnings.push('Error details missing for failed/cancelled payment');
      }
    }

    if (data.state === 'completed' || data.state === 'processing') {
      if (!data.paymentId && !data.transactionId) {
        warnings.push('Payment ID or transaction ID missing');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Format payment error message
   */
  static formatPaymentError(error: any): string {
    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      return error.message;
    }

    if (error?.message) {
      return error.message;
    }

    if (error?.error) {
      return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
    }

    return 'An unknown payment error occurred';
  }

  /**
   * Get payment error code from error
   */
  static getPaymentErrorCode(error: any): string | undefined {
    if (typeof error === 'object' && error !== null) {
      return error.errorCode || error.code || error.status || undefined;
    }
    return undefined;
  }

  /**
   * Log payment state change
   */
  static logStateChange(
    currentState: PaymentState,
    newState: PaymentState,
    paymentId?: string,
    reason?: string
  ): void {
    const transition = PaymentProcessor.canTransitionState(currentState, newState);
    
    if (transition.allowed) {
      logger.info(`Payment state changed: ${currentState} → ${newState}`, {
        paymentId,
        reason,
      });
    } else {
      logger.error(`Invalid payment state transition attempted: ${currentState} → ${newState}`, {
        paymentId,
        reason: transition.reason,
      });
    }
  }
}

/**
 * Payment Processor Hook Helper
 * For React components
 */
export const usePaymentProcessor = () => {
  return {
    validate: PaymentProcessor.validatePaymentInput,
    sanitize: PaymentProcessor.sanitizePaymentInput,
    canTransition: PaymentProcessor.canTransitionState,
    getStateInfo: PaymentProcessor.getStateDisplayInfo,
    canRetry: PaymentProcessor.canRetryPayment,
    formatError: PaymentProcessor.formatPaymentError,
    getErrorCode: PaymentProcessor.getPaymentErrorCode,
    logStateChange: PaymentProcessor.logStateChange,
  };
};

/**
 * Export constants for external use
 */
export const PAYMENT_CONSTANTS = {
  MIN_AMOUNT: PaymentProcessor.MIN_AMOUNT,
  MAX_AMOUNT: PaymentProcessor.MAX_AMOUNT,
  MAX_DESCRIPTION_LENGTH: PaymentProcessor.MAX_DESCRIPTION_LENGTH,
  MAX_ORDER_ID_LENGTH: PaymentProcessor.MAX_ORDER_ID_LENGTH,
  VALID_CURRENCIES: PaymentProcessor.VALID_CURRENCIES,
};

export default PaymentProcessor;

