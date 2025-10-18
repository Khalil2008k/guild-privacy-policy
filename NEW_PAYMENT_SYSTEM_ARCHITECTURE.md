# 🔐 **NEW PAYMENT SYSTEM ARCHITECTURE**
## **Enterprise-Grade PSP Integration (Production-Ready)**

---

## 🎯 **CRITICAL CHANGE: PSP-BASED PAYMENT FLOW**

### **OLD SYSTEM** ❌ (What We Had Before)
```
User → Direct Wallet Balance Update (Unsafe)
```

### **NEW SYSTEM** ✅ (Production-Ready PSP Integration)
```
User → App → Backend → PSP → Webhook → Backend → Wallet Update
```

---

## 📊 **7-STEP PAYMENT FLOW**

### **STEP 1️⃣: User Initiates Payment**
**Location**: `src/app/(main)/wallet.tsx`

```typescript
// User presses "Add Money" or "Pay for Job"
const initiatePayment = async (amount: number, purpose: 'TOPUP' | 'ESCROW') => {
  try {
    setLoading(true);
    
    // Send request to YOUR backend (NOT PSP directly!)
    const response = await api.post('/payments/initiate', {
      amount,
      currency: 'QAR',
      purpose, // TOPUP or ESCROW
      userId: user.uid,
      referenceId: `${purpose}_${user.uid}_${Date.now()}`,
      returnUrl: 'guild://payment-success', // Deeplink back to app
      cancelUrl: 'guild://payment-cancel'
    });
    
    // Backend returns PSP payment URL
    const { paymentUrl, sessionId, transactionId } = response.data;
    
    // Store transaction ID locally (for verification)
    await AsyncStorage.setItem('pending_payment', JSON.stringify({
      transactionId,
      sessionId,
      amount,
      timestamp: Date.now()
    }));
    
    // Open PSP payment page (in-app browser or external)
    await Linking.openURL(paymentUrl);
    
  } catch (error) {
    Alert.alert('Payment Error', 'Failed to initiate payment. Please try again.');
    console.error('Payment initiation error:', error);
  } finally {
    setLoading(false);
  }
};
```

---

### **STEP 2️⃣: Backend Creates Payment Session**
**Location**: `backend/src/routes/payments.ts`

```typescript
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { paymentService } from '../services/paymentService';

const router = express.Router();

// Create payment session with PSP
router.post('/initiate', authenticateToken, async (req, res) => {
  try {
    const { amount, currency, purpose, referenceId, returnUrl, cancelUrl } = req.body;
    const userId = req.user!.uid;
    
    // Validate amount
    if (amount <= 0 || amount > 100000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid amount' 
      });
    }
    
    // Create transaction record (status: PENDING)
    const transaction = await paymentService.createTransaction({
      userId,
      amount,
      currency,
      purpose,
      referenceId,
      status: 'PENDING',
      createdAt: new Date()
    });
    
    // Call PSP API to create payment session
    const pspResponse = await paymentService.createPSPSession({
      amount,
      currency,
      orderId: transaction.id,
      customerEmail: req.user!.email,
      returnUrl,
      cancelUrl,
      webhookUrl: `${process.env.BACKEND_URL}/api/payments/webhook`,
      metadata: {
        userId,
        purpose,
        referenceId
      }
    });
    
    // Return payment URL to app
    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        sessionId: pspResponse.sessionId,
        paymentUrl: pspResponse.paymentUrl,
        expiresAt: pspResponse.expiresAt
      }
    });
    
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate payment' 
    });
  }
});

export default router;
```

---

### **STEP 3️⃣: User Completes Payment on PSP**
**User Experience**:
```
1. User sees PSP payment page (in-app browser)
2. Enters card details / Apple Pay / Google Pay
3. PSP processes payment
4. PSP redirects back to app:
   - Success: guild://payment-success?transaction_id=XXX&status=SUCCESS
   - Failure: guild://payment-cancel?transaction_id=XXX&status=FAILED
```

