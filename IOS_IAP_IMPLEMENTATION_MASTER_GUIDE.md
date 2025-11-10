# 🍎 iOS IN-APP PURCHASE (IAP) - MASTER IMPLEMENTATION GUIDE

**Apple Guideline:** 3.1.1 - Payments - In-App Purchase  
**Critical:** App will be REJECTED without this on iOS  
**Status:** Complete implementation instructions  
**Date:** November 7, 2025

---

## ⚠️ CRITICAL REQUIREMENT

**Apple Guideline 3.1.1 states:**
> "Apps offering digital goods or services for purchase within the app must use In-App Purchase on iOS."

**Guild Coins are digital goods** → MUST use IAP on iOS.

**IMPORTANT:** 
- ✅ iOS: MUST use Apple IAP
- ✅ Android/Web: MUST preserve existing Sadad PSP
- ❌ DO NOT break Android/Web payment flow

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Library Installation (15 min)
- [ ] Install react-native-iap
- [ ] Link native modules
- [ ] Test basic imports

### Phase 2: App Store Connect Setup (30-45 min)
- [ ] Create IAP products
- [ ] Set pricing
- [ ] Configure agreements
- [ ] Create sandbox test account

### Phase 3: Frontend Implementation (2-3 hours)
- [ ] Add platform detection
- [ ] Create IAP purchase flow
- [ ] Update coin-store.tsx
- [ ] Add loading states
- [ ] Error handling

### Phase 4: Backend Implementation (2-3 hours)
- [ ] Create receipt validation route
- [ ] Implement Apple receipt verification
- [ ] Store receipt for fraud prevention
- [ ] Credit coins after validation
- [ ] Add transaction logging

### Phase 5: Testing (1-2 hours)
- [ ] Test with Apple Sandbox
- [ ] Test all coin packages
- [ ] Verify receipts validate
- [ ] Confirm coins credited
- [ ] Verify Android/Web PSP unaffected

**Total Time:** 6-8 hours

---

## 📦 PHASE 1: LIBRARY INSTALLATION

### 1.1 Install react-native-iap

```bash
cd GUILD-3

# Install the library
npm install react-native-iap

# For iOS, install pods
cd ios
pod install
cd ..
```

### 1.2 Verify Installation

```typescript
// Test import in a file
import { 
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  getProducts,
  requestPurchase,
  finishTransaction
} from 'react-native-iap';
```

### 1.3 Link Check (Auto-linking should work)

```bash
# Rebuild iOS
npm run ios

# If errors, try:
cd ios
pod install
cd ..
npm run ios
```

---

## 🏪 PHASE 2: APP STORE CONNECT SETUP

### 2.1 Access App Store Connect

1. Go to https://appstoreconnect.apple.com
2. Sign in with: `guild1@guild-app.net`
3. Navigate to: **My Apps** → **GUILD** → **In-App Purchases**

### 2.2 Create IAP Products

For each coin package, create a **Consumable** IAP product:

#### Bronze Coins
- **Product ID:** `com.guild.coins.bronze`
- **Reference Name:** GUILD Bronze Coins
- **Price:** Tier 1 (5 QAR / ~$1.37 USD)
- **Description (English):** 5 QAR worth of Guild Coins for jobs and services
- **Description (Arabic):** عملات جيلد بقيمة 5 ريال للوظائف والخدمات

#### Silver Coins
- **Product ID:** `com.guild.coins.silver`
- **Reference Name:** GUILD Silver Coins
- **Price:** Tier 2 (10 QAR / ~$2.74 USD)
- **Description (English):** 10 QAR worth of Guild Coins for jobs and services
- **Description (Arabic):** عملات جيلد بقيمة 10 ريال للوظائف والخدمات

#### Gold Coins
- **Product ID:** `com.guild.coins.gold`
- **Reference Name:** GUILD Gold Coins
- **Price:** Tier 11 (50 QAR / ~$13.70 USD)
- **Description (English):** 50 QAR worth of Guild Coins for jobs and services
- **Description (Arabic):** عملات جيلد بقيمة 50 ريال للوظائف والخدمات

#### Platinum Coins
- **Product ID:** `com.guild.coins.platinum`
- **Reference Name:** GUILD Platinum Coins
- **Price:** Tier 21 (100 QAR / ~$27.40 USD)
- **Description (English):** 100 QAR worth of Guild Coins for jobs and services
- **Description (Arabic):** عملات جيلد بقيمة 100 ريال للوظائف والخدمات

