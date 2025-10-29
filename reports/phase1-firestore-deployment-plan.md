# 🔥 Phase 1 - Firestore & Storage Rules Deployment Plan

**Date:** 2025-01-15  
**Project:** `guild-4f46b`  
**Status:** Ready to deploy

---

## ✅ Confirmed Configuration

**App Configuration:**
- ✅ `app.config.js` → `EXPO_PUBLIC_FIREBASE_PROJECT_ID: "guild-4f46b"`
- ✅ `src/config/environment.ts` → `projectId: "guild-4f46b"`
- ✅ Runtime logs confirm: `🔥 FIREBASE PROJECT ID: guild-4f46b`

**App is using:** `guild-4f46b` ✅

---

## 🎯 Deployment Steps

### Step 1: Verify Firebase CLI Configuration

```bash
# Check current Firebase project
firebase projects:list

# Check which project is active
firebase use

# If not set to guild-4f46b, switch to it
firebase use guild-4f46b
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules --project guild-4f46b
```

**Rules File:** `firestore.rules` ✅  
**Target:** `guild-4f46b` ✅

### Step 3: Deploy Storage Rules

```bash
firebase deploy --only storage --project guild-4f46b
```

**Rules File:** `storage.rules` ✅  
**Target:** `guild-4f46b` ✅

---

## 📋 Pre-Deployment Checklist

- [ ] Firebase CLI installed: `firebase --version`
- [ ] Logged in: `firebase login`
- [ ] Access to `guild-4f46b` project
- [ ] `.firebaserc` configured for `guild-4f46b`
- [ ] `firebase.json` has correct paths

---

## 🔍 Post-Deployment Verification

### Test 1: Presence Service
```typescript
// Should succeed after rules deployment
await PresenceService.connectUser(userId);
```

### Test 2: Chat Queries
```typescript
// Should succeed after rules deployment
const chats = await chatService.getUserChats(userId);
```

### Test 3: Storage Upload
```typescript
// Should succeed after rules deployment
await chatFileService.uploadFile(chatId, fileUri, fileName, mimeType);
```

---

## 📊 Expected Results

**Before Deployment:**
- ❌ `Missing or insufficient permissions` errors
- ❌ Presence connection fails
- ❌ Chat queries fail
- ❌ Storage uploads fail

**After Deployment:**
- ✅ Presence connection succeeds
- ✅ Chat queries succeed
- ✅ Storage uploads succeed
- ✅ No permission errors

---

## 🚨 Important Notes

1. **Rules are already correct** - Both `firestore.rules` and `storage.rules` have proper participant checks
2. **Only deployment needed** - Rules just need to be deployed to `guild-4f46b` project
3. **No code changes** - App configuration is already correct

---

**Next:** Run deployment commands above ✅

