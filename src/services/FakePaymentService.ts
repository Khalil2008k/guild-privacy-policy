/**
 * Fake Payment Service - DISABLED
 * Real coin system now implemented - this service is deprecated
 * All payments now use real Guild Coins through RealPaymentContext
 *
 * DEPRECATED: Use RealPaymentContext instead
 *
 * MIGRATION GUIDE:
 * - Replace fakePaymentService.getWallet() with useRealPayment().wallet
 * - Replace fakePaymentService.processPayment() with useRealPayment().processPayment()
 * - All coin operations now go through RealPaymentContext
 */

import { CustomAlertService } from './CustomAlertService';

// DEPRECATED: This service is disabled
// All functionality moved to RealPaymentContext
export const fakePaymentService = {
  // Placeholder - do not use
  isDisabled: true,
  message: 'FakePaymentService is deprecated. Use RealPaymentContext instead.',
  error: () => {
    throw new Error('FakePaymentService is deprecated. Use RealPaymentContext for all coin operations.');
  }
};

// DEPRECATED: All interfaces moved to RealPaymentContext
// These interfaces are kept for backwards compatibility but should not be used
export interface FakeWallet {
  userId: string;
  balance: number;
  currency: 'Guild Coins' | 'QR';
  transactions: FakeTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FakeTransaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  jobId?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  reference?: string;
}

export interface FakePaymentRequest {
  amount: number;
  jobId: string;
  description: string;
  recipientId: string;
}

export interface FakePaymentResponse {
  success: boolean;
  transactionId: string;
  newBalance: number;
  message: string;
}

// DEPRECATED SERVICE END
// All old implementation removed
// Use RealPaymentContext instead for all coin operations
