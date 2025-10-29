# 🚨 GUILD — Runtime Issues Extracted from Logs

**Date:** 2025-01-15  
**Source:** Expo Go Android logs  
**Environment:** Development (Expo Go)

---

## 🔴 Critical Runtime Errors (P0)

### RUNTIME-001: Firestore Permission Denied - Multiple Collections ✅ FIXED
**Severity:** P0 Blocker  
**Type:** Runtime Security  
**Frequency:** Multiple occurrences  
**Error:**
```
FirebaseError: Missing or insufficient permissions.
```

**Affected Operations:**
1. **GlobalChatNotificationService:**
   - Error: `🔔 GlobalChatNotificationService error: Missing or insufficient permissions`
   - Location: `src/services/GlobalChatNotificationService.ts:33` (onSnapshot query)
   - Query: `query(collection(db, 'chats'), where('participants', 'array-contains', userId))`

2. **Presence Service:**
   - Error: `❌ Presence: Error connecting user: Missing or insufficient permissions`
   - Location: `src/services/PresenceService.ts` (connectUser method)
   - Operation: Writing to `presence/{userId}` collection
   - Retries: 4 attempts, all failed

3. **Chat Listeners:**
   - Error: `Error listening to chat: Missing or insufficient permissions`
   - Error: `Error marking chat as read: Missing or insufficient permissions`
   - Error: `Error in typing subscription: Missing or insufficient permissions`
   - Location: `src/services/firebase/ChatService.ts`, `src/app/(modals)/chat/[jobId].tsx`

4. **Message Sending:**
   - Error: `Error sending message: Missing or insufficient permissions`
   - Error: `Error sending location: Missing or insufficient permissions`

**Root Cause:** Firestore rules deployed to `guild-dev-7f06e` but app connects to `guild-4f46b`. Rules mismatch.

**Fix:** ✅ **DEPLOYED** - Firestore rules deployed to `guild-4f46b` project:
```bash
firebase deploy --only firestore:rules --project guild-4f46b
```

**Status:** ✅ **FIXED** - Rules deployed successfully. Test presence, chat queries, and message sending.

---

### RUNTIME-002: Firebase Storage Permission Denied ✅ FIXED
**Severity:** P0 Blocker  
**Type:** Runtime Security  
**Error:**
```
Firebase Storage: User does not have permission to access 'chats/CPgO9c8iLjJH3Lh1Jtwx/files/8icBgHVjymWLuFyQaHJrK7xlfj72.jpg'. (storage/unauthorized)
```

**Location:** `src/services/chatFileService.ts` (file upload)

**Root Cause:** Storage rules don't allow authenticated users to write to `chats/{chatId}/files/{fileName}`.

**Fix:** ✅ **DEPLOYED** - Storage rules deployed to `guild-4f46b` project:
```bash
firebase deploy --only storage --project guild-4f46b
```

**Status:** ✅ **FIXED** - Rules deployed successfully. Test file uploads.

---

### RUNTIME-003: ImagePicker MediaType Undefined
**Severity:** P0 Blocker  
**Type:** Runtime Logic  
**Error:**
```
TypeError: Cannot read property 'Images' of undefined
```

**Locations:**
- `src/components/ChatInput.tsx:137` - `ImagePicker.launchCameraAsync`
- `src/components/ChatInput.tsx:164` - `ImagePicker.launchImageLibraryAsync`

**Code:**
```typescript
mediaTypes: [ImagePicker.MediaType.Images]  // MediaType is undefined
```

**Root Cause:** `ImagePicker` imported incorrectly or MediaType enum not available in SDK 54.

**Fix:** Import `MediaType` correctly:
```typescript
import * as ImagePicker from 'expo-image-picker';
// Then use: ImagePicker.MediaType.Images
```

---

### RUNTIME-004: Camera Permission Variable Name Error
**Severity:** P0 Blocker  
**Type:** Runtime Logic  
**Error:**
```
ReferenceError: Property 'permission' doesn't exist
```

**Location:** `src/app/(modals)/chat/[jobId].tsx:641`

**Code:**
```typescript
if (!permission?.granted) {  // 'permission' is undefined
```

**Root Cause:** Variable name mismatch. Using `permission` but hooks are `cameraPermission` and `micPermission`.

**Fix:** Use correct variable names:
```typescript
if (!cameraPermission?.granted) {
  await requestCameraPermission();
```

---

### RUNTIME-005: reCAPTCHA Verifier Reset Method Missing
**Severity:** P1 Major  
**Type:** Runtime Logic  
**Error:**
```
TypeError: verifier?._reset is not a function (it is undefined)
```

**Location:** `src/services/firebaseSMSService.ts:130` (sendViaExpoFirebaseRecaptcha)

**Root Cause:** Custom reCAPTCHA verifier object doesn't implement `_reset` method required by Firebase PhoneAuthProvider.

**Fix:** Implement proper reCAPTCHA verifier or skip Firebase SMS in Expo Go entirely, use backend-only.

---

### RUNTIME-006: Backend Token Registration Failure
**Severity:** P1 Major  
**Type:** Runtime Logic  
**Error:**
```
❌ Backend error response: {"message": "Failed to register device token", "success": false}
```

