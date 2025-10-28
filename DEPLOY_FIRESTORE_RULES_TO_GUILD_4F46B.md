# 🔥 **DEPLOY FIRESTORE RULES TO `guild-4f46b`**

## Date: October 22, 2025, 10:40 UTC

---

## 🚨 **THE ISSUE:**

Backend logs show:
```
16 UNAUTHENTICATED: Request had invalid authentication credentials
```

This means the Firestore security rules in `guild-4f46b` are blocking the backend's service account.

---

## ✅ **SOLUTION: Deploy Production Rules**

### **Option 1: Via Firebase Console (FASTEST)**

1. **Go to:** https://console.firebase.google.com/project/guild-4f46b/firestore/rules

2. **Replace the entire rules with:**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Jobs are readable by authenticated users, writable by owners
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.clientId || 
         request.auth.uid == request.resource.data.clientId);
    }
    
    // Job offers are readable by authenticated users
    match /job_offers/{offerId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Applications are readable by authenticated users
    match /applications/{applicationId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Guilds are readable by authenticated users
    match /guilds/{guildId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Notifications are readable by the recipient
    match /notifications/{notificationId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null;
    }
    
    // Chats are readable by participants
    match /chats/{chatId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow write: if request.auth != null;
    }
    
    // Messages are readable by chat participants
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Wallet transactions are readable by the user
    match /wallet_transactions/{transactionId} {
      allow read: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow write: if request.auth != null;
    }
    
    // Default deny rule
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **Click "Publish"**

---

### **Option 2: Via Firebase CLI (If you have it installed)**

```bash
cd GUILD-3/backend
firebase use guild-4f46b
firebase deploy --only firestore:rules
```

---

## 🎯 **AFTER DEPLOYING:**

The backend should stop showing the UNAUTHENTICATED error.

---

## 🚀 **THEN TEST THE APP:**

1. **Restart Expo:**
   ```bash
   npx expo start --clear
   ```

2. **Sign in** with `demo@guild.app` / `Demo@2025`

3. **Check backend logs** - should show:
   ```
   🔥 [FIREBASE AUTH] Token verified successfully!
   ```

4. **Verify** all API calls work (no 401 errors!)

---

**GO TO FIREBASE CONSOLE NOW AND DEPLOY THE RULES!**

https://console.firebase.google.com/project/guild-4f46b/firestore/rules


