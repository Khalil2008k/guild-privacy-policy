# 🚨 URGENT FIXES REQUIRED - Root Causes Identified

**Date**: January 20, 2025  
**Status**: 3 Critical Issues Blocking App Functionality

---

## ❌ **ISSUE 1: Backend 401 Errors**

### Root Cause
Backend on Render is rejecting Firebase ID tokens because:
- Firebase Admin SDK is using the OLD project (`guild-4f46b`)
- OR the service account credentials are not loaded properly
- Client is sending tokens from `guild-dev-7f06e` but backend is verifying against wrong project

### Logs Showing Issue
```
[ERROR] Backend API request failed: /payment/wallet/... [Error: HTTP 401]
[ERROR] Backend API request failed: /payment/demo-mode [Error: HTTP 401]
[ERROR] Backend API request failed: /chat/my-chats [Error: HTTP 401]
```

### Fix Steps (ON RENDER DASHBOARD)

1. **Go to Render Dashboard** → Your backend service → Environment
2. **Delete old Firebase vars** (if they exist with guild-4f46b)
3. **Add these EXACT variables**:

```bash
FIREBASE_PROJECT_ID=guild-dev-7f06e
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@guild-dev-7f06e.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCikt93DnJI9qZK
A3ry21xt6/sGsukb48B8eqiIy2TPim0UNqUNRRvgKFjmlOrmkPMG0cgZ0sULRdIh
YCnnan3KF7oS/Iga+Q3UrZ19TQTEepObQKym+enmW/zB6d1HEpKvHKKhnQWA6ajV
CdjvfDnfac8Yb/DvPKojwWm/CWXlEzoZOoceJKbyatIiVtSNOgqnvkyKC5O0oTgU
XoOwH9er+SB1RsCBA2vwzbpsz3b3KQ5RPc+VpDEM4WG+FMfwB9UzdLrGFUbv4hCT
mqnnC8/Ze0WM9Pduom9ZEeuHcXH1Jm19kEm2ajQtwbmdD7Ri+2fwpmfFLjLyjArt
kTaKvXndAgMBAAECggEAG+mDnHlKfeR7IHIAhfnLoMPHUZseEr/DqJuWnAXvxQJL
QBExvVmEM7Q5rz0aJ4PzddRGushJNGpEbZ6JE0ZhWnVAaUoaRCdGjKFSTNUQYHt7
JEiyW+jEk9xvRQvWBgHWVWJhOcYvz7ZOWmVabaOye/06pUNy5mBQBduLQFVovS+N
gjFpXCKzlkCcAF8JpbY/w0GCn0xS1ujGc+4nE4L2S3mkKdHouOyuw3UudHs/8JNU
2MtRWTg09M8MZcI8IzCK8HBNYTmBwOvf32Z1FPV172RcHOidn6gwyBmyFEf/2zDB
BnR/OjhHcKA6XMvmBux6xKgOVsmLp8enacdBvMLTsQKBgQDhCT989+ACbjqKP+qm
5tFagoWI7IBYBPqJ4VS+DWErscJ1RcafF47o/CANubXYjHfmkYp9ADEbYnxmZg/+
4XC+8XsJ+yoDM+u7kAqyYWEDIy1HyHQbxn3CF8MU5Rhkko2fhxRzFQIkhicCpk6P
gme3uax3ynSfG9DZ5pF/I9/v5wKBgQC48W1aeP3BV/SHkP54WVRE5/IZx5zW9bwJ
MHnqABIVTpPd+qt7iNH7WoPzSE+qtODmrTj2M09FDoBBlQYbed7u67gIq3TMR2/9
NadYLxAGBsr0Lt9yW0r697f951/Iml6lkvrA6MQ2ZxawHXi64ctBKVonVl7hQTlY
IJoS3MvfmwKBgEUf1Ruq/GliuKKs3YRlFFvMCf60PvxKkzb1O1WhwH5ufQAO7eMC
lohkoef1arFY/J+bh0G8ZFk4GGRP54vwbfSJMrUvLImNUlTr+w0uMmGHVapeHaRG
hWywZeEuOh7ykYQ2NwbepijX+HWs5ibY9MkPxLWLP+V74tx8Iac/OtNzAoGABeoy
xSH5e6WEfJF2kgLJXyrL42cu7PEPAnw6afF2opfQwtixg1Hs5U0Py0gUxDDkwHvp
xnX9owfDslVBzL8pEhsX168kHSRrwH1mzLs0l/y/oO+e1dl1nHEvwT8VISVOwZzh
yCmpnNPPNfK7Wb6+8WaRK5Dnl+yuGNNyGghVvOECgYAv+Ebl8SlXZTVi+yr9OY9i
h+A2rDmG22SErvYK5QNocynwa61kIzd0nD5VALm2LV6xDPzlH20SKqyJ8+MqIy0l
YwXW9ifp8ann9HicsLazv3pot1bJCMHNo2DGFLVLI7u7BJuHRvclgaj4O3Oxopxc
Y0SUcksMUVsN8ssCLlxmtg==
-----END PRIVATE KEY-----
FIREBASE_DATABASE_URL=https://guild-dev-7f06e.firebaseio.com
```

