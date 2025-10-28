# 🔥 **FIRESTORE SETUP FOR ADVANCED COIN SYSTEM**

> **Complete guide to set up all required Firestore collections and indexes**

---

## 📦 **REQUIRED COLLECTIONS**

### **1. `coin_instances`** (Main coin tracking)
Each document represents a unique serialized coin.

**Document ID:** `{serialNumber}` (e.g., `GBC-20251022-000001-A1B2C3D4`)

**Fields:**
```typescript
{
  serialNumber: string;           // Unique serial with checksum
  symbol: string;                 // GBC, GSC, GGC, GPC, GDC, GRC
  denomination: number;           // QAR value (5, 10, 50, 100, 200, 500)
  mintedAt: Timestamp;            // When created
  mintedBy: string;               // 'system'
  mintReason: string;             // 'purchase', 'job_reward', 'bonus'
  mintBatch: string;              // Batch ID for Merkle tree
  currentOwner: string;           // User ID
  originalOwner: string;          // First owner
  ownershipChain: Array<{         // Complete history
    owner: string;
    acquiredAt: Timestamp;
    acquiredVia: string;
    transferId: string | null;
  }>;
  status: string;                 // 'active', 'spent', 'withdrawn', 'expired', 'quarantined'
  lockedBy: string | null;        // Job ID if in escrow
  lockedAt: Timestamp | null;
  isPurchased: boolean;           // True if bought with money
  isEarned: boolean;              // True if earned from jobs
  expiryDate: Timestamp | null;   // null for purchased, 24 months for earned
  lastActivityAt: Timestamp;      // For expiry tracking
  signature: string;              // Cryptographic signature
  merkleProof: string[];          // Array of hashes
  merkleRoot: string;             // Root hash of batch
}
```

**Indexes Required:**
```
1. currentOwner (ASC) + status (ASC)
2. status (ASC) + expiryDate (ASC)
3. mintBatch (ASC) + status (ASC)
4. currentOwner (ASC) + symbol (ASC) + status (ASC)
```

---

### **2. `coin_counters`** (Serial number generation)
Tracks the next counter for each coin type per day.

**Document ID:** `{symbol}-{YYYYMMDD}` (e.g., `GBC-20251022`)

**Fields:**
```typescript
{
  count: number;                  // Auto-incrementing counter
  lastUpdated: Timestamp;
}
```

**No indexes required** (simple counter)

---

### **3. `merkle_roots`** (Batch verification)
Stores Merkle tree roots for coin batches.

**Document ID:** Auto-generated

**Fields:**
```typescript
{
  root: string;                   // Merkle root hash
  mintedAt: Timestamp;
  batchSize: number;              // Number of coins in batch
  reason: string;                 // 'purchase', 'job_reward', etc.
  sourceId: string;               // Purchase ID or Job ID
}
```

**Indexes Required:**
```
1. root (ASC)
2. mintedAt (DESC)
```

---

### **4. `quarantined_coins`** (Fraud detection)
Suspicious or fake coins are quarantined here.

**Document ID:** `{serialNumber}`

**Fields:**
```typescript
{
  serialNumber: string;
  reason: string;                 // Why quarantined
  detectedAt: Timestamp;
  detectedBy: string;             // 'system' or admin ID
  suspiciousActivity: any;        // Details of fraud attempt
  status: string;                 // 'quarantined', 'investigating', 'confirmed_fake', 'cleared'
  adminNotes: string;
  reviewedBy: string | null;      // Admin ID
  reviewedAt: Timestamp | null;
}
```

**Indexes Required:**
```
1. status (ASC) + detectedAt (DESC)
2. detectedBy (ASC) + status (ASC)
```

---

### **5. `security_alerts`** (Real-time fraud alerts)
Logs all security events.

**Document ID:** Auto-generated

**Fields:**
```typescript
{
  type: string;                   // 'fake_coin', 'duplicate_serial', 'invalid_signature'
  severity: string;               // 'low', 'medium', 'high', 'critical'
  serialNumber: string;
  userId: string | null;
  details: any;
  detectedAt: Timestamp;
  resolved: boolean;
  resolvedAt: Timestamp | null;
  resolvedBy: string | null;
}
```

**Indexes Required:**
```
1. resolved (ASC) + severity (DESC) + detectedAt (DESC)
2. userId (ASC) + detectedAt (DESC)
```

---

### **6. `wallets`** (User coin balances - EXISTING, needs update)
Enhanced to track coin inventory.

**Document ID:** `{userId}`

**Fields (ADD THESE):**
```typescript
{
  // ... existing fields ...
  
  coinInventory: {                // NEW FIELD
    active: {                     // Coins available to spend
      GBC: string[];              // Array of serial numbers
      GSC: string[];
      GGC: string[];
      GPC: string[];
      GDC: string[];
      GRC: string[];
    };
    locked: {                     // Coins in escrow
      GBC: string[];
      GSC: string[];
      GGC: string[];
      GPC: string[];
      GDC: string[];
      GRC: string[];
    };
  };
  
  totalCoins: {                   // Quick lookup (denormalized)
    GBC: number;
    GSC: number;
    GGC: number;
    GPC: number;
    GDC: number;
    GRC: number;
  };
}
```

**Indexes Required (existing):**
```
1. userId (ASC)
```

---

### **7. `ledger`** (Transaction log - EXISTING, needs update)
Enhanced to include coin serials.

**Document ID:** Auto-generated