#### Diamond Coins
- **Product ID:** `com.guild.coins.diamond`
- **Reference Name:** GUILD Diamond Coins
- **Price:** Tier 32 (200 QAR / ~$54.80 USD)
- **Description (English):** 200 QAR worth of Guild Coins for jobs and services
- **Description (Arabic):** عملات جيلد بقيمة 200 ريال للوظائف والخدمات

### 2.3 Configure Agreements

1. **Paid Apps Agreement:** Must be signed
2. **Banking Info:** Must be complete
3. **Tax Forms:** Must be submitted

### 2.4 Create Sandbox Test Account

1. Go to: **Users and Access** → **Sandbox** → **Testers**
2. Click **+** to add tester
3. Email: `guild.test@icloud.com` (or any)
4. Password: Create strong password
5. Territory: Qatar (QA)
6. **Save** and note credentials for testing

---

## 💻 PHASE 3: FRONTEND IMPLEMENTATION

### 3.1 Create IAP Service

**File:** `src/services/AppleIAPService.ts`

```typescript
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

// IAP Product IDs
export const IAP_PRODUCT_IDS = [
  'com.guild.coins.bronze',   // 5 QAR
  'com.guild.coins.silver',   // 10 QAR
  'com.guild.coins.gold',     // 50 QAR
  'com.guild.coins.platinum', // 100 QAR
  'com.guild.coins.diamond',  // 200 QAR
];

// Map IAP products to coin values
export const IAP_COIN_MAP: Record<string, { value: number; price: number; symbol: string }> = {
  'com.guild.coins.bronze': { value: 5, price: 5, symbol: 'GBC' },
  'com.guild.coins.silver': { value: 10, price: 10, symbol: 'GSC' },
  'com.guild.coins.gold': { value: 50, price: 50, symbol: 'GGC' },
  'com.guild.coins.platinum': { value: 100, price: 100, symbol: 'GPC' },
  'com.guild.coins.diamond': { value: 200, price: 200, symbol: 'GDC' },
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
```

### 3.2 Update Coin Store Screen

**File:** `src/app/(modals)/coin-store.tsx`

Add platform detection and IAP logic:

```typescript
// At the top of the file, add imports
import { Platform } from 'react-native';
import { appleIAPService, IAP_PRODUCT_IDS, IAP_COIN_MAP } from '../../services/AppleIAPService';

// In the component, add state for IAP products
const [iapProducts, setIapProducts] = useState<any[]>([]);

// Add useEffect to fetch IAP products on iOS
useEffect(() => {
  if (Platform.OS === 'ios') {
    loadIAPProducts();
  }
  
  return () => {
    if (Platform.OS === 'ios') {
      appleIAPService.cleanup();
    }
  };
}, []);

const loadIAPProducts = async () => {
  try {
    const products = await appleIAPService.getAvailableProducts();
    setIapProducts(products);
    logger.info('[CoinStore] IAP products loaded:', products);
  } catch (error) {
    logger.error('[CoinStore] Failed to load IAP products:', error);
  }
};

// Modify handleAcceptTerms to use IAP on iOS
const handleAcceptTerms = async () => {
  setShowTermsModal(false);
  setLoading(true);

  try {
    // 🍎 iOS: Use Apple IAP
    if (Platform.OS === 'ios') {
      await handleIOSIAPPurchase();
    } else {
      // Android/Web: Use existing Sadad PSP
      await handleSadadPurchase();
    }
  } catch (error: any) {
    logger.error('❌ Purchase failed:', error);
    CustomAlertService.showError(
      t('error'),
      error.message || (isRTL ? 'فشل الشراء' : 'Purchase failed')
    );
  } finally {
    setLoading(false);
  }
};

// NEW: iOS IAP purchase handler
const handleIOSIAPPurchase = async () => {
  try {
    logger.info('🍎 [iOS] Starting IAP purchase...');

    // Determine which product to purchase based on cart
    const totalAmount = total;
    let productId = '';

    // Map amount to product ID
    if (totalAmount <= 5) {
      productId = 'com.guild.coins.bronze';
    } else if (totalAmount <= 10) {
      productId = 'com.guild.coins.silver';
    } else if (totalAmount <= 50) {
      productId = 'com.guild.coins.gold';
    } else if (totalAmount <= 100) {
      productId = 'com.guild.coins.platinum';
    } else {
      productId = 'com.guild.coins.diamond';
    }

    logger.info(`🍎 [iOS] Purchasing product: ${productId}`);

    // Initiate purchase
    await appleIAPService.purchaseProduct(productId);

    // Purchase listener will handle verification and coin crediting
    logger.info('🍎 [iOS] Purchase initiated, waiting for completion...');

    // Show success (actual crediting happens in background)
    CustomAlertService.showSuccess(
      t('paymentSuccess'),
      isRTL ? 'جاري معالجة الدفع...' : 'Processing payment...'
    );

  } catch (error: any) {
    logger.error('❌ [iOS] IAP purchase failed:', error);
    throw error;
  }
};

// EXISTING: Sadad PSP purchase handler (keep for Android/Web)
const handleSadadPurchase = async () => {
  // [Keep existing Sadad implementation here]
  // This is the code that was already in handleAcceptTerms
};
```

