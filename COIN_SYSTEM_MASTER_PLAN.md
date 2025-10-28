# 🪙 **GUILD COIN SYSTEM - MASTER IMPLEMENTATION PLAN**

> **ULTRA-ADVANCED PRODUCTION-READY COIN ECONOMY SYSTEM**
> 
> **Timeline:** 10-12 weeks (phased rollout)
> **Target Scale:** 50K+ users, 10K+ jobs/day, millions of transactions
> **Architecture:** Enterprise-grade, Firebase-native, fully auditable

---

## 📋 **TABLE OF CONTENTS**

1. [Executive Summary](#executive-summary)
2. [Coin Catalog & Economics](#coin-catalog--economics)
3. [System Architecture](#system-architecture)
4. [Firestore Schema Design](#firestore-schema-design)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Admin Console](#admin-console)
8. [Security & Compliance](#security--compliance)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Plan](#deployment-plan)

---

## 🎯 **EXECUTIVE SUMMARY**

### **What We're Building**

A **multi-tier virtual coin economy** that replaces the current QAR-based payment system with a flexible, scalable coin system. Users buy coins with real money (via Fatora PSP), spend coins on jobs, and can request withdrawals (admin-approved).

### **Key Design Decisions** ✅

Based on our discussion:

1. **✅ Option A (Simplified UX):** Users see ONE total balance in QAR equivalent, but backend manages 6 coin types. Breakdown shown in detailed view.

2. **✅ Coin-Only Payments:** Jobs priced in coins. No mixed payments (coins + real money). Users must buy more coins if insufficient.

3. **✅ 24-Month Expiry (Recommended):** Changed from 12 months to 24 months for better user trust. Purchased coins never expire; only earned/bonus coins expire.

4. **✅ Manual Withdrawals (Phase 1):** Admin-mediated for launch. Auto-approval for small amounts (<100 QAR) in Phase 2.

5. **✅ 10% Platform Fee:** 
   - **Coin Purchase:** 10% markup (user pays 110 QAR, gets 100 QAR in coins)
   - **Job Completion:** 10% platform fee (90% to freelancer, 10% to platform)
   - **PSP Fee:** 2.5% absorbed by platform (not passed to user)
   - **Total Platform Revenue:** ~17.5% effective rate

6. **✅ No Coin Breaking:** Users cannot convert large coins to small coins. System auto-selects best coin combination for payments.

7. **✅ Guild Vault Integration:** Guild masters can deposit coins to guild vault for guild expenses.

---

## 🪙 **COIN CATALOG & ECONOMICS**

### **1. Coin Tiers**

| Name | Symbol | Value (QAR) | Color | Icon | Use Case |
|------|--------|-------------|-------|------|----------|
| **Guild Bronze** | GBC | 5 | `#CD7F32` | 🥉 | Small tips, micro-tasks |
| **Guild Silver** | GSC | 10 | `#C0C0C0` | 🥈 | Quick jobs, hourly work |
| **Guild Gold** | GGC | 50 | `#FFD700` | 🥇 | Standard jobs |
| **Guild Platinum** | GPC | 100 | `#E5E4E2` | 💎 | Premium jobs |
| **Guild Diamond** | GDC | 200 | `#B9F2FF` | 💠 | Large projects |
| **Guild Royal** | GRC | 500 | `#9B59B6` | 👑 | Enterprise contracts |

### **2. Coin Packs (Store)**

**Pre-defined Packs:**

| Pack Name | Coins Included | QAR Value | Price (with 10% markup) | Best For |
|-----------|----------------|-----------|-------------------------|----------|
| **Starter** | 1 GBC | 5 | 5.50 | First-time users |
| **Basic** | 1 GSC | 10 | 11.00 | Casual users |
| **Standard** | 1 GGC | 50 | 55.00 | Regular users |
| **Pro** | 1 GPC | 100 | 110.00 | Frequent users |
| **Premium** | 1 GDC | 200 | 220.00 | Power users |
| **Elite** | 1 GRC | 500 | 550.00 | Enterprise clients |

**Custom Pack:**
- User inputs desired QAR amount (min 5, max 5000)
- System calculates optimal coin combination
- Shows breakdown before purchase

### **3. Pricing Strategy**

```typescript
// Coin Purchase Formula
const purchasePrice = coinValue * 1.10; // 10% markup
const pspFee = purchasePrice * 0.025; // 2.5% PSP fee (absorbed by platform)
const platformRevenue = coinValue * 0.10; // 10% markup revenue

// Job Payment Formula
const jobPrice = 100; // QAR in coins
const freelancerReceives = jobPrice * 0.90; // 90%
const platformFee = jobPrice * 0.10; // 10%

// Total Platform Revenue Example:
// User buys 100 QAR coins → Pays 110 QAR → Platform gets 10 QAR
// User spends 100 QAR on job → Freelancer gets 90 QAR → Platform gets 10 QAR
// Total: 20 QAR revenue on 100 QAR transaction (20% effective rate)
// Minus PSP fee: 20 - 2.75 = 17.25 QAR net revenue (17.25% net rate)
```

### **4. Coin Selection Algorithm**

When user pays for a job, system automatically selects coins using **Greedy Algorithm** (largest first):

```typescript
function selectCoins(targetAmount: number, userBalances: CoinBalances): CoinSelection {
  const coinTiers = [
    { symbol: 'GRC', value: 500 },
    { symbol: 'GDC', value: 200 },
    { symbol: 'GPC', value: 100 },
    { symbol: 'GGC', value: 50 },
    { symbol: 'GSC', value: 10 },
    { symbol: 'GBC', value: 5 },
  ];
  
  let remaining = targetAmount;
  const selected: Record<string, number> = {};
  
  for (const coin of coinTiers) {
    const available = userBalances[coin.symbol] || 0;
    const needed = Math.floor(remaining / coin.value);
    const use = Math.min(needed, available);
    
    if (use > 0) {
      selected[coin.symbol] = use;
      remaining -= use * coin.value;
    }
  }
  
  if (remaining > 0) {
    throw new Error('Insufficient coins');
  }
  
  return { coins: selected, total: targetAmount };
}
```

---

## 🏗️ **SYSTEM ARCHITECTURE**

### **High-Level Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                        COIN SYSTEM FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. COIN PURCHASE (Issuance)
   User → Coin Store UI → Select Pack → Fatora Payment → Webhook
   → Backend validates → Create ledger entry → Update user_wallets
   → Update guild_vault_daily → Send notification

2. JOB PAYMENT (Spending)
   User → Post Job → Select Coin Payment → System calculates coins
   → Create escrow → Lock coins → Update ledger → Job active

3. JOB COMPLETION (Escrow Release)
   Freelancer completes → Client approves → Release escrow
   → Transfer 90% to freelancer → Transfer 10% to platform
   → Update ledger → Update balances → Send notifications

4. WITHDRAWAL (Cash-out)
   User → Request Withdrawal → Select coins → Show QAR equivalent
   → Admin reviews → Admin approves → Admin sends payment
   → Admin marks paid → Deduct coins → Create ledger entry
   → Send confirmation

5. EXPIRY (Automated)
   Cloud Scheduler (daily) → Query inactive users (24 months)
   → Create expire ledger entries → Deduct coins
   → Update guild_vault_daily (expired_revenue)
   → Send expiry notifications
```

### **Technology Stack**

**Backend:**
- **Runtime:** Node.js 25.x + TypeScript
- **Framework:** Express.js
- **Database:** Firebase Firestore (primary)
- **Auth:** Firebase Admin SDK
- **PSP:** Fatora Payment Gateway
- **Logging:** Winston + Cloud Logging
- **Deployment:** Render.com

**Frontend:**
- **Framework:** React Native (Expo)
- **Navigation:** Expo Router
- **State:** React Context + Hooks
- **Storage:** AsyncStorage
- **UI:** Custom components + Lucide Icons
- **Theme:** Dark/Light mode with neon green accent

**Admin Console:**
- **Framework:** React Native (same codebase)
- **Auth:** Firebase Admin role check
- **Features:** Withdrawal approval, analytics, user management

---

## 🗄️ **FIRESTORE SCHEMA DESIGN**

### **Collection: `user_wallets`**

**Document ID:** `{userId}`

```typescript
interface UserWallet {
  // User Identity
  userId: string;
  guildId: string;
  govId: string; // Government ID (for KYC)
  fullName: string;
  
  // Coin Balances (individual coins)
  balances: {
    GBC: number; // Guild Bronze Coins
    GSC: number; // Guild Silver Coins
    GGC: number; // Guild Gold Coins
    GPC: number; // Guild Platinum Coins
    GDC: number; // Guild Diamond Coins
    GRC: number; // Guild Royal Coins
  };
  
  // Calculated Fields (for quick display)
  totalValueQAR: number; // Sum of all coins in QAR
  totalCoins: number; // Total number of coins (all types)
  
  // Activity Tracking
  lastActivity: Timestamp; // Updated on any spend/receive
  lastPurchase: Timestamp | null;
  lastWithdrawal: Timestamp | null;
  
  // Withdrawal Management
  pendingWithdrawal: {
    id: string;
    coins: Record<string, number>; // { GBC: 2, GSC: 5 }
    qarEquivalent: number;
    status: 'requested' | 'approved' | 'paid' | 'rejected';
    requestedAt: Timestamp;
    processedAt: Timestamp | null;
    adminId: string | null;
    adminNotes: string | null;
    paymentProof: {
      transactionId: string;
      amount: number;
      method: string; // 'bank_transfer', 'cash', 'wallet'
      timestamp: Timestamp;
    } | null;
  } | null;
  
  // KYC Status
  kycStatus: 'none' | 'pending' | 'verified' | 'rejected';
  kycSubmittedAt: Timestamp | null;
  kycVerifiedAt: Timestamp | null;
  kycDocuments: {
    idFront: string; // Storage URL
    idBack: string;
    selfie: string;
    proofOfAddress: string;
  } | null;
  
  // Statistics
  stats: {
    totalPurchased: number; // Total QAR spent on coins
    totalSpent: number; // Total QAR spent on jobs
    totalReceived: number; // Total QAR received from jobs
    totalWithdrawn: number; // Total QAR withdrawn
    purchaseCount: number;
    jobsPosted: number;
    jobsCompleted: number;
    withdrawalCount: number;
  };
  
  // Audit
  auditPointer: string | null; // Reference to last ledger entry
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Indexes:**
```javascript
// Composite indexes
user_wallets: [
  { fields: ['kycStatus', 'lastActivity'], order: 'desc' },
  { fields: ['pendingWithdrawal.status', 'pendingWithdrawal.requestedAt'], order: 'asc' },
  { fields: ['lastActivity'], order: 'asc' }, // For expiry queries
]
```

---

### **Collection: `guild_vault_daily`**

**Document ID:** `{guildId}_{YYYY-MM-DD}` (sharded by day for scalability)

```typescript
interface GuildVaultDaily {
  // Identity
  guildId: string;
  date: string; // 'YYYY-MM-DD'
  
  // Coin Balances (guild's coins)
  balances: {
    GBC: number;
    GSC: number;
    GGC: number;
    GPC: number;
    GDC: number;
    GRC: number;
  };
  
  // Platform Liability & Reserves
  issuedCoinsTotal: {
    GBC: number; // Total GBC issued to all users
    GSC: number;
    GGC: number;
    GPC: number;
    GDC: number;
    GRC: number;
  };
  
  // Financial Tracking
  fiatReserveQAR: number; // Total QAR held in reserve
  expiredRevenueQAR: number; // Revenue from expired coins
  platformFeesQAR: number; // Revenue from job fees
  
  // Daily Metrics
  dailyMetrics: {
    coinsIssued: number; // QAR value of coins issued today
    coinsSpent: number; // QAR value of coins spent today
    coinsExpired: number; // QAR value of coins expired today
    coinsWithdrawn: number; // QAR value of coins withdrawn today
    transactionCount: number;
  };
  
  // Reconciliation
  lastReconciled: Timestamp;
  reconciliationStatus: 'pending' | 'completed' | 'failed';
  discrepancies: {
    type: string;
    amount: number;
    description: string;
  }[] | null;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Aggregation Document: `guild_vault_summary`**

```typescript
interface GuildVaultSummary {
  // Real-time totals (updated via Cloud Functions)
  totalIssuedCoins: Record<string, number>;
  totalFiatReserve: number;
  totalExpiredRevenue: number;
  totalPlatformFees: number;
  
  // Invariant Check (must always be true)
  invariantA: boolean; // sum(user_wallets) + expired = total_issued
  invariantB: boolean; // fiat_reserve = total_issued * coin_values
  
  lastUpdated: Timestamp;
}
```

---

### **Collection: `ledger`**

**Document ID:** Auto-generated (append-only log)

```typescript
interface LedgerEntry {
  // Entry Identity
  id: string; // Auto-generated
  entryNumber: number; // Sequential number for ordering
  idempotencyKey: string; // Unique key to prevent duplicates
  
  // Entry Type
  type: 
    | 'issue'           // Coin purchase
    | 'spend'           // Job payment
    | 'escrow_lock'     // Lock coins for job
    | 'escrow_release'  // Release coins to freelancer
    | 'escrow_refund'   // Refund coins to client
    | 'withdraw_request'// User requests withdrawal
    | 'withdraw_paid'   // Admin marks withdrawal as paid
    | 'withdraw_rejected'// Admin rejects withdrawal
    | 'expire'          // Coins expired
    | 'transfer'        // Transfer between users (future)
    | 'guild_deposit'   // Deposit to guild vault
    | 'guild_withdraw'  // Withdraw from guild vault
    | 'admin_adjust';   // Admin adjustment (with reason)
  
  // Parties Involved
  userId: string; // Primary user
  relatedUserId: string | null; // Secondary user (for transfers, jobs)
  adminId: string | null; // Admin who performed action
  guildId: string | null; // Guild involved (if applicable)
  
  // Coin Details
  coins: Record<string, number>; // { GBC: 2, GSC: 5 }
  coinUnitValues: Record<string, number>; // { GBC: 5, GSC: 10 } (historical values)
  qarValue: number; // Total QAR value at time of transaction
  
  // Financial Details
  platformFee: number; // Platform fee (if applicable)
  pspFee: number; // PSP fee (if applicable)
  netAmount: number; // Net amount after fees
  
  // Related Entities
  jobId: string | null;
  escrowId: string | null;
  withdrawalId: string | null;
  pspTransactionId: string | null;
  
  // Metadata
  description: string;
  metadata: {
    // Flexible field for additional data
    [key: string]: any;
  };
  
  // Balances After Transaction (for audit)
  balancesAfter: {
    userId: Record<string, number>; // User's balances after this transaction
    relatedUserId?: Record<string, number>; // Related user's balances (if applicable)
  };
  
  // Status
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  failureReason: string | null;
  
  // Timestamps
  timestamp: Timestamp;
  createdAt: Timestamp;
}
```

**Indexes:**
```javascript
ledger: [
  { fields: ['userId', 'timestamp'], order: 'desc' },
  { fields: ['type', 'timestamp'], order: 'desc' },
  { fields: ['idempotencyKey'], unique: true },
  { fields: ['jobId', 'type'], order: 'asc' },
  { fields: ['status', 'timestamp'], order: 'desc' },
]
```

---

### **Collection: `escrows`**

**Document ID:** `{jobId}_{escrowId}`

```typescript
interface Escrow {
  // Identity
  id: string;
  jobId: string;
  clientId: string;
  freelancerId: string;
  
  // Coin Details
  coinsLocked: Record<string, number>; // { GBC: 2, GSC: 5 }
  qarValue: number; // Total QAR value
  
  // Fee Breakdown
  clientFee: number; // 0 (no client fee in new model)
  freelancerFee: number; // 10% of job price
  netToFreelancer: number; // 90% of job price
  
  // Status
  status: 'locked' | 'released' | 'refunded' | 'disputed';
  
  // Timestamps
  createdAt: Timestamp;
  lockedAt: Timestamp;
  resolvedAt: Timestamp | null;
  autoReleaseAt: Timestamp; // 72 hours after completion
  
  // Ledger References
  lockLedgerId: string; // Reference to escrow_lock ledger entry
  releaseLedgerId: string | null; // Reference to escrow_release ledger entry
}
```

---

### **Collection: `audit_logs`**

**Document ID:** Auto-generated

```typescript
interface AuditLog {
  // Actor
  actorId: string;
  actorRole: 'admin' | 'user' | 'system';
  actorName: string;
  
  // Action
  action: string; // 'approve_withdrawal', 'reject_withdrawal', 'adjust_balance', etc.
  resource: string; // 'user_wallet', 'ledger', 'escrow', etc.
  resourceId: string;
  
  // Changes
  before: any; // Snapshot before action
  after: any; // Snapshot after action
  
  // Context
  reason: string | null;
  ip: string | null;
  userAgent: string | null;
  
  // Timestamp
  timestamp: Timestamp;
}
```

---

## 🔧 **BACKEND IMPLEMENTATION**

### **Phase 1: Core Services**

#### **1.1 Coin Service (`backend/src/services/CoinService.ts`)**

```typescript
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';

interface CoinBalances {
  GBC: number;
  GSC: number;
  GGC: number;
  GPC: number;
  GDC: number;
  GRC: number;
}

interface CoinSelection {
  coins: Record<string, number>;
  total: number;
  breakdown: string;
}

export class CoinService {
  private db = admin.firestore();
  
  // Coin catalog (canonical)
  private readonly COIN_CATALOG = {
    GBC: { name: 'Guild Bronze', value: 5, color: '#CD7F32', icon: '🥉' },
    GSC: { name: 'Guild Silver', value: 10, color: '#C0C0C0', icon: '🥈' },
    GGC: { name: 'Guild Gold', value: 50, color: '#FFD700', icon: '🥇' },
    GPC: { name: 'Guild Platinum', value: 100, color: '#E5E4E2', icon: '💎' },
    GDC: { name: 'Guild Diamond', value: 200, color: '#B9F2FF', icon: '💠' },
    GRC: { name: 'Guild Royal', value: 500, color: '#9B59B6', icon: '👑' },
  };
  
  /**
   * Get coin catalog
   */
  getCoinCatalog() {
    return this.COIN_CATALOG;
  }
  
  /**
   * Calculate total QAR value of coins
   */
  calculateTotalValue(balances: CoinBalances): number {
    let total = 0;
    for (const [symbol, quantity] of Object.entries(balances)) {
      const coinInfo = this.COIN_CATALOG[symbol as keyof typeof this.COIN_CATALOG];
      if (coinInfo) {
        total += coinInfo.value * quantity;
      }
    }
    return total;
  }
  
  /**
   * Select coins for payment (Greedy Algorithm)
   */
  selectCoins(targetAmount: number, userBalances: CoinBalances): CoinSelection {
    const coinTiers = [
      { symbol: 'GRC', value: 500 },
      { symbol: 'GDC', value: 200 },
      { symbol: 'GPC', value: 100 },
      { symbol: 'GGC', value: 50 },
      { symbol: 'GSC', value: 10 },
      { symbol: 'GBC', value: 5 },
    ];
    
    let remaining = targetAmount;
    const selected: Record<string, number> = {};
    
    for (const coin of coinTiers) {
      const available = userBalances[coin.symbol as keyof CoinBalances] || 0;
      const needed = Math.floor(remaining / coin.value);
      const use = Math.min(needed, available);
      
      if (use > 0) {
        selected[coin.symbol] = use;
        remaining -= use * coin.value;
      }
    }
    
    if (remaining > 0) {
      throw new Error(`Insufficient coins. Need ${targetAmount} QAR, have ${targetAmount - remaining} QAR`);
    }
    
    // Generate breakdown string
    const breakdown = Object.entries(selected)
      .map(([symbol, qty]) => `${qty}x ${symbol}`)
      .join(', ');
    
    return { coins: selected, total: targetAmount, breakdown };
  }
  
  /**
   * Calculate optimal coin pack for custom amount
   */
  calculateOptimalPack(targetQAR: number): CoinSelection {
    const coinTiers = [
      { symbol: 'GRC', value: 500 },
      { symbol: 'GDC', value: 200 },
      { symbol: 'GPC', value: 100 },
      { symbol: 'GGC', value: 50 },
      { symbol: 'GSC', value: 10 },
      { symbol: 'GBC', value: 5 },
    ];
    
    let remaining = targetQAR;
    const pack: Record<string, number> = {};
    
    for (const coin of coinTiers) {
      const count = Math.floor(remaining / coin.value);
      if (count > 0) {
        pack[coin.symbol] = count;
        remaining -= count * coin.value;
      }
    }
    
    // If there's a remainder, add one more of the smallest coin that covers it
    if (remaining > 0) {
      for (let i = coinTiers.length - 1; i >= 0; i--) {
        if (coinTiers[i].value >= remaining) {
          pack[coinTiers[i].symbol] = (pack[coinTiers[i].symbol] || 0) + 1;
          break;
        }
      }
    }
    
    const actualValue = Object.entries(pack).reduce((sum, [symbol, qty]) => {
      const coin = coinTiers.find(c => c.symbol === symbol);
      return sum + (coin ? coin.value * qty : 0);
    }, 0);
    
    const breakdown = Object.entries(pack)
      .map(([symbol, qty]) => `${qty}x ${symbol}`)
      .join(', ');
    
    return { coins: pack, total: actualValue, breakdown };
  }
  
  /**
   * Validate coin balances (ensure no negative values)
   */
  validateBalances(balances: CoinBalances): boolean {
    for (const [symbol, quantity] of Object.entries(balances)) {
      if (quantity < 0) {
        logger.error(`Invalid balance for ${symbol}: ${quantity}`);
        return false;
      }
    }
    return true;
  }
}

export const coinService = new CoinService();
```

#### **1.2 Ledger Service (`backend/src/services/LedgerService.ts`)**

```typescript
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { coinService } from './CoinService';

interface CreateLedgerEntryData {
  type: string;
  userId: string;
  relatedUserId?: string;
  adminId?: string;
  guildId?: string;
  coins: Record<string, number>;
  qarValue: number;
  platformFee?: number;
  pspFee?: number;
  jobId?: string;
  escrowId?: string;
  withdrawalId?: string;
  pspTransactionId?: string;
  description: string;
  metadata?: any;
  balancesAfter: {
    userId: Record<string, number>;
    relatedUserId?: Record<string, number>;
  };
  idempotencyKey: string;
}

export class LedgerService {
  private db = admin.firestore();
  private readonly COLLECTION = 'ledger';
  
  /**
   * Create ledger entry (append-only)
   */
  async createEntry(data: CreateLedgerEntryData): Promise<string> {
    try {
      // Check idempotency
      const existingEntry = await this.db
        .collection(this.COLLECTION)
        .where('idempotencyKey', '==', data.idempotencyKey)
        .limit(1)
        .get();
      
      if (!existingEntry.empty) {
        logger.warn(`Duplicate ledger entry detected: ${data.idempotencyKey}`);
        return existingEntry.docs[0].id;
      }
      
      // Get next entry number
      const entryNumber = await this.getNextEntryNumber();
      
      // Get coin unit values (historical snapshot)
      const coinCatalog = coinService.getCoinCatalog();
      const coinUnitValues: Record<string, number> = {};
      for (const symbol of Object.keys(data.coins)) {
        coinUnitValues[symbol] = coinCatalog[symbol as keyof typeof coinCatalog]?.value || 0;
      }
      
      // Create entry
      const entry = {
        ...data,
        entryNumber,
        coinUnitValues,
        netAmount: data.qarValue - (data.platformFee || 0) - (data.pspFee || 0),
        status: 'completed',
        failureReason: null,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await this.db.collection(this.COLLECTION).add(entry);
      
      logger.info(`Ledger entry created: ${docRef.id}`, {
        type: data.type,
        userId: data.userId,
        qarValue: data.qarValue,
      });
      
      return docRef.id;
    } catch (error) {
      logger.error('Error creating ledger entry:', error);
      throw error;
    }
  }
  
  /**
   * Get next entry number (sequential)
   */
  private async getNextEntryNumber(): Promise<number> {
    const counterRef = this.db.collection('system').doc('ledger_counter');
    
    try {
      const result = await this.db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        let nextNumber = 1;
        if (counterDoc.exists) {
          nextNumber = (counterDoc.data()?.lastNumber || 0) + 1;
        }
        
        transaction.set(counterRef, { lastNumber: nextNumber }, { merge: true });
        
        return nextNumber;
      });
      
      return result;
    } catch (error) {
      logger.error('Error getting next entry number:', error);
      throw error;
    }
  }
  
  /**
   * Get user's ledger entries
   */
  async getUserEntries(
    userId: string,
    options?: {
      type?: string;
      limit?: number;
      startAfter?: admin.firestore.Timestamp;
    }
  ): Promise<any[]> {
    try {
      let query = this.db
        .collection(this.COLLECTION)
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc');
      
      if (options?.type) {
        query = query.where('type', '==', options.type);
      }
      
      if (options?.startAfter) {
        query = query.startAfter(options.startAfter);
      }
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      const snapshot = await query.get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error('Error getting user entries:', error);
      throw error;
    }
  }
  
  /**
   * Get job-related entries
   */
  async getJobEntries(jobId: string): Promise<any[]> {
    try {
      const snapshot = await this.db
        .collection(this.COLLECTION)
        .where('jobId', '==', jobId)
        .orderBy('timestamp', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      logger.error('Error getting job entries:', error);
      throw error;
    }
  }
}

export const ledgerService = new LedgerService();
```

#### **1.3 Wallet Service (`backend/src/services/CoinWalletService.ts`)**

```typescript
import * as admin from 'firebase-admin';
import { logger } from '../utils/logger';
import { coinService } from './CoinService';
import { ledgerService } from './LedgerService';

interface CoinBalances {
  GBC: number;
  GSC: number;
  GGC: number;
  GPC: number;
  GDC: number;
  GRC: number;
}

interface UserWallet {
  userId: string;
  guildId: string;
  govId: string;
  fullName: string;
  balances: CoinBalances;
  totalValueQAR: number;
  totalCoins: number;
  lastActivity: admin.firestore.Timestamp;
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
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export class CoinWalletService {
  private db = admin.firestore();
  private readonly COLLECTION = 'user_wallets';
  
  /**
   * Get or create user wallet
   */
  async getWallet(userId: string): Promise<UserWallet> {
    try {
      const walletRef = this.db.collection(this.COLLECTION).doc(userId);
      const walletDoc = await walletRef.get();
      
      if (walletDoc.exists) {
        return walletDoc.data() as UserWallet;
      }
      
      // Create new wallet
      const userDoc = await this.db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      const newWallet: UserWallet = {
        userId,
        guildId: userData?.guildId || 'NONE',
        govId: userData?.govId || 'PENDING',
        fullName: userData?.fullName || userData?.displayName || 'Unknown User',
        balances: {
          GBC: 0,
          GSC: 0,
          GGC: 0,
          GPC: 0,
          GDC: 0,
          GRC: 0,
        },
        totalValueQAR: 0,
        totalCoins: 0,
        lastActivity: admin.firestore.Timestamp.now(),
        kycStatus: 'none',
        stats: {
          totalPurchased: 0,
          totalSpent: 0,
          totalReceived: 0,
          totalWithdrawn: 0,
          purchaseCount: 0,
          jobsPosted: 0,
          jobsCompleted: 0,
          withdrawalCount: 0,
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      };
      
      await walletRef.set(newWallet);
      
      logger.info(`Wallet created for user: ${userId}`);
      
      return newWallet;
    } catch (error) {
      logger.error('Error getting wallet:', error);
      throw error;
    }
  }
  
  /**
   * Add coins to wallet (atomic)
   */
  async addCoins(
    userId: string,
    coins: Record<string, number>,
    idempotencyKey: string,
    metadata?: {
      type: string;
      description: string;
      pspTransactionId?: string;
      jobId?: string;
    }
  ): Promise<void> {
    try {
      const walletRef = this.db.collection(this.COLLECTION).doc(userId);
      
      await this.db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        
        if (!walletDoc.exists) {
          throw new Error('Wallet not found');
        }
        
        const wallet = walletDoc.data() as UserWallet;
        const newBalances = { ...wallet.balances };
        
        // Add coins
        for (const [symbol, quantity] of Object.entries(coins)) {
          newBalances[symbol as keyof CoinBalances] += quantity;
        }
        
        // Validate balances
        if (!coinService.validateBalances(newBalances)) {
          throw new Error('Invalid coin balances after addition');
        }
        
        // Calculate new totals
        const totalValueQAR = coinService.calculateTotalValue(newBalances);
        const totalCoins = Object.values(newBalances).reduce((sum, qty) => sum + qty, 0);
        
        // Update wallet
        transaction.update(walletRef, {
          balances: newBalances,
          totalValueQAR,
          totalCoins,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Create ledger entry
        const qarValue = coinService.calculateTotalValue(coins);
        await ledgerService.createEntry({
          type: metadata?.type || 'receive',
          userId,
          coins,
          qarValue,
          description: metadata?.description || 'Coins added',
          metadata,
          balancesAfter: {
            userId: newBalances,
          },
          idempotencyKey,
          pspTransactionId: metadata?.pspTransactionId,
          jobId: metadata?.jobId,
        });
      });
      
      logger.info(`Coins added to wallet: ${userId}`, { coins });
    } catch (error) {
      logger.error('Error adding coins:', error);
      throw error;
    }
  }
  
  /**
   * Deduct coins from wallet (atomic)
   */
  async deductCoins(
    userId: string,
    coins: Record<string, number>,
    idempotencyKey: string,
    metadata?: {
      type: string;
      description: string;
      jobId?: string;
      escrowId?: string;
      withdrawalId?: string;
    }
  ): Promise<void> {
    try {
      const walletRef = this.db.collection(this.COLLECTION).doc(userId);
      
      await this.db.runTransaction(async (transaction) => {
        const walletDoc = await transaction.get(walletRef);
        
        if (!walletDoc.exists) {
          throw new Error('Wallet not found');
        }
        
        const wallet = walletDoc.data() as UserWallet;
        const newBalances = { ...wallet.balances };
        
        // Deduct coins
        for (const [symbol, quantity] of Object.entries(coins)) {
          newBalances[symbol as keyof CoinBalances] -= quantity;
          
          if (newBalances[symbol as keyof CoinBalances] < 0) {
            throw new Error(`Insufficient ${symbol} coins`);
          }
        }
        
        // Validate balances
        if (!coinService.validateBalances(newBalances)) {
          throw new Error('Invalid coin balances after deduction');
        }
        
        // Calculate new totals
        const totalValueQAR = coinService.calculateTotalValue(newBalances);
        const totalCoins = Object.values(newBalances).reduce((sum, qty) => sum + qty, 0);
        
        // Update wallet
        transaction.update(walletRef, {
          balances: newBalances,
          totalValueQAR,
          totalCoins,
          lastActivity: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Create ledger entry
        const qarValue = coinService.calculateTotalValue(coins);
        await ledgerService.createEntry({
          type: metadata?.type || 'spend',
          userId,
          coins,
          qarValue,
          description: metadata?.description || 'Coins deducted',
          metadata,
          balancesAfter: {
            userId: newBalances,
          },
          idempotencyKey,
          jobId: metadata?.jobId,
          escrowId: metadata?.escrowId,
          withdrawalId: metadata?.withdrawalId,
        });
      });
      
      logger.info(`Coins deducted from wallet: ${userId}`, { coins });
    } catch (error) {
      logger.error('Error deducting coins:', error);
      throw error;
    }
  }
}

export const coinWalletService = new CoinWalletService();
```

---

This is **Part 1 of the Master Plan**. The document is getting very long. Should I:

1. **Continue with the remaining sections** (PSP Integration, Frontend, Admin Console, etc.) in this same document?
2. **Split into multiple focused documents** (Backend Plan, Frontend Plan, Admin Plan, etc.)?
3. **Create a summary document** with links to detailed implementation files?

**What's your preference?** I want to ensure you have the most useful format for implementation.

Also, **are you happy with the design decisions** I've made so far (coin selection algorithm, schema structure, service architecture)? Any changes before I continue?

