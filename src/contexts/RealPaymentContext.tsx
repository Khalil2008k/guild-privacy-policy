/**
 * Real Payment Context
 * Manages real payment system with Guild Coins for beta testing
 * Supports demo mode and PSP API integration
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { realPaymentService, Wallet, Transaction } from '../services/realPaymentService';
import { useAuth } from './AuthContext';
import { CustomAlertService } from '../services/CustomAlertService';

interface RealPaymentContextType {
  wallet: Wallet | null;
  isLoading: boolean;
  isDemoMode: boolean;
  refreshWallet: () => Promise<void>;
  processPayment: (amount: number, jobId: string, description: string, recipientId: string) => Promise<boolean>;
  requestWithdrawal: (amount: number, currency: string, method: string, accountDetails: any) => Promise<boolean>;
  processDeposit: (amount: number, currency: string, method: string, paymentDetails?: any) => Promise<boolean>;
  getTransactionHistory: (limit?: number) => Promise<Transaction[]>;
  formatBalance: (balance: number, currency: string) => string;
  getSupportedPaymentMethods: () => Promise<string[]>;
  getSupportedCurrencies: () => Promise<string[]>;
  convertCurrency: (amount: number, fromCurrency: string, toCurrency: string) => Promise<number>;
}

const RealPaymentContext = createContext<RealPaymentContextType | undefined>(undefined);

interface RealPaymentProviderProps {
  children: ReactNode;
}

export const RealPaymentProvider: React.FC<RealPaymentProviderProps> = ({ children }) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const { user } = useAuth();

  // Load wallet when user changes and is authenticated
  useEffect(() => {
    if (user?.uid && user.emailVerified) {
      loadWallet();
      checkDemoMode();
    } else {
      setWallet(null);
      setIsLoading(false);
    }
  }, [user?.uid, user?.emailVerified]);

  const loadWallet = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const userWallet = await realPaymentService.getWallet(user.uid);
      setWallet(userWallet);
    } catch (error) {
      console.warn('Error loading wallet (using offline mode):', error);
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

  const checkDemoMode = async () => {
    try {
      const demoMode = await realPaymentService.isDemoModeEnabled();
      setIsDemoMode(demoMode);
    } catch (error) {
      console.error('Error checking demo mode:', error);
      setIsDemoMode(true); // Default to demo mode
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
    try {
      const result = await realPaymentService.processPayment({
        amount,
        jobId,
        description,
        recipientId
      });

      if (result.success) {
        // Update local wallet balance
        if (wallet) {
          setWallet({
            ...wallet,
            balance: result.newBalance,
            updatedAt: new Date()
          });
        }
        
        CustomAlertService.showSuccess(
          'Payment Successful',
          result.message
        );
        return true;
      }
      
      throw new Error(result.message || 'Payment failed');
    } catch (error) {
      console.error('Error processing payment:', error);
      CustomAlertService.showError(
        'Payment Failed',
        error.message || 'Payment processing failed'
      );
      return false;
    }
  };

  const requestWithdrawal = async (
    amount: number,
    currency: string,
    method: string,
    accountDetails: any
  ): Promise<boolean> => {
    try {
      const result = await realPaymentService.requestWithdrawal({
        amount,
        currency,
        method,
        accountDetails
      });

      if (result.success) {
        CustomAlertService.showSuccess(
          'Withdrawal Requested',
          result.message
        );
        return true;
      }
      
      throw new Error(result.message || 'Withdrawal request failed');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      CustomAlertService.showError(
        'Withdrawal Failed',
        error.message || 'Withdrawal request failed'
      );
      return false;
    }
  };

  const processDeposit = async (
    amount: number,
    currency: string,
    method: string,
    paymentDetails?: any
  ): Promise<boolean> => {
    try {
      const result = await realPaymentService.processDeposit({
        amount,
        currency,
        method,
        paymentDetails
      });

      if (result.success) {
        // Update local wallet balance
        if (wallet) {
          setWallet({
            ...wallet,
            balance: result.newBalance,
            updatedAt: new Date()
          });
        }
        
        CustomAlertService.showSuccess(
          'Deposit Successful',
          result.message
        );
        return true;
      }
      
      throw new Error(result.message || 'Deposit failed');
    } catch (error) {
      console.error('Error processing deposit:', error);
      CustomAlertService.showError(
        'Deposit Failed',
        error.message || 'Deposit processing failed'
      );
      return false;
    }
  };

  const getTransactionHistory = async (limit: number = 50): Promise<Transaction[]> => {
    try {
      if (!user?.uid) return [];
      
      const transactions = await realPaymentService.getTransactionHistory(user.uid, limit);
      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  };

  const formatBalance = (balance: number, currency: string): string => {
    return realPaymentService.formatBalance(balance, currency);
  };

  const getSupportedPaymentMethods = async (): Promise<string[]> => {
    try {
      return await realPaymentService.getSupportedPaymentMethods();
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return ['card', 'bank_transfer'];
    }
  };

  const getSupportedCurrencies = async (): Promise<string[]> => {
    try {
      return await realPaymentService.getSupportedCurrencies();
    } catch (error) {
      console.error('Error getting currencies:', error);
      return ['Guild Coins', 'USD', 'EUR', 'QR'];
    }
  };

  const convertCurrency = async (
    amount: number, 
    fromCurrency: string, 
    toCurrency: string
  ): Promise<number> => {
    try {
      return await realPaymentService.convertCurrency(amount, fromCurrency, toCurrency);
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount; // Return original amount as fallback
    }
  };

  const value: RealPaymentContextType = {
    wallet,
    isLoading,
    isDemoMode,
    refreshWallet,
    processPayment,
    requestWithdrawal,
    processDeposit,
    getTransactionHistory,
    formatBalance,
    getSupportedPaymentMethods,
    getSupportedCurrencies,
    convertCurrency
  };

  return (
    <RealPaymentContext.Provider value={value}>
      {children}
    </RealPaymentContext.Provider>
  );
};

export const useRealPayment = (): RealPaymentContextType => {
  const context = useContext(RealPaymentContext);
  if (context === undefined) {
    throw new Error('useRealPayment must be used within a RealPaymentProvider');
  }
  return context;
};