---

## 🔧 PHASE 4: BACKEND IMPLEMENTATION

### 4.1 Create IAP Verification Route

**File:** `backend/src/routes/apple-iap.ts`

```typescript
/**
 * Apple In-App Purchase Verification Route
 * 
 * Verifies IAP receipts and credits coins
 * Apple Guideline 3.1.1 Compliance
 */

import { Router, Request, Response } from 'express';
import admin from 'firebase-admin';
import axios from 'axios';
import { logger } from '../utils/logger';

const router = Router();
const db = admin.firestore();

// Apple receipt verification endpoints
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';

// IAP Product to Coin mapping
const IAP_COIN_MAP: Record<string, { value: number; coinType: string; coinSymbol: string }> = {
  'com.guild.coins.bronze': { value: 5, coinType: 'GBC', coinSymbol: 'GBC' },
  'com.guild.coins.silver': { value: 10, coinType: 'GSC', coinSymbol: 'GSC' },
  'com.guild.coins.gold': { value: 50, coinType: 'GGC', coinSymbol: 'GGC' },
  'com.guild.coins.platinum': { value: 100, coinType: 'GPC', coinSymbol: 'GPC' },
  'com.guild.coins.diamond': { value: 200, coinType: 'GDC', coinSymbol: 'GDC' },
};

/**
 * Verify Apple IAP Receipt
 * 
 * POST /api/coins/purchase/apple-iap/verify
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const { receipt, productId, transactionId, platform } = req.body;

    if (!receipt || !productId || !transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }

    logger.info(`🍎 [IAP] Verifying receipt for user: ${userId}, product: ${productId}`);

    // Check if transaction already processed
    const existingTransaction = await db.collection('iap_transactions')
      .where('transactionId', '==', transactionId)
      .where('status', '==', 'completed')
      .limit(1)
      .get();

    if (!existingTransaction.empty) {
      logger.warn(`⚠️  [IAP] Transaction already processed: ${transactionId}`);
      return res.status(200).json({
        success: true,
        message: 'Transaction already processed',
        alreadyProcessed: true
      });
    }

    // Verify receipt with Apple
    const verificationResult = await verifyReceiptWithApple(receipt);

    if (!verificationResult.isValid) {
      logger.error(`❌ [IAP] Receipt verification failed:`, verificationResult.error);
      return res.status(400).json({
        success: false,
        error: 'Receipt verification failed',
        details: verificationResult.error
      });
    }

    // Get coin details
    const coinDetails = IAP_COIN_MAP[productId];
    if (!coinDetails) {
      logger.error(`❌ [IAP] Unknown product ID: ${productId}`);
      return res.status(400).json({
        success: false,
        error: 'Unknown product ID'
      });
    }

    // Credit coins to user
    await creditUserCoins(userId, productId, coinDetails, transactionId, receipt);

    // Store transaction record
    await db.collection('iap_transactions').doc(transactionId).set({
      userId,
      productId,
      transactionId,
      receipt,
      coinValue: coinDetails.value,
      coinType: coinDetails.coinType,
      status: 'completed',
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      platform: platform || 'ios'
    });

    logger.info(`✅ [IAP] Receipt verified and coins credited for ${userId}`);

    res.json({
      success: true,
      message: 'Coins credited successfully',
      coinValue: coinDetails.value,
      coinType: coinDetails.coinType
    });

  } catch (error: any) {
    logger.error('❌ [IAP] Verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Verification failed'
    });
  }
});

/**
 * Verify receipt with Apple servers
 */
async function verifyReceiptWithApple(receipt: string): Promise<{ isValid: boolean; error?: string }> {
  try {
    // Try production first
    let response = await axios.post(APPLE_PRODUCTION_URL, {
      'receipt-data': receipt,
      'password': process.env.APPLE_SHARED_SECRET, // Configure in App Store Connect
      'exclude-old-transactions': true
    });

    // If sandbox receipt, retry with sandbox endpoint
    if (response.data.status === 21007) {
      logger.info('🍎 [IAP] Sandbox receipt detected, retrying with sandbox endpoint');
      response = await axios.post(APPLE_SANDBOX_URL, {
        'receipt-data': receipt,
        'password': process.env.APPLE_SHARED_SECRET,
        'exclude-old-transactions': true
      });
    }

    const { status } = response.data;

    if (status === 0) {
      return { isValid: true };
    } else {
      return { isValid: false, error: `Apple verification status: ${status}` };
    }

  } catch (error: any) {
    logger.error('❌ [IAP] Apple verification request failed:', error);
    return { isValid: false, error: error.message };
  }
}

/**
 * Credit coins to user wallet
 */
async function creditUserCoins(
  userId: string,
  productId: string,
  coinDetails: { value: number; coinType: string; coinSymbol: string },
  transactionId: string,
  receipt: string
): Promise<void> {
  try {
    const coinInstanceId = `iap_${transactionId}_${Date.now()}`;

    // Create coin instance
    await db.collection('coin_instances').doc(coinInstanceId).set({
      userId,
      coinType: coinDetails.coinType,
      symbol: coinDetails.coinSymbol,
      value: coinDetails.value,
      quantity: 1,
      source: 'apple_iap',
      sourceTransactionId: transactionId,
      productId,
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: null // Coins don't expire
    });

    // Update wallet
    const walletRef = db.collection('user_wallets').doc(userId);
    const walletDoc = await walletRef.get();

    if (walletDoc.exists) {
      await walletRef.update({
        totalValue: admin.firestore.FieldValue.increment(coinDetails.value),
        [`balances.${coinDetails.coinSymbol}`]: admin.firestore.FieldValue.increment(1),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await walletRef.set({
        userId,
        totalValue: coinDetails.value,
        balances: {
          [coinDetails.coinSymbol]: 1
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Create transaction record
    await db.collection('coin_transactions').add({
      userId,
      type: 'credit',
      amount: 1,
      coinType: coinDetails.coinType,
      symbol: coinDetails.coinSymbol,
      qarValue: coinDetails.value,
      source: 'apple_iap',
      sourceTransactionId: transactionId,
      productId,
      description: `IAP Purchase: ${coinDetails.coinSymbol}`,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`✅ [IAP] Coins credited: ${coinDetails.value} QAR (${coinDetails.coinSymbol})`);

  } catch (error) {
    logger.error('❌ [IAP] Failed to credit coins:', error);
    throw error;
  }
}

export default router;
```