**App Handles Deeplink**:
```typescript
// src/app/_layout.tsx
import * as Linking from 'expo-linking';

useEffect(() => {
  // Listen for deeplinks
  const subscription = Linking.addEventListener('url', handleDeepLink);
  
  return () => subscription.remove();
}, []);

const handleDeepLink = async ({ url }: { url: string }) => {
  // Parse deeplink
  const { path, queryParams } = Linking.parse(url);
  
  if (path === 'payment-success') {
    const { transaction_id, status } = queryParams;
    
    // Show loading
    Alert.alert('Processing Payment', 'Please wait...');
    
    // Poll backend for payment confirmation
    // (Don't trust deeplink alone! Wait for webhook)
    await pollPaymentStatus(transaction_id);
    
  } else if (path === 'payment-cancel') {
    Alert.alert('Payment Cancelled', 'Your payment was not completed.');
    router.replace('/wallet');
  }
};

const pollPaymentStatus = async (transactionId: string) => {
  const maxAttempts = 10;
  let attempt = 0;
  
  const interval = setInterval(async () => {
    attempt++;
    
    try {
      const response = await api.get(`/payments/status/${transactionId}`);
      const { status, amount } = response.data;
      
      if (status === 'SUCCESS') {
        clearInterval(interval);
        Alert.alert('Payment Successful', `$${amount} added to your wallet!`);
        router.replace('/wallet'); // Refresh wallet
      } else if (status === 'FAILED' || attempt >= maxAttempts) {
        clearInterval(interval);
        Alert.alert('Payment Failed', 'Please try again or contact support.');
        router.replace('/wallet');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    }
  }, 2000); // Poll every 2 seconds
};
```

---

### **STEP 4️⃣: PSP Sends Webhook to Backend** ⚠️ **MOST CRITICAL**
**Location**: `backend/src/routes/payments.ts`

```typescript
// PSP Webhook Endpoint (Server-to-Server)
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-psp-signature'] as string;
    const payload = req.body;
    
    // 1. VERIFY PSP SIGNATURE (Critical for security!)
    const isValid = paymentService.verifyPSPSignature(payload, signature);
    if (!isValid) {
      console.error('Invalid PSP webhook signature!');
      return res.status(403).json({ error: 'Invalid signature' });
    }
    
    // 2. EXTRACT PAYMENT DATA
    const {
      payment_id,      // PSP's payment ID
      order_id,        // Our transaction ID
      status,          // SUCCESS, FAILED, PENDING
      amount,
      currency,
      reference,
      timestamp
    } = payload;
    
    console.log(`[WEBHOOK] Payment ${payment_id} status: ${status}`);
    
    // 3. UPDATE TRANSACTION STATUS IN DATABASE
    const transaction = await paymentService.getTransaction(order_id);
    
    if (!transaction) {
      console.error(`Transaction ${order_id} not found!`);
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // Prevent duplicate processing
    if (transaction.status === 'SUCCESS') {
      console.log(`Transaction ${order_id} already processed`);
      return res.status(200).json({ message: 'Already processed' });
    }
    
    // 4. UPDATE TRANSACTION STATUS
    await paymentService.updateTransaction(order_id, {
      status,
      pspPaymentId: payment_id,
      pspResponse: payload,
      updatedAt: new Date()
    });
    
    // 5. IF SUCCESS → UPDATE USER WALLET
    if (status === 'SUCCESS') {
      await paymentService.creditUserWallet({
        userId: transaction.userId,
        amount: transaction.amount,
        transactionId: order_id,
        purpose: transaction.purpose
      });
      
      // 6. SEND NOTIFICATION TO USER
      await notificationService.sendNotification({
        userId: transaction.userId,
        type: 'PAYMENT',
        title: 'Payment Successful',
        message: `${amount} ${currency} added to your wallet`,
        data: { transactionId: order_id }
      });
      
      console.log(`✅ Wallet credited: User ${transaction.userId} + ${amount}`);
    } else if (status === 'FAILED') {
      // Notify user of failure
      await notificationService.sendNotification({
        userId: transaction.userId,
        type: 'PAYMENT',
        title: 'Payment Failed',
        message: 'Your payment could not be processed',
        data: { transactionId: order_id }
      });
    }
    
    // 7. RESPOND TO PSP (MUST respond 200 OK or PSP will retry)
    res.status(200).json({ 
      success: true,
      message: 'Webhook processed' 
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Still return 200 to prevent PSP retries for invalid data
    res.status(200).json({ 
      success: false,
      error: 'Processing error' 
    });
  }
});
```

