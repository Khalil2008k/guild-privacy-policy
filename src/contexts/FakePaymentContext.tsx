/**
 * Fake Payment Context - For Beta Testing
 * Manages fake payment system with Guild Coins
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fakePaymentService, FakeWallet, FakeTransaction } from '../services/FakePaymentService';
import { useAuth } from './AuthContext';
import { CustomAlertService } from '../services/CustomAlertService';

interface FakePaymentContextType {
  wallet: FakeWallet | null;
  isLoading: boolean;
  refreshWallet: () => Promise<void>;
  processPayment: (amount: number, jobId: string, description: string, recipientId: string) => Promise<boolean>;
  awardJobCompletion: (jobId: string, amount?: number) => Promise<boolean>;
  deductJobPosting: (jobId: string, amount?: number) => Promise<boolean>;
  getTransactionHistory: (limit?: number) => Promise<FakeTransaction[]>;
  formatBalance: (balance: number) => string;
  getBalanceDisplay: (balance: number) => string;
}

const FakePaymentContext = createContext<FakePaymentContextType | undefined>(undefined);

interface FakePaymentProviderProps {
  children: ReactNode;
}

export const FakePaymentProvider: React.FC<FakePaymentProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<FakeWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Load wallet when user changes and is authenticated
  useEffect(() => {
    if (user?.uid && user.emailVerified) {
      loadWallet();
    } else {
      setWallet(null);
      setIsLoading(false);
    }
  }, [user?.uid, user?.emailVerified]);

  const loadWallet = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const userWallet = await fakePaymentService.getWallet(user.uid);
      setWallet(userWallet);
    } catch (error) {
      console.warn('Error loading fake wallet (using offline mode):', error);
      // Don't show error alert for authentication issues - just use offline mode
      if (!error.message?.includes('HTTP 401')) {
        CustomAlertService.showError(
          'Error',
          'Failed to load wallet. Using offline mode.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshWallet = async () => {
    await loadWallet();
  };

  const processPayment = async (
    amount: number, 
    jobId: string, 
    description: string, 
    recipientId: string
  ): Promise<boolean> => {
    if (!user?.uid) {
      CustomAlertService.showError('Error', 'User not authenticated');
      return false;
    }

    try {
      const result = await fakePaymentService.processPayment({
        amount,
        jobId,
        description,
        recipientId
      });

      if (result.success) {
        await refreshWallet();
        CustomAlertService.showSuccess(
          'Payment Successful',
          result.message
        );
        return true;
      } else {
        CustomAlertService.showError(
          'Payment Failed',
          result.message
        );
        return false;
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      CustomAlertService.showError(
        'Payment Error',
        'Failed to process payment'
      );
      return false;
    }
  };

  const awardJobCompletion = async (jobId: string, amount: number = 50): Promise<boolean> => {
    if (!user?.uid) {
      CustomAlertService.showError('Error', 'User not authenticated');
      return false;
    }

    try {
      const result = await fakePaymentService.awardJobCompletion(user.uid, jobId, amount);

      if (result.success) {
        await refreshWallet();
        CustomAlertService.showSuccess(
          'Reward Earned!',
          result.message
        );
        return true;
      } else {
        CustomAlertService.showError(
          'Reward Failed',
          result.message
        );
        return false;
      }
    } catch (error) {
      console.error('Error awarding job completion:', error);
      CustomAlertService.showError(
        'Reward Error',
        'Failed to award job completion'
      );
      return false;
    }
  };

  const deductJobPosting = async (jobId: string, amount: number = 25): Promise<boolean> => {
    if (!user?.uid) {
      CustomAlertService.showError('Error', 'User not authenticated');
      return false;
    }

    try {
      const result = await fakePaymentService.deductJobPosting(user.uid, jobId, amount);

      if (result.success) {
        await refreshWallet();
        CustomAlertService.showSuccess(
          'Job Posted!',
          result.message
        );
        return true;
      } else {
        CustomAlertService.showError(
          'Posting Failed',
          result.message
        );
        return false;
      }
    } catch (error) {
      console.error('Error deducting job posting fee:', error);
      CustomAlertService.showError(
        'Posting Error',
        'Failed to process job posting fee'
      );
      return false;
    }
  };

  const getTransactionHistory = async (limit: number = 50): Promise<FakeTransaction[]> => {
    if (!user?.uid) return [];

    try {
      return await fakePaymentService.getTransactionHistory(user.uid, limit);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  };

  const formatBalance = (balance: number): string => {
    return fakePaymentService.formatBalance(balance);
  };

  const getBalanceDisplay = (balance: number): string => {
    return fakePaymentService.getBalanceDisplay(balance);
  };

  const value: FakePaymentContextType = {
    wallet,
    isLoading,
    refreshWallet,
    processPayment,
    awardJobCompletion,
    deductJobPosting,
    getTransactionHistory,
    formatBalance,
    getBalanceDisplay,
  };

  return (
    <FakePaymentContext.Provider value={value}>
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