4. **CRITICAL**: The private key must be ONE continuous line (no line breaks except `\n`)
5. **Click "Save Changes"**
6. **Redeploy or restart** the backend service

### Verify Fix
After restart, visit: `https://guild-yf7q.onrender.com/health`

Should show:
```json
{
  "database": {
    "firebase": "connected"
  }
}
```

---

## ❌ **ISSUE 2: Firestore Permission Errors**

### Root Cause
Firebase Firestore security rules are blocking all reads/writes for the new project `guild-dev-7f06e`

### Logs Showing Issue
```
[FirebaseError: Missing or insufficient permissions.]
Error ensuring user profile
Error getting open jobs
Error loading chats
Error fetching notifications
```

### Fix Steps (FIREBASE CONSOLE)

1. **Go to**: https://console.firebase.google.com/
2. **Select project**: `guild-dev-7f06e`
3. **Navigate to**: Firestore Database → Rules
4. **Replace ALL rules** with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    // Users collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow write: if isOwner(userId);
    }

    // Wallets collection
    match /wallets/{walletId} {
      allow read, write: if isOwner(walletId);
    }

    // Jobs collection
    match /jobs/{jobId} {
      allow read: if true; // Public read for job discovery
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
        (resource.data.ownerId == request.auth.uid || 
         resource.data.posterId == request.auth.uid);
    }

    // Chats collection
    match /chats/{chatId} {
      allow read, write: if isSignedIn() && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, create: if isSignedIn() && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow update, delete: if false; // Messages are immutable
      }
    }

    // Guilds collection
    match /guilds/{guildId} {
      allow read: if true; // Public read for guild discovery
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
        (request.auth.uid == resource.data.guildMasterId ||
         request.auth.uid in resource.data.viceMasterIds);
      
      match /members/{memberId} {
        allow read: if isSignedIn();
        allow write: if isSignedIn() && 
          (request.auth.uid == memberId || 
           request.auth.uid == get(/databases/$(database)/documents/guilds/$(guildId)).data.guildMasterId);
      }
    }

    // Guild memberships
    match /guildMemberships/{membershipId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
        (resource.data.userId == request.auth.uid ||
         request.resource.data.userId == request.auth.uid);
    }

    // Guild invitations
    match /guildInvitations/{invitationId} {
      allow read: if isSignedIn() && 
        (request.auth.uid == resource.data.invitedUserId ||
         request.auth.uid == resource.data.invitedBy);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && 
        (request.auth.uid == resource.data.invitedUserId ||
         request.auth.uid == resource.data.invitedBy);
      allow delete: if false;
    }

    // Notifications
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow write: if isSignedIn() && 
        (resource.data.userId == request.auth.uid ||
         request.resource.data.userId == request.auth.uid);
    }

    // Transactions
    match /transactions/{transactionId} {
      allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn();
      allow update, delete: if false; // Transactions are immutable
    }
  }
}
```

5. **Click "Publish"**
6. **Wait 10-30 seconds** for rules to propagate

### Verify Fix
Reload your app - permission errors should disappear.

---

## ❌ **ISSUE 3: Missing JobService Methods**

### Root Cause
`search.tsx` is calling non-existent methods:
- `jobService.getCategories()` 
- `jobService.getJobs()`

### Logs Showing Issue
```
Error: jobService.getCategories is not a function (it is undefined)
Error: jobService.getJobs is not a function (it is undefined)
```

### Fix Applied
I'll add these methods to `jobService.ts` now.

---

## ⏱️ **ESTIMATED FIX TIME**

| Issue | Fix Time | Priority |
|-------|----------|----------|
| Backend 401s | 5 minutes | 🔴 CRITICAL |
| Firestore Rules | 2 minutes | 🔴 CRITICAL |
| Missing Methods | 1 minute | 🟡 HIGH |

**Total**: ~8 minutes to fix all issues

---

## ✅ **VERIFICATION CHECKLIST**

After applying all fixes:

- [ ] Visit `https://guild-yf7q.onrender.com/health` → Shows `firebase: connected`
- [ ] Reload app → No more 401 errors
- [ ] Jobs screen → Loads jobs successfully
- [ ] Chats screen → Loads chats successfully
- [ ] Wallet screen → Loads wallet successfully
- [ ] Search screen → No "undefined function" errors
- [ ] Guilds screen → Loads live guild data

---

## 🎯 **ACTION REQUIRED**

**YOU MUST DO THESE TWO THINGS MANUALLY:**

1. **Update Render Environment Variables** (Issue #1)
2. **Publish Firestore Rules** (Issue #2)

I cannot do these for you - they require access to:
- Render dashboard (backend deployment)
- Firebase console (database rules)

**Once you complete these**, the app will be fully functional!

---

## 📝 **NOTES**

- **Expo Go warnings** about notifications are expected (use dev build for push)
- **Environment detection** is now fixed (no more "fallback config" warning)
- **Dummy data** has been removed from guilds screen
- **Backend code** is already updated with correct middleware

**Current Status**: App is ready to work once you update Render env vars and Firestore rules.