**Fields (ADD THESE):**
```typescript
{
  // ... existing fields ...
  
  coinSerials: string[];          // NEW FIELD - Array of serial numbers involved
  
  metadata: {
    // ... existing metadata ...
    coinDetails: Array<{          // NEW FIELD - Detailed coin info
      serial: string;
      symbol: string;
      denomination: number;
    }>;
  };
}
```

**Indexes Required (existing):**
```
1. userId (ASC) + timestamp (DESC)
2. type (ASC) + timestamp (DESC)
```

---

## 🔐 **FIRESTORE SECURITY RULES**

Add these rules to your existing `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... existing rules ...
    
    // Coin Instances - Read-only for users, write-only for backend
    match /coin_instances/{serial} {
      // Users can only read their own coins
      allow read: if request.auth != null && 
                     resource.data.currentOwner == request.auth.uid;
      
      // Only backend can write (via Admin SDK)
      allow write: if false;
    }
    
    // Coin Counters - Backend only
    match /coin_counters/{counter} {
      allow read, write: if false;  // Admin SDK only
    }
    
    // Merkle Roots - Backend only
    match /merkle_roots/{root} {
      allow read, write: if false;  // Admin SDK only
    }
    
    // Quarantined Coins - Admin only
    match /quarantined_coins/{serial} {
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin';
      allow write: if false;  // Admin SDK only
    }
    
    // Security Alerts - Admin only
    match /security_alerts/{alert} {
      allow read: if request.auth != null && 
                     request.auth.token.role == 'admin';
      allow write: if false;  // Admin SDK only
    }
    
    // Wallets - Enhanced with coin inventory
    match /wallets/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Ledger - Enhanced with coin serials
    match /ledger/{entryId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false;  // Admin SDK only
    }
  }
}
```

---

## 📊 **COMPOSITE INDEXES TO CREATE**

Go to Firebase Console → Firestore → Indexes and create these:

### **Index 1: coin_instances - Owner + Status**
```
Collection: coin_instances
Fields:
  - currentOwner (Ascending)
  - status (Ascending)
Query Scope: Collection
```

### **Index 2: coin_instances - Status + Expiry**
```
Collection: coin_instances
Fields:
  - status (Ascending)
  - expiryDate (Ascending)
Query Scope: Collection
```

### **Index 3: coin_instances - Batch + Status**
```
Collection: coin_instances
Fields:
  - mintBatch (Ascending)
  - status (Ascending)
Query Scope: Collection
```

### **Index 4: coin_instances - Owner + Symbol + Status**
```
Collection: coin_instances
Fields:
  - currentOwner (Ascending)
  - symbol (Ascending)
  - status (Ascending)
Query Scope: Collection
```

### **Index 5: merkle_roots - Root lookup**
```
Collection: merkle_roots
Fields:
  - root (Ascending)
Query Scope: Collection
```

### **Index 6: merkle_roots - Recent batches**
```
Collection: merkle_roots
Fields:
  - mintedAt (Descending)
Query Scope: Collection
```

### **Index 7: quarantined_coins - Status + Date**
```
Collection: quarantined_coins
Fields:
  - status (Ascending)
  - detectedAt (Descending)
Query Scope: Collection
```

### **Index 8: security_alerts - Unresolved + Severity**
```
Collection: security_alerts
Fields:
  - resolved (Ascending)
  - severity (Descending)
  - detectedAt (Descending)
Query Scope: Collection
```

---

## 🚀 **QUICK SETUP COMMANDS**

### **Option 1: Firebase CLI (Recommended)**

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login:
```bash
firebase login
```

3. Initialize Firestore (if not already):
```bash
cd GUILD-3/backend
firebase init firestore
```

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

5. Create indexes automatically:
Create a `firestore.indexes.json` file (see below) and run:
```bash
firebase deploy --only firestore:indexes
```

---

## 📄 **firestore.indexes.json**

Create this file in `GUILD-3/backend/`:

```json
{
  "indexes": [
    {
      "collectionGroup": "coin_instances",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "currentOwner", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "coin_instances",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "expiryDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "coin_instances",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mintBatch", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "coin_instances",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "currentOwner", "order": "ASCENDING" },
        { "fieldPath": "symbol", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "merkle_roots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "root", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "merkle_roots",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "mintedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "quarantined_coins",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "detectedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "security_alerts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "resolved", "order": "ASCENDING" },
        { "fieldPath": "severity", "order": "DESCENDING" },
        { "fieldPath": "detectedAt", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## ✅ **VERIFICATION CHECKLIST**

After setup, verify:

- [ ] All 7 collections exist (or will be auto-created on first write)
- [ ] 8 composite indexes created
- [ ] Security rules deployed
- [ ] Backend can write to all collections
- [ ] Users can only read their own coins
- [ ] Admins can access quarantine and alerts

---

## 🔧 **TESTING THE SETUP**

Run this in your backend to test:

```bash
# Test coin minting
curl -X POST https://guild-yf7q.onrender.com/api/coins/purchase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "coins": {"GBC": 10},
    "paymentMethod": "fatora"
  }'

# Check if coin_instances collection was created
# Go to Firebase Console → Firestore → Data
```

---

## 📞 **NEED HELP?**

If you encounter any errors:
1. Check Firebase Console → Firestore → Indexes for "Building" status
2. Verify security rules in Firebase Console → Firestore → Rules
3. Check backend logs for permission errors

---

**That's it! Your Firestore is now ready for the advanced coin system! 🎉**


