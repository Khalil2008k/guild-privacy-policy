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
      const response = await BackendAPI.post('/coins/purchase', {
        coins,
        paymentMethod: 'fatora', // Default to Fatora PSP
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
      const response = await BackendAPI.get('/coins/catalog');
      return response;
    } catch (error) {
      console.error('Error fetching coin catalog:', error);
      throw error;
    }
  }
}
