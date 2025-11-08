# 🔧 Sadad Sandbox/Test Mode Configuration

## Issue Found
You're using a **test/sandbox secret key**, so you need to use the **sandbox API endpoints** instead of production endpoints.

## Sandbox Endpoints

### API Base URL
- **Sandbox:** `https://sandbox.sadad.qa/api-v4`
- **Alternative:** `https://api-sandbox.sadad.qa/api`

### Checkout URL
- **Sandbox:** `https://sandbox.sadad.qa/api-v4/payment`

## Environment Variables for Render

Update these in Render dashboard:

### Option 1: Use Sandbox Endpoints (Recommended for Testing)
```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://sandbox.sadad.qa/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

### Option 2: Let Code Auto-Detect (Code will detect sandbox mode)
```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

The code will automatically detect sandbox mode and use the correct endpoints.

## Production Endpoints (When Ready)

When you get production credentials, use:
```
SADAD_MID=<production_merchant_id>
SADAD_SECRET_KEY=<production_secret_key>
SADAD_BASE_URL=https://api.sadadqatar.com/api-v4
SADAD_CHECKOUT_URL=https://api.sadadqatar.com/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

## Code Changes

The code has been updated to:
1. **Auto-detect sandbox mode** based on test secret key or `NODE_ENV`
2. **Use sandbox endpoints** when in test mode
3. **Use production endpoints** when in production mode

## Verification

After updating environment variables in Render:
1. Check backend logs for:
   ```
   ✅ Using Sadad SANDBOX API base URL: https://sandbox.sadad.qa/api-v4
   ✅ Using Sadad SANDBOX checkout URL: https://sandbox.sadad.qa/api-v4/payment
   ```
2. Try the payment flow again
3. The checksum generation should now work with sandbox credentials

---

**Note:** Make sure your sandbox merchant account is properly configured in Sadad dashboard.


