import { BackendAPI } from '@/config/backend';

export interface CoinPack {
  coins: Record<string, number>;
  value: number;
  price: number;
}

export interface PurchaseResult {
  purchaseId: string;
  paymentUrl: string;
  coins: Record<string, number>;
  coinValue: number;
  purchasePrice: number;
  pspFee: number;
  platformRevenue: number;
}

class CoinStoreService {
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
   * Create coin purchase
   */
  async createPurchase(data: {
    coins?: Record<string, number>;
    customAmount?: number;
  }): Promise<PurchaseResult> {
    try {
      const response = await BackendAPI.post('/coins/purchase', data);
      return response.data.data;
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  /**
   * Get purchase by ID
   */
  async getPurchase(purchaseId: string) {
    try {
      const response = await BackendAPI.get(`/coins/purchase/${purchaseId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting purchase:', error);
      throw error;
    }
  }

  /**
   * Get purchase history
   */
  async getPurchaseHistory(limit: number = 20) {
    try {
      const response = await BackendAPI.get('/coins/purchases', {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting purchase history:', error);
      throw error;
    }
  }
}

export const coinStoreService = new CoinStoreService();

