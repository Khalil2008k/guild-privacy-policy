# 🔍 Sadad API "User data not found!" Error - Deep Analysis

## Current Error
```json
{
  "error": {
    "statusCode": 401,
    "name": "Error",
    "message": "User data not found!"
  }
}
```

## ✅ What We're Sending (Current Request)

### Endpoint
```
POST https://api.sadadqatar.com/api-v4/userbusinesses/generateChecksum
```

### Headers
```json
{
  "Content-Type": "application/json",
  "secretkey": "+efrWl1GCKwPzJaR",
  "Origin": "https://guild-yf7q.onrender.com"
}
```

### Request Body
```json
{
  "merchant_id": "2334863",
  "WEBSITE": "https://guild-yf7q.onrender.com",
  "TXN_AMOUNT": "33.00",
  "ORDER_ID": "COIN_1762467268565_aATkaEe7",
  "CALLBACK_URL": "https://guild-yf7q.onrender.com/api/payments/sadad/callback",
  "MOBILE_NO": "+97450123456",
  "EMAIL": "testuser1@guild.app",
  "productdetail": [
    {
      "order_id": "COIN_1762467268565_aATkaEe7",
      "quantity": "1",
      "amount": "33"
    }
  ],
  "txnDate": "2025-11-06 22:14:30",
  "VERSION": "2.1"
}
```

## 🔍 Potential Issues Identified

### 1. **Header Name Format** ⚠️
**Current:** `secretkey` (lowercase, no separator)
**Possible alternatives:**
- `Secret-Key` (Pascal-Case with hyphen)
- `X-Secret-Key` (with X- prefix)
- `secret_key` (with underscore)
- `SecretKey` (PascalCase)

**Action:** Try different header name formats

### 2. **Secret Key Format** ⚠️
**Current:** `+efrWl1GCKwPzJaR` (starts with `+`)
**Issue:** The `+` character might need URL encoding or special handling
**Action:** Verify if the secret key should be encoded or if the `+` is correct

### 3. **Merchant ID Format** ⚠️
**Current:** `"2334863"` (string)
**Possible issue:** Might need to be a number or different format
**Action:** Try sending as number or verify format

### 4. **Domain Registration** ⚠️
**Current:** `https://guild-yf7q.onrender.com`
**Issue:** Domain might not be registered/whitelisted in Sadad's system
**Action:** Contact Sadad to verify domain is registered

### 5. **Endpoint Path** ⚠️
**Current:** `/userbusinesses/generateChecksum`
**Possible alternatives:**
- `/user_businesses/generateChecksum` (with underscore)
- `/userBusinesses/generateChecksum` (camelCase)
- `/businesses/generateChecksum` (shorter)

**Action:** Verify exact endpoint path from Sadad documentation

### 6. **API Version/Base URL** ⚠️
**Current:** `https://api.sadadqatar.com/api-v4`
**Possible alternatives:**
- `https://api.sadadqatar.com/api/v4`
- `https://api.sadadqatar.com/v4`
- Different base URL for production

**Action:** Verify correct API base URL

### 7. **Missing Required Fields** ⚠️
**Possible missing fields:**
- `business_id` (separate from merchant_id)
- `user_id` (Sadad user ID)
- `api_key` (separate from secret key)
- Authentication token

**Action:** Check if additional fields are required

## 🧪 Testing Strategy

### Test 1: Header Name Variations
Try these header name formats:
1. `secretkey` (current)
2. `Secret-Key`
3. `X-Secret-Key`
4. `secret_key`
5. `SecretKey`

### Test 2: Secret Key Encoding
1. URL encode the `+` character: `%2BefrWl1GCKwPzJaR`
2. Base64 encode the entire key
3. Verify the key doesn't have special characters that need escaping

### Test 3: Merchant ID Format
1. Send as string: `"2334863"`
2. Send as number: `2334863`
3. Verify if it needs padding or different format

### Test 4: Endpoint Path
1. `/userbusinesses/generateChecksum` (current)
2. `/user_businesses/generateChecksum`
3. `/userBusinesses/generateChecksum`

### Test 5: Base URL
1. `https://api.sadadqatar.com/api-v4` (current)
2. `https://api.sadadqatar.com/api/v4`
3. `https://www.sadadqatar.com/api-v4`

## 📋 What to Verify with Sadad Support

1. **Exact endpoint path** for generateChecksum API
2. **Exact header name** for secret key (case-sensitive?)
3. **Secret key format** - should it be encoded? Is `+` character valid?
4. **Merchant ID format** - string or number?
5. **Domain registration** - is `https://guild-yf7q.onrender.com` registered?
6. **API access activation** - is merchant account activated for API v4?
7. **Base URL** - correct production API URL
8. **Required fields** - are all required fields included?

## 🎯 Most Likely Issues (Priority Order)

1. **Domain not registered** - Most common cause of 401
2. **Header name format** - Case sensitivity or format issue
3. **Secret key encoding** - The `+` character might need special handling
4. **Merchant account not activated** - API access not enabled
5. **Wrong endpoint path** - Path might be slightly different

## ✅ Next Steps

1. **Contact Sadad Support** with:
   - Merchant ID: `2334863`
   - Domain: `https://guild-yf7q.onrender.com`
   - Error: "User data not found!" (401)
   - Request format we're using

2. **Try header variations** in code (if we can test quickly)

3. **Verify secret key** - confirm the regenerated key is correct and active

4. **Check documentation** - verify exact endpoint and header format

---

**Conclusion:** The error "User data not found!" suggests Sadad cannot authenticate or find the merchant account. This is most likely due to:
- Domain not whitelisted
- Header format issue
- Secret key not active/incorrect
- Merchant account not activated for API access