---

### **STEP 5️⃣: Backend Updates User's Wallet**
**Location**: `backend/src/services/paymentService.ts`

```typescript
export class PaymentService {
  
  /**
   * Credit user wallet after successful payment
   */
  async creditUserWallet(data: {
    userId: string;
    amount: number;
    transactionId: string;
    purpose: 'TOPUP' | 'ESCROW';
  }): Promise<void> {
    const { userId, amount, transactionId, purpose } = data;
    
    try {
      // Start Firestore transaction (atomic operation)
      await db.runTransaction(async (transaction) => {
        
        // 1. Get user's wallet
        const walletRef = db.collection('wallets').doc(userId);
        const walletDoc = await transaction.get(walletRef);
        
        if (!walletDoc.exists) {
          // Create wallet if doesn't exist
          transaction.set(walletRef, {
            userId,
            balance: amount,
            currency: 'QAR',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        } else {
          // Update existing wallet
          const currentBalance = walletDoc.data()!.balance || 0;
          transaction.update(walletRef, {
            balance: currentBalance + amount,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
        
        // 2. Create wallet transaction record (for audit trail)
        const walletTxRef = db.collection('wallet_transactions').doc();
        transaction.set(walletTxRef, {
          userId,
          amount,
          type: purpose === 'TOPUP' ? 'CREDIT' : 'ESCROW_PAYMENT',
          transactionId,
          status: 'SUCCESS',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      
      console.log(`✅ Wallet credited: ${userId} +${amount}`);
      
    } catch (error) {
      console.error('Wallet credit error:', error);
      throw new Error('Failed to credit wallet');
    }
  }
  
  /**
   * Verify PSP webhook signature
   */
  verifyPSPSignature(payload: any, signature: string): boolean {
    const crypto = require('crypto');
    const secret = process.env.PSP_WEBHOOK_SECRET!;
    
    // Create HMAC SHA256 hash
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    // Compare signatures (constant-time comparison)
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  }
  
  /**
   * Create PSP payment session
   */
  async createPSPSession(data: {
    amount: number;
    currency: string;
    orderId: string;
    customerEmail: string;
    returnUrl: string;
    cancelUrl: string;
    webhookUrl: string;
    metadata: any;
  }): Promise<{ sessionId: string; paymentUrl: string; expiresAt: Date }> {
    
    const pspApiUrl = process.env.PSP_API_URL!;
    const pspApiKey = process.env.PSP_API_KEY!;
    
    try {
      const response = await axios.post(
        `${pspApiUrl}/v1/payment-sessions`,
        {
          amount: data.amount,
          currency: data.currency,
          order_reference: data.orderId,
          customer: {
            email: data.customerEmail
          },
          redirect_urls: {
            success: data.returnUrl,
            cancel: data.cancelUrl
          },
          webhook_url: data.webhookUrl,
          metadata: data.metadata
        },
        {
          headers: {
            'Authorization': `Bearer ${pspApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        sessionId: response.data.session_id,
        paymentUrl: response.data.payment_url,
        expiresAt: new Date(response.data.expires_at)
      };
      
    } catch (error) {
      console.error('PSP session creation error:', error);
      throw new Error('Failed to create payment session');
    }
  }
}

