# 🏦 **ENTERPRISE WALLET SYSTEM - IMPLEMENTATION PLAN**

## 🎯 **USER REQUIREMENTS**

1. **Real-Time Money Tracking**: `Available → Hold → Released`
2. **PSP Integration**: PSP transfers to your account → You pay users
3. **Comprehensive Logging**: Every transaction with GID, Name, Gov ID, Date, Amount, Type
4. **Receipt Generation**: Digital receipts for all transactions
5. **Clean UI**: Comment out future features (currency exchange, etc.)
6. **Keep Only Essential**: Deposit, Withdraw, Transaction History, Escrow

---

## 📊 **WALLET BALANCE STRUCTURE**

```typescript
interface WalletBalance {
  userId: string;
  guildId: string;           // User's Guild ID
  govId: string;             // Government ID Number
  fullName: string;          // User's full legal name
  
  // Money tracking (Real-time)
  available: number;          // Money ready to use
  hold: number;              // Money in escrow (held)
  released: number;          // Total money released from escrow
  totalReceived: number;     // Lifetime received from PSP
  totalWithdrawn: number;    // Lifetime withdrawn
  
  currency: 'QAR';
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 📝 **TRANSACTION LOG STRUCTURE**

```typescript
interface TransactionLog {
  id: string;                     // Unique transaction ID
  transactionNumber: string;      // Human-readable TX#XXXXX
  
  // User Identity (CRITICAL for compliance)
  userId: string;
  guildId: string;                // User's Guild ID
  fullName: string;               // User's full legal name
  govId: string;                  // Government ID Number
  
  // Transaction Details
  type: 'PSP_TOPUP' | 'ESCROW_HOLD' | 'ESCROW_RELEASE' | 'WITHDRAWAL' | 'PLATFORM_FEE' | 'ZAKAT_FEE';
  amount: number;
  currency: 'QAR';
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  
  // Money Flow Tracking
  fromAccount: 'PSP' | 'USER_WALLET' | 'ESCROW' | 'GUILD_PLATFORM';
  toAccount: 'USER_WALLET' | 'ESCROW' | 'GUILD_PLATFORM' | 'EXTERNAL_BANK';
  
  // Related Data
  jobId?: string;                 // If related to a job
  escrowId?: string;              // If escrow transaction
  pspTransactionId?: string;      // PSP's transaction ID
  pspSessionId?: string;          // PSP's session ID
  
  // Metadata
  description: string;
  notes?: string;
  ipAddress?: string;
  deviceInfo?: string;
  
  // Timestamps (CRITICAL for auditing)
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  
  // Receipt
  receiptUrl?: string;            // Link to generated receipt
  receiptGenerated: boolean;
}
```

---

## 🧾 **RECEIPT STRUCTURE**

```typescript
interface Receipt {
  receiptNumber: string;          // REC#XXXXX
  transactionId: string;
  
  // User Details
  guildId: string;
  fullName: string;
  govId: string;
  
  // Transaction Details
  type: string;
  amount: number;
  currency: string;
  date: Date;
  
  // Breakdown
  platformFee?: number;
  zakatFee?: number;
  escrowFee?: number;
  netAmount: number;
  
  // Guild Platform Details
  issuedBy: 'GUILD Platform';
  issueDate: Date;
  digitalSignature: string;
  
  // Status
  verified: boolean;
  generatedAt: Date;
}
```

---

## 🔄 **MONEY FLOW STATES**

### **1. User Top-Up (PSP → User Wallet)**
```
User Pays PSP → PSP Confirms → Webhook → Guild Backend
                                           ↓
                                   Updates User Wallet
                                   available += amount
                                   totalReceived += amount
                                           ↓
                                   Generates Receipt
                                   Sends Notification
```

### **2. Escrow Hold (Job Acceptance)**
```
Job Accepted → Move to Escrow
                    ↓
            User Wallet:
            available -= amount
            hold += amount
                    ↓
            Escrow Created
            Status: HELD
                    ↓
            Generates Receipt
```

### **3. Escrow Release (Job Completion)**
```
Work Approved → Release Escrow
                    ↓
            User Wallet (Freelancer):
            available += (amount - fees)
            released += amount
                    ↓
            User Wallet (Client):
            hold -= amount
                    ↓
            Platform Fees Collected
            Generates Receipt
            Sends Notifications
```

### **4. Withdrawal (User → External Bank)**
```
User Requests Withdrawal → Backend Processes
                                 ↓
                         PSP Transfer API
                                 ↓
                         User Wallet:
                         available -= amount
                         totalWithdrawn += amount
                                 ↓
                         Generates Receipt
                         Sends Confirmation
