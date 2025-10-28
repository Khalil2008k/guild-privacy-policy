# 🚨 DEPLOY FIREBASE RULES NOW!

## The Error You're Seeing:
```
ERROR  Error submitting offer: [FirebaseError: Missing or insufficient permissions.]
```

## Why It's Happening:
Your Firestore security rules don't allow creating offers in the `job_offers` collection or `jobs/{jobId}/offers` subcollection.

---

## 🔥 STEP-BY-STEP FIX:

### **Step 1: Open Firebase Console**
Click this link: https://console.firebase.google.com/project/guild-4f46b/firestore/rules

### **Step 2: Copy the Updated Rules**
Open the file: `UPDATED_FIRESTORE_RULES_WITH_WALLETS.md`

Copy everything from line 10 to line 101 (the entire rules block)

### **Step 3: Paste in Firebase Console**
1. Delete ALL existing rules in the Firebase Console
2. Paste the new rules
3. Click **"Publish"** button (top right)
4. Wait 5-10 seconds for deployment

### **Step 4: Restart Your App**
```bash
# In your terminal, press Ctrl+C to stop Expo
# Then restart:
npm start
```

---

## 📋 Quick Copy-Paste Rules:

```javascript
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
      
      // Job offers subcollection
      match /offers/{offerId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          (request.auth.uid == resource.data.freelancerId || 
           request.auth.uid == get(/databases/$(database)/documents/jobs/$(jobId)).data.clientId);
      }
    }
    
    // Job offers (legacy - for backward compatibility)
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
    
    // Admin chats - users can read/write their own chats, admins can read all
    match /admin_chats/{chatId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      
      // Messages subcollection
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          (request.auth.uid == get(/databases/$(database)/documents/admin_chats/$(chatId)).data.userId || 
           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
        allow write: if request.auth != null;
      }
    }
    
    // Default deny rule
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## ✅ After Deployment:

1. **Wait 10 seconds** for rules to propagate
2. **Restart your app** (Ctrl+C then `npm start`)
3. **Try submitting an offer again**
4. **Should work!** ✨

---

## 🐛 Still Not Working?

If you still get the error after deploying:

1. Check Firebase Console shows "Last published: just now"
2. Clear app cache: Settings → Clear Data
3. Sign out and sign in again
4. Try again

---

**DO THIS NOW BEFORE TESTING ANYTHING ELSE!** 🚀

