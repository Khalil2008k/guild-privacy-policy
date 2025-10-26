# 🚨 CRITICAL: Backend Service Account Update Required

## ⚠️ Current Issue

The backend is using the **WRONG Firebase project**:
- **Current**: `guild-dev-7f06e` ❌
- **Should be**: `guild-4f46b` ✅

This means the backend **CANNOT** access the Firestore rules and Storage rules we just deployed!

---

## 📍 Files That Need Updating

### 1. Backend Service Account Key
**File**: `GUILD-3/backend/serviceAccountKey.json`

**Current**:
```json
{
  "type": "service_account",
  "project_id": "guild-dev-7f06e",  ❌ WRONG
  "client_email": "firebase-adminsdk-fbsvc@guild-dev-7f06e.iam.gserviceaccount.com",
  ...
}
```

**Needs to be**: Service account for `guild-4f46b`

---

## 🔑 How to Get the Correct Service Account

### Option 1: Download from Firebase Console (RECOMMENDED)

1. **Go to Firebase Console**:
   ```
   https://console.firebase.google.com/project/guild-4f46b/settings/serviceaccounts/adminsdk
   ```

2. **Click "Generate New Private Key"**

3. **Download the JSON file**

4. **Replace `GUILD-3/backend/serviceAccountKey.json`** with the downloaded file

5. **Update Render Environment Variables** (if deployed):
   - Go to Render Dashboard → guild-backend
   - Update these environment variables:
     - `FIREBASE_PROJECT_ID` = `guild-4f46b`
     - `FIREBASE_CLIENT_EMAIL` = (from new service account)
     - `FIREBASE_PRIVATE_KEY` = (from new service account)

---

### Option 2: Manual Update (if you have the key)

If you already have the service account key for `guild-4f46b`, update these fields in `serviceAccountKey.json`:

```json
{
  "type": "service_account",
  "project_id": "guild-4f46b",
  "private_key_id": "YOUR_NEW_KEY_ID",
  "private_key": "YOUR_NEW_PRIVATE_KEY",
  "client_email": "firebase-adminsdk-xxxxx@guild-4f46b.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40guild-4f46b.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}
```

---

## 🔐 Security Note

**NEVER commit the service account key to Git!**

The file is already in `.gitignore`, but double-check:
```bash
# Check if it's ignored
git check-ignore backend/serviceAccountKey.json
```

If it's not ignored, add it to `.gitignore`:
```
backend/serviceAccountKey.json
```

---

## ✅ After Updating

1. **Restart the backend server**:
   ```bash
   cd GUILD-3/backend
   npm run dev
   ```

2. **Verify the connection**:
   - Check logs for: `🔥 Firebase Admin SDK initialized successfully`
   - Check logs for: `🔥 FIREBASE PROJECT ID: guild-4f46b`

3. **Test backend endpoints**:
   - Try creating a job offer
   - Try uploading an image
   - Try any Firebase operation

---

## 🚀 Render Deployment (Production)

If your backend is deployed on Render, you MUST update the environment variables:

1. **Go to Render Dashboard**:
   ```
   https://dashboard.render.com/
   ```

2. **Select your backend service** (e.g., `guild-backend`)

3. **Go to Environment tab**

4. **Update these variables**:
   ```
   FIREBASE_PROJECT_ID=guild-4f46b
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@guild-4f46b.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   ```

5. **Save and redeploy**

---

## 📊 Impact

### What Works Now:
- ✅ Frontend uses `guild-4f46b`
- ✅ Firestore rules deployed to `guild-4f46b`
- ✅ Storage rules deployed to `guild-4f46b`

### What Doesn't Work:
- ❌ Backend still connects to `guild-dev-7f06e`
- ❌ Backend cannot access the new rules
- ❌ Backend operations will fail with permission errors

---

## 🎯 Summary

**YOU MUST**:
1. Download service account key for `guild-4f46b` from Firebase Console
2. Replace `GUILD-3/backend/serviceAccountKey.json`
3. Update Render environment variables (if deployed)
4. Restart backend server
5. Test that everything works

**DO NOT**:
- ❌ Commit the service account key to Git
- ❌ Share the service account key publicly
- ❌ Use the old `guild-dev-7f06e` key

---

**🔥 This is CRITICAL for the app to work! Update it now!**

