import { BackendAPI } from '@/config/backend';

export interface CoinBalances {
  GBC: number;
  GSC: number;
  GGC: number;
  GPC: number;
  GDC: number;
  GRC: number;
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
  type: string;
  coins: Record<string, number>;
  qarValue: number;
  description: string;
  timestamp: Date;
  status: string;
}

class CoinWalletAPIClient {
  /**
   * Get user's coin wallet
   */
  async getWallet(): Promise<UserWallet> {
    try {
      const response = await BackendAPI.get('/coins/wallet');
      return response.data.data;
    } catch (error) {
      console.error('Error getting wallet:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactions(limit: number = 20): Promise<CoinTransaction[]> {
    try {
      const response = await BackendAPI.get('/coins/transactions', {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting transactions:', error);
      throw error;
    }
  }

  /**
   * Get coin catalog
   */
  async getCoinCatalog() {
    try {
      const response = await BackendAPI.get('/coins/catalog');
      return response.data.data;
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
      return response.data.data;
    } catch (error) {
      console.error('Error checking balance:', error);
      throw error;
    }
  }
}

export const coinWalletAPIClient = new CoinWalletAPIClient();

