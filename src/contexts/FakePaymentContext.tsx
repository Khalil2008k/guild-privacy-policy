/**
 * Fake Payment Context - DISABLED
 * Real coin system now implemented - this context is deprecated
 * All payments now use real Guild Coins through RealPaymentContext
 *
 * DEPRECATED: Use RealPaymentContext instead
 *
 * MIGRATION GUIDE:
 * - Replace useFakePayment() with useRealPayment()
 * - All coin operations now go through RealPaymentContext
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { CustomAlertService } from '../services/CustomAlertService';

// DEPRECATED: This context is disabled
// All functionality moved to RealPaymentContext

interface FakePaymentContextType {
  wallet: any | null;
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  processPayment: (amount: number, jobId: string, description: string, recipientId: string) => Promise<boolean>;
  awardJobCompletion: (jobId: string, amount?: number) => Promise<boolean>;
  deductJobPosting: (jobId: string, amount?: number) => Promise<boolean>;
  getTransactionHistory: (limit?: number) => Promise<any[]>;
  formatBalance: (balance: number) => string;
  getBalanceDisplay: (balance: number) => string;
}

const FakePaymentContext = createContext<FakePaymentContextType | undefined>(undefined);

interface FakePaymentProviderProps {
  children: ReactNode;
}

export const FakePaymentProvider: React.FC<FakePaymentProviderProps> = ({ children }) => {
  // DEPRECATED: This provider is disabled
  // All functionality moved to RealPaymentProvider

  const fakeContext: FakePaymentContextType = {
    wallet: null,
    isLoading: false,
    refreshWallet: async () => {
      throw new Error('FakePaymentContext is deprecated. Use RealPaymentContext instead.');
    },
    processPayment: async () => {
      throw new Error('FakePaymentContext is deprecated. Use RealPaymentContext instead.');
    },
    awardJobCompletion: async () => {
      throw new Error('FakePaymentContext is deprecated. Use RealPaymentContext instead.');
    },
    deductJobPosting: async () => {
      throw new Error('FakePaymentContext is deprecated. Use RealPaymentContext instead.');
    },
    getTransactionHistory: async () => {
      throw new Error('FakePaymentContext is deprecated. Use RealPaymentContext instead.');
    },
    formatBalance: () => 'DEPRECATED',
    getBalanceDisplay: () => 'DEPRECATED'
  };

  return (
    <FakePaymentContext.Provider value={fakeContext}>
      {children}
    </FakePaymentContext.Provider>
  );
};

export const useFakePayment = (): FakePaymentContextType => {
  const context = useContext(FakePaymentContext);
  if (context === undefined) {
    throw new Error('useFakePayment must be used within a FakePaymentProvider');
  }
  return context;
};
