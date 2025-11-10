# Payment Loading Issue - Debug Guide

**Status:** 🟡 iOS page loads but stuck on "Connecting to payment gateway..."  
**Date:** November 9, 2025

---

## 🎯 Current Situation

### ✅ What's Working
- iOS external payment opens in Safari successfully
- Payment page loads and displays correctly
- No more 401 authentication errors

### 🔴 What's Not Working
- Payment form is stuck on "Connecting to payment gateway..." spinner
- Form is not auto-submitting to Sadad
- Both iOS (Safari) and Android showing same issue

---

## 🔍 Root Cause Analysis

The payment page loads successfully, but the JavaScript form auto-submission is not working. This could be due to:

1. **Missing Sadad Base URL** - `SADAD_BASE_URL` environment variable not set in Render
2. **Invalid Form Action** - The form's `action` attribute is empty or incorrect
3. **JavaScript Execution Blocked** - Safari/Chrome blocking the auto-submit
4. **Form Fields Missing** - Payment parameters not being generated correctly

---

## 🛠️ Fixes Applied (Commit: 593a447)

### 1. Enhanced JavaScript Error Handling
Added validation and error messages before form submission:
```javascript
// Validate form before submission
if (!form.action || form.action === '') {
    document.getElementById('status').innerHTML = 
        '<div class="error">❌ Payment gateway URL is missing. Please contact support.</div>';
} else if (form.elements.length === 0) {
    document.getElementById('status').innerHTML = 
        '<div class="error">❌ Payment data is missing. Please contact support.</div>';
} else {
    // Submit form
    form.submit();
}
```

### 2. Added Console Logging
The page now logs diagnostic information to browser console:
```javascript
console.log('🔍 Form action:', form.action);
console.log('🔍 Form method:', form.method);
console.log('🔍 Form fields count:', form.elements.length);
```

### 3. Backend Logging
Added detailed logging in `sadad-wallet-topup.ts`:
```typescript
logger.info('💰 [Wallet Top-Up] Sadad config loaded', {
  merchantId: config.merchantId?.substring(0, 4) + '***',
  baseUrl: config.baseUrl,
  website: config.website,
  appBaseUrl: config.appBaseUrl
});
```

### 4. Increased Submit Delay
Changed auto-submit delay from 500ms to 1000ms for better stability.

---

## 📋 Testing Steps (After Deployment)

### Step 1: Wait for Render Deployment
1. Go to https://dashboard.render.com
2. Check that the latest commit `593a447` is deployed
3. Wait for "Live" status

### Step 2: Test on iOS (iPad)
1. Open GUILD app on iPad
2. Go to Wallet
3. Tap "Manage Credits"
4. **Safari should open** - ✅ This is working
5. **Look for error messages** on the page:
   - If you see "Payment gateway URL is missing" → Environment variable issue
   - If you see "Payment data is missing" → Form generation issue
   - If still stuck on spinner → Check browser console

### Step 3: Check Browser Console (iOS Safari)
1. On your Mac (if available), connect iPad via USB
2. Open Safari on Mac → Develop menu → Select iPad → Select the guild-yf7q.onrender.com page
3. Look at Console tab for the debug logs:
   ```
   🔍 Form action: https://sadadqa.com/webpurchase
   🔍 Form method: POST
   🔍 Form fields count: 12
   ✅ Submitting form to Sadad...
   ```

### Step 4: Check Render Logs
1. In Render dashboard, go to "Logs" tab
2. Look for the wallet top-up request:
   ```
   💰 [Wallet Top-Up] Initiating for user ...
   💰 [Wallet Top-Up] Sadad config loaded
   💰 [Wallet Top-Up] Payment parameters generated
   ```
3. Check if `baseUrl` is present in the logs

---

## 🔧 Most Likely Issue: Missing SADAD_BASE_URL

If the form action is empty, it means `SADAD_BASE_URL` is not set in Render.

### To Fix:
1. Go to Render dashboard
2. Select GUILD backend service
3. Go to "Environment" tab
4. Click "Add Environment Variable"
5. Add:
   ```
   Key: SADAD_BASE_URL
   Value: https://sadadqa.com/webpurchase
   ```
6. Click "Save Changes"
7. Wait for automatic redeployment

### Other Required Variables:
Make sure these are also set:
```
SADAD_MERCHANT_ID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_WEBSITE=www.guildapp.com
BASE_URL=https://guild-yf7q.onrender.com
```

---

## 🐛 Alternative Debugging Method

If you can't access Safari console, you can test the endpoint directly:

### Test URL (replace USER_ID):
```
https://guild-yf7q.onrender.com/api/v1/payments/sadad/wallet-topup?userId=YOUR_USER_ID&amount=100&returnUrl=guild://wallet
```

**Expected Behavior:**
- Page should load with "Secure Payment" and "100 QAR"
- After 1 second, should redirect to Sadad payment page
- If stuck, should show error message

**What to Look For:**
1. Right-click on the page → "View Page Source"
2. Search for `<form id="sadadForm"`
3. Check if `action="https://sadadqa.com/webpurchase"` is present
4. Check if there are hidden input fields with payment data

---

## 📊 Expected Render Logs (Success)

```
💰 [Wallet Top-Up] Initiating for user aATkaEe7ccRhHxk3I7RvXYGlELn1, amount: 100
💰 [Wallet Top-Up] Sadad config loaded {
  merchantId: '2334***',
  baseUrl: 'https://sadadqa.com/webpurchase',
  website: 'www.guildapp.com',
  appBaseUrl: 'https://guild-yf7q.onrender.com'
}
💾 Payment order stored in Firestore { orderId: 'WALLETaATkaEe71731159085123' }
💰 [Wallet Top-Up] Payment parameters generated {
  orderId: 'WALLETaATkaEe71731159085123',
  amount: '100.00',
  formAction: 'https://sadadqa.com/webpurchase',
  fieldsCount: 12,
  hasSignature: true
}
```

---

## 📊 Expected Render Logs (Failure - Missing Config)

```
💰 [Wallet Top-Up] Initiating for user aATkaEe7ccRhHxk3I7RvXYGlELn1, amount: 100
❌ [Wallet Top-Up] Error: Sadad configuration missing
```

---

## 🔄 Next Steps Based on Results

### If Error Message Shows on Page:
✅ Good! The debugging is working. Share the error message and we'll fix it.

### If Still Stuck on Spinner (No Error):
1. Check Render logs for the config values
2. Check browser console (if possible)
3. View page source to see if form action is populated

### If Redirects to Sadad Successfully:
🎉 Problem solved! The environment variables were the issue.

---

## 📝 Commits Applied

1. **a172c7c** - Fixed iOS 401 error (route reordering)
2. **593a447** - Added error handling and logging to payment form

---

## 🔗 Related Files

- `backend/src/routes/sadad-wallet-topup.ts` - Payment page generation
- `backend/env.example` - Required environment variables
- `EXTERNAL_PAYMENT_DEBUG_STATUS.md` - Overall debug status

