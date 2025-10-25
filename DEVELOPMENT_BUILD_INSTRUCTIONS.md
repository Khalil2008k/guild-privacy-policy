# 🚀 **DEVELOPMENT BUILD - FINAL INSTRUCTIONS**

## Date: October 22, 2025, 09:00 UTC

---

## 🚨 **THE SITUATION:**

**Expo Go is PERMANENTLY BROKEN for this app.** The Firebase Auth instance is cached so deeply that nothing can clear it:
- ❌ Clearing AsyncStorage
- ❌ Deleting and reinstalling Expo Go  
- ❌ Updating Firebase config
- ❌ Restarting with `--clear`

**The token is ALWAYS from `guild-4f46b` no matter what!**

---

## ✅ **THE SOLUTION: Development Build**

We've tried to create a development build via EAS but it's failing during dependency installation. 

**Build logs:**
- Attempt 1: https://expo.dev/accounts/mazen123333/projects/guild-2/builds/2a4a8ff7-c37d-4592-bf8e-c3a0223862e6
- Attempt 2: https://expo.dev/accounts/mazen123333/projects/guild-2/builds/90f48242-c9b2-45d0-86ef-045a0a5d8c18

---

## 🔧 **WHAT WE'VE DONE:**

1. ✅ Installed `expo-dev-client` with `--legacy-peer-deps`
2. ✅ Updated `eas.json` development profile with Firebase env vars
3. ✅ Fixed `messagingSenderId` to `654144998705` (guild-dev-7f06e)
4. ❌ EAS build fails during "Install dependencies" phase

---

## 📋 **NEXT OPTIONS:**

### **Option 1: Fix the EAS Build (RECOMMENDED)**

Check the build logs at the URLs above to see the exact dependency error, then:

1. **Fix the dependency conflicts** in `package.json`
2. **Run:** `eas build --profile development --platform android`
3. **Download and install the APK** on your device
4. **Sign in** and verify tokens are from `guild-dev-7f06e`

### **Option 2: Use Production Build Instead**

Since the production build profile already has the correct Firebase config:

```bash
eas build --profile production --platform android
```

This will create an AAB file for Google Play Store, but you can also install it locally for testing.

### **Option 3: Accept Expo Go Limitations**

Keep using Expo Go but:
1. **Delete the user** `demo@guild.app` from Firebase project `guild-4f46b`
2. **Create the user** in Firebase project `guild-dev-7f06e`
3. **Sign in** - the token will be from `guild-dev-7f06e` because that's where the user exists

---

## 🎯 **RECOMMENDED: Option 3 (Quickest)**

**Go to Firebase Console:**

1. **Delete user from guild-4f46b:**
   - URL: https://console.firebase.google.com/project/guild-4f46b/authentication/users
   - Find `demo@guild.app` (UID: `1TwSrYTugUSF7V0B31jXkTlMKgr1`)
   - Click the 3 dots → Delete

2. **Create user in guild-dev-7f06e:**
   - URL: https://console.firebase.google.com/project/guild-dev-7f06e/authentication/users
   - Click "Add user"
   - Email: `demo@guild.app`
   - Password: `Demo@2025`
   - (Optional) Set UID to `1TwSrYTugUSF7V0B31jXkTlMKgr1` to keep the same ID

3. **Restart Expo and sign in:**
   ```bash
   npx expo start --clear
   ```

4. **Sign in with `demo@guild.app` / `Demo@2025`**

5. **Check backend logs** - should show:
   ```
   🔥 [FIREBASE AUTH] Token verified successfully!
   ```

---

## 💡 **WHY OPTION 3 WORKS:**

When you sign in, Firebase Auth looks for the user account. If it only exists in `guild-dev-7f06e`, Firebase will generate a token for that project, regardless of what Expo Go has cached!

---

**CHOOSE AN OPTION AND LET'S FINISH THIS!** 🔥

