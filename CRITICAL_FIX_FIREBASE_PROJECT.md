# 🔥 **CRITICAL FIX: Firebase Project Mismatch**

## Date: October 22, 2025, 03:55 UTC

---

## 🚨 **THE PROBLEM**

The GUILD app was generating Firebase ID tokens from the **WRONG Firebase project** (`guild-4f46b`) even though:
- ✅ `app.config.js` was updated with `guild-dev-7f06e` credentials
- ✅ `environment.ts` was updated to read from `app.config.js`
- ✅ Expo Go app data was cleared
- ✅ Expo dev server was restarted with `--clear` flag
- ✅ User signed out and signed back in

**Backend logs showed:**
```
🔥 [FIREBASE AUTH] Error Message: Firebase ID token has incorrect "aud" (audience) claim. 
Expected "guild-dev-7f06e" but got "guild-4f46b".
```

This caused **ALL authenticated API requests to fail with HTTP 401**.

---

## 🔍 **ROOT CAUSE**

Firebase Auth on React Native uses **AsyncStorage for persistence**. When the app was first initialized with the old Firebase project (`guild-4f46b`), Firebase Auth stored the project configuration and user session in AsyncStorage with keys like:

- `firebase:authUser:[API_KEY]:[APP_NAME]`
- `firebase:host:[PROJECT_ID]`
- Other Firebase-related keys

**Even after clearing Expo Go's app data**, these keys persisted because:
1. Firebase Auth caches the project configuration
2. The cached auth instance is reused across app restarts
3. Signing out doesn't clear the Firebase project configuration, only the user session

---

## ✅ **THE FIX**

Added a **"nuclear option"** in `src/config/firebase.tsx` to **force clear ALL Firebase Auth data** from AsyncStorage **BEFORE** initializing Firebase:

```typescript
// 🔥 NUCLEAR OPTION: Clear ALL Firebase Auth data from AsyncStorage
const clearFirebaseAuthCache = async () => {
  try {
    console.log('🔥 CLEARING ALL FIREBASE AUTH CACHE FROM ASYNCSTORAGE...');
    const allKeys = await AsyncStorage.getAllKeys();
    const firebaseKeys = allKeys.filter(key => 
      key.startsWith('firebase:') || 
      key.includes('auth') || 
      key.includes('Firebase')
    );
    
    if (firebaseKeys.length > 0) {
      console.log('🔥 Found Firebase keys to clear:', firebaseKeys);
      await AsyncStorage.multiRemove(firebaseKeys);
      console.log('✅ Firebase Auth cache cleared!');
    } else {
      console.log('✅ No Firebase Auth cache found');
    }
  } catch (error) {
    console.error('❌ Error clearing Firebase Auth cache:', error);
  }
};

// Clear cache immediately before initializing Firebase
await clearFirebaseAuthCache();
```

This ensures that:
1. **All old Firebase project data is removed** from AsyncStorage
2. **Firebase is initialized fresh** with the correct project (`guild-dev-7f06e`)
3. **New tokens are generated** for the correct project

---

## 🧪 **TESTING STEPS**

1. **Stop Expo** (Ctrl+C)
2. **Restart Expo** with `npx expo start --clear`
3. **Open the app** in Expo Go
4. **Check logs** for:
   ```
   🔥 CLEARING ALL FIREBASE AUTH CACHE FROM ASYNCSTORAGE...
   🔥 Found Firebase keys to clear: [...]
   ✅ Firebase Auth cache cleared!
   🔥 FIREBASE PROJECT ID: guild-dev-7f06e
   ```
5. **Sign in** with `demo@guild.app` / `Demo@2025`
6. **Check backend logs** for:
   ```
   🔥 [FIREBASE AUTH] Token verified successfully! User ID: 1TwSrYTugUSF7V0B31jXkTlMKgr1
   ```
7. **Verify** that all API requests return **200 OK** instead of **401 Unauthorized**

---

## 📝 **FILES CHANGED**

1. **`GUILD-3/src/config/firebase.tsx`**
   - Added `clearFirebaseAuthCache()` function
   - Called it before Firebase initialization

2. **`GUILD-3/app.config.js`** (previous fix)
   - Hardcoded Firebase config in `extra` section

3. **`GUILD-3/src/config/environment.ts`** (previous fix)
   - Added `getEnvVar()` helper to read from `Constants.expoConfig.extra`

---

## 🎯 **EXPECTED RESULT**

- ✅ Frontend generates tokens for `guild-dev-7f06e`
- ✅ Backend verifies tokens successfully
- ✅ All authenticated API requests work (200 OK)
- ✅ Firestore operations work (after rules are fixed)

---

## 🚀 **NEXT STEPS**

1. **Test the fix** (restart Expo and sign in)
2. **Fix Firestore rules** (they expired today, October 22, 2025)
3. **Verify all systems work** (jobs, chats, notifications, wallet)
4. **Proceed with production builds** for iOS and Android

---

## 📚 **LESSONS LEARNED**

1. **Firebase Auth persistence is VERY stubborn** on React Native
2. **Clearing app data doesn't always clear AsyncStorage** for all keys
3. **Always verify token `aud` claim** in backend logs when debugging auth issues
4. **Top-level await** in module initialization can be used to ensure async operations complete before app starts

---

## 🔗 **RELATED ISSUES**

- Backend logs: https://dashboard.render.com/web/srv-csnkqv5ds78s73c7ql3g/logs
- Firebase project: https://console.firebase.google.com/project/guild-dev-7f06e
- EAS project: https://expo.dev/accounts/mazen123333/projects/guild-2

---

**Status:** ✅ **FIX DEPLOYED - READY FOR TESTING**
