/**
 * Coin Wallet API Client
 * Complete API integration for coin wallet operations
 */

import { BackendAPI } from '../config/backend';

export interface CoinBalances {
  GBC?: number;
  GSC?: number;
  GGC?: number;
  GPC?: number;
  GDC?: number;
  GRC?: number;
  [key: string]: number | undefined;
}

export interface UserWallet {
  userId: string;
  balances: CoinBalances;
  totalValueQAR: number;
  totalCoins: number;
  lastActivity: Date;
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  stats: {
    totalPurchased: number;
    totalSpent: number;
    totalReceived: number;
    totalWithdrawn: number;
    purchaseCount: number;
    jobsPosted: number;
    jobsCompleted: number;
    withdrawalCount: number;
  };
  pendingWithdrawal?: any;
}

export interface CoinTransaction {
  id: string;
  type: 'credit' | 'debit';
  coins: Record<string, number>;
  qarValue: number;
  description: string;
  createdAt: string;
  status: string;
  metadata?: any;
}

class CoinWalletAPIClientClass {
  /**
   * Get user's coin balance
   */
  async getBalance(): Promise<any> {
    try {
      const response = await BackendAPI.get('/api/coins/balance');
      return response;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  /**
   * Get user's coin wallet
   */
  async getWallet(): Promise<UserWallet> {
    try {
      const response = await BackendAPI.get('/api/coins/wallet');
      return response.data;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(limit: number = 50): Promise<{ transactions: CoinTransaction[] }> {
    try {
      const response = await BackendAPI.get(`/api/coins/transactions?limit=${limit}`);
      return response;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return { transactions: [] };
    }
  }

  /**
   * Get coin catalog
   */
  async getCoinCatalog() {
    try {
      const response = await BackendAPI.get('/coins/catalog');
      return response;
    } catch (error) {
      console.error('Error getting coin catalog:', error);
      throw error;
    }
  }

  /**
   * Check if user has sufficient coins
   */
  async checkBalance(amount: number): Promise<{
    sufficient: boolean;
    required: Record<string, number>;
    available: Record<string, number>;
    missing: number;
  }> {
    try {
      const response = await BackendAPI.post('/coins/check-balance', { amount });
      return response;
    } catch (error) {
      console.error('Error checking balance:', error);
      throw error;
    }
  }
}

export const CoinWalletAPIClient = new CoinWalletAPIClientClass();
