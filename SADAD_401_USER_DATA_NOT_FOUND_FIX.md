# 🔧 Sadad 401 "User data not found!" Error Fix

## Issue
Sadad API is returning:
```
401 Unauthorized
{"error": {"statusCode": 401, "name": "Error", "message": "User data not found!"}}
```

## Root Cause
This is a **Sadad account configuration issue**, not a code problem. The API is rejecting the request because:

1. **Merchant account not properly configured** in Sadad dashboard
2. **API access not enabled** for the merchant account
3. **Domain not whitelisted** in Sadad settings
4. **Merchant ID or Secret Key incorrect** or not activated

## Current Configuration

From logs:
- **Merchant ID (MID):** `2334863`
- **Secret Key:** `+efrWl1GCKwPzJaR` (last 4 chars: `zJaR`)
- **Base URL:** `https://api.sadadqatar.com/api-v4`
- **Website URL:** `https://guild-yf7q.onrender.com`
- **Origin Header:** `https://guild-yf7q.onrender.com`

## Solution Steps

### Step 1: Verify Sadad Account Status
1. Log in to Sadad merchant dashboard
2. Check if account is **active** and **approved**
3. Verify merchant ID: `2334863`
4. Check if API access is **enabled**

### Step 2: Verify API Credentials
1. In Sadad dashboard, go to **API Settings** or **Integration Settings**
2. Verify:
   - **Merchant ID (MID):** Should be `2334863`
   - **Secret Key:** Should match `+efrWl1GCKwPzJaR`
   - **API Access:** Should be **enabled**

### Step 3: Whitelist Domain
1. In Sadad dashboard, go to **Domain Whitelist** or **Allowed Domains**
2. Add your backend domain:
   ```
   https://guild-yf7q.onrender.com
   ```
3. Also add (if required):
   ```
   guild-yf7q.onrender.com
   ```

### Step 4: Verify API Endpoint
1. Check if you're using the correct API endpoint:
   - **Production:** `https://api.sadadqatar.com/api-v4`
   - **Test/Sandbox:** (Check Sadad documentation)

### Step 5: Check Request Format
The request is being sent correctly:
```json
{
  "merchant_id": "2334863",
  "WEBSITE": "https://guild-yf7q.onrender.com",
  "TXN_AMOUNT": "15.00",
  "ORDER_ID": "COIN_1762515272773_aATkaEe7",
  "CALLBACK_URL": "https://guild-yf7q.onrender.com/api/payments/sadad/callback",
  "MOBILE_NO": "+97450123456",
  "EMAIL": "testuser1@guild.app",
  "productdetail": [
    {
      "order_id": "COIN_1762515272773_aATkaEe7",
      "quantity": "1",
      "amount": "15"
    }
  ],
  "txnDate": "2025-11-07 11:34:32",
  "VERSION": "2.1"
}
```

Headers:
```
Content-Type: application/json
secretkey: +efrWl1GCKwPzJaR
Origin: https://guild-yf7q.onrender.com
```

## Contact Sadad Support

If the above steps don't work, contact Sadad support with:

1. **Merchant ID:** `2334863`
2. **Error Message:** "User data not found!"
3. **API Endpoint:** `https://api.sadadqatar.com/api-v4/userbusinesses/generateChecksum`
4. **Request Headers:** (as shown above)
5. **Request Payload:** (as shown above)
6. **Backend Domain:** `https://guild-yf7q.onrender.com`

Ask them to:
- Verify merchant account is active
- Enable API access for your account
- Whitelist your domain
- Verify credentials are correct
- Provide test credentials if available

## Alternative: Test Mode

If Sadad provides test/sandbox credentials:
1. Update environment variables in Render:
   ```
   SADAD_TEST_MID=<test_merchant_id>
   SADAD_TEST_SECRET_KEY=<test_secret_key>
   SADAD_TEST_BASE_URL=<test_api_url>
   ```
2. Set `NODE_ENV=development` to use test mode

## Verification

After fixing the account configuration:
1. Try the payment flow again
2. Check backend logs for successful checksum generation
3. Verify the payment URL is generated correctly

---

**Note:** This is a Sadad account configuration issue. The code is correct and sending the request properly. You need to configure your Sadad merchant account correctly.



