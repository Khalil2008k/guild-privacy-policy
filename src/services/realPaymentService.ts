/**
 * Real Payment Service
 * Handles real payment system with Guild Coins for beta testing
 * Supports demo mode and PSP API integration
 */

import { BackendAPI } from '../config/backend';
import { CustomAlertService } from './CustomAlertService';

export interface Wallet {
  userId: string;
  balance: number;
  currency: 'Guild Coins' | 'USD' | 'EUR' | 'QR';
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
  isDemoMode: boolean;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'bonus';
  amount: number;
  currency: string;
  description: string;
  jobId?: string;
  recipientId?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  createdAt: Date;
  reference?: string;
  fees?: number;
  netAmount?: number;
}

export interface PaymentRequest {
  amount: number;
  jobId: string;
  description: string;
  recipientId: string;
  currency?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  newBalance: number;
  message: string;
  fees?: number;
}

export interface WithdrawalRequest {
  amount: number;
  currency: string;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: {
    accountNumber?: string;
    routingNumber?: string;
    email?: string;
    accountHolderName?: string;
  };
}

export interface DepositRequest {
  amount: number;
  currency: string;
  method: 'card' | 'bank_transfer' | 'paypal' | 'stripe';
  paymentDetails?: any;
}

class RealPaymentService {
  private readonly INITIAL_BETA_BALANCE = 300; // 300 Guild Coins for beta users
  private readonly BETA_CURRENCY = 'Guild Coins';
  
  /**
   * Get user's wallet
   */
  async getWallet(userId: string): Promise<Wallet | null> {
    try {
      const response = await BackendAPI.get(`/api/v1/payments/wallet/${userId}`);
      if (response.data.success) {
        return response.data.wallet;
      }
      
      // If no wallet exists, create one
      return await this.initializeWallet(userId);
    } catch (error) {
      console.warn('Error getting wallet (using offline mode):', error);
      // Return default wallet for offline mode with proper structure
      return {
        userId,
        balance: this.INITIAL_BETA_BALANCE,
        currency: this.BETA_CURRENCY,
        transactions: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDemoMode: true, // Set to true for offline mode
        available: this.INITIAL_BETA_BALANCE,
        hold: 0,
        released: 0,
        totalEarned: this.INITIAL_BETA_BALANCE,
        totalSpent: 0
      };
    }
  }

  /**
   * Initialize wallet for new user
   */
  async initializeWallet(userId: string): Promise<Wallet> {
    try {
      const wallet: Wallet = {
        userId,
        balance: this.INITIAL_BETA_BALANCE,
        currency: this.BETA_CURRENCY,
        transactions: [
          {
            id: `bonus_${Date.now()}`,
            type: 'bonus',
            amount: this.INITIAL_BETA_BALANCE,
            currency: this.BETA_CURRENCY,
            description: 'Welcome bonus for beta testing',
            status: 'completed',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isDemoMode: false
      };

      await this.saveWallet(wallet);
      return wallet;
    } catch (error) {
      console.error('Error initializing wallet:', error);
      throw new Error('Failed to initialize wallet');
    }
  }

  /**
   * Process payment
   */
  async processPayment(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await BackendAPI.post('/api/v1/payments/process', paymentRequest);
      
      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId,
          newBalance: response.data.newBalance,
          message: response.data.message,
          fees: response.data.fees
        };
      }
      
      throw new Error(response.data.message || 'Payment failed');
    } catch (error) {
      console.error('Error processing payment:', error);
      throw new Error('Payment processing failed');
    }
  }

  /**
   * Request withdrawal
   */
  async requestWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<PaymentResponse> {
    try {
      // Call the correct backend endpoint for wallet withdrawals
      const response = await BackendAPI.post('/api/v1/wallet/withdraw', {
        amount: withdrawalRequest.amount,
        currency: withdrawalRequest.currency || 'QAR',
        withdrawalMethod: withdrawalRequest.method || 'bank_transfer'
      });
      
      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId,
          newBalance: response.data.newBalance,
          message: response.data.message || 'Withdrawal request submitted successfully',
          fees: response.data.fees
        };
      }
      
      throw new Error(response.data.error || 'Withdrawal request failed');
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      
      // If backend is not available, simulate a successful withdrawal request
      if (error instanceof Error && error.message.includes('HTTP 404')) {
        console.warn('Backend not available, simulating withdrawal request');
        return {
          success: true,
          transactionId: `WD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          newBalance: 0, // Will be updated by the app
          message: 'Withdrawal request submitted successfully (offline mode)',
          fees: 0
        };
      }
      
      throw new Error('Withdrawal request failed');
    }
  }

  /**
   * Process deposit
   */
  async processDeposit(depositRequest: DepositRequest): Promise<PaymentResponse> {
    try {
      const response = await BackendAPI.post('/api/v1/payments/deposit', depositRequest);
      
      if (response.data.success) {
        return {
          success: true,
          transactionId: response.data.transactionId,
          newBalance: response.data.newBalance,
          message: response.data.message,
          fees: response.data.fees
        };
      }
      
      throw new Error(response.data.message || 'Deposit failed');
    } catch (error) {
      console.error('Error processing deposit:', error);
      throw new Error('Deposit processing failed');
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const response = await BackendAPI.get(`/api/v1/payments/transactions/${userId}?limit=${limit}`);
      
      if (response.data.success) {
        return response.data.transactions;
      }
      
      return [];
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  /**
   * Get supported payment methods
   */
  async getSupportedPaymentMethods(): Promise<string[]> {
    try {
      const response = await BackendAPI.get('/api/v1/payments/methods');
      
      if (response.data.success) {
        return response.data.methods;
      }
      
      return ['card', 'bank_transfer'];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return ['card', 'bank_transfer'];
    }
  }

  /**
   * Get supported currencies
   */
  async getSupportedCurrencies(): Promise<string[]> {
    try {
      const response = await BackendAPI.get('/api/v1/payments/currencies');
      
      if (response.data.success) {
        return response.data.currencies;
      }
      
      return ['Guild Coins', 'USD', 'EUR', 'QR'];
    } catch (error) {
      console.error('Error getting currencies:', error);
      return ['Guild Coins', 'USD', 'EUR', 'QR'];
    }
  }

  /**
   * Check if demo mode is enabled
   */
  async isDemoModeEnabled(): Promise<boolean> {
    try {
      const response = await BackendAPI.get('/api/v1/payments/demo-mode');
      
      if (response.data.success) {
        return response.data.demoMode;
      }
      
      return false; // Default to production mode
    } catch (error) {
      console.error('Error checking demo mode:', error);
      return false;
    }
  }

  /**
   * Save wallet to backend
   */
  private async saveWallet(wallet: Wallet): Promise<void> {
    try {
      await BackendAPI.post('/api/v1/payments/wallet', wallet);
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw new Error('Failed to save wallet');
    }
  }

  /**
   * Format balance for display
   */
  formatBalance(balance: number, currency: string): string {
    if (currency === 'Guild Coins') {
      return `${balance.toFixed(0)} Guild Coins`;
    }
    return `${currency} ${balance.toFixed(2)}`;
  }

  /**
   * Convert currency
   */
  async convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      const response = await BackendAPI.post('/api/v1/payments/convert', {
        amount,
        fromCurrency,
        toCurrency
      });
      
      if (response.data.success) {
        return response.data.convertedAmount;
      }
      
      return amount; // Fallback to original amount
    } catch (error) {
      console.error('Error converting currency:', error);
      return amount;
    }
  }
}

// Export singleton instance
export const realPaymentService = new RealPaymentService();



