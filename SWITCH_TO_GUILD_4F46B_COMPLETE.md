# 🔄 **COMPLETE SYSTEM UPDATE: Switch to `guild-4f46b`**

## Date: October 22, 2025, 09:50 UTC

---

## 🎯 **OBJECTIVE:**

Update the ENTIRE system (frontend, backend, documentation) to use `guild-4f46b` consistently, since that's the Firebase project the app is actually using.

---

## 📋 **STEP 1: Get Firebase Config for `guild-4f46b`**

### **Go to Firebase Console:**

1. **Open:** https://console.firebase.google.com/project/guild-4f46b/settings/general
2. **Scroll down to "Your apps"**
3. **Find the Web app** (or create one if it doesn't exist)
4. **Click the config icon** (looks like `</>`)
5. **Copy the firebaseConfig object**

It should look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "guild-4f46b.firebaseapp.com",
  projectId: "guild-4f46b",
  storageBucket: "guild-4f46b.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:...",
  measurementId: "G-..."
};
```

### **Also get the Android app config:**

1. **In Firebase Console**, find the Android app
2. **Copy the `appId`** (should be `1:123456789:android:...`)

---

## 📋 **STEP 2: Update Frontend Configuration**

### **Files to update:**

1. **`app.config.js`** - Lines 60-67
2. **`src/config/environment.ts`** - Firebase config sections
3. **`eas.json`** - All build profiles (development, preview, production)

---

## 📋 **STEP 3: Update Backend Configuration**

### **On Render Dashboard:**

1. **Go to:** https://dashboard.render.com/
2. **Select your backend service**
3. **Click "Environment"**
4. **Update these variables:**
   - `FIREBASE_PROJECT_ID` → `guild-4f46b`
   - `FIREBASE_CLIENT_EMAIL` → (from service account JSON)
   - `FIREBASE_PRIVATE_KEY` → (from service account JSON)

### **Get Service Account Key:**

1. **Go to:** https://console.firebase.google.com/project/guild-4f46b/settings/serviceaccounts/adminsdk
2. **Click "Generate new private key"**
3. **Download the JSON file**
4. **Extract:**
   - `client_email`
   - `private_key` (keep the `\n` characters!)

---

## 📋 **STEP 4: Update Firestore Rules**

1. **Go to:** https://console.firebase.google.com/project/guild-4f46b/firestore/rules
2. **Deploy the production rules** from `GUILD-3/backend/firestore.rules`

---

## 📋 **STEP 5: Test**

1. **Restart Expo:** `npx expo start --clear`
2. **Sign in** with `demo@guild.app`
3. **Check backend logs** - should show token verified successfully
4. **Verify** all API calls return 200 OK

---

## 🚀 **READY TO START?**

**Please provide the Firebase config for `guild-4f46b` and I'll update all the files!**

Get it from: https://console.firebase.google.com/project/guild-4f46b/settings/general

Copy the entire `firebaseConfig` object and paste it here.


