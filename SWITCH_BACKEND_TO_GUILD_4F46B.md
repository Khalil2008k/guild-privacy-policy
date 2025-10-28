# 🔄 **SWITCH BACKEND TO USE `guild-4f46b`**

## Date: October 22, 2025, 09:45 UTC

---

## 🚨 **THE SITUATION:**

**The app is ACTUALLY using `guild-4f46b` for authentication, NOT `guild-dev-7f06e`!**

Even though we:
- ✅ Updated `app.config.js` with `guild-dev-7f06e` config
- ✅ Updated `environment.ts` with `guild-dev-7f06e` config
- ✅ Cleared Firebase cache with "nuclear option"
- ✅ Restarted Expo with `--clear`

**Expo Go's Firebase cache is SO DEEP that it's STILL using `guild-4f46b`!**

---

## 🔍 **PROOF:**

When you added the user to `guild-dev-7f06e` → **Didn't work**
When you added the user to `guild-4f46b` → **Worked perfectly!**

This proves the app is authenticating against `guild-4f46b`, not `guild-dev-7f06e`.

---

## ✅ **THE FIX: Update Backend to Use `guild-4f46b`**

### **Step 1: Go to Render Dashboard**

https://dashboard.render.com/

### **Step 2: Select your backend service**

Click on: **guild-yf7q** (or whatever your backend service is named)

### **Step 3: Go to Environment**

Click "Environment" in the left sidebar

### **Step 4: Update these variables:**

Find and update:

```
FIREBASE_PROJECT_ID=guild-4f46b
```

Also update the service account credentials to match `guild-4f46b`:

1. **Go to Firebase Console for guild-4f46b:**
   https://console.firebase.google.com/project/guild-4f46b/settings/serviceaccounts/adminsdk

2. **Click "Generate new private key"**

3. **Download the JSON file**

4. **Extract these values and update in Render:**
   - `FIREBASE_CLIENT_EMAIL` → The `client_email` from the JSON
   - `FIREBASE_PRIVATE_KEY` → The `private_key` from the JSON (keep the `\n` characters!)

### **Step 5: Save and Redeploy**

Click "Save Changes" → Render will automatically redeploy the backend

---

## 🎯 **AFTER REDEPLOYMENT:**

1. **Wait 2-3 minutes** for the backend to restart
2. **Sign in to the app** with `demo@guild.app` (the one in `guild-4f46b`)
3. **Check backend logs** - should show:
   ```
   🔥 [FIREBASE AUTH] Token verified successfully!
   ```

---

## 📋 **ALTERNATIVE: Keep Backend on `guild-dev-7f06e` and Build APK**

If you want to keep the backend on `guild-dev-7f06e`, you need to create a development build:

```bash
eas build --profile development --platform android
```

This creates a standalone APK with the correct Firebase config baked in.

---

**CHOOSE ONE:**
- 🔄 **Option 1:** Update backend to `guild-4f46b` (5 minutes)
- 📱 **Option 2:** Build development APK (30-60 minutes)

---

**WHICH OPTION DO YOU WANT?** 🔥


