/**
 * Apple In-App Purchase Service
 * 
 * Handles iOS IAP for Guild Coins
 * Apple Guideline 3.1.1 Compliance
 */

import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getProducts,
  requestPurchase,
  finishTransaction,
  PurchaseError,
  Product,
  Purchase,
  SubscriptionPurchase
} from 'react-native-iap';
import { logger } from '../utils/logger';
import { BackendAPI } from '../config/backend';

// IAP Product IDs (must match App Store Connect)
export const IAP_PRODUCT_IDS = [
  'com.guild.coins.bronze',   // 5 QAR
  'com.guild.coins.silver',   // 10 QAR
  'com.guild.coins.gold',     // 50 QAR
  'com.guild.coins.platinum', // 100 QAR
  'com.guild.coins.diamond',  // 200 QAR
];

// Map IAP products to coin values (with 10% platform fee)
export const IAP_COIN_MAP: Record<string, { value: number; price: number; symbol: string }> = {
  'com.guild.coins.bronze': { value: 5, price: 5.50, symbol: 'GBC' },    // 5 QAR value + 10% = 5.50 QAR
  'com.guild.coins.silver': { value: 10, price: 11, symbol: 'GSC' },     // 10 QAR value + 10% = 11 QAR
  'com.guild.coins.gold': { value: 50, price: 55, symbol: 'GGC' },       // 50 QAR value + 10% = 55 QAR
  'com.guild.coins.platinum': { value: 100, price: 110, symbol: 'GPC' }, // 100 QAR value + 10% = 110 QAR
  'com.guild.coins.diamond': { value: 200, price: 220, symbol: 'GDC' },  // 200 QAR value + 10% = 220 QAR
};

class AppleIAPService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<void> {
    if (Platform.OS !== 'ios') {
      logger.info('[IAP] Not iOS platform, skipping initialization');
      return;
    }

    try {
      logger.info('[IAP] Initializing connection...');
      await initConnection();
      this.isInitialized = true;
      logger.info('[IAP] Connection initialized successfully');

      // Setup listeners
      this.setupListeners();
    } catch (error: any) {
      logger.error('[IAP] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup purchase listeners
   */
  private setupListeners(): void {
    // Purchase update listener
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase | SubscriptionPurchase) => {
        logger.info('[IAP] Purchase updated:', purchase);
        
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          try {
            // Verify receipt with backend
            await this.verifyAndCreditPurchase(purchase);
            
            // Finish transaction
            await finishTransaction({ purchase, isConsumable: true });
            logger.info('[IAP] Transaction finished successfully');
          } catch (error) {
            logger.error('[IAP] Failed to verify purchase:', error);
          }
        }
      }
    );

    // Purchase error listener
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        logger.error('[IAP] Purchase error:', error);
      }
    );
  }

  /**
   * Get available products
   */
  async getAvailableProducts(): Promise<Product[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info('[IAP] Fetching products:', IAP_PRODUCT_IDS);
      const products = await getProducts({ skus: IAP_PRODUCT_IDS });
      logger.info('[IAP] Products fetched:', products);
      return products;
    } catch (error: any) {
      logger.error('[IAP] Failed to fetch products:', error);
      throw error;
    }
  }

  /**
   * Purchase a product
   */
  async purchaseProduct(productId: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      logger.info('[IAP] Initiating purchase:', productId);
      await requestPurchase({ sku: productId });
    } catch (error: any) {
      logger.error('[IAP] Purchase failed:', error);
      throw error;
    }
  }

  /**
   * Verify receipt with backend and credit coins
   */
  private async verifyAndCreditPurchase(purchase: Purchase | SubscriptionPurchase): Promise<void> {
    try {
      logger.info('[IAP] Verifying receipt with backend...');

      const response = await BackendAPI.post('/api/coins/purchase/apple-iap/verify', {
        receipt: purchase.transactionReceipt,
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
      });

      if (response && response.success) {
        logger.info('[IAP] Receipt verified, coins credited:', response);
      } else {
        throw new Error('Receipt verification failed');
      }
    } catch (error: any) {
      logger.error('[IAP] Receipt verification failed:', error);
      throw error;
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }

    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }

    if (this.isInitialized) {
      await endConnection();
      this.isInitialized = false;
    }

    logger.info('[IAP] Cleanup complete');
  }
}

export const appleIAPService = new AppleIAPService();

