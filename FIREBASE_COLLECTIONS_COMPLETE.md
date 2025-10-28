# 🔥 COMPLETE FIREBASE COLLECTIONS REFERENCE

## 🚨 **CRITICAL: This document lists EVERY Firestore collection used in the app**

**Last Updated**: October 25, 2025  
**Scope**: Frontend + Backend + All Screens + All Services

---

## 📋 **Table of Contents**
1. [Core Collections](#core-collections)
2. [Job-Related Collections](#job-related-collections)
3. [Payment & Wallet Collections](#payment--wallet-collections)
4. [Chat & Messaging Collections](#chat--messaging-collections)
5. [Admin & Support Collections](#admin--support-collections)
6. [Security & Monitoring Collections](#security--monitoring-collections)
7. [User Preferences Collections](#user-preferences-collections)
8. [Subcollections](#subcollections)

---

## 👥 **CORE COLLECTIONS**

### **1. `users`** ✅
**Location**: `GUILD-3/src/contexts/AuthContext.tsx:269`
**Operations**: `setDoc`, `updateDoc`, `deleteDoc`

**Write Operations**:
- ✅ Create user on signup (`setDoc`)
- ✅ Update profile (`updateDoc`)
- ✅ Update last login (`updateDoc`)
- ✅ Delete user (`deleteDoc`)
- ✅ Update payment methods (`updateDoc`)
- ✅ Update consents (`updateDoc`)
- ✅ Update privacy settings (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

### **2. `wallets`** ✅
**Location**: `GUILD-3/src/contexts/AuthContext.tsx:290`
**Operations**: `setDoc`, `updateDoc`

**Write Operations**:
- ✅ Create wallet on signup (`setDoc`)
- ✅ Update balance (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /wallets/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

### **3. `userProfiles`** ⚠️
**Location**: `GUILD-3/src/contexts/UserProfileContext.tsx:123`
**Operations**: `setDoc`

**Write Operations**:
- ✅ Create/update user profile (`setDoc`)

**Firestore Rule Needed**:
```javascript
match /userProfiles/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

---

## 💼 **JOB-RELATED COLLECTIONS**

### **4. `jobs`** ✅
**Location**: `GUILD-3/src/services/jobService.ts:172`
**Operations**: `addDoc`, `updateDoc`, `deleteDoc`

**Write Operations**:
- ✅ Create job (`addDoc`)
- ✅ Update job status (`updateDoc`)
- ✅ Post job for review (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /jobs/{jobId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.clientId || 
     request.auth.uid == request.resource.data.clientId);
}
```

---

### **5. `job_offers`** ✅
**Location**: `GUILD-3/src/services/jobService.ts:217`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Submit offer (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /job_offers/{offerId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### **6. `applications`** ✅
**Location**: Multiple files
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Submit application (`addDoc`)
- ✅ Update application status (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /applications/{applicationId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### **7. `contracts`** ⚠️
**Location**: `GUILD-3/src/services/contractService.ts`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create contract (`addDoc`)
- ✅ Update contract (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /contracts/{contractId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.clientId || 
     request.auth.uid == resource.data.freelancerId);
  allow write: if request.auth != null;
}
```

---

### **8. `disputes`** ⚠️
**Location**: `GUILD-3/src/services/disputeLoggingService.ts:439`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create dispute (`addDoc`)
- ✅ Update dispute status (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /disputes/{disputeId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 💰 **PAYMENT & WALLET COLLECTIONS**

### **9. `wallet_transactions`** ✅
**Location**: `GUILD-3/src/services/transactionService.ts`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Create transaction (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /wallet_transactions/{transactionId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

### **10. `coin_purchases`** ⚠️
**Location**: Backend + Frontend
**Operations**: `addDoc`

**Write Operations**:
- ✅ Create purchase record (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /coin_purchases/{purchaseId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

### **11. `coin_withdrawals`** ⚠️
**Location**: Backend + Frontend
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create withdrawal request (`addDoc`)
- ✅ Update withdrawal status (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /coin_withdrawals/{withdrawalId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

### **12. `escrows`** ⚠️
**Location**: `GUILD-3/src/services/escrowService.ts`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create escrow (`addDoc`)
- ✅ Update escrow status (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /escrows/{escrowId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 💬 **CHAT & MESSAGING COLLECTIONS**

### **13. `chats`** ✅
**Location**: `GUILD-3/src/services/chatService.ts:149`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create chat (`addDoc`)
- ✅ Update last message (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /chats/{chatId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.participants;
  allow write: if request.auth != null;
}
```

---

### **14. `messages`** ✅
**Location**: `GUILD-3/src/services/chatService.ts`
**Operations**: `addDoc`, `updateDoc`, `deleteDoc`

**Write Operations**:
- ✅ Send message (`addDoc`)
- ✅ Update message (`updateDoc`)
- ✅ Delete message (`deleteDoc`)

**Firestore Rule Needed**:
```javascript
match /messages/{messageId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### **15. `file_uploads`** ⚠️
**Location**: `GUILD-3/src/services/chatFileService.ts:69`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Record file upload (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /file_uploads/{uploadId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 🔔 **NOTIFICATION COLLECTIONS**

### **16. `notifications`** ✅
**Location**: `GUILD-3/src/app/(modals)/add-job.tsx:387`, `GUILD-3/src/services/jobService.ts:635`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create notification (`addDoc`)
- ✅ Mark as read (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /notifications/{notificationId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

## 🏢 **GUILD COLLECTIONS**

### **17. `guilds`** ✅
**Location**: `GUILD-3/src/services/firebase/GuildService.ts`
**Operations**: `addDoc`, `updateDoc`, `deleteDoc`

**Write Operations**:
- ✅ Create guild (`addDoc`)
- ✅ Update guild (`updateDoc`)
- ✅ Delete guild (`deleteDoc`)

**Firestore Rule Needed**:
```javascript
match /guilds/{guildId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 📝 **FEEDBACK & ANNOUNCEMENTS**

### **18. `feedback`** ⚠️
**Location**: `GUILD-3/src/app/(modals)/feedback-system.tsx:258`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Submit feedback (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /feedback/{feedbackId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

### **19. `announcements`** ⚠️
**Location**: `GUILD-3/src/app/(modals)/announcement-center.tsx`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create announcement (`addDoc`)
- ✅ Update announcement (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /announcements/{announcementId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

## 🛡️ **SECURITY & MONITORING COLLECTIONS**

### **20. `security_events`** ⚠️
**Location**: `GUILD-3/src/services/securityMonitoring.ts:148`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Log security event (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /security_events/{eventId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only backend/system can write
}
```

---

### **21. `security_alerts`** ⚠️
**Location**: `GUILD-3/src/services/securityMonitoring.ts:254`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Create security alert (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /security_alerts/{alertId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only backend/system can write
}
```

---

### **22. `user_blocks`** ⚠️
**Location**: `GUILD-3/src/services/securityMonitoring.ts:286`
**Operations**: `setDoc`

**Write Operations**:
- ✅ Block user (`setDoc`)

**Firestore Rule Needed**:
```javascript
match /user_blocks/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

---

### **23. `admin_escalations`** ⚠️
**Location**: `GUILD-3/src/services/securityMonitoring.ts:306`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Escalate to admin (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /admin_escalations/{escalationId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if false; // Only backend/system can write
}
```

---

## 🔒 **DATA PROTECTION COLLECTIONS**

### **24. `data_export_requests`** ⚠️
**Location**: `GUILD-3/src/services/dataProtection.ts:254`
**Operations**: `setDoc`, `updateDoc`

**Write Operations**:
- ✅ Create export request (`setDoc`)
- ✅ Update export status (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /data_export_requests/{requestId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

### **25. `data_deletion_requests`** ⚠️
**Location**: `GUILD-3/src/services/dataProtection.ts:331`
**Operations**: `setDoc`

**Write Operations**:
- ✅ Create deletion request (`setDoc`)

**Firestore Rule Needed**:
```javascript
match /data_deletion_requests/{requestId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if request.auth != null;
}
```

---

## 👨‍💼 **ADMIN & SUPPORT COLLECTIONS**

### **26. `admin_chats`** ✅
**Location**: `GUILD-3/src/services/AdminChatService.ts`
**Operations**: `addDoc`, `updateDoc`

**Write Operations**:
- ✅ Create admin chat (`addDoc`)
- ✅ Update chat (`updateDoc`)

**Firestore Rule Needed**:
```javascript
match /admin_chats/{chatId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  allow write: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
}
```

---

## 📚 **SUBCOLLECTIONS**

### **27. `jobs/{jobId}/offers`** ✅
**Location**: `GUILD-3/src/app/(modals)/job-accept/[jobId].tsx`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Submit offer (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /jobs/{jobId} {
  match /offers/{offerId} {
    allow read: if request.auth != null;
    allow create: if request.auth != null;
    allow update, delete: if request.auth != null && 
      (request.auth.uid == resource.data.freelancerId || 
       request.auth.uid == get(/databases/$(database)/documents/jobs/$(jobId)).data.clientId);
  }
}
```

---

### **28. `admin_chats/{chatId}/messages`** ✅
**Location**: `GUILD-3/src/services/AdminChatService.ts`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Send message (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /admin_chats/{chatId} {
  match /messages/{messageId} {
    allow read: if request.auth != null && 
      (request.auth.uid == get(/databases/$(database)/documents/admin_chats/$(chatId)).data.userId || 
       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    allow write: if request.auth != null;
  }
}
```

---

### **29. `chats/{chatId}/messages`** ✅
**Location**: `GUILD-3/src/services/chatService.ts`
**Operations**: `addDoc`

**Write Operations**:
- ✅ Send message (`addDoc`)

**Firestore Rule Needed**:
```javascript
match /chats/{chatId} {
  match /messages/{messageId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null;
  }
}
```

---

## 🎯 **SUMMARY**

### **Total Collections**: 29

### **Collections with Rules**: ✅ (13)
- users
- wallets
- jobs
- job_offers
- applications
- guilds
- notifications
- chats
- messages
- wallet_transactions
- admin_chats
- jobs/{jobId}/offers
- admin_chats/{chatId}/messages

### **Collections Missing Rules**: ⚠️ (16)
- userProfiles
- contracts
- disputes
- coin_purchases
- coin_withdrawals
- escrows
- file_uploads
- feedback
- announcements
- security_events
- security_alerts
- user_blocks
- admin_escalations
- data_export_requests
- data_deletion_requests
- chats/{chatId}/messages

---

## 🚨 **NEXT STEPS**

1. **Add missing rules** for the 16 collections above
2. **Deploy rules** to Firebase Console
3. **Test each collection** to ensure proper permissions
4. **Update this document** whenever adding new collections

---

**This is a COMPLETE reference of ALL Firestore collections in the app!** 🔥

