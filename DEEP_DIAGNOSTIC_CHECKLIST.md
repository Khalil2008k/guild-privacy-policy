# 🔍 **DEEP DIAGNOSTIC CHECKLIST**

## Date: October 22, 2025, 08:40 UTC

---

## 🚨 **THE PROBLEM:**

Token is STILL from `guild-4f46b` even after:
- ✅ Deleting Expo Go
- ✅ Restarting phone
- ✅ Reinstalling Expo Go
- ✅ Clearing all caches

**Backend logs confirm:**
```
🔥 [FIREBASE AUTH] Error Message: ... Expected "guild-dev-7f06e" but got "guild-4f46b"
```

---

## 🔍 **DEEP DIAGNOSTIC STEPS:**

### **1. CHECK WHICH FIREBASE PROJECT HAS THE USER**

**Go to Firebase Console:**

**Option A: guild-4f46b**
- URL: https://console.firebase.google.com/project/guild-4f46b/authentication/users
- Look for user: `demo@guild.app`
- UID: `1TwSrYTugUSF7V0B31jXkTlMKgr1`

**Option B: guild-dev-7f06e**
- URL: https://console.firebase.google.com/project/guild-dev-7f06e/authentication/users
- Look for user: `demo@guild.app`
- UID: `1TwSrYTugUSF7V0B31jXkTlMKgr1`

**CRITICAL QUESTION:**
- ❓ Which project has this user?
- ❓ If it's in `guild-4f46b`, that's why tokens are from that project!
- ❓ If it's in BOTH projects, we need to delete it from `guild-4f46b`

---

### **2. VERIFY FRONTEND IS USING CORRECT CONFIG**

**Check the logs when app starts:**
```
🔥 FIREBASE PROJECT ID: guild-dev-7f06e  ← Should be this
🔥 FIREBASE AUTH DOMAIN: guild-dev-7f06e.firebaseapp.com  ← Should be this
```

**If you see:**
```
🔥 FIREBASE PROJECT ID: guild-4f46b  ← WRONG!
```

Then the frontend config is still wrong.

---

### **3. CHECK IF USER IS SIGNING IN TO THE WRONG PROJECT**

When you sign in, Firebase Auth will:
1. Use the `apiKey` from the config
2. Connect to the `authDomain` from the config
3. Generate a token for the `projectId` from the config

**The API Key determines which project you're signing into!**

**Current API Key in config:**
```
AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w
```

**Check which project this API key belongs to:**
- Go to: https://console.firebase.google.com/project/guild-dev-7f06e/settings/general
- Look for "Web API Key"
- Does it match `AIzaSyD5i6jUePndKyW1AYI0ANrizNpNzGJ6d3w`?

**If it doesn't match, that's the problem!**

---

### **4. DECODE THE TOKEN TO SEE WHAT'S INSIDE**

**Copy the token from the frontend logs:**
```
🔐 AuthToken: Token details {"length": 1006, "prefix": "eyJhbGciOiJSUzI1NiIs..."}
```

**Decode it at:** https://jwt.io/

**Look for the `aud` claim:**
```json
{
  "aud": "guild-4f46b",  ← This is the problem!
  "iss": "https://securetoken.google.com/guild-4f46b",
  "sub": "1TwSrYTugUSF7V0B31jXkTlMKgr1",
  ...
}
```

**The `aud` (audience) claim shows which Firebase project the token was issued for.**

---

### **5. CHECK IF THERE ARE MULTIPLE FIREBASE APPS IN THE CODE**

Search for any hardcoded Firebase configs:

```bash
cd C:\Users\Admin\GUILD\GUILD-3
grep -r "guild-4f46b" src/
```

If you find any references to `guild-4f46b` in the source code, that's the problem!

---

### **6. VERIFY THE USER ACCOUNT EXISTS IN guild-dev-7f06e**

**If the user `demo@guild.app` doesn't exist in `guild-dev-7f06e`:**

**Option A: Create it manually**
1. Go to: https://console.firebase.google.com/project/guild-dev-7f06e/authentication/users
2. Click "Add user"
3. Email: `demo@guild.app`
4. Password: `Demo@2025`
5. User UID: `1TwSrYTugUSF7V0B31jXkTlMKgr1` (optional, but keeps the same UID)

**Option B: Delete the old user and create a new one**
1. Delete `demo@guild.app` from `guild-4f46b`
2. Sign up as a new user in the app
3. The app will create the user in `guild-dev-7f06e`

---

## 🎯 **MOST LIKELY CAUSES:**

### **Cause #1: User exists in guild-4f46b but not in guild-dev-7f06e**
- **Symptom:** Token is from `guild-4f46b` because that's where the user account is
- **Solution:** Create the user in `guild-dev-7f06e` or migrate the user

### **Cause #2: API Key is from guild-4f46b**
- **Symptom:** Frontend config has the wrong API key
- **Solution:** Update `app.config.js` with the correct API key from `guild-dev-7f06e`

### **Cause #3: Firebase Auth is initializing with cached config**
- **Symptom:** Even with correct config, Firebase uses cached initialization
- **Solution:** Create a development build instead of using Expo Go

---

## 🚀 **NEXT STEPS:**

1. **Check Firebase Console** - Which project has the user?
2. **Verify API Key** - Does it match `guild-dev-7f06e`?
3. **Decode the token** - What's the `aud` claim?
4. **Search for hardcoded configs** - Any `guild-4f46b` references?
5. **Create user in guild-dev-7f06e** if it doesn't exist

---

## 💣 **NUCLEAR OPTION: CREATE DEVELOPMENT BUILD**

If nothing works, create a standalone development build:

```bash
cd C:\Users\Admin\GUILD\GUILD-3
npx expo install expo-dev-client
eas build --profile development --platform android
```

This will:
- ✅ Bake the correct Firebase config into the app
- ✅ Not share state with Expo Go
- ✅ Give you a standalone APK to install

---

**WORK THROUGH THIS CHECKLIST AND REPORT BACK WHAT YOU FIND!** 🔍


