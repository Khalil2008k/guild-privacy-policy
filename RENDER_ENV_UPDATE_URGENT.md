# 🚨 URGENT: Update Render Environment Variables

## Issue
Backend is still using `sandbox.sadad.qa` which has invalid SSL certificate.

## Solution
Update environment variables in Render to use `api-sandbox.sadad.qa` OR remove `SADAD_BASE_URL` to let code auto-detect.

## Step 1: Go to Render Dashboard
1. Open: https://dashboard.render.com
2. Select your backend service: `guild-yf7q`
3. Click **Environment** tab

## Step 2: Update SADAD_BASE_URL

### Option A: Update to api-sandbox.sadad.qa (Recommended)
Change:
```
SADAD_BASE_URL=https://sandbox.sadad.qa/api-v4
```

To:
```
SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
```

### Option B: Remove SADAD_BASE_URL (Let code auto-detect)
1. Delete the `SADAD_BASE_URL` variable
2. The code will auto-detect sandbox mode and use `api-sandbox.sadad.qa`

## Step 3: Update SADAD_CHECKOUT_URL (if exists)

Change:
```
SADAD_CHECKOUT_URL=https://sandbox.sadad.qa/api-v4/payment
```

To:
```
SADAD_CHECKOUT_URL=https://api-sandbox.sadad.qa/api-v4/payment
```

OR remove it to let code auto-detect.

## Complete Environment Variables (Recommended)
```
SADAD_MID=2334863
SADAD_SECRET_KEY=+efrWl1GCKwPzJaR
SADAD_BASE_URL=https://api-sandbox.sadad.qa/api-v4
SADAD_CHECKOUT_URL=https://api-sandbox.sadad.qa/api-v4/payment
SADAD_WEBSITE_URL=https://guild-yf7q.onrender.com
```

## Step 4: Save and Wait
1. Click **Save Changes**
2. Render will automatically redeploy (2-3 minutes)
3. Wait for deployment to complete

## Verify Deployment
After deployment, check Render logs for:
```
✅ Using SADAD_BASE_URL from environment: https://api-sandbox.sadad.qa/api-v4
```

OR (if removed):
```
✅ Using Sadad SANDBOX API base URL: https://api-sandbox.sadad.qa/api-v4
```

## SSL Certificate Workaround
The code has also been updated to **disable SSL verification for sandbox mode** as a workaround. This is not ideal but needed for testing with invalid certificates.

**Note:** This workaround is only for sandbox/test mode. Production will use proper SSL verification.

---

**Important:** Update the environment variables in Render to use `api-sandbox.sadad.qa` instead of `sandbox.sadad.qa`.


