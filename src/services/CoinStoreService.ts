/**
 * Coin Store Service
 * Handles coin purchase API calls
 */

import { BackendAPI } from '../config/backend';

export interface PurchaseCoinsRequest {
  coins: { [symbol: string]: number };
  paymentMethod?: string;
}

export interface PurchaseCoinsResponse {
  success: boolean;
  data?: {
    transactionId: string;
    coins: { [symbol: string]: number };
    totalQAR: number;
    paymentUrl?: string;
  };
  error?: string;
}

export class CoinStoreService {
  /**
   * Purchase coins from the store
   */
  static async purchaseCoins(coins: { [symbol: string]: number }): Promise<any> {
    try {
      // ✅ FIX: Use /api/coins/purchase instead of /coins/purchase
      const response = await BackendAPI.post('/api/coins/purchase', {
        coins,
        paymentMethod: 'sadad', // ✅ SADAD: Updated to Sadad PSP
      });

      return response;
    } catch (error: any) {
      console.error('Error purchasing coins:', error);
      throw new Error(error.message || 'Failed to purchase coins');
    }
  }

  /**
   * Get coin catalog
   */
  static async getCoinCatalog() {
    try {
      // ✅ FIX: Use /api/coins/catalog instead of /coins/catalog
      const response = await BackendAPI.get('/api/coins/catalog');
      return response;
    } catch (error) {
      console.error('Error fetching coin catalog:', error);
      throw error;
    }
  }
}