### 4.2 Wire IAP Route to Server

**File:** `backend/src/server.ts`

```typescript
// Add import
import appleIAPRoutes from './routes/apple-iap';

// Add route (in the coins section)
app.use('/api/coins/purchase/apple-iap', 
  authenticateFirebaseToken,
  appleIAPRoutes
);
```

### 4.3 Add Environment Variable

**File:** `backend/.env`

```env
# Apple IAP Shared Secret (from App Store Connect)
APPLE_SHARED_SECRET=your_shared_secret_here
```

To get the shared secret:
1. Go to App Store Connect
2. **My Apps** → **GUILD** → **In-App Purchases**
3. Click **App-Specific Shared Secret**
4. **Generate** or copy existing
5. Add to `.env`

---

## 🧪 PHASE 5: TESTING

### 5.1 Test with Sandbox Account

1. **Sign out** of your Apple ID on test device
2. **Run app** on device or simulator
3. Navigate to **Coin Store**
4. Select a coin package
5. Tap **Accept and Pay**
6. When prompted, sign in with **sandbox test account**
7. Complete purchase
8. Verify:
   - [ ] Payment sheet appears (native iOS)
   - [ ] Purchase completes
   - [ ] Receipt is verified
   - [ ] Coins are credited
   - [ ] Transaction appears in wallet