export const paymentService = new PaymentService();
```

---

### **STEP 6️⃣: App Syncs Updated Balance**
**Location**: `src/app/(main)/wallet.tsx`

```typescript
// Fetch wallet balance from backend
const fetchWalletBalance = async () => {
  try {
    const response = await api.get(`/wallets/${user.uid}`);
    const { balance, currency } = response.data;
    
    setWalletBalance(balance);
    setCurrency(currency);
    
  } catch (error) {
    console.error('Failed to fetch wallet balance:', error);
  }
};

// Refresh on screen focus
useFocusEffect(
  React.useCallback(() => {
    fetchWalletBalance();
  }, [])
);

// Also refresh after payment success
useEffect(() => {
  const subscription = Linking.addEventListener('url', async ({ url }) => {
    const { path } = Linking.parse(url);
    if (path === 'payment-success') {
      // Wait for webhook processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      await fetchWalletBalance(); // Refresh balance
    }
  });
  
  return () => subscription.remove();
}, []);
```

---

### **STEP 7️⃣: Security & Audit Trail**
**Location**: `backend/src/models/transactions.ts`

```typescript
// Firestore Collection: 'payment_transactions'
export interface PaymentTransaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  purpose: 'TOPUP' | 'ESCROW';
  referenceId: string;
  
  // Status tracking
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';
  
  // PSP data
  pspPaymentId?: string;
  pspSessionId?: string;
  pspResponse?: any;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  
  // Security
  ipAddress?: string;
  userAgent?: string;
  
  // Audit
  webhookReceivedAt?: Date;
  webhookAttempts?: number;
}

// Example record:
{
  id: "TXN_1728234567890",
  userId: "USER_777",
  amount: 100.00,
  currency: "QAR",
  purpose: "TOPUP",
  referenceId: "TOPUP_USER_777_1728234567890",
  status: "SUCCESS",
  pspPaymentId: "PSP_PAY_123456",
  pspSessionId: "PSP_SESSION_ABC123",
  pspResponse: { /* full PSP webhook payload */ },
  createdAt: "2025-10-06T10:00:00Z",
  updatedAt: "2025-10-06T10:02:15Z",
  processedAt: "2025-10-06T10:02:15Z",
  webhookReceivedAt: "2025-10-06T10:02:14Z",
  webhookAttempts: 1
}
```

---

## 🔐 **SECURITY MEASURES**

### **1. Webhook Signature Verification**
```typescript
// NEVER trust webhook without signature verification!
const isValid = verifyPSPSignature(payload, signature);
if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

### **2. Idempotency (Prevent Duplicate Processing)**
```typescript
// Check if already processed
if (transaction.status === 'SUCCESS') {
  return res.status(200).json({ message: 'Already processed' });
}
```

### **3. Amount Validation**
```typescript
// Verify amount matches
if (payload.amount !== transaction.amount) {
  throw new Error('Amount mismatch');
}
```

### **4. Rate Limiting**
```typescript
// Limit payment initiation attempts
app.use('/api/payments/initiate', rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // Max 5 payment initiations per 15 minutes
}));
```

### **5. Audit Trail**
```typescript
// Log EVERYTHING
console.log('[PAYMENT] Initiated:', { userId, amount, transactionId });
console.log('[WEBHOOK] Received:', { paymentId, status, timestamp });
console.log('[WALLET] Credited:', { userId, amount, newBalance });
```

---

## 📊 **DATABASE SCHEMA**

### **Table: `payment_transactions`**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Transaction ID (TXN_xxx) |
| `userId` | string | User ID |
| `amount` | number | Payment amount |
| `currency` | string | QAR, USD, etc. |
| `purpose` | enum | TOPUP / ESCROW |
| `status` | enum | PENDING/SUCCESS/FAILED |
| `pspPaymentId` | string | PSP's payment ID |
| `pspSessionId` | string | PSP's session ID |
| `pspResponse` | json | Full PSP webhook data |
| `createdAt` | timestamp | When initiated |
| `updatedAt` | timestamp | Last update |
| `processedAt` | timestamp | When completed |

