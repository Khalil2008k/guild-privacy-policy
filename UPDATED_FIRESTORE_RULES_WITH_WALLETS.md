# 🔥 **UPDATED FIRESTORE RULES (WITH WALLETS)**

## Copy these rules to Firebase Console:

**Go to:** https://console.firebase.google.com/project/guild-4f46b/firestore/rules

**Replace with:**

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Wallets - users can read and write their own wallet
    match /wallets/{userId} {
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

**Click "Publish"**

---

## 🔧 **FIX #2: Create Missing Firestore Indexes**

**Click these links to create the indexes automatically:**

### **Notifications Index:**
https://console.firebase.google.com/v1/r/project/guild-4f46b/firestore/indexes?create_composite=ClFwcm9qZWN0cy9ndWlsZC00ZjQ2Yi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC

### **Jobs Index:**
https://console.firebase.google.com/v1/r/project/guild-4f46b/firestore/indexes?create_composite=Ckhwcm9qZWN0cy9ndWlsZC00ZjQ2Yi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvam9icy9pbmRleGVzL18QARoPCgthZG1pblN0YXR1cxABGgoKBnN0YXR1cxABGg0KCWNyZWF0ZWRBdBACGgwKCF9fbmFtZV9fEAI

**Note:** Indexes take 2-5 minutes to build.

---

## 🚀 **AFTER FIXING:**

1. **Deploy the updated rules** (with wallets)
2. **Create the indexes** (click the links above)
3. **Wait 2-3 minutes** for indexes to build
4. **Restart Expo** and test again

---

**UPDATE THE RULES AND CREATE THE INDEXES NOW!**

