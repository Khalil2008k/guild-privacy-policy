# 🚨 URGENT: Update Render Environment Variables for Sandbox

## Issue
Still getting `401 Unauthorized - "User data not found!"` because the backend is still using production endpoints instead of sandbox endpoints.

## Solution
Update environment variables in Render to use **sandbox endpoints**.

## Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Select your backend service: `guild-yf7q`
3. Click **Environment** tab

## Step 2: Update/Add These Variables

### Required Variables for Sandbox Mode:
```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://sandbox.sadad.qa/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

### Alternative: Use Test Variables (if available)
```
SADAD_TEST_MID=2334863
SADAD_TEST_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://sandbox.sadad.qa/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
NODE_ENV=development
```

## Step 3: Save and Wait
1. Click **Save Changes**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

## Step 4: Verify Deployment
After deployment, check Render logs for:
```
✅ Using Sadad SANDBOX API base URL: https://sandbox.sadad.qa/api-v4
✅ Using Sadad SANDBOX checkout URL: https://sandbox.sadad.qa/api-v4/payment
```

If you see:
```
✅ Using Sadad PRODUCTION API base URL: https://api.sadadqatar.com/api-v4
```
Then the sandbox detection didn't work - use explicit `SADAD_BASE_URL` and `SADAD_CHECKOUT_URL` variables.

## Test Again
Once deployed with sandbox endpoints, try the payment flow again. The checksum generation should work with your sandbox credentials.

---

**Note:** The code has been updated to support sandbox mode. You just need to update the environment variables in Render.