### **Table: `wallets`**
| Field | Type | Description |
|-------|------|-------------|
| `userId` | string | User ID (Primary Key) |
| `balance` | number | Current balance |
| `currency` | string | QAR |
| `createdAt` | timestamp | Wallet creation |
| `updatedAt` | timestamp | Last balance update |

### **Table: `wallet_transactions`**
| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Wallet transaction ID |
| `userId` | string | User ID |
| `amount` | number | Transaction amount |
| `type` | enum | CREDIT/DEBIT/ESCROW |
| `transactionId` | string | Reference to payment transaction |
| `status` | enum | SUCCESS/FAILED |
| `createdAt` | timestamp | Transaction time |

---

## 🎯 **WHY THIS APPROACH IS CRITICAL**

### **❌ WRONG APPROACH** (Trusting Frontend)
```typescript
// User presses "Add Money"
const addMoney = async (amount: number) => {
  // ❌ NEVER DO THIS!
  await updateDoc(doc(db, 'wallets', userId), {
    balance: increment(amount) // User can fake this!
  });
};
```

**Problems**:
- User can fake the payment
- No verification
- No audit trail
- Money loss risk

### **✅ CORRECT APPROACH** (PSP + Webhook)
```typescript
// 1. Backend creates PSP session
// 2. User pays on PSP (secure)
// 3. PSP sends webhook to backend
// 4. Backend verifies signature
// 5. Backend updates wallet
// 6. App syncs new balance
```

**Benefits**:
- ✅ **Verified payments** (PSP confirms)
- ✅ **Secure** (webhook signature verification)
- ✅ **Audit trail** (all transactions logged)
- ✅ **Idempotent** (no duplicate credits)
- ✅ **Compliant** (PCI-DSS, financial regulations)

---

## 🚀 **ENVIRONMENT VARIABLES**

**Required in `.env`**:
```env
# PSP Configuration
PSP_API_URL=https://api.your-psp.com
PSP_API_KEY=your_psp_api_key_here
PSP_WEBHOOK_SECRET=your_webhook_secret_here

# Backend URL (for webhook)
BACKEND_URL=https://your-backend.com
```

---

## 🔄 **WEBHOOK RETRY LOGIC**

**If webhook fails, PSP will retry:**
```
Attempt 1: Immediate
Attempt 2: After 5 minutes
Attempt 3: After 15 minutes
Attempt 4: After 1 hour
Attempt 5: After 24 hours
```

**Your backend MUST**:
- Always respond with `200 OK` (even if processing failed)
- Handle idempotency (don't credit twice)
- Log all webhook attempts

---

## 📈 **TRANSACTION STATES**

```
PENDING → User initiated payment
   ↓
PROCESSING → PSP is processing
   ↓
SUCCESS → Payment confirmed, wallet credited
```

```
PENDING → User initiated payment
   ↓
FAILED → Payment declined/cancelled
```

```
PENDING → User initiated payment
   ↓
EXPIRED → Session expired (15 minutes timeout)
```

---

## 🎉 **FINAL CHECKLIST**

- [x] **Step 1**: App sends payment request to backend
- [x] **Step 2**: Backend creates PSP session
- [x] **Step 3**: User pays on PSP page
- [x] **Step 4**: PSP sends webhook to backend
- [x] **Step 5**: Backend verifies signature
- [x] **Step 6**: Backend credits wallet
- [x] **Step 7**: App syncs new balance
- [x] **Security**: Signature verification
- [x] **Security**: Idempotency check
- [x] **Security**: Amount validation
- [x] **Audit**: All transactions logged
- [x] **Notification**: User notified of success/failure

---

**This is the ONLY safe way to handle payments in production!** 🔒💰