### 5.2 Test All Packages

Repeat for each coin package:
- [ ] Bronze (5 QAR)
- [ ] Silver (10 QAR)
- [ ] Gold (50 QAR)
- [ ] Platinum (100 QAR)
- [ ] Diamond (200 QAR)

### 5.3 Test Error Cases

- [ ] Cancel purchase → should return to coin store
- [ ] Network error → should show error message
- [ ] Invalid receipt → should not credit coins
- [ ] Duplicate transaction → should not double-credit

### 5.4 Verify Android/Web Unaffected

**CRITICAL TEST:**
- [ ] Test coin purchase on **Android** device
- [ ] Should use **Sadad PSP** (not IAP)
- [ ] Payment flow should work exactly as before
- [ ] Coins should be credited via Sadad callback

---

## 📊 SUCCESS CRITERIA

✅ **iOS:**
- Native Apple payment sheet appears
- Receipt validates with Apple servers
- Coins credited after verification
- No double-crediting
- Error handling works

✅ **Android/Web:**
- Sadad PSP flow unchanged
- WebView payment works
- Coins credited via callback
- No regressions

✅ **Backend:**
- Receipt validation works
- Duplicate protection works
- Coins credited correctly
- Transactions logged

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: "Cannot connect to iTunes Store"
**Solution:** 
- Check Apple servers status
- Verify shared secret is correct
- Try sandbox endpoint

### Issue: "Products not found"
**Solution:**
- Verify products exist in App Store Connect
- Check product IDs match exactly
- Ensure agreements are signed
- Wait 24 hours after creating products

### Issue: "Receipt verification failed"
**Solution:**
- Use sandbox endpoint for testing
- Check shared secret
- Verify receipt format

### Issue: Android still uses IAP
**Solution:**
- Check `Platform.OS === 'ios'` condition
- Verify platform detection logic
- Test on real Android device

---

## 🎯 DEPLOYMENT CHECKLIST

Before submitting to App Store:

### Code:
- [ ] All IAP code committed
- [ ] Backend route deployed
- [ ] Environment variables set
- [ ] Platform detection tested

### App Store Connect:
- [ ] All products created
- [ ] Prices set correctly
- [ ] Descriptions in English & Arabic
- [ ] Shared secret configured

### Testing:
- [ ] Sandbox testing complete
- [ ] All packages work
- [ ] Android/Web unaffected
- [ ] Error handling verified

### Documentation:
- [ ] App Review Notes mention IAP
- [ ] Explain coin system
- [ ] Note sandbox test account

---

## 📝 APP REVIEW NOTES

Include this in your App Store submission:

```
GUILD Coins - In-App Purchase Implementation

GUILD uses Apple In-App Purchase for purchasing Guild Coins on iOS, 
in compliance with App Store Guideline 3.1.1.

Guild Coins are in-app virtual currency used to:
- Post jobs on the platform
- Send offers to freelancers
- Access premium features
- Pay for services within the app

Coins are consumable, non-refundable, and have no cash value.

Test Account (Sandbox):
Email: guild.test@icloud.com
Password: [provided separately]

All coin packages are configured as Consumable IAP products.
Android and Web versions use external payment processing as permitted.
```

---

## ✅ COMPLETION CHECKLIST

- [ ] react-native-iap installed
- [ ] IAP products created in App Store Connect
- [ ] AppleIAPService.ts implemented
- [ ] coin-store.tsx updated with platform logic
- [ ] Backend verification route implemented
- [ ] Backend route wired to server
- [ ] Environment variables configured
- [ ] Tested with sandbox account
- [ ] All coin packages work
- [ ] Android/Web PSP unaffected
- [ ] Error handling tested
- [ ] Documentation complete
- [ ] Ready for App Store submission

---

**IMPLEMENTATION STATUS:** Instructions Complete ✅  
**Estimated Implementation Time:** 6-8 hours  
**Priority:** 🔴 CRITICAL for App Store approval  
**Phase 10:** Ready to implement

*Created: November 7, 2025*


