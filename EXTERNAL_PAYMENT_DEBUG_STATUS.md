# External Payment Debug Status

**Date:** November 9, 2025  
**Status:** 🔴 CRITICAL - Two Active Issues

---

## 🔴 Issue 1: iOS External Payment - 401 Unauthorized (FIXED - Deployment Pending)

### Problem
iOS users clicking "Manage Credits" were redirected to browser but received:
```
Authentication failed: No token provided
GET /api/v1/payments/sadad/wallet-topup 401
```

### Root Cause
**Route Conflict in `backend/src/server.ts`:**

The `paymentRoutes` was mounted at `/api/v1/payments` (line 380) with a global authentication middleware:
```typescript
// backend/src/routes/payments.ts (line 74)
router.use(authenticateFirebaseToken);
```

This intercepted ALL requests to `/api/v1/payments/*`, including the public `/api/v1/payments/sadad/wallet-topup` endpoint.

Express matches routes in registration order, and parent paths are checked before child paths.

### Solution Applied
**Commit:** `a172c7c` - "fix: Reorder route registration to prevent auth middleware conflict"

**Changes in `backend/src/server.ts`:**
1. Moved `/api/v1/payments/sadad/wallet-topup` registration **BEFORE** `/api/v1/payments`
2. Added detailed comment explaining the conflict

```typescript
// 🌐 External Wallet Top-Up Web Page (Service Marketplace - Apple Guideline 3.1.5a)
// CRITICAL: Register BEFORE paymentRoutes to avoid authentication middleware conflict
// paymentRoutes has router.use(authenticateFirebaseToken) which would block this public endpoint
app.use('/api/v1/payments/sadad/wallet-topup', sadadWalletTopUpRoutes);

// ✅ SADAD: WebCheckout routes (Signature SHA-256 method)
app.use('/api/v1/payments/sadad', globalRateLimit, sadadWebCheckoutRoutes);

// Payment routes (Basic wallet and demo mode endpoints)
app.use('/api/v1/payments', globalRateLimit, paymentRoutes);
```

### Deployment Status
- ✅ Code committed and pushed to GitHub
- ⏳ Render deployment in progress
- 🔍 Awaiting deployment completion confirmation

### Testing Required
Once deployment completes:
1. Open GUILD app on iPad
2. Navigate to Wallet
3. Tap "Manage Credits" (إدارة الرصيد)
4. Verify Safari opens with Sadad payment page (no 401 error)
5. Complete test payment
6. Verify deep link return to app
7. Verify wallet balance updates

---

## 🔴 Issue 2: Android Sadad Payment - 502 Bad Gateway (ACTIVE)

### Problem
Android users attempting coin purchases receive:
```
502 Bad Gateway
```

### Affected Endpoint
```
POST /api/coins/purchase/sadad/initiate
```

### Possible Root Causes

#### 1. Missing Environment Variables
The endpoint requires:
- `SADAD_MERCHANT_ID`
- `SADAD_SECRET_KEY`
- `SADAD_BASE_URL`
- `BASE_URL`
- `SADAD_WEBSITE`

**Check:** Verify these are set in Render environment variables.

#### 2. Firestore Connection Issues
The endpoint stores payment orders in Firestore:
```typescript
await db.collection('sadad_payment_orders').add(orderData);
```

**Check:** Verify Firebase Admin SDK is initialized correctly and has proper credentials.

#### 3. Server Timeout or Crash
The endpoint might be timing out due to:
- Slow Firestore writes
- Signature generation issues
- Memory/CPU limits on Render

**Check:** Review Render logs for error messages or timeout warnings.

#### 4. Request Validation Failure
The endpoint has strict validation:
```typescript
if (!email || !email.includes('@')) {
  throw new BadRequestError('Valid email address is required');
}
if (!mobileNo || mobileNo.length < 8) {
  throw new BadRequestError('Valid mobile number is required');
}
```

**Check:** Verify the frontend is sending valid email and phone number.

### Code Location
**Backend:** `GUILD-3/backend/src/routes/coin-sadad-purchase.ts` (lines 106-230)  
**Frontend:** `GUILD-3/src/app/(modals)/coin-store.tsx` (lines 281-411)

### Diagnostic Steps

#### Step 1: Check Render Deployment Logs
1. Go to https://dashboard.render.com
2. Select the GUILD backend service
3. Click "Logs" tab
4. Look for:
   - Deployment completion message
   - Error messages around the time of the 502 error
   - Missing environment variable warnings
   - Firebase initialization errors

#### Step 2: Check Environment Variables
1. In Render dashboard, go to "Environment" tab
2. Verify these variables exist:
   - `SADAD_MERCHANT_ID`
   - `SADAD_SECRET_KEY`
   - `SADAD_BASE_URL`
   - `BASE_URL`
   - `SADAD_WEBSITE`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

#### Step 3: Test Backend Health
```bash
curl https://guild-yf7q.onrender.com/health
```

Expected response:
```json
{
  "status": "OK",
  "database": {
    "firebase": "connected"
  }
}
```

#### Step 4: Check Frontend Request
Look at the request being sent from Android:
```typescript
// From coin-store.tsx line 348
response = await BackendAPI.post('/api/coins/purchase/sadad/initiate', {
  customAmount: totalAmount,
  email: currentUser.email || `${currentUser.uid}@guild.app`,
  mobileNo: currentUser.phoneNumber || '+97450123456',
  language: 'ENG'
});
```

Verify:
- `currentUser.email` is valid
- `currentUser.phoneNumber` is at least 8 characters

### Temporary Workaround
If the issue persists, consider:
1. Adding more detailed error logging to the endpoint
2. Implementing a fallback payment method
3. Showing a user-friendly error message with support contact

---

## 📊 Overall Status Summary

| Platform | Feature | Status | Next Action |
|----------|---------|--------|-------------|
| iOS | External Payment (Manage Credits) | 🟡 Fix Deployed, Testing Pending | Wait for Render deployment, then test |
| Android | Sadad Coin Purchase | 🔴 502 Error | Check Render logs and environment variables |
| Web | Sadad Coin Purchase | ❓ Unknown | Test after Android fix |

---

## 🔍 Next Steps

### Immediate (User Action Required)
1. **Check Render Deployment Status**
   - Verify iOS fix deployment completed
   - Check for any deployment errors

2. **Review Render Logs**
   - Look for 502 error details
   - Check for missing environment variables
   - Verify Firebase initialization

3. **Test iOS External Payment**
   - Once deployment completes, test on iPad
   - Report success or any remaining issues

### If Android 502 Persists
1. Share Render logs showing the error
2. Verify environment variables are set
3. Consider adding debug logging to the endpoint
4. May need to add error handling or timeout increases

---

## 📝 Commit History

1. **a172c7c** - "fix: Reorder route registration to prevent auth middleware conflict"
   - Moved wallet-topup route before paymentRoutes
   - Fixed iOS 401 authentication error

---

## 🔗 Related Files

### Backend
- `backend/src/server.ts` - Route registration order
- `backend/src/routes/sadad-wallet-topup.ts` - iOS external payment page
- `backend/src/routes/coin-sadad-purchase.ts` - Android Sadad payment
- `backend/src/routes/payments.ts` - General payment routes (has global auth middleware)

### Frontend
- `src/app/(modals)/wallet.tsx` - Wallet UI with "Manage Credits" button
- `src/app/(modals)/coin-store.tsx` - Coin purchase flow (iOS IAP + Android Sadad)
- `src/utils/deepLinkHandler.ts` - Deep link handling for payment returns

