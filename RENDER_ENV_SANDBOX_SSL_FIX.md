# 🔧 Fix Sadad Sandbox SSL Certificate Error

## Issue
Getting SSL certificate error:
```
Hostname/IP does not match certificate's altnames: Host: sandbox.sadad.qa. is not in the cert's altnames
```

## Root Cause
`sandbox.sadad.qa` doesn't have a valid SSL certificate. The certificate only includes:
- `sadad.qa`
- `www.sadad.qa`
- `cpanel.sadad.qa`
- etc.

But NOT `sandbox.sadad.qa`.

## Solution
Use `api-sandbox.sadad.qa` instead, which should have a valid SSL certificate.

## Update Render Environment Variables

### Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Select your backend service: `guild-yf7q`
3. Click **Environment** tab

### Step 2: Update SADAD_BASE_URL and SADAD_CHECKOUT_URL

Change from:
```
SADAD_BASE_URL=https://sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://sandbox.sadad.qa/api-v4/payment
```

To:
```
SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://api-sandbox.sadad.qa/api-v4/payment
```

### Complete Environment Variables:
```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://api-sandbox.sadad.qa/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

### Step 3: Save and Wait
1. Click **Save Changes**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

## Verify Deployment
After deployment, check Render logs for:
```
✅ Using SADAD_BASE_URL from environment: https://api-sandbox.sadad.qa/api-v4
✅ Using SADAD_CHECKOUT_URL from environment: https://api-sandbox.sadad.qa/api-v4/payment
```

## Test Again
Once deployed, try the payment flow again. The SSL certificate error should be resolved.

---

**Note:** The code has been updated to use `api-sandbox.sadad.qa` by default for sandbox mode. You just need to update the environment variables in Render.



