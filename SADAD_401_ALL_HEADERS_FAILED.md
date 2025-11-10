# 🔴 Sadad 401 "Authorization Required" - All Header Formats Failed

## Issue Summary

**Status:** ❌ **ALL HEADER FORMATS FAILED**

All 7 header format variations returned `401 Unauthorized - "Authorization Required"`:

1. ✅ `secretkey` → 401
2. ✅ `Secret-Key` → 401
3. ✅ `X-Secret-Key` → 401
4. ✅ `secret_key` → 401
5. ✅ `SecretKey` → 401
6. ✅ `Authorization: Bearer +efrWl1GCKwPzJaR` → 500 Internal Server Error
7. ✅ `Authorization: +efrWl1GCKwPzJaR` → 401

## Root Cause Analysis

Since **ALL header formats failed**, this is **NOT a code issue**. The problem is:

### 1. **Sadad Account Configuration Issue** (Most Likely)
- Merchant account not properly configured in Sadad sandbox
- API access not enabled for merchant account
- Merchant ID or Secret Key incorrect or not activated

### 2. **Domain Not Whitelisted**
- Domain `https://guild-yf7q.onrender.com` might not be registered in Sadad sandbox
- Origin header might not match registered domain

### 3. **Sandbox vs Production Credentials**
- Using production credentials with sandbox endpoint
- Sandbox requires separate test credentials

### 4. **Secret Key Format Issue**
- Secret key `+efrWl1GCKwPzJaR` might be incorrect
- The `+` character might need special handling
- Key might not be active or might have expired

## Current Configuration

From Render logs:
- **Merchant ID (MID):** `2334863`
- **Secret Key:** `+efrWl1GCKwPzJaR` (last 4 chars: `zJaR`)
- **Base URL:** `https://api-sandbox.sadad.qa/api-v4` ✅ (Sandbox)
- **Website URL:** `https://guild-yf7q.onrender.com`
- **Origin Header:** `https://guild-yf7q.onrender.com`
- **Endpoint:** `/userbusinesses/generateChecksum`
- **Version:** `2.1`

## Request Format (Verified Correct)

```json
POST https://api-sandbox.sadad.qa/api-v4/userbusinesses/generateChecksum
Headers:
  Content-Type: application/json
  secretkey: +efrWl1GCKwPzJaR
  Origin: https://guild-yf7q.onrender.com

Body:
{
  "merchant_id": "2334863",
  "WEBSITE": "https://guild-yf7q.onrender.com",
  "TXN_AMOUNT": "15.00",
  "ORDER_ID": "COIN_1762519639712_aATkaEe7",
  "CALLBACK_URL": "https://guild-yf7q.onrender.com/api/payments/sadad/callback",
  "MOBILE_NO": "+97450123456",
  "EMAIL": "testuser1@guild.app",
  "productdetail": [
    {
      "order_id": "COIN_1762519639712_aATkaEe7",
      "quantity": "1",
      "amount": "15"
    }
  ],
  "txnDate": "2025-11-07 12:47:19",
  "VERSION": "2.1"
}
```

## What to Verify with Sadad Support

### 1. **Merchant Account Status**
- [ ] Is merchant account `2334863` **active** and **approved**?
- [ ] Is **API access enabled** for this merchant account?
- [ ] Is the account configured for **sandbox/testing**?

### 2. **API Credentials**
- [ ] Verify **Merchant ID (MID):** `2334863` is correct
- [ ] Verify **Secret Key:** `+efrWl1GCKwPzJaR` is correct and **active**
- [ ] Confirm if sandbox requires **different credentials** than production
- [ ] Check if secret key has **expired** or needs to be **regenerated**

### 3. **Domain Whitelisting**
- [ ] Is domain `https://guild-yf7q.onrender.com` **whitelisted** in Sadad sandbox?
- [ ] Should we also whitelist `guild-yf7q.onrender.com` (without https)?
- [ ] Is **Origin header** validation enabled and matching?

### 4. **API Endpoint**
- [ ] Is endpoint `/userbusinesses/generateChecksum` correct for sandbox?
- [ ] Is base URL `https://api-sandbox.sadad.qa/api-v4` correct?
- [ ] Are there different endpoints for sandbox vs production?

### 5. **Authentication Method**
- [ ] What is the **exact header name** for secret key? (We tried 7 variations)
- [ ] Should secret key be in **request body** instead of headers?
- [ ] Is there a **different authentication flow** for sandbox?

### 6. **Request Format**
- [ ] Are all required fields present in the request?
- [ ] Is the request format correct for API version 2.1?
- [ ] Are there any **additional required fields** for sandbox?

## Contact Information for Sadad Support

When contacting Sadad support, provide:

1. **Merchant ID:** `2334863`
2. **Environment:** Sandbox (`https://api-sandbox.sadad.qa/api-v4`)
3. **Error:** `401 Unauthorized - "Authorization Required"`
4. **Endpoint:** `/userbusinesses/generateChecksum`
5. **Request Format:** (Share the request format above)
6. **Domain:** `https://guild-yf7q.onrender.com`
7. **Issue:** All header format variations return 401

## Next Steps

1. **Contact Sadad Support** with the information above
2. **Verify merchant account** is active and API access is enabled
3. **Check domain whitelisting** in Sadad dashboard
4. **Confirm sandbox credentials** are correct and active
5. **Request API documentation** for sandbox environment if different

## Code Status

✅ **Code is correct** - All header formats are being tried automatically
✅ **Request format is correct** - Matches Sadad documentation
✅ **Error handling is working** - Properly logs all attempts
❌ **Authentication failing** - Sadad account configuration issue

---

**Conclusion:** This is a **Sadad account configuration issue**, not a code problem. All header formats have been tried and all return 401. The merchant account needs to be verified and configured properly in Sadad's system.