```

---

## 🗄️ **FIRESTORE COLLECTIONS**

### **1. `wallets/{userId}`**
```javascript
{
  userId: 'USER_ABC123',
  guildId: 'GID_12345',
  govId: '29501234567',
  fullName: 'Ahmed Al-Rashid',
  
  available: 5000.00,
  hold: 2500.00,
  released: 15000.00,
  totalReceived: 22500.00,
  totalWithdrawn: 10000.00,
  
  currency: 'QAR',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### **2. `transaction_logs/{transactionId}`**
```javascript
{
  id: 'TXN_1728234567890',
  transactionNumber: 'TX#100532',
  
  userId: 'USER_ABC123',
  guildId: 'GID_12345',
  fullName: 'Ahmed Al-Rashid',
  govId: '29501234567',
  
  type: 'ESCROW_RELEASE',
  amount: 2500.00,
  currency: 'QAR',
  status: 'SUCCESS',
  
  fromAccount: 'ESCROW',
  toAccount: 'USER_WALLET',
  
  jobId: 'JOB_789',
  escrowId: 'ESC_456',
  
  description: 'Payment released for job: Website Development',
  
  createdAt: Timestamp,
  completedAt: Timestamp,
  
  receiptUrl: 'https://guild.app/receipts/REC#200532.pdf',
  receiptGenerated: true
}
```

### **3. `receipts/{receiptId}`**
```javascript
{
  receiptNumber: 'REC#200532',
  transactionId: 'TXN_1728234567890',
  
  guildId: 'GID_12345',
  fullName: 'Ahmed Al-Rashid',
  govId: '29501234567',
  
  type: 'ESCROW_RELEASE',
  amount: 2500.00,
  currency: 'QAR',
  
  platformFee: 125.00,    // 5%
  zakatFee: 62.50,        // 2.5%
  escrowFee: 250.00,      // 10%
  netAmount: 2062.50,
  
  issuedBy: 'GUILD Platform',
  issueDate: Timestamp,
  digitalSignature: 'SHA256_HASH',
  
  verified: true,
  generatedAt: Timestamp
}
```

---

## 🎨 **UI SCREENS (What to Keep & Comment)**

### **✅ KEEP (Essential for New System)**

1. **Main Wallet Screen**
   - Real-time balance display: `Available | Hold | Released`
   - Quick actions: `Deposit | Withdraw | Escrow`
   - Transaction history list

2. **Transaction History**
   - Filter by type
   - View receipts
   - Export to PDF

3. **Receipt Viewer**
   - Display digital receipt
   - Download/Share
   - Verify authenticity

4. **Withdrawal Screen**
   - Enter amount
   - Select bank account (future PSP integration)
   - Confirm withdrawal

---

### **💾 COMMENT OUT (Future Features)**

1. **Currency Exchange**
   - `currency-manager.tsx` → Comment entire file
   - `currency-conversion-history.tsx` → Comment entire file

2. **Invoice System**
   - `invoice-line-items` link → Comment out button

3. **Refund Processing**
   - `refund-processing-status` → Comment out button

4. **Analytics Dashboard**
   - Advanced charts → Keep basic earnings, comment advanced analytics

5. **Payment Methods**
   - Multiple cards → Keep ONE default method, comment multiple cards

---

## 📱 **SIMPLIFIED WALLET SCREENS**

### **Main Wallet (Simplified)**
```
┌─────────────────────────────────────────┐
│          GUILD Wallet                   │
├─────────────────────────────────────────┤
│                                         │
│  Available Balance                      │
│  QR 5,000.00                           │
│                                         │
│  ┌───────────┬──────────┬────────────┐ │
│  │ Available │   Hold   │  Released  │ │
│  │  5,000    │  2,500   │  15,000    │ │
│  └───────────┴──────────┴────────────┘ │
│                                         │
│  ┌─────┬─────┬─────┐                  │
│  │  💰  │  📤 │  🛡️  │                  │
│  │Topup│Wdrw │Escr │                  │
│  └─────┴─────┴─────┘                  │
│                                         │
├─────────────────────────────────────────┤
│ Recent Transactions                     │
├─────────────────────────────────────────┤
│ ✅ Escrow Released       +2,500 QAR    │
│ 📋 Receipt Available                    │
│                                         │
│ ⏳ Escrow Hold          -1,500 QAR     │
│ 📋 Receipt Available                    │
│                                         │
│ ✅ PSP Top-up           +3,000 QAR     │
│ 📋 Receipt Available                    │
└─────────────────────────────────────────┘
```

---

## 🚀 **IMPLEMENTATION FILES**

### **Backend Files to Create/Modify**

1. **`backend/src/services/walletService.ts`**
   - `getWalletBalance(userId)` - Get real-time balance
   - `topUpWallet(userId, amount, pspTxId)` - After PSP confirmation
   - `holdEscrow(userId, amount, jobId)` - Move to hold
   - `releaseEscrow(escrowId)` - Release to freelancer
   - `withdrawFunds(userId, amount)` - Withdraw to bank

2. **`backend/src/services/transactionLogger.ts`**
   - `logTransaction(data)` - Log every transaction
   - `getTransactionHistory(userId, filters)` - Get history
   - `generateReceipt(transactionId)` - Create receipt

3. **`backend/src/routes/wallet.ts`**
   - `GET /wallet/:userId` - Get balance
   - `POST /wallet/topup` - Top-up (after PSP)
   - `POST /wallet/withdraw` - Request withdrawal
   - `GET /wallet/transactions` - Get history
   - `GET /wallet/receipt/:transactionId` - Get receipt

### **Frontend Files to Modify**

1. **`src/app/(modals)/wallet.tsx`** - Simplify & add real-time tracking
2. **`src/app/(modals)/wallet-dashboard.tsx`** - Comment out advanced features
3. **`src/app/(modals)/payment-methods.tsx`** - Simplify to one method
4. **Create: `src/app/(modals)/receipt-viewer.tsx`** - View receipts
5. **Create: `src/services/walletService.ts`** - Frontend API calls

---

## ✅ **IMPLEMENTATION STEPS**

1. ✅ Create backend wallet service
2. ✅ Create transaction logger
3. ✅ Create receipt generator
4. ✅ Update wallet screens (simplify)
5. ✅ Comment out future features
6. ✅ Test end-to-end flow
7. ✅ Generate documentation

---

**This system ensures 100% transparency, compliance, and evidence tracking!** 🔒