**Location:** `src/config/backend.ts` → `/notifications/register-token`

**Root Cause:** Backend endpoint `/notifications/register-token` failing. May be missing Authorization header validation or other validation.

**Fix:** Check backend logs, verify endpoint implementation.

---

## 🟡 Warnings (Non-Critical)

### WARN-001: Expo Notifications Not Supported in Expo Go
**Severity:** P2 Minor (Expected)  
**Type:** Config/Limitation  
**Warning:**
```
expo-notifications: Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go with the release of SDK 53.
```

**Status:** Expected in Expo Go. Will work in Dev Build.

**Action:** Document limitation, skip gracefully in Expo Go.

---

### WARN-002: Socket URL Not Configured
**Severity:** P2 Minor  
**Type:** Config  
**Warning:**
```
[SocketService] No WebSocket URL configured
```

**Location:** `src/services/socket.ts:41`

**Root Cause:** `EXPO_PUBLIC_WS_URL` environment variable not set.

**Fix:** Add to `app.config.js` or environment config.

---

### WARN-003: Layout Animation Experimental Warning
**Severity:** P2 Minor (Info)  
**Type:** Config  
**Warning:**
```
setLayoutAnimationEnabledExperimental is currently a no-op in the New Architecture.
```

**Status:** Informational - New Architecture limitation.

---

## 📊 Issue Summary

| ID | Severity | Issue | Count | Status |
|----|----------|-------|-------|--------|
| **RUNTIME-001** | P0 | Firestore Permission Denied | 10+ | 🔴 Critical |
| **RUNTIME-002** | P0 | Storage Permission Denied | 1 | 🔴 Critical |
| **RUNTIME-003** | P0 | ImagePicker MediaType Undefined | 2 | 🔴 Critical |
| **RUNTIME-004** | P0 | Camera Permission Variable Error | 1 | 🔴 Critical |
| **RUNTIME-005** | P1 | reCAPTCHA Verifier Reset Missing | 1 | 🟡 Major |
| **RUNTIME-006** | P1 | Backend Token Registration Fails | 1 | 🟡 Major |
| **WARN-001** | P2 | Expo Notifications Expo Go Limitation | 1 | 🟢 Expected |
| **WARN-002** | P2 | Socket URL Not Configured | 1 | 🟡 Minor |
| **WARN-003** | P2 | Layout Animation Warning | 2 | 🟢 Info |

---

## 🔧 Immediate Fixes Required

### 1. Firestore Rules Deployment (RUNTIME-001)
**Priority:** P0  
**Action:** Deploy Firestore rules to `guild-4f46b` project (currently deployed to `guild-dev-7f06e`)

**Steps:**
1. Open Firebase Console: https://console.firebase.google.com/project/guild-4f46b/firestore/rules
2. Copy rules from `firestore-rules-fix.rules`
3. Deploy rules
4. Verify: Check presence, chat, and GlobalChatNotificationService queries

---

### 2. Storage Rules Deployment (RUNTIME-002)
**Priority:** P0  
**Action:** Deploy Storage rules that allow authenticated users to write to chat directories

**Rules Needed:**
```javascript
match /chats/{chatId}/files/{fileName} {
  allow write: if request.auth != null && 
    request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
}
```

---

### 3. ImagePicker Import Fix (RUNTIME-003)
**Priority:** P0  
**Action:** Fix ImagePicker MediaType import in ChatInput.tsx

**File:** `src/components/ChatInput.tsx`

**Fix:**
```typescript
import * as ImagePicker from 'expo-image-picker';

// Then use:
mediaTypes: [ImagePicker.MediaType.Images]
```

---

### 4. Camera Permission Variable Fix (RUNTIME-004)
**Priority:** P0  
**Action:** Fix variable name in video recording function

**File:** `src/app/(modals)/chat/[jobId].tsx:641`

**Fix:**
```typescript
// Change from:
if (!permission?.granted) {

// To:
if (!cameraPermission?.granted) {
  await requestCameraPermission();
  if (!cameraPermission?.granted) {
```

---

### 5. reCAPTCHA Verifier Fix (RUNTIME-005)
**Priority:** P1  
**Action:** Skip Firebase SMS in Expo Go, use backend-only

**File:** `src/services/firebaseSMSService.ts`

**Fix:** Detect Expo Go and skip Firebase attempt entirely, go straight to backend.

---

### 6. Backend Token Registration (RUNTIME-006)
**Priority:** P1  
**Action:** Check backend `/notifications/register-token` endpoint

**Backend File:** `backend/src/routes/notifications.ts`

**Fix:** Verify Authorization header validation, check error handling.

---

## 🎯 Priority Order

1. **Firestore Rules** (RUNTIME-001) - Blocks all chat functionality
2. **Storage Rules** (RUNTIME-002) - Blocks file uploads
3. **ImagePicker Import** (RUNTIME-003) - Blocks image selection
4. **Camera Permission** (RUNTIME-004) - Blocks video recording
5. **reCAPTCHA Verifier** (RUNTIME-005) - SMS fallback works, but should be cleaner
6. **Backend Token** (RUNTIME-006) - Push notifications affected

---

**Status:** Extracted all runtime issues from logs ✅

