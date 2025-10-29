# 🧪 Diagnostic Screen Testing Guide

**Date:** 2025-01-15  
**Location:** `/diagnostic` screen in Expo app

---

## How to Access Diagnostic Screen

1. **Start Expo app:**
   ```bash
   npm start
   # or
   expo start
   ```

2. **Navigate to diagnostic screen:**
   - In Expo Go: Shake device → Navigate to `/diagnostic`
   - Or directly: `exp://localhost:8081/--/diagnostic`
   - Or add button in app: `router.push('/diagnostic')`

---

## Tests Available

The diagnostic screen tests 5 critical subsystems:

### 1. ✅ Presence Test
**What it tests:**
- Presence service connection
- User presence tracking
- Firestore presence document creation

**Expected Result:**
- ✅ "Presence service connected successfully"
- Creates/updates document in `presence/{userId}`

**Failure Indicators:**
- ❌ "Presence failed: No authenticated user"
- ❌ "Presence failed: Missing or insufficient permissions"

---

### 2. ✅ Firestore Test
**What it tests:**
- Firestore read permissions
- User document access
- Firestore write capabilities

**Expected Result:**
- ✅ "Firestore read/write working"
- Should access `users/{userId}` document

**Failure Indicators:**
- ❌ "Firestore failed: Missing or insufficient permissions"
- ❌ "Firestore failed: Network error"

---

### 3. ✅ Payment Test
**What it tests:**
- Backend API connectivity
- `/api/v1/payments/demo-mode` endpoint
- Response structure validation

**Expected Result:**
- ✅ "Payment endpoints responding"
- Response: `{ success: true, demoMode: false }`

**Failure Indicators:**
- ❌ "Payment failed: HTTP 404"
- ❌ "Payment failed: Network error"
- ❌ Check `reports/P0-PATCHES-APPLIED.md` if endpoint path issues

---

### 4. ✅ Push Test
**What it tests:**
- Expo notifications permission
- Push token generation
- Token registration with backend

**Expected Result:**
- ✅ "Push token registered successfully"
- Token stored in Firestore/backend

**Failure Indicators:**
- ❌ "Push failed: Permission denied"
- ❌ "Push failed: Missing EAS projectId"
- ⚠️ In Expo Go: May show warnings (expected)

---

### 5. ✅ Camera Test
**What it tests:**
- Camera permission request
- Microphone permission request
- Permission status verification

**Expected Result:**
- ✅ "Camera and microphone access granted"
- Both permissions show `granted: true`

**Failure Indicators:**
- ❌ "Camera failed: Permission denied"
- ❌ "Camera failed: No authenticated user"

---

## Running All Tests

1. **Open diagnostic screen** (see above)

2. **Tap "Run All Tests" button**

3. **Wait for completion** (should take 5-10 seconds)

4. **Review results:**
   - ✅ Green checkmarks = Success
   - ❌ Red X = Failed
   - ⏳ Pending = Still running

5. **Screenshot results:**
   - Take screenshot of entire screen
   - Save as `diagnostic-results-20250115.png`
   - Include timestamp in filename

---

## Expected Output Screenshot

```
🔍 GUILD Diagnostic Screen
==========================

✅ Presence           Connected      (2025-01-15 10:30:00)
✅ Firestore          Read/Write OK  (2025-01-15 10:30:01)
✅ Payment            Demo mode: false (2025-01-15 10:30:02)
✅ Push               Token registered (2025-01-15 10:30:03)
✅ Camera             Permissions granted (2025-01-15 10:30:04)

All tests passed! ✅
```

---

## Troubleshooting

### If Presence Test Fails:
- Check Firestore rules: `presence/{userId}` should allow read/write for authenticated users
- Verify user is authenticated: Check `AuthContext`
- Check console logs for specific error

### If Firestore Test Fails:
- Check Firestore rules: `users/{userId}` should allow read for authenticated users
- Verify Firebase project ID matches
- Check network connectivity

### If Payment Test Fails:
- Verify backend is running: `https://guild-yf7q.onrender.com`
- Check endpoint path: `/api/v1/payments/demo-mode`
- Verify backend route is mounted correctly
- Check `BackendAPI.baseURL` configuration

### If Push Test Fails:
- In Expo Go: Warnings are expected (no real push support)
- Check EAS project ID in `app.config.js`
- Verify notification permissions in device settings

### If Camera Test Fails:
- Check app permissions in device settings
- Verify permissions in `app.config.js` (infoPlist for iOS, permissions for Android)
- Check if permissions were denied previously

---

## Post-Test Actions

1. **Save screenshot** to `reports/diagnostic-results-20250115.png`

2. **Review any failures** and check:
   - Error messages in console
   - Firestore rules deployment
   - Backend connectivity
   - Environment configuration

3. **Update audit report** with test results:
   - Mark tests as ✅ passed or ❌ failed
   - Note any warnings or issues
   - Document fixes needed

---

## Next Steps After Testing

1. ✅ **All tests pass:** Proceed to Phase 2 deployment
2. ⚠️ **Some tests fail:** Fix issues, re-test
3. ❌ **Critical tests fail:** Review P0 patches, check configuration

---

**Status:** Ready for testing 🧪

